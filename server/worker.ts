import { z } from "zod";
import { idSchema, entrySchema, evidenceSchema } from "../shared/contracts";
import { owner, csrf, connectorIdentity, deploymentIdentity } from "./auth";
import { type Env, HttpError, requireValue, now } from "./env";
import {
  listEntries,
  saveEntry,
  importEntry,
  approve,
  audit,
} from "./editorial";
import { dispatch, complete, reconcile } from "./publication";
import { exportBackup } from "./backup";
import { cleanup, credential, enqueue, claim, resolve } from "./queries";
const saveSchema = z
  .object({ entry: entrySchema, base: idSchema.nullable() })
  .strict();
async function body(request: Request): Promise<unknown> {
  requireValue(
    Number(request.headers.get("content-length") || 0) <= 512000,
    413,
    "Solicitud demasiado grande",
  );
  const reader = request.body?.getReader();
  requireValue(reader, 400, "Falta JSON");
  let size = 0;
  const chunks = [];
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 512000) {
      await reader.cancel();
      throw new HttpError(413, "Solicitud demasiado grande");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, "JSON inválido");
  }
}
function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}
function privateResponse(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store, private");
  headers.set("Pragma", "no-cache");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'; object-src 'none'",
  );
  return new Response(response.body, { status: response.status, headers });
}
export async function handle(
  request: Request,
  env: Env,
  authenticate: typeof owner = owner,
): Promise<Response> {
  const url = new URL(request.url),
    path = url.pathname,
    method = request.method;
  if (path.startsWith("/api/connector/")) {
    const identity = await connectorIdentity(request, env);
    if (path === "/api/connector/poll" && method === "POST")
      return json({ job: await claim(env.DB, identity.id) });
    const match = path.match(/^\/api\/connector\/results\/([\w-]+)$/);
    if (match && method === "POST")
      return json(
        await resolve(
          env.DB,
          identity.id,
          idSchema.parse(match[1]),
          await body(request),
        ),
      );
    throw new HttpError(404, "Ruta no encontrada");
  }
  if (path.startsWith("/api/deploy/")) {
    await deploymentIdentity(request, env);
    const match = path.match(/^\/api\/deploy\/([\w-]+)\/(snapshot|result)$/);
    requireValue(match, 404, "Ruta no encontrada");
    const id = idSchema.parse(match[1]);
    if (match[2] === "snapshot" && method === "GET") {
      const attempt = idSchema.parse(url.searchParams.get("attempt"));
      const row = await env.DB.prepare(
        "SELECT snapshot FROM releases WHERE id=? AND attempt_id=? AND state='deploying'",
      )
        .bind(id, attempt)
        .first<{ snapshot: string }>();
      requireValue(row, 409, "Versión no disponible para este intento");
      return json(JSON.parse(row.snapshot));
    }
    if (match[2] === "result" && method === "POST") {
      const data = z
        .object({ attempt: idSchema, state: z.enum(["published", "failed"]) })
        .strict()
        .parse(await body(request));
      return json(await complete(env, id, data.attempt, data.state));
    }
    throw new HttpError(405, "Método no permitido");
  }
  const actor = await authenticate(request, env);
  csrf(request, env);
  if (!path.startsWith("/api/")) {
    requireValue(
      method === "GET" || method === "HEAD",
      405,
      "Método no permitido",
    );
    return env.ASSETS.fetch(request);
  }
  if (path === "/api/state" && method === "GET") {
    await cleanup(env.DB);
    const connectors = await env.DB.prepare(
      "SELECT id,resources,revoked,last_seen FROM credentials",
    ).all<{
      id: string;
      resources: string;
      revoked: number;
      last_seen: number | null;
    }>();
    const releases = await env.DB.prepare(
      "SELECT id,state,attempt_id,created_at,deployed_at FROM releases ORDER BY created_at DESC LIMIT 100",
    ).all();
    const jobs = await env.DB.prepare(
      "SELECT id,credential_id,state,query,lease_until,expires_at,result,result_ok,result_expires FROM requests WHERE (result_expires>? OR (result_expires IS NULL AND expires_at>?))",
    )
      .bind(now(), now())
      .all();
    return json({
      entries: await listEntries(env.DB),
      releases: releases.results,
      connectors: connectors.results.map((c) => ({
        ...c,
        resources: JSON.parse(c.resources),
        online: !c.revoked && c.last_seen !== null && now() - c.last_seen < 30,
      })),
      jobs: jobs.results,
    });
  }
  if (path === "/api/entries" && method === "POST") {
    const data = saveSchema.parse(await body(request));
    return json(await saveEntry(env.DB, actor, data.entry, data.base), 201);
  }
  const history = path.match(/^\/api\/entries\/([\w-]+)\/revisions$/);
  if (history && method === "GET") {
    const result = await env.DB.prepare(
      "SELECT id,parent_id,content,created_at FROM revisions WHERE entry_id=? ORDER BY created_at DESC,rowid DESC LIMIT 100",
    )
      .bind(idSchema.parse(history[1]))
      .all();
    return json(
      result.results.map((r) => ({
        ...r,
        content: JSON.parse(String(r.content)),
      })),
    );
  }
  if (path === "/api/imports" && method === "POST")
    return json(await importEntry(env.DB, actor, await body(request)));
  if (path === "/api/releases" && method === "POST") {
    const data = z
      .object({ heads: z.array(idSchema).min(1).max(20) })
      .strict()
      .parse(await body(request));
    return json(
      await approve(env.DB, actor, data.heads, env.SOURCE_REVISION),
      201,
    );
  }
  const publish = path.match(/^\/api\/releases\/([\w-]+)\/publish$/);
  if (publish && method === "POST")
    return json(await dispatch(env, actor, idSchema.parse(publish[1])));
  const republish = path.match(/^\/api\/releases\/([\w-]+)\/republish$/);
  if (republish && method === "POST")
    return json(
      await dispatch(env, actor, idSchema.parse(republish[1]), fetch, true),
    );
  const reconcileMatch = path.match(/^\/api\/releases\/([\w-]+)\/reconcile$/);
  if (reconcileMatch && method === "POST") {
    const data = z
      .object({ attempt: idSchema, runId: z.number().int().positive() })
      .strict()
      .parse(await body(request));
    return json(
      await reconcile(
        env,
        actor,
        idSchema.parse(reconcileMatch[1]),
        data.attempt,
        data.runId,
      ),
    );
  }
  if (path === "/api/backup" && method === "GET")
    return json(await exportBackup(env.DB));
  const snapshot = path.match(/^\/api\/releases\/([\w-]+)$/);
  if (snapshot && method === "GET") {
    const row = await env.DB.prepare("SELECT snapshot FROM releases WHERE id=?")
      .bind(idSchema.parse(snapshot[1]))
      .first<{ snapshot: string }>();
    requireValue(row, 404, "Versión no encontrada");
    return json(JSON.parse(row.snapshot));
  }
  if (path === "/api/credentials" && method === "POST") {
    const data = z
      .object({ resources: z.array(idSchema).min(1).max(20) })
      .strict()
      .parse(await body(request));
    return json(
      await credential(env.DB, actor, [...new Set(data.resources)]),
      201,
    );
  }
  const revoke = path.match(/^\/api\/credentials\/([\w-]+)\/revoke$/);
  if (revoke && method === "POST") {
    const id = idSchema.parse(revoke[1]);
    await env.DB.batch([
      env.DB.prepare("UPDATE credentials SET revoked=1 WHERE id=?").bind(id),
      env.DB.prepare("DELETE FROM requests WHERE credential_id=?").bind(id),
      audit(env.DB, actor, "credential-revoke", id),
    ]);
    return json({ ok: true });
  }
  if (path === "/api/queries" && method === "POST") {
    const data = z
      .object({ credentialId: idSchema, query: z.unknown() })
      .strict()
      .parse(await body(request));
    return json(await enqueue(env.DB, data.credentialId, data.query), 201);
  }
  const saveEvidence = path.match(/^\/api\/queries\/([\w-]+)\/evidence$/);
  if (saveEvidence && method === "POST") {
    const data = z
      .object({ entryId: idSchema, base: idSchema, evidence: evidenceSchema })
      .strict()
      .parse(await body(request));
    const job = await env.DB.prepare(
      "SELECT id FROM requests WHERE id=? AND result_expires>? AND result_ok=1 AND result IS NOT NULL",
    )
      .bind(idSchema.parse(saveEvidence[1]), now())
      .first();
    requireValue(job, 410, "Resultado vencido");
    const revision = await env.DB.prepare(
      "SELECT content FROM revisions WHERE id=? AND entry_id=?",
    )
      .bind(data.base, data.entryId)
      .first<{ content: string }>();
    requireValue(revision, 404, "Revisión no encontrada");
    const entry = entrySchema.parse(JSON.parse(revision.content));
    return json(
      await saveEntry(
        env.DB,
        actor,
        { ...entry, evidence: [...entry.evidence, data.evidence] },
        data.base,
      ),
    );
  }
  if (path === "/api/audit" && method === "GET")
    return json(
      (
        await env.DB.prepare(
          "SELECT * FROM audit ORDER BY created_at DESC LIMIT 100",
        ).all()
      ).results,
    );
  throw new HttpError(404, "Ruta no encontrada");
}
export default {
  async fetch(request: Request, env: Env) {
    try {
      return privateResponse(await handle(request, env));
    } catch (error) {
      const status =
        error instanceof HttpError
          ? error.status
          : error instanceof z.ZodError
            ? 400
            : 500;
      return privateResponse(
        json(
          {
            error:
              error instanceof HttpError
                ? error.message
                : error instanceof z.ZodError
                  ? "Datos inválidos; revisa los campos y referencias"
                  : "No se pudo completar la operación",
          },
          status,
        ),
      );
    }
  },
  async scheduled(_event: ScheduledController, env: Env) {
    await cleanup(env.DB);
  },
};

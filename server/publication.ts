import { type Env, now, uid, requireValue, HttpError } from "./env";
import { audit } from "./editorial";
export async function dispatch(
  env: Env,
  actor: string,
  id: string,
  send: typeof fetch = fetch,
  republish = false,
) {
  requireValue(
    env.GITHUB_TOKEN && /^[\w.-]+\/[\w.-]+$/.test(env.GITHUB_REPOSITORY),
    503,
    "Configura GitHub Actions",
  );
  const existing = await env.DB.prepare(
    "SELECT state,attempt_id,source_revision FROM releases WHERE id=?",
  )
    .bind(id)
    .first<{ state: string; attempt_id: string; source_revision: string }>();
  requireValue(existing, 404, "Versión no encontrada");
  if (existing.state === "deploying")
    return { id, state: "deploying", attemptId: existing.attempt_id };
  if (existing.state === "published" && !republish)
    return { id, state: "published", attemptId: existing.attempt_id };
  const attempt = uid();
  try {
    const result = await env.DB.batch([
      env.DB.prepare(
        "UPDATE releases SET state='deploying',attempt_id=? WHERE id=? AND state!='deploying'",
      ).bind(attempt, id),
      env.DB.prepare(
        "INSERT INTO deployments SELECT ?,id,'deploying',?,NULL FROM releases WHERE id=? AND attempt_id=?",
      ).bind(attempt, now(), id, attempt),
      env.DB.prepare(
        "INSERT INTO audit SELECT ?,?,?,id,? FROM releases WHERE id=? AND attempt_id=?",
      ).bind(uid(), actor, "deploy", now(), id, attempt),
    ]);
    if (!result[0]?.meta.changes) {
      const current = await env.DB.prepare(
        "SELECT attempt_id FROM releases WHERE id=?",
      )
        .bind(id)
        .first<{ attempt_id: string }>();
      return { id, state: "deploying", attemptId: current!.attempt_id };
    }
  } catch {
    throw new HttpError(409, "Ya hay un despliegue en curso");
  }
  try {
    const response = await send(
      `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/workflows/publish.yml/dispatches`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GITHUB_TOKEN}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "User-Agent": "and-mad-editorial",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          ref: env.GITHUB_REF || "main",
          inputs: {
            release_id: id,
            attempt_id: attempt,
            source_sha: existing.source_revision,
          },
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) {
      await complete(env, id, attempt, "failed");
      throw new HttpError(502, "GitHub rechazó el despliegue");
    }
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(
      502,
      "Resultado de envío incierto. Comprueba Actions antes de reconciliar el intento",
    );
  }
  return { id, state: "deploying", attemptId: attempt };
}
export async function complete(
  env: Env,
  id: string,
  attempt: string,
  state: "published" | "failed",
) {
  const result = await env.DB.batch([
    env.DB.prepare(
      "UPDATE releases SET state=?,deployed_at=CASE WHEN ?='published' THEN ? ELSE deployed_at END WHERE id=? AND attempt_id=? AND state='deploying'",
    ).bind(state, state, now(), id, attempt),
    env.DB.prepare(
      "UPDATE deployments SET state=?,finished_at=? WHERE id=? AND release_id=? AND state='deploying' AND EXISTS(SELECT 1 FROM releases WHERE id=? AND attempt_id=? AND state=?)",
    ).bind(state, now(), attempt, id, id, attempt, state),
  ]);
  if (!result[0]?.meta.changes) {
    const r = await env.DB.prepare(
      "SELECT state FROM releases WHERE id=? AND attempt_id=?",
    )
      .bind(id, attempt)
      .first<{ state: string }>();
    requireValue(r?.state === state, 409, "Intento vencido o incompatible");
  }
  return { id, state };
}
export async function reconcile(
  env: Env,
  actor: string,
  id: string,
  attempt: string,
  runId: number,
  send: typeof fetch = fetch,
) {
  const headers = {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "and-mad-editorial",
  };
  const response = await send(
    `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/runs/${runId}`,
    { headers, signal: AbortSignal.timeout(10000) },
  );
  requireValue(response.ok, 502, "No se pudo verificar Actions");
  const run = (await response.json()) as {
    display_title?: string;
    status?: string;
    conclusion?: string;
  };
  requireValue(
    run.display_title === `release:${id}:${attempt}` &&
      run.status === "completed",
    409,
    "El intento sigue activo o no corresponde a esta versión",
  );
  const jobsResponse = await send(
    `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/runs/${runId}/jobs`,
    { headers, signal: AbortSignal.timeout(10000) },
  );
  requireValue(
    jobsResponse.ok,
    502,
    "No se pudo comprobar el paso de despliegue",
  );
  const jobs = (await jobsResponse.json()) as {
    jobs: { steps: { name: string; conclusion: string | null }[] }[];
  };
  const deploy = jobs.jobs
    .flatMap((j) => j.steps)
    .find((s) => s.name === "Deploy public Worker atomically");
  requireValue(
    deploy &&
      ["success", "failure", "skipped"].includes(deploy.conclusion || ""),
    409,
    "Resultado de despliegue incierto; verifica Cloudflare",
  );
  const result = await complete(
    env,
    id,
    attempt,
    deploy.conclusion === "success" ? "published" : "failed",
  );
  await audit(env.DB, actor, "reconcile", id).run();
  return result;
}

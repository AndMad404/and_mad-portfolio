import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { generateKeyPair, SignJWT, exportJWK, createLocalJWKSet } from "jose";
import { entrySchema, fingerprint, type Entry } from "../shared/contracts";
import {
  saveEntry,
  importEntry,
  approve,
  listEntries,
} from "../server/editorial";
import {
  credential,
  enqueue,
  claim,
  resolve,
  cleanup,
} from "../server/queries";
import { dispatch, complete } from "../server/publication";
import { owner, csrf, connectorIdentity } from "../server/auth";
import worker from "../server/worker";
import { now, type Env } from "../server/env";
import { exportBackup, restoreStatements } from "../server/backup";
let mf: Miniflare, db: D1Database;
const entry = (id: string): Entry => ({
  id,
  slug: id,
  kind: "case",
  title: "Caso revisado",
  summary: "Resumen",
  problem: "Problema",
  contribution: "Participación",
  decisions: ["Decisión"],
  results: "Resultado",
  limits: "Límites",
  tags: ["QA"],
  evidence: [],
});
const env = (): Env => ({
  DB: db,
  ASSETS: {
    fetch: async () => new Response("PRIVATE_ASSET"),
  } as unknown as Fetcher,
  ACCESS_TEAM: "example",
  ACCESS_AUDIENCE: "test-audience",
  OWNER_EMAIL: "owner@example.com",
  PANEL_ORIGIN: "https://panel.example.com",
  GITHUB_REPOSITORY: "AndMad404/and_mad-portfolio",
  GITHUB_REF: "main",
  SOURCE_REVISION: "a".repeat(40),
  GITHUB_TOKEN: "test-only",
  DEPLOY_TOKEN: "test-only-deploy-credential-32-characters",
});
before(async () => {
  mf = new Miniflare({
    modules: true,
    script: 'export default {fetch(){return new Response("ok")}}',
    d1Databases: ["DB"],
    compatibilityDate: "2026-07-30",
  });
  db = (await mf.getD1Database("DB")) as unknown as D1Database;
  await db.exec(await readFile("migrations/0001_editorial.sql", "utf8"));
});
after(async () => {
  await mf?.dispose();
});
test("revisiones atómicas, conflicto concurrente, FK y revisiones inmutables", async () => {
  const first = await saveEntry(db, "owner", entry("revision-test"), null);
  const second = await saveEntry(
    db,
    "owner",
    { ...first.content, title: "Cambio 1" },
    first.head,
  );
  await assert.rejects(
    saveEntry(db, "owner", { ...first.content, title: "Cambio 2" }, first.head),
    /revisión cambió/,
  );
  assert.equal(
    (await listEntries(db)).find((e) => e.id === first.id)?.head,
    second.head,
  );
  await assert.rejects(
    db
      .prepare("UPDATE revisions SET content=? WHERE id=?")
      .bind("{}", first.head)
      .run(),
    /immutable/,
  );
  await assert.rejects(
    db.prepare("DELETE FROM revisions WHERE id=?").bind(first.head).run(),
    /immutable/,
  );
  await assert.rejects(
    db
      .prepare("INSERT INTO evidence VALUES(?,?,?,?,?)")
      .bind(second.head, "bad", "label", null, "unknown-media")
      .run(),
    /FOREIGN KEY/,
  );
  const other = await saveEntry(db, "owner", entry("other-entry"), null);
  await assert.rejects(
    db
      .prepare("UPDATE entries SET head=? WHERE id=?")
      .bind(other.head, first.id)
      .run(),
    /foreign revision/,
  );
});
test("evidencia duplicada revierte toda la edición", async () => {
  const first = await saveEntry(db, "owner", entry("atomic-test"), null);
  await assert.rejects(
    saveEntry(
      db,
      "owner",
      {
        ...first.content,
        evidence: [
          { id: "x", label: "a" },
          { id: "x", label: "b" },
        ],
      },
      first.head,
    ),
  );
  const rows = await db
    .prepare("SELECT count(*) n FROM revisions WHERE entry_id=?")
    .bind(first.id)
    .first<{ n: number }>();
  assert.equal(rows?.n, 1);
});
test("importación validada, huella verificable, repetición y no sobrescritura", async () => {
  const content = entry("import-test");
  const packet = {
    version: 1,
    entry: content,
    source: {
      system: "prometheus",
      resourceId: "approved-cv",
      label: "Evidencia revisada",
      fingerprint: await fingerprint(content),
    },
  };
  assert.equal((await importEntry(db, "owner", packet)).duplicate, false);
  assert.equal((await importEntry(db, "owner", packet)).duplicate, true);
  await assert.rejects(
    importEntry(db, "owner", {
      ...packet,
      entry: { ...content, title: "Changed" },
    }),
    /Huella/,
  );
  const modified = { ...content, title: "Nueva revisión" };
  await assert.rejects(
    importEntry(db, "owner", {
      ...packet,
      entry: modified,
      source: { ...packet.source, fingerprint: await fingerprint(modified) },
    }),
    /existe/,
  );
});
test("validación rechaza rutas privadas, claves desconocidas y enlaces ejecutables", () => {
  for (const invalid of [
    { ...entry("bad"), summary: "C:\\Users\\owner\\private.txt" },
    { ...entry("bad"), secret: "x" },
    {
      ...entry("bad"),
      evidence: [{ id: "x", label: "x", url: "javascript:alert(1)" }],
    },
  ])
    assert.equal(entrySchema.safeParse(invalid).success, false);
  assert.equal(
    entrySchema.safeParse({
      ...entry("safe"),
      title: "<script>alert(1)</script>",
    }).success,
    true,
  );
});
test("Access rechaza anonimato, audiencias e identidades incorrectas; CSRF", async () => {
  const e = env();
  const response = await worker.fetch(new Request(e.PANEL_ORIGIN + "/"), e);
  assert.equal(response.status, 401);
  assert.match(response.headers.get("cache-control") || "", /no-store/);
  assert.doesNotMatch(await response.text(), /PRIVATE_ASSET/);
  const { privateKey, publicKey } = await generateKeyPair("RS256");
  const jwk = await exportJWK(publicKey);
  const key = createLocalJWKSet({
    keys: [{ ...jwk, kid: "test", alg: "RS256" }],
  });
  const token = async (email: string, aud: string) =>
    new SignJWT({ email })
      .setProtectedHeader({ alg: "RS256", kid: "test" })
      .setSubject("owner-sub")
      .setIssuer("https://example.cloudflareaccess.com")
      .setAudience(aud)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);
  const request = (jwt: string) =>
    new Request(e.PANEL_ORIGIN, {
      headers: { "Cf-Access-Jwt-Assertion": jwt },
    });
  assert.equal(
    await owner(request(await token(e.OWNER_EMAIL, e.ACCESS_AUDIENCE)), e, key),
    "owner-sub",
  );
  await assert.rejects(
    owner(
      request(await token("stranger@example.com", e.ACCESS_AUDIENCE)),
      e,
      key,
    ),
    /Acceso/,
  );
  await assert.rejects(
    owner(request(await token(e.OWNER_EMAIL, "other")), e, key),
    /Acceso/,
  );
  assert.throws(
    () =>
      csrf(
        new Request(e.PANEL_ORIGIN, {
          method: "POST",
          headers: {
            origin: "https://evil.example",
            "Content-Type": "application/json",
          },
        }),
        e,
      ),
    /Origen/,
  );
});
test("credencial, recurso permitido, claim exclusivo, resultado tardío y revocación", async () => {
  const c = await credential(db, "owner", ["allowed"]);
  await assert.rejects(
    enqueue(db, c.id, { operation: "read", resourceId: "not-allowed" }),
    /autorizado/,
  );
  await enqueue(db, c.id, { operation: "read", resourceId: "allowed" });
  const jobs = await Promise.all([claim(db, c.id), claim(db, c.id)]);
  assert.equal(jobs.filter(Boolean).length, 1);
  const j = jobs.find(Boolean)!;
  await assert.rejects(
    resolve(db, c.id, j.id, { lease: "wrong", text: "private", ok: true }),
    /tardío/,
  );
  await db
    .prepare("UPDATE requests SET lease_until=? WHERE id=?")
    .bind(now() - 1, j.id)
    .run();
  await assert.rejects(
    resolve(db, c.id, j.id, { lease: j.lease, text: "private", ok: true }),
    /tardío/,
  );
  await db
    .prepare("UPDATE credentials SET revoked=1 WHERE id=?")
    .bind(c.id)
    .run();
  await assert.rejects(
    connectorIdentity(
      new Request("https://test", {
        headers: { Authorization: `Bearer ${c.token}` },
      }),
      env(),
    ),
    /revocada/,
  );
});
test("los resultados desaparecen al caducar y no se convierten solos en evidencia", async () => {
  const c = await credential(db, "owner", ["allowed"]);
  await enqueue(db, c.id, { operation: "read", resourceId: "allowed" });
  const job = (await claim(db, c.id))!;
  await resolve(db, c.id, job.id, {
    lease: job.lease,
    text: "PRIVATE_QUERY_SENTINEL",
    ok: true,
  });
  const row = await db
    .prepare("SELECT result_expires FROM requests WHERE id=?")
    .bind(job.id)
    .first<{ result_expires: number }>();
  assert.ok(row && row.result_expires <= now() + 900);
  assert.equal(
    (
      await db
        .prepare("SELECT count(*) n FROM evidence WHERE label=?")
        .bind("PRIVATE_QUERY_SENTINEL")
        .first<{ n: number }>()
    )?.n,
    0,
  );
  await db
    .prepare("UPDATE requests SET result_expires=? WHERE id=?")
    .bind(now() - 1, job.id)
    .run();
  await cleanup(db);
  assert.equal(
    await db.prepare("SELECT * FROM requests WHERE id=?").bind(job.id).first(),
    null,
  );
});
test("publicación congelada, idempotencia, fallo y recuperación de versión anterior", async () => {
  const first = await saveEntry(db, "owner", entry("release-test"), null);
  const release = await approve(
    db,
    "owner",
    [first.head],
    env().SOURCE_REVISION,
  );
  await saveEntry(
    db,
    "owner",
    { ...first.content, title: "PRIVATE_DRAFT_SENTINEL" },
    first.head,
  );
  assert.doesNotMatch(
    JSON.stringify(release.snapshot),
    /PRIVATE_DRAFT_SENTINEL|PRIVATE_QUERY_SENTINEL/,
  );
  await assert.rejects(
    db
      .prepare("UPDATE releases SET snapshot=? WHERE id=?")
      .bind("{}", release.id)
      .run(),
    /immutable/,
  );
  let sends = 0;
  const send: typeof fetch = async () => {
    sends++;
    return new Response(null, { status: 204 });
  };
  const start = await dispatch(env(), "owner", release.id, send);
  const repeat = await dispatch(env(), "owner", release.id, send);
  assert.equal(start.attemptId, repeat.attemptId);
  assert.equal(sends, 1);
  await complete(env(), release.id, start.attemptId, "published");
  assert.equal(
    (await dispatch(env(), "owner", release.id, send)).state,
    "published",
  );
  assert.equal(sends, 1);
  const second = await approve(
    db,
    "owner",
    [first.head],
    env().SOURCE_REVISION,
  );
  await assert.rejects(
    dispatch(
      env(),
      "owner",
      second.id,
      async () => new Response(null, { status: 500 }),
    ),
    /GitHub/,
  );
  assert.equal(
    (
      await db
        .prepare("SELECT state FROM releases WHERE id=?")
        .bind(release.id)
        .first<{ state: string }>()
    )?.state,
    "published",
  );
  const restored = await dispatch(env(), "owner", release.id, send, true);
  await assert.rejects(
    complete(env(), release.id, start.attemptId, "failed"),
    /vencido/,
  );
  await complete(env(), release.id, restored.attemptId, "published");
  await complete(env(), release.id, restored.attemptId, "published");
});
test("dos solicitudes simultáneas crean un solo intento de despliegue", async () => {
  const e = await saveEntry(db, "owner", entry("race-publish"), null);
  const release = await approve(db, "owner", [e.head], env().SOURCE_REVISION);
  let sends = 0;
  const send: typeof fetch = async () => {
    sends++;
    return new Response(null, { status: 204 });
  };
  const results = await Promise.all([
    dispatch(env(), "owner", release.id, send),
    dispatch(env(), "owner", release.id, send),
  ]);
  assert.equal(sends, 1);
  assert.equal(results[0]!.attemptId, results[1]!.attemptId);
  await complete(env(), release.id, results[0]!.attemptId, "failed");
});
test("respaldo se restaura en una D1 nueva y excluye consultas y credenciales", async () => {
  const backup = await exportBackup(db);
  assert.equal("requests" in backup.tables, false);
  assert.equal("credentials" in backup.tables, false);
  const other = new Miniflare({
    modules: true,
    script: 'export default {fetch(){return new Response("ok")}}',
    d1Databases: ["DB"],
    compatibilityDate: "2026-07-30",
  });
  try {
    const restored = (await other.getD1Database("DB")) as unknown as D1Database;
    await restored.exec(
      await readFile("migrations/0001_editorial.sql", "utf8"),
    );
    await restored.batch(restoreStatements(restored, backup));
    assert.deepEqual(await listEntries(restored), await listEntries(db));
    assert.equal(
      (await restored.prepare("PRAGMA foreign_key_check").all()).results.length,
      0,
    );
    assert.equal(
      (
        await restored
          .prepare("SELECT count(*) n FROM credentials")
          .first<{ n: number }>()
      )?.n,
      0,
    );
    await assert.rejects(
      restored.batch(restoreStatements(restored, backup)),
      /UNIQUE/,
    );
  } finally {
    await other.dispose();
  }
});

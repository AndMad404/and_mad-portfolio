import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { Miniflare } from "miniflare";
import { handle } from "../server/worker";
import { HttpError, type Env } from "../server/env";
// Loopback-only harness; never imported by either production Worker.
await mkdir(".wrangler/studio-dev", { recursive: true });
const mf = new Miniflare({
  modules: true,
  script: 'export default {fetch(){return new Response("local")}}',
  d1Databases: ["DB"],
  d1Persist: ".wrangler/studio-dev",
  compatibilityDate: "2026-07-30",
});
const db = (await mf.getD1Database("DB")) as unknown as D1Database;
const exists = await db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='entries'",
  )
  .first();
if (!exists)
  await db.exec(await readFile("migrations/0001_editorial.sql", "utf8"));
const env: Env = {
  DB: db,
  ASSETS: {
    fetch: async () => new Response(null, { status: 404 }),
  } as unknown as Fetcher,
  PANEL_ORIGIN: "http://127.0.0.1:5174",
  ACCESS_TEAM: "",
  ACCESS_AUDIENCE: "",
  OWNER_EMAIL: "",
  GITHUB_REPOSITORY: "AndMad404/and_mad-portfolio",
  GITHUB_REF: "main",
  SOURCE_REVISION: "0".repeat(40),
  GITHUB_TOKEN: "",
  DEPLOY_TOKEN: "",
};
const server = createServer(async (req, res) => {
  try {
    if (
      !["127.0.0.1:8787", "127.0.0.1:5174"].includes(req.headers.host || "")
    ) {
      res.writeHead(403).end();
      return;
    }
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 512000) {
        res.writeHead(413).end();
        return;
      }
      chunks.push(chunk);
    }
    const request = new Request(new URL(req.url || "/", env.PANEL_ORIGIN), {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body: ["GET", "HEAD"].includes(req.method || "GET")
        ? undefined
        : Buffer.concat(chunks),
    });
    const response = await handle(
      request,
      env,
      async () => "local-development",
    );
    res.writeHead(response.status, {
      ...Object.fromEntries(response.headers),
      "Cache-Control": "no-store",
      "X-Local-Development": "true",
    });
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (e) {
    res.writeHead(e instanceof HttpError ? e.status : 400, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(
      JSON.stringify({
        error: e instanceof HttpError ? e.message : "Operación local inválida",
      }),
    );
  }
});
server.listen(8787, "127.0.0.1", () =>
  console.info(
    "API local de desarrollo: http://127.0.0.1:8787 · D1 local · despliegue deshabilitado",
  ),
);
async function stop() {
  server.close();
  await mf.dispose();
  process.exit(0);
}
process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());

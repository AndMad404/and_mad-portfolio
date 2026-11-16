import { readFile } from "node:fs/promises";
import { setTimeout as delay } from "node:timers/promises";
import { z } from "zod";
import { configSchema, readResource } from "./reader";
import { idSchema, querySchema } from "../shared/contracts";
const config = configSchema.parse(
  JSON.parse(
    await readFile(process.argv[2] || "connector/config.local.json", "utf8"),
  ),
);
const token = process.env.CONNECTOR_TOKEN;
if (!token || token.length < 32)
  throw new Error(
    "Configura CONNECTOR_TOKEN con la credencial emitida por el panel",
  );
const jobSchema = z.object({
  job: z
    .object({
      id: idSchema,
      query: querySchema,
      lease: idSchema,
      lease_until: z.number().int(),
    })
    .nullable(),
});
const abort = new AbortController();
process.on("SIGINT", () => abort.abort());
process.on("SIGTERM", () => abort.abort());
async function send(route: string, data?: unknown) {
  const response = await fetch(new URL(route, config.endpoint), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(process.env.CF_ACCESS_CLIENT_ID && process.env.CF_ACCESS_CLIENT_SECRET
        ? {
            "CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID,
            "CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET,
          }
        : {}),
    },
    body: JSON.stringify(data || {}),
    redirect: "error",
    signal: AbortSignal.any([abort.signal, AbortSignal.timeout(5000)]),
  });
  if (response.status === 401 || response.status === 403) {
    abort.abort();
    throw new Error("Credencial rechazada o revocada");
  }
  if (!response.ok) throw new Error("Solicitud rechazada");
  return response.json();
}
console.info("Conector activo. Lecturas permitidas; Ctrl+C para desconectar.");
while (!abort.signal.aborted) {
  const started = Date.now();
  try {
    const { job } = jobSchema.parse(await send("/api/connector/poll"));
    if (job) {
      const remaining = job.lease_until * 1000 - Date.now() - 5500;
      if (remaining > 100) {
        const result = await readResource(config, job.query, remaining);
        await send(`/api/connector/results/${job.id}`, {
          ...result,
          lease: job.lease,
        });
      }
    }
  } catch {
    console.info(
      abort.signal.aborted
        ? "Conector detenido."
        : "Conexión no disponible; se reintentará.",
    );
  }
  if (!abort.signal.aborted)
    await delay(Math.max(0, 10000 - (Date.now() - started)), undefined, {
      signal: abort.signal,
    }).catch(() => {});
}

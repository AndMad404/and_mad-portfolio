import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import { querySchema, type Query } from "../shared/contracts";
const exec = promisify(execFile);
const relativeFile = z
  .string()
  .min(1)
  .refine(
    (v) =>
      !path.isAbsolute(v) &&
      !v.split(/[\\/]/).includes("..") &&
      !/[\r\n\0]/.test(v),
    "Ruta local relativa requerida",
  );
export const configSchema = z
  .object({
    endpoint: z
      .string()
      .url()
      .refine((v) => {
        const u = new URL(v);
        return (
          u.protocol === "https:" &&
          u.pathname === "/" &&
          !u.username &&
          !u.password &&
          !u.search &&
          !u.hash
        );
      }),
    prometheusRoot: z.string().min(1),
    resources: z.record(z.string().regex(/^[\w-]{1,80}$/), relativeFile),
  })
  .strict();
export type Config = z.infer<typeof configSchema>;
function within(root: string, target: string) {
  const relative = path.relative(root, target);
  return (
    relative !== "" &&
    !relative.startsWith(".." + path.sep) &&
    relative !== ".." &&
    !path.isAbsolute(relative)
  );
}
export async function resolveResource(config: Config, resourceId: string) {
  const selected = config.resources[resourceId];
  if (!selected) throw new Error("RESOURCE_DENIED");
  const root = await realpath(config.prometheusRoot);
  const file = await realpath(path.resolve(root, selected));
  if (!within(root, file) || (await stat(file)).isDirectory())
    throw new Error("RESOURCE_DENIED");
  // Reader's contract uses POSIX project-relative paths even on Windows.
  return { root, file: path.relative(root, file).split(path.sep).join("/") };
}
export async function readResource(
  config: Config,
  input: unknown,
  remainingMs = 15000,
): Promise<{ text: string; ok: boolean }> {
  const query: Query = querySchema.parse(input);
  try {
    const { root, file } = await resolveResource(config, query.resourceId);
    const reader = await realpath(path.join(root, "core", "reader.mjs"));
    if (!within(root, reader)) throw new Error("READER_DENIED");
    const budget = Math.min(15000, remainingMs);
    if (budget < 100) throw new Error("EXPIRED");
    const args = [
      reader,
      "--root",
      root,
      "--max-bytes",
      "16384",
      "--timeout-ms",
      String(Math.max(1, budget - 100)),
    ];
    if (query.operation === "read") args.push("--file", file);
    else
      args.push(
        "--search",
        query.literal,
        "--path",
        file,
        "--max-files",
        "1",
        "--max-results",
        "20",
        "--max-entries",
        "200",
      );
    const env: NodeJS.ProcessEnv = {};
    for (const key of ["SystemRoot", "WINDIR", "PATH", "TEMP", "TMP", "HOME"])
      if (process.env[key]) env[key] = process.env[key];
    const result = await exec(process.execPath, args, {
      env,
      windowsHide: true,
      timeout: budget,
      maxBuffer: 131072,
      encoding: "utf8",
      shell: false,
    });
    const parsed: unknown = JSON.parse(result.stdout);
    const cleaned = redact(parsed, root);
    const text = JSON.stringify(cleaned, null, 2);
    return { text: text.slice(0, 32768), ok: true };
  } catch {
    return {
      text: "No se pudo completar la lectura dentro del alcance y presupuesto permitidos.",
      ok: false,
    };
  }
}
function redact(value: unknown, root: string): unknown {
  if (typeof value === "string")
    return value
      .split(root)
      .join("[recurso local]")
      .split(root.replaceAll("\\", "/"))
      .join("[recurso local]");
  if (Array.isArray(value)) return value.map((v) => redact(v, root));
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !["root", "workerPid", "absolutePath"].includes(k))
        .map(([k, v]) => [k, redact(v, root)]),
    );
  return value;
}

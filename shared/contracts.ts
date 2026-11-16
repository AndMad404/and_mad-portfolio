import { z } from "zod";
export const idSchema = z.string().regex(/^[a-zA-Z0-9_-]{1,80}$/);
const text = z
  .string()
  .trim()
  .min(1)
  .max(12000)
  .refine(
    (v) =>
      !/(?:[A-Za-z]:[\\/]|file:\/\/|\/Users\/|\/home\/|-----BEGIN .*PRIVATE KEY|(?:ghp_|github_pat_)[a-zA-Z0-9_]+)/i.test(
        v,
      ),
    "No se admiten rutas privadas ni credenciales",
  );
const https = z
  .string()
  .url()
  .refine((v) => {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password;
  }, "Se requiere HTTPS sin credenciales");
export const media = [
  {
    id: "social-card",
    src: "/social-card.png",
    alt: "and_mad: desarrollo web y contenido",
  },
] as const;
export const evidenceSchema = z
  .object({
    id: idSchema,
    label: text,
    url: https.optional(),
    imageId: z.enum(["social-card"]).optional(),
  })
  .strict();
export const entrySchema = z
  .object({
    id: idSchema,
    slug: z
      .string()
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    kind: z.enum(["service", "case"]),
    title: text.refine((v) => v.length <= 200, "Título demasiado largo"),
    summary: text.refine((v) => v.length <= 500, "Resumen demasiado largo"),
    problem: text,
    contribution: text,
    decisions: z.array(text).max(20),
    results: text,
    limits: text,
    tags: z.array(z.string().max(50)).max(12),
    evidence: z.array(evidenceSchema).max(30),
  })
  .strict();
export type Entry = z.infer<typeof entrySchema>;
export const snapshotSchema = z
  .object({
    version: z.literal(1),
    releaseId: idSchema,
    entries: z.array(entrySchema).max(20),
  })
  .strict()
  .superRefine((v, c) => {
    if (new TextEncoder().encode(JSON.stringify(v)).byteLength > 512000)
      c.addIssue({
        code: "custom",
        message: "La versión supera el presupuesto de contenido",
      });
    for (const key of ["id", "path"] as const) {
      const values = v.entries.map((e) => (key === "id" ? e.id : entryPath(e)));
      if (new Set(values).size !== values.length)
        c.addIssue({ code: "custom", message: "Entradas duplicadas" });
    }
  });
export type Snapshot = z.infer<typeof snapshotSchema>;
export const importSchema = z
  .object({
    version: z.literal(1),
    source: z
      .object({
        system: z.literal("prometheus"),
        resourceId: idSchema,
        label: text,
        fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
    entry: entrySchema,
  })
  .strict();
export const querySchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("read"), resourceId: idSchema }).strict(),
  z
    .object({
      operation: z.literal("search"),
      resourceId: idSchema,
      literal: z.string().trim().min(1).max(120),
    })
    .strict(),
]);
export type Query = z.infer<typeof querySchema>;
export const resultSchema = z
  .object({ lease: idSchema, text: z.string().max(32768), ok: z.boolean() })
  .strict();
export function entryPath(e: Pick<Entry, "kind" | "slug">) {
  return `/${e.kind === "service" ? "servicios" : "proyectos"}/${e.slug}/`;
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => JSON.stringify(k) + ":" + canonical(v))
      .join(",")}}`;
  return JSON.stringify(value);
}
export async function fingerprint(value: unknown) {
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(canonical(value)),
      ),
    ),
  )
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

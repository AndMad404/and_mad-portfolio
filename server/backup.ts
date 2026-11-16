import { z } from "zod";
// Temporary requests and connector credentials are intentionally absent.
const row = z.record(z.string(), z.union([z.string(), z.number(), z.null()]));
export const tables = {
  media: ["id", "path", "alt"],
  entries: ["id", "kind", "slug", "head"],
  revisions: ["id", "entry_id", "parent_id", "content", "created_at"],
  evidence: ["revision_id", "id", "label", "url", "image_id"],
  imports: [
    "fingerprint",
    "resource_id",
    "source_label",
    "revision_id",
    "created_at",
  ],
  releases: [
    "id",
    "snapshot",
    "source_revision",
    "state",
    "attempt_id",
    "created_at",
    "deployed_at",
  ],
  release_revisions: ["release_id", "revision_id"],
  deployments: ["id", "release_id", "state", "created_at", "finished_at"],
  audit: ["id", "actor", "operation", "target", "created_at"],
} as const;
export const backupSchema = z
  .object({
    version: z.literal(1),
    createdAt: z.number(),
    tables: z.record(
      z.enum(
        Object.keys(tables) as [
          keyof typeof tables,
          ...(keyof typeof tables)[],
        ],
      ),
      z.array(row),
    ),
  })
  .strict();
export async function exportBackup(db: D1Database) {
  const names = Object.keys(tables) as (keyof typeof tables)[];
  const result = await db.batch(
    names.map((t) =>
      db.prepare(`SELECT ${tables[t].join(",")} FROM ${t} ORDER BY rowid`),
    ),
  );
  return backupSchema.parse({
    version: 1,
    createdAt: Date.now(),
    tables: Object.fromEntries(names.map((t, i) => [t, result[i]!.results])),
  });
}
export function restoreStatements(db: D1Database, input: unknown) {
  const backup = backupSchema.parse(input);
  const statements: D1PreparedStatement[] = [];
  for (const name of Object.keys(tables) as (keyof typeof tables)[]) {
    const columns = tables[name];
    for (const record of backup.tables[name]) {
      if (
        Object.keys(record).sort().join(",") !== [...columns].sort().join(",")
      )
        throw new Error("Columnas inválidas");
      const values = columns.map((c) =>
        name === "entries" && c === "head" ? null : record[c]!,
      );
      statements.push(
        db
          .prepare(
            `INSERT ${name === "media" ? "OR IGNORE " : ""}INTO ${name}(${columns.join(",")}) VALUES(${columns.map(() => "?").join(",")})`,
          )
          .bind(...values),
      );
    }
  }
  for (const entry of backup.tables.entries)
    statements.push(
      db
        .prepare("UPDATE entries SET head=? WHERE id=?")
        .bind(entry.head, entry.id),
    );
  return statements;
}

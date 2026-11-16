import { readFile, writeFile } from "node:fs/promises";
import { backupSchema, tables } from "../server/backup";
// Generates a reviewable SQL file for a NEW, migrated D1 database. Does not execute it.
const [input, output] = process.argv.slice(2);
if (!input || !output)
  throw new Error(
    "Uso: npx tsx scripts/restore-backup.ts backup.json restore.sql",
  );
const backup = backupSchema.parse(JSON.parse(await readFile(input, "utf8")));
const literal = (value: unknown) =>
  value === null
    ? "NULL"
    : typeof value === "number"
      ? String(value)
      : "'" + String(value).replaceAll("'", "''") + "'";
const lines = [
  "-- Restaurar únicamente sobre una base nueva con 0001_editorial.sql aplicada.",
  "PRAGMA defer_foreign_keys=ON;",
];
for (const name of Object.keys(tables) as (keyof typeof tables)[]) {
  const columns = tables[name];
  for (const record of backup.tables[name]) {
    if (Object.keys(record).sort().join(",") !== [...columns].sort().join(","))
      throw new Error("Columnas inválidas");
    lines.push(
      `INSERT ${name === "media" ? "OR IGNORE " : ""}INTO ${name}(${columns.join(",")}) VALUES(${columns.map((c) => literal(name === "entries" && c === "head" ? null : record[c])).join(",")});`,
    );
  }
}
for (const entry of backup.tables.entries)
  lines.push(
    `UPDATE entries SET head=${literal(entry.head)} WHERE id=${literal(entry.id)};`,
  );
lines.push("PRAGMA foreign_key_check;");
await writeFile(output, lines.join("\n"));

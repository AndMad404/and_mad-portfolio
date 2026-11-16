import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { entries, revisions } from "./schema";
import {
  entrySchema,
  importSchema,
  snapshotSchema,
  fingerprint,
  type Entry,
} from "../shared/contracts";
import { HttpError, now, uid, requireValue } from "./env";
export function audit(
  db: D1Database,
  actor: string,
  operation: string,
  target: string,
) {
  return db
    .prepare("INSERT INTO audit VALUES(?,?,?,?,?)")
    .bind(uid(), actor, operation, target, now());
}
export async function listEntries(db: D1Database) {
  const rows = await drizzle(db)
    .select({ id: entries.id, head: entries.head, content: revisions.content })
    .from(entries)
    .innerJoin(revisions, eq(entries.head, revisions.id));
  return rows.map((r) => ({
    id: r.id,
    head: r.head,
    content: entrySchema.parse(JSON.parse(r.content)),
  }));
}
function evidenceStatements(db: D1Database, revision: string, entry: Entry) {
  return entry.evidence.map((e) =>
    db
      .prepare(
        "INSERT INTO evidence SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM revisions WHERE id=?)",
      )
      .bind(
        revision,
        e.id,
        e.label,
        e.url || null,
        e.imageId || null,
        revision,
      ),
  );
}
export async function saveEntry(
  db: D1Database,
  actor: string,
  input: unknown,
  base: string | null,
) {
  const entry = entrySchema.parse(input),
    revision = uid();
  const statements: D1PreparedStatement[] = [];
  if (base === null) {
    statements.push(
      db
        .prepare("INSERT INTO entries(id,kind,slug) VALUES(?,?,?)")
        .bind(entry.id, entry.kind, entry.slug),
    );
    statements.push(
      db
        .prepare("INSERT INTO revisions VALUES(?,?,?,?,?)")
        .bind(revision, entry.id, null, JSON.stringify(entry), now()),
    );
    statements.push(
      db
        .prepare("UPDATE entries SET head=? WHERE id=?")
        .bind(revision, entry.id),
    );
  } else {
    statements.push(
      db
        .prepare(
          "INSERT INTO revisions SELECT ?,id,head,?,? FROM entries WHERE id=? AND head=? AND kind=? AND slug=?",
        )
        .bind(
          revision,
          JSON.stringify(entry),
          now(),
          entry.id,
          base,
          entry.kind,
          entry.slug,
        ),
    );
    statements.push(
      db
        .prepare(
          "UPDATE entries SET head=? WHERE id=? AND head=? AND EXISTS(SELECT 1 FROM revisions WHERE id=?)",
        )
        .bind(revision, entry.id, base, revision),
    );
  }
  statements.push(...evidenceStatements(db, revision, entry));
  statements.push(
    db
      .prepare(
        "INSERT INTO audit SELECT ?,?,?,?,? WHERE EXISTS(SELECT 1 FROM revisions WHERE id=?)",
      )
      .bind(uid(), actor, "revision", revision, now(), revision),
  );
  try {
    const result = await db.batch(statements);
    requireValue(
      result[0]?.meta.changes,
      409,
      "La revisión cambió; recarga antes de guardar",
    );
    return { id: entry.id, head: revision, content: entry };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(409, "Conflicto de identidad, ruta o evidencia");
  }
}
export async function importEntry(
  db: D1Database,
  actor: string,
  input: unknown,
) {
  const packet = importSchema.parse(input);
  requireValue(
    (await fingerprint(packet.entry)) === packet.source.fingerprint,
    400,
    "Huella de contenido incorrecta",
  );
  const old = await db
    .prepare("SELECT revision_id FROM imports WHERE fingerprint=?")
    .bind(packet.source.fingerprint)
    .first();
  if (old) return { duplicate: true, ...old };
  const revision = uid();
  const e = packet.entry;
  try {
    await db.batch([
      db
        .prepare("INSERT INTO entries(id,kind,slug) VALUES(?,?,?)")
        .bind(e.id, e.kind, e.slug),
      db
        .prepare("INSERT INTO revisions VALUES(?,?,?,?,?)")
        .bind(revision, e.id, null, JSON.stringify(e), now()),
      db.prepare("UPDATE entries SET head=? WHERE id=?").bind(revision, e.id),
      ...evidenceStatements(db, revision, e),
      db
        .prepare("INSERT INTO imports VALUES(?,?,?,?,?)")
        .bind(
          packet.source.fingerprint,
          packet.source.resourceId,
          packet.source.label,
          revision,
          now(),
        ),
      audit(db, actor, "import", revision),
    ]);
    return { duplicate: false, revision_id: revision };
  } catch {
    const repeated = await db
      .prepare("SELECT revision_id FROM imports WHERE fingerprint=?")
      .bind(packet.source.fingerprint)
      .first();
    if (repeated) return { duplicate: true, ...repeated };
    throw new HttpError(
      409,
      "La entrada o ruta existe. Importa con identidad nueva o revisa manualmente el borrador existente",
    );
  }
}
export async function approve(
  db: D1Database,
  actor: string,
  heads: string[],
  sourceRevision: string,
) {
  requireValue(
    /^[a-f0-9]{40}$/.test(sourceRevision || ""),
    503,
    "Configura SOURCE_REVISION con el commit verificado del sitio",
  );
  requireValue(
    heads.length > 0 &&
      heads.length <= 20 &&
      new Set(heads).size === heads.length,
    400,
    "Selecciona revisiones únicas",
  );
  const content = [];
  for (const head of heads) {
    const r = await db
      .prepare("SELECT content FROM revisions WHERE id=?")
      .bind(head)
      .first<{ content: string }>();
    requireValue(r, 404, "Revisión no encontrada");
    content.push(entrySchema.parse(JSON.parse(r.content)));
  }
  const id = uid();
  const snapshot = snapshotSchema.parse({
    version: 1,
    releaseId: id,
    entries: content,
  });
  await db.batch([
    db
      .prepare(
        "INSERT INTO releases(id,snapshot,source_revision,state,created_at) VALUES(?,?,?,?,?)",
      )
      .bind(id, JSON.stringify(snapshot), sourceRevision, "approved", now()),
    ...heads.map((h) =>
      db.prepare("INSERT INTO release_revisions VALUES(?,?)").bind(id, h),
    ),
    audit(db, actor, "approve", id),
  ]);
  return { id, state: "approved", snapshot };
}

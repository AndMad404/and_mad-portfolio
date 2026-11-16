import { querySchema, resultSchema, fingerprint } from "../shared/contracts";
import { now, uid, requireValue } from "./env";
import { audit } from "./editorial";
export async function cleanup(db: D1Database) {
  await db.batch([
    db
      .prepare(
        "DELETE FROM requests WHERE (result_expires IS NOT NULL AND result_expires<=?) OR (result_expires IS NULL AND expires_at<=?)",
      )
      .bind(now(), now()),
    db.prepare(
      "UPDATE requests SET result=NULL WHERE credential_id IN(SELECT id FROM credentials WHERE revoked=1)",
    ),
  ]);
}
export async function credential(
  db: D1Database,
  actor: string,
  resources: string[],
) {
  const id = uid(),
    token = uid() + uid();
  await db.batch([
    db
      .prepare("INSERT INTO credentials(id,token_hash,resources) VALUES(?,?,?)")
      .bind(id, await fingerprint(token), JSON.stringify(resources)),
    audit(db, actor, "credential-create", id),
  ]);
  return { id, token };
}
export async function enqueue(
  db: D1Database,
  credentialId: string,
  input: unknown,
) {
  const query = querySchema.parse(input);
  const c = await db
    .prepare("SELECT resources FROM credentials WHERE id=? AND revoked=0")
    .bind(credentialId)
    .first<{ resources: string }>();
  requireValue(
    c && JSON.parse(c.resources).includes(query.resourceId),
    400,
    "Recurso no autorizado",
  );
  const pending = await db
    .prepare(
      "SELECT count(*) AS n FROM requests WHERE state IN ('pending','claimed') AND expires_at>?",
    )
    .bind(now())
    .first<{ n: number }>();
  requireValue((pending?.n || 0) < 10, 429, "Demasiadas consultas pendientes");
  const id = uid();
  await db
    .prepare(
      "INSERT INTO requests(id,credential_id,query,state,expires_at) VALUES(?,?,?,'pending',?)",
    )
    .bind(id, credentialId, JSON.stringify(query), now() + 60)
    .run();
  return { id };
}
export async function claim(db: D1Database, credentialId: string) {
  await cleanup(db);
  await db
    .prepare("UPDATE credentials SET last_seen=? WHERE id=? AND revoked=0")
    .bind(now(), credentialId)
    .run();
  const lease = uid();
  const job = await db
    .prepare(
      "UPDATE requests SET state='claimed',lease=?,lease_until=? WHERE id=(SELECT id FROM requests WHERE credential_id=? AND state='pending' AND expires_at>? ORDER BY expires_at LIMIT 1) AND state='pending' RETURNING id,query,lease,lease_until",
    )
    .bind(lease, now() + 25, credentialId, now())
    .first<{ id: string; query: string; lease: string; lease_until: number }>();
  return job ? { ...job, query: JSON.parse(job.query) } : null;
}
export async function resolve(
  db: D1Database,
  credentialId: string,
  id: string,
  input: unknown,
) {
  const result = resultSchema.parse(input);
  const r = await db
    .prepare(
      "UPDATE requests SET state='done',result=?,result_ok=?,result_expires=? WHERE id=? AND credential_id=? AND state='claimed' AND lease=? AND lease_until>? AND expires_at>? AND EXISTS(SELECT 1 FROM credentials WHERE id=? AND revoked=0)",
    )
    .bind(
      result.text,
      result.ok ? 1 : 0,
      now() + 900,
      id,
      credentialId,
      result.lease,
      now(),
      now(),
      credentialId,
    )
    .run();
  requireValue(
    r.meta.changes,
    409,
    "Resultado tardío, revocado o asignación inválida",
  );
  return { ok: true };
}

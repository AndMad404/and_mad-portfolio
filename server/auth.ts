import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";
import { fingerprint } from "../shared/contracts";
import { HttpError, type Env, requireValue } from "./env";
const keys = new Map<string, JWTVerifyGetKey>();
export async function owner(
  request: Request,
  env: Env,
  verificationKey?: JWTVerifyGetKey,
) {
  requireValue(
    /^[a-z0-9-]+$/.test(env.ACCESS_TEAM || "") &&
      env.ACCESS_AUDIENCE &&
      env.OWNER_EMAIL,
    503,
    "Falta configurar Access",
  );
  const issuer = `https://${env.ACCESS_TEAM}.cloudflareaccess.com`;
  let key = verificationKey || keys.get(issuer);
  if (!key) {
    key = createRemoteJWKSet(new URL(issuer + "/cdn-cgi/access/certs"));
    keys.set(issuer, key);
  }
  try {
    const token = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!token) throw new Error();
    const { payload } = await jwtVerify(token, key, {
      issuer,
      audience: env.ACCESS_AUDIENCE,
      algorithms: ["RS256"],
      requiredClaims: ["sub", "exp", "iat", "email"],
    });
    if (payload.email !== env.OWNER_EMAIL || typeof payload.sub !== "string")
      throw new Error();
    return payload.sub;
  } catch {
    throw new HttpError(401, "Acceso privado requerido");
  }
}
export function csrf(request: Request, env: Env) {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    requireValue(
      request.headers.get("origin") === env.PANEL_ORIGIN,
      403,
      "Origen rechazado",
    );
    requireValue(
      request.headers.get("content-type")?.split(";")[0] === "application/json",
      415,
      "Se requiere JSON",
    );
  }
}
export async function connectorIdentity(request: Request, env: Env) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  requireValue(token, 401, "Credencial requerida");
  const row = await env.DB.prepare(
    "SELECT id,resources FROM credentials WHERE token_hash=? AND revoked=0",
  )
    .bind(await fingerprint(token))
    .first<{ id: string; resources: string }>();
  requireValue(row, 401, "Credencial revocada o inválida");
  return row;
}
export async function deploymentIdentity(request: Request, env: Env) {
  requireValue(
    env.DEPLOY_TOKEN && env.DEPLOY_TOKEN.length >= 32,
    503,
    "Publicación sin configurar",
  );
  const token =
    request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1] || "";
  requireValue(
    (await fingerprint(token)) === (await fingerprint(env.DEPLOY_TOKEN)),
    401,
    "Credencial inválida",
  );
}

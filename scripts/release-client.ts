import { writeFile } from "node:fs/promises";
import { idSchema, snapshotSchema } from "../shared/contracts";
const id = idSchema.parse(process.env.RELEASE_ID),
  attempt = idSchema.parse(process.env.ATTEMPT_ID);
const origin = new URL(process.env.PANEL_ORIGIN || "");
if (
  origin.protocol !== "https:" ||
  origin.pathname !== "/" ||
  origin.username ||
  origin.password
)
  throw new Error("PANEL_ORIGIN inválido");
if (!process.env.DEPLOY_TOKEN) throw new Error("Falta DEPLOY_TOKEN");
const action = process.argv[2];
if (!["download", "published", "failed"].includes(action || ""))
  throw new Error("Acción inválida");
const headers = {
  Authorization: `Bearer ${process.env.DEPLOY_TOKEN}`,
  "Content-Type": "application/json",
  "CF-Access-Client-Id": process.env.CF_ACCESS_CLIENT_ID || "",
  "CF-Access-Client-Secret": process.env.CF_ACCESS_CLIENT_SECRET || "",
};
let done = false;
for (let i = 0; i < 3 && !done; i++) {
  try {
    const response = await fetch(
      new URL(
        `/api/deploy/${id}/${action === "download" ? `snapshot?attempt=${attempt}` : "result"}`,
        origin,
      ),
      {
        method: action === "download" ? "GET" : "POST",
        headers,
        body:
          action === "download"
            ? undefined
            : JSON.stringify({ attempt, state: action }),
        redirect: "error",
        signal: AbortSignal.timeout(15000),
      },
    );
    if (!response.ok) throw new Error("Backend rechazó la operación");
    if (action === "download") {
      const snapshot = snapshotSchema.parse(await response.json());
      if (snapshot.releaseId !== id) throw new Error("Identidad incorrecta");
      await writeFile(
        "content/published.json",
        JSON.stringify(snapshot, null, 2),
      );
    }
    done = true;
  } catch {
    if (i === 2)
      throw new Error("No se pudo completar la operación de publicación");
  }
}

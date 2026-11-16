import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
const config = z
  .object({
    PANEL_ORIGIN: z.string().url(),
    ACCESS_TEAM: z.string().regex(/^[a-z0-9-]+$/),
    ACCESS_AUDIENCE: z.string().min(1),
    OWNER_EMAIL: z.string().email(),
    CLOUDFLARE_D1_ID: z.string().uuid(),
    SOURCE_REVISION: z.string().regex(/^[a-f0-9]{40}$/),
  })
  .parse(process.env);
if (
  new URL(config.PANEL_ORIGIN).origin !== config.PANEL_ORIGIN ||
  !config.PANEL_ORIGIN.startsWith("https://")
)
  throw new Error("PANEL_ORIGIN debe ser un origen HTTPS");
// Generated config contains no tokens. Production secrets remain in Workers.
const source = await readFile("wrangler.studio.jsonc", "utf8");
const base = JSON.parse(source.replace(/,\s*([}\]])/g, "$1"));
base.d1_databases[0].database_id = config.CLOUDFLARE_D1_ID;
base.vars = {
  ...base.vars,
  PANEL_ORIGIN: config.PANEL_ORIGIN,
  ACCESS_TEAM: config.ACCESS_TEAM,
  ACCESS_AUDIENCE: config.ACCESS_AUDIENCE,
  OWNER_EMAIL: config.OWNER_EMAIL,
  SOURCE_REVISION: config.SOURCE_REVISION,
};
await writeFile(
  "wrangler.studio.generated.json",
  JSON.stringify(base, null, 2),
);

import { readFile, writeFile } from "node:fs/promises";
import { entrySchema, fingerprint, importSchema } from "../shared/contracts";
const [input, output, resourceId, label] = process.argv.slice(2);
if (!input || !output || !resourceId || !label)
  throw new Error(
    "Uso: npx tsx scripts/package-import.ts entrada.json paquete.json recurso etiqueta",
  );
const entry = entrySchema.parse(JSON.parse(await readFile(input, "utf8")));
const packet = importSchema.parse({
  version: 1,
  entry,
  source: {
    system: "prometheus",
    resourceId,
    label,
    fingerprint: await fingerprint(entry),
  },
});
await writeFile(output, JSON.stringify(packet, null, 2));

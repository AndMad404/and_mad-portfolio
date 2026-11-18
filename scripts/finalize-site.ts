import { writeFile, unlink } from "node:fs/promises";
import { caseAreas, areaStories, publicPaths, published as snapshot, siteIdentity } from "../app/content";
const origin = process.env.SITE_ORIGIN || "";
const indexable = process.env.INDEXABLE === "true";
if (indexable && !origin)
  throw new Error("SITE_ORIGIN es obligatorio para indexar");
if (
  origin &&
  (new URL(origin).origin !== origin || !origin.startsWith("https://"))
)
  throw new Error("SITE_ORIGIN debe ser un origen HTTPS");
const paths = publicPaths;
await writeFile(
  "build/site/client/robots.txt",
  indexable
    ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n",
);
await writeFile(
  "build/site/client/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${origin ? paths.map((p) => `<url><loc>${origin}${p}</loc></url>`).join("") : ""}</urlset>`,
);
await writeFile(
  "build/site/client/llms.txt",
  `# ${siteIdentity.name} | ${siteIdentity.brand}\nDesarrollo web, contenido y automatización. Servicios y experiencia profesional desde Costa Rica.\n${caseAreas.map(area => `- [${area.title}](${origin}/#area-${area.id}): ${areaStories[area.id]!.narrative}`).join("\n")}\n`,
);
// The public Worker returns 404 for every missing asset; never deploy an SPA fallback.
await writeFile(
  "build/site/client/release.json",
  JSON.stringify({ releaseId: snapshot.releaseId, paths }),
);
await unlink("build/site/client/__spa-fallback.html").catch(
  (error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  },
);

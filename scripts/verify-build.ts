import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { alternateLanguagePath, englishAreas, englishHomePath, englishHomeSeo, homeSeo, isEnglishPath, publicPaths, published as snapshot, siteIdentity, caseAreas, structuredServices, areaStories } from "../app/content";
const origin = process.env.SITE_ORIGIN;
const indexable = process.env.INDEXABLE === "true";
const paths = publicPaths;
const titles = new Set<string>();
const descriptions = new Set<string>();
const decode = (value: string) => value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, entity: string) => {
  if (entity.startsWith("#")) return String.fromCodePoint(entity[1]?.toLowerCase() === "x" ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10));
  return ({ amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" } as Record<string, string>)[entity.toLowerCase()]!;
});
const attribute = (tag: string, name: string) => {
  const value = tag.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
  return value === undefined ? undefined : decode(value);
};
const escape = (s: string) => s
  .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;").replaceAll("'", "&#x27;");
for (const route of paths) {
  const html = await readFile(
    path.join("build/site/client", route, "index.html"),
    "utf8",
  );
  const english = isEnglishPath(route);
  const locale = english ? "en" : siteIdentity.language;
  assert.ok(html.includes(`<html lang="${locale}"`));
  assert.match(html, /<h1[^>]*>[^<]+/);
  assert.equal(
    [...html.matchAll(/<h1(?:\s|>)/g)].length,
    1,
    "Una sola cabecera principal por ruta",
  );
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/)?.[1];
  assert.ok(head, `Head existente: ${route}`);
  const metaTags = [...head.matchAll(/<meta\b[^>]*>/g)].map(match => match[0]);
  const meta = (name: string, kind = "name") => {
    const matches = metaTags.filter(tag => attribute(tag, kind) === name);
    assert.equal(matches.length, 1, `Un solo metadato ${name}: ${route}`);
    return attribute(matches[0]!, "content");
  };
  const seo = english ? englishHomeSeo : homeSeo;
  const expectedTitle = seo.title;
  const expectedDescription = seo.description;
  const pageTitles = [...head.matchAll(/<title>([\s\S]*?)<\/title>/g)];
  assert.equal(pageTitles.length, 1, `Un solo title: ${route}`);
  const title = decode(pageTitles[0]![1]!);
  assert.equal(title, expectedTitle + " | " + siteIdentity.brand);
  assert.ok(!titles.has(title), `Título único: ${route}`);
  titles.add(title);
  assert.equal(meta("description"), expectedDescription);
  assert.ok(!descriptions.has(expectedDescription), `Descripción única: ${route}`);
  descriptions.add(expectedDescription);
  assert.equal(meta("robots"), indexable ? "index, follow" : "noindex, follow");
  assert.equal(meta("og:title", "property"), expectedTitle);
  assert.equal(meta("og:description", "property"), expectedDescription);
  assert.equal(meta("og:site_name", "property"), siteIdentity.brand);
  assert.equal(meta("twitter:title"), expectedTitle);
  assert.equal(meta("twitter:description"), expectedDescription);
  assert.ok(!metaTags.some(tag => attribute(tag, "name") === "keywords"));
  assert.ok(html.includes(`<nav aria-label="${english ? "Main" : "Principal"}"`));
  const languageLink = html.match(/<a\b[^>]*class="language-toggle"[^>]*>/)?.[0];
  assert.ok(languageLink, `Selector de idioma: ${route}`);
  assert.equal(attribute(languageLink, "data-language"), english ? "en" : "es");
  const alternate = alternateLanguagePath(route);
  assert.equal(attribute(languageLink, "href"), alternate);
  assert.doesNotMatch(html, /PRIVATE_DRAFT_SENTINEL|PRIVATE_QUERY_SENTINEL/);
  const links = [...head.matchAll(/<link\b[^>]*>/g)].map(match => match[0]);
  const canonicals = links.filter(tag => attribute(tag, "rel") === "canonical");
  const structured = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
  assert.equal(canonicals.length, origin ? 1 : 0, `Canónica única cuando existe origen: ${route}`);
  assert.equal(structured.length, origin ? 1 : 0, `Grafo JSON-LD único: ${route}`);
  if (origin) {
    assert.equal(attribute(canonicals[0]!, "href"), origin + route);
    const alternates = links.filter(tag => attribute(tag, "rel") === "alternate");
    assert.deepEqual(alternates.map(tag => [attribute(tag, "hrefLang"), attribute(tag, "href")]),
      alternate ? [[siteIdentity.language, origin + (english ? alternate : route)], ["en", origin + (english ? route : alternate)]] : []);
    assert.equal(meta("og:url", "property"), origin + route);
    assert.equal(meta("og:image", "property"), origin + "/social-card.png");
    assert.equal(meta("twitter:image"), origin + "/social-card.png");
    assert.equal(meta("twitter:card"), "summary_large_image");
    assert.equal(meta("og:image:width", "property"), "1200");
    assert.equal(meta("og:image:height", "property"), "630");
    const json = JSON.parse(structured[0]![1]!);
    assert.equal(json["@context"], "https://schema.org");
    const graph = json["@graph"] as Record<string, any>[];
    const expectedServices = structuredServices(origin, route);
    assert.equal(graph.length, 3 + expectedServices.length);
    assert.equal(new Set(graph.map(node => node["@id"])).size, graph.length);
    assert.deepEqual(graph.filter(node => node["@type"] === "Service"), expectedServices);
    const page = graph.find(node => node["@type"] === "WebPage")!;
    const person = graph.find(node => node["@type"] === "Person")!;
    const website = graph.find(node => node["@type"] === "WebSite")!;
    assert.equal(page["@id"], origin + route + "#webpage");
    assert.equal(page.url, origin + route);
    assert.equal(page.name, expectedTitle);
    assert.equal(page.description, expectedDescription);
    assert.equal(page.inLanguage, locale);
    assert.equal(page.isPartOf["@id"], website["@id"]);
    assert.equal(page.about["@id"], person["@id"]);
    assert.equal(person.name, "Andrés Madrigal");
    assert.equal(person.alternateName, "And_Mad");
    assert.deepEqual(person.sameAs, siteIdentity.profiles);
    assert.equal(website["@id"], origin + "/#website");
    assert.equal(person["@id"], origin + "/#person");
    assert.equal(website.publisher["@id"], person["@id"]);
  }
  const footer = html.match(/<footer\b[^>]*id="contacto"[\s\S]*?<\/footer>/)?.[0];
  assert.ok(footer, `Contacto en el footer: ${route}`);
  assert.match(footer, /id="contact-title"/);
  assert.match(footer, /href="https:\/\/www.linkedin.com\/in\/andres-mad\/"/);
  assert.match(footer, /href="https:\/\/github.com\/AndMad404"/);
  assert.equal([...html.matchAll(/id="contacto"/g)].length, 1, `Un único contacto: ${route}`);
  assert.doesNotMatch(html, /id="perfil"|href="[^"\s]*#perfil"|Perfil y forma de trabajar/);
  for (const section of ["servicios", "proyectos", "contacto"]) {
    assert.ok(html.includes(`id="${section}"`), `Ancla visible sin JavaScript: ${section}`);
    assert.ok(html.includes(`href="${route}#${section}"`));
  }
  assert.equal([...html.matchAll(/<dialog(?:\s|>)/g)].length, caseAreas.length);
  for (const area of caseAreas) {
    const story = (english ? englishAreas : areaStories)[area.id]!;
    const opener = html.match(new RegExp(`<button[^>]*id="resumen-area-${area.id}"[^>]*>`))?.[0];
    assert.ok(opener);
    assert.equal(attribute(opener, "aria-controls"), area.modalId);
    assert.ok(html.includes(`<p class="area-story">${escape(story.narrative)}</p>`));
    const modal = html.match(new RegExp(`<dialog id="${area.modalId}"[^>]*>[\\s\\S]*?<\\/dialog>`))?.[0];
    assert.ok(modal, `Modal para ${area.id}`);
    assert.ok(modal.includes(escape(story.narrative)));
    assert.match(modal, /class="area-results" role="list"/);
    for (const result of story.results) assert.ok(modal.includes(`<li>${escape(result)}</li>`));
  }
  assert.doesNotMatch(html, /<(?:a)\b[^>]*href="\/(?:proyectos|servicios|en\/cases)\/|Leer caso completo|Read full case study/);
  if (english) {
    for (const text of ["Clear content.", "Web interfaces and integrations", "Selected work.", "Learn more"]) {
      assert.ok(html.includes(text), `Texto inglés prerenderizado: ${text}`);
    }
  }
  if (!english) {
    const section = html.slice(html.indexOf('id="servicios"'), html.indexOf('id="proyectos"'));
    for (const service of snapshot.entries.filter(item => item.kind === "service")) {
      for (const value of [service.title, ...service.decisions]) {
        assert.ok(section.includes(escape(value)), `Servicio visible sin interacción: ${service.slug}`);
      }
    }
    assert.doesNotMatch(section, /<a\b|<button\b|<dialog\b|<details\b/);
    assert.match(html, /class="blueprint-background" aria-hidden="true"/);
    assert.match(html, /class="blueprint-energy-canvas"/);
    assert.match(html, /class="blueprint-grid-line"/);
    assert.doesNotMatch(html, /aria-label="Muestra ilustrativa del proceso editorial"/);
    assert.doesNotMatch(html, /UNA FICHA \/ DOS MOMENTOS|Antes de la revisión|Propuesta revisada/);
  }
}
assert.deepEqual(paths, ["/", "/en/"]);
for (const directory of ["proyectos", "servicios", "en/cases"]) {
  await assert.rejects(readdir(path.join("build/site/client", directory)), { code: "ENOENT" });
}
const sitemap = await readFile("build/site/client/sitemap.xml", "utf8");
const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => decode(match[1]!));
assert.deepEqual(locations, origin ? paths.map(route => origin + route) : []);
const robots = await readFile("build/site/client/robots.txt", "utf8");
assert.equal(robots, indexable ? `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n` : "User-agent: *\nDisallow: /\n");
const release = JSON.parse(await readFile("build/site/client/release.json", "utf8"));
assert.deepEqual(release.paths, paths);
assert.equal(release.releaseId, snapshot.releaseId);
const social = await readFile("build/site/client/social-card.png");
assert.equal(social.readUInt32BE(16), 1200);
assert.equal(social.readUInt32BE(20), 630);
async function scan(directory: string) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (/\.(?:js|html|json)$/.test(file)) {
      const text = await readFile(file, "utf8");
      assert.doesNotMatch(
        text,
        /PRIVATE_QUERY_SENTINEL|PRIVATE_DRAFT_SENTINEL|Cf-Access-Jwt-Assertion|GITHUB_TOKEN|CONNECTOR_TOKEN/,
      );
    }
  }
}
await scan("build/site/client");
assert.ok(
  !(await readdir("build/site/client")).includes("__spa-fallback.html"),
);
console.info(
  `HTML, metadatos y separación pública verificados en ${paths.length} rutas.`,
);

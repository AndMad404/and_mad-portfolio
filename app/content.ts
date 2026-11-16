import { snapshotSchema, entryPath, type Entry } from "../shared/contracts";
import data from "../content/published.json";
export const published = snapshotSchema.parse(data);
export const origin = import.meta.env?.VITE_SITE_ORIGIN || "";
export const siteIdentity = {
  name: "Andrés Madrigal",
  brand: "And_Mad",
  language: "es-CR",
  profiles: ["https://www.linkedin.com/in/andres-mad/", "https://github.com/AndMad404"],
};
export const homeSeo = {
  title: "Andrés Madrigal: desarrollo web y automatización",
  description: "Servicios y experiencia en frontend, AEM, calidad de datos y automatización con Python. Desde Costa Rica, para proyectos y equipos.",
};

// Áreas de navegación; las tecnologías y el contrato editorial siguen en cada ficha.
export const caseAreas = [
  { id: "cms", label: "CMS", entryId: "operacion-cms", title: "CMS: plantillas y contenido", experienceIds: ["operacion-cms", "sitios-wordpress"] },
  { id: "sitios-web", label: "Sitios web", entryId: "fak", title: "Creación de sitios web", experienceIds: ["fak", "sitios-wordpress"] },
  { id: "automatizacion", label: "Flujos de contenido", entryId: "portafolio-editorial", title: "Publicación y flujos de contenido", experienceIds: ["fak", "portafolio-editorial", "gestor"] },
  { id: "calidad-datos", label: "Calidad de datos", entryId: "auditoria-datos", title: "Calidad de datos", experienceIds: ["auditoria-datos", "excelbatch", "cleantreeflow", "auditoria-web", "extractor-carrito"] },
];
export function selectCases(cases: Entry[], requested: string | null) {
  const area = caseAreas.find(item => item.id === requested);
  if (area) return { key: area.id, label: area.label, legacy: false,
    entries: cases.filter(entry => entry.id === area.entryId) };
  const previous: Record<string, string[]> = {
    "desarrollo-web": ["React", "TypeScript", "Vue", "JavaScript", "Frontend", "WordPress"],
    "aem-cms": ["AEM", "CMS", "Content Analyst", "WordPress"],
    integracion: ["Integración"], "qa-accesibilidad": ["QA", "Pruebas", "Accesibilidad"],
    "seo-tecnico": ["SEO técnico"], planificacion: ["Planificación"],
  };
  const tags = requested ? previous[requested] : undefined;
  if (requested && (tags || cases.some(entry => entry.tags.includes(requested)))) return {
    key: requested, label: requested, legacy: true,
    entries: cases.filter(entry => entry.tags.some(tag => (tags ?? [requested]).includes(tag))),
  };
  return { key: "", label: "Todos", legacy: false,
    entries: caseAreas.flatMap(area => cases.filter(entry => entry.id === area.entryId)) };
}
export function structuredServices(siteOrigin: string, path: string) {
  return published.entries.filter(entry => entry.kind === "service" &&
    (path === "/" || entryPath(entry) === path)).map(entry => ({
      "@type": "Service", "@id": siteOrigin + entryPath(entry) + "#service",
      name: entry.title, description: entry.summary, url: siteOrigin + entryPath(entry),
      provider: { "@id": siteOrigin + "/#person" },
    }));
}
export function pageMeta(title: string, description: string, path: string) {
  return [
    { title: title + " | " + siteIdentity.brand },
    { name: "description", content: description },
    {
      name: "robots",
      content: import.meta.env?.VITE_INDEXABLE === "true" ? "index, follow" : "noindex, follow",
    },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:site_name", content: siteIdentity.brand },
    { property: "og:locale", content: "es_CR" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(origin ? [
      { tagName: "link", rel: "canonical", href: origin + path },
      { property: "og:url", content: origin + path },
      { property: "og:image", content: origin + "/social-card.png" },
      { property: "og:image:alt", content: siteIdentity.name + " — " + siteIdentity.brand },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: origin + "/social-card.png" },
      { name: "twitter:image:alt", content: siteIdentity.name + " — " + siteIdentity.brand },
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebPage", "@id": origin + path + "#webpage",
              url: origin + path, name: title, description,
              inLanguage: siteIdentity.language,
              isPartOf: { "@id": origin + "/#website" },
              about: { "@id": origin + "/#person" },
              ...(path === "/" ? { hasPart: {
                "@type": "WebPageElement", "@id": origin + "/#perfil",
                name: "Perfil y forma de trabajar.", about: { "@id": origin + "/#person" },
              }} : {}),
              ...(structuredServices(origin, path).length === 1 ? {
                mainEntity: { "@id": structuredServices(origin, path)[0]!["@id"] },
              } : {}),
            },
            {
              "@type": "Person", "@id": origin + "/#person",
              name: siteIdentity.name, alternateName: siteIdentity.brand,
              url: origin + "/", sameAs: siteIdentity.profiles,
            },
            {
              "@type": "WebSite", "@id": origin + "/#website",
              name: siteIdentity.brand, url: origin + "/",
              inLanguage: siteIdentity.language,
              publisher: { "@id": origin + "/#person" },
            },
            ...structuredServices(origin, path),
          ],
        },
      },
    ] : []),
  ];
}

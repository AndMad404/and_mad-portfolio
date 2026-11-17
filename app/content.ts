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
  { id: "cms", modalId: "modal-area-cms", label: "CMS", entryId: "operacion-cms", title: "CMS", introduction: "Creo plantillas, componentes y páginas administrables para que los equipos actualicen contenido con consistencia de marca y menos dependencia técnica. Aporto seis años de experiencia en AEM, además de desarrollo y documentación en WordPress.", experienceIds: ["operacion-cms", "sitios-wordpress"] },
  { id: "sitios-web", modalId: "modal-area-sitios-web", label: "Diseño Web", entryId: "fak", title: "Diseño Web", introduction: "Diseño y desarrollo interfaces claras, adaptables a móvil y escritorio, con atención a navegación, accesibilidad y rendimiento. Transformo necesidades del proyecto en páginas y componentes que facilitan consultar información y completar tareas.", experienceIds: ["fak", "sitios-wordpress"] },
  { id: "automatizacion", modalId: "modal-area-automatizacion", label: "Publicación y flujos de contenido", entryId: "portafolio-editorial", title: "Publicación y flujos de contenido", introduction: "Organizo la preparación, revisión y publicación de contenido para reducir tareas repetitivas y detectar errores antes de que lleguen al sitio. Integro fuentes de información y controles de CI/CD para comprobar cambios y preparar entregas revisables.", experienceIds: ["fak", "portafolio-editorial"] },
  { id: "calidad-datos", modalId: "modal-area-calidad-datos", label: "QA y controles de calidad", entryId: "auditoria-datos", title: "QA y controles de calidad", introduction: "Detecto errores de funcionamiento, inconsistencias de datos y problemas de contenido y assets antes de la entrega. Documento hallazgos y criterios de revisión para ayudar a los equipos a priorizar correcciones y publicar con mayor confianza.", experienceIds: ["auditoria-datos", "operacion-cms", "excelbatch", "cleantreeflow", "fak", "auditoria-web", "extractor-carrito"] },
];
// Lectura comercial breve; las fichas históricas conservan el detalle documental.
export const areaStories: Record<string, { trajectory: string; results: string[]; links: { label: string; url: string }[] }> = {
  cms: {
    trajectory: "Aporto seis años de experiencia en AEM en el sector automotriz. En WordPress he trabajado junto a equipos de marketing para crear sitios desde cero, mantener y mejorar plataformas existentes e integrar nuevas funcionalidades. Conecto los objetivos del negocio con una web fácil de administrar.",
    results: ["Plantillas, componentes y páginas administrables con una presentación consistente.", "Documentación y revisión de entregas para facilitar el trabajo de equipos no técnicos."],
    links: [],
  },
  "sitios-web": {
    trajectory: "He diseñado e implementado sitios de negocio en WordPress y una plataforma institucional para la Federación de Kendo. Trabajo desde las necesidades del proyecto hasta una interfaz adaptable y mantenible.",
    results: ["Sitios y componentes adaptados a móvil y escritorio.", "Navegación, contenido y documentación preparados para consultar información y mantener el sitio."],
    links: [{ label: "Federación de Kendo", url: "https://fak-kendo.org/" }],
  },
  automatizacion: {
    trajectory: "He conectado fuentes de información con flujos de revisión y publicación: desde la actualización de eventos hasta la preparación de contenido aprobado para este portafolio.",
    results: ["Eventos actualizados desde Calendar, con validaciones y conservación de la última versión válida ante fallos.", "Revisiones editoriales y controles CI/CD para preparar entregas comprobables."],
    links: [{ label: "Código de Federación", url: "https://github.com/AndMad404/FederacionDeKendo" }],
  },
  "calidad-datos": {
    trajectory: "Mi trayectoria combina investigación de catálogos, revisión de contenido y assets en AEM y verificaciones de interfaces. Desarrollo herramientas para preparar datos y hacer más clara su revisión.",
    results: ["Hallazgos, casos de prueba y criterios compartidos para priorizar correcciones.", "Preparación de archivos e inspección de datos con ExcelBatch y CleanTreeFlow; controles automatizados en Federación."],
    links: [{ label: "ExcelBatch", url: "https://github.com/AndMad404/ExcelBatch" }, { label: "CleanTreeFlow", url: "https://github.com/AndMad404/CleanTreeFlow" }],
  },
};
export type CaseArea = (typeof caseAreas)[number];
// First membership is the canonical destination of historical case fragments.
export function resolveCaseFragment(hash: string) {
  const area = caseAreas.find(item => hash === `#area-${item.id}`);
  if (area) return { area, experienceId: undefined };
  const entry = published.entries.find(item => item.kind === "case" && hash === `#caso-${item.slug}`);
  const owner = entry && caseAreas.find(item => item.experienceIds.includes(entry.id));
  return owner ? { area: owner, experienceId: entry!.id } : undefined;
}
export function areaExperienceId(area: CaseArea, entryId: string) {
  return `experiencia-${area.id}-${entryId}`;
}
export function standaloneCaseFragmentPath(hash: string) {
  if (resolveCaseFragment(hash)) return undefined;
  const entry = published.entries.find(item => item.kind === "case" && hash === `#caso-${item.slug}`);
  return entry ? entryPath(entry) : undefined;
}
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

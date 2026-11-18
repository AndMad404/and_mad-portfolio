import { snapshotSchema, entryPath, type Entry } from "../shared/contracts";
import data from "../content/published.json";
import { translatedCase } from "./english-cases";
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
export const englishHomePath = "/en/";
export const englishHomeSeo = {
  title: "Andrés Madrigal: web development and automation",
  description: "Frontend development, CMS, data quality, and automation services from Costa Rica.",
};
export const isEnglishHome = (pathname: string) =>
  pathname === englishHomePath || pathname === "/en";
export const isEnglishPath = (pathname: string) =>
  isEnglishHome(pathname) || pathname.startsWith(englishHomePath + "cases/");
export const englishCasePath = (entry: Entry) => `${englishHomePath}cases/${entry.slug}/`;
export const englishCases = published.entries.flatMap(entry => {
  const translation = translatedCase(entry);
  return translation ? [translation] : [];
});
export const publicPaths = ["/", englishHomePath];

export function alternateLanguagePath(pathname: string) {
  const path = pathname.endsWith("/") ? pathname : pathname + "/";
  if (path === "/") return englishHomePath;
  if (path === englishHomePath) return "/";
  return undefined;
}

// Áreas de experiencia y destinos de los enlaces históricos.
export const caseAreas = [
  { id: "cms", modalId: "modal-area-cms", label: "CMS", entryId: "operacion-cms", title: "CMS", experienceIds: ["operacion-cms", "sitios-wordpress"] },
  { id: "sitios-web", modalId: "modal-area-sitios-web", label: "Diseño Web", entryId: "fak", title: "Diseño Web", experienceIds: ["fak", "sitios-wordpress"] },
  { id: "automatizacion", modalId: "modal-area-automatizacion", label: "Publicación y flujos de contenido", entryId: "portafolio-editorial", title: "Publicación y flujos de contenido", experienceIds: ["fak", "portafolio-editorial"] },
  { id: "calidad-datos", modalId: "modal-area-calidad-datos", label: "QA y controles de calidad", entryId: "auditoria-datos", title: "QA y controles de calidad", experienceIds: ["auditoria-datos", "operacion-cms", "excelbatch", "cleantreeflow", "fak", "auditoria-web", "extractor-carrito"] },
];
// Contexto y contribución en una narración breve, seguidos por resultados.
type AreaStory = { narrative: string; results: string[]; links: { label: string; url: string }[] };
export const areaStories: Record<string, AreaStory> = {
  cms: {
    narrative: "Durante seis años trabajé con AEM en el sector automotriz, donde los equipos de marketing necesitaban actualizar contenido y mantener la presentación de marca. Preparé plantillas, componentes y páginas administrables. En WordPress colaboré con marketing para crear sitios, mejorar los existentes y documentar su mantenimiento.",
    results: ["Plantillas, componentes y páginas administrables con una presentación consistente.", "Documentación y revisión de entregas para facilitar el trabajo de equipos no técnicos."],
    links: [],
  },
  "sitios-web": {
    narrative: "La Federación de Kendo necesitaba un sitio donde su comunidad pudiera consultar eventos y contenido institucional desde distintos dispositivos. Diseñé la interfaz en Figma y la desarrollé con React y TypeScript. Organicé la navegación y preparé componentes adaptables para presentar la información de forma consistente.",
    results: ["Sitios y componentes adaptados a móvil y escritorio.", "Navegación, contenido y documentación preparados para consultar información y mantener el sitio."],
    links: [{ label: "Federación de Kendo", url: "https://fak-kendo.org/" }],
  },
  automatizacion: {
    narrative: "Actualizar los eventos de la Federación de Kendo implicaba trasladar información del calendario al sitio. Integré Google Calendar y añadí validaciones para detectar fallos antes de publicar. En este portafolio incorporé revisiones editoriales y controles de CI/CD para comprobar los cambios antes de una entrega.",
    results: ["Eventos actualizados desde Calendar, con validaciones y conservación de la última versión válida ante fallos.", "Revisiones editoriales y controles CI/CD para preparar entregas comprobables."],
    links: [{ label: "Código de Federación", url: "https://github.com/AndMad404/FederacionDeKendo" }],
  },
  "calidad-datos": {
    narrative: "Cuando aparecían inconsistencias en catálogos o contenido de AEM, investigaba dónde surgían y documentaba los hallazgos para que QA, marketing y desarrollo pudieran revisarlos. También preparé herramientas para ordenar archivos e inspeccionar datos, y añadí verificaciones automatizadas al sitio de la Federación.",
    results: ["Hallazgos, casos de prueba y criterios compartidos para priorizar correcciones.", "Preparación de archivos e inspección de datos con ExcelBatch y CleanTreeFlow; controles automatizados en Federación."],
    links: [{ label: "ExcelBatch", url: "https://github.com/AndMad404/ExcelBatch" }, { label: "CleanTreeFlow", url: "https://github.com/AndMad404/CleanTreeFlow" }],
  },
};
export const englishAreas: Record<string, AreaStory & { title: string }> = {
  cms: {
    title: "CMS",
    narrative: "I spent six years working with AEM in the automotive sector, where marketing teams needed to update content while keeping it consistent with the brand. I prepared templates, components, and editable pages. In WordPress, I worked with marketing to build and improve sites and document how to maintain them.",
    results: ["Editable templates, components, and pages with a consistent look.", "Documentation and release reviews that help nontechnical teams manage their sites."],
    links: [],
  },
  "sitios-web": {
    title: "Web design",
    narrative: "The Kendo Federation needed a website where its community could find events and institutional information on different devices. I designed the interface in Figma and built it with React and TypeScript. I organized the navigation and created responsive components to present the information consistently.",
    results: ["Sites and components that work on mobile and desktop.", "Navigation, content, and documentation that help visitors find information and teams maintain the site."],
    links: [{ label: "Kendo Federation", url: "https://fak-kendo.org/" }],
  },
  automatizacion: {
    title: "Publishing and content workflows",
    narrative: "Keeping the Kendo Federation website current meant transferring events from the calendar to the site. I integrated Google Calendar and added validation to catch failures before publication. For this portfolio, I added editorial reviews and CI/CD checks so changes could be verified before release.",
    results: ["Events update from Calendar. Validation catches errors and keeps the last valid version if an update fails.", "Editorial reviews and CI/CD checks help teams verify changes before release."],
    links: [{ label: "Kendo Federation source code", url: "https://github.com/AndMad404/FederacionDeKendo" }],
  },
  "calidad-datos": {
    title: "QA and quality checks",
    narrative: "When inconsistencies appeared in catalogs or AEM content, I traced where they arose and documented findings for QA, marketing, and development to review. I also built tools to organize files and inspect data, and added automated checks to the Kendo Federation website.",
    results: ["Findings, test cases, and shared criteria to help teams prioritize fixes.", "File preparation and data inspection with ExcelBatch and CleanTreeFlow, plus automated checks for the Kendo Federation site."],
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
export function retiredPublicDestination(pathname: string) {
  const path = pathname.endsWith("/") ? pathname : pathname + "/";
  const english = isEnglishPath(path);
  const entry = english
    ? englishCases.find(item => englishCasePath(item) === path)
    : published.entries.find(item => entryPath(item) === path);
  if (!entry) return undefined;
  if (entry.kind === "service") return "/#servicios";
  const fragment = `#caso-${entry.slug}`;
  return (english ? englishHomePath : "/") + (resolveCaseFragment(fragment) ? fragment : "#proyectos");
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
    path === "/").map(entry => ({
      "@type": "Service", "@id": siteOrigin + "/#resumen-servicio-" + entry.slug,
      name: entry.title, description: entry.summary, url: siteOrigin + "/#resumen-servicio-" + entry.slug,
      provider: { "@id": siteOrigin + "/#person" },
    }));
}
export function pageMeta(title: string, description: string, path: string) {
  const english = isEnglishPath(path);
  const language = english ? "en" : siteIdentity.language;
  const alternate = alternateLanguagePath(path);
  const services = structuredServices(origin, path);
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
    { property: "og:locale", content: english ? "en_US" : "es_CR" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(origin ? [
      { tagName: "link", rel: "canonical", href: origin + path },
      ...(alternate ? [
        { tagName: "link", rel: "alternate", hrefLang: siteIdentity.language, href: origin + (english ? alternate : path) },
        { tagName: "link", rel: "alternate", hrefLang: "en", href: origin + (english ? path : alternate) },
      ] : []),
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
              inLanguage: language,
              isPartOf: { "@id": origin + "/#website" },
              about: { "@id": origin + "/#person" },
              ...(services.length === 1 ? {
                mainEntity: { "@id": services[0]!["@id"] },
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
            ...services,
          ],
        },
      },
    ] : []),
  ];
}

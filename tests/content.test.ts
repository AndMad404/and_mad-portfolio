import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { readFile } from "node:fs/promises";
import { createMemoryRouter, RouterProvider } from "react-router";
import Home from "../app/routes/home";
import { caseAreas, selectCases, publicPaths, published, structuredServices } from "../app/content";
import { snapshotSchema, entryPath } from "../shared/contracts";
import { EntryView } from "../shared/EntryView";
import publicWorker from "../server/public";
import { readPublicStyles } from "./helpers/public-styles";

test("contrato publicado y rutas históricas", async () => {
  const snapshot = snapshotSchema.parse(
    JSON.parse(await readFile("content/published.json", "utf8")),
  );
  assert.equal(snapshot.entries.filter((e) => e.kind === "service").length, 3);
  const paths = snapshot.entries.map(entryPath);
  for (const route of [
    "/proyectos/fak/",
    "/proyectos/gestor/",
    "/proyectos/centrificador/",
  ])
    assert.ok(paths.includes(route));
  const e = snapshot.entries[0]!;
  const html = renderToStaticMarkup(
    createElement(EntryView, {
      entry: { ...e, title: "<script>bad()</script>" },
    }),
  );
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>bad/);
});

test("contenido publicado no conserva marcadores ni textos repetidos entre entradas", async () => {
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile("content/published.json", "utf8")));
  const fields = ["title", "summary", "problem", "contribution", "results", "limits"] as const;
  for (const entry of snapshot.entries) {
    const texts = [...fields.map(field => entry[field]), ...entry.decisions, ...entry.evidence.map(item => item.label)];
    for (const text of texts) assert.doesNotMatch(text, /pendiente de confirmar|\bTODO\b|lorem ipsum/i, `${entry.id}: marcador sin resolver`);
    assert.equal(new Set(entry.decisions).size, entry.decisions.length, `${entry.id}: decisiones repetidas`);
    assert.notEqual(entry.summary, entry.problem, `${entry.id}: resumen y problema idénticos`);
  }
  for (const field of ["title", "summary", "limits"] as const) {
    const values = snapshot.entries.map(entry => entry[field].trim().toLowerCase());
    assert.equal(new Set(values).size, values.length, `${field} repetido entre entradas`);
  }
});

test("cuatro áreas simplifican los casos y conservan la selección exacta de filtros técnicos", () => {
  const cases = published.entries.filter(entry => entry.kind === "case");
  assert.equal(caseAreas.length, 4);
  assert.equal(new Set(caseAreas.map(area => area.id)).size, 4);
  const covered = new Set<string>();
  for (const area of caseAreas) {
    const selected = selectCases(cases, area.id);
    assert.ok(selected.entries.length > 0, area.id + " no debe estar vacía");
    assert.equal(selected.legacy, false);
    for (const entry of selected.entries) covered.add(entry.id);
  }
  assert.deepEqual([...covered].sort(), ["fak", "operacion-cms", "portafolio-editorial", "auditoria-datos"].sort());
  for (const tag of new Set(cases.flatMap(entry => entry.tags))) {
    const selected = selectCases(cases, tag);
    assert.equal(selected.legacy, true);
    assert.deepEqual(selected.entries, cases.filter(entry => entry.tags.includes(tag)));
  }
  for (const value of [null, "", "Todos", "desconocido"]) {
    assert.deepEqual(selectCases(cases, value).entries.map(entry => entry.id), ["operacion-cms", "fak", "portafolio-editorial", "auditoria-datos"]);
    assert.equal(selectCases(cases, value).label, "Todos");
  }
  assert.deepEqual(selectCases(cases, "integracion").entries.map(entry => entry.id), ["fak", "portafolio-editorial", "gestor"]);
  assert.deepEqual(selectCases(cases, "seo-tecnico").entries.map(entry => entry.id), ["fak", "sitios-wordpress"]);
});

test("SSR mantiene cuatro áreas y los casos de apoyo antes de hidratar filtros y fragmentos", () => {
  const router = createMemoryRouter([{ path: "/", element: createElement(Home) }], {
    initialEntries: ["/?area=React#caso-excelbatch"],
  });
  try {
    const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
    assert.equal([...html.matchAll(/class="project-card work-type"/g)].length, 4);
    assert.doesNotMatch(html, /project-filters|Herramientas y proyectos de apoyo/);
    for (const id of new Set(caseAreas.flatMap(area => area.experienceIds))) {
      const entry = published.entries.find(item => item.id === id)!;
      assert.ok(html.includes(`id="resumen-${entry.slug}"`));
    }
  } finally { router.dispose(); }
});

test("servicios resumen la oferta y experiencia sin repetir el formato de caso", async () => {
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile("content/published.json", "utf8")));
  for (const service of snapshot.entries.filter(entry => entry.kind === "service")) {
    for (const inline of [false, true]) {
      const serviceHtml = renderToStaticMarkup(createElement(EntryView, { entry: service, inline }));
      assert.match(serviceHtml, />Qué puedes contratar</);
      assert.match(serviceHtml, />Experiencia que aporto</);
      assert.doesNotMatch(serviceHtml, />Decisiones<|>El problema<|>Resultados y entregables<|>Evidencia y referencias</);
      assert.ok(serviceHtml.includes(service.contribution));
      assert.ok(serviceHtml.includes(service.limits));
      for (const offer of service.decisions) assert.ok(serviceHtml.includes(offer));
      assert.match(serviceHtml, /Conversemos sobre tu proyecto/);
    }
  }
  const study = snapshot.entries.find(entry => entry.kind === "case" && entry.decisions.length > 0)!;
  assert.match(renderToStaticMarkup(createElement(EntryView, { entry: study })), />Decisiones</);
});

test("detalle sin colecciones opcionales omite bloques vacíos y conserva numeración", async () => {
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile("content/published.json", "utf8")));
  const entry = { ...snapshot.entries[0]!, decisions: [], evidence: [], tags: [] };
  for (const inline of [false, true]) {
    const html = renderToStaticMarkup(createElement(EntryView, { entry, inline }));
    assert.doesNotMatch(html, />Decisiones<|>Evidencia y referencias<|class="tags"|<ul/);
    const numbers = [...html.matchAll(/class="detail-number"[^>]*>(\d+)<\/span>/g)].map(match => match[1]);
    assert.deepEqual(numbers, ["01", "02", "03", "04"]);
    assert.ok(html.includes(entry.contribution));
    assert.ok(html.includes(entry.results));
    assert.ok(html.includes(entry.limits));
  }
});

test("Worker público conserva 404 y rechaza escrituras", async () => {
  const env = {
    ASSETS: {
      fetch: async () => new Response("missing", { status: 404 }),
    } as unknown as Fetcher,
  };
  const response = await publicWorker.fetch(
    new Request("https://site.example/no-existe"),
    env,
  );
  assert.equal(response.status, 404);
  assert.match(await response.text(), /noindex/);
  assert.deepEqual(publicPaths, ["/", "/en/"]);
  for (const [path, target] of [
    ["/proyectos/fak/?ref=cv", "/?ref=cv#caso-fak"],
    ["/en/cases/fak", "/en/#caso-fak"],
    ["/proyectos/gestor/", "/#proyectos"],
    ["/servicios/creacion-de-sitios/", "/#servicios"],
  ]) {
    const redirect = await publicWorker.fetch(new Request("https://site.example" + path), env);
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get("Location"), "https://site.example" + target);
  }
  const unknown = await publicWorker.fetch(new Request("https://site.example/proyectos/no-existe"), env);
  assert.equal(unknown.status, 404);
  assert.equal(
    (
      await publicWorker.fetch(
        new Request("https://site.example/", { method: "POST" }),
        env,
      )
    ).status,
    405,
  );
});

test("detalle en línea conserva jerarquía y contenido sin duplicar h1", async () => {
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile("content/published.json", "utf8")));
  const entry = snapshot.entries[0]!;
  const html = renderToStaticMarkup(createElement(EntryView, { entry, inline: true }));
  assert.doesNotMatch(html, /<h1(?:\s|>)/);
  assert.match(html, /<h2[^>]*class="entry-title"/);
  assert.match(html, /<h3>El problema<\/h3>/);
  assert.ok(html.includes(entry.results));
  assert.match(html, /class="entry-parallax-window"/);
  assert.doesNotMatch(html, /class="blueprint-background"/, "El modal abre una ventana al fondo existente sin montar otro parallax");
});

test("un solo responsable del espacio: sin margen o padding adicional en los límites de bloques", async () => {
  const { default: postcss } = await import("postcss");
  const sheet = postcss.parse(await readPublicStyles());
  // Inspect the final declarations in every matching selector, including media rules.
  // This guards the CSS boundary contract; it does not replace browser geometry QA.
  const declarations = (selector: string) => {
    const values = new Map<string, string>();
    sheet.walkRules(rule => {
      if (rule.selectors?.includes(selector)) rule.walkDecls(decl => { values.set(decl.prop, decl.value); });
    });
    return values;
  };
  const checks: [string, string, string][] = [
    [".public-site > footer.contact-section", "gap", "var(--content-space)"],
    [".public-site .engineering-method", "gap", "var(--content-space)"],
    [".public-site .engineering-method", "margin", "0"],
    [".public-site .method-section", "gap", "var(--content-space)"],
    [".public-site .method-section > .section-heading", "margin", "0"],
    [".public-site .engineering-method > section", "padding", "0"],
    [".public-site .engineering-method > section", "margin", "0"],
    [".public-site .engineering-method > section > *", "margin", "0"],
    [".public-site .experience-list > section", "padding", "0"],
    [".public-site .experience-list > section", "margin", "0"],
    [".public-site .experience-list > section > *", "margin", "0"],
    [".public-site .profile-layout > div:first-child > *", "margin", "0"],
    [".public-site > main.shell:has(> .editorial-hero)", "margin-block", "0"],
    [".public-site > main.shell:has(> .editorial-hero)", "gap", "var(--content-space)"],
    [".public-site > main.shell > .section", "margin", "0"],
    [".public-site > main.shell > .section", "padding", "var(--content-space)"],
    [".project-grid .project-card", "margin-block", "0"],
    [".public-site .contact-section > .footer-signature", "margin", "0"],
    [".public-site .contact-section > .footer-signature", "padding", "0"],
  ];
  for (const [selector, property, expected] of checks) {
    const values = declarations(selector);
    assert.equal(values.get(property), expected, `${selector}: ${property} no debe acumular espacio`);
    // A later longhand would silently reintroduce spacing after a zero shorthand.
    if ((property === "margin" || property === "padding") && expected === "0") {
      const entries = [...values];
      const reset = entries.findIndex(([key]) => key === property);
      for (const [key, value] of entries.slice(reset + 1)) {
        if (key.startsWith(`${property}-`)) assert.match(value, /^0(?:px|rem)?$/, `${selector}: ${key} añade espacio`);
      }
    }
  }
});

test("selección comercial agrupa CMS y herramientas sin destacar proyectos en desarrollo", () => {
  const cases = published.entries.filter(entry => entry.kind === "case");
  const featured = selectCases(cases, null).entries;
  assert.equal(featured.length, 4);
  assert.ok(!featured.some(entry => ["centrificador", "gestor"].includes(entry.id)));
  const cms = featured.find(entry => entry.id === "operacion-cms")!;
  assert.ok(cms.tags.includes("WordPress") && cms.tags.includes("AEM"));
  const quality = featured.find(entry => entry.id === "auditoria-datos")!;
  for (const tool of ["ExcelBatch", "CleanTreeFlow", "Informes de auditoría", "Extractor de productos"]) {
    assert.ok(quality.decisions.some(item => item.includes(tool)), tool);
  }
  const router = createMemoryRouter([{ path: "/", element: createElement(Home) }]);
  try {
    const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
    assert.equal([...html.matchAll(/class="project-card work-type"/g)].length, 4);
    assert.equal([...html.matchAll(/class="work-type-window"/g)].length, 4);
    assert.equal([...html.matchAll(/class="work-type-title"/g)].length, 4);
    assert.doesNotMatch(html, /TIPO DE TRABAJO/);
    for (const card of html.matchAll(/<article class="project-card work-type"[\s\S]*?<\/article>/g)) {
      assert.ok(card[0].indexOf('class="work-type-title"') < card[0].indexOf('class="work-type-body"'));
      assert.ok(card[0].indexOf('class="work-type-window"') < card[0].indexOf('class="work-type-content"'));
    }
    assert.doesNotMatch(html, /Herramientas y proyectos de apoyo|class="cover-drawing/);
    for (const area of caseAreas) {
      assert.ok(html.includes(area.title));
      assert.ok(html.includes(`aria-controls="${area.modalId}"`));
    }
  } finally { router.dispose(); }
});

test("Home integra trayectoria y método sin un bloque separado de Perfil", () => {
  const router = createMemoryRouter([{ path: "/", element: createElement(Home) }]);
  try {
    const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
    assert.doesNotMatch(html, /id="perfil"|id="method-title"|class="delivery-steps"/);
    const hero = html.slice(0, html.indexOf('id="servicios"'));
    assert.match(hero, /Más de siete años/);
    assert.match(hero, /QA, Marketing y desarrollo/);
    assert.match(hero, /clientes en inglés/);
    const services = html.slice(html.indexOf('id="servicios"'), html.indexOf('id="proyectos"'));
    assert.match(services, /Acordamos el alcance/);
    assert.match(services, /valido cada entrega con criterios claros/);
    assert.match(services, /Documento decisiones y comparto conocimiento/);
    assert.match(services, /<ul class="service-list">/);
  } finally { router.dispose(); }
});

test("Service describe únicamente los servicios visibles en la portada", () => {
  const base = "https://portfolio.example";
  const services = published.entries.filter(entry => entry.kind === "service");
  const nodes = structuredServices(base, "/");
  assert.equal(nodes.length, services.length);
  services.forEach((entry, index) => {
    assert.equal(nodes[index]!.name, entry.title);
    assert.equal(nodes[index]!.description, entry.summary);
    assert.equal(nodes[index]!.provider["@id"], base + "/#person");
    assert.equal(nodes[index]!.url, base + "/#resumen-servicio-" + entry.slug);
    assert.deepEqual(structuredServices(base, entryPath(entry)), []);
  });
  assert.deepEqual(structuredServices(base, "/proyectos/fak/"), []);
});

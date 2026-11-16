import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createMemoryRouter, RouterProvider } from "react-router";
import Home from "../app/routes/home";
import { caseAreas, selectCases, published, structuredServices } from "../app/content";
import { ProjectCard } from "../app/components/ProjectCard";
import { snapshotSchema, entryPath } from "../shared/contracts";
import { EntryView } from "../shared/EntryView";
import publicWorker from "../server/public";
import { advanceEnergy, createEnergySystem, nodePower, linePower, LIGHT_COUNT, energyNodeAt, stimulateEnergyNode, releaseEnergyPointer, pointerPower } from "../shared/BlueprintEnergy";
import { centeredBlockScroll, nextBlockScroll, visibleNavigationSection } from "../app/components/PageMotion";
import { paperWindowPath, ownedWindowPaths } from "../app/components/BlueprintWindows";
import { BlueprintBackground, createBlueprintGraph } from "../app/components/BlueprintBackground";

/** Resolve the real public CSS cascade so modularization cannot hide regressions. */
async function readPublicStyles(file = "app/public.css", ancestors = new Set<string>()): Promise<string> {
  const { default: postcss } = await import("postcss");
  const absolute = path.resolve(file);
  const relative = path.relative(path.resolve("app"), absolute);
  assert.ok(relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), "CSS stays within app");
  assert.ok(!ancestors.has(absolute), "No cyclic CSS imports");
  const next = new Set(ancestors).add(absolute);
  const sheet = postcss.parse(await readFile(absolute, "utf8"), { from: absolute });
  for (const node of [...sheet.nodes]) {
    if (node.type !== "atrule" || node.name !== "import") continue;
    const imported = node.params.match(/^["'](\.[^"']+\.css)["']$/)?.[1];
    assert.ok(imported, "Only local CSS imports are supported by the regression guard");
    node.replaceWith(postcss.parse(await readPublicStyles(path.resolve(path.dirname(absolute), imported), next)).nodes);
  }
  return sheet.toString();
}
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

test("servicios rotulan su enfoque sin llamarlo decisiones", async () => {
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile("content/published.json", "utf8")));
  const service = snapshot.entries.find(entry => entry.kind === "service" && entry.decisions.length > 0)!;
  const serviceHtml = renderToStaticMarkup(createElement(EntryView, { entry: service }));
  assert.match(serviceHtml, />Cómo lo abordo</);
  assert.doesNotMatch(serviceHtml, />Decisiones</);
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

test("varias vistas previas conservan referencias únicas sin depender del router ni del navegador", async () => {
  const snapshot = snapshotSchema.parse(
    JSON.parse(await readFile("content/published.json", "utf8")),
  );
  const entry = {
    ...snapshot.entries[0]!,
    evidence: [
      { id: "first", label: "Referencia <privada> revisada" },
      {
        id: "second",
        label: "Referencia publicada",
        url: "https://example.com/evidence",
      },
    ],
  };
  const html = renderToStaticMarkup(
    createElement(
      Fragment,
      null,
      createElement(EntryView, { entry }),
      createElement(EntryView, { entry: { ...entry, id: "another-case" } }),
    ),
  );
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((match) => match[1]!);
  assert.equal(
    new Set(ids).size,
    ids.length,
    "Las galerías no duplican IDs en el panel",
  );
  for (const control of html.matchAll(/aria-controls="([^"]+)"/g))
    assert.ok(ids.includes(control[1]!));
  assert.match(html, /Referencia &lt;privada&gt; revisada/);
  assert.doesNotMatch(html, /<privada>/);
  assert.doesNotMatch(
    html,
    /view-transition-name:case-/,
    "Las vistas previas no registran transiciones públicas",
  );
  assert.equal(
    [...html.matchAll(/href="https:\/\/example.com\/evidence"/g)].length,
    2,
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

test("portada ofrece modales etiquetados y páginas históricas de respaldo", async () => {
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile("content/published.json", "utf8")));
  const router = createMemoryRouter([{ path: "/", element: createElement(Home) }]);
  try {
    const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
    assert.ok(html.indexOf('id="servicios"') < html.indexOf('id="proyectos"'), "Servicios precede a Casos en el orden real del documento");
    assert.doesNotMatch(html, /id="contacto"/, "El contacto pertenece al footer compartido");
    assert.doesNotMatch(html, /UNA FICHA \/ DOS MOMENTOS|Antes de la revisión|Propuesta revisada/);
    assert.match(html, /id="method-title"/);
    assert.match(html, /id="perfil"/);
    assert.equal([...html.matchAll(/<h1(?:\s|>)/g)].length, 1);
    assert.equal([...html.matchAll(/<dialog(?:\s|>)/g)].length, snapshot.entries.length);
    assert.doesNotMatch(html, /<dialog[^>]* open(?:=|\s|>)/, "El HTML inicial no abre diálogos no modales");
    for (const entry of snapshot.entries) {
      assert.ok(html.includes(`id="modal-${entry.id}"`), "Modal existente para cada entrada");
      if (entry.kind === "service" || caseAreas.some(area => area.experienceIds.includes(entry.id))) assert.ok(html.includes(`aria-controls="modal-${entry.id}"`), "Control asociado con su modal");
      assert.ok(html.includes(`aria-labelledby="modal-title-${entry.id}"`), "Modal con nombre accesible");
      if (entry.kind === "service" || caseAreas.some(area => area.experienceIds.includes(entry.id))) assert.ok(html.includes(`href="${entryPath(entry)}"`), "Página de experiencia disponible sin JavaScript");
    }
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]!);
    assert.equal(new Set(ids).size, ids.length, "Sin IDs repetidos entre detalles y galerías");
    assert.match(html, /href="\/#servicios"/);
    assert.match(html, /href="\/#proyectos"/);
    assert.match(html, /<a[^>]*id="resumen-fak"[^>]*aria-haspopup="dialog"/);
  } finally { router.dispose(); }
});

test("tarjeta con modal conserva enlace alternativo, título y control de cierre", async () => {
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile("content/published.json", "utf8")));
  const entry = snapshot.entries.find(entry => entry.id === "fak")!;
  const router = createMemoryRouter([{ path: "/", element: createElement(ProjectCard, {
    entry, number: 1, expanded: true,
  }) }], { initialEntries: ["/?area=React#caso-fak"] });
  try {
    const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
    assert.match(html, /<dialog[^>]*id="modal-fak"[^>]*aria-labelledby="modal-title-fak"/);
    assert.match(html, /<a[^>]*id="resumen-fak"[^>]*aria-controls="modal-fak"/);
    assert.ok(html.includes(`href="${entryPath(entry)}"`));
    assert.match(html, /aria-label="Cerrar detalle"/);
    assert.match(html, /class="entry-modal-scroll" tabindex="0"/);
    assert.doesNotMatch(html, /<h1(?:\s|>)/);
    assert.ok(html.includes(entry.results));
    assert.doesNotMatch(html, /case-pointer|case-magnified|folder-lens-layer/);
  } finally { router.dispose(); }
});


test("blueprint conecta todos los nodos por propagación después de su aparición", () => {
  const graph = createBlueprintGraph();
  assert.equal(graph.nodes.length, 63);
  assert.equal(graph.cell, 40);
  assert.equal(graph.nodes[31]!.delay, 0, "Origen central");
  assert.ok(graph.nodes[0]!.delay > graph.nodes[31]!.delay, "Encendido hacia afuera");
  assert.equal(Math.max(...graph.nodes.map(n => n.radius)) / Math.min(...graph.nodes.map(n => n.radius)), 2.5);
  const incoming = new Map(graph.edges.map(edge => [edge.to, edge]));
  assert.equal(graph.edges.length, graph.nodes.length - 1);
  assert.ok(Math.min(...graph.edges.map(e => e.delay)) > Math.max(...graph.nodes.map(n => n.delay)) + graph.nodeDuration);
  const reached = new Set(graph.nodes.filter(n => n.depth === 0).map(n => n.id));
  for (const edge of graph.edges) {
    const from = graph.nodes[edge.from]!;
    const to = graph.nodes[edge.to]!;
    assert.ok(reached.has(from.id));
    assert.ok(!reached.has(to.id));
    assert.equal(to.depth, from.depth + 1);
    assert.equal(Math.abs(from.x - to.x) + Math.abs(from.y - to.y), graph.cell);
    const previous = incoming.get(from.id);
    if (previous) assert.ok(edge.delay > previous.delay + graph.connectionDuration,
      "La propagación espera a que termine la conexión anterior");
    reached.add(to.id);
  }
  assert.equal(reached.size, graph.nodes.length);
  assert.throws(() => createBlueprintGraph(0, 2));
});

test("fondo blueprint es decorativo y estático en SSR, con identificadores únicos", () => {
  const html = renderToStaticMarkup(createElement(Fragment, null,
    createElement(BlueprintBackground), createElement(BlueprintBackground)));
  assert.match(html, /aria-hidden="true" data-motion="off"/);
  assert.match(html, /focusable="false"/);
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]!);
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, ids.length);
  for (const reference of html.matchAll(/url\(#([^)]*)\)/g)) assert.ok(ids.includes(reference[1]!));
});


test("portadas oscuras comparten el mismo blueprint que el fondo de página", async () => {
  const { CaseCover } = await import("../shared/CaseCover");
  const snapshot = snapshotSchema.parse(JSON.parse(await readFile("content/published.json", "utf8")));
  const entry = snapshot.entries.find(entry => entry.id === "fak")!;
  const html = renderToStaticMarkup(createElement(CaseCover, { entry }));
  assert.match(html, /data-variant="cover"/);
  assert.match(html, /pattern[^>]*width="40" height="40"/);
  assert.match(html, /blueprint-energy-canvas/);
  assert.doesNotMatch(html, /<circle/);
  assert.match(html, /Entrada/);
  assert.match(html, /Proceso/);
  assert.match(html, /Salida/);
});



test("ventanas recortan el papel en las coordenadas del fondo sin tocar el contenido", () => {
  const paper = { x: 100, y: -200, width: 1000, height: 2000 };
  const first = { x: 150, y: 80, width: 400, height: 300 };
  const second = { x: 150, y: 480, width: 400, height: 300 };
  assert.equal(paperWindowPath(paper, [first, second]),
    "M100 -200h1000v2000h-1000Z M150 80h400v300h-400Z M150 480h400v300h-400Z");
  assert.ok(!paperWindowPath(paper, [{ ...first, width: 0 }]).includes("M150"));
  assert.ok(!paperWindowPath(paper, [{ ...first, x: Number.NaN }]).includes("NaN"));
  assert.equal(paperWindowPath({ x: 20, y: 0, width: 350, height: 800 }, [
    { x: 300, y: 80, width: 160, height: 250 },
  ]), "M20 0h350v800h-350Z M300 80h70v250h-70Z", "La ventana móvil no abre un segundo hueco fuera del papel");
});


test("luces recorren conexiones válidas con variación reproducible", () => {
  const graph = createBlueprintGraph();
  assert.deepEqual(graph, createBlueprintGraph());
  assert.notDeepEqual(graph.edges, createBlueprintGraph(9, 7, 941).edges);
  const links = new Set(graph.edges.flatMap(edge => [`${edge.from}:${edge.to}`, `${edge.to}:${edge.from}`]));
  for (const signal of graph.signals) {
    assert.equal(signal.route.length, 9);
    assert.ok(signal.delay >= 4400);
    for (let i = 1; i < signal.route.length; i++) assert.ok(links.has(`${signal.route[i - 1]}:${signal.route[i]}`));
  }
});


test("blueprint continuo usa dieciséis luces, dibuja líneas y mantiene el nodo grande hasta decaer", () => {
  const system = createEnergySystem(400, 300, () => .4);
  assert.equal(system.lights.length, LIGHT_COUNT);
  assert.equal(LIGHT_COUNT, 16);
  advanceEnergy(system, 1000, 1000);
  assert.equal(system.lines.size, 0);
  for (let time = 1700; time < 10000; time += 100) advanceEnergy(system, time, 100);
  assert.ok(system.lines.size > 0);
  assert.ok(system.nodes.some(node => Number.isFinite(node.hit)));
  for (const edge of system.lines.values()) {
    const a = system.nodes[edge.from]!, b = system.nodes[edge.to]!;
    assert.equal(Math.abs(a.x - b.x) + Math.abs(a.y - b.y), 40);
  }
  assert.equal(nodePower(500, 0), 1);
  assert.ok(nodePower(5000, 0) < nodePower(1000, 0));
  assert.equal(nodePower(0, -Infinity), 0);
  assert.equal(centeredBlockScroll(500, 400, 1000, 100), 150);
});


test("scroll por bloques conserva lectura completa, regreso y límites", () => {
  const blocks = [{ top: 100, height: 600 }, { top: 900, height: 1400 }, { top: 2500, height: 600 }];
  assert.equal(nextBlockScroll(blocks, 0, 900, 100, 1, 2400), 788, "Entra al inicio del bloque alto");
  assert.equal(nextBlockScroll(blocks, 788, 900, 100, 1, 2400), 1416, "No salta contenido alto hacia abajo");
  assert.equal(nextBlockScroll(blocks, 1100, 900, 100, -1, 2400), 788, "No salta contenido alto hacia arriba");
  assert.equal(nextBlockScroll(blocks, 1416, 900, 100, 1, 2400), 2294, "Continúa tras leer el final");
  assert.equal(nextBlockScroll(blocks, 2294, 900, 100, -1, 2400), 1416, "Regresa al final del bloque alto");
  assert.equal(nextBlockScroll(blocks, 788, 900, 100, -1, 2400), 0, "Vuelve al primer bloque sin posición negativa");
  assert.equal(nextBlockScroll(blocks, 2400, 900, 100, 1, 2400), null, "Libera el scroll al final");
  assert.equal(nextBlockScroll([], 0, 900, 100, 1, 0), null);
});

test("cuatro luces por cuadrante conservan su zona durante recorridos aleatorios", () => {
  let seed = 79;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const system = createEnergySystem(900, 650, random);
  assert.deepEqual(system.lights.map(light => light.quadrant), [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3]);
  for (let quadrant = 0; quadrant < 4; quadrant++) {
    const pair = system.lights.filter(light => light.quadrant === quadrant);
    const bounds = system.quadrants[quadrant]!;
    assert.equal(pair.length, 4);
    assert.equal(new Set(pair.map(light => light.from)).size, 4);
    const a = system.nodes[pair[0]!.from]!, b = system.nodes[pair[1]!.from]!;
    assert.equal(Math.abs(a.x - b.x), (bounds.right - bounds.left) * 40);
    assert.equal(Math.abs(a.y - b.y), (bounds.bottom - bounds.top) * 40);
  }
  for (let time = 1900; time < 80000; time += 80) {
    advanceEnergy(system, time, 80);
    for (const light of system.lights) {
      const bounds = system.quadrants[light.quadrant]!;
      for (const id of [light.from, light.to]) {
        const x = id % system.columns, y = Math.floor(id / system.columns);
        assert.ok(x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom);
      }
    }
  }
});


test("líneas pierden energía y un nuevo paso renueva su iluminación", () => {
  assert.equal(linePower(2000, 2000), 1);
  assert.ok(linePower(8000, 2000) < linePower(4000, 2000));
  assert.equal(linePower(8000, 8000), 1);
  const system = createEnergySystem(400, 300, () => .4);
  for (let time = 1900; time < 4000; time += 100) advanceEnergy(system, time, 100);
  assert.ok([...system.lines.values()].every(line => Number.isFinite(line.hit)));
});

test("luces reservan cruces y tramos sin colisionar y todas siguen avanzando", () => {
  for (const initialSeed of [7, 79, 408]) {
    let seed = initialSeed;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const system = createEnergySystem(900, 650, random, 136);
    const departures = system.lights.map(() => 0);
    for (let time = 1900; time < 120000; time += 40) {
      const before = system.lights.map(light => light.from);
      advanceEnergy(system, time, 40, .5);
      const reserved = new Set<number>();
      system.lights.forEach((light, index) => {
        if (light.from !== before[index]) departures[index]!++;
        for (const node of new Set([light.from, light.to])) {
          assert.ok(!reserved.has(node), `dos luces reservaron el nodo ${node} en ${time}`);
          reserved.add(node);
        }
      });
    }
    assert.ok(departures.every(count => count > 20), "ninguna luz debe quedarse bloqueada indefinidamente");
  }
});

test("luces esperan si un cruce está ocupado y no se duplican en superficies pequeñas", () => {
  const system = createEnergySystem(400, 300, () => .4);
  const light = system.lights[0]!;
  const bounds = system.quadrants[0]!;
  light.from = (bounds.top + 1) * system.columns + bounds.left + 1;
  light.to = light.from;
  light.previous = -1;
  const neighbors = [light.from - 1, light.from + 1, light.from - system.columns, light.from + system.columns];
  const blockers = system.lights.slice(1, 5);
  blockers.forEach((blocker, index) => {
    blocker.from = neighbors[index]!;
    blocker.to = blocker.from;
    blocker.retryAt = Infinity;
  });
  advanceEnergy(system, 2000, 40);
  assert.equal(light.to, light.from);
  assert.ok(light.retryAt > 2000);
  blockers[0]!.from = blockers[0]!.to = system.nodes.length - 1;
  advanceEnergy(system, light.retryAt + 1, 40);
  assert.equal(light.to, neighbors[0]);

  const tiny = createEnergySystem(1, 1, () => .4);
  assert.equal(new Set(tiny.lights.map(item => item.from)).size, tiny.lights.length);
  advanceEnergy(tiny, 2000, 100);
  assert.ok(tiny.lights.every(item => item.from === item.to));
  assert.equal(tiny.lines.size, 0);
});

test("el mouse detecta nodos revelados con margen de proximidad", () => {
  const system = createEnergySystem(400, 300, () => .4);
  const node = system.nodes[2 * system.columns + 2]!;
  assert.equal(energyNodeAt(system, node.x, node.y, 0), null);
  assert.equal(energyNodeAt(system, node.x + 16, node.y, 2000)?.id, node.id);
  assert.equal(energyNodeAt(system, node.x + 17, node.y, 2000), null);
  const small = system.nodes[node.id + 1]!;
  assert.equal(energyNodeAt(system, small.x + 12, small.y, 2000)?.id, small.id);
  assert.equal(energyNodeAt(system, small.x + 13, small.y, 2000), null);
  assert.equal(energyNodeAt(system, -40, node.y, 2000), null);
  assert.equal(energyNodeAt(system, NaN, node.y, 2000), null);
});

test("activar un nodo propaga energía local sin cambiar las rutas de las luces", () => {
  const system = createEnergySystem(400, 300, () => .4);
  const id = 3 * system.columns + 3;
  const routes = structuredClone(system.lights);
  assert.equal(stimulateEnergyNode(system, id, 0), false);
  assert.equal(stimulateEnergyNode(system, id, 1200), true);
  assert.equal(stimulateEnergyNode(system, id, 1250), false);
  advanceEnergy(system, 1380, 0);
  assert.ok(system.pointerLines.size > 0);
  assert.equal(system.pointerNodes.get(id + 1)?.hit, 1380);
  assert.equal(system.pointerNodes.get(id + 2), undefined);
  advanceEnergy(system, 1740, 0);
  assert.equal(system.bursts.length, 0);
  assert.equal(system.pointerNodes.get(id + 3)?.hit, 1740);
  assert.equal(system.pointerNodes.get(id + 4), undefined);
  assert.deepEqual(system.lights, routes);
  for (const line of system.pointerLines.values()) {
    const a = system.nodes[line.from]!, b = system.nodes[line.to]!;
    assert.equal(Math.abs(a.x - b.x) + Math.abs(a.y - b.y), 40);
  }
  for (const node of system.nodes) stimulateEnergyNode(system, node.id, 5000);
  assert.ok(system.bursts.length <= 192);
});

test("alejar el mouse cancela la onda pendiente y apaga su brillo en 450 ms", () => {
  const system = createEnergySystem(400, 300, () => .4);
  const id = 3 * system.columns + 3;
  system.nodes[id]!.hit = 900;
  stimulateEnergyNode(system, id, 1200);
  advanceEnergy(system, 1380, 0);
  const glow = system.pointerNodes.get(id)!;
  assert.equal(pointerPower(1380, glow.hit, glow.releasedAt), 1);
  assert.equal(pointerPower(10000, glow.hit, glow.releasedAt), 1, "se mantiene mientras el cursor permanece");
  releaseEnergyPointer(system, 1380);
  assert.equal(system.bursts.length, 0);
  assert.equal(pointerPower(1380, glow.hit, glow.releasedAt), 1);
  assert.equal(pointerPower(1605, glow.hit, glow.releasedAt), .5);
  assert.equal(pointerPower(1830, glow.hit, glow.releasedAt), 0);
  releaseEnergyPointer(system, 1605);
  assert.equal(glow.releasedAt, 1380, "moverse fuera no reinicia el apagado");
  advanceEnergy(system, 1830, 0);
  assert.equal(system.pointerNodes.size, 0);
  assert.equal(system.pointerLines.size, 0);
  assert.equal(system.nodes[id]!.hit, 900, "la energía automática conserva su estado");
  assert.equal(system.nodes[id + 2]!.hit, -Infinity);
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

test("menú sigue la sección visible, excluye la cabecera y libera portada/método", () => {
  const select = visibleNavigationSection;
  assert.equal(select([{ id: "servicios", top: -500, bottom: 110 }, { id: "proyectos", top: 130, bottom: 1400 }], 120, 900), "proyectos");
  assert.equal(select([{ id: "perfil", top: -300, bottom: 250 }, { id: "contacto", top: 280, bottom: 850 }], 100, 900), "contacto");
  assert.equal(select([{ id: "servicios", top: 100, bottom: 850 }, { id: "proyectos", top: 900, bottom: 1800 }], 100, 900), "servicios");
  assert.equal(select([{ id: "", top: 100, bottom: 800 }, { id: "servicios", top: 850, bottom: 1600 }], 100, 900), "");
  assert.equal(select([{ id: "proyectos", top: -800, bottom: 90 }], 100, 900), "");
  assert.equal(select([], 100, 900), "");
});

test("contacto se activa al final aunque el footer sea menor que perfil", () => {
  const sections = [{ id: "perfil", top: -100, bottom: 800 }, { id: "contacto", top: 820, bottom: 880 }];
  assert.equal(visibleNavigationSection(sections, 100, 900, { scroll: 2100, height: 3000 }), "contacto");
  assert.equal(visibleNavigationSection(sections, 100, 900, { scroll: 2098.5, height: 3000 }), "contacto", "Tolera redondeo subpíxel");
  assert.equal(visibleNavigationSection(sections, 100, 900, { scroll: 2000, height: 3000 }), "perfil", "Salir del final restaura la sección visible");
  assert.equal(visibleNavigationSection([{ id: "perfil", top: -400, bottom: 150 }, { id: "contacto", top: 160, bottom: 800 }], 100, 900,
    { scroll: 1800, height: 3000 }), "perfil", "Contacto espera el final, aunque ya sea visible");
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
      assert.ok(card[0].indexOf('class="work-type-content"') < card[0].indexOf('class="work-type-window"'));
    }
    assert.doesNotMatch(html, /Herramientas y proyectos de apoyo|class="cover-drawing/);
    for (const area of caseAreas) {
      assert.ok(html.includes(area.title));
      for (const id of area.experienceIds) assert.ok(html.includes(`aria-controls="modal-${id}"`));
    }
  } finally { router.dispose(); }
});

test("parallax no recorta una sección con ventanas ajenas u ocultas", () => {
  const paper = { x: 0, y: 100, width: 500, height: 600 };
  const overlap = { x: 20, y: 110, width: 200, height: 300 };
  assert.equal(ownedWindowPaths(paper, [{ bounds: overlap, owned: false }]), "", "Un recorte ajeno sobre el texto no atraviesa esta sección");
  assert.equal(ownedWindowPaths(paper, [{ bounds: { ...overlap, height: 0 }, owned: true }]), "");
  assert.equal(ownedWindowPaths(paper, [{ bounds: overlap, owned: true }]), paperWindowPath(overlap, []));
  assert.equal(ownedWindowPaths(paper, [{ bounds: { ...overlap, y: 750 }, owned: true }]), "", "La ventana propia tampoco atraviesa fuera de su sección");
});

test("la retícula comparte unidad con los nodos y todos los espacios usan su escala", async () => {
  const { ENERGY_CELL } = await import("../shared/BlueprintEnergy");
  const { default: postcss } = await import("postcss");
  const graph = createBlueprintGraph(3, 3);
  const energy = createEnergySystem(120, 120, () => .5);
  assert.equal(graph.cell, ENERGY_CELL);
  assert.equal(graph.nodes[1]!.x - graph.nodes[0]!.x, ENERGY_CELL);
  assert.equal(energy.nodes[1]!.x - energy.nodes[0]!.x, ENERGY_CELL);
  assert.equal(energy.nodes[energy.columns]!.y - energy.nodes[0]!.y, ENERGY_CELL);
  const html = renderToStaticMarkup(createElement(BlueprintBackground));
  assert.ok(html.includes(`--grid-unit:${ENERGY_CELL}px`), "El fondo aislado recibe la unidad canónica");
  const spacing = /^(?:(?:scroll-)?(?:margin|padding)(?:-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?)?|gap|row-gap|column-gap)$/;
  const violations = (css: string) => {
    const found: string[] = [];
    postcss.parse(css).walkDecls(decl => {
      if (spacing.test(decl.prop) && /(?:\d*\.)?\d+(?:px|rem|vw|vh|cqw|em|%)/.test(decl.value)) {
        found.push(`${decl.parent?.type === "rule" ? decl.parent.selector : ""}: ${decl.prop}: ${decl.value}`);
      }
    });
    return found;
  };
  for (const file of ["shared/tokens.css", "shared/presentation.css", "app/public.css"]) {
    const css = file === "app/public.css" ? await readPublicStyles() : await readFile(file, "utf8");
    if (file === "app/public.css") assert.match(css, /\.work-type-title/, "The guard must inspect imported rules");
    assert.deepEqual(violations(css), [], file + ": espaciado fuera de la retícula");
  }
  assert.equal(violations("@media (min-width: 64rem) { .regression { gap: 24px; } }").length, 1,
    "El guard detecta valores aislados también dentro de media queries");
  const tokens = await readFile("shared/tokens.css", "utf8");
  assert.match(tokens, /--space-1:\s*var\(--grid-unit\)/);
  assert.match(tokens, /--space-half:\s*calc\(var\(--grid-unit\) \/ 2\)/);
});

test("las doce pistas se anclan a líneas de nodos y el contenido de la rejilla no depende de bordes", async () => {
  const { default: postcss } = await import("postcss");
  const sheet = postcss.parse(await readPublicStyles());
  let tracks = "";
  const lines = new Map<string, string>();
  sheet.walkAtRules("supports", supports => supports.walkRules(rule => {
    if (!rule.selectors?.includes(".public-site .work-type-body")) return;
    rule.walkDecls(decl => {
      if (decl.prop === "grid-template-columns") tracks = decl.value;
      if (/^--line-\d+$/.test(decl.prop)) lines.set(decl.prop, decl.value);
    });
  }));
  assert.equal(lines.size, 11, "once líneas entre doce pistas");
  for (const value of lines.values()) assert.match(value, /^round\(.*var\(--space-1\)\)$/, "cada línea se redondea a la unidad de nodos");
  assert.equal([...tracks.matchAll(/calc\(/g)].length, 11);
  assert.match(tracks, /minmax\(0, 1fr\)\s*$/, "la última pista absorbe el resto");
  assert.ok(!tracks.includes("px"), "las pistas no introducen otra unidad");
  const props = new Set<string>();
  sheet.walkRules(rule => {
    if (rule.selectors?.includes(".work-type-body")) rule.walkDecls(decl => { props.add(decl.prop); });
  });
  assert.ok(!props.has("border"), "un borde desplazaría el contenido fuera de la retícula");
  assert.ok(props.has("box-shadow"));
});

test("perfil y método forman una sección con encabezados y proceso semánticos", () => {
  const router = createMemoryRouter([{ path: "/", element: createElement(Home) }]);
  try {
    const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
    assert.equal([...html.matchAll(/id="perfil"/g)].length, 1);
    assert.match(html, /<section id="perfil" class="section profile-method" aria-labelledby="profile-title">/);
    assert.doesNotMatch(html, /class="section method-section"|UNA FORMA DE TRABAJAR|04 \/ PERFIL/);
    assert.match(html, /<h2 id="profile-title">Perfil y forma de trabajar\.<\/h2>/);
    assert.match(html, /<h3 id="method-title">Del alcance a la entrega\.<\/h3>/);
    const steps = html.match(/<ol class="delivery-steps">([\s\S]*?)<\/ol>/)![1]!;
    assert.equal([...steps.matchAll(/<li>/g)].length, 4);
    assert.equal([...steps.matchAll(/<h4>/g)].length, 4);
    assert.match(html, /<ul class="service-list">/);
  } finally { router.dispose(); }
});

test("Service describe únicamente los servicios visibles y sus rutas", () => {
  const base = "https://portfolio.example";
  const services = published.entries.filter(entry => entry.kind === "service");
  const nodes = structuredServices(base, "/");
  assert.equal(nodes.length, services.length);
  services.forEach((entry, index) => {
    assert.equal(nodes[index]!.name, entry.title);
    assert.equal(nodes[index]!.description, entry.summary);
    assert.equal(nodes[index]!.provider["@id"], base + "/#person");
    assert.deepEqual(structuredServices(base, entryPath(entry)), [nodes[index]]);
  });
  assert.deepEqual(structuredServices(base, "/proyectos/fak/"), []);
});

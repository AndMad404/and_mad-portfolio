import { test } from "node:test";
import assert from "node:assert/strict";
import { canvasPointAt, createLattice, documentLayout, latticeTracks, nodeAt, pointOf, viewportGridMetrics } from "../shared/lattice";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement, Fragment } from "react";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { snapshotSchema } from "../shared/contracts";
import { createEnergySystem, energyNodeAt, pointerNeighbourhood, documentActivity, createDocumentFlows, DOCUMENT_BOOT, documentReveal } from "../shared/BlueprintEnergy";
import { BlueprintBackground, createBlueprintGraph } from "../app/components/BlueprintBackground";
import { readPublicStyles } from "./helpers/public-styles";

// Cover current documentGrid/BlueprintBackground consumers, not the G1 reference.
const EPS = 1e-8;

test("el fondo mantiene las medidas de móvil hasta 4K", () => {
  const metrics = viewportGridMetrics();
  assert.deepEqual(metrics, { cell: 60, nodeRadius: 3.5, majorRadius: 4.5, pointerReach: 22 });
  for (const [width, height] of [[390, 844], [768, 1024], [1440, 900], [3840, 2160]] as const) {
    const device = { width, height, dpr: 1.25 };
    const grid = createLattice(device, { cell: metrics.cell });
    assert.equal(pointOf(grid, 1, 0).x - pointOf(grid, 0, 0).x, 60);
    assert.ok(pointOf(grid, grid.cols - 1, 0).x >= width);
    assert.ok(pointOf(grid, 0, grid.rows - 1).y >= height);
    assert.equal(documentLayout(device, 0, 80).lattice.cell, 40);
  }
  assert.equal(viewportGridMetrics(20).cell, 75, "Respeta el tamaño raíz de texto");
  assert.throws(() => viewportGridMetrics(0), RangeError);
  assert.throws(() => createLattice({ width: 390, height: 844, dpr: 1 }, { cell: 0 }), RangeError);
});

test("el área de toque de 44px selecciona las esquinas sin solaparse con el nodo vecino", () => {
  const metrics = viewportGridMetrics();
  for (const width of [320, 390, 768, 1024, 1920, 3840]) {
    const grid = createLattice({ width, height: 844, dpr: 2.475 }, { cell: metrics.cell });
    const target = { col: 2, row: 2 }, p = pointOf(grid, target.col, target.row);
    assert.deepEqual(nodeAt(grid, p.x + 22, p.y + 22, metrics.pointerReach), target);
    assert.equal(nodeAt(grid, p.x + 22.01, p.y, metrics.pointerReach), null);
    assert.equal(nodeAt(grid, p.x + metrics.cell / 2, p.y, metrics.pointerReach), null);
    const neighbor = pointOf(grid, 3, 2);
    assert.deepEqual(nodeAt(grid, neighbor.x - 22, neighbor.y, metrics.pointerReach), { col: 3, row: 2 });
    const activity = documentActivity(grid, width, 844, 0, 0);
    const flows = createDocumentFlows(grid, activity.firstRow, activity.lastRow, activity.active, 0, activity.firstCol, activity.lastCol);
    assert.ok(flows.length <= 32 && flows.length <= activity.nodes);
  }
});

test("el pintado omite viewports vacíos y se recupera sin canvas de dimensión cero", async () => {
  const source = await readFile("shared/BlueprintBackground.tsx", "utf8");
  const paint = source.slice(source.indexOf("    function paint(now: number)"), source.indexOf("    function schedule()"))
    .replace("paint(now: number)", "paint(now)").replaceAll("!.", ".");
  const viewport = { clientWidth: 390, clientHeight: 844 };
  let draws = 0, transforms = 0, scheduled = 0;
  const context = {
    setTransform(...values: number[]) { assert.ok(values.every(Number.isFinite)); transforms++; },
    clearRect() {}, beginPath() {}, moveTo() {}, lineTo() {}, stroke() {}, arc() {}, fill() {},
    drawImage(image: { width: number; height: number }) {
      assert.ok(image.width > 0 && image.height > 0, "drawImage requiere un origen no vacío");
      draws++;
    },
  };
  const state = {
    document: { documentElement: viewport, visibilityState: "visible" },
    window: { devicePixelRatio: 1.25 },
    grid: { lattice: createLattice({ width: 390, height: 844, dpr: 1.25 }), width: 390, height: 844,
      metrics: viewportGridMetrics() },
    frame: null, previous: 42, dirty: true, clock: 0, bootFinished: true,
    query: { matches: true }, pausedRef: { current: false }, ready: false, pulse: null,
    host: { dataset: {} }, surface: { width: 0, height: 0 }, base: { width: 0, height: 0 },
    context, baseContext: context, DOCUMENT_BOOT, documentReveal, pointOf,
    schedule() { scheduled++; },
  };
  runInNewContext(paint, state);
  const render = (now: number) => runInNewContext(`paint(${now})`, state);
  render(50);
  assert.equal(draws, 1);
  for (const [width, height] of [[0, 844], [390, 0], [0, 0]]) {
    viewport.clientWidth = width!; viewport.clientHeight = height!;
    const before = transforms;
    state.previous = 50;
    render(60);
    assert.equal(draws, 1);
    assert.equal(transforms, before, "No dividir por dimensiones de layout cero");
    assert.equal(state.previous, 0);
    assert.equal(state.dirty, true);
  }
  assert.equal(scheduled, 0, "Esperar un resize sin generar un bucle de frames vacíos");
  viewport.clientWidth = 390; viewport.clientHeight = 844;
  render(100);
  assert.equal(draws, 2);
  assert.equal(state.dirty, false);
  viewport.clientWidth = viewport.clientHeight = 1;
  state.window.devicePixelRatio = .25;
  render(110);
  assert.equal(draws, 3);
  assert.equal(state.base.width, 1);
  assert.equal(state.base.height, 1);
});

const onGrid = (value: number, origin: number, cell: number) =>
  Math.abs((value - origin) / cell - Math.round((value - origin) / cell)) < EPS;

test("contenido y fondo comparten retícula en móvil, escritorio y escalado fraccionario", () => {
  const contentTop = 84.8125;
  for (const device of [
    { width: 320, height: 740, dpr: 1 },
    { width: 1001, height: 5003, dpr: 1.25 },
    { width: 1905, height: 12017, dpr: 1.5 },
    { width: 3831, height: 18117, dpr: 2.475 },
  ]) {
    const { lattice: grid, shellLeft, shellWidth } = documentLayout(device, 1, contentTop);
    assert.ok(shellLeft >= 0 && shellLeft + shellWidth <= device.width + 1 / device.dpr);
    assert.ok(onGrid(shellLeft, grid.phaseX, grid.cell));
    assert.ok(onGrid(shellLeft + shellWidth, grid.phaseX, grid.cell));
    assert.ok(onGrid(contentTop, grid.phaseY, grid.cell));
    assert.ok(Math.abs(shellLeft + shellWidth / 2 - device.width / 2) <= .5 / device.dpr + EPS);
    assert.ok(pointOf(grid, grid.cols - 1, 0).x >= device.width);
    assert.ok(pointOf(grid, 0, grid.rows - 1).y >= device.height);
  }
});

test("resize, scrollbar clásico y contenido más largo recalculan la distribución", () => {
  const layout = (width: number, height = 5000) => documentLayout({ width, height, dpr: 1 }, 2, 80);
  const overlay = layout(1920), classic = layout(1905), mobile = layout(360);
  const expanded = layout(1905, 15000);
  assert.notEqual(overlay.lattice.phaseX, classic.lattice.phaseX);
  assert.ok(mobile.shellWidth < classic.shellWidth);
  assert.ok(mobile.shellLeft >= 0 && mobile.shellLeft + mobile.shellWidth <= 360);
  assert.equal(expanded.shellLeft, classic.shellLeft);
  assert.equal(expanded.shellWidth, classic.shellWidth);
  assert.equal(expanded.lattice.phaseX, classic.lattice.phaseX);
  assert.ok(expanded.lattice.rows > classic.lattice.rows);
  assert.ok(pointOf(expanded.lattice, 0, expanded.lattice.rows - 1).y >= 15000);
});

test("columnas y gaps caben en el grid, incluidas las proporciones de portada y servicios", () => {
  const grid = createLattice({ width: 1000, height: 5000, dpr: 1.25 });
  for (const [cells, count, share, expectedCells] of [
    [8, 1, undefined, [8]],
    [12, 2, 7 / 12, [6, 5]],
    [12, 2, .6, [7, 4]],
    [12, 3, undefined, [3, 3, 4]],
    [2, 3, undefined, [2]],
  ] as const) {
    const tracks = latticeTracks(grid, cells * grid.cell, count, share);
    assert.deepEqual(tracks, expectedCells.map(cells => cells * grid.cell));
    assert.equal(tracks.reduce((sum, width) => sum + width, 0) + (tracks.length - 1) * grid.cell, cells * grid.cell);
  }
});

test("las pistas nunca exceden el ancho disponible entre celdas completas", () => {
  const grid = createLattice({ width: 1000, height: 5000, dpr: 1.25 });
  for (const width of [0, 20, 39, 40, 280, 299, 300, 319, 320, 359, 767, 1001]) {
    for (const count of [1, 2, 3, 4]) {
      const tracks = latticeTracks(grid, width, count, .6);
      const occupied = tracks.reduce((sum, track) => sum + track, 0) + (tracks.length - 1) * grid.cell;
      assert.ok(occupied <= width, `${width}px, ${count} columnas: ${occupied}px`);
      assert.ok(tracks.every(track => track >= 0 && track % grid.cell === 0));
    }
  }
});

test("el puntero usa medidas del canvas y excluye el scrollbar también con escalado", () => {
  for (const scale of [1, 1.25, 2]) {
    const geometry = {
      left: -120 * scale, top: -120 * scale, width: 2160 * scale, height: 1320 * scale,
      logicalWidth: 2160, logicalHeight: 1320, viewportWidth: 1905 * scale, viewportHeight: 1080 * scale,
    };
    assert.deepEqual(canvasPointAt(0, 0, geometry), { x: 120, y: 120 });
    assert.deepEqual(canvasPointAt(500 * scale, 200 * scale, geometry), { x: 620, y: 320 });
    assert.equal(canvasPointAt(1905 * scale, 500 * scale, geometry), null);
    assert.ok(canvasPointAt(1919 * scale, 500 * scale, { ...geometry, viewportWidth: 1920 * scale }));
    assert.equal(canvasPointAt(10, 1080 * scale, geometry), null);
    assert.equal(canvasPointAt(-1, 10, geometry), null);
    assert.equal(canvasPointAt(NaN, 10, geometry), null);
    assert.equal(canvasPointAt(10, 10, { ...geometry, width: 0 }), null);
  }
});

test("el puntero selecciona el nodo cercano y no crea nodos fuera del documento", () => {
  const grid = documentLayout({ width: 1000, height: 5000, dpr: 1.25 }, 1, 84.8125).lattice;
  for (const node of [{ col: 0, row: 0 }, { col: 3, row: 2 }, { col: grid.cols - 1, row: grid.rows - 1 }]) {
    const point = pointOf(grid, node.col, node.row);
    assert.deepEqual(nodeAt(grid, point.x, point.y), node);
    assert.deepEqual(nodeAt(grid, point.x + 3, point.y + 2), node);
  }
  const origin = pointOf(grid, 0, 0);
  assert.equal(nodeAt(grid, origin.x - grid.cell, origin.y), null);
  assert.equal(nodeAt(grid, origin.x, origin.y - grid.cell), null);
  const outside = pointOf(grid, grid.cols, grid.rows);
  assert.equal(nodeAt(grid, outside.x, outside.y), null);
  assert.equal(nodeAt(grid, origin.x + 6, origin.y, 5), null);
  assert.equal(nodeAt(grid, NaN, origin.y), null);
});

test("una medición inválida no produce una retícula inutilizable", () => {
  const device = { width: 800, height: 600, dpr: 1 };
  for (const field of ["width", "height", "dpr"] as const) {
    assert.throws(() => createLattice({ ...device, [field]: 0 }), RangeError, field);
    assert.throws(() => createLattice({ ...device, [field]: NaN }), RangeError, field);
  }
});

test("blueprint conecta todos los nodos mediante vecinos de la misma retícula", () => {
  const graph = createBlueprintGraph();
  assert.equal(graph.nodes.length, 63);
  assert.equal(graph.cell, 40);
  assert.equal(Math.max(...graph.nodes.map(n => n.radius)) / Math.min(...graph.nodes.map(n => n.radius)), 2.5);
  assert.equal(graph.edges.length, graph.nodes.length - 1);
  const reached = new Set(graph.nodes.filter(n => n.depth === 0).map(n => n.id));
  for (const edge of graph.edges) {
    const from = graph.nodes[edge.from]!;
    const to = graph.nodes[edge.to]!;
    assert.ok(reached.has(from.id));
    assert.ok(!reached.has(to.id));
    assert.equal(to.depth, from.depth + 1);
    assert.equal(Math.abs(from.x - to.x) + Math.abs(from.y - to.y), graph.cell);
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

test("el grid de contenido consume pistas de la retícula documental y conserva bordes sin desplazamiento", async () => {
  const { default: postcss } = await import("postcss");
  const sheet = postcss.parse(await readPublicStyles());
  const consumers = new Set<string>();
  sheet.walkRules(rule => {
    if (!rule.selector.includes("[data-document-grid]")) return;
    rule.walkDecls("grid-template-columns", decl => {
      assert.ok(decl.value.includes("--grid-tracks"), "No distribución fraccionaria independiente");
      for (const name of ["hero-copy", "project-grid", "work-type-body", "service-row"]) if (rule.selector.includes(name)) consumers.add(name);
    });
  });
  assert.equal(consumers.size, 4, "Los grids activos consumen las pistas publicadas por el único productor");
  const props = new Set<string>();
  sheet.walkRules(rule => {
    if (rule.selectors?.includes(".work-type-body")) rule.walkDecls(decl => { props.add(decl.prop); });
  });
  assert.ok(!props.has("border"), "Un borde desplazaría el contenido fuera de la retícula");
  assert.ok(props.has("box-shadow"));
});

test("densidad del 2% cuenta intersecciones reales sin padding ni dependencia del largo del documento", () => {
  for (const height of [1080, 1000000]) {
    const lattice = createLattice({ width: 1000, height, dpr: 1 }, { originX: 0, originY: 0 });
    const budget = documentActivity(lattice, 1000, 1000, 0, 0);
    assert.equal(budget.nodes, 26 * 26);
    assert.equal(budget.active, 14);
    assert.equal(createDocumentFlows(lattice, budget.firstRow, budget.lastRow, budget.active, 0, budget.firstCol, budget.lastCol).length, 14);
    assert.equal(documentActivity(lattice, 80, 80, 0, 0).active, 4);
    assert.equal(documentActivity(lattice, 1, 1, 0, 0).active, 1);
  }
  const large = createLattice({ width: 3840, height: 20000, dpr: 2 });
  assert.equal(documentActivity(large, 3840, 2160, 0, 0).active, 32);
  const classic = documentActivity(large, 1905, 1080, 0, 0), overlay = documentActivity(large, 1920, 1080, 0, 0);
  assert.ok(classic.nodes < overlay.nodes);
});

test("la propagación de puntero tiene coste acotado sin depender del alto documental", () => {
  for (const height of [1080, 1000000]) {
    const lattice = createLattice({ width: 3840, height, dpr: 2.475 });
    const origin = { col: 20, row: 10 };
    const graph = pointerNeighbourhood(lattice, origin);
    assert.equal(graph.nodes.length, 25);
    assert.equal(graph.edges.length, 24);
    assert.equal(new Set(graph.nodes.map(n => `${n.col}:${n.row}`)).size, 25);
    for (const n of graph.nodes) assert.equal(Math.abs(n.col - origin.col) + Math.abs(n.row - origin.row), n.depth);
    for (const e of graph.edges) assert.equal(Math.abs(e.from.col - e.to.col) + Math.abs(e.from.row - e.to.row), 1);
  }
});

test("la propagación respeta los bordes y rechaza orígenes inválidos", () => {
  const lattice = createLattice({ width: 320, height: 740, dpr: 1 });
  const graph = pointerNeighbourhood(lattice, { col: 0, row: 0 });
  assert.equal(graph.nodes.length, 10);
  assert.equal(graph.edges.length, 9);
  assert.ok(graph.nodes.every(n => n.col >= 0 && n.row >= 0));
  for (const col of [-1, NaN, Infinity, lattice.cols, .5]) assert.equal(pointerNeighbourhood(lattice, { col, row: 0 }).nodes.length, 0);
});


test("el fondo público usa solo el viewport y no proyecta el scroll documental", async () => {
  const source = await readFile("shared/BlueprintBackground.tsx", "utf8");
  const page = source.slice(source.indexOf('if (variant !== "page"'), source.indexOf('if (variant === "page" && element.closest'));
  assert.match(page, /createLattice\(\{ width, height, dpr:/);
  assert.match(page, /height = document.documentElement.clientHeight/);
  assert.match(page, /nodeAt\(grid.lattice, x, y, grid.metrics.pointerReach\)/);
  assert.doesNotMatch(page, /scrollHeight|scrollX|scrollY|subscribeDocumentGrid/);
  assert.match(page, /window.addEventListener\("resize", resize\)/);
  assert.match(page, /window.removeEventListener\("resize", resize\)/);
  const css = await readFile("shared/presentation.css", "utf8");
  assert.match(css, /\.blueprint-background\s*\{[^}]*position: fixed/s);
  assert.match(css, /\[data-layout="viewport"\] \.blueprint-plane\s*\{[^}]*inset: 0/s);
});

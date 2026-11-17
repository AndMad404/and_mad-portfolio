import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import Home from "../app/routes/home";
import { advanceEnergy, createEnergySystem, nodePower, linePower, LIGHT_COUNT, stimulateEnergyNode, releaseEnergyPointer, pointerPower, DOCUMENT_BOOT, documentReveal, createDocumentFlows, advanceDocumentFlows } from "../shared/BlueprintEnergy";
import { centeredBlockScroll, observeEnergySequences, activateSectionEnergy } from "../app/components/PageMotion";
import { createBlueprintGraph } from "../app/components/BlueprintBackground";
import { createHash } from "node:crypto";
import { createLattice } from "../shared/lattice";

test("el estándar de energía espera la descripción y no consume entradas interrumpidas", (t) => {
  class EnergyElement {
    dataset: Record<string, string> = {};
    energized = false;
    owner: EnergyElement = this;
    node?: EnergyElement;
    listener?: (event: AnimationEvent) => void;
    constructor(public role: string) {}
    ownerDocument = { querySelector: () => ({ getBoundingClientRect: () => ({ height: 100 }) }) };
    classList = { add: () => { this.energized = true; }, remove: () => { this.energized = false; } };
    matches(selector: string) { return selector === `[data-energy-${this.role}]`; }
    closest() { return this.owner; }
    querySelector() { return this.node; }
    addEventListener(_type: string, callback: (event: AnimationEvent) => void) { this.listener = callback; }
    removeEventListener() { this.listener = undefined; }
  }
  let observer: EnergyObserver;
  class EnergyObserver {
    observed = new Set<Element>();
    constructor(public callback: IntersectionObserverCallback, public options: IntersectionObserverInit) { observer = this; }
    observe(node: Element) { this.observed.add(node); }
    unobserve(node: Element) { this.observed.delete(node); }
    disconnect() { this.observed.clear(); }
    report(node: EnergyElement, ratio: number) {
      this.callback([{ target: node, isIntersecting: true, intersectionRatio: ratio } as unknown as IntersectionObserverEntry], this as unknown as IntersectionObserver);
    }
  }
  for (const [name, value] of Object.entries({ Element: EnergyElement, IntersectionObserver: EnergyObserver })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => { if (original) Object.defineProperty(globalThis, name, original); else Reflect.deleteProperty(globalThis, name); });
  }
  const row = new EnergyElement("sequence"), node = new EnergyElement("node"), description = new EnergyElement("description");
  row.node = node; node.owner = description.owner = row;
  const start = () => observeEnergySequences(row as unknown as HTMLElement);
  let cleanup = start();
  assert.ok(observer!.observed.has(node as unknown as Element), "Observe the connector, not the tall block");
  assert.equal(observer!.options.rootMargin, "-100px 0px -10% 0px");
  observer!.report(node, .59); assert.equal(row.energized, false);
  observer!.report(node, .6); assert.equal(row.energized, true);
  cleanup(); cleanup = start(); observer!.report(node, 1);
  assert.equal(row.energized, true, "An interrupted sequence can start again");
  row.listener!({ animationName: "energy-node-travel", target: node } as unknown as AnimationEvent);
  assert.equal(row.dataset.energyPlayed, undefined, "The point finishing is not the end of the sequence");
  row.listener!({ animationName: "energy-text-glow", target: description } as unknown as AnimationEvent);
  assert.equal(row.dataset.energyPlayed, "true");
  cleanup(); cleanup = start(); observer!.report(node, 1);
  assert.equal(row.energized, false, "A complete sequence runs once");
  cleanup(); assert.equal(row.listener, undefined); assert.equal(observer!.observed.size, 0);
});

test("el menú activo reproduce solo los nodos de su sección una vez por activación", () => {
  const makeRow = (id: string) => ({
    dataset: { energyPlayed: "true" } as Record<string, string>,
    starts: 0, resets: 0,
    closest: () => ({ id }),
    classList: { add: () => {}, remove: () => {} },
  });
  const services = [makeRow("servicios"), makeRow("servicios"), makeRow("servicios")];
  const projects = makeRow("proyectos");
  const rows = [...services, projects];
  for (const row of rows) row.classList = { add: () => { row.starts++; }, remove: () => { row.resets++; } };
  const makeSection = (id: string, children: typeof rows) => ({
    id, starts: 0, resets: 0, querySelectorAll: () => children,
    classList: { add: () => {}, remove: () => {} },
  });
  const sections = [makeSection("servicios", services), makeSection("proyectos", [projects]), makeSection("perfil", []), makeSection("contacto", [])];
  for (const section of sections) section.classList = { add: () => { section.starts++; }, remove: () => { section.resets++; } };
  const root = { dataset: {} as Record<string, string>, offsetWidth: 1200, querySelectorAll: () => sections } as unknown as HTMLElement;
  activateSectionEnergy(root, "servicios", false);
  assert.deepEqual(services.map(row => row.starts), [1, 1, 1]);
  assert.ok(services.every(row => !row.dataset.energyPlayed));
  assert.equal(projects.starts, 0);
  activateSectionEnergy(root, "servicios", false);
  assert.deepEqual(services.map(row => row.starts), [1, 1, 1], "Repeated active state cannot loop");
  activateSectionEnergy(root, "proyectos", false);
  assert.equal(projects.starts, 1);
  activateSectionEnergy(root, "servicios", false);
  assert.deepEqual(services.map(row => row.starts), [2, 2, 2], "Reactivating a section replays completed sequences");
  activateSectionEnergy(root, "perfil", false);
  assert.equal(projects.starts, 1, "A section without sequences does not animate another one");
  activateSectionEnergy(root, "proyectos", true);
  activateSectionEnergy(root, "proyectos", false);
  assert.equal(projects.starts, 1, "Reduced motion prevents playback, including preference restoration");
  activateSectionEnergy(root, "", false);
  assert.deepEqual(services.map(row => row.resets), [2, 2, 2]);
  activateSectionEnergy(root, "servicios", false);
  activateSectionEnergy(root, "servicios", false, true);
  assert.deepEqual(services.map(row => row.starts), [4, 4, 4], "Clicking the active menu item replays every service together");
  assert.equal(sections[0]!.starts, 4, "Section-wide class also activates decorative and bullet nodes");
  activateSectionEnergy(root, "perfil", false, true);
  assert.equal(sections[2]!.starts, 2, "Sections without title sequences still activate their own decorative nodes");
  activateSectionEnergy(root, "contacto", false);
  assert.equal(sections[3]!.starts, 1, "Footer sections use the same activation contract");
  activateSectionEnergy(root, "servicios", true, true);
  assert.deepEqual(services.map(row => row.starts), [4, 4, 4], "Explicit clicks also respect reduced motion");
});

test("servicios y encabezado de experiencia comparten el estándar de animación", () => {
  const router = createMemoryRouter([{ path: "/", element: createElement(Home) }]);
  try {
    const html = renderToStaticMarkup(createElement(RouterProvider, { router }));
    for (const attribute of ["data-energy-sequence", "data-energy-title", "data-energy-node"]) {
      assert.equal([...html.matchAll(new RegExp(`${attribute}="true"`, "g"))].length, 4, attribute);
    }
    assert.match(html, /<p data-energy-description="true">/);
    assert.match(html, /<li data-energy-description="true"/);
    assert.doesNotMatch(html, /class="section-heading work-heading"[^>]*data-reveal/);
  } finally { router.dispose(); }
});

test("blueprint ordena aparición, propagación y recorridos reproducibles de luces", () => {
  const graph = createBlueprintGraph();
  assert.equal(graph.nodes[31]!.delay, 0, "Origen central");
  assert.ok(graph.nodes[0]!.delay > graph.nodes[31]!.delay, "Encendido hacia afuera");
  assert.ok(Math.min(...graph.edges.map(e => e.delay)) > Math.max(...graph.nodes.map(n => n.delay)) + graph.nodeDuration);
  const incoming = new Map(graph.edges.map(edge => [edge.to, edge]));
  for (const edge of graph.edges) {
    const previous = incoming.get(edge.from);
    if (previous) assert.ok(edge.delay > previous.delay + graph.connectionDuration,
      "La propagación espera a que termine la conexión anterior");
  }
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

test("entrada documental ordena nodos, líneas, energía y finalmente puntero", () => {
  assert.ok(DOCUMENT_BOOT.nodesEnd < DOCUMENT_BOOT.linesEnd);
  assert.ok(DOCUMENT_BOOT.linesEnd < DOCUMENT_BOOT.energyStart);
  assert.ok(DOCUMENT_BOOT.energyStart < DOCUMENT_BOOT.pointerStart);
  for (const row of [0, 14, 1000000]) for (let col = 0; col < 100; col++) {
    assert.equal(documentReveal(0, col, row).node, 0);
    assert.equal(documentReveal(DOCUMENT_BOOT.nodesEnd, col, row).node, 1);
    assert.equal(documentReveal(DOCUMENT_BOOT.nodesEnd, col, row).line, 0);
    assert.equal(documentReveal(DOCUMENT_BOOT.linesEnd, col, row).line, 1);
  }
});

test("luces documentales acotadas siguen aristas reales sin colisiones ni máscaras de visibilidad", () => {
  const lattice = createLattice({ width: 3840, height: 1000000, dpr: 1.5 });
  const flows = createDocumentFlows(lattice, 100, 130, 9999, 1600);
  assert.equal(flows.length, 32);
  for (let time = 1600; time < 30000; time += 16) {
    advanceDocumentFlows(flows, lattice, time);
    const claimed = new Set<string>();
    for (const flow of flows) {
      assert.ok(Math.abs(flow.from.col - flow.to.col) + Math.abs(flow.from.row - flow.to.row) <= 1);
      for (const key of new Set([`${flow.from.col}:${flow.from.row}`, `${flow.to.col}:${flow.to.row}`])) {
        assert.ok(!claimed.has(key), `colisión en ${key} a ${time}`); claimed.add(key);
      }
      for (const n of [flow.from, flow.to]) assert.ok(n.col >= 0 && n.row >= 0 && n.col < lattice.cols && n.row < lattice.rows);
    }
  }
});

type TraceCase = { width: number; height: number; seed: number; lights: number };

/** Legacy phase=0 trace. Explicit light count prevents budget changes weakening G2.
 * Every 16 ms includes all light/line/pointer states and node/line power outputs.
 */
function captureEnergyTrace(config: TraceCase): string {
  let seed = config.seed >>> 0;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const system = createEnergySystem(config.width, config.height, random, 0);
  if (config.lights !== 16 || LIGHT_COUNT !== config.lights || system.lights.length !== config.lights)
    throw new RangeError("G2 requires the legacy reference of exactly 16 lights");
  const hash = createHash("sha256");
  const append = (value: unknown) => hash.update(JSON.stringify(value, (_key, item) =>
    typeof item === "number" && !Number.isFinite(item) ? String(item) : item) + "\n");
  append({ ...config, phaseX: 0, phaseY: 0, columns: system.columns, rows: system.rows,
    quadrants: system.quadrants, nodes: system.nodes.map(({ id, x, y, large, born }) => ({ id, x, y, large, born })) });
  const center = Math.floor(system.rows / 2) * system.columns + Math.floor(system.columns / 2);
  for (let time = 0; time <= 12000; time += 16) {
    const actions: unknown[] = [];
    if (time === 0 || time === 480 || time === 496 || time === 2000)
      actions.push(["stimulate", stimulateEnergyNode(system, time === 2000 ? center + 1 : center, time)]);
    if (time === 1248 || time === 2496) { releaseEnergyPointer(system, time); actions.push(["release"]); }
    const stimulation = time >= 3200 ? Math.exp(-(time - 3200) / 550) : 0;
    advanceEnergy(system, time, time ? 16 : 0, stimulation);
    append({ time, actions, turn: system.turn, seed, lights: system.lights,
      nodes: system.nodes.map(node => [node.id, node.hit, nodePower(time, node.hit)]),
      lines: [...system.lines].map(([id, line]) => [id, line, linePower(time, line.hit)]),
      pointerNodes: [...system.pointerNodes].map(([id, glow]) => [id, glow, pointerPower(time, glow.hit, glow.releasedAt)]),
      pointerLines: [...system.pointerLines].map(([id, glow]) => [id, glow, pointerPower(time, glow.hit, glow.releasedAt)]),
      bursts: system.bursts });
  }
  return hash.digest("hex");
}

// Captured from the unchanged legacy engine before renderer/probe integration.
// This freezes a reference; it does not certify browser frame/performance gates.
const references = [
  { width: 1000, height: 1000, seed: 173, lights: 16, digest: "7fb2600945ceb8e15729a5593a95ae8bcb4ae13805c262f92f74d747471f2c44" },
  { width: 1920, height: 1080, seed: 404, lights: 16, digest: "456b8a155407b6f6061f4eeabc9cd913a0d6d228189ea4968b24f57a88baefca" },
  { width: 360, height: 740, seed: 2026, lights: 16, digest: "407431f1531663014b610c3784a84645c5170805686b3cc8b13578bcd7865f8f" },
];

for (const { digest, ...config } of references) {
  test(`G2 legacy trace ${config.width}x${config.height}, seed ${config.seed}, 16 lights`, () => {
    assert.equal(captureEnergyTrace(config), digest,
      "Animation trace changed: investigate before altering the approved reference");
  });
}

test("G2 cannot silently switch the reference to a density-based budget", () => {
  assert.throws(() => captureEnergyTrace({ width: 1000, height: 1000, seed: 173, lights: 8 }), RangeError);
});

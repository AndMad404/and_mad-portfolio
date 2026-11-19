import { CELL, createLattice, pointOf, type Lattice, type NodeRef } from "./lattice";

export const POINTER_PULSE = {
  depth: 3,
  stepMs: 180,
  fadeMs: 450,
} as const;

export const DOCUMENT_BOOT = { nodesEnd: 900, linesEnd: 1500, energyStart: 1600, pointerStart: 2300 } as const;
export const DOCUMENT_ACTIVE_RATIO = .02;

const documentRevealTiming = {
  nodeDurationMs: 420,
  nodeStaggerMs: 30,
  staggerSlots: 17,
  columnStride: 13,
  rowStride: 7,
} as const;

const documentFlow = {
  minLights: 4,
  maxLights: 32,
  baseDurationMs: 700,
  durationSlots: 5,
  durationStepMs: 95,
  initialSeed: 173,
} as const;

export const PANEL_ENERGY = {
  revealMs: 450,
  energyStartMs: 1900,
  staticFrameMs: 2000,
  radialRevealMs: 1200,
  revealJitterMs: 80,
  smallHitRadiusPx: 12,
  largeHitRadiusPx: 16,
  nodeRiseMs: 180,
  nodeHoldMs: 800,
  nodeDecayMs: 4200,
  lineDecayMs: 3200,
  baseTravelMs: 650,
  travelJitterMs: 550,
  retryMs: 120,
  retryJitterMs: 180,
  stimulationSpeedGain: .35,
  maxBursts: 192,
} as const;

/** A bounded Manhattan neighbourhood: at most 25 nodes and 24 edges, at any document size. */
export function pointerNeighbourhood(lattice: Lattice, origin: NodeRef) {
  const nodes: { col: number; row: number; depth: number }[] = [];
  const edges: { from: NodeRef; to: NodeRef; depth: number }[] = [];
  if (!Number.isInteger(origin.col) || !Number.isInteger(origin.row) || origin.col < 0 || origin.row < 0 || origin.col >= lattice.cols || origin.row >= lattice.rows) return { nodes, edges };
  const seen = new Set([`${origin.col}:${origin.row}`]);
  nodes.push({ ...origin, depth: 0 });
  for (let i = 0; i < nodes.length; i++) {
    const from = nodes[i]!;
    if (from.depth === POINTER_PULSE.depth) continue;
    for (const [col, row] of [[from.col + 1, from.row], [from.col - 1, from.row], [from.col, from.row + 1], [from.col, from.row - 1]]) {
      const key = `${col}:${row}`;
      if (col! < 0 || row! < 0 || col! >= lattice.cols || row! >= lattice.rows || seen.has(key)) continue;
      seen.add(key);
      const to = { col: col!, row: row! };
      nodes.push({ ...to, depth: from.depth + 1 });
      edges.push({ from, to, depth: from.depth });
    }
  }
  return { nodes, edges };
}
export const ENERGY_CELL = CELL;
export const LIGHTS_PER_QUADRANT = 4;
export const LIGHT_COUNT = 4 * LIGHTS_PER_QUADRANT;
/** Bounded reveal independent of document length; identical coordinates keep their delay. */
export function documentReveal(time: number, col: number, row: number) {
  const { columnStride, rowStride, staggerSlots, nodeStaggerMs, nodeDurationMs } = documentRevealTiming;
  const delay = ((col * columnStride + row * rowStride) % staggerSlots) * nodeStaggerMs;
  const lineDurationMs = DOCUMENT_BOOT.linesEnd - DOCUMENT_BOOT.nodesEnd;
  return { node: energyEase((time - delay) / nodeDurationMs), line: energyEase((time - DOCUMENT_BOOT.nodesEnd) / lineDurationMs) };
}
export type DocumentFlow = { from: NodeRef; to: NodeRef; previous: string; start: number; duration: number; seed: number };
/** Count actual viewport intersections, including occluded nodes, excluding padding capacity. */
export function documentActivity(lattice: Lattice, width: number, height: number, x: number, y: number) {
  const firstCol = Math.max(0, Math.ceil((x - lattice.phaseX) / lattice.cell));
  const lastCol = Math.min(lattice.cols - 1, Math.floor((x + width - lattice.phaseX) / lattice.cell));
  const firstRow = Math.max(0, Math.ceil((y - lattice.phaseY) / lattice.cell));
  const lastRow = Math.min(lattice.rows - 1, Math.floor((y + height - lattice.phaseY) / lattice.cell));
  const nodes = Math.max(0, lastCol - firstCol + 1) * Math.max(0, lastRow - firstRow + 1);
  const active = Math.min(nodes, documentFlow.maxLights, Math.max(documentFlow.minLights, Math.round(nodes * DOCUMENT_ACTIVE_RATIO)));
  return { firstCol, lastCol, firstRow, lastRow, nodes, active };
}
const nodeKey = (node: NodeRef) => `${node.col}:${node.row}`;
export function createDocumentFlows(lattice: Lattice, firstRow: number, lastRow: number, count: number, time: number, firstCol = 0, lastCol = lattice.cols - 1): DocumentFlow[] {
  const flows: DocumentFlow[] = [];
  const columns = Math.max(0, lastCol - firstCol + 1), capacity = columns * Math.max(0, lastRow - firstRow + 1);
  const lights = Math.min(documentFlow.maxLights, capacity, Math.max(0, Math.floor(count)));
  for (let i = 0; i < lights; i++) {
    const index = Math.floor(i * capacity / lights);
    const from = { col: firstCol + index % columns, row: firstRow + Math.floor(index / columns) };
    const duration = documentFlow.baseDurationMs + i % documentFlow.durationSlots * documentFlow.durationStepMs;
    flows.push({ from, to: from, previous: "", start: time, duration, seed: i + documentFlow.initialSeed });
  }
  return flows;
}
/** Only the capped lights are advanced, including those behind opaque content. */
export function advanceDocumentFlows(flows: DocumentFlow[], lattice: Lattice, time: number) {
  for (const flow of flows) if (nodeKey(flow.from) !== nodeKey(flow.to) && time - flow.start >= flow.duration) {
    flow.previous = nodeKey(flow.from); flow.from = flow.to;
  }
  const occupied = new Set(flows.flatMap(flow => [nodeKey(flow.from), nodeKey(flow.to)]));
  for (const flow of flows) {
    if (nodeKey(flow.from) !== nodeKey(flow.to)) continue;
    const { col, row } = flow.from;
    const candidates = [{ col: col + 1, row }, { col, row: row + 1 }, { col: col - 1, row }, { col, row: row - 1 }]
      .filter(n => n.col >= 0 && n.row >= 0 && n.col < lattice.cols && n.row < lattice.rows && !occupied.has(nodeKey(n)));
    const forward = candidates.filter(n => nodeKey(n) !== flow.previous);
    const choices = forward.length ? forward : candidates;
    if (!choices.length) continue;
    flow.seed = (Math.imul(flow.seed, 1664525) + 1013904223) >>> 0;
    flow.to = choices[flow.seed % choices.length]!; flow.start = time;
    occupied.add(nodeKey(flow.to));
  }
}
export function energyEase(t: number) { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); }
export function nodePower(time: number, hit: number) {
  const age = time - hit;
  return !Number.isFinite(age) || age < 0 ? 0 : energyEase(age / PANEL_ENERGY.nodeRiseMs) * Math.exp(-Math.max(0, age - PANEL_ENERGY.nodeHoldMs) / PANEL_ENERGY.nodeDecayMs);
}
export function linePower(time: number, hit: number) {
  return Math.exp(-Math.max(0, time - hit) / PANEL_ENERGY.lineDecayMs);
}
export function pointerPower(time: number, hit: number, releasedAt: number) {
  return energyEase((time - hit) / POINTER_PULSE.stepMs) * (1 - energyEase((time - releasedAt) / POINTER_PULSE.fadeMs));
}
export function createEnergySystem(width: number, height: number, random = Math.random, padding = 0) {
  const lattice = createLattice({ width, height, dpr: 1 }, { originX: 0, originY: 0, bucket: 1 });
  const columns = lattice.cols, rows = lattice.rows;
  const diagonal = Math.hypot(width, height) / 2 || 1;
  const nodes = Array.from({ length: columns * rows }, (_, id) => {
    const { x, y } = pointOf(lattice, id % columns, Math.floor(id / columns));
    return { id, x, y, large: x % (ENERGY_CELL * 2) === 0 && y % (ENERGY_CELL * 2) === 0, hit: -Infinity,
      born: Math.hypot(x - width / 2, y - height / 2) / diagonal * PANEL_ENERGY.radialRevealMs + random() * PANEL_ENERGY.revealJitterMs };
  });
  const insetX = Math.min(Math.ceil(padding / ENERGY_CELL), Math.floor(columns / 2) - 1);
  const insetY = Math.min(Math.ceil(padding / ENERGY_CELL), Math.floor(rows / 2) - 1);
  const quadrants = Array.from({ length: 4 }, (_, id) => ({
    left: id % 2 === 0 ? insetX : Math.floor(columns / 2),
    right: id % 2 === 0 ? Math.floor(columns / 2) - 1 : columns - 1 - insetX,
    top: id < 2 ? insetY : Math.floor(rows / 2),
    bottom: id < 2 ? Math.floor(rows / 2) - 1 : rows - 1 - insetY,
  }));
  function next(from: number, previous: number, quadrant: number, occupied: ReadonlySet<number> = new Set()) {
    const x = from % columns, y = Math.floor(from / columns);
    const bounds = quadrants[quadrant]!;
    const neighbors = [x > bounds.left ? from - 1 : -1, x < bounds.right ? from + 1 : -1,
      y > bounds.top ? from - columns : -1, y < bounds.bottom ? from + columns : -1].filter(id => id >= 0 && !occupied.has(id));
    let choices = neighbors.filter(id => id !== previous);
    if (!choices.length) choices = neighbors.length ? neighbors : [from];
    return choices[Math.floor(random() * choices.length)]!;
  }
  const lights = quadrants.flatMap((bounds, quadrant) => {
    const diagonal = random() < .5;
    const corners = diagonal
      ? [[bounds.left, bounds.top], [bounds.right, bounds.bottom], [bounds.left, bounds.bottom], [bounds.right, bounds.top]]
      : [[bounds.left, bounds.bottom], [bounds.right, bounds.top], [bounds.left, bounds.top], [bounds.right, bounds.bottom]];
    // Very narrow surfaces may have fewer than four distinct corners.
    const starts = [...new Set(corners.map(([x, y]) => y! * columns + x!))];
    return starts.slice(0, LIGHTS_PER_QUADRANT).map(from => {
      return { quadrant, from, to: from, previous: -1, retryAt: 0,
        progress: 0, duration: PANEL_ENERGY.baseTravelMs + random() * PANEL_ENERGY.travelJitterMs };
    });
  });
  return { nodes, lights, columns, rows, quadrants, next, random, turn: 0,
    bursts: [] as { from: number; to: number; start: number }[],
    pointerNodes: new Map<number, { hit: number; releasedAt: number }>(),
    pointerLines: new Map<string, { from: number; to: number; progress: number; hit: number; releasedAt: number }>(),
    lines: new Map<string, { from: number; to: number; progress: number; hit: number }>() };
}
type EnergySystem = ReturnType<typeof createEnergySystem>;

/** Pick an already revealed node with a small hover margin, in canvas CSS coordinates. */
export function energyNodeAt(system: EnergySystem, x: number, y: number, time: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  const col = Math.round(x / ENERGY_CELL), row = Math.round(y / ENERGY_CELL);
  if (col < 0 || row < 0 || col >= system.columns || row >= system.rows) return null;
  const node = system.nodes[row * system.columns + col]!;
  return time >= node.born + PANEL_ENERGY.revealMs && Math.hypot(x - node.x, y - node.y) <= (node.large ? PANEL_ENERGY.largeHitRadiusPx : PANEL_ENERGY.smallHitRadiusPx) ? node : null;
}

export function releaseEnergyPointer(system: EnergySystem, time: number) {
  system.bursts = [];
  for (const glow of [...system.pointerNodes.values(), ...system.pointerLines.values()]) {
    if (glow.releasedAt === Infinity) glow.releasedAt = time;
  }
}

/** Hover energy has its own lifetime, independent of the automatic lights. */
export function stimulateEnergyNode(system: EnergySystem, id: number, time: number) {
  const origin = system.nodes[id];
  if (!origin || time < origin.born + PANEL_ENERGY.revealMs || system.pointerNodes.get(id)?.releasedAt === Infinity) return false;
  releaseEnergyPointer(system, time);
  system.pointerNodes.set(id, { hit: time, releasedAt: Infinity });
  const seen = new Set([id]);
  const queue = [{ id, depth: 0 }];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index]!;
    if (current.depth >= POINTER_PULSE.depth) continue;
    const col = current.id % system.columns, row = Math.floor(current.id / system.columns);
    const neighbors = [col > 0 ? current.id - 1 : -1, col < system.columns - 1 ? current.id + 1 : -1,
      row > 0 ? current.id - system.columns : -1, row < system.rows - 1 ? current.id + system.columns : -1];
    for (const to of neighbors) {
      if (to < 0 || seen.has(to)) continue;
      seen.add(to);
      queue.push({ id: to, depth: current.depth + 1 });
      system.bursts.push({ from: current.id, to, start: time + current.depth * POINTER_PULSE.stepMs });
    }
  }
  // Bound work even when the pointer crosses many nodes in quick succession.
  system.bursts = system.bursts.slice(-PANEL_ENERGY.maxBursts);
  return true;
}

export function advanceEnergy(system: ReturnType<typeof createEnergySystem>, time: number, delta: number, stimulation = 0) {
  for (const [id, glow] of system.pointerNodes) if (time >= glow.releasedAt + POINTER_PULSE.fadeMs) system.pointerNodes.delete(id);
  for (const [id, glow] of system.pointerLines) if (time >= glow.releasedAt + POINTER_PULSE.fadeMs) system.pointerLines.delete(id);
  system.bursts = system.bursts.filter(burst => {
    if (time < burst.start) return true;
    const progress = energyEase((time - burst.start) / POINTER_PULSE.stepMs);
    const key = [burst.from, burst.to].sort((a, b) => a - b).join(":");
    system.pointerLines.set(key, { from: burst.from, to: burst.to, progress, hit: burst.start, releasedAt: Infinity });
    if (progress < 1) return true;
    system.pointerNodes.set(burst.to, { hit: time, releasedAt: Infinity });
    return false;
  });
  if (time < PANEL_ENERGY.energyStartMs) return;
  for (const light of system.lights) {
    if (light.from === light.to) continue;
    light.progress = Math.min(1, light.progress + delta / light.duration * (1 + stimulation * PANEL_ENERGY.stimulationSpeedGain));
    const key = [light.from, light.to].sort((a, b) => a - b).join(":");
    const existing = system.lines.get(key);
    if (!existing || existing.progress < 1) system.lines.set(key, {
      from: light.from, to: light.to, progress: energyEase(light.progress), hit: time,
    });
    else existing.hit = time;
    if (light.progress >= 1) {
      system.nodes[light.to]!.hit = time;
      light.previous = light.from; light.from = light.to;
      light.to = light.from;
      light.progress = 0;
    }
  }
  // Reserve both endpoints until arrival: this also excludes head-on traffic
  // and two lights choosing the same intersection, without moving off-grid.
  const occupied = new Set(system.lights.flatMap(light => [light.from, light.to]));
  for (let index = 0; index < system.lights.length; index++) {
    const light = system.lights[(system.turn + index) % system.lights.length]!;
    if (light.from !== light.to || time < light.retryAt) continue;
    light.to = system.next(light.from, light.previous, light.quadrant, occupied);
    if (light.to === light.from) {
      light.retryAt = time + PANEL_ENERGY.retryMs + system.random() * PANEL_ENERGY.retryJitterMs;
      continue;
    }
    occupied.add(light.to);
    light.duration = PANEL_ENERGY.baseTravelMs + system.random() * PANEL_ENERGY.travelJitterMs;
  }
  // Rotate priority so a waiting light is not always last to claim a route.
  system.turn = (system.turn + 1) % system.lights.length;
}

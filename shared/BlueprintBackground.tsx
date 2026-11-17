import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "./motion";
import { canvasPointAt, nodeAt } from "./lattice";
import { pointOf } from "./lattice";
import { createLattice, viewportGridMetrics } from "./lattice";
import { ENERGY_CELL, advanceEnergy, createEnergySystem, energyEase, nodePower, linePower, energyNodeAt, stimulateEnergyNode, releaseEnergyPointer, pointerPower, pointerNeighbourhood, DOCUMENT_BOOT, documentReveal, documentActivity, createDocumentFlows, advanceDocumentFlows, type DocumentFlow } from "./BlueprintEnergy";

const CELL = ENERGY_CELL;
const NODE_DURATION = 350;
const CONNECTION_DURATION = 260;
export function createBlueprintGraph(columns = 9, rows = 7, seed = 173) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 2 || columns * rows > 400) {
    throw new Error("Blueprint grid must contain 2–400 nodes with at least two rows and columns");
  }
  let randomState = seed >>> 0;
  const random = () => { randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0; return randomState / 4294967296; };
  const centerCol = Math.floor(columns / 2);
  const centerRow = Math.floor(rows / 2);
  const start = centerRow * columns + centerCol;
  const depth = new Map<number, number>([[start, 0]]);
  const queue = [start];
  const parents: { from: number; to: number }[] = [];
  for (let index = 0; index < queue.length; index++) {
    const from = queue[index]!;
    const col = from % columns;
    const row = Math.floor(from / columns);
    const neighbors = [[col + 1, row], [col, row + 1], [col - 1, row], [col, row - 1]]
      .map(point => ({ point, order: random() })).sort((a, b) => a.order - b.order);
    for (const { point: [x, y] } of neighbors) {
      if (x! < 0 || x! >= columns || y! < 0 || y! >= rows) continue;
      const to = y! * columns + x!;
      if (depth.has(to)) continue;
      depth.set(to, depth.get(from)! + 1);
      parents.push({ from, to });
      queue.push(to);
    }
  }
  const nodes = Array.from({ length: columns * rows }, (_, id) => ({
    id, x: (id % columns) * CELL, y: Math.floor(id / columns) * CELL,
    depth: depth.get(id)!, delay: Math.hypot(id % columns - centerCol, Math.floor(id / columns) - centerRow) * 70,
    radius: (id % columns) % 2 === 0 && Math.floor(id / columns) % 2 === 0 ? 10 : 4,
  }));
  // Reveal the lattice along both axes, then propagate connections from each reached node.
  const nodesReady = Math.max(...nodes.map(node => node.delay)) + NODE_DURATION;
  const ready = new Map<number, number>([[start, nodesReady + 150]]);
  const branches = new Map<number, number>();
  const edges = parents.map(({ from, to }) => {
    const branch = branches.get(from) ?? 0;
    branches.set(from, branch + 1);
    const delay = ready.get(from)! + 25 + branch * 35;
    ready.set(to, delay + CONNECTION_DURATION);
    return { from, to, delay };
  });
  const adjacent = new Map(nodes.map(node => [node.id, [] as number[]]));
  for (const edge of edges) { adjacent.get(edge.from)!.push(edge.to); adjacent.get(edge.to)!.push(edge.from); }
  const signals = Array.from({ length: 4 }, (_, id) => {
    let current = Math.floor(random() * nodes.length);
    let previous = -1;
    const route = [current];
    for (let step = 0; step < 8; step++) {
      const candidates = adjacent.get(current)!.filter(next => next !== previous);
      const choices = candidates.length ? candidates : adjacent.get(current)!;
      const next = choices[Math.floor(random() * choices.length)]!;
      previous = current; current = next; route.push(current);
    }
    return { id, route, path: route.map((node, i) => `${i ? "L" : "M"}${nodes[node]!.x} ${nodes[node]!.y}`).join(""),
      duration: 5500 + Math.round(random() * 3000), delay: 4400 + id * 370 };
  });
  return { nodes, edges, signals, cell: CELL, nodeDuration: NODE_DURATION, connectionDuration: CONNECTION_DURATION };
}
const graph = createBlueprintGraph();

/** Decorative, deterministic SVG; all editorial content stays in normal HTML. */
export function BlueprintBackground({ paused = false, variant = "page" }: {
  paused?: boolean;
  variant?: "page" | "cover";
}) {
  const pattern = useId();
  const plane = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    if (variant === "cover") return;
    const update = () => setVisible(document.visibilityState !== "hidden");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [variant]);
  useEffect(() => {
    const element = plane.current, surface = canvas.current;
    if (variant !== "page" || !element?.closest(".public-site") || !surface) return;
    const context = surface.getContext("2d");
    if (!context) return;
    let grid: { lattice: ReturnType<typeof createLattice>; width: number; height: number;
      metrics: ReturnType<typeof viewportGridMetrics> } | null = null;
    let frame: number | null = null;
    const host = element.parentElement!;
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const base = document.createElement("canvas");
    const baseContext = base.getContext("2d")!;
    let dirty = true, disposed = false, ready = false, bootFinished = false;
    let latest: { x: number; y: number } | null = null;
    let pulse: { key: string; start: number; released: number; graph: ReturnType<typeof pointerNeighbourhood> } | null = null;
    let inputFrame: number | null = null, gateFrame: number | null = null;
    let sprite: HTMLCanvasElement | null = null;
    let clock = 0, previous = 0;
    let flows: DocumentFlow[] = [], flowBand = "";
    let activity: ReturnType<typeof documentActivity> | null = null;
    const trails = new Map<string, { from: { col: number; row: number }; to: { col: number; row: number }; hit: number; progress: number }>();
    function ensureSprite() {
      if (sprite) return sprite;
      sprite = document.createElement("canvas"); sprite.width = sprite.height = 64;
      const brush = sprite.getContext("2d")!, glow = brush.createRadialGradient(32, 32, 0, 32, 32, 32);
      glow.addColorStop(0, "#eafaff"); glow.addColorStop(.3, "#87ceeb"); glow.addColorStop(1, "rgba(70,130,180,0)");
      brush.fillStyle = glow; brush.fillRect(0, 0, 64, 64);
      return sprite;
    }
    function light(x: number, y: number, alpha: number, radius = 10) {
      context!.globalAlpha = alpha;
      context!.drawImage(ensureSprite(), x - radius, y - radius, radius * 2, radius * 2);
    }
    host.dataset.interaction = "waiting";
    host.dataset.layout = "viewport";
    function paint(now: number) {
      frame = null;
      if (!grid) return;
      const width = document.documentElement.clientWidth, height = document.documentElement.clientHeight;
      // Layout can collapse between resize and this frame. Wait for resize to resume.
      if (width <= 0 || height <= 0) { previous = 0; dirty = true; return; }
      const ratio = window.devicePixelRatio || 1;
      const pixelWidth = Math.max(1, Math.round(width * ratio)), pixelHeight = Math.max(1, Math.round(height * ratio));
      const moving = !query.matches && !pausedRef.current && document.visibilityState !== "hidden";
      if (moving) clock += previous ? Math.max(0, Math.min(64, now - previous)) : 0;
      previous = moving ? now : 0;
      const bootTime = query.matches ? DOCUMENT_BOOT.pointerStart : clock;
      if (!bootFinished) { dirty = true; bootFinished = bootTime >= DOCUMENT_BOOT.linesEnd; }
      host.dataset.phase = bootTime < DOCUMENT_BOOT.nodesEnd ? "nodes" : bootTime < DOCUMENT_BOOT.linesEnd ? "lines" : bootTime < DOCUMENT_BOOT.energyStart ? "settling" : "energy";
      host.dataset.interaction = ready && bootTime >= DOCUMENT_BOOT.pointerStart ? "ready" : "waiting";
      if (surface!.width !== pixelWidth || surface!.height !== pixelHeight) { surface!.width = pixelWidth; surface!.height = pixelHeight; }
      context!.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
      if (dirty || base.width !== pixelWidth || base.height !== pixelHeight) {
      base.width = pixelWidth; base.height = pixelHeight;
      baseContext.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);
      // The fixed field is rasterized on resize and startup, independent of document scroll.
      baseContext.clearRect(0, 0, width, height);
      const { lattice } = grid;
      const firstCol = Math.max(0, Math.ceil((-lattice.phaseX) / lattice.cell));
      const lastCol = Math.min(lattice.cols - 1, Math.floor((width - lattice.phaseX) / lattice.cell));
      const firstRow = Math.max(0, Math.ceil((-lattice.phaseY) / lattice.cell));
      const lastRow = Math.min(lattice.rows - 1, Math.floor((height - lattice.phaseY) / lattice.cell));
      baseContext.strokeStyle = "rgba(138,156,168,.16)"; baseContext.lineWidth = 1;
      const reveal = documentReveal(bootTime, 0, 0).line;
      baseContext.beginPath();
      for (let col = firstCol; col <= lastCol; col++) {
        const x = pointOf(lattice, col, 0).x;
        baseContext.moveTo(x, 0); baseContext.lineTo(x, height * reveal);
      }
      for (let row = firstRow; row <= lastRow; row++) {
        const y = pointOf(lattice, 0, row).y;
        baseContext.moveTo(0, y); baseContext.lineTo(width * reveal, y);
      }
      baseContext.stroke(); baseContext.fillStyle = "rgba(135,206,235,.6)";
      for (let row = firstRow; row <= lastRow; row++) for (let col = firstCol; col <= lastCol; col++) {
        const point = pointOf(lattice, col, row);
        baseContext.globalAlpha = documentReveal(bootTime, col, row).node;
        baseContext.beginPath(); baseContext.arc(point.x, point.y,
          col % 2 === 0 && row % 2 === 0 ? grid.metrics.majorRadius : grid.metrics.nodeRadius,
          0, Math.PI * 2); baseContext.fill();
      }
      baseContext.globalAlpha = 1;
      dirty = false;
      }
      context!.clearRect(0, 0, width, height);
      context!.drawImage(base, 0, 0, width, height);
      if (moving && clock >= DOCUMENT_BOOT.energyStart) {
        const { lattice } = grid;
        activity ??= documentActivity(lattice, width, height, 0, 0);
        const { firstCol, lastCol, firstRow, lastRow, nodes, active } = activity;
        const band = `${lattice.cols}:${lattice.rows}:${firstCol}:${lastCol}:${lastRow - firstRow}:${active}:${Math.floor(firstRow / Math.max(1, lastRow - firstRow + 1))}`;
        if (flowBand !== band) {
          flowBand = band; trails.clear();
          flows = createDocumentFlows(lattice, firstRow, lastRow, active, clock, firstCol, lastCol);
        }
        advanceDocumentFlows(flows, lattice, clock);
        context!.strokeStyle = "#4682b4"; context!.lineWidth = 1.3;
        for (const flow of flows) {
          const t = energyEase((clock - flow.start) / flow.duration);
          const a = pointOf(lattice, flow.from.col, flow.from.row), b = pointOf(lattice, flow.to.col, flow.to.row);
          const key = `${flow.from.col}:${flow.from.row}:${flow.to.col}:${flow.to.row}`;
          trails.set(key, { from: flow.from, to: flow.to, hit: clock, progress: t });
          light(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, .95, 8);
        }
        for (const [key, trail] of trails) {
          const alpha = Math.max(0, 1 - (clock - trail.hit) / 1800);
          if (!alpha || trails.size > 128) { trails.delete(key); continue; }
          const a = pointOf(lattice, trail.from.col, trail.from.row), b = pointOf(lattice, trail.to.col, trail.to.row);
          context!.globalAlpha = alpha * .6;
          context!.beginPath(); context!.moveTo(a.x, a.y);
          context!.lineTo(a.x + (b.x - a.x) * trail.progress, a.y + (b.y - a.y) * trail.progress); context!.stroke();
          light(a.x, a.y, alpha * .65, 6);
        }
        context!.globalAlpha = 1;
        host.dataset.energyLights = String(flows.length);
        host.dataset.viewportNodes = String(nodes);
        host.dataset.activeRatio = "0.02";
      }
      if (pulse && ready && !query.matches && !pausedRef.current && document.visibilityState !== "hidden") {
        const age = now - pulse.start;
        const alpha = Math.max(0, Math.min(1, 1 - (now - pulse.released) / 450));
        context!.globalAlpha = alpha;
        context!.strokeStyle = "#87ceeb"; context!.lineWidth = 1.5;
        for (const edge of pulse.graph.edges) {
          const t = energyEase((age - edge.depth * 180) / 180);
          if (!t) continue;
          const a = pointOf(grid.lattice, edge.from.col, edge.from.row), b = pointOf(grid.lattice, edge.to.col, edge.to.row);
          context!.beginPath(); context!.moveTo(a.x, a.y);
          context!.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t); context!.stroke();
        }
        for (const node of pulse.graph.nodes) {
          const t = energyEase((age - node.depth * 180) / 180);
          if (!t) continue;
          const p = pointOf(grid.lattice, node.col, node.row), x = p.x, y = p.y;
          context!.globalAlpha = alpha * t;
          context!.drawImage(ensureSprite(), x - 10, y - 10, 20, 20);
        }
        context!.globalAlpha = 1;
        if (alpha === 0) pulse = null;
        else if (age < 720 || pulse.released !== Infinity) schedule();
      }
      if (moving) schedule();
      host.dataset.gridOriginX = String(grid.lattice.phaseX); host.dataset.gridOriginY = String(grid.lattice.phaseY);
      host.dataset.gridColumns = String(grid.lattice.cols); host.dataset.gridRows = String(grid.lattice.rows);
      host.dataset.gridCell = String(grid.lattice.cell);
      host.dataset.gridContentHeight = String(grid.height); host.dataset.runtime = "ready";
    }
    function schedule() { if (frame === null) frame = requestAnimationFrame(paint); }
    function release() {
      delete surface!.dataset.pointerNode;
      if (pulse && pulse.released === Infinity) { pulse.released = performance.now(); schedule(); }
    }
    function hitPointer() {
      inputFrame = null;
      if (!ready || clock < DOCUMENT_BOOT.pointerStart || !grid || !latest || query.matches || pausedRef.current || document.visibilityState === "hidden") { release(); return; }
      const { x, y } = latest;
      if (x < 0 || y < 0 || x >= document.documentElement.clientWidth || y >= document.documentElement.clientHeight || document.querySelector("dialog[open]")) { release(); return; }
      // A 44px square at the default root size, independent of visible node size.
      const node = nodeAt(grid.lattice, x, y, grid.metrics.pointerReach);
      if (!node) { release(); return; }
      const p = pointOf(grid.lattice, node.col, node.row);
      const hit = document.elementFromPoint(p.x, p.y);
      // Occlusion belongs to the paper renderer. Hidden nodes still conduct energy.
      if (hit?.closest("dialog,button,input,textarea,a")) { release(); return; }
      const key = `${node.col}:${node.row}`;
      if (pulse?.key === key && pulse.released === Infinity) return;
      pulse = { key, start: performance.now(), released: Infinity, graph: pointerNeighbourhood(grid.lattice, node) };
      surface!.dataset.pointerNode = key; schedule();
    }
    function move(event: PointerEvent) {
      if (!event.isPrimary || (event.pointerType !== "mouse" && !event.buttons)) return;
      latest = { x: event.clientX, y: event.clientY };
      if (inputFrame === null) inputFrame = requestAnimationFrame(hitPointer);
    }
    function down(event: PointerEvent) {
      move(event);
      // Background gestures may own a node; content retains native selection and controls.
      if (!event.isPrimary || event.button !== 0 || !ready || query.matches) return;
      if (inputFrame !== null) { cancelAnimationFrame(inputFrame); inputFrame = null; }
      hitPointer();
      if (surface!.dataset.pointerNode && !(event.target instanceof Element && event.target.closest("main,header,footer"))) event.preventDefault();
    }
    function leave() { latest = null; release(); }
    function endDrag(event: PointerEvent) { if (event.pointerType !== "mouse") leave(); }
    function refresh() { if (latest && ready) hitPointer(); schedule(); }
    function resize() {
      const width = document.documentElement.clientWidth, height = document.documentElement.clientHeight;
      if (width <= 0 || height <= 0) return;
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const metrics = viewportGridMetrics(rem);
      grid = { lattice: createLattice({ width, height, dpr: window.devicePixelRatio || 1 }, { cell: metrics.cell }), width, height, metrics };
      activity = null; pulse = null; flowBand = ""; dirty = true; refresh();
    }
    function suspend() { previous = 0; dirty = true; if (query.matches || pausedRef.current || document.visibilityState === "hidden") { pulse = null; leave(); } schedule(); }
    // One startup gate, based on real completion rather than a device-specific timeout.
    async function enableAfterEntrance() {
      if (document.readyState !== "complete") await new Promise<void>(resolve => window.addEventListener("load", () => resolve(), { once: true, signal: startup.signal }));
      await document.fonts.ready;
      if (disposed) return;
      while (!disposed) {
        await new Promise<void>(resolve => { gateFrame = requestAnimationFrame(() => { gateFrame = null; resolve(); }); });
        if (disposed) return;
        const animations = document.getAnimations().filter(animation => {
          const timing = animation.effect?.getComputedTiming();
          return (animation.playState === "running" || animation.pending) && Number.isFinite(Number(timing?.endTime));
        });
        if (!animations.length) break;
        await Promise.allSettled(animations.map(animation => animation.finished));
      }
      if (disposed) return;
      ready = true; schedule();
      document.addEventListener("pointermove", move, { passive: true });
      document.addEventListener("pointerdown", down);
    }
    const startup = new AbortController();
    void enableAfterEntrance();
    resize();
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    window.addEventListener("scroll", refresh, { passive: true });
    document.addEventListener("pointerleave", leave); document.addEventListener("pointercancel", leave);
    document.addEventListener("pointerup", endDrag);
    window.addEventListener("blur", leave);
    document.addEventListener("visibilitychange", suspend); query.addEventListener("change", suspend);
    window.addEventListener("blueprint-playstate", suspend);
    return () => {
      disposed = true; startup.abort(); window.removeEventListener("resize", resize); window.visualViewport?.removeEventListener("resize", resize); window.removeEventListener("scroll", refresh);
      document.removeEventListener("pointermove", move); document.removeEventListener("pointerdown", down);
      document.removeEventListener("pointerleave", leave); document.removeEventListener("pointercancel", leave);
      document.removeEventListener("pointerup", endDrag);
      window.removeEventListener("blur", leave); document.removeEventListener("visibilitychange", suspend);
      query.removeEventListener("change", suspend); window.removeEventListener("blueprint-playstate", suspend);
      if (inputFrame !== null) cancelAnimationFrame(inputFrame);
      if (gateFrame !== null) cancelAnimationFrame(gateFrame);
      if (frame !== null) cancelAnimationFrame(frame);
      delete host.dataset.layout; delete host.dataset.interaction; delete host.dataset.phase; delete host.dataset.energyLights; delete surface.dataset.pointerNode;
      delete host.dataset.viewportNodes; delete host.dataset.activeRatio;
      delete host.dataset.gridCell;
    };
  }, [variant]);
  useEffect(() => {
    const surface = canvas.current;
    const element = plane.current;
    if (!surface || !element) return;
    if (variant === "page" && element.closest(".public-site")) return;
    const context = surface.getContext("2d");
    if (!context) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let system = createEnergySystem(1, 1);
    let width = 1, height = 1, clock = 0, previous = 0, frame: number | null = null, pulse = -Infinity;
    let pixelRatio = 0;
    let hoveredNode: number | null = null;
    let lastPointer: PointerEvent | null = null;
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    const brush = sprite.getContext("2d")!;
    const gradient = brush.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, "rgba(234,250,255,1)");
    gradient.addColorStop(.415, "rgba(135,206,235,.95)");
    gradient.addColorStop(.7, "rgba(135,206,235,.35)");
    gradient.addColorStop(1, "rgba(70,130,180,0)");
    brush.fillStyle = gradient; brush.fillRect(0, 0, 64, 64);
    function light(x: number, y: number, radius: number, alpha: number) {
      context!.globalAlpha = Math.max(0, Math.min(1, alpha));
      context!.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
    }
    function draw(now: number) {
      frame = null;
      if (width <= 0 || height <= 0) return;
      const delta = previous ? Math.min(40, now - previous) : 0;
      previous = now;
      const staticFrame = query.matches;
      clock = staticFrame ? 2000 : clock + delta;
      const stimulation = Math.exp(-(clock - pulse) / 550);
      if (!staticFrame) advanceEnergy(system, clock, delta, stimulation);
      context!.clearRect(0, 0, width, height);
      context!.lineWidth = 1.2; context!.strokeStyle = "#4682b4";
      for (const line of system.lines.values()) {
        const from = system.nodes[line.from]!, to = system.nodes[line.to]!;
        context!.globalAlpha = .45 * linePower(clock, line.hit);
        context!.beginPath(); context!.moveTo(from.x, from.y);
        context!.lineTo(from.x + (to.x - from.x) * line.progress, from.y + (to.y - from.y) * line.progress); context!.stroke();
      }
      for (const line of system.pointerLines.values()) {
        const from = system.nodes[line.from]!, to = system.nodes[line.to]!;
        context!.globalAlpha = .6 * pointerPower(clock, line.hit, line.releasedAt);
        context!.beginPath(); context!.moveTo(from.x, from.y);
        context!.lineTo(from.x + (to.x - from.x) * line.progress, from.y + (to.y - from.y) * line.progress); context!.stroke();
      }
      for (const node of system.nodes) {
        const boot = energyEase((clock - node.born) / 450);
        const hover = system.pointerNodes.get(node.id);
        const power = Math.max(nodePower(clock, node.hit), hover ? pointerPower(clock, hover.hit, hover.releasedAt) : 0);
        light(node.x, node.y, 4 + (node.large ? power * 6 : 0), boot * (.28 + power * .7 + stimulation * .12));
      }
      if (!staticFrame && clock >= 1900) for (const signal of system.lights) {
        const from = system.nodes[signal.from]!, to = system.nodes[signal.to]!;
        const t = energyEase(signal.progress);
        light(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t, 7, .95);
      }
      context!.globalAlpha = 1;
      element!.parentElement!.dataset.runtime = "ready";
      if (!staticFrame && !pausedRef.current && document.visibilityState !== "hidden") frame = requestAnimationFrame(draw);
    }
    function resize() {
      const nextWidth = element!.clientWidth, nextHeight = element!.clientHeight;
      if (nextWidth <= 0 || nextHeight <= 0) return;
      const ratio = window.devicePixelRatio || 1;
      if (width === nextWidth && height === nextHeight && pixelRatio === ratio) return;
      width = nextWidth; height = nextHeight; pixelRatio = ratio;
      surface!.width = Math.round(width * ratio); surface!.height = Math.round(height * ratio);
      context!.setTransform(surface!.width / width, 0, 0, surface!.height / height, 0, 0);
      system = createEnergySystem(width, height, Math.random, variant === "page" ? 136 : 64); clock = 0; previous = 0; hoveredNode = null;
      schedule();
    }
    function schedule() {
      if (query.matches || pausedRef.current || document.visibilityState === "hidden") leavePointer();
      if (query.matches) { system.pointerNodes.clear(); system.pointerLines.clear(); }
      if (frame !== null) cancelAnimationFrame(frame);
      previous = 0;
      if (!pausedRef.current && document.visibilityState !== "hidden") frame = requestAnimationFrame(draw);
    }
    function stimulate() { pulse = clock; schedule(); }
    function movePointer(event: PointerEvent) {
      lastPointer = event;
      if (event.pointerType !== "mouse" || !event.isPrimary || query.matches || pausedRef.current ||
        document.visibilityState === "hidden" || !surface!.getClientRects().length) { leavePointer(); return; }
      const bounds = element!.getBoundingClientRect();
      const point = canvasPointAt(event.clientX, event.clientY, {
        left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height,
        logicalWidth: width, logicalHeight: height,
        viewportWidth: document.documentElement.clientWidth, viewportHeight: document.documentElement.clientHeight,
      });
      if (!point) { leavePointer(); return; }
      const node = energyNodeAt(system, point.x, point.y, clock);
      if (!node) { leavePointer(); return; }
      const clientX = bounds.left + node.x * bounds.width / width;
      const clientY = bounds.top + node.y * bounds.height / height;
      const page = element!.closest(".public-site");
      if (variant === "page" && page) {
        // Read the same live path that paints the paper, including rounded corners
        // and transparent windows. No viewport/device selector can disagree with it.
        const paper = page.querySelector<SVGPathElement>(".blueprint-paper-plane path");
        const matrix = paper?.getScreenCTM();
        const blocked = [...page.querySelectorAll<HTMLElement>(":scope > header, :scope > footer")].some(element => {
          const box = element.getBoundingClientRect();
          return clientX >= box.left && clientX <= box.right && clientY >= box.top && clientY <= box.bottom;
        });
        if (!paper || !matrix || blocked || document.querySelector("dialog[open]")) { leavePointer(); return; }
        const local = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
        if (paper.isPointInFill(local)) { leavePointer(); return; }
        if (hoveredNode === node.id) return;
        leavePointer(); hoveredNode = node.id;
        surface!.dataset.pointerNode = String(node.id);
        if (stimulateEnergyNode(system, node.id, clock) && frame === null) schedule();
        return;
      }
      // Test the visible node itself: the page canvas also extends beneath opaque paper.
      const hit = document.elementFromPoint(clientX, clientY);
      const cover = hit?.closest(".cover-system");
      // The cross and labels are transparent block-level spans: their boxes
      // cover visible nodes too. Only the filled output box occludes the grid.
      const visible = hit && !hit.closest("dialog, header, footer, .cover-caption, .system-nodes > span:last-child, button, input, textarea") &&
        (variant === "cover"
          ? cover === element!.closest(".cover-system") && !cover?.hasAttribute("data-blueprint-window")
          : page?.contains(hit) && (cover?.getAttribute("data-blueprint-window") === "true" || !hit.closest("main, .case-cover")));
      if (!visible) { leavePointer(); return; }
      if (hoveredNode === node.id) return;
      leavePointer();
      hoveredNode = node.id;
      if (stimulateEnergyNode(system, node.id, clock) && frame === null) schedule();
    }
    function leavePointer() { hoveredNode = null; delete surface!.dataset.pointerNode; releaseEnergyPointer(system, clock); }
    function refreshPointer() { if (lastPointer) movePointer(lastPointer); }
    function exitPointer() { lastPointer = null; leavePointer(); }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", schedule);
    window.addEventListener("blueprint-energy", stimulate);
    window.addEventListener("blueprint-playstate", schedule);
    query.addEventListener("change", schedule);
    document.addEventListener("pointermove", movePointer, { passive: true });
    document.addEventListener("pointerleave", exitPointer);
    window.addEventListener("blur", exitPointer);
    window.addEventListener("scroll", refreshPointer, { passive: true });
    resize();
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      resizeObserver.disconnect(); document.removeEventListener("visibilitychange", schedule);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      window.removeEventListener("blueprint-energy", stimulate);
      window.removeEventListener("blueprint-playstate", schedule); query.removeEventListener("change", schedule);
      document.removeEventListener("pointermove", movePointer);
      document.removeEventListener("pointerleave", exitPointer);
      window.removeEventListener("blur", exitPointer);
      window.removeEventListener("scroll", refreshPointer);
    };
  }, []);
  useEffect(() => { window.dispatchEvent(new Event("blueprint-playstate")); }, [paused]);

  return (
    <div className="blueprint-background" aria-hidden="true"
      data-motion={reduced ? "off" : "on"} data-variant={variant} data-paused={paused || !visible ? "true" : undefined}
      style={{ "--grid-unit": `${ENERGY_CELL}px`, "--node-duration": `${graph.nodeDuration}ms`, "--connection-duration": `${graph.connectionDuration}ms` } as CSSProperties}>
      <div className="blueprint-plane" ref={plane}>
        <canvas ref={canvas} className="blueprint-energy-canvas" />
        <svg width="100%" height="100%" focusable="false">
          <defs>
            <pattern id={pattern} width={CELL} height={CELL} patternUnits="userSpaceOnUse">
              <path d={`M${CELL} 0H0V${CELL}`} fill="none" className="blueprint-grid-line" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#${pattern})`} />
        </svg>
      </div>
    </div>
  );
}

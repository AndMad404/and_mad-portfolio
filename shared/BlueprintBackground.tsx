import { useEffect, useId, useRef, useState, type CSSProperties } from "react";
import { useReducedMotion } from "./motion";
import { ENERGY_CELL, advanceEnergy, createEnergySystem, energyEase, nodePower, linePower, energyNodeAt, stimulateEnergyNode, releaseEnergyPointer, pointerPower } from "./BlueprintEnergy";

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
    const surface = canvas.current;
    const element = plane.current;
    if (!surface || !element) return;
    const context = surface.getContext("2d");
    if (!context) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    let system = createEnergySystem(1, 1);
    let width = 1, height = 1, clock = 0, previous = 0, frame: number | null = null, pulse = -Infinity;
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
      width = element!.clientWidth; height = element!.clientHeight;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      surface!.width = Math.round(width * ratio); surface!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
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
      const node = energyNodeAt(system, event.clientX - bounds.left, event.clientY - bounds.top, clock);
      if (!node) { leavePointer(); return; }
      // Test the visible node itself: the page canvas also extends beneath opaque paper.
      const hit = document.elementFromPoint(bounds.left + node.x, bounds.top + node.y);
      const cover = hit?.closest(".cover-system");
      const page = element!.closest(".public-site");
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
    function leavePointer() { hoveredNode = null; releaseEnergyPointer(system, clock); }
    function refreshPointer() { if (lastPointer) movePointer(lastPointer); }
    function exitPointer() { lastPointer = null; leavePointer(); }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(element);
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

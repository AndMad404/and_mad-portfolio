/** Pure lattice geometry (G1). Coordinates are CSS pixels; width is clientWidth.
 * No DOM, mutable state or randomness. Shared by document layout and rendering.
 */
export const CELL = 40;
export const BUCKET = 5;
export const CELLS_PER_LIGHT = 120;
export const MIN_LIGHTS = 8;
export const MAX_LIGHTS = 32;

export interface LatticeDevice {
  readonly width: number;
  readonly height: number;
  readonly dpr: number;
}
export interface Lattice {
  readonly cell: number;
  readonly cols: number;
  readonly rows: number;
  readonly phaseX: number;
  readonly phaseY: number;
}
export interface NodeRef { readonly col: number; readonly row: number; }

/** Convert viewport CSS coordinates into the current canvas coordinate space.
 * clientWidth/clientHeight exclude a classic scrollbar; overlay scrollbars take no space.
 * Bounds and logical dimensions are measured independently to handle zoom/transforms.
 */
export function canvasPointAt(x: number, y: number, geometry: {
  left: number; top: number; width: number; height: number;
  logicalWidth: number; logicalHeight: number; viewportWidth: number; viewportHeight: number;
}): { x: number; y: number } | null {
  const g = geometry;
  if (![x, y, ...Object.values(g)].every(Number.isFinite) ||
    [g.width, g.height, g.logicalWidth, g.logicalHeight, g.viewportWidth, g.viewportHeight].some(value => value <= 0) ||
    x < 0 || y < 0 || x >= g.viewportWidth || y >= g.viewportHeight) return null;
  const point = { x: (x - g.left) * g.logicalWidth / g.width, y: (y - g.top) * g.logicalHeight / g.height };
  return point.x >= 0 && point.y >= 0 && point.x < g.logicalWidth && point.y < g.logicalHeight ? point : null;
}

function assertPositive(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0)
    throw new RangeError(`${name} debe ser un número finito > 0 (recibido: ${value})`);
}
function mod(value: number, period: number): number {
  return ((value % period) + period) % period;
}
function snapPhase(value: number, dpr: number, cell: number): number {
  const snapped = Math.round(value * dpr) / dpr;
  if (!Number.isFinite(snapped)) throw new RangeError("Fase no representable");
  // Subtracting cell would break physical-pixel alignment if cell*dpr is fractional.
  return snapped >= cell ? 0 : snapped;
}

/** The public viewport uses the same cell and node sizes at every width. */
export function viewportGridMetrics(rem = 16) {
  assertPositive("rem", rem);
  return {
    cell: 3.75 * rem,
    nodeRadius: 3.5 * rem / 16,
    majorRadius: 4.5 * rem / 16,
    pointerReach: 1.375 * rem,
  };
}

/** Frozen, bucketed capacity covering the viewport, with a centered X phase.
 * phaseY=0 explicitly anchors the grid to the top of the viewport.
 */
export function createLattice({ width, height, dpr }: LatticeDevice, options: {
  originX?: number; originY?: number; bucket?: number; cell?: number;
} = {}): Lattice {
  assertPositive("width", width);
  assertPositive("height", height);
  assertPositive("dpr", dpr);
  const cell = options.cell ?? CELL;
  assertPositive("cell", cell);
  const bucket = options.bucket ?? BUCKET;
  if (!Number.isSafeInteger(bucket) || bucket < 1) throw new RangeError("Invalid bucket");
  const phaseX = options.originX ?? snapPhase(mod(width / 2, cell), dpr, cell);
  const phaseY = options.originY ?? 0;
  if (![phaseX, phaseY].every(Number.isFinite)) throw new RangeError("Invalid origin");
  const cols = Math.ceil(Math.max(2, Math.ceil((width - Math.min(phaseX, 0)) / cell) + 1) / bucket) * bucket;
  const rows = Math.ceil(Math.max(2, Math.ceil((height - Math.min(phaseY, 0)) / cell) + 1) / bucket) * bucket;
  if (!Number.isSafeInteger(cols) || !Number.isSafeInteger(rows) || !Number.isSafeInteger(cols * rows))
    throw new RangeError("Capacidad de retícula no representable de forma segura");
  return Object.freeze({ cell, cols, rows, phaseX, phaseY });
}

/** The document and all its consumers share this coordinate space.
 * An even number of content cells keeps both shell edges on the centered lattice.
 */
export function documentLayout(device: LatticeDevice, insetCells: number, contentTop: number) {
  if (!Number.isFinite(insetCells) || insetCells < 0 || !Number.isFinite(contentTop)) throw new RangeError("Invalid document layout");
  const lattice = createLattice(device, { originY: mod(contentTop, CELL) });
  const shellCells = Math.max(2, Math.floor((device.width - 2 * insetCells * CELL) / (2 * CELL)) * 2);
  const center = Math.round((device.width / 2 - lattice.phaseX) / CELL);
  const shellLeft = lattice.phaseX + (center - shellCells / 2) * CELL;
  return Object.freeze({ lattice, shellLeft, shellWidth: shellCells * CELL, width: device.width, height: device.height });
}

/** Complete tracks, not independent fractional grids. Their edges are node lines. */
export function latticeTracks(lattice: Lattice, width: number, count: number, firstShare?: number): number[] {
  // Only complete cells fit. Rounding up expands narrow tracks past their
  // container (e.g. 300px of content becoming a fixed 320px column).
  const cells = Math.max(0, Math.floor(width / lattice.cell));
  const columns = Math.max(1, Math.min(count, Math.floor((cells + 1) / 2)));
  const available = cells - (columns - 1);
  if (columns === 1) return [cells * lattice.cell];
  const first = firstShare === undefined ? Math.floor(available / columns)
    : Math.max(1, Math.min(available - columns + 1, Math.round(available * firstShare)));
  const tracks = [first];
  let remaining = available - first;
  for (let i = 1; i < columns; i++) {
    const size = Math.floor(remaining / (columns - i)); tracks.push(size); remaining -= size;
  }
  return tracks.map(value => value * lattice.cell);
}

/** Arithmetic only: callers own index-range validation. */
export function pointOf(lattice: Lattice, col: number, row: number): { x: number; y: number } {
  return { x: lattice.phaseX + col * lattice.cell, y: lattice.phaseY + row * lattice.cell };
}

/** O(1) nearest node within Chebyshev reach. Exact ties choose the larger index.
 * Default reach partitions capacity into half-open cells, including its lower edge.
 * Invalid coordinates/reach or an out-of-capacity index return null.
 */
export function nodeAt(lattice: Lattice, x: number, y: number, reach = lattice.cell / 2): NodeRef | null {
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(reach) || reach < 0) return null;
  const col = Math.round((x - lattice.phaseX) / lattice.cell) || 0;
  const row = Math.round((y - lattice.phaseY) / lattice.cell) || 0;
  if (col < 0 || col >= lattice.cols || row < 0 || row >= lattice.rows) return null;
  const point = pointOf(lattice, col, row);
  if (Math.abs(x - point.x) > reach || Math.abs(y - point.y) > reach) return null;
  return { col, row };
}

/** Capacity-based budget: cells means cols*rows, including bucket padding. */
export function budgetFor(cells: number): number {
  if (!Number.isFinite(cells) || cells <= 0) return MIN_LIGHTS;
  return Math.min(MAX_LIGHTS, Math.max(MIN_LIGHTS, Math.round(cells / CELLS_PER_LIGHT)));
}

/** Index compatibility; phase changes alone do not change the capacity shape. */
export function sameShape(a: Lattice, b: Lattice): boolean {
  return a.cell === b.cell && a.cols === b.cols && a.rows === b.rows;
}

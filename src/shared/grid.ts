/**
 * grid.bin format (written by scripts/build-world.ts):
 * 4×uint32 LE header (magic "WDG1", width, height, cellKm), then
 * width*height bytes — 0 water, 1–6 team id (SPEC §3), 7 unclaimed land.
 * Equirectangular, row 0 = lat 90°N, col 0 = lon 180°W, wraps horizontally.
 */

export const GRID_MAGIC = 0x57444731;

export interface WorldGrid {
  width: number;
  height: number;
  cellKm: number;
  cells: Uint8Array;
}

export function parseGrid(buffer: ArrayBuffer): WorldGrid {
  const header = new Uint32Array(buffer, 0, 4);
  if (header[0] !== GRID_MAGIC) throw new Error("grid.bin: bad magic");
  const [, width, height, cellKm] = header;
  const cells = new Uint8Array(buffer, 16, width * height);
  if (cells.length !== width * height) throw new Error("grid.bin: truncated");
  return { width, height, cellKm, cells };
}

/** Wrap-aware column index (D14: world wraps horizontally). */
export function wrapCol(col: number, width: number): number {
  return ((col % width) + width) % width;
}

export function lonLatToCell(
  grid: WorldGrid,
  lon: number,
  lat: number,
): number {
  const col = wrapCol(Math.floor(((lon + 180) / 360) * grid.width), grid.width);
  const row = Math.min(
    grid.height - 1,
    Math.max(0, Math.floor(((90 - lat) / 180) * grid.height)),
  );
  return grid.cells[row * grid.width + col];
}

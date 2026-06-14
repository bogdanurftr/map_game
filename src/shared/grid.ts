/**
 * grid.bin.gz format v2 (written by scripts/build-world.ts): gzip of
 * [4×uint32 LE header (magic "WDG2", width, height, cellKm),
 *  team plane (w*h bytes): 0 water, 1–6 team id (SPEC §3), 7 unclaimed land,
 *  country plane (w*h bytes): index into countries.json, 255 = none].
 * Equirectangular, row 0 = lat 90°N, col 0 = lon 180°W, wraps horizontally.
 */

export const GRID_MAGIC = 0x57444732; // "WDG2"

export interface WorldGrid {
  width: number;
  height: number;
  cellKm: number;
  /** team ownership plane */
  teams: Uint8Array;
  /** country-index plane (index into countries.json, 255 = none) */
  country: Uint8Array;
}

export function parseGrid(buffer: ArrayBuffer): WorldGrid {
  const header = new Uint32Array(buffer, 0, 4);
  if (header[0] !== GRID_MAGIC) throw new Error("grid.bin: bad magic");
  const [, width, height, cellKm] = header;
  const n = width * height;
  if (buffer.byteLength < 16 + 2 * n) throw new Error("grid.bin: truncated");
  return {
    width,
    height,
    cellKm,
    teams: new Uint8Array(buffer, 16, n),
    country: new Uint8Array(buffer, 16 + n, n),
  };
}

/** Decompress (if gzipped) + parse. Browser/worker path; tests use zlib. */
export async function loadGrid(res: Response): Promise<WorldGrid> {
  let buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // Some CDNs transparently decode .gz; only decompress when still gzipped.
  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    buf = await new Response(
      new Blob([buf]).stream().pipeThrough(new DecompressionStream("gzip")),
    ).arrayBuffer();
  }
  return parseGrid(buf);
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
  return grid.teams[row * grid.width + col];
}

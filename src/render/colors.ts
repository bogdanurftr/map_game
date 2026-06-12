/** Team palette (render-only; indices match grid.bin / SPEC §3 team ids). */

export const WATER_COLOR = 0x0e1220;

export const CELL_COLORS: Record<number, number> = {
  0: WATER_COLOR, // water
  1: 0xe07b39, // Orange
  2: 0xc0392b, // Red
  3: 0x27ae60, // Green
  4: 0xe3c84b, // Yellow
  5: 0x8e44ad, // Purple
  6: 0x5dade2, // L.Blue
  7: 0x4a4f55, // unclaimed land (Antarctica)
};

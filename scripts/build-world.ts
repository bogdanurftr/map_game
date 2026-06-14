/**
 * build-world.ts — Natural Earth GeoJSON → /data world files (SPEC §2, M1).
 *
 *   countries.json  country → team, population, centroid
 *   grid.bin        10 km ownership + land/water raster (equirectangular)
 *   resources.json  core-4 resource nodes
 *
 * Run: npx tsx scripts/build-world.ts
 * Input: data/raw/ne_50m_admin_0_countries.geojson (downloaded separately).
 * Prints per-team population totals vs SPEC §3 targets (accept: within 5%).
 */

import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";
import {
  assignTeam,
  SPEC_POP_TARGETS_M,
  TEAM,
  TEAM_NAMES,
} from "./team-assignment";
import { RESOURCE_SEEDS } from "./resources-data";

const ROOT = join(import.meta.dirname, "..");
const RAW = join(ROOT, "data/raw/ne_50m_admin_0_countries.geojson");

// Grid spec (SPEC §2 ⚙): 10 km cells, equirectangular, lon-wrapping.
const CELL_KM = 10;
const EARTH_CIRCUMFERENCE_KM = 40075;
const GRID_W = Math.round(EARTH_CIRCUMFERENCE_KM / CELL_KM); // 4008
const GRID_H = Math.round(GRID_W / 2); // 2004
const GRID_MAGIC = 0x57444732; // "WDG2" (v2: + country-index plane, gzipped)

// World population the team budget is based on (D12: ~81k units → ~8.1B).
// Natural Earth POP_EST is 2019 (~7.68B); scale uniformly to the SPEC era. ⚙
const SPEC_WORLD_POP = Object.values(SPEC_POP_TARGETS_M).reduce(
  (a, b) => a + b,
  0,
) * 1e6;

// SPEC §5 ⚙ node amounts
const NODE_AMOUNTS = { iron: 400, oil: 250, copper: 250, gold: 150 } as const;

type Ring = [number, number][]; // [lon, lat]
type Polygon = Ring[]; // first ring outer, rest holes

interface Feature {
  properties: Record<string, unknown>;
  geometry: { type: string; coordinates: unknown };
}

function polygonsOf(f: Feature): Polygon[] {
  if (f.geometry.type === "Polygon") return [f.geometry.coordinates as Polygon];
  if (f.geometry.type === "MultiPolygon")
    return f.geometry.coordinates as Polygon[];
  throw new Error(`Unexpected geometry ${f.geometry.type}`);
}

/** Area-weighted centroid of the largest outer ring (for labels/spawning). */
function centroid(polys: Polygon[]): [number, number] {
  let best: Ring = polys[0][0];
  let bestArea = 0;
  for (const poly of polys) {
    const ring = poly[0];
    let area = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      area += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    area = Math.abs(area / 2);
    if (area > bestArea) {
      bestArea = area;
      best = ring;
    }
  }
  let cx = 0;
  let cy = 0;
  let a = 0;
  for (let i = 0; i < best.length - 1; i++) {
    const cross = best[i][0] * best[i + 1][1] - best[i + 1][0] * best[i][1];
    a += cross;
    cx += (best[i][0] + best[i + 1][0]) * cross;
    cy += (best[i][1] + best[i + 1][1]) * cross;
  }
  a /= 2;
  return [+(cx / (6 * a)).toFixed(3), +(cy / (6 * a)).toFixed(3)];
}

const lonToX = (lon: number): number => ((lon + 180) / 360) * GRID_W;
const latToRow = (lat: number): number => ((90 - lat) / 180) * GRID_H;

/**
 * Scanline-rasterize a polygon (outer ring + holes, even-odd rule) into the
 * grid. Sample point is each cell's center.
 */
function rasterize(grid: Uint8Array, poly: Polygon, team: number): void {
  let minLat = 90;
  let maxLat = -90;
  for (const [, lat] of poly[0]) {
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  }
  const rowStart = Math.max(0, Math.floor(latToRow(maxLat)));
  const rowEnd = Math.min(GRID_H - 1, Math.ceil(latToRow(minLat)));

  for (let row = rowStart; row <= rowEnd; row++) {
    const lat = 90 - ((row + 0.5) / GRID_H) * 180;
    const xs: number[] = [];
    for (const ring of poly) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [x1, y1] = ring[i];
        const [x2, y2] = ring[i + 1];
        if (y1 === y2) continue;
        if (lat >= Math.min(y1, y2) && lat < Math.max(y1, y2)) {
          xs.push(x1 + ((lat - y1) / (y2 - y1)) * (x2 - x1));
        }
      }
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2) {
      const colStart = Math.ceil(lonToX(xs[i]) - 0.5);
      const colEnd = Math.floor(lonToX(xs[i + 1]) - 0.5);
      for (let col = colStart; col <= colEnd; col++) {
        // wrap-aware column index (D14)
        const c = ((col % GRID_W) + GRID_W) % GRID_W;
        grid[row * GRID_W + c] = team;
      }
    }
  }
}

// ---------------------------------------------------------------------------

const geo = JSON.parse(readFileSync(RAW, "utf8")) as { features: Feature[] };

const rawWorldPop = geo.features.reduce(
  (sum, f) => sum + ((f.properties.POP_EST as number) || 0),
  0,
);
const popScale = SPEC_WORLD_POP / rawWorldPop;

interface CountryOut {
  iso3: string;
  name: string;
  team: number;
  population: number;
  centroid: [number, number];
}

const countries: CountryOut[] = [];
const teamPops = new Map<number, number>();

for (const f of geo.features) {
  const iso3 = f.properties.ADM0_A3 as string;
  const name = f.properties.NAME as string;
  const subregion = f.properties.SUBREGION as string;
  const team = assignTeam(iso3, subregion);
  const population = Math.round(
    ((f.properties.POP_EST as number) || 0) * popScale,
  );
  const polys = polygonsOf(f);
  countries.push({ iso3, name, team, population, centroid: centroid(polys) });
  teamPops.set(team, (teamPops.get(team) ?? 0) + population);
}

countries.sort((a, b) => a.iso3.localeCompare(b.iso3));
const countryIndex = new Map(countries.map((c, i) => [c.iso3, i]));
if (countries.length > 255) throw new Error(">255 countries won't fit uint8");

// Rasterize two planes (team + country index); paint large countries first
// so enclaves (Lesotho etc.) overpaint and stay visible.
const teamGrid = new Uint8Array(GRID_W * GRID_H); // 0 = water
const countryGrid = new Uint8Array(GRID_W * GRID_H).fill(255); // 255 = none
const byArea = [...geo.features].sort((a, b) => {
  const area = (f: Feature) =>
    polygonsOf(f).reduce((s, p) => s + p[0].length, 0);
  return area(b) - area(a);
});
for (const f of byArea) {
  const iso3 = f.properties.ADM0_A3 as string;
  const team = assignTeam(iso3, f.properties.SUBREGION as string);
  const value = team === TEAM.NONE ? 7 : team; // 7 = unclaimed land
  const cIdx = countryIndex.get(iso3)!;
  for (const poly of polygonsOf(f)) {
    rasterize(teamGrid, poly, value);
    rasterize(countryGrid, poly, cIdx);
  }
}

// grid.bin.gz (v2): gzip of [4×uint32 LE header (magic, w, h, cellKm),
// team plane (w*h bytes), country-index plane (w*h bytes)].
const header = new Uint32Array([GRID_MAGIC, GRID_W, GRID_H, CELL_KM]);
const bin = new Uint8Array(header.byteLength + 2 * teamGrid.byteLength);
bin.set(new Uint8Array(header.buffer), 0);
bin.set(teamGrid, header.byteLength);
bin.set(countryGrid, header.byteLength + teamGrid.byteLength);
writeFileSync(join(ROOT, "data/grid.bin.gz"), gzipSync(bin, { level: 9 }));

writeFileSync(
  join(ROOT, "data/countries.json"),
  JSON.stringify({ popScale: +popScale.toFixed(4), countries }, null, 1),
);

const resources = RESOURCE_SEEDS.map((seed, i) => ({
  id: i,
  kind: seed.kind,
  lon: seed.lon,
  lat: seed.lat,
  label: seed.label,
  amount: NODE_AMOUNTS[seed.kind],
}));
writeFileSync(
  join(ROOT, "data/resources.json"),
  JSON.stringify(resources, null, 1),
);

// ---------------------------------------------------------------------------
// Report: team totals vs SPEC §3 (M1 accept: within 5%)

let landCells = 0;
for (const v of teamGrid) if (v !== 0) landCells++;

console.log(`countries: ${countries.length}, popScale: ${popScale.toFixed(4)}`);
console.log(
  `grid: ${GRID_W}×${GRID_H} @ ${CELL_KM} km, land cells: ${landCells}`,
);
console.log(`resources: ${resources.length} nodes\n`);
console.log("team     pop(M)   target(M)   deviation");

let allOk = true;
for (const teamId of [1, 2, 3, 4, 5, 6]) {
  const popM = (teamPops.get(teamId) ?? 0) / 1e6;
  const targetM = SPEC_POP_TARGETS_M[teamId];
  const dev = (popM / targetM - 1) * 100;
  const ok = Math.abs(dev) <= 5;
  if (!ok) allOk = false;
  console.log(
    `${TEAM_NAMES[teamId].padEnd(8)} ${popM.toFixed(0).padStart(6)} ${String(
      targetM,
    ).padStart(11)} ${(dev >= 0 ? "+" : "") + dev.toFixed(1)}%  ${ok ? "✓" : "✗ OUT OF BAND"}`,
  );
}
console.log(
  `\nworld: ${(SPEC_WORLD_POP / 1e9).toFixed(2)}B → ~${Math.round(
    SPEC_WORLD_POP / 100_000 / 1000,
  )}k units (D12)`,
);
if (!allOk) {
  console.error("\nFAIL: team totals outside ±5% of SPEC §3");
  process.exit(1);
}

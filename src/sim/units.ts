/**
 * Unit storage and behavior (M2). Two populations:
 *  - dormant units: the whole world (~82k), each pinned to a 10 km grid cell,
 *    folded into stat-cell placeholders until M3 makes them tick;
 *  - live units: SoA TypedArrays for everything inside the player's zone.
 * Conservation: live count + dormant-alive count is invariant (CLAUDE.md).
 */

import type { Rng } from "./rng";
import type { WorldGrid } from "../shared/grid";
import { wrapX } from "../shared/geo";
import {
  CELL_KM,
  PEOPLE_PER_UNIT,
  REGULAR_HP,
  SPAWN_JITTER_KM,
  WANDER_EXTRA_TICKS,
  WANDER_MIN_TICKS,
  WORLD_W_KM,
  WORLD_H_KM,
  REGULAR_SPEED_KM_PER_TICK,
  ZONE_UNIT_BUDGET,
} from "./constants";

export interface CountryInfo {
  iso3: string;
  name: string;
  team: number;
  population: number;
  centroid: [number, number];
}

export interface DormantUnits {
  count: number;
  /** 10 km grid cell index, or -1 (country too small to rasterize → centroid) */
  cell: Int32Array;
  /** fallback positions for cell === -1, in km */
  fallbackX: Float32Array;
  fallbackY: Float32Array;
  team: Uint8Array;
  /** 1 = dormant, 0 = currently materialized in the live zone */
  alive: Uint8Array;
}

export interface LiveUnits {
  count: number;
  posX: Float32Array;
  posY: Float32Array;
  team: Uint8Array;
  type: Uint8Array; // 0 = Regular (ladder grows in M4+)
  hp: Float32Array;
  heading: Float32Array;
  wanderTimer: Uint16Array;
  /** back-reference into the dormant arrays for re-dissolving */
  dormantIdx: Int32Array;
}

export function createLiveStore(capacity: number): LiveUnits {
  return {
    count: 0,
    posX: new Float32Array(capacity),
    posY: new Float32Array(capacity),
    team: new Uint8Array(capacity),
    type: new Uint8Array(capacity),
    hp: new Float32Array(capacity),
    heading: new Float32Array(capacity),
    wanderTimer: new Uint16Array(capacity),
    dormantIdx: new Int32Array(capacity),
  };
}

function lonLatToKm(lon: number, lat: number): [number, number] {
  return [((lon + 180) / 360) * WORLD_W_KM, ((90 - lat) / 180) * WORLD_H_KM];
}

/**
 * Spawn the world population as dormant units: per country,
 * round(population / PEOPLE_PER_UNIT) units on random cells of that country
 * (uniform within country ⚙ — country-level proportionality is what D12 fixes).
 */
export function spawnDormant(
  grid: WorldGrid,
  countries: CountryInfo[],
  rng: Rng,
): DormantUnits {
  // Bucket land cells by country index (one pass over the raster).
  const cellsPer: number[][] = countries.map(() => []);
  for (let i = 0; i < grid.country.length; i++) {
    const c = grid.country[i];
    if (c !== 255 && cellsPer[c]) cellsPer[c].push(i);
  }

  const unitsPer = countries.map((c) =>
    Math.round(c.population / PEOPLE_PER_UNIT),
  );
  const total = unitsPer.reduce((a, b) => a + b, 0);

  const d: DormantUnits = {
    count: total,
    cell: new Int32Array(total),
    fallbackX: new Float32Array(total),
    fallbackY: new Float32Array(total),
    team: new Uint8Array(total),
    alive: new Uint8Array(total).fill(1),
  };

  let u = 0;
  for (let c = 0; c < countries.length; c++) {
    const cells = cellsPer[c];
    const team = countries[c].team;
    const [fx, fy] = lonLatToKm(...countries[c].centroid);
    for (let k = 0; k < unitsPer[c]; k++) {
      d.team[u] = team;
      if (cells.length > 0) {
        d.cell[u] = cells[rng.nextInt(cells.length)];
      } else {
        // country too small for the 10 km raster — pin to its centroid
        d.cell[u] = -1;
        d.fallbackX[u] = fx;
        d.fallbackY[u] = fy;
      }
      u++;
    }
  }
  return d;
}

export function dormantPos(
  d: DormantUnits,
  grid: WorldGrid,
  i: number,
): [number, number] {
  const cell = d.cell[i];
  if (cell === -1) return [d.fallbackX[i], d.fallbackY[i]];
  const col = cell % grid.width;
  const row = (cell - col) / grid.width;
  return [(col + 0.5) * CELL_KM, (row + 0.5) * CELL_KM];
}

/** Materialize every dormant unit inside the circle into the live store. */
export function materialize(
  d: DormantUnits,
  live: LiveUnits,
  grid: WorldGrid,
  rng: Rng,
  inZone: (x: number, y: number) => boolean,
): void {
  for (let i = 0; i < d.count && live.count < ZONE_UNIT_BUDGET; i++) {
    if (!d.alive[i]) continue;
    const [cx, cy] = dormantPos(d, grid, i);
    if (!inZone(cx, cy)) continue;
    const n = live.count++;
    live.posX[n] = wrapX(
      cx + (rng.nextFloat() - 0.5) * SPAWN_JITTER_KM,
      WORLD_W_KM,
    );
    live.posY[n] = Math.min(
      WORLD_H_KM - 1,
      Math.max(0, cy + (rng.nextFloat() - 0.5) * SPAWN_JITTER_KM),
    );
    live.team[n] = d.team[i];
    live.type[n] = 0;
    live.hp[n] = REGULAR_HP;
    live.heading[n] = rng.nextFloat() * Math.PI * 2;
    live.wanderTimer[n] = 1; // re-roll heading on first tick
    live.dormantIdx[n] = i;
    d.alive[i] = 0;
  }
}

/** Fold all live units back into dormancy (cell = wherever they wandered). */
export function dissolveAll(
  d: DormantUnits,
  live: LiveUnits,
  grid: WorldGrid,
): void {
  for (let n = 0; n < live.count; n++) {
    const i = live.dormantIdx[n];
    const col = Math.min(
      grid.width - 1,
      Math.floor(live.posX[n] / CELL_KM),
    );
    const row = Math.min(grid.height - 1, Math.floor(live.posY[n] / CELL_KM));
    d.cell[i] = row * grid.width + col;
    d.alive[i] = 1;
  }
  live.count = 0;
}

/** Idle wander (M2): random heading, constant speed, stay on land + in zone. */
export function stepWander(
  live: LiveUnits,
  grid: WorldGrid,
  rng: Rng,
  inZone: (x: number, y: number) => boolean,
): void {
  for (let n = 0; n < live.count; n++) {
    if (--live.wanderTimer[n] <= 0 || live.wanderTimer[n] === 65535) {
      live.heading[n] = rng.nextFloat() * Math.PI * 2;
      live.wanderTimer[n] =
        WANDER_MIN_TICKS + rng.nextInt(WANDER_EXTRA_TICKS);
    }
    const nx = wrapX(
      live.posX[n] + Math.cos(live.heading[n]) * REGULAR_SPEED_KM_PER_TICK,
      WORLD_W_KM,
    );
    const ny =
      live.posY[n] + Math.sin(live.heading[n]) * REGULAR_SPEED_KM_PER_TICK;
    const col = Math.min(grid.width - 1, Math.floor(nx / CELL_KM));
    const row = Math.min(
      grid.height - 1,
      Math.max(0, Math.floor(ny / CELL_KM)),
    );
    const land = grid.teams[row * grid.width + col] !== 0;
    if (land && ny >= 0 && ny < WORLD_H_KM && inZone(nx, ny)) {
      live.posX[n] = nx;
      live.posY[n] = ny;
    } else {
      live.heading[n] += Math.PI; // bounce, no RNG consumed
    }
  }
}

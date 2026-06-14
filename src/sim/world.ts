/**
 * World state + fixed-timestep stepping. Pure and headless: no timers, no I/O,
 * no wall-clock — the worker shell schedules ticks, tests call step() directly.
 *
 * M2: the whole world spawns as dormant units (stat-cell placeholders);
 * dropping a zone materializes the units inside it, which wander on land.
 */

import { Rng } from "./rng";
import { StateHasher } from "./hash";
import type { WorldGrid } from "../shared/grid";
import { wrapDist2 } from "../shared/geo";
import { SpatialHash } from "./spatial-hash";
import {
  WORLD_W_KM,
  ZONE_RADIUS_KM,
  ZONE_SHRINK_FACTOR,
  ZONE_UNIT_BUDGET,
} from "./constants";
import {
  createLiveStore,
  dissolveAll,
  dormantPos,
  materialize,
  spawnDormant,
  stepWander,
  type CountryInfo,
  type DormantUnits,
  type LiveUnits,
} from "./units";

export interface WorldData {
  grid: WorldGrid;
  countries: CountryInfo[];
}

export interface Zone {
  xKm: number;
  yKm: number;
  radiusKm: number;
}

export interface World {
  seed: number;
  tick: number;
  rng: Rng;
  data: WorldData | null;
  dormant: DormantUnits | null;
  units: LiveUnits;
  zone: Zone | null;
  spatial: SpatialHash;
  /** Running mix of all randomness consumed — keeps the hash RNG-sensitive. */
  noiseAccum: number;
}

export function createWorld(seed: number, data?: WorldData): World {
  const rng = new Rng(seed >>> 0);
  return {
    seed: seed >>> 0,
    tick: 0,
    rng,
    data: data ?? null,
    dormant: data ? spawnDormant(data.grid, data.countries, rng) : null,
    units: createLiveStore(ZONE_UNIT_BUDGET),
    zone: null,
    spatial: new SpatialHash(),
    noiseAccum: 0,
  };
}

function zoneTest(zone: Zone): (x: number, y: number) => boolean {
  const r2 = zone.radiusKm * zone.radiusKm;
  return (x, y) => wrapDist2(x, y, zone.xKm, zone.yKm, WORLD_W_KM) <= r2;
}

/**
 * Drop (or re-drop) the live zone at (xKm, yKm). Radius starts at D29's
 * 1,500 km and shrinks while the contained unit count exceeds the budget.
 */
export function dropZone(world: World, xKm: number, yKm: number): Zone {
  if (!world.data || !world.dormant) throw new Error("world has no data");
  dissolveAll(world.dormant, world.units, world.data.grid);

  let radius = ZONE_RADIUS_KM;
  for (;;) {
    const inZone = zoneTest({ xKm, yKm, radiusKm: radius });
    let count = 0;
    for (let i = 0; i < world.dormant.count; i++) {
      if (!world.dormant.alive[i]) continue;
      const [px, py] = dormantPos(world.dormant, world.data.grid, i);
      if (inZone(px, py)) count++;
    }
    if (count <= ZONE_UNIT_BUDGET) break;
    radius *= ZONE_SHRINK_FACTOR;
  }

  world.zone = { xKm, yKm, radiusKm: radius };
  materialize(
    world.dormant,
    world.units,
    world.data.grid,
    world.rng,
    zoneTest(world.zone),
  );
  return world.zone;
}

/** Advance the world by exactly one fixed tick. */
export function step(world: World): void {
  world.tick++;
  // One draw per tick keeps the hash exercising the RNG stream even when
  // the world is empty (M0 contract).
  world.noiseAccum = (world.noiseAccum ^ world.rng.nextUint32()) >>> 0;

  if (world.data && world.zone && world.units.count > 0) {
    stepWander(world.units, world.data.grid, world.rng, zoneTest(world.zone));
    world.spatial.rebuild(
      world.units.posX,
      world.units.posY,
      world.units.count,
    );
  }
}

/** Per-team unit counts (index = team id), live + dormant. Conservation. */
export function teamCounts(world: World): Uint32Array {
  const counts = new Uint32Array(8);
  if (world.dormant) {
    for (let i = 0; i < world.dormant.count; i++) {
      if (world.dormant.alive[i]) counts[world.dormant.team[i]]++;
    }
  }
  for (let n = 0; n < world.units.count; n++) counts[world.units.team[n]]++;
  return counts;
}

/** Order-stable hash of everything that defines sim state. */
export function stateHash(world: World): number {
  const h = new StateHasher();
  h.uint32(world.seed);
  h.uint32(world.tick);
  h.uint32(world.noiseAccum);
  h.array(world.rng.getState());
  if (world.zone) {
    h.float64(world.zone.xKm).float64(world.zone.yKm);
    h.float64(world.zone.radiusKm);
  }
  const u = world.units;
  h.uint32(u.count);
  h.array(u.posX.subarray(0, u.count));
  h.array(u.posY.subarray(0, u.count));
  h.array(u.team.subarray(0, u.count));
  h.array(u.type.subarray(0, u.count));
  h.array(u.hp.subarray(0, u.count));
  h.array(u.heading.subarray(0, u.count));
  h.array(u.wanderTimer.subarray(0, u.count));
  if (world.dormant) {
    h.uint32(world.dormant.count);
    h.array(world.dormant.alive);
    h.array(world.dormant.team);
    // dormant cells move on dissolve — part of state
    h.array(world.dormant.cell);
  }
  return h.digest();
}

/**
 * World state + fixed-timestep stepping. Pure and headless: no timers, no I/O,
 * no wall-clock — the worker shell schedules ticks, tests call step() directly.
 *
 * M0: the world is blank (no units yet — M2), but the SoA unit storage and the
 * state hash are real so the determinism contract is testable from day one.
 */

import { Rng } from "./rng";
import { StateHasher } from "./hash";

/** SoA unit storage (CLAUDE.md: data-oriented units). Capacity grows in M2. */
export interface UnitStore {
  count: number;
  posX: Float32Array;
  posY: Float32Array;
  team: Uint8Array;
  type: Uint8Array;
  hp: Float32Array;
}

export interface World {
  seed: number;
  tick: number;
  rng: Rng;
  units: UnitStore;
  /** Running mix of all randomness consumed — makes the hash sensitive to RNG drift. */
  noiseAccum: number;
}

export function createWorld(seed: number, unitCapacity = 0): World {
  return {
    seed: seed >>> 0,
    tick: 0,
    rng: new Rng(seed >>> 0),
    units: {
      count: 0,
      posX: new Float32Array(unitCapacity),
      posY: new Float32Array(unitCapacity),
      team: new Uint8Array(unitCapacity),
      type: new Uint8Array(unitCapacity),
      hp: new Float32Array(unitCapacity),
    },
    noiseAccum: 0,
  };
}

/** Advance the world by exactly one fixed tick (TICK_MS of sim time). */
export function step(world: World): void {
  world.tick++;
  // M0: consume one draw per tick so the hash exercises the RNG stream.
  // Replaced by real unit AI from M2 on.
  world.noiseAccum = (world.noiseAccum ^ world.rng.nextUint32()) >>> 0;
}

/** Order-stable hash of everything that defines sim state. */
export function stateHash(world: World): number {
  const h = new StateHasher();
  h.uint32(world.seed);
  h.uint32(world.tick);
  h.uint32(world.noiseAccum);
  h.array(world.rng.getState());
  const u = world.units;
  h.uint32(u.count);
  h.array(u.posX.subarray(0, u.count));
  h.array(u.posY.subarray(0, u.count));
  h.array(u.team.subarray(0, u.count));
  h.array(u.type.subarray(0, u.count));
  h.array(u.hp.subarray(0, u.count));
  return h.digest();
}

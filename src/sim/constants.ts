/**
 * All sim tuning constants live here (CLAUDE.md hard rule).
 * ⚙ marks values expected to change during playtesting.
 */

/** ⚙ SPEC §9 — fixed simulation timestep. Sim runs in a Web Worker at 20 Hz. */
export const TICK_RATE_HZ = 20;

/** Milliseconds per tick, derived from TICK_RATE_HZ. SPEC §9. */
export const TICK_MS = 1000 / TICK_RATE_HZ;

/** How often the worker posts a snapshot to the render thread (every N ticks). */
export const SNAPSHOT_EVERY_TICKS = 1;

// — World geometry (SPEC §2) ————————————————————————————————————————————

/** ⚙ SPEC §2 — ownership grid cell size. Must match scripts/build-world.ts. */
export const CELL_KM = 10;

/** World extent in km (equirectangular plane; x wraps, D14). */
export const WORLD_W_KM = 4008 * CELL_KM;
export const WORLD_H_KM = 2004 * CELL_KM;

// — Units (SPEC §3, §4, D12) ————————————————————————————————————————————

/** D12 — 1 unit represents 100,000 people. ⚙ */
export const PEOPLE_PER_UNIT = 100_000;

/** SPEC §4 — Regular base HP (team multipliers apply from M4). ⚙ */
export const REGULAR_HP = 10;

/** ⚙ Regular movement per tick in km (SPEC §4 speed 1.0 baseline). */
export const REGULAR_SPEED_KM_PER_TICK = 0.5;

/** ⚙ Idle wander: ticks between heading changes (min + random extra). */
export const WANDER_MIN_TICKS = 40;
export const WANDER_EXTRA_TICKS = 60;

/** ⚙ Spawn jitter within a 10 km cell, in km. */
export const SPAWN_JITTER_KM = 8;

// — Live zone (SPEC §9, D29) ————————————————————————————————————————————

/** D29 — locked zone radius in km. ⚙ */
export const ZONE_RADIUS_KM = 1500;

/** ⚙ SPEC §9 — live-zone unit budget; zone auto-shrinks above this. */
export const ZONE_UNIT_BUDGET = 20_000;

/** ⚙ Shrink factor applied while the zone exceeds budget. */
export const ZONE_SHRINK_FACTOR = 0.9;

/** ⚙ Spatial hash bucket size in km (≈ aggro-radius scale, SPEC §6). */
export const SPATIAL_HASH_CELL_KM = 10;

/**
 * All sim tuning constants live here (CLAUDE.md hard rule).
 * ⚙ marks values expected to change during playtesting.
 */

/** ⚙ SPEC §9 — fixed simulation timestep. Sim runs in a Web Worker at 20 Hz. */
export const TICK_RATE_HZ = 20;

/** Milliseconds per tick, derived from TICK_RATE_HZ. SPEC §9. */
export const TICK_MS = 1000 / TICK_RATE_HZ;

/** How often the worker posts a snapshot to the render thread (every N ticks). M0: every tick. */
export const SNAPSHOT_EVERY_TICKS = 1;

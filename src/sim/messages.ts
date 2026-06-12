/**
 * Message protocol between the render thread and the sim worker.
 * The worker owns all game state; the render thread only sends inputs
 * and receives snapshots (CLAUDE.md: sim/render separation).
 */

export type ToWorker =
  | { type: "init"; seed: number }
  | { type: "start" }
  | { type: "stop" };

export interface Snapshot {
  type: "snapshot";
  tick: number;
  unitCount: number;
  /** FNV-1a state hash, for the debug HUD and determinism checks. */
  hash: number;
  /** Interleaved unit positions [x0,y0,x1,y1,...] — empty until M2. */
  positions: Float32Array;
}

export type FromWorker = Snapshot | { type: "ready" };

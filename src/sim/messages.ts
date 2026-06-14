/**
 * Message protocol between the render thread and the sim worker.
 * The worker owns all game state; the render thread only sends inputs
 * and receives snapshots (CLAUDE.md: sim/render separation).
 */

import type { Zone } from "./world";

export type ToWorker =
  | { type: "init"; seed: number }
  | { type: "start" }
  | { type: "stop" }
  /** Drop / relocate the live zone at world-km coordinates. */
  | { type: "drop"; xKm: number; yKm: number };

export interface Snapshot {
  type: "snapshot";
  tick: number;
  /** FNV-1a state hash, for the debug HUD and determinism checks. */
  hash: number;
  /** Live (in-zone) unit count. */
  liveCount: number;
  /** Total units in the world (live + dormant). */
  totalUnits: number;
  /** Interleaved live-unit positions [x0,y0,x1,y1,...] in km. */
  positions: Float32Array;
  /** Live-unit team ids, parallel to positions. */
  teams: Uint8Array;
  zone: Zone | null;
}

export type FromWorker =
  | Snapshot
  | {
      type: "ready";
      /** Per-team world unit counts (index = team id). */
      teamCounts: Uint32Array;
      totalUnits: number;
    };

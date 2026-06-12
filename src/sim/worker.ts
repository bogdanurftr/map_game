/**
 * Sim worker shell: owns the World, runs the fixed 20 Hz loop, talks to the
 * render thread via messages.ts. Scheduling uses setInterval only — no wall
 * clock is ever read here, so timer jitter can never leak into sim state:
 * each firing advances exactly one tick regardless of when it runs.
 */

import { createWorld, step, stateHash, type World } from "./world";
import { TICK_MS, SNAPSHOT_EVERY_TICKS } from "./constants";
import type { ToWorker, Snapshot } from "./messages";

let world: World | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function postSnapshot(w: World): void {
  const positions = new Float32Array(w.units.count * 2);
  for (let i = 0; i < w.units.count; i++) {
    positions[i * 2] = w.units.posX[i];
    positions[i * 2 + 1] = w.units.posY[i];
  }
  const snap: Snapshot = {
    type: "snapshot",
    tick: w.tick,
    unitCount: w.units.count,
    hash: stateHash(w),
    positions,
  };
  postMessage(snap, { transfer: [positions.buffer] });
}

function tickOnce(): void {
  if (!world) return;
  step(world);
  if (world.tick % SNAPSHOT_EVERY_TICKS === 0) postSnapshot(world);
}

addEventListener("message", (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  switch (msg.type) {
    case "init":
      if (timer !== null) clearInterval(timer);
      timer = null;
      world = createWorld(msg.seed);
      postMessage({ type: "ready" });
      postSnapshot(world);
      break;
    case "start":
      if (timer === null && world) timer = setInterval(tickOnce, TICK_MS);
      break;
    case "stop":
      if (timer !== null) clearInterval(timer);
      timer = null;
      break;
  }
});

/**
 * Sim worker shell: owns the World, runs the fixed 20 Hz loop, talks to the
 * render thread via messages.ts. Scheduling uses setInterval only — no wall
 * clock is ever read here, so timer jitter can never leak into sim state:
 * each firing advances exactly one tick regardless of when it runs.
 */

import {
  createWorld,
  dropZone,
  step,
  stateHash,
  teamCounts,
  type World,
} from "./world";
import { TICK_MS, SNAPSHOT_EVERY_TICKS } from "./constants";
import type { ToWorker, Snapshot } from "./messages";
import { loadGrid } from "../shared/grid";
import type { CountryInfo } from "./units";
import countriesJson from "../../data/countries.json";
import gridUrl from "../../data/grid.bin.gz?url";

let world: World | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

function postSnapshot(w: World): void {
  const n = w.units.count;
  const positions = new Float32Array(n * 2);
  const teams = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    positions[i * 2] = w.units.posX[i];
    positions[i * 2 + 1] = w.units.posY[i];
    teams[i] = w.units.team[i];
  }
  const snap: Snapshot = {
    type: "snapshot",
    tick: w.tick,
    hash: stateHash(w),
    liveCount: n,
    totalUnits: w.dormant
      ? n + countAlive(w.dormant.alive)
      : n,
    positions,
    teams,
    zone: w.zone,
  };
  postMessage(snap, { transfer: [positions.buffer, teams.buffer] });
}

function countAlive(alive: Uint8Array): number {
  let c = 0;
  for (let i = 0; i < alive.length; i++) c += alive[i];
  return c;
}

function tickOnce(): void {
  if (!world) return;
  step(world);
  if (world.tick % SNAPSHOT_EVERY_TICKS === 0) postSnapshot(world);
}

async function init(seed: number): Promise<void> {
  const grid = await loadGrid(await fetch(gridUrl));
  const countries = countriesJson.countries as CountryInfo[];
  world = createWorld(seed, { grid, countries });
  const counts = teamCounts(world);
  let total = 0;
  for (const c of counts) total += c;
  postMessage({ type: "ready", teamCounts: counts, totalUnits: total });
  postSnapshot(world);
}

addEventListener("message", (e: MessageEvent<ToWorker>) => {
  const msg = e.data;
  switch (msg.type) {
    case "init":
      if (timer !== null) clearInterval(timer);
      timer = null;
      void init(msg.seed);
      break;
    case "start":
      if (timer === null) timer = setInterval(tickOnce, TICK_MS);
      break;
    case "stop":
      if (timer !== null) clearInterval(timer);
      timer = null;
      break;
    case "drop":
      if (world) {
        dropZone(world, msg.xKm, msg.yKm);
        postSnapshot(world);
      }
      break;
  }
});

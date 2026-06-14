/**
 * Render thread: Pixi application at 60 fps, interpolating live-unit
 * positions between the last two sim snapshots. The render thread holds no
 * game state beyond the snapshot buffer (CLAUDE.md: sim/render separation).
 */

import { Application, Graphics } from "pixi.js";
import { TICK_MS, ZONE_RADIUS_KM, WORLD_W_KM, WORLD_H_KM } from "../sim/constants";
import { wrapDelta } from "../shared/geo";
import type { FromWorker, Snapshot } from "../sim/messages";
import { Hud } from "./hud";
import { WorldView } from "./world-view";
import { CELL_COLORS } from "./colors";

/** Two-deep snapshot buffer; alpha derived from render-thread receive times. */
class SnapshotBuffer {
  prev: Snapshot | null = null;
  curr: Snapshot | null = null;
  private currAt = 0;

  push(snap: Snapshot): void {
    this.prev = this.curr;
    this.curr = snap;
    this.currAt = performance.now();
  }

  /** Interpolation factor in [0, 1] between prev and curr. */
  alpha(): number {
    if (!this.prev || !this.curr) return 1;
    return Math.min(1, (performance.now() - this.currAt) / TICK_MS);
  }
}

export async function startApp(root: HTMLElement): Promise<void> {
  const app = new Application();
  await app.init({
    resizeTo: window,
    background: "#0e1220",
    antialias: true,
  });
  root.appendChild(app.canvas);

  const world = await WorldView.load();
  world.attach(app);

  const zoneGfx = new Graphics();
  const dots = new Graphics();
  app.stage.addChild(zoneGfx, dots);

  const hud = new Hud(root);
  const buffer = new SnapshotBuffer();
  let totalUnits = 0;

  const worker = new Worker(new URL("../sim/worker.ts", import.meta.url), {
    type: "module",
  });
  worker.addEventListener("message", (e: MessageEvent<FromWorker>) => {
    const msg = e.data;
    if (msg.type === "ready") {
      totalUnits = msg.totalUnits;
      worker.postMessage({ type: "start" });
    } else if (msg.type === "snapshot") {
      totalUnits = msg.totalUnits;
      buffer.push(msg);
    }
  });

  const params = new URLSearchParams(location.search);
  const seed = (Number(params.get("seed")) || 1) >>> 0;
  worker.postMessage({ type: "init", seed });

  const drop = (xKm: number, yKm: number) => {
    worker.postMessage({ type: "drop", xKm, yKm });
    world.zoomTo(xKm, yKm, ZONE_RADIUS_KM * 2.6);
  };
  world.onWorldClick = drop;

  if (import.meta.env.DEV) {
    // Dev hook for headless verification: drop by lon/lat.
    (window as unknown as Record<string, unknown>).__dropLonLat = (
      lon: number,
      lat: number,
    ) => drop(((lon + 180) / 360) * WORLD_W_KM, ((90 - lat) / 180) * WORLD_H_KM);
  }

  app.ticker.add(() => {
    hud.frame();
    const { prev, curr } = buffer;
    if (!curr) return;

    // Zone outline
    zoneGfx.clear();
    if (curr.zone) {
      const c = world.kmToScreen(curr.zone.xKm, curr.zone.yKm, 1e9);
      if (c) {
        zoneGfx
          .circle(c[0], c[1], curr.zone.radiusKm * world.pxPerKm())
          .stroke({ width: 2, color: 0xffffff, alpha: 0.5 });
      }
    }

    // Live units, interpolated between the two latest snapshots. After a
    // drop the unit set changes — only lerp when the sets line up.
    dots.clear();
    const a = buffer.alpha();
    const lerpOk =
      prev && prev.positions.length === curr.positions.length;
    const from = lerpOk ? prev.positions : curr.positions;
    const r = Math.max(1.2, 2.2 * world.pxPerKm() * 10);
    for (let i = 0; i < curr.liveCount; i++) {
      const x0 = from[i * 2];
      const x1 = curr.positions[i * 2];
      const xKm = x0 + wrapDelta(x0, x1, WORLD_W_KM) * a;
      const yKm = from[i * 2 + 1] + (curr.positions[i * 2 + 1] - from[i * 2 + 1]) * a;
      const s = world.kmToScreen(xKm, yKm);
      if (!s) continue;
      dots
        .circle(s[0], s[1], r)
        .fill(CELL_COLORS[curr.teams[i]] ?? 0xffffff);
    }

    hud.render(curr.tick, curr.liveCount, totalUnits, curr.hash);
  });
}

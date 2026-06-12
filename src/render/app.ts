/**
 * Render thread: Pixi application at 60 fps, interpolating between the last
 * two sim snapshots. The render thread holds no game state beyond the
 * snapshot buffer (CLAUDE.md: sim/render separation).
 */

import { Application, Graphics } from "pixi.js";
import { TICK_MS } from "../sim/constants";
import type { FromWorker, Snapshot } from "../sim/messages";
import { Hud } from "./hud";

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

  const dots = new Graphics();
  app.stage.addChild(dots);

  const hud = new Hud(root);
  const buffer = new SnapshotBuffer();

  const worker = new Worker(new URL("../sim/worker.ts", import.meta.url), {
    type: "module",
  });
  worker.addEventListener("message", (e: MessageEvent<FromWorker>) => {
    const msg = e.data;
    if (msg.type === "ready") worker.postMessage({ type: "start" });
    else if (msg.type === "snapshot") buffer.push(msg);
  });

  const params = new URLSearchParams(location.search);
  const seed = (Number(params.get("seed")) || 1) >>> 0;
  worker.postMessage({ type: "init", seed });

  app.ticker.add(() => {
    hud.frame();
    const { prev, curr } = buffer;
    if (!curr) return;

    // Lerp unit positions between the two latest snapshots (empty until M2,
    // but the interpolation path runs every frame from M0 on).
    dots.clear();
    const a = buffer.alpha();
    const from =
      prev && prev.positions.length === curr.positions.length
        ? prev.positions
        : curr.positions;
    for (let i = 0; i < curr.positions.length; i += 2) {
      const x = from[i] + (curr.positions[i] - from[i]) * a;
      const y = from[i + 1] + (curr.positions[i + 1] - from[i + 1]) * a;
      dots.circle(x, y, 2).fill(0xffffff);
    }

    hud.render(curr.tick, curr.unitCount, curr.hash);
  });
}

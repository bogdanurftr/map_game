/** Debug HUD: FPS, tick count, unit count, state hash (M0 accept criteria). */

import { hashHex } from "../sim/hash";

export class Hud {
  private el: HTMLDivElement;
  private fpsEma = 60;
  private lastFrameTime = performance.now();

  constructor(parent: HTMLElement) {
    this.el = document.createElement("div");
    this.el.id = "hud";
    parent.appendChild(this.el);
    this.render(0, 0, 0, 0);
  }

  /** Call once per rAF frame to keep the FPS estimate fresh. */
  frame(): void {
    const now = performance.now();
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;
    if (dt > 0) this.fpsEma += (1000 / dt - this.fpsEma) * 0.05;
  }

  render(tick: number, liveCount: number, totalUnits: number, hash: number): void {
    this.el.textContent =
      `fps ${this.fpsEma.toFixed(0)}  ` +
      `tick ${tick}  ` +
      `live ${liveCount}  ` +
      `world ${totalUnits}  ` +
      `hash ${hashHex(hash)}` +
      (liveCount === 0 ? "  —  click the map to drop a zone" : "");
  }
}

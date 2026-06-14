/**
 * World view: the 10 km ownership grid rendered as a team-colored map with
 * seamless horizontal wrap panning (D14), zoom, and click-to-drop. Two copies
 * of the map texture slide together; when one scrolls off, it re-enters from
 * the other side. Also maps world-km coordinates ↔ screen pixels for overlays.
 */

import { Application, Container, FederatedPointerEvent, Sprite, Texture } from "pixi.js";
import { loadGrid, type WorldGrid } from "../shared/grid";
import { CELL_COLORS } from "./colors";
import gridUrl from "../../data/grid.bin.gz?url";

const CLICK_SLOP_PX = 6;

export class WorldView {
  readonly container = new Container();
  private readonly mapW: number;
  private readonly mapH: number;
  private readonly copies: [Sprite, Sprite];
  private offsetX = 0;
  private offsetY = 0;
  private scale = 1;
  private minScale = 1;
  private viewW = 0;
  private viewH = 0;
  /** Called with world-km coordinates when the user clicks (not drags). */
  onWorldClick: ((xKm: number, yKm: number) => void) | null = null;

  constructor(readonly grid: WorldGrid) {
    this.mapW = grid.width;
    this.mapH = grid.height;
    const texture = buildMapTexture(grid);
    this.copies = [new Sprite(texture), new Sprite(texture)];
    this.container.addChild(...this.copies);
  }

  static async load(): Promise<WorldView> {
    return new WorldView(await loadGrid(await fetch(gridUrl)));
  }

  attach(app: Application): void {
    app.stage.addChildAt(this.container, 0);
    this.resize(app.renderer.width, app.renderer.height);

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastY = 0;
    app.stage.on("pointerdown", (e: FederatedPointerEvent) => {
      dragging = true;
      moved = 0;
      lastX = e.globalX;
      lastY = e.globalY;
    });
    const finish = (e: FederatedPointerEvent) => {
      if (dragging && moved <= CLICK_SLOP_PX && this.onWorldClick) {
        const [xKm, yKm] = this.screenToKm(e.globalX, e.globalY);
        this.onWorldClick(xKm, yKm);
      }
      dragging = false;
    };
    app.stage.on("pointerup", finish);
    app.stage.on("pointerupoutside", finish);
    app.stage.on("pointermove", (e: FederatedPointerEvent) => {
      if (!dragging) return;
      moved += Math.abs(e.globalX - lastX) + Math.abs(e.globalY - lastY);
      this.pan(e.globalX - lastX, e.globalY - lastY);
      lastX = e.globalX;
      lastY = e.globalY;
    });
    app.renderer.on("resize", (w: number, h: number) => this.resize(w, h));
  }

  resize(viewW: number, viewH: number): void {
    this.viewW = viewW;
    this.viewH = viewH;
    // Fill the viewport: never let the map be smaller than the screen.
    this.minScale = Math.max(viewH / this.mapH, viewW / (this.mapW * 2));
    this.scale = Math.max(this.scale, this.minScale);
    this.layout();
  }

  pan(dx: number, dy: number): void {
    this.offsetX += dx;
    this.offsetY += dy;
    this.layout();
  }

  /** Center the view on (xKm, yKm) showing ~spanKm vertically. */
  zoomTo(xKm: number, yKm: number, spanKm: number): void {
    const cellKm = this.grid.cellKm;
    this.scale = Math.max(this.minScale, this.viewH / (spanKm / cellKm));
    const px = (xKm / cellKm) * this.scale;
    const py = (yKm / cellKm) * this.scale;
    this.offsetX = this.viewW / 2 - px;
    this.offsetY = this.viewH / 2 - py;
    this.layout();
  }

  /** World km → screen px. Returns null when off-screen (wrap-aware). */
  kmToScreen(xKm: number, yKm: number, marginPx = 16): [number, number] | null {
    const w = this.mapW * this.scale;
    const px = (xKm / this.grid.cellKm) * this.scale;
    const py = (yKm / this.grid.cellKm) * this.scale + this.offsetY;
    if (py < -marginPx || py > this.viewH + marginPx) return null;
    const sx = (((px + this.offsetX) % w) + w) % w;
    if (sx < this.viewW + marginPx) return [sx, py];
    if (sx - w >= -marginPx) return [sx - w, py];
    return null;
  }

  screenToKm(sx: number, sy: number): [number, number] {
    const w = this.mapW * this.scale;
    const px = (((sx - this.offsetX) % w) + w) % w;
    const py = sy - this.offsetY;
    return [
      (px / this.scale) * this.grid.cellKm,
      (py / this.scale) * this.grid.cellKm,
    ];
  }

  /** Pixels per km at the current zoom (for sizing overlays). */
  pxPerKm(): number {
    return this.scale / this.grid.cellKm;
  }

  private layout(): void {
    const w = this.mapW * this.scale;
    const h = this.mapH * this.scale;
    // Horizontal: wrap modulo one map width (seamless across the date line).
    this.offsetX = ((this.offsetX % w) + w) % w;
    // Vertical: clamp so the map always covers the viewport.
    this.offsetY = Math.min(0, Math.max(this.viewH - h, this.offsetY));

    for (const [i, sprite] of this.copies.entries()) {
      sprite.setSize(w, h);
      sprite.x = this.offsetX - w + i * w;
      sprite.y = this.offsetY;
    }
  }
}

function buildMapTexture(grid: WorldGrid): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = grid.width;
  canvas.height = grid.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d context unavailable");
  const img = ctx.createImageData(grid.width, grid.height);
  const px = new Uint32Array(img.data.buffer);
  for (let i = 0; i < grid.teams.length; i++) {
    const c = CELL_COLORS[grid.teams[i]] ?? 0xff00ff;
    // canvas pixels are little-endian ABGR
    px[i] =
      0xff000000 | ((c & 0xff) << 16) | (c & 0x00ff00) | ((c >> 16) & 0xff);
  }
  ctx.putImageData(img, 0, 0);
  return Texture.from(canvas);
}

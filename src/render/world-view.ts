/**
 * World view (M1): the 10 km ownership grid rendered as a team-colored map
 * with seamless horizontal wrap panning (D14). Two copies of the map texture
 * slide together; when one scrolls off, it re-enters from the other side.
 */

import { Application, Container, Sprite, Texture } from "pixi.js";
import { parseGrid, type WorldGrid } from "../shared/grid";
import { CELL_COLORS } from "./colors";
import gridUrl from "../../data/grid.bin?url";

export class WorldView {
  readonly container = new Container();
  private readonly mapW: number;
  private readonly mapH: number;
  private readonly copies: [Sprite, Sprite];
  private offsetX = 0;
  private offsetY = 0;
  private scale = 1;
  private viewH = 0;

  constructor(readonly grid: WorldGrid) {
    this.mapW = grid.width;
    this.mapH = grid.height;
    const texture = buildMapTexture(grid);
    this.copies = [new Sprite(texture), new Sprite(texture)];
    this.container.addChild(...this.copies);
  }

  static async load(): Promise<WorldView> {
    const res = await fetch(gridUrl);
    if (!res.ok) throw new Error(`failed to load grid.bin: ${res.status}`);
    return new WorldView(parseGrid(await res.arrayBuffer()));
  }

  attach(app: Application): void {
    app.stage.addChildAt(this.container, 0);
    this.resize(app.renderer.width, app.renderer.height);

    app.stage.eventMode = "static";
    app.stage.hitArea = app.screen;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    app.stage.on("pointerdown", (e) => {
      dragging = true;
      lastX = e.globalX;
      lastY = e.globalY;
    });
    app.stage.on("pointerup", () => (dragging = false));
    app.stage.on("pointerupoutside", () => (dragging = false));
    app.stage.on("pointermove", (e) => {
      if (!dragging) return;
      this.pan(e.globalX - lastX, e.globalY - lastY);
      lastX = e.globalX;
      lastY = e.globalY;
    });
    app.renderer.on("resize", (w: number, h: number) => this.resize(w, h));
  }

  resize(viewW: number, viewH: number): void {
    this.viewH = viewH;
    // Fill the viewport: never let the map be smaller than the screen.
    this.scale = Math.max(viewH / this.mapH, viewW / (this.mapW * 2));
    this.layout();
  }

  pan(dx: number, dy: number): void {
    this.offsetX += dx;
    this.offsetY += dy;
    this.layout();
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
    // offsetX ∈ [0, w): copy 0 spans [offsetX-w, offsetX), copy 1 covers the
    // rest of the viewport up to offsetX+w — together ≥ 2w ≥ viewport width.
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
  for (let i = 0; i < grid.cells.length; i++) {
    const c = CELL_COLORS[grid.cells[i]] ?? 0xff00ff;
    // canvas pixels are little-endian ABGR
    px[i] =
      0xff000000 | ((c & 0xff) << 16) | (c & 0x00ff00) | ((c >> 16) & 0xff);
  }
  ctx.putImageData(img, 0, 0);
  return Texture.from(canvas);
}

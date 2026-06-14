/**
 * Uniform-grid spatial hash over live units (CLAUDE.md: data-oriented).
 * Rebuilt each tick; buckets are linked lists in flat typed arrays
 * (Map only stores bucket heads — never iterated, so determinism is safe).
 */

import { SPATIAL_HASH_CELL_KM, WORLD_W_KM } from "./constants";
import { wrapDelta, wrapDist2 } from "../shared/geo";

const COLS = Math.ceil(WORLD_W_KM / SPATIAL_HASH_CELL_KM);

export class SpatialHash {
  private heads = new Map<number, number>();
  private next = new Int32Array(0);
  private posX: Float32Array = new Float32Array(0);
  private posY: Float32Array = new Float32Array(0);

  private key(x: number, y: number): number {
    const gx =
      ((Math.floor(x / SPATIAL_HASH_CELL_KM) % COLS) + COLS) % COLS;
    const gy = Math.floor(y / SPATIAL_HASH_CELL_KM);
    return gy * COLS + gx;
  }

  rebuild(posX: Float32Array, posY: Float32Array, count: number): void {
    this.posX = posX;
    this.posY = posY;
    this.heads.clear();
    if (this.next.length < count) this.next = new Int32Array(count);
    for (let i = 0; i < count; i++) {
      const k = this.key(posX[i], posY[i]);
      this.next[i] = this.heads.get(k) ?? -1;
      this.heads.set(k, i);
    }
  }

  /** Visit every unit within radiusKm of (x, y), wrap-aware. */
  forEachInRadius(
    x: number,
    y: number,
    radiusKm: number,
    visit: (index: number) => void,
  ): void {
    const r2 = radiusKm * radiusKm;
    const span = Math.ceil(radiusKm / SPATIAL_HASH_CELL_KM);
    const cgx = Math.floor(x / SPATIAL_HASH_CELL_KM);
    const cgy = Math.floor(y / SPATIAL_HASH_CELL_KM);
    for (let gy = cgy - span; gy <= cgy + span; gy++) {
      for (let gx = cgx - span; gx <= cgx + span; gx++) {
        const k = gy * COLS + (((gx % COLS) + COLS) % COLS);
        for (let i = this.heads.get(k) ?? -1; i !== -1; i = this.next[i]) {
          if (
            wrapDist2(x, y, this.posX[i], this.posY[i], WORLD_W_KM) <= r2 &&
            Math.abs(wrapDelta(x, this.posX[i], WORLD_W_KM)) <= radiusKm
          ) {
            visit(i);
          }
        }
      }
    }
  }
}

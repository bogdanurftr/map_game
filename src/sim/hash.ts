/**
 * FNV-1a 32-bit running hash over sim state. Used by the M0 determinism test
 * and the debug HUD; later by the save-system load verification (SPEC §11).
 */

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

export class StateHasher {
  private h = FNV_OFFSET;

  private byte(b: number): void {
    this.h = Math.imul(this.h ^ (b & 0xff), FNV_PRIME) >>> 0;
  }

  uint32(v: number): this {
    v = v >>> 0;
    this.byte(v);
    this.byte(v >>> 8);
    this.byte(v >>> 16);
    this.byte(v >>> 24);
    return this;
  }

  /** Hash a float by its exact IEEE-754 bit pattern. */
  float64(v: number): this {
    scratchF64[0] = v;
    this.uint32(scratchU32[0]);
    this.uint32(scratchU32[1]);
    return this;
  }

  array(
    arr: Uint8Array | Uint16Array | Uint32Array | Int32Array | Float32Array,
  ): this {
    const bytes = new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
    for (let i = 0; i < bytes.length; i++) this.byte(bytes[i]);
    return this;
  }

  digest(): number {
    return this.h >>> 0;
  }
}

const scratchF64 = new Float64Array(1);
const scratchU32 = new Uint32Array(scratchF64.buffer);

export function hashHex(h: number): string {
  return (h >>> 0).toString(16).padStart(8, "0");
}

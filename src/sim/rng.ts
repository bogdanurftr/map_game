/**
 * Seeded deterministic PRNG (sfc32). The ONLY source of randomness allowed in
 * src/sim/** (CLAUDE.md hard rule). State is fully exportable for saves (SPEC §11).
 */

/** splitmix32 — expands a single uint32 seed into well-mixed stream of uint32s. */
function splitmix32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x9e3779b9) >>> 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad);
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97);
    return (z ^ (z >>> 15)) >>> 0;
  };
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: number) {
    const mix = splitmix32(seed);
    this.a = mix();
    this.b = mix();
    this.c = mix();
    this.d = mix();
    // Warm up so nearby seeds diverge fully.
    for (let i = 0; i < 12; i++) this.nextUint32();
  }

  /** Next uint32 in [0, 2^32). */
  nextUint32(): number {
    const t = (((this.a + this.b) >>> 0) + this.d) >>> 0;
    this.d = (this.d + 1) >>> 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) >>> 0;
    this.c = ((this.c << 21) | (this.c >>> 11)) >>> 0;
    this.c = (this.c + t) >>> 0;
    return t;
  }

  /** Float in [0, 1). */
  nextFloat(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Integer in [0, n). */
  nextInt(n: number): number {
    return Math.floor(this.nextFloat() * n);
  }

  /** Full internal state, for save snapshots and state hashing. */
  getState(): Uint32Array {
    return Uint32Array.of(this.a, this.b, this.c, this.d);
  }

  setState(state: Uint32Array): void {
    if (state.length !== 4) throw new Error("Rng state must be 4 uint32s");
    this.a = state[0] >>> 0;
    this.b = state[1] >>> 0;
    this.c = state[2] >>> 0;
    this.d = state[3] >>> 0;
  }
}

import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createWorld, step, stateHash } from "../src/sim/world";
import { Rng } from "../src/sim/rng";

const TICKS = 10_000;

describe("determinism (M0 accept)", () => {
  it("two runs with the same seed produce identical state hashes after 10,000 ticks", () => {
    const a = createWorld(0xc0ffee);
    const b = createWorld(0xc0ffee);
    for (let t = 0; t < TICKS; t++) {
      step(a);
      step(b);
      // Compare along the way too, so a divergence pinpoints its first tick.
      if (t % 1000 === 0 && stateHash(a) !== stateHash(b)) {
        throw new Error(`state diverged at tick ${t + 1}`);
      }
    }
    expect(stateHash(a)).toBe(stateHash(b));
    expect(a.tick).toBe(TICKS);
  });

  it("different seeds produce different hashes", () => {
    const a = createWorld(1);
    const b = createWorld(2);
    for (let t = 0; t < 100; t++) {
      step(a);
      step(b);
    }
    expect(stateHash(a)).not.toBe(stateHash(b));
  });

  it("hash changes every tick (state actually evolves)", () => {
    const w = createWorld(42);
    const seen = new Set<number>();
    for (let t = 0; t < 1000; t++) {
      step(w);
      seen.add(stateHash(w));
    }
    expect(seen.size).toBe(1000);
  });

  it("rng state round-trips exactly (save-system prerequisite)", () => {
    const a = new Rng(7);
    for (let i = 0; i < 50; i++) a.nextUint32();
    const b = new Rng(999);
    b.setState(a.getState());
    for (let i = 0; i < 100; i++) {
      expect(b.nextUint32()).toBe(a.nextUint32());
    }
  });
});

describe("sim purity (M0 accept)", () => {
  it("src/sim/** contains no Math.random / wall-clock reads", () => {
    const simDir = join(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "src",
      "sim",
    );
    const forbidden = [/Math\.random/, /Date\.now/, /performance\.now/, /new Date\(/];
    for (const file of readdirSync(simDir)) {
      if (!file.endsWith(".ts")) continue;
      const src = readFileSync(join(simDir, file), "utf8");
      for (const pattern of forbidden) {
        expect(src, `${file} must not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

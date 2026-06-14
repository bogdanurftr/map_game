import { describe, expect, it } from "vitest";
import { loadWorldData } from "./helpers";
import {
  createWorld,
  dropZone,
  step,
  stateHash,
  teamCounts,
} from "../src/sim/world";
import { PEOPLE_PER_UNIT, ZONE_UNIT_BUDGET, WORLD_W_KM, WORLD_H_KM } from "../src/sim/constants";
import { SpatialHash } from "../src/sim/spatial-hash";
import { wrapDist2 } from "../src/shared/geo";
import { Rng } from "../src/sim/rng";

const data = loadWorldData();

/** World-km coords of a lon/lat point (equirectangular). */
const km = (lon: number, lat: number): [number, number] => [
  ((lon + 180) / 360) * WORLD_W_KM,
  ((90 - lat) / 180) * WORLD_H_KM,
];

describe("unit spawning (M2 accept)", () => {
  it("unit counts per team match countries.json", () => {
    const world = createWorld(7, data);
    const expected = new Map<number, number>();
    for (const c of data.countries) {
      const units = Math.round(c.population / PEOPLE_PER_UNIT);
      expected.set(c.team, (expected.get(c.team) ?? 0) + units);
    }
    const counts = teamCounts(world);
    for (const [team, n] of expected) {
      expect(counts[team], `team ${team}`).toBe(n);
    }
    const total = [...expected.values()].reduce((a, b) => a + b, 0);
    expect(world.dormant!.count).toBe(total);
    expect(total).toBeGreaterThan(75_000); // ~82k world (D12)
  });

  it("dropping a zone materializes units and conserves totals", () => {
    const world = createWorld(7, data);
    const before = teamCounts(world);
    const [x, y] = km(35.0, 31.5); // Middle East (Israel / Levant)
    const zone = dropZone(world, x, y);
    expect(zone.radiusKm).toBeGreaterThan(0);
    expect(world.units.count).toBeGreaterThan(1000);
    expect(world.units.count).toBeLessThanOrEqual(ZONE_UNIT_BUDGET);
    // Conservation: totals per team unchanged by materialization
    expect([...teamCounts(world)]).toEqual([...before]);
    // L.Blue (team 6) must be present in a Levant drop
    let lblue = 0;
    for (let i = 0; i < world.units.count; i++) {
      if (world.units.team[i] === 6) lblue++;
    }
    expect(lblue).toBeGreaterThan(50); // ~100 units (SPEC §3)
  });

  it("conservation holds across wandering and re-drops", () => {
    const world = createWorld(11, data);
    const before = [...teamCounts(world)];
    const [x1, y1] = km(35.0, 31.5);
    dropZone(world, x1, y1);
    for (let t = 0; t < 200; t++) step(world);
    expect([...teamCounts(world)]).toEqual(before);
    const [x2, y2] = km(105.0, 35.0); // re-drop into China
    dropZone(world, x2, y2);
    expect(world.units.count).toBeLessThanOrEqual(ZONE_UNIT_BUDGET);
    for (let t = 0; t < 200; t++) step(world);
    expect([...teamCounts(world)]).toEqual(before);
  });

  it("two runs with the same seed stay hash-identical through drop + 1,000 ticks", () => {
    const a = createWorld(42, data);
    const b = createWorld(42, data);
    const [x, y] = km(35.0, 31.5);
    dropZone(a, x, y);
    dropZone(b, x, y);
    expect(stateHash(a)).toBe(stateHash(b));
    for (let t = 0; t < 1000; t++) {
      step(a);
      step(b);
    }
    expect(stateHash(a)).toBe(stateHash(b));
    expect(a.units.count).toBeGreaterThan(0);
  });
});

describe("spatial hash", () => {
  it("radius queries match brute force (wrap-aware)", () => {
    const rng = new Rng(3);
    const n = 2000;
    const posX = new Float32Array(n);
    const posY = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      // cluster near the date line to exercise wrapping
      posX[i] = ((rng.nextFloat() * 600 - 300) + WORLD_W_KM) % WORLD_W_KM;
      posY[i] = WORLD_H_KM / 2 + (rng.nextFloat() - 0.5) * 600;
    }
    const hash = new SpatialHash();
    hash.rebuild(posX, posY, n);
    for (const [qx, qy, r] of [
      [10, WORLD_H_KM / 2, 50],
      [WORLD_W_KM - 10, WORLD_H_KM / 2, 80],
      [200, WORLD_H_KM / 2 + 100, 120],
    ]) {
      const got = new Set<number>();
      hash.forEachInRadius(qx, qy, r, (i) => got.add(i));
      const want = new Set<number>();
      for (let i = 0; i < n; i++) {
        if (wrapDist2(qx, qy, posX[i], posY[i], WORLD_W_KM) <= r * r) {
          want.add(i);
        }
      }
      expect(got).toEqual(want);
    }
  });
});

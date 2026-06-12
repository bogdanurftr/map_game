import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGrid, lonLatToCell, wrapCol } from "../src/shared/grid";
import { SPEC_POP_TARGETS_M as TARGETS } from "../scripts/team-assignment";

const DATA = join(dirname(fileURLToPath(import.meta.url)), "..", "data");

interface Country {
  iso3: string;
  team: number;
  population: number;
}

function loadCountries(): Country[] {
  return JSON.parse(readFileSync(join(DATA, "countries.json"), "utf8"))
    .countries as Country[];
}

describe("world data (M1 accept)", () => {
  it("team population totals match SPEC §3 within 5%", () => {
    const totals = new Map<number, number>();
    for (const c of loadCountries()) {
      totals.set(c.team, (totals.get(c.team) ?? 0) + c.population);
    }
    for (const [team, targetM] of Object.entries(TARGETS)) {
      const popM = (totals.get(Number(team)) ?? 0) / 1e6;
      const dev = Math.abs(popM / targetM - 1);
      expect(dev, `team ${team}: ${popM.toFixed(0)}M vs ${targetM}M`)
        .toBeLessThanOrEqual(0.05);
    }
  });

  it("grid ownership matches the team map at known locations", () => {
    const grid = parseGrid(
      readFileSync(join(DATA, "grid.bin")).buffer as ArrayBuffer,
    );
    expect(grid.cellKm).toBe(10);
    // [lon, lat, expected cell value]
    const probes: [number, number, number, string][] = [
      [116.4, 39.9, 1, "Beijing → Orange"],
      [106.9, 47.9, 1, "Ulaanbaatar → Orange (A2)"],
      [77.2, 28.6, 5, "Delhi → Purple (A2)"],
      [-77.0, 38.9, 2, "Washington → Red"],
      [-47.9, -15.8, 2, "Brasília → Red"],
      [37.6, 55.8, 5, "Moscow → Purple (A3)"],
      [44.8, 41.7, 5, "Tbilisi → Purple (A3)"],
      [15.3, -4.3, 4, "Kinshasa → Yellow (A3)"],
      [28.1, -26.2, 4, "Johannesburg → Yellow (A3)"],
      [31.2, 30.1, 3, "Cairo → Green"],
      [67.0, 24.9, 3, "Karachi → Green"],
      [106.8, -6.2, 3, "Jakarta → Green"],
      [105.8, 21.0, 4, "Hanoi → Yellow"],
      [127.0, 37.5, 4, "Seoul → Yellow"],
      [139.7, 35.7, 5, "Tokyo → Purple"],
      [100.5, 13.8, 5, "Bangkok → Purple"],
      [34.8, 32.1, 6, "Tel Aviv → L.Blue"],
      [-30.0, 30.0, 0, "mid-Atlantic → water"],
      [0.0, -77.0, 7, "Antarctica → unclaimed"],
    ];
    for (const [lon, lat, expected, label] of probes) {
      expect(lonLatToCell(grid, lon, lat), label).toBe(expected);
    }
  });

  it("column index wraps seamlessly across the date line (D14)", () => {
    expect(wrapCol(-1, 4008)).toBe(4007);
    expect(wrapCol(4008, 4008)).toBe(0);
    expect(wrapCol(-4009, 4008)).toBe(4007);
    // a cell just west of lon 180 equals the cell just east of lon -180
    const grid = parseGrid(
      readFileSync(join(DATA, "grid.bin")).buffer as ArrayBuffer,
    );
    // Chukotka (Russia, Purple since A3) spans the date line
    expect(lonLatToCell(grid, 179.9, 66.0), "Chukotka west of date line").toBe(
      lonLatToCell(grid, 179.9, 66.0),
    );
    expect(lonLatToCell(grid, -179.9, 66.0), "Chukotka east of date line").toBe(
      5,
    );
  });

  it("resources.json has all core-4 kinds with SPEC §5 amounts", () => {
    const nodes = JSON.parse(
      readFileSync(join(DATA, "resources.json"), "utf8"),
    ) as { kind: string; amount: number }[];
    const amounts: Record<string, number> = {
      iron: 400,
      oil: 250,
      copper: 250,
      gold: 150,
    };
    const kinds = new Set(nodes.map((n) => n.kind));
    expect([...kinds].sort()).toEqual(["copper", "gold", "iron", "oil"]);
    for (const n of nodes) expect(n.amount).toBe(amounts[n.kind]);
  });
});

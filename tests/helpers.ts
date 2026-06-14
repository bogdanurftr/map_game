import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseGrid } from "../src/shared/grid";
import type { WorldData } from "../src/sim/world";
import type { CountryInfo } from "../src/sim/units";

export const DATA_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "data",
);

export function loadWorldData(): WorldData {
  const gz = readFileSync(join(DATA_DIR, "grid.bin.gz"));
  const raw = gunzipSync(gz);
  const grid = parseGrid(
    raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength),
  );
  const countries = (
    JSON.parse(readFileSync(join(DATA_DIR, "countries.json"), "utf8")) as {
      countries: CountryInfo[];
    }
  ).countries;
  return { grid, countries };
}

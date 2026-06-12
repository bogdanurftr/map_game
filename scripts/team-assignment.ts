/**
 * Country → team assignment, reconstructing team_map_draft_v1.md (see that
 * doc and DECISIONS.md → Amendments A1). Keyed by Natural Earth ADM0_A3
 * (NOT ISO_A3 — NE sets ISO_A3 to -99 for France, Norway, and others).
 *
 * Teams (SPEC §3): 1 Orange, 2 Red, 3 Green, 4 Yellow, 5 Purple, 6 L.Blue.
 */

export const TEAM = {
  NONE: 0, // water / unclaimed land (Antarctica)
  ORANGE: 1,
  RED: 2,
  GREEN: 3,
  YELLOW: 4,
  PURPLE: 5,
  LBLUE: 6,
} as const;

export type TeamId = (typeof TEAM)[keyof typeof TEAM];

export const TEAM_NAMES: Record<number, string> = {
  0: "None",
  1: "Orange",
  2: "Red",
  3: "Green",
  4: "Yellow",
  5: "Purple",
  6: "L.Blue",
};

/** SPEC §3 population targets (millions) — build script verifies ±5%.
 *  Retargeted by Amendments A2 (India → Purple, Mongolia → Orange) and
 *  A3 (Sub-Saharan Red → Yellow; Russia/Belarus/Caucasus → Purple). */
export const SPEC_POP_TARGETS_M: Record<number, number> = {
  [TEAM.ORANGE]: 1570,
  [TEAM.RED]: 1860,
  [TEAM.GREEN]: 2000,
  [TEAM.YELLOW]: 850,
  [TEAM.PURPLE]: 1940,
  [TEAM.LBLUE]: 10,
};

/** Explicit assignments. Anything not listed falls back to SUBREGION rules. */
const EXPLICIT: Record<string, TeamId> = {
  // — Orange: Chinese-civilization bloc (team map doc §2; A2)
  CHN: TEAM.ORANGE,
  MNG: TEAM.ORANGE, // A2: Bogdan's correction (was Purple)
  NPL: TEAM.ORANGE,
  SGP: TEAM.ORANGE, // O2: Chinese-majority
  HKG: TEAM.ORANGE,
  MAC: TEAM.ORANGE,
  MUS: TEAM.ORANGE, // Hindu plurality
  LKA: TEAM.ORANGE, // Indian-sphere; keeps Purple within SPEC §3 band

  // — Purple: Japan + Buddhist belt + India (D4 as amended by A2)
  IND: TEAM.PURPLE, // A2: Bogdan's correction (was Orange)
  JPN: TEAM.PURPLE,
  // A3: Russia, Belarus + Caucasus → Purple (Bogdan's correction)
  RUS: TEAM.PURPLE,
  BLR: TEAM.PURPLE,
  ARM: TEAM.PURPLE,
  GEO: TEAM.PURPLE,
  AZE: TEAM.PURPLE,
  THA: TEAM.PURPLE,
  MMR: TEAM.PURPLE,
  KHM: TEAM.PURPLE,
  LAO: TEAM.PURPLE,
  BTN: TEAM.PURPLE,

  // — L.Blue (D1)
  ISR: TEAM.LBLUE,

  // — Yellow: folk / unaffiliated-majority bloc (team map doc §5)
  VNM: TEAM.YELLOW,
  KOR: TEAM.YELLOW, // O2: "no religion" plurality
  PRK: TEAM.YELLOW,
  TWN: TEAM.YELLOW, // O2: folk-religion plurality
  TZA: TEAM.YELLOW,
  MOZ: TEAM.YELLOW,
  MDG: TEAM.YELLOW,
  BEN: TEAM.YELLOW,
  TGO: TEAM.YELLOW,
  SDS: TEAM.YELLOW, // South Sudan
  GNB: TEAM.YELLOW,
  CZE: TEAM.YELLOW,
  EST: TEAM.YELLOW,
  URY: TEAM.YELLOW,

  // — Green: Muslim-majority outside the default-Green subregions
  IDN: TEAM.GREEN,
  MYS: TEAM.GREEN,
  BRN: TEAM.GREEN,
  BGD: TEAM.GREEN,
  PAK: TEAM.GREEN,
  AFG: TEAM.GREEN,
  MDV: TEAM.GREEN,
  ALB: TEAM.GREEN,
  BIH: TEAM.GREEN,
  KOS: TEAM.GREEN,
  NGA: TEAM.GREEN, // O2: Muslim plurality + north dominance
  MLI: TEAM.GREEN,
  NER: TEAM.GREEN,
  SEN: TEAM.GREEN,
  GMB: TEAM.GREEN,
  GIN: TEAM.GREEN,
  BFA: TEAM.GREEN,
  TCD: TEAM.GREEN,
  SOM: TEAM.GREEN,
  SOL: TEAM.GREEN, // Somaliland
  MRT: TEAM.GREEN,
  DJI: TEAM.GREEN,
  COM: TEAM.GREEN,
  ERI: TEAM.GREEN,
  SLE: TEAM.GREEN,
  CIV: TEAM.GREEN, // Muslim plurality
  ETH: TEAM.GREEN, // ⚠ tuning choice — see team map doc §7
  CYN: TEAM.GREEN, // N. Cyprus
  PSX: TEAM.GREEN, // Palestine

  // — Red overrides inside default-Green subregions (D2 / Christian)
  CYP: TEAM.RED,
  PHL: TEAM.RED,
  TLS: TEAM.RED,
  GRL: TEAM.RED,

  // — Unclaimed
  ATA: TEAM.NONE, // Antarctica
};

/** SUBREGION fallbacks (Natural Earth SUBREGION property). */
const SUBREGION_DEFAULT: Record<string, TeamId> = {
  "Northern Africa": TEAM.GREEN,
  "Western Asia": TEAM.GREEN,
  "Central Asia": TEAM.GREEN,
  "Southern Asia": TEAM.GREEN,
  "South-Eastern Asia": TEAM.PURPLE,
  "Eastern Asia": TEAM.ORANGE,
  "Northern America": TEAM.RED,
  "Central America": TEAM.RED,
  Caribbean: TEAM.RED,
  "South America": TEAM.RED,
  "Northern Europe": TEAM.RED,
  "Western Europe": TEAM.RED,
  "Southern Europe": TEAM.RED,
  "Eastern Europe": TEAM.RED,
  // A3: Sub-Saharan non-Muslim Africa is Yellow (was Red)
  "Western Africa": TEAM.YELLOW,
  "Eastern Africa": TEAM.YELLOW,
  "Middle Africa": TEAM.YELLOW,
  "Southern Africa": TEAM.YELLOW,
  "Australia and New Zealand": TEAM.RED,
  Melanesia: TEAM.RED,
  Micronesia: TEAM.RED,
  Polynesia: TEAM.RED,
  "Seven seas (open ocean)": TEAM.RED,
  Antarctica: TEAM.NONE,
};

export function assignTeam(adm0a3: string, subregion: string): TeamId {
  const explicit = EXPLICIT[adm0a3];
  if (explicit !== undefined) return explicit;
  const bySubregion = SUBREGION_DEFAULT[subregion];
  if (bySubregion !== undefined) return bySubregion;
  throw new Error(`No team rule for ${adm0a3} (subregion: ${subregion})`);
}

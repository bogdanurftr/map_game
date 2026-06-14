# team_map_draft_v1.md — Country → Team Assignments

⚠ **Reconstructed** (June 2026): the original draft referenced by SPEC §3 was
not present in the project, so this version was rebuilt by Claude Code from
D1–D8 and the SPEC §3 population targets. See DECISIONS.md → Amendment A1.
Veto/correct any row and re-run `npx tsx scripts/build-world.ts`.

The authoritative machine-readable mapping is `scripts/team-assignment.ts`;
this doc explains the rules. Base map: world religions map (D1/D2/O1 speak of
its dark-blue and dark-red country colors).

## 1. Red — Western Christian world (D1, D2, as amended by A3)

Americas, Europe west of Russia/Belarus, Cyprus, Philippines, Timor-Leste,
Oceania, Greenland. (A3 moved Russia/Belarus/Caucasus to Purple and
Sub-Saharan non-Muslim Africa to Yellow.)

## 2. Orange — Chinese-civilization + Russia bloc (A2, A4)

China (+ Hong Kong, Macao), Mongolia (A2), Russia, Belarus, Armenia,
Georgia, Azerbaijan (A4), Nepal, Sri Lanka*, Singapore, Mauritius.
*Sri Lanka: Indian-sphere tuning choice from the original reconstruction
(see §7).

## 3. Green — Muslim world

MENA, Turkey, Iran, Central Asia, Afghanistan, Pakistan, Bangladesh,
Indonesia, Malaysia, Brunei, Maldives, Albania, Bosnia, Kosovo, Azerbaijan,
Sahel belt (Mali, Niger, Chad, Burkina Faso, Senegal, Gambia, Guinea,
Mauritania, Sierra Leone), Horn (Somalia, Somaliland, Djibouti, Eritrea),
Sudan, Nigeria*, Ivory Coast*, Ethiopia* (* = O2 edge cases / tuning, §7).

## 4. Purple — Japan + Buddhist belt + India (D4, A2)

India (A2), Japan, Thailand, Myanmar, Cambodia, Laos, Bhutan.
(Russia bloc was Purple per A3, moved to Orange by A4.)

## 5. Yellow — folk / unaffiliated bloc + Sub-Saharan Africa (A3)

East Asia non-aligned: Vietnam, North Korea, South Korea, Taiwan.
All Sub-Saharan non-Muslim Africa (A3 — previously only the traditional
belt; now incl. DRC, Ethiopia-adjacent Christian belt, South Africa, etc.).
Secular outliers: Czechia, Estonia, Uruguay.

## 6. L.Blue — Israel (D1)

Israel only. (Palestine → Green.)

## 7. O2 edge-case recommendations (defaults until Bogdan confirms)

| Country | Team | Reasoning |
|---|---|---|
| India | **Purple** | Bogdan's correction, 2026-06-12 (A2) |
| Mongolia | **Orange** | Bogdan's correction, 2026-06-12 (A2) |
| S. Korea | Yellow | "no religion" plurality |
| Vietnam | Yellow | folk-religion plurality |
| Taiwan | Yellow | folk-religion plurality |
| Nigeria | Green | Muslim plurality, northern dominance |
| Russia, Belarus, Armenia, Georgia, Azerbaijan | **Orange** | Bogdan's corrections, 2026-06-12 (A3 → A4) |
| Singapore | Orange | Chinese-majority |
| Buddhist SEA vs brown | Purple | D4 names the belt explicitly |
| Ethiopia | **Green ⚠** | Christian plurality in reality; assigned Green so Red ≤ +5% and Green ≥ −5% of SPEC §3. Flip to Red if SPEC §3 numbers are retuned. |
| Sri Lanka | **Orange ⚠** | Buddhist majority in reality; see §2. |

## 8. Verification

`scripts/build-world.ts` prints per-team totals vs SPEC §3 and fails the
build outside ±5% (Natural Earth POP_EST 2019 scaled to the 8.22B SPEC
world — see Amendment A1). Targets retargeted by A2–A4: Orange ~1.76B,
Red ~1.86B, Green ~2.00B, Yellow ~0.85B, Purple ~1.76B, L.Blue ~0.01B.

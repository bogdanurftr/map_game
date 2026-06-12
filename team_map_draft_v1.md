# team_map_draft_v1.md — Country → Team Assignments

⚠ **Reconstructed** (June 2026): the original draft referenced by SPEC §3 was
not present in the project, so this version was rebuilt by Claude Code from
D1–D8 and the SPEC §3 population targets. See DECISIONS.md → Amendment A1.
Veto/correct any row and re-run `npx tsx scripts/build-world.ts`.

The authoritative machine-readable mapping is `scripts/team-assignment.ts`;
this doc explains the rules. Base map: world religions map (D1/D2/O1 speak of
its dark-blue and dark-red country colors).

## 1. Red — Christian world (D1, D2)

Americas, Europe incl. Russia & Orthodox "dark blue" countries (D1), Armenia,
Georgia, Cyprus, Sub-Saharan Christian-majority Africa, Philippines,
Timor-Leste, Oceania, Greenland.

## 2. Orange — Chinese-civilization bloc (A2)

China (+ Hong Kong, Macao), Mongolia (A2), Nepal, Sri Lanka*, Singapore,
Mauritius. *Sri Lanka: Indian-sphere tuning choice from the original
reconstruction (see §7).

## 3. Green — Muslim world

MENA, Turkey, Iran, Central Asia, Afghanistan, Pakistan, Bangladesh,
Indonesia, Malaysia, Brunei, Maldives, Albania, Bosnia, Kosovo, Azerbaijan,
Sahel belt (Mali, Niger, Chad, Burkina Faso, Senegal, Gambia, Guinea,
Mauritania, Sierra Leone), Horn (Somalia, Somaliland, Djibouti, Eritrea),
Sudan, Nigeria*, Ivory Coast*, Ethiopia* (* = O2 edge cases / tuning, §7).

## 4. Purple — Japan + Buddhist belt + India (D4 as amended by A2)

India (A2), Japan, Thailand, Myanmar, Cambodia, Laos, Bhutan.

## 5. Yellow — folk / unaffiliated bloc

East Asia non-aligned: Vietnam, North Korea, South Korea, Taiwan.
African traditional/mixed belt: Tanzania, Mozambique, Madagascar, Benin,
Togo, South Sudan, Guinea-Bissau. Secular outliers: Czechia, Estonia,
Uruguay.

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
| Armenia | Red | Christian (Apostolic) |
| Singapore | Orange | Chinese-majority |
| Buddhist SEA vs brown | Purple | D4 names the belt explicitly |
| Ethiopia | **Green ⚠** | Christian plurality in reality; assigned Green so Red ≤ +5% and Green ≥ −5% of SPEC §3. Flip to Red if SPEC §3 numbers are retuned. |
| Sri Lanka | **Orange ⚠** | Buddhist majority in reality; see §2. |

## 8. Verification

`scripts/build-world.ts` prints per-team totals vs SPEC §3 and fails the
build outside ±5% (Natural Earth POP_EST 2019 scaled ×1.0707 to the 8.22B
SPEC world — see Amendment A1). Orange/Purple targets retargeted by A2
(India → Purple, Mongolia → Orange): Orange ~1.57B, Purple ~1.76B.

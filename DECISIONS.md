# DECISIONS.md — Verified Design Decisions

Every entry was explicitly confirmed by Bogdan during the spec interview (June 2026). Claude Code: do not silently contradict these. If implementation forces a change, add an entry under Amendments with rationale and get confirmation.

| # | Decision |
|---|---|
| D1 | Dark blue countries merge into Red. Light Blue (Israel) is its own team. *(Amended from "merge all blue into red.")* |
| D2 | Dark-red "Other Christian" countries (USA, UK, Germany, Scandinavia, ...) merge into Red. |
| D3 | Green ↔ Orange = Tense. |
| D4 | Purple = Japan + Buddhist SE Asia. |
| D5 | Orange ↔ Purple = Neutral. |
| D6 | Light Blue full spec: higher HP and damage, specials = Tanks + Snipers, keeps original perks (starting resource stockpile, pre-armed units, very high arming success), close ally of Red, at War with surrounding Green. |
| D7 | Global rule: an armed unit recruiting a regular has higher arming success than the civilian path. |
| D8 | Light Blue ↔ Purple = Friends. Diplomacy matrix complete. |
| D9 | Stack: TypeScript + PixiJS (WebGL), simulation in a Web Worker. |
| D10 | Single-player v1; deterministic sim (fixed timestep, seeded RNG) to keep multiplayer possible. |
| D11 | Save & resume in v1. |
| D12 | 1 unit = 100,000 people (~81k units worldwide). Tunable constant. |
| D13 | Territory is capturable and recolors. |
| D14 | World wraps horizontally; Pacific is crossable. |
| D15 | Arming recipe, helpers survive: civilian path = 2 regular helpers + 1 converting (3 total), slower/lower success; military path = 1 armed + 1 converting, higher success. |
| D16 | Regulars fight: weak melee, swarm-attack in groups. |
| D17 | Armed units ARE the mid-range shooters. Specials above: Sniper (higher range/damage), Tank, Bomber, Catapult. |
| D18 | v1 resources: iron, oil, copper, gold. |
| D19 | Ships are transport-only. |
| D20 | Resource nodes are finite; the world runs dry. |
| D21 | Territory flips by sustained presence (dwell time) of units in an area. |
| D22 | Tense state: attack only intruders inside own territory. |
| D23 | Dynamic escalation: repeated attacks on Neutral teams build toward War. |
| D24 | Two-way hostility: decays in peace; Wars (including starting wars) can cool to Neutral. Friendships permanent. ⚠ "starting wars can cool" is Claude's interpretation — veto if wrong. |
| D25 | Possessed-unit death ejects to the world map for a new drop. |
| D26 | Jumps are local within the zone; world-map relocation allowed with a longer cooldown. |
| D27 | World map visible only on death or relocation. |
| D28 | Pause + 1×/2×/4× speed controls. |
| D29 | Locked zone radius ≈ 1,500 km. |
| D30 | Win = world domination; lose = team eliminated. |
| D31 | Multi-hour grand campaign pacing. |
| D32 | v1 scope = everything above; deferred list in SPEC §12. |

## Open Items (owed / to confirm)

| # | Item | Default until resolved |
|---|---|---|
| O1 | List of dark-blue countries on the religion map (→ Red) | None assigned |
| O2 | `team_map_draft_v1.md` edge cases (S. Korea, Vietnam, Taiwan, Mongolia, Nigeria, Armenia, Singapore, Buddhist-SEA-vs-brown) | Claude's recommendations in that file |
| O3 | Purple arming success %, Light Blue birth rate | 80/50%, 1.0× |
| O4 | Yellow's special roster ("more expensive specials") | Sniper access at +50% cost |
| O5 | All ⚙ numeric defaults in SPEC.md | Playtest and tune |
| O6 | Arming failure consumes resources? | Yes (resources lost on failure) |

## Amendments

| # | Date | Amendment |
|---|---|---|
| A1 | 2026-06-12 | **team_map_draft_v1.md reconstructed.** The original draft was absent from the project, so M1 rebuilt it from D1–D8 + SPEC §3 population targets (religion-map interpretation). Tuning choices made solely to hit the ±5% bands: Ethiopia → Green, Sri Lanka → Orange; Yellow defined as the folk/unaffiliated bloc (Vietnam, Koreas, Taiwan + African traditional belt + Czechia/Estonia/Uruguay). Populations = Natural Earth POP_EST (2019) scaled ×1.0707 to the 8.22B SPEC world (D12 ⚙). ⚠ Awaiting Bogdan's veto/confirmation. |

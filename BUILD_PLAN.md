# BUILD_PLAN.md — Milestones for Claude Code

One milestone ≈ one focused Claude Code session. Do not start a milestone until the previous one's acceptance criteria pass. Each milestone ends with a runnable demo. Keep commits per-milestone.

---

## M0 — Deterministic skeleton
Vite + TypeScript + PixiJS scaffold. Web Worker sim loop at fixed 20 Hz, render thread at 60 fps with interpolation. Seeded PRNG module (no `Math.random` anywhere in sim). Debug HUD: FPS, tick count, unit count, state hash.
**Accept:** blank world renders at 60 fps; two runs with the same seed produce identical state hashes after 10,000 ticks; `Math.random` absent from `src/sim/**` (lint rule).

## M1 — World data pipeline
`scripts/build-world.ts`: Natural Earth GeoJSON → `countries.json` (country → team per `team_map_draft_v1.md`, population, centroid), `grid.bin` (10 km ownership + land/water raster), `resources.json` (core-4 nodes approximating the resource map). Render the world map colored by team with horizontal wrap panning.
**Accept:** world view matches the team map doc; panning across the date line is seamless; team population totals printed by the build script match SPEC §3 within 5%.

## M2 — Units exist
Spawn ~81k units distributed within each country by population (SoA TypedArrays). Drop-zone selection UI on the world view → live zone loads its units; others fold into placeholder stat-cells. Spatial hash. Idle wander movement in the live zone.
**Accept:** drop into the Middle East and see Green/Yellow/L.Blue dots wandering at 60 fps; unit counts per team match `countries.json`.

## M3 — Statistical layer + conservation
Stat-cells (~250 km) tick at 1 Hz with population counts per team/type. Boundary handshake: units dissolve/materialize at the zone edge. World view renders stat-layer densities and territory.
**Accept:** automated test — run 30 sim-minutes with units streaming across the boundary; global per-team counts conserved exactly; relocating the zone anywhere reconstructs sensible local populations.

## M4 — Combat + diplomacy matrix
HP with team multipliers, melee, shooter projectiles, death. Static diplomacy lookup (SPEC §3.1). Aggro/targeting AI. Tense rule: engage intruders only. Regular flee + swarm logic.
**Accept:** scripted scenario tests — (a) Red and Green units fight on sight; (b) Green and Orange ignore each other across the border but engage intruders; (c) 5 regulars swarm and kill 1 armed unit, 2 regulars flee from it.

## M5 — Economy
Resource nodes with finite stock, mining into regional stockpiles, arming via both paths with team success rates and costs (Red iron discount, L.Blue stockpile + pre-armed start). AI units autonomously mine and arm when stockpiles allow.
**Accept:** unattended 1-hour live-zone run — teams visibly militarize; nodes deplete to zero and stay empty; L.Blue starts pre-armed with stockpile.

## M6 — Reproduction + territory capture
Pair reproduction with safe-space rules and density caps. Presence/dwell cell flipping with recoloring on both views. Stat-layer equivalents of both (aggregate birth + front movement).
**Accept:** long-running sim shows fronts moving and the map recoloring; peaceful interiors grow population; conservation test still passes.

## M7 — Specials + ships
Sniper, Tank (AoE, slow reload), Bomber (friendly-fire AoE), Catapult (damage-over-time zones). Ship building on coasts, embark/ferry/disembark, wrap-aware water pathing, ships killable with cargo.
**Accept:** test arena demonstrates each special's distinct behavior (including Green friendly fire); units cross the Mediterranean by ship; a sunk ship kills its cargo.

## M8 — Player layer
Team pick → drop → possession with direct control. Command radius with verbs (Move/Attack/Mine/Recruit/PairUp/Build/Follow), temporary AI override. Jump cooldowns (local + world relocation), death → eject → redrop. Pause + speed controls.
**Accept:** full loop playable start to death to redrop; commands visibly redirect nearby units then revert; world map inaccessible except on death/relocation.

## M9 — Dynamic diplomacy + win/lose + pacing
Hostility scores with escalation/decay (Neutral→War, War→Neutral, Friends immune). Domination/elimination detection + end screens. Pacing pass: tune ⚙ constants toward the multi-hour arc (use 4×/headless runs to measure time-to-domination).
**Accept:** headless seeded run reaches a domination outcome; provoking Yellow repeatedly flips it to War, ceasefire cools it back; player-team elimination triggers loss.

## M10 — Saves + hardening
IndexedDB save/load (full snapshot incl. RNG state), autosave, manual slots. Performance pass (profiling, zone auto-shrink in dense areas). Settings, polish, error handling.
**Accept:** save → reload → identical state hash; 20k-unit zone holds 60 fps on an M1 MacBook Air; autosave survives a tab reload.

---

### Suggested session protocol
1. Open with: "Read CLAUDE.md, SPEC.md, DECISIONS.md. Implement M<n> from BUILD_PLAN.md."
2. Demand the acceptance criteria be demonstrated (tests or runnable demo) before closing the session.
3. Any deviation from SPEC/DECISIONS → record in DECISIONS.md → Amendments first.

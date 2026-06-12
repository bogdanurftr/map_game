# WORLD DOTS — Game Specification v1.0

Real-time strategy simulation on Earth's map. Six teams of dot-units fight, mine, reproduce, and capture territory autonomously; the player possesses one unit at a time and influences the war from inside it.

All decisions referenced as D# are recorded in `DECISIONS.md`. Numbers marked ⚙ are tuning defaults expected to change during playtesting — all live in `src/sim/constants.ts`. Items marked ⚠ are open interpretations awaiting Bogdan's confirmation (listed in DECISIONS.md → Open Items).

---

## 1. Pillars

1. A living world war you can watch or join — units act on their own AI; the player nudges, never micromanages globally. (Core fantasy)
2. Real Earth: real borders, population-proportional armies, resource locations from real geography.
3. Zoom paradox solved by two scales: one region simulated fully, the rest statistically. (D29, §9)
4. Deterministic simulation — same seed, same world. Enables saves, replays, future multiplayer. (D10)

## 2. World

- **Map data:** Natural Earth GeoJSON country polygons → build script produces:
  - `countries.json` — country → team, population, centroid
  - `grid.bin` — ownership + land/water raster, **cell = 10 km** ⚙
  - `resources.json` — node positions/amounts (§5)
- **Projection:** equirectangular, **horizontal wrap** (D14) — the Pacific is a live naval front. All distance/pathfinding math is wrap-aware.
- **Territory capture (D13, D21):** presence-based with dwell time. A cell flips to team T when ≥3 ⚙ T-units are inside it continuously for 30 s ⚙ and no enemy units are present in the cell. Flipped cells recolor on both views.
- **Scale:** 1 unit = 100,000 people (D12) → ~81,000 units at world start.

## 3. Teams

Territory assignments: see `team_map_draft_v1.md` (⚠ pending final corrections, my recommendations are the defaults; dark-blue country list still owed).

| Team | Pop | Units | HP× | Dmg× | Birth× | Arm % (mil/civ) | Unique specials | Quirks |
|---|---|---|---|---|---|---|---|---|
| Orange | ~1.57B (A2) | ~15,700 | 0.85 | 1.0 | 0.9 | 90/60 | Tank | Tanks very expensive |
| Red | ~1.86B (A3) | ~18,600 | 1.0 | 1.0 | 0.8 | 65/40 | Sniper | Armed conversion costs 1 iron instead of 2 |
| Green | ~2.00B (A3) | ~20,000 | 0.8 | 1.0 | 1.5 | 80/50 | Bomber (friendly fire) | — |
| Yellow | ~0.85B (A3) | ~8,500 | 1.6 | 1.0 | 0.8 ⚠ | 90/60 | Sniper access ⚠ | All specials +50% cost |
| Purple | ~1.94B (A2, A3) | ~19,400 | 0.85 | 1.0 | 1.2 | 80/50 ⚠ | Catapult | — |
| L.Blue | ~0.01B | ~100 | 1.5 | 1.3 | 1.0 ⚠ | 95/70 | Sniper + Tank | Starting stockpile: 200 gold, 100 iron, 50 oil, 50 copper ⚙; 60% ⚙ of units pre-armed |

⚠ Yellow's "more expensive specials" is interpreted as: Yellow shares Red's sniper roster at +50% cost. Confirm or correct.

### 3.1 Diplomacy matrix (complete, D1–D8)

| | Yellow | Green | Orange | Purple | L.Blue |
|---|---|---|---|---|---|
| **Red** | Friends | War | War | Friends | Friends (ally) |
| **Yellow** | — | Neutral | Neutral | Friends | Friends |
| **Green** | | — | **Tense** | War | War |
| **Orange** | | | — | Neutral | Neutral |
| **Purple** | | | | — | Friends |

States: **Friends** (never attack, share territory passage), **Neutral** (ignore unless hostility escalates), **Tense** (attack only intruders inside own territory, D22), **War** (attack on sight within aggro range).

### 3.2 Dynamic diplomacy (D23, D24)

Per team-pair hostility score `H ∈ [0, 120]`:
- Attack on a unit: +5 ⚙; kill: +10 ⚙. Decay: −1/min ⚙ while no combat between the pair.
- Neutral/Tense pair reaching H ≥ 100 → **War**.
- War pair with no combat for 10 min ⚙ decays; H < 20 → **Neutral** (starting wars can cool too — D24).
- **Friendships are permanent** and immune to hostility (D24).

## 4. Units

Ladder (D15–D17): **Regular → Armed (mid-range shooter) → team special**, plus Ships. All stats ⚙:

| Unit | HP (base) | Damage | Range | Speed | Cost |
|---|---|---|---|---|---|
| Regular | 10 | 1 melee; swarm: each additional attacker on same target adds ×1.5, max 5 | melee | 1.0 | born, not built |
| Armed / Shooter | 14 | 3 | 8 | 1.0 | 2 iron (Red: 1) |
| Sniper (R, Y⚠, LB) | 12 | 8 | 16 | 0.9 | 3 iron + 3 copper |
| Tank (O, LB) | 60 | 10, AoE r2 | 20, 6 s reload | 0.5 | 8 iron + 5 oil |
| Bomber (G) | 11 | 6, AoE r4, **hits allies** | 10, lobbed | 0.9 | 2 iron + 2 copper |
| Catapult (P) | 12 | zone r3, 2/s for 5 s | 14, lobbed | 0.7 | 2 iron + 4 copper |
| Ship (all) | 40 | none (transport only, D19) | — | 1.6 on water | 4 iron + 2 oil, carries 10 units |

Team HP×/Dmg× multipliers from §3 apply on top. Range/AoE units are in unit-body lengths.

### 4.1 Arming (D7, D15)

Helpers always survive; conversion takes 45 s ⚙; on failure, resources are lost ⚙ (cruel but simple — flag if unwanted).
- **Military path:** 1 armed unit + 1 converting regular. Success = team mil%.
- **Civilian path:** 2 regular helpers + 1 converting regular (3 total). Success = team civ%.

Specials are built the same two ways from a Regular, using the special's cost and −10 pp ⚙ success.

### 4.2 Reproduction (D16 context, original notes)

Eligible pair: 2 regulars within distance 2, both idle ≥ 20 s ⚙, no enemy within radius 30 ⚙ ("safe space"). Process: 60 s ⚙ → 1 new regular. Start chance: 2%/min × team Birth× ⚙.
Anti-explosion brakes: max units per grid cell 12 ⚙; world hard cap 150k ⚙.

### 4.3 Ships (D19)

Built on coast cells. Units embark/disembark at shore. Ships path on water (wrap-aware). Ships have HP and can be shot — sinking kills cargo. No naval weapons in v1.

## 5. Resources (D18, D20)

Core 4 — placement approximates the real-world resource map (petroleum → oil; coal/gas/uranium/bauxite/silver ignored in v1):

| Resource | Used for | Node amount ⚙ |
|---|---|---|
| Iron | arming, all specials, ships | 400 per node |
| Oil | tanks, ships | 250 |
| Copper | ranged specials | 250 |
| Gold | universal: 1 gold substitutes 2 of anything | 150 |

- Nodes are **finite and do not respawn** (D20) — the world runs dry; late game is attrition and reproduction.
- Mining: a Regular adjacent to a node extracts 1/4 s ⚙ into its team's **regional stockpile** (shared within ~500 km ⚙ — no global teleporting of resources).
- AI teams prioritize mining when stockpiles are low.

## 6. Combat

- Aggro radius 12 ⚙; targeting: nearest valid enemy per diplomacy state.
- Damage is instant on hit; projectiles for ranged units are simulated (dodgeable by movement).
- Death removes the unit; no corpses/loot in v1.
- Friendly fire: only Green bombers.

## 7. Unit AI

Per-unit state machine: `Idle → (Wander | Mine | PairUp | Convert | Fight | Flee | Board)`.
- Regulars flee from enemies unless swarming (≥4 ⚙ friendly regulars near a lone enemy → swarm-attack, D16).
- Combat units hold a loose front along hostile borders; War-state teams push into enemy territory toward highest-value targets (resource nodes > population clusters) ⚙ weighting.
- Tense borders (Green–Orange): both sides patrol their own side; only intruders are engaged (D22).
- Faction-level AI is emergent only in v1 — no global commander; behavior comes from unit rules + spawning weights. (Deeper development system explicitly deferred — original notes.)

## 8. Player

- Start: pick team → world map → select drop zone (circle r ≈ 1,500 km, D29) → possess a unit there, or random spawn (original notes).
- **Possession:** direct control (WASD/arrows + mouse aim). All unit abilities usable manually.
- **Command radius** 25 ⚙ around the possessed unit. Verbs: Move, Attack target, Mine here, Recruit (arming), Pair up, Build (ship/special), Follow me. Commands override AI temporarily ⚙ 60 s, then units revert (original notes: "adjusted slightly").
- **Jumping:** to another friendly unit within the zone — cooldown 90 s ⚙. World-map relocation (new zone) — cooldown 5 min ⚙ (D26). Cooldowns force commitment (original notes).
- **Death:** eject to world map, pick a new drop (D25).
- World map is visible **only** on death/relocation (D27).
- Time controls: pause, 1×/2×/4× (D28).

## 9. Two-scale simulation (D29)

- **Live zone** (player's locked circle): full per-unit sim. Budget 20k units ⚙; in ultra-dense areas the zone radius auto-shrinks to stay under budget.
- **Statistical layer** (everywhere else): per ~250 km ⚙ stat-cell — unit counts by team & type, resource remaining, hostility-weighted attrition and front movement, aggregate birth/arming rates derived from the same constants. Tick: 1 Hz ⚙.
- **Boundary handshake:** units crossing out of the live zone dissolve into stat-cells; pressure from stat-cells materializes units at the zone edge. Global counts are conserved (tested).
- **World view** renders the stat layer directly (territory colors, density, fronts) — nearly free.
- Sim runs in a Web Worker at fixed 20 Hz ⚙; render thread interpolates at 60 fps.

## 10. Win / Lose / Pacing (D30, D31)

- **Lose:** your team's global unit count hits 0.
- **Win (domination):** your team controls ≥ 70% ⚙ of population-weighted land cells. Allies surviving does not block victory.
- Pacing target: an unattended sim reaches a dominant power in ~6 h ⚙ at 1×; player involvement accelerates their side. All movement/birth/dwell constants tune toward this.

## 11. Save system (D11)

- IndexedDB snapshot: schema version, seed, tick, all unit TypedArrays, stat layer, hostility table, stockpiles, player state, RNG state.
- Autosave every 2 min ⚙ + manual save slots. Load must reproduce identical state hash (tested).

## 12. Out of scope v1

Multiplayer (architecture-ready only) · remaining 5 resources · breakable friendships · deeper unit development tree (original notes: "later versions") · naval combat · diplomacy UI · audio · mobile/touch.

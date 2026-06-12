# CLAUDE.md — World Dots

Real-time strategy sim: six teams of dot-units war over Earth. Read `SPEC.md` (design), `DECISIONS.md` (locked choices — never contradict silently), `BUILD_PLAN.md` (current milestone) before coding.

## Stack
TypeScript, Vite, PixiJS (WebGL). Simulation in a Web Worker. No game engine, no physics library. Tests with Vitest.

## Hard rules
- **Determinism is sacred.** Sim code (`src/sim/**`) must never use `Math.random`, `Date.now`, `performance.now`, or iteration over non-deterministic structures (e.g., `Set`/`Map` insertion order is OK, object key order is not). All randomness through the injected seeded RNG. Fixed 20 Hz timestep. Enforce via lint rule + the M0 hash test.
- **Sim/render separation.** The Worker owns all game state. Render thread sends input messages, receives transferable/shared buffers. No game logic on the render thread.
- **Data-oriented units.** Units live in SoA TypedArrays (position, team, type, HP, state...), not object instances. Spatial hash for queries.
- **All tuning constants** live in `src/sim/constants.ts`, annotated with SPEC section references. No magic numbers in logic files.
- **Conservation.** Unit counts must be exactly conserved across the live-zone/stat-layer boundary. The M3 test must keep passing forever.

## Layout
```
/scripts        build-world.ts (GeoJSON → countries.json, grid.bin, resources.json)
/data           generated world data (committed)
/src/sim        worker.ts, world.ts, units.ts, combat.ts, economy.ts,
                diplomacy.ts, capture.ts, reproduction.ts, stats-layer.ts,
                rng.ts, save.ts, constants.ts
/src/render     app.ts, zone-view.ts, world-view.ts, hud.ts
/src/game       player.ts, commands.ts, input.ts
/tests          determinism.test.ts, conservation.test.ts, scenarios/
```

## Workflow
- One milestone per session; acceptance criteria are the definition of done.
- Prefer headless sim runs (no renderer) for testing balance and pacing.
- If the spec is ambiguous or wrong in practice: stop, propose the change as a DECISIONS.md amendment, ask Bogdan, then implement.
- Keep performance honest on the target machine: M1 MacBook Air, Chrome/Safari, 60 fps with up to 20k live units.

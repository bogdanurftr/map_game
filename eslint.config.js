import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**", "data/**"] },
  ...tseslint.configs.recommended,
  {
    // CLAUDE.md hard rule: determinism in sim code. No wall clock, no
    // unseeded randomness anywhere under src/sim/**.
    files: ["src/sim/**/*.ts"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "Math",
          property: "random",
          message:
            "Determinism: use the injected seeded RNG (src/sim/rng.ts), never Math.random.",
        },
        {
          object: "Date",
          property: "now",
          message: "Determinism: sim code must not read the wall clock.",
        },
        {
          object: "performance",
          property: "now",
          message: "Determinism: sim code must not read the wall clock.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date']",
          message: "Determinism: sim code must not construct Date.",
        },
        {
          selector: "CallExpression[callee.name='requestAnimationFrame']",
          message: "Determinism: sim code runs on a fixed timestep, not rAF.",
        },
      ],
    },
  },
);

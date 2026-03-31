# Testing Scaffold

This folder validates the real core + active-profile runtime in `src/`.

## What you get

- `test/core`: runtime behavior tests (session loop, broker, policy chain, registry, CLI utilities)
- `test/contracts`: reusable profile contract suite for real profile modules
- `test/profiles`: profile-specific tests plus active profile wiring
- `test/evals`: scenario tests driven by JSON transcripts through real session runtime
- `test/helpers`: deterministic fakes only (model/policy/provider)

## Notes

- Keep `test/contracts/profileContractSuite.ts` as the profile baseline.
- Prefer importing production modules from `src/core/*` in all core tests.
- Add new scenarios to `test/evals/scenarios/*.json` for regressions.

## Commands

- `bun test`
- `bun run test:core`
- `bun run test:contracts`
- `bun run test:evals`
- `bun run typecheck`

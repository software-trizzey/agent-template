# Project tasks

## Skills integration (red-green TDD order)

- [ ] Slice 1 (RED): Add parser tests for `SKILL.md` validity, strict YAML failures, required fields, and metadata constraints.
- [ ] Slice 1 (GREEN): Implement `src/core/skills/parser.ts` + `src/core/skills/types.ts` to satisfy parser tests.
- [ ] Slice 1 (REFACTOR): Extract parser validation helpers and normalize warning/result shapes.

- [ ] Slice 2 (RED): Add registry tests for deterministic discovery order, collisions, reserved-name conflicts, and trust-root gating.
- [ ] Slice 2 (GREEN): Implement `src/core/skills/registry.ts` with deterministic indexing and catalog output.
- [ ] Slice 2 (REFACTOR): Split filesystem scan from collision-resolution logic.

- [ ] Slice 3 (RED): Add activator tests for unknown skill failures, wrapper format, escaping/sanitization, and truncation markers.
- [ ] Slice 3 (GREEN): Implement `src/core/skills/activator.ts` with bounded payload generation.
- [ ] Slice 3 (REFACTOR): Extract payload safety/truncation helpers.

- [ ] Slice 4 (RED): Add tests for local `activate_skill` tool descriptor, argument validation, and success/failure envelopes.
- [ ] Slice 4 (GREEN): Implement `src/core/skills/tool.ts` and local skills tool provider.
- [ ] Slice 4 (REFACTOR): Keep adapter thin and move domain logic back to activator/registry.

- [ ] Slice 5 (RED): Add profile/provider tests for deterministic provider composition and duplicate prevention.
- [ ] Slice 5 (GREEN): Wire skills provider into `src/profiles/default/index.ts`.
- [ ] Slice 5 (REFACTOR): Simplify provider wiring and shared provider factory helpers.

- [ ] Slice 6 (RED): Add tests for instruction composition and conditional `<available_skills>` injection.
- [ ] Slice 6 (GREEN): Implement composition seam and runtime wiring in `src/index.ts`.
- [ ] Slice 6 (REFACTOR): Keep composition pure and reusable.

- [ ] Slice 7 (RED): Add REPL tests for `/skills`, `/skill <name>`, `/<skill-name>`, built-in precedence, alias parity, and unknown command suggestions.
- [ ] Slice 7 (GREEN): Implement REPL command routing and shared synthetic history injection helper.
- [ ] Slice 7 (REFACTOR): Centralize slash-command resolution and activation plumbing.

- [ ] Slice 8 (RED): Add integration tests proving history-shape parity across model-driven activation, `/skill <name>`, and `/<skill-name>`.
- [ ] Slice 8 (GREEN): Close integration gaps and enforce parity contract.
- [ ] Slice 8 (REFACTOR): Consolidate fixture setup and reusable history assertions.

- [ ] Update docs (`README.md`) for `/skills`, `/skill <name>`, and alias behavior.
- [ ] Add/update fixture set under `test/fixtures/skills/` for malformed, duplicate, unsafe-name, and oversized cases.
- [ ] Run final verification: `bun test`, `bun run typecheck`, `bun run check --write`.

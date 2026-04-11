# Project tasks

## Skills integration (red-green TDD order)

- [x] Slice 1 (RED): Add parser tests for `SKILL.md` validity, strict YAML failures, required fields, and metadata constraints.
- [x] Slice 1 (GREEN): Implement `src/core/skills/parser.ts` + `src/core/skills/types.ts` to satisfy parser tests.
- [x] Slice 1 (REFACTOR): Extract parser validation helpers and normalize warning/result shapes.

- [x] Slice 2 (RED): Add registry tests for deterministic discovery order, collisions, reserved-name conflicts, and trust-root gating.
- [x] Slice 2 (GREEN): Implement `src/core/skills/registry.ts` with deterministic indexing and catalog output.
- [x] Slice 2 (REFACTOR): Split filesystem scan from collision-resolution logic.

- [x] Slice 3 (RED): Add activator tests for unknown skill failures, wrapper format, escaping/sanitization, and truncation markers.
- [x] Slice 3 (GREEN): Implement `src/core/skills/activator.ts` with bounded payload generation.
- [x] Slice 3 (REFACTOR): Extract payload safety/truncation helpers.

- [x] Slice 4 (RED): Add tests for local `activate_skill` tool descriptor, argument validation, and success/failure envelopes.
- [x] Slice 4 (GREEN): Implement `src/core/skills/tool.ts` and local skills tool provider.
- [x] Slice 4 (REFACTOR): Keep adapter thin and move domain logic back to activator/registry.

- [x] Slice 5 (RED): Add profile/provider tests for deterministic provider composition and duplicate prevention.
- [x] Slice 5 (GREEN): Wire skills provider into `src/profiles/default/index.ts`.
- [x] Slice 5 (REFACTOR): Simplify provider wiring and shared provider factory helpers.

- [x] Slice 6 (RED): Add tests for instruction composition and conditional `<available_skills>` injection.
- [x] Slice 6 (GREEN): Implement composition seam and runtime wiring in `src/index.ts`.
- [x] Slice 6 (REFACTOR): Keep composition pure and reusable.

- [x] Slice 7 (RED): Add REPL tests for `/skills`, `/skill <name>`, `/<skill-name>`, built-in precedence, alias parity, and unknown command suggestions.
- [x] Slice 7 (GREEN): Implement REPL command routing and shared synthetic history injection helper.
- [x] Slice 7 (REFACTOR): Centralize slash-command resolution and activation plumbing.

- [x] Slice 8 (RED): Add integration tests proving history-shape parity across model-driven activation, `/skill <name>`, and `/<skill-name>`.
- [x] Slice 8 (GREEN): Close integration gaps and enforce parity contract.
- [x] Slice 8 (REFACTOR): Consolidate fixture setup and reusable history assertions.

- [x] Update docs (`README.md`) for `/skills`, `/skill <name>`, and alias behavior.
- [x] Add/update fixture set under `test/fixtures/skills/` for malformed, duplicate, unsafe-name, and oversized cases.
- [x] Run final verification: `bun test`, `bun run typecheck`, `bun run check --write`.

## Rich YAML parser update (red-green TDD order)

- [x] Slice Y1 (RED): Extend `test/core/skills.parser.test.ts` with real-world frontmatter cases (lists, nested objects, multiline scalars, quoted colons) that currently fail with the line parser.
- [x] Slice Y1 (RED): Add parser tests for strict failure semantics on malformed YAML and non-object top-level frontmatter.
- [x] Slice Y1 (GREEN): Add `yaml` (`eemeli/yaml`) dependency and replace line-based frontmatter parsing in `src/core/skills/parser.ts` with YAML parsing.
- [x] Slice Y1 (GREEN): Preserve unknown metadata fields and keep existing required-field and metadata-constraint validation contracts unchanged.
- [x] Slice Y1 (REFACTOR): Extract `extractFrontmatterBlock`, `parseYamlFrontmatter`, and `validateSkillMetadata` helpers while keeping warning/result shapes stable.

- [x] Slice Y2 (RED): Add fixture-driven parser/registry regression coverage for a rich frontmatter fixture under `test/fixtures/skills/`.
- [x] Slice Y2 (GREEN): Add/update fixture files to include multiline and list-based metadata examples accepted by the new parser.
- [x] Slice Y2 (REFACTOR): Remove parser duplication in tests and centralize shared rich-frontmatter test builders.

- [x] Update docs (`README.md` and `docs/SKILLS_SPEC.md`) to document rich YAML frontmatter support plus strict post-parse validation.
- [x] Run final verification: `bun test`, `bun run typecheck`, `bun run check --write`.

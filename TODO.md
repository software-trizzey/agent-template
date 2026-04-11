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

## REPL TUI refactor (cel-tui, red-green TDD order)

- [ ] Slice R0 (RED): Add tests for a command catalog constant covering canonical commands, aliases, precedence, argument shape, and unknown-command suggestion inputs.
- [ ] Slice R0 (GREEN): Implement `src/core/cli/repl/command-catalog.ts` exporting a single typed command list for built-ins and skill-alias strategy.
- [ ] Slice R0 (REFACTOR): Make parser/dispatcher/help text consume the catalog and remove duplicated command literals.

- [ ] Slice R1 (RED): Add command parser parity tests for `/help`, `/reset`, `/skills`, `/skill <name>`, `/<skill-name>`, unknown slash suggestions, `/exit`, `:q`, and prompt passthrough.
- [ ] Slice R1 (GREEN): Implement `src/core/cli/repl/commands.ts` with built-in precedence and skill-alias resolution parity.
- [ ] Slice R1 (REFACTOR): Remove duplicate command parsing paths and centralize parser fixtures/builders.

- [ ] Slice R2 (RED): Add reducer tests for `prompt_submitted`, `prompt_started`, `activity_received`, `prompt_succeeded`, `prompt_failed`, `session_reset`, and deterministic transcript row ordering.
- [ ] Slice R2 (GREEN): Implement `src/core/cli/repl/types.ts` and `src/core/cli/repl/reducer.ts` with unified transcript row variants (`user|assistant|activity|system|error`).
- [ ] Slice R2 (REFACTOR): Extract event-to-row mapping helpers and normalize reducer test utilities.

- [ ] Slice R3 (RED): Add controller tests with fake renderer port for prompt execution, history updates, reset/exit handling, `/skills`, `/skill`, alias activation, and no normal prompt flow for skill activation.
- [ ] Slice R3 (GREEN): Implement `src/core/cli/repl/controller.ts` to own side effects, intent routing, and runtime callback wiring.
- [ ] Slice R3 (REFACTOR): Split controller lifecycle helpers (submit, command, activity, shutdown) into focused functions.

- [ ] Slice R4 (RED): Add inline activity integration tests ensuring `onActivity` events interleave correctly with prompt lifecycle (`prompt_started` -> `activity_received*` -> `prompt_succeeded|prompt_failed`).
- [ ] Slice R4 (GREEN): Route REPL-mode runtime `onActivity` through controller/reducer instead of direct stdout writes.
- [ ] Slice R4 (REFACTOR): Consolidate activity formatting through existing `formatActivityEvent` semantics.

- [ ] Slice R5 (RED): Add renderer-port contract tests for `start(initialState, handlers)`, `render(nextState)`, `stop()`, handler emission, and stop idempotency.
- [ ] Slice R5 (GREEN): Implement `src/core/cli/repl/ui/port.ts` and fake adapter contract harness.
- [ ] Slice R5 (REFACTOR): Keep port surface minimal and move non-contract logic out of tests.

- [ ] Slice R6 (RED): Add cel adapter tests for intent emission, TextInput Enter interception (submit vs newline), key bubbling semantics (`false` bubbles, `undefined` consumes), and render updates.
- [ ] Slice R6 (GREEN): Implement `src/core/cli/repl/ui/cel/renderer.ts` (optionally `view.ts`) using cel lifecycle (`cel.init`/`cel.viewport`/`cel.render`/`cel.stop`).
- [ ] Slice R6 (REFACTOR): Separate pure view composition from terminal lifecycle glue.

- [ ] Slice R7 (RED): Add shutdown-path tests proving renderer calls `cel.stop()` before any `process.exit()` path (`/exit`, `:q`, signal/error cleanup hooks used by REPL path).
- [ ] Slice R7 (GREEN): Wire explicit shutdown sequencing in controller/adapter and preserve one-shot mode behavior.
- [ ] Slice R7 (REFACTOR): Centralize shutdown policy in one helper used by all exit paths.

- [ ] Slice R8 (RED): Add CLI composition tests verifying default command uses REPL controller + cel renderer and `run "<prompt>"` path remains unchanged.
- [ ] Slice R8 (GREEN): Swap CLI wiring in `src/core/cli/index.ts` / `src/index.ts` to new REPL stack.
- [ ] Slice R8 (REFACTOR): Remove obsolete readline loop code and dead wiring.

- [ ] Slice R9 (RED): Add review-packet acceptance tests/checklist for required demo artifacts and scenario coverage.
- [ ] Slice R9 (GREEN): Generate end-to-end review packet artifacts (`.cast`, `.mp4`, key screenshots, `REVIEW_PACKET.md`) and add static `review.html` that embeds video + ordered screenshot gallery.
- [ ] Slice R9 (REFACTOR): Standardize artifact naming, timestamped run directories, and reusable demo script for deterministic playback speed.

- [ ] Slice R9.1: Add `docs/review/REVIEW_PACKET_TEMPLATE.md` with evidence mapping table (criterion -> artifact -> timestamp/screenshot).
- [ ] Slice R9.2: Create deterministic demo runner (tmux-based, human-speed delays, fixed 120x36 terminal) for reproducible `.cast` capture.
- [ ] Slice R9.3: Add media pipeline script to export `.cast` to `.mp4` and validate output file presence.
- [ ] Slice R9.4: Capture and store required screenshots (`01`-`08`) from the same demo run used for video.
- [ ] Slice R9.5: Implement portable `review.html` (no build step, relative paths, responsive layout, embedded video, labeled screenshot gallery).
- [ ] Slice R9.6: Add review artifact validator script that checks required files/paths and fails fast on missing artifacts.
- [ ] Slice R9.7: Produce final run folder `artifacts/review/repl-tui-<timestamp>/` and complete `REVIEW_PACKET.md` with pass/fail outcomes.

- [ ] Compatibility checks: add/manual-test checklist for Kitty-first behavior, `tmux` with `set -s extended-keys on`, and documented legacy best-effort limits.
- [ ] Docs: update `README.md` REPL section (keybindings, inline activity behavior, tmux setting, exit behavior, and any title policy if `cel.setTitle` is introduced).
- [ ] Run final verification: `bun test`, `bun run typecheck`, `bun run check --write`.

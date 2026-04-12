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

- [x] Slice R0 (RED): Add tests for a command catalog constant covering canonical commands, aliases, precedence, argument shape, and unknown-command suggestion inputs.
- [x] Slice R0 (GREEN): Implement `src/core/cli/repl/command-catalog.ts` exporting a single typed command list for built-ins and skill-alias strategy.
- [x] Slice R0 (REFACTOR): Make parser/dispatcher/help text consume the catalog and remove duplicated command literals.

- [x] Slice R1 (RED): Add command parser parity tests for `/help`, `/reset`, `/skills`, `/skill <name>`, `/<skill-name>`, unknown slash suggestions, `/exit`, `:q`, and prompt passthrough.
- [x] Slice R1 (GREEN): Implement `src/core/cli/repl/commands.ts` with built-in precedence and skill-alias resolution parity.
- [x] Slice R1 (REFACTOR): Remove duplicate command parsing paths and centralize parser fixtures/builders.

- [x] Slice R2 (RED): Add reducer tests for `prompt_submitted`, `prompt_started`, `activity_received`, `prompt_succeeded`, `prompt_failed`, `session_reset`, and deterministic transcript row ordering.
- [x] Slice R2 (GREEN): Implement `src/core/cli/repl/types.ts` and `src/core/cli/repl/reducer.ts` with unified transcript row variants (`user|assistant|activity|system|error`).
- [x] Slice R2 (REFACTOR): Extract event-to-row mapping helpers and normalize reducer test utilities.

- [x] Slice R3 (RED): Add controller tests with fake renderer port for prompt execution, history updates, reset/exit handling, `/skills`, `/skill`, alias activation, and no normal prompt flow for skill activation.
- [x] Slice R3 (GREEN): Implement `src/core/cli/repl/controller.ts` to own side effects, intent routing, and runtime callback wiring.
- [x] Slice R3 (REFACTOR): Split controller lifecycle helpers (submit, command, activity, shutdown) into focused functions.

- [x] Slice R4 (RED): Add inline activity integration tests ensuring `onActivity` events interleave correctly with prompt lifecycle (`prompt_started` -> `activity_received*` -> `prompt_succeeded|prompt_failed`).
- [x] Slice R4 (GREEN): Route REPL-mode runtime `onActivity` through controller/reducer instead of direct stdout writes.
- [x] Slice R4 (REFACTOR): Consolidate activity formatting through existing `formatActivityEvent` semantics.

- [x] Slice R5 (RED): Add renderer-port contract tests for `start(initialState, handlers)`, `render(nextState)`, `stop()`, handler emission, and stop idempotency.
- [x] Slice R5 (GREEN): Implement `src/core/cli/repl/ui/port.ts` and fake adapter contract harness.
- [x] Slice R5 (REFACTOR): Keep port surface minimal and move non-contract logic out of tests.

- [x] Slice R6 (RED): Add cel adapter tests for intent emission, TextInput Enter interception (submit vs newline), key bubbling semantics (`false` bubbles, `undefined` consumes), and render updates.
- [x] Slice R6 (GREEN): Implement `src/core/cli/repl/ui/cel/renderer.ts` (optionally `view.ts`) using cel lifecycle (`cel.init`/`cel.viewport`/`cel.render`/`cel.stop`).
- [x] Slice R6 (REFACTOR): Separate pure view composition from terminal lifecycle glue.

- [x] Slice R7 (RED): Add shutdown-path tests proving renderer calls `cel.stop()` before any `process.exit()` path (`/exit`, `:q`, signal/error cleanup hooks used by REPL path).
- [x] Slice R7 (GREEN): Wire explicit shutdown sequencing in controller/adapter and preserve one-shot mode behavior.
- [x] Slice R7 (REFACTOR): Centralize shutdown policy in one helper used by all exit paths.

- [x] Slice R8 (RED): Add CLI composition tests verifying default command uses REPL controller + cel renderer and `run "<prompt>"` path remains unchanged.
- [x] Slice R8 (GREEN): Swap CLI wiring in `src/core/cli/index.ts` / `src/index.ts` to new REPL stack.
- [x] Slice R8 (REFACTOR): Remove obsolete readline loop code and dead wiring.

- [x] Slice R9 (Pipeline): Add `docs/review/REVIEW_PACKET_TEMPLATE.md` with artifact inventory, scenario mapping, acceptance-criteria evidence table, environment capture, and pass/fail checklist.
- [x] Slice R9 (Pipeline): Add deterministic tmux demo runner script (`120x36`, `extended-keys on`, human-speed pacing) for reproducible `.cast` generation.
- [x] Slice R9 (Pipeline): Add media export script to convert `.cast` -> `.mp4` and verify output artifact presence.
- [x] Slice R9 (Pipeline): Add review artifact validator script that fails fast on missing required files (`.cast`, `.mp4`, screenshots `01`-`08`, `REVIEW_PACKET.md`, `review.html`).
- [x] Slice R9 (Pipeline): Generate canonical run folder `artifacts/review/repl-tui-<timestamp>/` with demo video/cast and required screenshots from one continuous scenario run.
- [x] Slice R9 (Pipeline): Create portable static `review.html` (relative paths only, responsive, embedded video + ordered screenshot gallery + links to packet/cast).
- [x] Slice R9 (Pipeline): Complete `REVIEW_PACKET.md` with timestamped scenario evidence, acceptance-criteria mapping, compatibility notes, and final pass/fail outcomes.

- [x] Slice R9 (Follow-up): Capture one real continuous demo session in tmux (`120x36`, `set -s extended-keys on`) and replace placeholder cast/video artifacts with real evidence.
- [x] Slice R9 (Follow-up): Capture required screenshots `01`-`08` from the same real demo run and replace placeholder screenshots.
- [x] Slice R9 (Follow-up): Update `artifacts/review/repl-tui-<timestamp>/REVIEW_PACKET.md` with real timestamp mappings, concrete artifact references, and final pass/fail criteria outcomes.
- [x] Slice R9 (Follow-up): Run secondary compatibility validation in a Kitty-compatible terminal and document outcomes/limitations in the review packet.
- [x] Slice R9 (Follow-up): Re-run `review:validate` against the real artifact set and confirm packet status is PASS or includes explicit follow-up issues.

- [x] Compatibility checks: add/manual-test checklist for Kitty-first behavior, `tmux` with `set -s extended-keys on`, and documented legacy best-effort limits.
- [x] Docs: update `README.md` REPL section (keybindings, inline activity behavior, tmux setting, exit behavior, and any title policy if `cel.setTitle` is introduced).
- [x] Run final verification: `bun test`, `bun run typecheck`, `bun run check --write`.

## `/models` REPL command + styled model rows (red-green TDD order)

- [x] Slice M1 (RED): Add catalog/parser tests for `/models` command presence, built-in ordering, and slash-resolution to `models_list`.
- [x] Slice M1 (GREEN): Implement `/models` in `src/core/cli/repl/command-catalog.ts` and `src/core/cli/repl/commands.ts` with built-in precedence preserved.
- [x] Slice M1 (REFACTOR): Remove any duplicated `/models` literals and keep help/catalog output generation centralized.

- [x] Slice M2 (RED): Add model-layer tests for listing all available models across all providers with deterministic ordering and normalized shape.
- [x] Slice M2 (GREEN): Implement model catalog helper under `src/core/model/*` using `pi-ai` provider/model discovery behind the internal seam.
- [x] Slice M2 (REFACTOR): Keep `pi-ai` types/details isolated to model modules; expose only internal DTOs (`modelName`, `providerName`).

- [x] Slice M3 (RED): Add controller tests proving `/models` routes without `runPrompt` execution and appends model listing rows to transcript.
- [x] Slice M3 (GREEN): Wire `/models` handling in controller + CLI composition (`listModels` adapter) and format fallback plain-text output for non-rendered paths.
- [x] Slice M3 (REFACTOR): Share model list formatting helpers to avoid duplicate rendering/formatting logic.

- [x] Slice M4 (RED): Add reducer/view tests for structured model transcript rows and mixed-style rendering semantics.
- [x] Slice M4 (GREEN): Extend transcript row/event types and render model lines with emphasized model name (`bold`, `color14`) + de-emphasized provider (`color08`).
- [x] Slice M4 (REFACTOR): Extract focused model-row rendering helper and keep existing row rendering paths stable.

- [x] Slice M5 (RED): Add docs/test coverage updates for help output + README command list including `/models`.
- [x] Slice M5 (GREEN): Update `README.md` and help text to document `/models` behavior (lists models from signed-in providers).
- [x] Slice M5 (REFACTOR): Align wording/examples with current REPL command conventions and remove stale references.

- [x] Run final verification: `bun test`, `bun run typecheck`, `bun run check --write`.

## `/models` current-model badge UX follow-up

- [x] Slice MB1 (RED): Add controller/reducer/view tests asserting the currently selected runtime model is marked in `/models` output.
- [x] Slice MB1 (GREEN): Thread current runtime model spec into REPL models adapter and annotate matching row with a badge token.
- [x] Slice MB1 (REFACTOR): Centralize model-id matching/normalization helper to avoid duplicated comparison logic.

- [x] Slice MB2 (RED): Add view tests asserting badge visual treatment (high-contrast but secondary to model name emphasis).
- [x] Slice MB2 (GREEN): Render a compact badge next to the active model in `src/core/cli/repl/ui/cel/view.ts` while preserving existing color hierarchy.
- [x] Slice MB2 (REFACTOR): Extract badge render helper to keep transcript row rendering paths focused.

- [x] Slice MB3 (RED): Add README/help coverage for active-model badge semantics in `/models`.
- [x] Slice MB3 (GREEN): Update docs to explain how the active model is identified and displayed.
- [x] Slice MB3 (REFACTOR): Keep wording consistent with existing REPL command docs.

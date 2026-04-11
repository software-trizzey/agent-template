# REPL TUI Refactor Spec

## Purpose

Refactor the current readline-based REPL to a modern TUI built with `cel-tui`, while preserving strict seams so the renderer can be swapped later without rewriting REPL domain behavior.

This spec defines:

- architecture boundaries
- inline event rendering behavior
- command and session behavior parity requirements
- red-green TDD implementation slices

---

## Goals

- Replace the current REPL UI with a `cel-tui` interface.
- Keep REPL behavior independent of any specific TUI library.
- Render runtime activity events inline in transcript (similar to coding agents like OpenCode).
- Preserve current command behavior, including skills surfaces (`/help`, `/reset`, `/skills`, `/skill <name>`, `/<skill-name>`, `/exit`, `:q`).
- Treat skills command and activation parity as a first-class requirement from the first refactor slice.
- Keep one-shot `run <prompt>` behavior unchanged.

## Non-Goals

- Renderer fallback implementation (no readline fallback).
- Production-hardening concerns for terminal edge cases.
- Session/runtime model changes in `src/core/session/*`.

---

## Current Baseline

The current REPL is a small readline loop with direct output writes:

- `src/core/cli/repl.ts`
- `src/core/cli/index.ts`
- `src/index.ts`

Activity output currently writes to stdout directly via runtime `onActivity` callbacks.

---

## Target Architecture

Use an event-driven REPL architecture with explicit seams:

1. **Controller (domain orchestration)**
   - Handles user intents and command routing.
   - Calls `runPrompt(prompt, history)`.
   - Dispatches events to reducer.
   - No `cel-tui` dependency.

2. **Reducer/Store (state projection)**
   - Pure state transitions from typed REPL events.
   - Produces a `ReplUiState` view model.
   - No terminal IO.

3. **Renderer Port (swap seam)**
   - Interface contract used by controller.
   - Renderer implementation can be replaced.

4. **Cel Renderer Adapter**
   - Implements renderer port with `cel-tui`.
   - Renders state and emits user intents.
   - No domain logic.

### Naming and Module Boundaries

Keep `repl` for domain logic and `ui/cel` for renderer-specific code.

Suggested structure:

- `src/core/cli/repl/types.ts`
- `src/core/cli/repl/commands.ts`
- `src/core/cli/repl/reducer.ts`
- `src/core/cli/repl/controller.ts`
- `src/core/cli/repl/ui/port.ts`
- `src/core/cli/repl/ui/cel/renderer.ts`

Optional split for cleanliness:

- `src/core/cli/repl/ui/cel/view.ts` (pure node-tree composition)

---

## Transcript and Inline Event Model

The transcript is a single ordered list with row variants:

- `user`
- `assistant`
- `activity`
- `system`
- `error`

Runtime events (`turn_started`, `turn_finished`, `tool_started`, `tool_finished`) are appended inline in order relative to prompt lifecycle updates.

Activity rows should reuse existing formatting semantics from `src/core/cli/output.ts` (`formatActivityEvent`) to avoid behavior drift.

No separate activity panel in the initial implementation.

---

## Command and Behavior Parity

The refactor must preserve these commands and precedence:

- `/help` => print help content into transcript as `system` row(s)
- `/reset` => clear session history and transcript state as defined by reducer
- `/skills` => list discovered skills
- `/skill <name>` => activate skill by canonical command
- `/<skill-name>` => activate skill by alias when skill exists
- unknown slash command => return the existing clear error + suggestion behavior
- `/exit`, `:q` => stop renderer and exit REPL loop
- any other non-empty input => prompt submission

### Skills Activation Parity (First-Class)

The refactor must preserve current activation semantics exactly:

- model-driven activation (`activate_skill` tool call), `/skill <name>`, and `/<skill-name>` must remain shape-equivalent in history
- REPL-driven skill activation must keep injecting the same assistant tool-call + tool-result pair contract
- REPL skill activation must not execute normal prompt flow
- parity behavior currently validated in `test/core/skills.integration.test.ts` must remain true after TUI migration

One-shot mode remains unchanged:

- `bun run src/index.ts run "..."`

---

## Runtime Event Wiring

In REPL mode:

- runtime `onActivity` must dispatch controller/reducer events
- avoid direct activity stdout writes from `src/index.ts`

In one-shot mode:

- preserve current behavior (simple stdout output)

---

## Renderer Port Contract

The renderer interface should support:

- `start(initialState, handlers)`
- `render(nextState)`
- `stop()`

Lifecycle requirement:

- renderer stop paths must restore terminal state by calling `cel.stop()` before any `process.exit()` path (`/exit`, `:q`, SIGINT/SIGTERM handling)

Where handlers emit intents such as:

- submit prompt
- invoke slash command
- reset
- exit
- input change / focus / scroll (as needed by UI)

Adapter behavior requirements:

- prompt submit should be implemented via `TextInput.onKeyPress` interception (Enter inserts newline by default; submit path must prevent default edit behavior)
- key propagation must preserve cel semantics: returning `false` from `onKeyPress` bubbles to ancestors; returning `void`/`undefined` consumes

The controller owns all side effects and business decisions; renderer only emits intents and paints state.

---

## Red-Green TDD Plan

Implement in small vertical slices. For each slice: write failing test, implement minimal code, then refactor.

### Slice 1: Command parser parity

- **RED**: tests for `/help`, `/reset`, `/skills`, `/skill <name>`, `/<skill-name>`, unknown slash suggestions, `/exit`, `:q`, and prompt passthrough.
- **GREEN**: implement `repl/commands.ts`.
- **REFACTOR**: remove old parser duplication.

### Slice 2: Reducer and UI state

- **RED**: tests for reducer transitions:
  - `prompt_submitted`
  - `prompt_started`
  - `activity_received`
  - `prompt_succeeded`
  - `prompt_failed`
  - `session_reset`
- **GREEN**: implement `repl/types.ts` and `repl/reducer.ts`.
- **REFACTOR**: normalize transcript row types.

### Slice 3: Controller orchestration

- **RED**: controller tests with fake renderer port:
  - submits prompt and calls `runPrompt`
  - updates history
  - handles reset/exit without prompt execution
  - routes `/skills` and skill activation commands without regressing existing outputs
  - keeps skill activation out of normal prompt execution path
- **GREEN**: implement `repl/controller.ts`.
- **REFACTOR**: extract lifecycle helpers.

### Slice 4: Inline activity integration

- **RED**: tests that runtime activity appears inline in transcript in order.
- **RED**: tests that activity rows are correctly interleaved with prompt lifecycle rows (`prompt_started`/`activity_received`/`prompt_succeeded|prompt_failed`) in deterministic order.
- **GREEN**: route `onActivity` through controller/reducer.
- **REFACTOR**: centralize event-to-row mapping.

### Slice 5: UI port contract stabilization

- **RED**: tests around start/render/stop behavior and handler wiring.
- **GREEN**: finalize `repl/ui/port.ts` and fake adapter compatibility.

### Slice 6: Cel renderer adapter

- **RED**: adapter-level tests for intent emission and render call behavior.
- **GREEN**: implement `repl/ui/cel/renderer.ts`.
- **REFACTOR**: split pure view composition from lifecycle glue if needed.

### Slice 7: CLI composition swap

- **RED**: tests that default command uses REPL controller path and `run` path is unchanged.
- **RED**: keep existing skills integration parity tests green (`test/core/skills.integration.test.ts`).
- **GREEN**: wire controller + cel renderer in CLI entry.

### Slice 8: Documentation and final verification

- Update `README.md` REPL section and keybindings.
- Run:
  - `bun test`
  - `bun run typecheck`
  - `bun run check --write`

---

## Acceptance Criteria

- REPL is rendered by `cel-tui`.
- Domain REPL logic has no direct `cel-tui` imports.
- Activity events render inline in transcript.
- Existing command behavior remains intact.
- Skills command routing and suggestion behavior remain intact.
- Skills activation parity remains intact (model-driven vs `/skill` vs `/<skill-name>` history shape).
- One-shot mode remains intact.
- Terminal compatibility expectations are documented and validated for:
  - Kitty-compatible terminals (first-class)
  - `tmux` with `set -s extended-keys on` (first-class)
  - legacy terminals (best-effort, known modifier-collision limits)
- Tests cover command parsing, reducer transitions, controller orchestration, and adapter contract.

---

## Review Package (End-to-End Evaluation)

Produce a reviewer-ready packet after implementation to validate behavior, UX flow, and parity claims beyond unit/integration tests.

### Review Objectives

- Demonstrate full REPL TUI behavior at human-observable speed.
- Provide durable artifacts for asynchronous review (video + screenshots + checklist).
- Map each acceptance criterion to concrete evidence.

### Required Artifacts

Store under a timestamped directory, for example:

- `artifacts/review/repl-tui-YYYYMMDD-HHMM/`

Include:

- `repl-tui-demo.cast` (canonical terminal recording)
- `repl-tui-demo.mp4` (shareable rendered video from `.cast`)
- `screens/01-idle.png`
- `screens/02-help.png`
- `screens/03-skills-list.png`
- `screens/04-skill-activation.png`
- `screens/05-inline-activity.png`
- `screens/06-unknown-command-error.png`
- `screens/07-reset-state.png`
- `screens/08-exit-cleanup.png`
- `REVIEW_PACKET.md` (evidence index + pass/fail checklist)
- `review.html` (single-file visual review page that embeds the video and screenshots)

### Demo Scenario (Must Be Captured)

Record one continuous session that shows, in order:

1. Startup and initial idle state.
2. `/help` renders system rows.
3. `/skills` renders discovered skills list.
4. `/skill <name>` activation path.
5. `/<skill-name>` activation alias path.
6. Unknown slash command shows error + suggestion behavior.
7. Normal prompt submission with inline activity rows interleaved in order.
8. `/reset` clears state as specified.
9. Error path (prompt/tool failure) renders `error` row behavior.
10. `/exit` or `:q` performs clean shutdown with terminal restoration (`cel.stop()` before exit).

### Recording and Environment Requirements

- Record primary demo in `tmux` with `set -s extended-keys on`.
- Validate at least one additional run in a Kitty-compatible terminal.
- Use fixed terminal geometry for consistency (e.g., 120x36).
- Keep pacing human-like (brief pauses between actions; no unreadable rapid playback).
- Avoid sensitive data in transcript; sanitize prompts if needed.

### Evidence Mapping

`REVIEW_PACKET.md` must include:

- artifact inventory
- environment details (terminal, tmux version/settings, OS)
- timestamp map from video to scenario steps
- screenshot-to-scenario mapping
- acceptance criteria checklist with artifact references
- known limitations observed (if any), especially legacy key-collision caveats

`review.html` requirements:

- render the `.mp4` with native controls and a clear title/description
- render screenshots in an ordered, labeled gallery matching the demo scenario
- include links to `REVIEW_PACKET.md` and `repl-tui-demo.cast`
- be static and portable (no build step; relative paths only)
- be readable on desktop and mobile (responsive layout)

### Suggested Commands (Non-Normative)

- Record cast: `asciinema rec artifacts/review/<run-id>/repl-tui-demo.cast --cols 120 --rows 36`
- Render shareable media (tooling-dependent): export `.cast` to `.mp4`
- Capture screenshots at scenario checkpoints

### Completion Gate

This refactor is not complete until the review packet is generated and all acceptance criteria are either:

- marked pass with linked evidence, or
- marked fail with a documented follow-up issue.

---

## Risks and Mitigations

- **Risk:** Renderer and domain logic become coupled.
  - **Mitigation:** strict renderer port, controller-only side effects.

- **Risk:** Behavior regressions during refactor.
  - **Mitigation:** parity tests first (RED), then incremental swaps.

- **Risk:** UI churn from cel-specific details.
  - **Mitigation:** keep cel-specific code under `repl/ui/cel/*` only.

---

## Notes

- No fallback renderer is planned.
- Inline event rendering is intentionally chosen over a separate activity panel for v1.
- If terminal title updates are introduced (`cel.setTitle`), treat them as imperative terminal state and document whether title restoration on shutdown is in scope (cel does not restore previous title automatically).

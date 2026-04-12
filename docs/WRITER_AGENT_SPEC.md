# Writer Agent Spec

## Status

This spec is intentionally constrained for a v1 build in a separate repository created from `agent-template`.

## Goal

Build a focused writer agent on top of the provider-agnostic template runtime.

The product should produce, refine, and transform written content through explicit workflows, not open-ended generic chat behavior.

## Confirmed decisions

1. Build in a separate repository created from this template.
2. Use explicit slash workflow commands in REPL only for v1.
3. Use local-first persistence with SQLite + Drizzle.
4. Keep skills optional and additive, not the primary workflow engine.
5. Treat style matching from example source material as a first-class capability.

## Assumptions

The underlying template already provides:

- provider-agnostic model support
- reusable session/runtime orchestration
- CLI + REPL shell
- profile and policy seams
- tool integration seams
- skills discovery/activation primitives

This spec does not redefine template-level runtime architecture.

## Product shape

This is a specialized writing system with deterministic workflow entrypoints.

The agent prioritizes:

- structural clarity
- readability
- consistency of tone
- faithful transformations when requested
- practical outputs ready for editing or publishing

## Voice and style matching (first-class)

The system must support style transfer based on user-provided exemplar writing.

This is not optional polish. It is a core product behavior used across workflows.

### Core requirements

- Accept one or more style exemplars as direct text or saved assets.
- Derive a reusable style profile from exemplars.
- Apply style profile across `/outline`, `/draft`, `/rewrite`, `/summarize`, and `/repurpose`.
- Preserve user meaning and factual content while matching style cues.
- Allow strictness control so style influence can be soft or strong.

### Determinism and safety

- Style matching must be explicit via command flags, not hidden inference.
- Workflow arguments override style profile when conflicts occur.
- If requested style conflicts with factual accuracy or explicit constraints, preserve accuracy/constraints and emit a short warning.

### V1 style controls

- `--style-from "..."` (inline exemplar text)
- `--style-asset <asset-id>` (use saved exemplar)
- `--style-profile <profile-id>` (use saved extracted profile)
- `--style-strength low|medium|high` (default `medium`)
- `--preserve-meaning true|false` remains available for rewrite semantics

Only one of `--style-from`, `--style-asset`, or `--style-profile` should be required per run when style matching is desired.

### Optional dedicated command (v1.1 candidate)

- `/style-capture --input "..." --name "..."`

This command would extract and persist a reusable style profile from exemplar text.

For v1, this can be implemented implicitly inside workflow handlers if a style source is supplied.

## Workflow entry model (normative)

All writing workflows are entered via explicit slash commands.

- Built-ins (workflow commands) take precedence over skill alias commands.
- Unknown slash behavior should keep suggestion-based diagnostics.
- Natural-language freeform prompts are still allowed, but workflow behavior is guaranteed only for explicit commands.

### V1 commands

- `/outline`
- `/draft`
- `/rewrite`
- `/summarize`
- `/repurpose`

## Command contracts (v1)

Use a simple `--key value` shape, with quoted values where needed.

### `/outline`

Purpose: generate a structured outline from notes, prompt text, or source material.

Required:

- `--input "..."`

Optional:

- `--audience "..."`
- `--goal "..."`
- `--depth short|medium|deep` (default `medium`)

Output contract:

- title
- target audience + objective (brief)
- sectioned outline with nested bullets
- optional suggested next drafting order

### `/draft`

Purpose: generate a first draft from outline or source input.

Required (one of):

- `--input "..."`
- `--from-asset <asset-id>`

Optional:

- `--tone "..."`
- `--length short|medium|long`
- `--format article|post|email|memo`
- `--title "..."`
- `--style-from "..." | --style-asset <asset-id> | --style-profile <profile-id>`
- `--style-strength low|medium|high`

Output contract:

- complete draft in requested format
- no analysis preamble
- markdown-oriented plain text output

### `/rewrite`

Purpose: revise existing content while preserving intent unless instructed otherwise.

Required (all):

- `--input "..."` or `--from-asset <asset-id>`
- `--instruction "..."` (for example: clearer, tighter, more formal)

Optional:

- `--preserve-meaning true|false` (default `true`)
- `--max-length <words>`
- `--style-from "..." | --style-asset <asset-id> | --style-profile <profile-id>`
- `--style-strength low|medium|high`

Output contract:

- revised text only
- optional short change notes when `--notes true`

### `/summarize`

Purpose: compress material into useful concise form.

Required:

- `--input "..."` or `--from-asset <asset-id>`

Optional:

- `--length sentence|short|medium`
- `--format paragraph|bullets`
- `--focus "..."`
- `--style-from "..." | --style-asset <asset-id> | --style-profile <profile-id>`
- `--style-strength low|medium|high`

Output contract:

- summary only
- includes key points; avoids filler and repetition

### `/repurpose`

Purpose: transform source content into another channel format.

Required:

- `--input "..."` or `--from-asset <asset-id>`
- `--target tweet-thread|linkedin|newsletter|email|post`

Optional:

- `--tone "..."`
- `--cta "..."`
- `--max-length <chars|words>`
- `--style-from "..." | --style-asset <asset-id> | --style-profile <profile-id>`
- `--style-strength low|medium|high`

Output contract:

- channel-native structure
- no unrelated expansions

## Skills model (supporting, not primary)

Skills remain optional overlays that shape style or constraints.

Examples:

- `/skill brand-voice`
- `/skill linkedin-style`
- `/skill founder-newsletter`

Rules:

- Skills do not replace workflow routing.
- Skills can influence output tone/format within a workflow.
- Command arguments have higher priority than skill preferences when conflicts occur.

## Input types

The workflows should accept:

- direct prompts
- rough notes
- bullet lists
- partial drafts
- complete drafts
- pasted references

Document ingestion from files/URLs can be added as explicit tools later.

## Output expectations

Outputs should be:

- structured
- readable
- concise unless user requests expansion
- grounded in provided source/context
- copy/edit/publish friendly

Avoid verbose preamble and generic filler.

## Revision model (v1)

Use linear revision history first.

- Each workflow run creates a new asset version.
- Rewrites and repurposes link to their source asset.
- Branching versions are out of scope for v1.

## Persistence (v1 local-first)

Use SQLite + Drizzle for local persistence.

### Minimal schema

1. `projects`

- `id`
- `name`
- `created_at`

2. `assets`

- `id`
- `project_id`
- `type` (`source|outline|draft|rewrite|summary|repurpose`)
- `title` (nullable)
- `content`
- `created_at`

3. `workflow_runs`

- `id`
- `project_id`
- `workflow` (`outline|draft|rewrite|summarize|repurpose`)
- `input_asset_id` (nullable)
- `output_asset_id`
- `args_json`
- `model_spec`
- `created_at`

4. `preferences`

- `id`
- `project_id`
- `key`
- `value_json`

5. `style_profiles`

- `id`
- `project_id`
- `name`
- `source_asset_id` (nullable)
- `source_excerpt` (nullable)
- `profile_json` (voice traits, sentence cadence, lexical rules, formatting habits)
- `created_at`

Notes:

- Keep migrations simple and explicit.
- Persist enough metadata for reproducibility/debugging.
- Store style source provenance so outputs can be traced to exemplar origin.

## Behavior constraints

The writer agent should:

- stay within writing scope
- avoid acting like a coding or broad research agent by default
- preserve meaning on rewrite unless told otherwise
- make clear formatting decisions where useful

## Non-goals (v1)

- coding-agent behavior
- autonomous multi-domain tasking
- heavy research automation
- remote/cloud persistence
- collaborative multi-user state

## Implementation sequence

1. Create dedicated writer profile.
2. Add workflow slash-command parser + validators.
3. Implement `/draft` first end-to-end (command -> run -> persist).
4. Add `/outline`, `/rewrite`, `/summarize`, `/repurpose`.
5. Add SQLite + Drizzle schema and repository layer.
6. Add skill overlay precedence rules.
7. Add evaluation fixtures for deterministic workflow checks.

## Success criteria

The project is successful if:

- workflow behavior is deterministic via explicit slash commands
- outputs are usable with minimal editing for common writing tasks
- revision history is persisted locally and traceable
- skills improve style without replacing workflow control
- the agent remains clearly writing-focused

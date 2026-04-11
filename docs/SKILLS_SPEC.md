# Skills Integration Spec

## Purpose

This document defines how Agent Skills (https://agentskills.io/llms.txt) will be integrated into this Bun-based agent template.

It covers:
- what skills are
- how this project will support discovery, activation, and execution
- architecture and runtime contracts
- validation and trust model
- test strategy

---

## What Are Skills?

Agent Skills are a lightweight, filesystem-based capability format for AI agents.

A skill is a directory that contains at minimum a `SKILL.md` file with:
- YAML frontmatter metadata (required: `name`, `description`)
- Markdown instructions (the skill body)

Optional supporting files may exist in:
- `scripts/`
- `references/`
- `assets/`

Skills are designed for progressive disclosure:
1. load lightweight metadata catalog at startup
2. load full skill instructions only when needed
3. load supporting resources on demand

---

## Runtime Constraints

The spec must align with these current runtime behaviors:

- Profile instructions are currently static strings (`src/core/types/profile.ts`, `src/profiles/default/index.ts`).
- Session tool history follows an assistant tool-call message followed by a tool result message (`src/core/session/session.ts`).
- Tool names must be globally unique in the registry, or startup fails (`src/core/tools/registry.ts`).
- Default profile local provider currently returns no local tools (`src/profiles/default/index.ts`).

These constraints are normative inputs for the design below.

---

## Integration Goals

- Add standards-aligned skill support without disrupting existing runtime architecture.
- Keep orchestration thin and reusable.
- Reuse one activation pipeline for both model-driven and user-driven activation.
- Make `/skill` history injection semantically equivalent to model-triggered `activate_skill` tool usage.

## Non-Goals (Initial Phase)

- full skill marketplace/remote install support
- complex permission UX
- automatic subagent delegation for skills

---

## Planned Architecture

### 1) Skills Discovery and Indexing

Introduce a `SkillRegistry` as the skill discovery service.

Responsibilities:
- discover skill directories containing `SKILL.md`
- parse and validate metadata/body
- resolve collisions with deterministic precedence
- expose catalog for prompt disclosure and lookup by name for activation

Scan scopes:
- project-level skills path(s)
- user-level skills path(s)

Deterministic scan order:
1. project roots in declared order
2. user roots in declared order
3. lexical path order within each root

Collision and duplicate rules:
- cross-scope collision: project skill overrides user skill by `name`
- same-scope collision: first discovered skill wins, later duplicates are skipped with warning
- reserved-name conflict with runtime tools is disallowed and skipped with warning

### 2) Skill Activation Service

Introduce `SkillActivator` as a reusable domain service.

Responsibilities:
- activate by skill name
- produce normalized activation payload
- wrap content in an identifiable block: `<skill_content name="...">...</skill_content>`
- optionally include skill directory and resource listing metadata (bounded)

All activation interfaces call this same service.

### 3) Model-Driven Activation

Add a local tool: `activate_skill`.

Behavior:
- input: skill name
- output: activated skill content payload from `SkillActivator`
- returns structured tool success/failure responses

This enables skills even without filesystem MCP.

### 4) User-Driven Activation

Add REPL skill command surfaces:
- `/skills` lists discovered skills for quick selection
- `/skill <name>` activates a skill explicitly
- `/<skill-name>` is a convenience alias for `/skill <skill-name>`

Behavior:
- all activation forms call `SkillActivator.activate(name)`
- all activation forms inject a synthetic assistant tool-call message and a synthetic tool-result message into history
- all activation forms use the same `toolCall.id` and tool name (`activate_skill`) used by model-driven calls

Command routing and precedence:
- built-in REPL commands take precedence (`/help`, `/reset`, `/exit`, `:q`)
- if input begins with `/` and is not a built-in, resolve as direct skill alias
- `/skill <name>` remains the canonical explicit form for diagnostics and tests
- unknown slash command should return a clear error and suggest closest skill/built-in matches

Canonical synthetic history contract (normative):
1. assistant message: `role="assistant"`, `content=""`, `toolCall={ id, name: "activate_skill", args }`
2. tool message: `role="tool"`, `name=<same id>`, `content=<serialized tool result envelope>`

Tool-only injection is not allowed because it can produce unmatched tool outputs.

### 5) Skill Catalog Disclosure

At prompt execution time, compose runtime instructions from:
- base profile instructions
- compact `<available_skills>` block when skills exist

Catalog entry fields:
- `name`
- `description`
- `location` (path to `SKILL.md`)

If no skills are discovered, omit the block entirely.

### 6) Instruction Composition Seam

Add an explicit instruction composition function (for example, `composeInstructions`) rather than mutating profile constants.

Contract:
- input: `baseInstructions`, `availableSkillsCatalog`
- output: single instruction string passed to session runner
- empty catalog returns `baseInstructions` unchanged

---

## Provider Integration

Add a dedicated local skills provider (for example, `createSkillsToolProvider`) that contributes `activate_skill`.

Provider composition requirements:
- skills local provider must be composed in default profile provider list
- provider order must be deterministic
- duplicate tool names must be prevented before registry build

---

## Validation, Limits, and Encoding Policy

Parser and metadata policy:
- required fields: `name`, `description`
- YAML parsing is strict and supports full YAML frontmatter (lists, nested objects, multiline scalars)
- unknown frontmatter fields are allowed and preserved
- missing/empty required fields: skip with warning
- invalid `SKILL.md` parse (including non-object top-level frontmatter): skip with warning

Metadata constraints:
- `name`: 1-64 chars, lowercase letters/numbers/hyphen/underscore (`^[a-z0-9_-]+$`)
- `description`: 1-280 chars after trim

Payload limits:
- max skill body bytes in activation payload (bounded; truncation allowed)
- max resource listing entries (bounded)
- truncation must add a clear marker in output

Encoding and wrapper safety:
- skill `name` must be escaped/sanitized before insertion in tagged blocks
- embedded body content must be safely wrapped so malformed tags cannot break delimiters

Diagnostics:
- warnings should include machine-parseable code and human-readable message
- warnings should include source path when available

---

## Trust Model (Initial Phase)

Minimum trust controls are in-scope now:
- only discover from explicitly configured allowed roots
- env flag to enable/disable project-level skills
- warn when skipping paths outside allowed roots

Still out of scope for this phase:
- interactive approval UX
- signed skill verification
- remote marketplace trust framework

---

## High-Level Implementation Sequence

1. Add `src/core/skills/types.ts`.
2. Add `src/core/skills/parser.ts` (`SKILL.md` parsing + validation policy).
3. Add `src/core/skills/registry.ts` (discovery, deterministic indexing, catalog, lookup).
4. Add `src/core/skills/activator.ts` (activation payload generation + bounds + safety).
5. Add `src/core/skills/tool.ts` (`activate_skill` local tool adapter).
6. Add local skills provider composition in `src/profiles/default/index.ts`.
7. Add instruction composer and wire catalog injection at runtime prompt execution.
8. Extend REPL command parser/handler with `/skills`, `/skill <name>`, and `/<skill-name>` alias routing.
9. Add shared synthetic assistant+tool history injection helper for all REPL activation forms.
10. Add trust root/env wiring and warning diagnostics.
11. Update docs and examples (`README.md`, optional `.env.example` if needed).

---

## Testing Strategy

### Unit Tests

- `skills.parser`
  - valid/invalid strict frontmatter parse
  - body extraction
  - required field validation
  - name/description bounds and format
- `skills.registry`
  - deterministic discovery order
  - cross-scope and same-scope collision behavior
  - reserved-name conflict handling
  - catalog shape correctness
- `skills.activator`
  - activation success path
  - unknown skill failure
  - wrapping format correctness
  - truncation and marker behavior
  - escaping/sanitization behavior

### Adapter Tests

- `activate_skill` tool adapter
  - descriptor correctness
  - argument validation
  - success/failure envelopes
- REPL `/skill` adapter
  - command parsing
  - activation call path
  - synthetic assistant+tool pair injection
  - graceful unknown-skill handling
  - alias routing parity (`/<skill-name>` and `/skill <name>`)
  - `/skills` listing behavior

### Integration Tests

Primary invariant:
- model-driven activation and `/skill` activation produce equivalent assistant-tool-call + tool-result history message shape
- model-driven activation, `/skill <name>`, and `/<skill-name>` produce equivalent assistant-tool-call + tool-result history message shape

Also verify:
- catalog appears only when skills are available
- no regressions in session/tool registry behavior
- trust root gating is enforced

### Fixtures

Add small skill fixtures under `test/fixtures/skills/`:
- valid skill
- malformed YAML
- missing required fields
- duplicate names (same scope)
- duplicate names (project over user)
- XML-unsafe/invalid names
- skill with `references/` and/or `scripts/`
- oversized skill body/resources fixture
- fixture names that collide with built-in REPL commands

---

## Risks and Mitigations

- Risk: divergence between model and user activation paths
  Mitigation: single `SkillActivator` and shared synthetic assistant+tool history contract
- Risk: prompt bloat from catalog and activation payloads
  Mitigation: metadata-only catalog, bounded activation payloads, truncation markers
- Risk: untrusted project skill instructions
  Mitigation: allowed-root trust gating and explicit env controls in phase 1

---

## Chosen Defaults

- re-activation behavior: always re-inject activation output (no session dedupe in phase 1)
- YAML strictness: strict parse, skip invalid files with warnings
- resource listing limits: bounded with explicit truncation marker
- command UX: keep `/skill <name>` as canonical explicit command, support `/<skill-name>` as alias, and keep `/skills` for discovery

# Skills Integration Spec

## Purpose

This document defines how Agent Skills (https://agentskills.io/llms.txt) will be integrated into this Bun-based agent template.

It covers:
- what skills are
- how this project will support discovery, activation, and execution
- high-level implementation design
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

## Integration Goals

- Add standards-aligned skill support without disrupting existing runtime architecture.
- Keep orchestration thin and reusable.
- Reuse one activation pipeline for both model-driven and user-driven activation.
- Ensure `/skill` injects a synthetic tool message so history format matches model tool activation.

## Non-Goals (Initial Phase)

- full skill marketplace/remote install support
- complex permission UX
- automatic subagent delegation for skills

---

## Current Project Fit

The codebase already has strong seams that align with skills support:

- profile-based composition (`src/profile.ts`, `src/profiles/default/index.ts`)
- tool provider and registry abstractions (`src/core/types/tools.ts`, `src/core/tools/registry.ts`)
- session loop with tool-call history (`src/core/session/session.ts`)
- MCP integration for external tools (`src/core/mcp/*`)

This makes skills a natural extension rather than a rewrite.

---

## Planned Architecture

### 1) Skills Discovery and Indexing

Introduce a `SkillRegistry` as the skill discovery service.

Responsibilities:
- discover skill directories containing `SKILL.md`
- parse and validate metadata/body
- resolve collisions with deterministic precedence
- expose catalog for prompt disclosure and lookup by name for activation

Planned scan scopes:
- project-level skills path(s)
- user-level skills path(s)

Collision rule:
- project-level skill overrides user-level skill when names collide

### 2) Skill Activation Service

Introduce `SkillActivator` as a reusable domain service.

Responsibilities:
- activate by skill name
- produce normalized activation payload
- wrap content in an identifiable block: `<skill_content name="...">...</skill_content>`
- optionally include skill directory and resource listing metadata

All activation interfaces call this same service.

### 3) Model-Driven Activation

Add a local tool: `activate_skill`.

Behavior:
- input: skill name
- output: activated skill content payload from `SkillActivator`
- returns structured tool success/failure responses

This enables skills even without filesystem MCP.

### 4) User-Driven Activation

Add REPL command: `/skill <name>`.

Behavior:
- calls `SkillActivator.activate(name)`
- injects the result into session history as a synthetic `tool` message
- keeps message shape consistent with model-triggered tool activation

This ensures one behavioral path and avoids dual semantics.

### 5) Skill Catalog Disclosure

At session setup, append a compact `<available_skills>` block to runtime instructions when skills exist.

Catalog includes:
- `name`
- `description`
- `location` (path to `SKILL.md`)

If no skills are discovered, omit the block entirely.

---

## High-Level Implementation Plan

1. Add `src/core/skills/types.ts`.
2. Add `src/core/skills/parser.ts` (`SKILL.md` parsing).
3. Add `src/core/skills/registry.ts` (discovery, index, catalog, lookup).
4. Add `src/core/skills/activator.ts` (activation payload generation).
5. Add `src/core/skills/tool.ts` (`activate_skill` local tool adapter).
6. Integrate skills provider into default profile provider composition.
7. Add catalog injection into runtime instructions.
8. Extend REPL command parser/handler with `/skill <name>`.
9. Add synthetic tool message injection helper shared by the REPL path.
10. Update docs and examples (`README.md`, optional `.env.example` if needed).

---

## Validation and Parsing Policy (Initial)

- required fields: `name`, `description`
- missing/empty `description`: skip skill with warning
- invalid `SKILL.md` parse: skip skill with warning
- keep deterministic behavior and clear diagnostics
- start pragmatic on strictness, tighten later as needed

---

## Testing Strategy

### Unit Tests

- `skills.parser`
  - valid/invalid frontmatter
  - body extraction
  - optional fields pass-through
- `skills.registry`
  - discovery behavior
  - collision precedence
  - catalog shape correctness
- `skills.activator`
  - activation success path
  - unknown skill failure
  - wrapping format correctness

### Adapter Tests

- `activate_skill` tool adapter
  - descriptor correctness
  - argument validation
  - success/failure envelopes
- REPL `/skill` adapter
  - command parsing
  - activation call path
  - graceful unknown-skill handling

### Integration Tests

Primary invariant:
- model-driven activation and `/skill` activation produce equivalent synthetic `tool` history message shape

Also verify:
- catalog appears only when skills are available
- no regressions in session/tool registry behavior

### Fixtures

Add small skill fixtures under `test/fixtures/skills/`:
- valid skill
- malformed YAML
- missing required fields
- skill with `references/` and/or `scripts/`

---

## Risks and Mitigations

- Risk: divergence between model and user activation paths  
  Mitigation: single `SkillActivator` and shared injection format
- Risk: prompt bloat from catalog  
  Mitigation: metadata-only catalog, no eager full-skill injection
- Risk: untrusted project skill instructions  
  Mitigation: add trust gating in a follow-up phase if needed

---

## Open Decisions

- re-activation behavior: always re-inject vs session dedupe
- YAML strictness: strict-only vs lenient fallback parsing
- resource listing size limits in activation payload

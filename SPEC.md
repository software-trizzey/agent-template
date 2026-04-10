# Provider-Agnostic Agent Template Spec

## Goal

Update `agent-template` into a reusable, provider-agnostic template by introducing a thin internal model seam backed by `pi-ai`.

The immediate objective is easy model-vendor swapping without changing core runtime code.

## Why this change is needed

The current template already has strong structure:

- CLI entrypoint
- profile-based behavior
- policy hooks
- tool/provider registration
- session orchestration

But model integration is still coupled to provider-specific wiring and client construction.

We want this template to be a stronger starting point by:

- reducing direct coupling to provider SDKs
- enabling clean vendor swaps through configuration
- minimizing downstream adapter work
- preserving a generic runtime shell for future specialized agents

## Scope

### In scope

- Add `pi-ai`
- Introduce a thin internal model seam around `pi-ai`
- Replace direct OpenAI/Anthropic wiring in app composition and model factory paths
- Keep existing CLI, profile, policy, tool, and session loop semantics stable

### Out of scope

- Adopting `pi-agent-core` in this iteration
- Reworking session orchestration ownership
- Adding downstream domain-specific workflow logic to this template

## Package decision

### `pi-ai`

Use `pi-ai` as the provider/model abstraction layer.

Why:

- provides a unified provider interface
- centralizes provider quirks and normalization
- allows backend replacement later (for example Vercel AI SDK) through a narrow seam

## Architecture direction

Create a thin internal boundary so package-specific types do not leak into the core runtime.

Boundary rule:

- `pi-ai` implementation details stay in model backend modules
- `session` and runtime orchestration consume only internal model contracts

Design intent:

- switch model backend with config/env, not by editing session code
- keep `core/session/*` stable while model integration changes underneath

## Ownership after this change

### This repo owns

- project structure
- CLI
- profile system
- policy hooks
- tool registry/broker behavior
- session orchestration and activity lifecycle
- internal model seam contract and integration glue

### `pi-ai` owns

- provider/model abstraction
- provider-specific client invocation details
- provider normalization logic required to satisfy the internal model seam

## Implementation steps

### Step 1: Add `@mariozechner/pi-ai`

- add `@mariozechner/pi-ai` as the unified model/provider dependency
- keep Bun-first tooling and lockfile updates aligned with this repo

### Step 2: Lock the internal seam contract

- keep `ModelAdapter` as the only model contract consumed by session orchestration
- keep `core/session/*` behavior unchanged while backend integration changes underneath
- keep boundary rule intact: runtime code depends on internal types, not `pi-ai` types

### Step 3: Make model spec parsing provider-agnostic

- parse model id as `<provider>/<model>` without hardcoding a provider allowlist
- validate shape/format in parsing, and validate provider+model existence in the factory/backend resolver
- keep model selection config/env-driven through existing CLI/runtime options

### Step 4: Implement a `pi-ai` model backend adapter

- add a dedicated `pi-ai` adapter module under `src/core/model/*`
- map internal session history/tool definitions into `pi-ai` context/tool input
- map `pi-ai` assistant output back into internal `ModelTurn` (`assistantText` + tool call)
- keep provider-specific quirks contained to backend adapter modules only

### Step 5: Replace app composition and factory wiring

- remove direct OpenAI/Anthropic client construction from `src/index.ts`
- route model creation through a single `pi-ai`-backed factory path
- ensure provider/vendor switching happens by model spec + environment, not runtime/session edits

### Step 6: Preserve runtime semantics

- keep CLI command behavior, profile behavior, policy evaluation, and tool lifecycle unchanged
- keep session loop flow and activity events consistent with current behavior

### Step 7: Update tests for the new seam

- replace provider-specific adapter tests with `pi-ai` adapter/factory tests
- keep session/policy/tool tests as behavioral safety rails
- validate model-spec parsing and resolver error behavior for invalid provider/model input

### Step 8: Final cleanup

- remove direct OpenAI/Anthropic model adapter modules and exports
- remove OpenAI/Anthropic client wiring from app composition/factory paths
- remove `openai` and `@anthropic-ai/sdk` dependencies from this repo
- update docs/env guidance to reflect provider-agnostic `pi-ai` backend usage

### Step 9: Validation

- run typecheck, tests, and project check/format commands
- verify provider swapping through model spec/env without touching session runtime code

## Success criteria

This migration is successful if:

- template core runtime no longer depends directly on OpenAI/Anthropic SDK wiring
- `pi-ai` usage is isolated behind an internal seam
- switching provider/vendor requires config/env changes, not session/runtime edits
- CLI/profile/session behavior remains consistent with current semantics
- repo remains Bun-friendly and reusable as a generic template

## Future evaluation checkpoint

Re-evaluate `pi-agent-core` only if session orchestration starts showing clear cracks (for example repeated runtime complexity, difficult feature additions, or persistent maintenance overhead).

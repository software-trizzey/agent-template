# Agent Template

A reusable Bun-based agent runtime that I'm using in different agentic projects/ideas.

This template keeps runtime orchestration in `src/core/*` and puts domain behavior
in profile modules under `src/profiles/*`. New repositories can start with the
default profile, then replace it with their own domain-specific profile.

## Architecture

- `src/core/*`: domain-agnostic runtime (model adapter, session loop, tools, policies, CLI)
- `src/profiles/default`: starter profile (instructions, context derivation, providers, policy list, env)
- `src/profile.ts`: single selection seam for the active profile
- `src/index.ts`: app composition and lifecycle wiring

## Use This as a Template

1. Create a new repository from this template and clone it:

   - Private: `gh repo create my-new-agent --private --template software-trizzey/agent-template --clone`
   - Public: `gh repo create my-new-agent --public --template software-trizzey/agent-template --clone`

2. Create your desired agent profile at `src/profiles/<your-profile>/index.ts`.
3. Export it from `src/profile.ts` as `activeProfile`.
4. Add profile tests in `test/profiles` and contract coverage in `test/contracts/profileContractSuite.ts`.
5. Run validation:

   - `bun run typecheck`
   - `bun test`
   - `bun run check`

## Quick Start

```bash
bun install
```

Copy env variables and add API key for whichever provider your `--model <provider/model>` uses.
```bash
cp .env.example .env
```

Run REPL mode:

```bash
bun run src/index.ts
```

Run one-shot mode:

```bash
bun run src/index.ts run "Do foo work"
```

## CLI Usage

Commands:

- default: starts REPL
- `run <prompt>`: one-shot mode (skips REPL)

`run` requires exactly one prompt argument. Use quotes for multi-word prompts.

Valid:

```bash
bun run src/index.ts run "Do foo work"
```

Invalid (fails with unused args):

```bash
bun run src/index.ts run Do foo work
```

## Runtime Options

- `--model <provider/model>`: namespaced model id resolved through `@mariozechner/pi-ai` (default: `openai/gpt-5.3-codex`)
- `--max-turns <n>`: positive integer session turn cap (default: `8`)

Examples:

- `bun run src/index.ts --model openai/gpt-5.4-nano --max-turns 12`
- `bun run src/index.ts run "Summarize this file" --model anthropic/claude-sonnet-4.7`

## REPL Commands

- `/help`
- `/reset` (clears in-memory session history)
- `/exit` or `:q`

## Environment

- Required API key env vars are provider-dependent and handled by `@mariozechner/pi-ai`.
- Common examples: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`.
- Primary MCP config entrypoint: `MCP_CONFIG_PATH` (path to JSON config file)
- Optional profile variables are defined by the active profile's `env` parser.
- The selected model/provider is resolved at startup, so required provider credentials must be set before entering REPL.

## MCP Configuration

MCP support is `stdio`-first and tolerant on startup: if one configured server fails
to connect, the runtime logs a warning and continues with remaining providers.

Use `MCP_CONFIG_PATH` to point at a JSON config file:

```bash
MCP_CONFIG_PATH=./mcp.config.json bun run src/index.ts
```

Example config is available at `mcp.config.example.json`.

## Common CLI Errors

- `missing required args for command \`run <prompt>\``: no prompt was provided.
- `Unused args: ...`: prompt was not quoted and split into extra positional args.
- `--max-turns must be a positive integer.`: option value must be `1` or greater.

## Validation

```bash
bun run typecheck
bun test
bun run check
```

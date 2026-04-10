# Writer Agent Spec

WARNING: this is a worker in progress and subject to change based on how the general sdk update goes. I may also want to use a skill based workflow.

## Goal

Build a focused **writer agent** on top of the updated provider-agnostic agent template.

This project should help produce, refine, and transform written content through a narrow, opinionated workflow rather than behaving like a general-purpose assistant.

## Assumptions

This project assumes the underlying template already provides:

* provider-agnostic model support
* reusable agent/session runtime support
* CLI/runtime structure
* profile and policy hooks
* tool integration points

This spec does not cover those template-level concerns.

## Core purpose

The writer agent should help with content workflows such as:

* turning notes into outlines
* turning outlines into drafts
* rewriting content for tone or clarity
* summarizing long-form content
* repurposing content across channels
* supporting iterative revision

The agent should be optimized for writing quality, structure, and usability.

## Product shape

This should be a **specialized writing agent**, not a generic chat agent.

It should have a constrained set of responsibilities and predictable behavior.

The agent should prioritize:

* clear structure
* strong readability
* consistency of tone
* faithful transformation of source material
* practical output that is ready to edit or publish

## Initial workflows

The first version should support a small number of explicit workflows:

1. `outline`

   * generate a structured outline from notes, prompts, or source text

2. `draft`

   * generate a first draft from an outline, prompt, or source material

3. `rewrite`

   * revise existing content for clarity, tone, format, or brevity

4. `summarize`

   * compress source material into a concise and useful summary

5. `repurpose`

   * transform a source asset into another content format or channel

## Input types

The agent should be able to work from:

* direct prompts
* rough notes
* bullet points
* partial drafts
* completed drafts
* source documents
* copied web content or references

## Output expectations

Outputs should be:

* structured
* readable
* concise unless instructed otherwise
* grounded in the provided input/context
* easy to copy, edit, or publish

The agent should avoid unnecessary filler, vague phrasing, and overproduction.

## Agent behavior

The writer agent should:

* stay focused on the requested writing task
* ask for or infer structure from provided material
* preserve meaning when rewriting unless told to change it
* make strong formatting decisions when useful
* avoid behaving like a broad research or coding agent unless explicitly equipped for that purpose

## Tools

The toolset should stay narrow and writing-focused.

Likely tool categories:

* source/document ingestion
* optional web research
* note extraction
* formatting/export helpers
* future critique/evaluation tools

The project should avoid inheriting broad coding-agent tool behavior by default.

## Profile and instructions

This project should define a dedicated writer profile that shapes:

* tone and response behavior
* writing constraints
* workflow expectations
* output formatting rules
* tool usage rules

The profile should make the agent feel like a writing tool, not a generic assistant.

## Revision model

The workflow should support iteration.

Over time, the project should support:

* draft revisions
* rewrite passes
* comparison between versions
* critique and improvement loops
* preserving important constraints across iterations

## Persistence

The project will likely need to store:

* source material
* outlines
* drafts
* revised drafts
* task metadata
* user instructions or style preferences

Persistence can start simple, but the workflow should be designed with revision history in mind.

## Non-goals

This project is not intended to be:

* a coding agent
* a general-purpose autonomous agent
* a broad research agent
* a template/framework for every possible agent workflow

The focus is writing.

## Initial implementation direction

1. create a dedicated writer profile
2. define the first explicit task workflows
3. implement `draft` first
4. add `outline`, `rewrite`, `summarize`, and `repurpose`
5. keep tool usage narrow and deliberate
6. add persistence for drafts and revisions as needed

## Success criteria

This project is successful if:

* it feels meaningfully different from a generic assistant
* it produces usable writing outputs for clear tasks
* the workflows are constrained and predictable
* the system is easy to extend with additional writing flows later
* the agent stays focused on writing rather than expanding into unrelated behavior

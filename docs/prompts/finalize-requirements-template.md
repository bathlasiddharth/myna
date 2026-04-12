# Prompt: Finalize Requirements Instructions & Template

```
We need to create docs/instructions/requirements.md from scratch — the template that tells 10 autonomous Claude sessions HOW to write requirements for Myna. Ignore the existing content in that file. We're thinking from first principles.

## Context

Read these files to understand the project:
- docs/vision.md — what Myna is
- docs/decisions.md — all 24 settled decisions
- docs/features/non-functional.md — system-wide rules every requirement must be consistent with
- docs/features/cross-domain.md — cross-domain interaction map
- docs/requirements/email-and-messaging.md — a domain with features, useful for testing our template later

## What Myna is — this shapes everything

Myna is NOT a web app, API, or traditional software. There is no backend, no frontend, no database, no server.

Myna is a set of AI agent instructions that turn any capable LLM into a personal assistant. The deliverable is:
- Agent instruction files (markdown behavior specs the LLM reads)
- Steering files (rules and guardrails)
- Vault folder structure + file templates (Obsidian markdown)
- Config file schemas (6 markdown config files)
- One lightweight MCP server (thin Obsidian CLI wrapper)

The LLM IS the runtime. When we say "build," we mean writing agent instructions, steering files, templates, and config schemas — not application code.

## The fundamental question we need to answer first

Traditional software requirements describe APIs, database schemas, UI flows, error handling. None of that applies here. So what SHOULD requirements for an agentic assistant describe?

An LLM with good instructions can already do a LOT natively — summarize text, extract action items, draft emails, answer questions, reason about ambiguity. These are capabilities the AI already has. We don't need to "build" them. What we DO need to build is:
- The structure and rules that guide the AI (agent instructions, steering files)
- The vault structure it reads from and writes to (folders, templates, file formats)
- The config that personalizes it (projects, people, preferences)
- The conventions that make it consistent (provenance markers, date formats, review queue routing)

So a requirement for Myna should focus on what ISN'T native AI capability — the structure, rules, conventions, and guardrails that make the AI behave consistently and correctly for this specific use case. For native AI capabilities (summarize, extract, draft), the requirement only needs to specify WHAT to extract/summarize/draft and WHERE it goes — not HOW to do the extraction itself.

I want to explore this distinction with you. For each feature, we should be clear about:
1. What the AI handles natively (and we just need to tell it what we want)
2. What needs explicit structure (vault files, templates, formats, routing rules)
3. What needs explicit guardrails (safety rules, provenance markers, review queue criteria)

This directly affects how detailed each requirement needs to be and where we should spend our specification effort.

## What I want to work through with you

Let's think through these one at a time:

1. **What IS a requirement for an agentic system?** Given that the AI handles many things natively, what should our requirements actually specify? Where do we need detail and where is the AI naturally capable? Let's define the right level of abstraction.

2. **The requirement template.** Based on #1, build the template from scratch. What sections does each requirement need? Think about what's specific to an agentic system — not what a software requirements template traditionally includes.

3. **Requirement granularity — when to merge or split features.** The features in the requirements files were organized during brainstorming. Some should merge, some should stay separate. When do we need one requirement vs multiple? Guidance:
   - Merge when: one feature is the mechanism inside another (dedup is part of email processing, not standalone). Features describe sections of the same vault file. One feature is a sub-behavior triggered inside another. Features share the same trigger and can't be invoked independently. A feature is just a simple query over data another feature creates.
   - Keep separate when: different user prompts trigger them. Different user intents even if same domain. Different data flows even if related. A feature can be toggled independently. A feature is consumed by multiple other features (shared infrastructure).

4. **Collapse candidates.** Some features may not need any dedicated implementation because the LLM handles them natively with just good instructions + config. Example: "Help Me Say No" is really just "give the LLM communication style config and say: draft a professional decline." During requirements writing, sessions should flag these. How should we handle this in the template?

5. **Assumptions and open questions format.** Each session logs uncertainties to docs/assumptions/{domain}.md. Define the format so all 10 sessions produce consistent, reviewable output.

6. **A concrete example.** After we finalize the template, write one complete example requirement (pick a feature from email-and-messaging) so the 10 sessions know what "good" looks like.

Let's start with #1. Present your thinking, and we'll iterate through the rest. Don't rush — this template is the foundation that 10 autonomous sessions and the entire design and build phase depend on.
```

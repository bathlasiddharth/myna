# Phase 0 — Architecture & Foundations

Operational guide for Phase 0 of the Myna build pipeline. Read at the start of any P0 task. See `docs/roadmap.md` Phase 0 section and decisions D025, D030 for rationale.

---

## What Phase 0 is

The heaviest design phase in the pipeline. Produces the complete scaffolding every downstream phase depends on, across two dimensions.

**Architecture (agent layer)** — agent decomposition, routing model, steering-vs-prompt split, how features group into agents, per-agent role and scope. This is the top-down design that decides the shape of the runtime system.

**Data foundations (structure layer)** — vault folders, file templates, config schemas, provenance rules, conventions, MCP tool surface, cross-domain data flow. The scaffolding every agent reads from and writes to.

Both dimensions must be decided before any agent content can be written. Every agent depends on the architecture it belongs to AND the data structures it operates on.

**In scope:**
- Agent architecture (decomposition, scopes, routing, steering split)
- Feature-to-agent mapping for all 50+ approved features in `docs/requirements/`
- Cross-cutting agents if any (sentinel, critic, router, extractor)
- Complete vault folder structure
- File templates for every file type (project, person, meeting, daily note, review queue files, contributions log, drafts, parked items, system files)
- All 6 config file schemas (every field, required vs. optional)
- Provenance marker placement rules with canonical examples per entry type
- Date + source format with examples
- Review queue routing rules (three queues + criteria)
- Obsidian CLI MCP tool surface
- Cross-domain data flow map (concrete source-agent → destination-agent pairs)
- Cross-domain behavior coordination (what happens when agent A depends on state agent B manages and B hasn't run yet)
- Pattern catalog (recurring agentic patterns with worked examples)
- Feature toggle mechanism
- Reference agent selection (which agent will be built first in Phase 3)
- Lightweight structural check scripts (grep/shell lint — NOT automated behavioral tests)
- Abstract architecture → Kiro CLI mapping (v1 install target per D035)

**Out of scope:**
- Writing any agent content (Phase 3 and 5)
- Building the Claude Code build harness skills/subagents (Phase 2)
- Installation tooling (Phase 6)
- Manual testing plan (Phase 7)
- Open-source contribution model (deferred post-launch per D036)

## Why Phase 0 matters

Every downstream decision references Phase 0. The agent architecture is the single most consequential design decision in the project — it determines how features compose, how routing works, how steering is organized, and how autonomous Phase 5 operates.

Test Phase 0 output must pass: **"if Phase 5 autonomous Claude were given only the foundations, one unbuilt agent's feature assignment, and the Phase 2 SDLC, could it build that agent without further design input?"** If no, Phase 0 has a gap.

## Context files to read before any P0 task

1. `docs/vision.md` — what Myna is
2. `docs/decisions.md` — all 37+ settled decisions, especially D025–D037 (pipeline, autonomy, capture discipline, agent-first, testing deferral, install scope)
3. `docs/roadmap.md` — Project Goals, Build Approach, Phase 0 section
4. `docs/requirements/*` — all 10 domain feature files under `## Features` headings. These are the authoritative approved features (per D026, don't read any other source for features).
5. `docs/dev-journal.md` — 2026-04-04 entries on the restructure and ultrathink (local only, not in git)

## Phase-specific rules

1. **Never assume.** Ambiguity at Phase 0 cascades through every phase. Ask, don't guess.
2. **Flag gaps explicitly.** Every gap is a deliberate decision, not a paper-over default.
3. **Capture immediately (D029).** Corrections go to the right file before moving on.
4. **Log open questions** in `docs/open-questions.md`.
5. **Maintain the roadmap.** Mark tasks In Progress / Done as state changes.
6. **Record settled decisions.** New decisions go to `decisions.md` (D038 onward, newest first).
7. **Methodology as output.** Phase 0 artifacts will be reused by others building different agentic assistants. Prefer general framing where it doesn't sacrifice clarity.

## Tasks

### P0-T01 — Foundations inventory

Produce a complete inventory of what Phase 0 must produce, every item classified as:
- **[Settled]** — already decided in `decisions.md` or in approved requirements. Cite source.
- **[Derive]** — mechanically derivable from existing decisions/features. Explain the derivation.
- **[Gap]** — not yet decided. Phrase as a direct question for the user.

Output: `docs/foundations-inventory.md` (working file, input to P0-T03).

Done when every category is fully classified, no [Gap]s remain, user has approved.

### P0-T02 — Architecture design

Top-down design session with the user. Decide:
- Number of agents and their scopes
- Routing model (main agent dispatcher? native per-tool subagents? flat set with user-directed routing?)
- Steering file list (cross-cutting rules outside any single agent)
- Cross-cutting utility agents (sentinel, critic, extractor, router — if any)
- Feature-to-agent mapping (every approved feature assigned to one agent)
- How the abstract architecture maps to Kiro CLI (v1 install target)

Output: `docs/architecture.md` or an architecture section inside `docs/foundations.md`.

### P0-T03 — Write foundations.md

Turn the inventory and architecture decisions into the final `docs/foundations.md`. Organized for use, not just review. Every section cross-references its source decisions.

Output: `docs/foundations.md` — the single canonical scaffolding document.

### P0-T04 — Reference agent selection

Decide which agent will be built first in Phase 3. Criterion: the agent that exercises the most representative patterns AND is testable locally with Myna's own dev work as test data (per D027).

Output: decision entry in `decisions.md` (D038 or later).

### P0-T05 — User review of Phase 0 output

Heavy review. Everything downstream depends on this being right. Walk through foundations, architecture, feature-to-agent mapping with the user.

Done when user approves.

## End-of-session discipline

- Every correction captured immediately in the right file
- Roadmap reflects current task state
- New decisions in `decisions.md`
- Open questions in `open-questions.md`
- Session summary at the top of any work-in-progress file so the next session can resume cleanly

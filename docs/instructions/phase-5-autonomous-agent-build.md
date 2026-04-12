# Phase 5 — Autonomous Agent Build

Operational guide for Phase 5. Read at the start of any P5 task. See `docs/roadmap.md` Phase 5 section and decisions D028, D032.

---

## What Phase 5 is

Phase 5 builds all remaining Myna agents autonomously, one at a time, using the finalized Phase 4 recipe. The user is minimally involved — only for escalations and async batch summary review.

**In scope:**
- Apply `docs/instructions/build-agent.md` to each remaining agent in the architecture
- Run cross-agent structural lint (`docs/instructions/verify-agent.md`) after each agent is committed
- Capture any new learnings discovered during Phase 5 work in `build-agent.md` (per D029)
- Write batch summary per agent after completion for async user skim
- Escalate per `docs/instructions/escalation-rules.md` when tripwires fire
- Build the **installation script as the FINAL deliverable** — wait, no. Install is Phase 6 per D035. Phase 5 ends when all agents are built and lint passes.

**Out of scope:**
- Designing new agents or adding to the architecture (if that's needed, escalate)
- Building the install script (Phase 6 — user-involved, not autonomous per D035)
- Running behavioral tests (automated tests deferred per D033)

## Why Phase 5 matters

Phase 5 is where the bulk of Myna's content gets built. The methodology from Phases 0–4 is either validated or exposed as weak here. If the recipe works, Phase 5 produces consistent agents with minimal user attention. If the recipe is weak, Phase 5 either escalates constantly or drifts silently.

Per D028, Phase 5 targets roughly ~90% quality before Phase 7/post-ship user testing catches the rest. That ceiling is acceptable for an LLM-runtime system where manual review is prohibitively expensive at feature scale.

## Context files to read before any P5 task

1. `docs/design/foundations.md`
2. `docs/architecture.md`
3. `docs/instructions/build-agent.md` — PRIMARY operational guide, finalized in Phase 4
4. `docs/instructions/verify-agent.md` — structural lint to run after each agent
5. `docs/instructions/escalation-rules.md` — when to stop and ask
6. The reference agent from Phase 3 — pattern to imitate
7. Any previously completed Phase 5 agents — for cross-agent consistency
8. The target agent's feature assignments (from architecture)
9. `docs/decisions.md` — especially D028, D029, D033

## Phase-specific rules

1. **Follow the recipe. Do not improvise.** `build-agent.md` is the authoritative recipe from Phase 4. Deviations mean either a new learning (update the recipe) or a mistake (don't repeat).
2. **Escalate per tripwires.** Don't rationalize. If a tripwire fires, stop and ask. The discipline is what makes autonomy work.
3. **Cross-agent lint is mandatory after each agent.** Structural checks catch drift early. Not behavioral testing — just grep/script verification.
4. **Capture learnings as they happen (D029).** New patterns go into build-agent.md's Patterns section. New anti-patterns go into Anti-patterns. Don't save them for later.
5. **Per-agent batch summaries are not optional.** After each agent is complete, write a short batch summary for user async skim: what was built, what was tested, what passed lint, any escalations, any learnings captured.
6. **Iteration budget is 3.** If an agent fails 3 fix iterations on the same issue, escalate per escalation-rules.md.

## Tasks

Each P5 task is one agent. The within-task loop is driven by `build-agent.md` — once that recipe is final, per-task detail in this file is redundant.

### P5-T01 — Build Agent {name of second agent, order decided in Phase 0}

### P5-T02 — Build Agent {third agent}

### P5-T03 — {…}

### P5-TN — Build final agent

### P5-Lint — Final cross-agent lint pass

After all agents are committed, run full cross-agent structural lint. Verify:
- Every wiki-link resolves
- Every cross-agent data handoff has a matching reader
- Every cited decision exists
- Every file path matches foundations
- No agent writes to a vault location not defined in foundations
- No agent references a MCP capability not in the MCP tool surface

Fix any issues found. This concludes Phase 5.

## End-of-session discipline

- Any escalation is logged in `docs/escalations.md` with full context
- Any new learning is in `build-agent.md` or `verify-agent.md`
- Roadmap reflects which agents are done and which are in progress
- Batch summaries exist for all completed agents
- Cross-agent lint passes (after the full pass at the end)

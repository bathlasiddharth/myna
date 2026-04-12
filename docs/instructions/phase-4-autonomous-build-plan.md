# Phase 4 — Autonomous Build Plan

Operational guide for Phase 4. Read at the start of any P4 task. See `docs/roadmap.md` Phase 4 section and decisions D028, D032.

---

## What Phase 4 is

Phase 4 synthesizes the learnings from Phase 3 (building the reference agent) into a finalized recipe that Phase 5 autonomous Claude will follow for every remaining agent.

This phase exists because the details of HOW to autonomously build agents cannot be decided upfront — they depend on what actually worked during the reference build. Phase 4 is the point where we have the data and can commit to a concrete plan.

**In scope:**
- Finalize `docs/instructions/build-agent.md` — the authoritative recipe for building an agent
- Finalize `docs/instructions/verify-agent.md` — structural lint checks that run after each agent build (mechanical, not behavioral tests)
- Write `docs/instructions/escalation-rules.md` — explicit tripwires that force Phase 5 to stop and ask
- Run the **fresh-session methodology acceptance test**: spawn a fresh Claude session with only the methodology docs and have it build one small piece (not a full agent — a small test) to verify the docs are self-sufficient
- Make the Go/No-Go decision for Phase 5

**Out of scope:**
- Building any agents (Phase 5 does that)
- Running the reference build (Phase 3 already did)
- Creating new skills/subagents (Phase 2 already did; Phase 4 just refines rules)

## Why Phase 4 matters

Phase 4 is the critical gate between "we built one agent manually-ish" and "Claude builds the rest autonomously." If the recipe finalized here is weak, Phase 5 produces inconsistent work. If the recipe is too strict, Phase 5 escalates constantly.

This is also where we honestly assess whether the methodology is ready. If the fresh-session acceptance test fails, we go back and fix the docs before Phase 5 begins. No rushing past a failed acceptance test.

## Context files to read before any P4 task

1. `docs/design/foundations.md`
2. `docs/architecture.md`
3. `docs/instructions/phase-3-learnings.md` — the captured learnings from Phase 3
4. `docs/instructions/agent-build-sdlc-rules.md` — the SDLC rules as refined during Phase 3
5. The completed reference agent from Phase 3 (for pattern examples)
6. `docs/decisions.md` — especially D028 (autonomy model), D029 (capture discipline), D032 (this phase)
7. `docs/roadmap.md` — Phase 4 tasks

## Phase-specific rules

1. **No new invention.** Phase 4 synthesizes and codifies; it doesn't invent. Everything in the finalized recipe should be traceable to a learning from Phase 3 or a decision.
2. **Explicit over implicit.** Escalation rules are stated as concrete conditions. "Escalate when uncertain" is useless. "Escalate when foundations doesn't cover the case / two decisions contradict / 3 iterations failed / cross-agent write has no reader" is usable.
3. **Honest acceptance test.** If the fresh-session test fails, don't hand-wave. Fix the docs and retest. Phase 5 does not start until the acceptance test passes.
4. **Preserve the reference.** Don't retroactively rewrite the reference agent to match the recipe — the recipe should match the reference, not the reverse. Document it how it actually ended up.

## Tasks

### P4-T01 — Finalize `build-agent.md`

Synthesize Phase 3 learnings into the authoritative recipe. Structure:
- Step-by-step workflow: read context → draft → review → refine → iterate → lint → commit or escalate
- Patterns section: recurring patterns with "when you see X, apply Y" guidance
- Anti-patterns section: default instincts Claude's model has that are wrong for Myna
- Examples: cross-references to specific sections of the reference agent
- Invocation: how to start building an agent (which skill/subagent to invoke, which files to read first)

Output: `docs/instructions/build-agent.md`.

### P4-T02 — Finalize `verify-agent.md`

Mechanical structural checks that run after each autonomous agent build. Structure:
- List of deterministic checks (grep patterns, file existence, format match)
- How each check is run
- What failure means and how to diagnose
- NOT behavioral tests — just structural lint (conventions, cross-references, format compliance)

Output: `docs/instructions/verify-agent.md`.

### P4-T03 — Write `escalation-rules.md`

Explicit tripwires. Each has a condition and an action. Output: `docs/instructions/escalation-rules.md`.

### P4-T04 — Fresh-session methodology acceptance test

Spawn a fresh Claude Code session (no prior conversation context). Give it only:
- `docs/vision.md`
- `docs/decisions.md`
- `docs/design/foundations.md`
- `docs/architecture.md`
- `docs/instructions/build-agent.md`
- `docs/instructions/verify-agent.md`
- `docs/instructions/escalation-rules.md`
- The reference agent from Phase 3 as an example
- The feature assignment for one small task

Ask it to build that task (or a small variant). Observe: did it succeed without needing clarification? If yes → methodology is ready. If no → identify the gap, fix the docs, retest.

### P4-T05 — Go/No-Go decision

User reviews the fresh-session test result and the finalized recipe. Decides whether Phase 5 can start. No rushing.

## End-of-session discipline

- All three artifacts (build-agent.md, verify-agent.md, escalation-rules.md) exist and are complete
- Fresh-session test has been run; result documented
- Any gaps discovered during P4 are fixed in the appropriate file
- Go/No-Go decision logged
- Roadmap updated

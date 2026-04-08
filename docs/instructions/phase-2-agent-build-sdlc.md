# Phase 2 — Agent Build SDLC

Operational guide for Phase 2. Read at the start of any P2 task. See `docs/roadmap.md` Phase 2 section and decision D031.

---

## What Phase 2 is

Phase 2 builds the **build harness** — the Claude Code skills and subagents that automate the agent-building loop (write → review → refine → iterate). Phase 2 does NOT build Myna agents; it builds the tooling that will be used to build them in Phase 3 and 5.

**In scope:**
- Create Claude Code skills and/or subagents that implement a structured agent-build workflow:
  - **Writer** — given a feature list, foundations, and an agent's assigned scope, drafts the agent's prompt content
  - **Reviewer** — critiques a draft against foundations, architecture, and feature requirements. Operates from fresh context.
  - **Refiner** — takes review feedback and produces an updated draft
  - **Iterator / orchestrator** — runs the write → review → refine loop for 3–4 rounds per agent
- Initial SDLC rules: what the writer reads, what the reviewer evaluates, when to stop iterating, when to escalate
- Learning capture mechanism (placeholder — will be refined during Phase 3 and finalized in Phase 4)
- Any Claude Code configuration (`.claude/skills/`, `.claude/agents/`, etc.) needed to make the harness invocable

**Out of scope:**
- Building any actual Myna agents (Phase 3 uses this harness to build the reference; Phase 5 uses it for the rest)
- Automated behavioral testing (deferred post-v1 per D033)
- Final SDLC rules (those get finalized in Phase 4 after we learn from Phase 3)

## Why Phase 2 matters

Phase 2 is the only phase where we build tool infrastructure for the build itself. Per the feedback captured in memory, tools are built only when they serve a specific mechanism — and the automated build loop is that mechanism. Without Phase 2, Phase 5 has no way to operate autonomously; with it, Phase 5 is just "run the harness on the remaining agents."

**Important distinction:** the skills/subagents created in Phase 2 are Claude Code-specific build infrastructure. They are NOT part of Myna's runtime. They're the scaffolding around Myna's construction, not Myna itself.

The test Phase 2 output must pass: **"can the Writer+Reviewer+Refiner loop produce at least a first-pass draft of an agent's content given foundations + feature assignments, in a way that's worth iterating on in Phase 3?"** Phase 3 will refine these based on real use.

## Context files to read before any P2 task

1. `docs/foundations.md` — what agents need to respect
2. `docs/architecture.md` — what agents exist and their scopes
3. `docs/roadmap.md` — Phase 2 tasks
4. `docs/decisions.md` — especially D028, D029, D031
5. Any Claude Code documentation on skills/subagents (for the specific mechanism being used)

## Phase-specific rules

1. **The harness is Claude Code-specific; Myna's output is not.** Do not confuse the two. Anything Phase 2 creates lives in `.claude/` or the equivalent harness location, NOT in the Myna deliverable tree.
2. **Keep rules minimal.** Initial SDLC rules should be enough to start iterating, not a final specification. Final rules emerge in Phase 4.
3. **Writer, Reviewer, Refiner are distinct components.** Separation matters — the Reviewer should operate from fresh context so it doesn't share the Writer's contextual bias.
4. **Iteration budget matters.** 3–4 rounds is the target. If a draft isn't converging after that many rounds, escalate (this tripwire becomes final in Phase 4).
5. **Capture observations during Phase 2 build.** How the skills work, what's awkward, what's over/under-specified — all feeds into Phase 4's recipe finalization.

## Tasks

### P2-T01 — Define initial SDLC rules

Draft a short rules document explaining:
- What inputs the Writer receives (feature list, foundations, architecture, existing steering)
- What output format the Writer produces
- What criteria the Reviewer evaluates against
- What feedback format the Refiner accepts
- When iteration stops (converged? fixed iteration count?)
- When to escalate (foundations gap, review disagreement, loop not converging)

Output: `docs/instructions/agent-build-sdlc-rules.md` (or similar name decided during P2).

### P2-T02 — Create the Writer skill/subagent

A Claude Code skill or subagent that generates an agent prompt draft from inputs.

### P2-T03 — Create the Reviewer skill/subagent

A Claude Code skill or subagent with fresh context that critiques a draft against foundations + architecture.

### P2-T04 — Create the Refiner skill/subagent

A Claude Code skill or subagent that takes review feedback and produces an updated draft.

### P2-T05 — Create the Iterator/Orchestrator

The top-level harness that runs the Writer → Reviewer → Refiner loop and reports results. Can be a skill, subagent, or coordinated invocation.

### P2-T06 — Smoke test the harness

Run the harness on a minimal example (not a real Myna agent — a toy test case) to verify the plumbing works before committing to Phase 3.

## End-of-session discipline

- All Phase 2 skills/subagents exist and are invocable
- Initial SDLC rules documented
- Observations from the smoke test captured (for Phase 4 refinement)
- Roadmap updated

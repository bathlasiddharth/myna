# Myna — Roadmap

Living task list. Updated by Claude as work progresses.

---

## Project Goals

This project has two first-class outputs:

1. **Myna** — a working local-first AI assistant for tech professionals.
2. **A methodology for having Claude autonomously build an agentic system end-to-end** — from feature ideas through architecture, foundations, reference agent, autonomous build, install, and ship, with concentrated human effort at design/synthesis points and minimal oversight during the autonomous middle.

The methodology lives across `docs/foundations.md`, `docs/architecture.md`, the phase operational guides in `docs/instructions/`, `docs/decisions.md` (D025–D037), and the recipes produced during Phases 2–4 (`build-agent.md`, `verify-agent.md`, `escalation-rules.md`). It is intended to be reusable for building other agentic systems on any capable LLM.

Both Myna and the methodology ship. Process artifacts in this repo are treated as deliverables, not scaffolding. When updating a process artifact, the test is: "would this still make sense to someone using this playbook on a completely different agentic assistant?"

---

## Build Approach

Myna is built via a **9-phase agent-first pipeline** (D030). Rationale and tradeoffs are settled across D025–D037.

User involvement is concentrated at design phases (0, 4), user-involved manual phases (6, 7), and at Ship (8). Claude works autonomously in Phase 5. Other phases are mechanical (1) or moderately interactive (2, 3).

| Phase | Goal | User involvement |
|---|---|---|
| 0 Architecture & Foundations | Design agents, routing, steering, configs, vault, foundations, pattern catalog, reference agent selection | Heavy |
| 1 Skeletons | Mechanical scaffolding — create empty containers matching Phase 0 output | Light |
| 2 Agent Build SDLC | Claude Code build harness — Writer/Reviewer/Refiner/Iterator skills + initial rules | Moderate |
| 3 Reference Agent | Build one agent end-to-end using the Phase 2 SDLC; iterate the SDLC; capture learnings | Moderate |
| 4 Autonomous Build Plan | Synthesize Phase 3 learnings; finalize `build-agent.md`, `verify-agent.md`, `escalation-rules.md`; run fresh-session acceptance test | Heavy |
| 5 Autonomous Agent Build | Build all remaining agents autonomously + cross-agent structural lint after each | Minimal (escalations only) |
| 6 Installation Script | Build Kiro CLI install tooling (D035); user-involved, not autonomous | Heavy |
| 7 Manual Testing Plan | Design the manual testing plan document (D033); plan only — user executes post-ship | Heavy |
| 8 Ship | README, setup guide, v1.0 tag. No open-source contribution model (D036) | Moderate |

**Done = Phase 8 complete** (D037). Real-world testing, bug fixing, open-source contribution model, and install support for other AI tools are all post-ship activities outside this pipeline.

**Reusability:** Phase 5 in isolation is the recipe for adding a new agent to an existing system. Foundations, architecture, the finalized recipe, and the reference agent are inherited from the initial build; the Phase 5 loop runs for the new work.

**Automated testing:** deliberately deferred (D033). Phase 5 uses only structural lint (grep/shell checks), not behavioral tests. The manual testing plan (Phase 7) and post-ship real-world use are the behavioral quality mechanisms for v1. Post-v1 work may design automated testing based on what real usage teaches.

---

## Completed

> Historical record. Original task IDs preserved.

| Task | Description | Status |
|---|---|---|
| M1-T01 | Write `docs/vision.md` | Done |
| M1-T02 | Set up `docs/decisions.md` | Done |
| M1-T03 | Set up `docs/open-questions.md` | Done |
| M1-T04 | Set up CLAUDE.md | Done |
| M1-T05 | Create domain requirement skeletons | Done |
| M1-T06 | Create `docs/features/cross-domain.md` | Done |
| M1-T07 | Create `docs/features/non-functional.md` | Done |
| M1-T08 | Create `docs/design-deliverables.md` | Done |
| M1-T09 | Claude refines feature lists for all domains | Done |
| M1-T10 | User reviews refined feature lists | Done |
| M1-T10b | Finalize build approach from first principles (evolved into D025–D037 restructure across two ultrathink sessions) | Done |
| — | Decisions D001–D029 captured during prior work | Done |
| — | Decisions D030–D037 capturing the 9-phase agent-first pipeline | Done |

---

## Task Tracker

### Phase 0 — Architecture & Foundations

> **Operational guide:** `docs/instructions/phase-0-architecture-foundations.md` — read before any P0 task.
>
> **Goal:** Complete scaffolding — agent architecture + data foundations — that every downstream phase depends on.

| Task | Description | Status |
|---|---|---|
| P0-T01 | Foundations inventory: classify every item as [Settled]/[Derive]/[Gap] | Not started |
| P0-T02 | Architecture design: agents, routing, steering, feature-to-agent mapping, Kiro CLI mapping | Not started |
| P0-T03 | Write `docs/foundations.md` and `docs/architecture.md` | Not started |
| P0-T04 | Reference agent selection | Not started |
| P0-T05 | User review of all Phase 0 output | Not started |

### Phase 1 — Skeletons

> **Operational guide:** `docs/instructions/phase-1-skeletons.md`
>
> **Goal:** Mechanical scaffolding — empty containers matching foundations.

| Task | Description | Status |
|---|---|---|
| P1-T01 | Create vault folder structure | Not started |
| P1-T02 | Create file templates for every file type | Not started |
| P1-T03 | Create 6 config files with schemas | Not started |
| P1-T04 | Create agent bootstrap files (one per agent) | Not started |
| P1-T05 | Create steering file skeletons | Not started |
| P1-T06 | Obsidian CLI MCP wrapper stub | Not started |
| P1-T07 | Verify skeleton matches foundations | Not started |

### Phase 2 — Agent Build SDLC

> **Operational guide:** `docs/instructions/phase-2-agent-build-sdlc.md`
>
> **Goal:** Claude Code build harness — Writer/Reviewer/Refiner/Iterator skills that automate the agent-build loop.

| Task | Description | Status |
|---|---|---|
| P2-T01 | Define initial SDLC rules | Not started |
| P2-T02 | Create Writer skill/subagent | Not started |
| P2-T03 | Create Reviewer skill/subagent (fresh context) | Not started |
| P2-T04 | Create Refiner skill/subagent | Not started |
| P2-T05 | Create Iterator/Orchestrator | Not started |
| P2-T06 | Smoke test the harness on a toy example | Not started |

### Phase 3 — Reference Agent

> **Operational guide:** `docs/instructions/phase-3-reference-agent.md`
>
> **Goal:** Build one reference agent end-to-end using the Phase 2 SDLC. Iterate the SDLC as gaps surface. Capture learnings continuously.

| Task | Description | Status |
|---|---|---|
| P3-T01 | First pass: run SDLC on reference agent | Not started |
| P3-T02 | Iterate on the SDLC as gaps surface | Not started |
| P3-T03 | Test the reference agent against Myna's own dev work | Not started |
| P3-T04 | Capture learnings continuously | Not started |
| P3-T05 | User review of reference agent | Not started |

### Phase 4 — Autonomous Build Plan

> **Operational guide:** `docs/instructions/phase-4-autonomous-build-plan.md`
>
> **Goal:** Synthesize Phase 3 learnings into the finalized recipe. Run fresh-session acceptance test. Go/No-Go for Phase 5.

| Task | Description | Status |
|---|---|---|
| P4-T01 | Finalize `docs/instructions/build-agent.md` | Not started |
| P4-T02 | Finalize `docs/instructions/verify-agent.md` | Not started |
| P4-T03 | Write `docs/instructions/escalation-rules.md` | Not started |
| P4-T04 | Fresh-session methodology acceptance test | Not started |
| P4-T05 | Go/No-Go decision for Phase 5 | Not started |

### Phase 5 — Autonomous Agent Build

> **Operational guide:** `docs/instructions/phase-5-autonomous-agent-build.md`
>
> **Goal:** Build all remaining agents autonomously, one per session, with cross-agent structural lint after each. Minimal user involvement.

| Task | Description | Status |
|---|---|---|
| P5-T01..TN | Build each remaining agent (count and ordering decided in Phase 0) | Not started |
| P5-Lint | Final cross-agent structural lint pass | Not started |

### Phase 6 — Installation Script

> **Operational guide:** `docs/instructions/phase-6-installation-script.md`
>
> **Goal:** Kiro CLI-targeted install tooling (v1 scope per D035). User-involved, not autonomous.

| Task | Description | Status |
|---|---|---|
| P6-T01 | Design the Kiro CLI install flow | Not started |
| P6-T02 | Write the install script | Not started |
| P6-T03 | Test on a clean environment | Not started |
| P6-T04 | Document install flow | Not started |
| P6-T05 | User final approval | Not started |

### Phase 7 — Manual Testing Plan

> **Operational guide:** `docs/instructions/phase-7-manual-testing-plan.md`
>
> **Goal:** Design a manual testing plan document. No test execution in this phase — execution is a post-ship user activity (D033, D037).

| Task | Description | Status |
|---|---|---|
| P7-T01 | Inventory scenarios to cover | Not started |
| P7-T02 | Draft expected behaviors per scenario | Not started |
| P7-T03 | Design reporting format | Not started |
| P7-T04 | User review and refinement | Not started |
| P7-T05 | Write final testing plan document | Not started |

### Phase 8 — Ship

> **Operational guide:** `docs/instructions/phase-8-ship.md`
>
> **Goal:** Public v1.0 release. Open-source contribution model is NOT in scope (deferred post-launch per D036).

| Task | Description | Status |
|---|---|---|
| P8-T01 | README polish | Not started |
| P8-T02 | Setup guide | Not started |
| P8-T03 | Final consistency pass | Not started |
| P8-T04 | v1.0 release tag and notes | Not started |
| P8-T05 | Declare done | Not started |

---

## Backlog

| Task | Description | Status |
|---|---|---|
| B001 | Scan-and-suggest setup mode (Q008) | Backlog |
| B002 | Local web UI for review queue (Q006) | Backlog |
| B003 | P1: Automation via headless agents | Backlog |
| B004 | `/build-feature` pipeline (feature → requirements → design → build → present) | Backlog |
| B005 | `/development` pipeline (implement → test → review → fix → re-test loop) | Backlog |
| B006 | Feature toggles — all agent instructions check toggles before offering features | P0 |
| B007 | Default profiles by role (manager, PM, IC) that pre-configure feature toggles | Backlog |
| B008 | Customizable output templates for briefings, status summaries, narratives | Backlog |
| B009 | Automated document review with doc-type-specific criteria | Backlog |
| B010 | Automated testing infrastructure (designed post-v1 from real-usage experience) | Post-launch |
| B011 | Install tooling for Claude Code, Gemini, Codex (beyond Kiro CLI v1 scope) | Post-launch |
| B012 | Open-source contribution model and CONTRIBUTING.md | Post-launch |
| B013 | User acceptance testing and bug fixing from real-world use | Post-launch |
| B014 | Configure skill — interactive setup wizard, natural language config management, communication style interview (D043) | Post-launch |
| B015 | People-insights skill — 1:1 pattern analysis, performance narratives, team health tracking, attention/feedback gap detection, retro processing | Post-launch |
| B016 | Pre-Read Preparation — "prep me for this doc" briefing for document review | Post-launch |
| B017 | Brief freshness note — warn when vault data appears stale | Post-launch |
| B018 | Draft lifecycle tracking — frontmatter states, "I sent the MBR" transitions | Post-launch |

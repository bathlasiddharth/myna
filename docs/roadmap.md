# Myna — Roadmap

Living task list. Updated by Claude as work progresses.

---

## Project Goals

This project has two first-class outputs:

1. **Myna** — a working local-first AI assistant for tech professionals.
2. **A methodology for having Claude autonomously build an agentic system end-to-end** — from feature ideas through architecture, foundations, and autonomous build, with concentrated human effort at design points and minimal oversight during the build.

The methodology lives across `docs/design/foundations.md`, `docs/architecture.md`, `docs/instructions/autonomous-build-plan.md`, `docs/decisions.md` (especially D025–D044), and `docs/journal/dev-journal.md`. It is intended to be reusable for building other agentic systems on any capable LLM.

Both Myna and the methodology ship. Process artifacts in this repo are treated as deliverables, not scaffolding. When updating a process artifact, the test is: "would this still make sense to someone using this playbook on a completely different agentic assistant?"

---

## Build Approach

Myna is built via a **4-phase pipeline**: Design, Build, Install, Ship (D044). The original 9-phase plan (D030) was collapsed after Phase 0 produced architecture and foundations thorough enough to skip the incremental SDLC/reference-agent/build-plan phases and go straight to autonomous building.

| Phase | Goal | User involvement |
|---|---|---|
| 0 Design | Architecture, foundations, features, decisions, build plan | Heavy |
| 1 Build | Autonomous build of all skills, agent, MCP server, steering files | Minimal (escalations only) |
| 2 Install | Shell script to wire Myna into Claude Code (D045, D047); user-involved | Heavy |
| 3 Ship | README, setup guide, testing plan, v1.0 tag | Moderate |

**Done = Phase 3 complete** (D037). Real-world testing, bug fixing, open-source contribution model, and install support for AI tools beyond Claude Code are all post-ship activities outside this pipeline.

**How Phase 1 works:** A Claude orchestrator session reads `docs/instructions/autonomous-build-plan.md` and spawns subagents — each subagent builds 1-3 components with 3 self-review rounds (coverage, quality, consistency). The orchestrator does lightweight checks between subagents and re-spawns on failure. Full details in the build plan.

**Automated testing:** deliberately deferred (D033). The build uses only structural checks, not behavioral tests. A manual testing plan (Phase 3) and post-ship real-world use are the behavioral quality mechanisms for v1.

---

## Completed

> Historical record. Original task IDs preserved.

| Task | Description | Status |
|---|---|---|
| M1-T01 | Write `docs/vision.md` | Done |
| M1-T02 | Set up `docs/decisions.md` | Done |
| M1-T03 | Set up `docs/open-questions.md` | Done |
| M1-T04 | Set up CLAUDE.md | Done |
| M1-T05 | Create domain feature skeletons | Done |
| M1-T06 | Create `docs/features/cross-domain.md` | Done |
| M1-T07 | Create `docs/features/non-functional.md` | Done |
| M1-T08 | Create `docs/design/design-deliverables.md` | Done |
| M1-T09 | Claude refines feature lists for all domains | Done |
| M1-T10 | User reviews refined feature lists | Done |
| M1-T10b | Finalize build approach from first principles (evolved into D025–D037, then D044 restructure) | Done |
| — | Decisions D001–D029 captured during prior work | Done |
| — | Decisions D030–D037 capturing the original 9-phase pipeline | Done |
| — | Decisions D038–D043 captured during Phase 0 | Done |

---

## Task Tracker

### Phase 0 — Design

> **Goal:** Architecture, foundations, features, and autonomous build plan.

| Task | Description | Status |
|---|---|---|
| P0-T01 | Write `docs/architecture.md` and `docs/design/foundations.md` | Done |
| P0-T02 | User review and iterate on architecture + foundations | Done |
| P0-T03 | Write `docs/instructions/autonomous-build-plan.md` | Done |
| P0-T04 | Record D044, update roadmap | Done |

### Phase 1 — Build (Autonomous)

> **Operational guide:** `docs/instructions/autonomous-build-plan.md`
>
> **Goal:** Build all skills, steering files, main agent, and MCP server autonomously. Claude orchestrator spawns subagents per the build plan.

| Task | Description | Status |
|---|---|---|
| P1-T01 | Foundations revision | Done |
| P1-T02 | MCP server (Obsidian CLI wrapper) | Done |
| P1-T03 | Skill: capture | Done |
| P1-T04 | Skills: sync, wrap-up | Done |
| P1-T05 | Skills: triage, process | Done |
| P1-T06 | Skills: process-meeting, prep-meeting | Done |
| P1-T07 | Skill: brief | Done |
| P1-T08 | Skills: draft, draft-replies | Done |
| P1-T09 | Skill: calendar | Done |
| P1-T10 | Skills: review, self-track, park | Done |
| P1-T11 | Steering files (safety, conventions, output, system) | Done |
| P1-T12 | Main agent | Done |
| P1-T13 | Cross-skill audit | Done |

### Phase 2 — Install (Native Claude Code Skills Rebuild)

> **Execution prompts:** `docs/prompts/p0-update-architecture.md` through `docs/prompts/p3-main-agent-and-docs.md`
> **Overview:** `docs/prompts/skill-rebuild-overview.md`
>
> **Goal:** Rebuild Myna's entire skill system to use Claude Code's native skills mechanism. 24 feature skills + 6 steering skills as `SKILL.md` files. Rewrite main agent, update install script, update all supporting docs. No MCP server for vault ops — pure markdown with built-in tools.

| Task | Description | Status |
|---|---|---|
| P2-T01 | Design the Claude Code install flow | Done |
| P2-T02 | Write the install script (initial version) | Done |
| P2-T04 | Document install flow | Done |
| P2-T10 | P0: Update architecture.md + foundations.md for 24 native skills | Done |
| P2-T11 | P0.5: Remove Obsidian MCP from architecture, add vault-ops steering | Done |
| P2-T12 | P1: Write 6 steering skills | Done |
| P2-T13 | P2: Write 24 feature skills (4 parallel subagents) | Done |
| P2-T14 | P3: Rewrite main.md + update install.sh + all supporting docs | Done |
| P2-T15 | Test on a clean environment | Not started |
| P2-T16 | User final approval | Not started |
| P2-T17 | P4: Update review commands + lint script for native skills | Not started |

### Phase 3 — Ship

> **Goal:** Public v1.0 release. Manual testing plan + README + setup guide.

| Task | Description | Status |
|---|---|---|
| P3-T01 | Write manual testing plan | Not started |
| P3-T02 | README polish | Not started |
| P3-T03 | Setup guide | Not started |
| P3-T04 | Final consistency pass | Not started |
| P3-T05 | v1.0 release tag and notes | Not started |
| P3-T06 | Declare done | Not started |

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
| B011 | Install tooling for Gemini, Codex, and other AI tools (beyond Claude Code v1 scope) | Post-launch |
| B012 | Open-source contribution model and CONTRIBUTING.md | Post-launch |
| B013 | User acceptance testing and bug fixing from real-world use | Post-launch |
| B014 | Configure skill — interactive setup wizard, natural language config management, communication style interview (D043) | Post-launch |
| B015 | People-insights skill — 1:1 pattern analysis, performance narratives, team health tracking, attention/feedback gap detection, retro processing | Post-launch |
| B016 | Pre-Read Preparation — "prep me for this doc" briefing for document review | Post-launch |
| B017 | Brief freshness note — warn when vault data appears stale | Post-launch |
| B018 | Draft lifecycle tracking — frontmatter states, "I sent the MBR" transitions | Post-launch |
| B019 | `update` command — fetch latest repo and re-run install to refresh runtime artifacts (D049) | Backlog |
| B020 | `--uninstall` flag — read `~/.myna/install-manifest.json` and remove agent file, `~/.myna/`, and MCP registration (D049) | Backlog |

# Myna — Project Instructions

## What is this project?

Myna is a local-first personal assistant for tech professionals. It's a set of AI agents that manage emails, Slack, meetings, projects, tasks, and people — drafting but never sending, organizing but never deciding. All data lives in an Obsidian vault as plain markdown.

**This project has two first-class outputs, not one:**

1. **Myna itself** — the working assistant.
2. **A methodology for having Claude autonomously build an agentic system end-to-end** — from feature ideas through foundations, requirements, build, test, and fix, with concentrated human effort upfront and minimal oversight during the main build. The methodology lives in D025–D029, `docs/foundations.md`, `docs/instructions/*`, and the capture discipline. Intended to be reusable for building other agentic assistants on any capable LLM.

Treat process artifacts (roadmap, decisions, foundations, instructions/\*, dev-journal) with the same care as product artifacts. Both ship. When updating any process artifact, ask: "would this still make sense to someone using this playbook to build a different agentic assistant?"

**Status:** Idea refinement and requirements phase. Not yet in implementation.

## Key Documents

| File | Purpose |
|---|---|
| `docs/vision.md` | North star |
| `docs/decisions.md` | Settled decisions — do not re-debate |
| `docs/open-questions.md` | Unresolved questions — add here if you surface new ones |
| `docs/roadmap.md` | Living task list, phase structure, backlog |
| `docs/dev-journal.md` | Running log; see its header for entry triggers and format |
| `docs/instructions/phase-{N}-{name}.md` | Operational guide for each build phase |

Approved features for every domain live in `docs/requirements/{domain}.md` under the `## Features` section. This is the only authoritative source for what's being built.

## Starting a Task

When the user says "start P{X}-T{Y}", "start phase N", "begin {task}", or similar task-kickoff phrasing:

1. Look up the task in `docs/roadmap.md`.
2. Read the phase operational guide at `docs/instructions/phase-{N}-{name}.md` — it contains the context reading list, phase rules, and per-task details. This is authoritative — do not improvise.
3. Follow the guide's instructions from there.

If the phase operational guide doesn't exist, stop and tell the user. Do not invent a reading list or rules on the fly.

## Development Journal

`docs/dev-journal.md` is raw material for a post-launch article. Write an entry any time something interesting happens during a session — decisions, surprises, user corrections, patterns, mistakes, unexpected ideas. Err on the side of too many entries; we'll filter later. Full list of triggers and the entry format: see the header of `dev-journal.md`.

## Learning-Capture Discipline (D029)

When the user corrects your direction or you discover a non-obvious pattern during build work, write it to the appropriate file **immediately**, not at the end of the session. Default target: `docs/instructions/build-feature.md`. Structural learnings → `docs/foundations.md`. Narrative → `docs/dev-journal.md`. Full routing table and rationale: D029.

**Test:** "If a fresh Claude session had only these files, would it succeed?" If no, the docs are incomplete — fix the docs, not the conversation.

## Git Conventions

- **Never auto-commit.** Only commit when the user explicitly asks.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `ci:`, `build:`.
- Keep commits atomic — one logical change per commit.
- Commit messages describe what was accomplished, not which files changed. Subject: lead with the most important change in plain language. Body: explain what was done and why — the decisions made, problems solved — not a list of edits.
- **Never add Co-Authored-By lines.**

## Ground Rules

1. **Vision is authoritative.** If a requirement contradicts `docs/vision.md`, vision wins.
2. **Decisions are settled.** Don't re-open items in `docs/decisions.md` unless the user explicitly asks.
3. **Add open questions.** If you surface a question not answered by existing docs, add it to `docs/open-questions.md`.
4. **Add decisions.** If the user settles a question during your conversation, add it to `docs/decisions.md`.
5. **AI model agnostic.** Never assume a specific AI provider. Myna must work with Claude, Gemini, Codex, Kiro CLI, etc.
6. **Draft, never send.** Myna never sends emails, posts messages, or takes external actions (except personal calendar events with no attendees).

## Phase-Specific Instructions

Build pipeline restructured on 2026-04-05 to a 9-phase agent-first structure — see D025 and D030–D037 and `docs/roadmap.md`. Every phase has an operational guide at `docs/instructions/phase-{N}-{name}.md` (read via the Starting a Task protocol above).

Artifact ownership across phases:

| Artifact | Populated in phase | Purpose |
|---|---|---|
| `docs/foundations.md` + `docs/architecture.md` | 0 | Complete scaffolding: agents, routing, steering, data structures, patterns, feature-to-agent mapping |
| vault folders, templates, config files, agent bootstraps, steering stubs, MCP wrapper stub | 1 | Empty but structured containers |
| `.claude/` skills/subagents (Writer/Reviewer/Refiner/Iterator) | 2 | Claude Code build harness (not part of Myna runtime) |
| `docs/instructions/agent-build-sdlc-rules.md` | 2 | Initial rules for the build harness |
| Reference agent content + captured learnings | 3 | One agent fully built; learnings feed Phase 4 |
| `docs/instructions/build-agent.md` | 4 | Finalized recipe for building an agent |
| `docs/instructions/verify-agent.md` | 4 | Structural lint checks (NOT behavioral tests) |
| `docs/instructions/escalation-rules.md` | 4 | Tripwires for stop-and-ask vs. proceed |
| All remaining agents | 5 | Built autonomously using the Phase 4 recipe |
| Install script (Kiro CLI) | 6 | Runnable installer; v1 targets Kiro CLI only per D035 |
| `docs/testing-plan.md` | 7 | Manual testing plan (user executes post-ship) |
| README, setup guide, v1.0 tag | 8 | Public release |

**Automated behavioral testing is NOT in the pipeline** (deferred per D033). Structural lint exists but is not testing. **Open-source contribution model is NOT in the pipeline** (deferred post-launch per D036). **Done = Phase 8 complete** (D037); real-world testing and bug fixing are post-ship activities outside the pipeline.

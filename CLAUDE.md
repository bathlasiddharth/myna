# Myna — Project Instructions

## What is this project?

Myna is a local-first Chief of Staff for tech professionals. It's a set of AI agents that manage emails, Slack, meetings, projects, tasks, and people — drafting but never sending, organizing but never deciding. All data lives in an Obsidian vault as plain markdown.

**This project has two first-class outputs, not one:**

1. **Myna itself** — the working assistant.
2. **A methodology for having Claude autonomously build an agentic system end-to-end** — from feature ideas through architecture, foundations, and autonomous build, with concentrated human effort at design points and minimal oversight during the build. The methodology lives in `docs/design/foundations.md`, `docs/architecture.md`, `docs/instructions/autonomous-build-plan.md`, and `docs/decisions.md`. Intended to be reusable for building other agentic assistants on any capable LLM.

Treat process artifacts (roadmap, decisions, foundations, instructions/\*, dev-journal) with the same care as product artifacts. Both ship. When updating any process artifact, ask: "would this still make sense to someone using this playbook to build a different agentic assistant?"

**Status:** Phase 1 (Build) complete. Ready for Phase 2 (Install) targeting Claude Code.

## Key Documents

| File | Purpose |
|---|---|
| `docs/vision.md` | North star |
| `docs/decisions.md` | Settled decisions — do not re-debate |
| `docs/open-questions.md` | Unresolved questions — add here if you surface new ones |
| `docs/roadmap.md` | Living task list, phase structure, backlog |
| `docs/journal/dev-journal.md` | Running log; see its header for entry triggers and format |
| `docs/instructions/autonomous-build-plan.md` | Recipe for the autonomous build phase |

Approved features for every domain live in `docs/features/{domain}.md` under the `## Features` section. This is the only authoritative source for what's being built.

## Starting a Task

When the user says "start P{X}-T{Y}", "start phase N", "begin {task}", or similar task-kickoff phrasing:

1. Look up the task in `docs/roadmap.md`.
2. For Phase 1 (Build): read `docs/instructions/autonomous-build-plan.md` — it contains the complete build recipe. For other phases: read the phase operational guide if one exists.
3. Follow the guide's instructions from there.

Do not invent a reading list or rules on the fly.

## Development Journal

`docs/journal/dev-journal.md` is raw material for a post-launch article. Write an entry any time something interesting happens during a session — decisions, surprises, user corrections, patterns, mistakes, unexpected ideas. Err on the side of too many entries; we'll filter later. Full list of triggers and the entry format: see the header of `docs/journal/dev-journal.md`.

## Learning-Capture Discipline (D029)

When the user corrects your direction or you discover a non-obvious pattern during build work, write it to the appropriate file **immediately**, not at the end of the session. Structural learnings → `docs/design/foundations.md`. Build recipe learnings → `docs/instructions/autonomous-build-plan.md`. Narrative → `docs/journal/dev-journal.md`. Rationale: D029.

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
5. **Claude-first, not Claude-only (D046).** Myna v1 targets Claude Code. Agent instructions can reference Claude Code capabilities directly. Content stays plain markdown — inherently readable by any LLM — but we don't architect for other runtimes upfront.
6. **Draft, never send.** Myna never sends emails, posts messages, or takes external actions (except personal calendar events with no attendees).

## Phase-Specific Instructions

Build pipeline is a **4-phase structure** (D044): Design (0), Build (1), Install (2), Ship (3). See `docs/roadmap.md`.

**Claude-first design (D046, D050).** All agent artifacts — 24 feature skills, 6 steering skills, main agent — are plain markdown under `agents/`. The install step (Phase 2) copies skills to `~/.claude/skills/`, generates the agent file at `~/.claude/agents/myna.md`, and creates the vault structure. No MCP server — vault operations use Claude Code's built-in tools. See `docs/architecture.md` §11 for how this works.

| Artifact | Phase | Purpose |
|---|---|---|
| `docs/design/foundations.md` + `docs/architecture.md` | 0 Design | Architecture, data layer, patterns, feature-to-skill mapping |
| `docs/instructions/autonomous-build-plan.md` | 0 Design | Recipe for autonomous build |
| `agents/skills/myna-*/SKILL.md` (24 feature skills) | 2 Install | Native Claude Code skill files |
| `agents/skills/myna-steering-*/SKILL.md` (6 steering skills) | 2 Install | Cross-cutting rules as preloaded skills |
| `agents/main.md` | 2 Install | Main agent prompt |
| Install script | 2 Install | Copies skills to `~/.claude/skills/`; generates agent file; creates vault structure |
| README, setup guide, testing plan, v1.0 tag | 3 Ship | Public release |

**Automated behavioral testing is NOT in the pipeline** (deferred per D033). **Open-source contribution model is NOT in the pipeline** (deferred post-launch per D036). **Done = Phase 3 complete** (D037); real-world testing and bug fixing are post-ship activities outside the pipeline.

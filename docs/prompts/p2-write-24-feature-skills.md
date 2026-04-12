# P2: Write 24 Feature Skills

## Setup

**Model:** Opus | **Effort:** High
**Subagents:** Sonnet (set `model: "sonnet"` when spawning)

## Quality expectations

This is a long-running session building the backbone of Myna — 24 skills that determine whether the product works. Do not rush. Do not speed up through later skills. Skill #24 gets the same effort as skill #1. Reviews must be substantive — every round must find at least one improvement.

## What to do

1. Read `docs/instructions/autonomous-build-plan.md` — this is your complete recipe. Follow it.
2. Read `docs/roadmap.md` — check Phase 2 task status.
3. Read `CLAUDE.md` for project conventions (especially git: `feat(skills):` prefix, one commit per skill).
4. Execute: spawn 4 parallel subagents (one per batch), wait for completion, run cross-skill review.

## Key files

| File | Why |
|---|---|
| `docs/instructions/autonomous-build-plan.md` | The build recipe — read FIRST |
| `docs/architecture.md` | Skill inventory, vault structure, routing |
| `docs/design/foundations.md` | Templates, config schemas, vault patterns |
| `docs/features/*.md` | Feature details per domain — each batch reads specific files |

## If you hit limits

Commit whatever batch is complete, update roadmap, push. The next session resumes from the first incomplete batch.

Start now. Read the build plan first.

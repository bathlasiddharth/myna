# Resume Autonomous Build

Paste this prompt into a new Claude Code session to resume a build that was interrupted.

---

You are the orchestrator for building Myna — a local-first AI assistant. A previous session started the autonomous build but was interrupted. Your job is to pick up where it left off.

## What to do

1. Read `docs/instructions/autonomous-build-plan.md` — this is your complete recipe.
2. Read `docs/roadmap.md` — check Phase 1 tasks. Tasks marked "Done" are already complete. Start from the first "Not started" task.
3. Read `CLAUDE.md` for project conventions.
4. Check which files already exist under `agents/` — these were built by the previous session. Read them to understand what's been done.
5. Resume the build plan's Orchestrator Protocol from the next incomplete batch:
   - If P1-T01 is Done but P1-T02 is not → start at Batch B
   - If P1-T01 and P1-T02 are Done but P1-T03+ are not → start at Batch C (skills)
   - If all skills are Done but P1-T11 is not → start at Batch D
   - If P1-T12 is Done but P1-T13 is not → start at Batch E (audit)

## Key files to read

| File | Why |
|---|---|
| `docs/instructions/autonomous-build-plan.md` | The build recipe — read FIRST |
| `docs/roadmap.md` | Check which tasks are Done vs Not started |
| `docs/architecture.md` | Skill inventory, agent structure, routing |
| `docs/foundations.md` | Templates, config schemas, patterns |
| `agents/**/*.md` | Already-built artifacts from previous session |

## Quality expectations

Same as the initial build — this is not a quick finish, it's a continuation at the same quality bar.

- **Features are the priority.** Every feature must be fully addressed in the Procedure.
- **Follow the Golden Rule.** LLM instructions, not code. Don't teach the LLM how to do things it already knows.
- **Self-review is real.** 3 rounds, each must find at least one improvement.
- **Provenance markers belong in steering only.** Skills don't include marker rules.
- **Read previously-built skills.** If you're building skills that interact with already-built ones, read those files for consistency.

## After each batch

Same protocol: verify output, commit (`feat:`/`docs:`/`fix:`), update roadmap, push.

## If you hit limits again

Commit, update roadmap, push. The user will start another session with this same prompt.

## When the build is fully complete

Run the pre-flight check from the build plan. Report completion summary.

Start now. Read the roadmap first to see where to resume.

# Start Autonomous Build

Paste this prompt into a new Claude Code session to start the Phase 1 autonomous build.

---

You are the orchestrator for building Myna — a local-first AI assistant. Your job is to execute the autonomous build plan and produce all agent artifacts.

## What to do

1. Read `docs/instructions/autonomous-build-plan.md` — this is your complete recipe. Follow it exactly.
2. Read `docs/roadmap.md` — check Phase 1 tasks. All should be "Not started" for a fresh build.
3. Read `CLAUDE.md` for project conventions (especially git conventions — use `feat:` for agent artifacts, `docs:` for foundations).
4. Execute the build plan's Orchestrator Protocol:
   - Verify prerequisites
   - Create `agents/` directory structure
   - Spawn subagents in batch order: A → B → C (parallel) → D → E
   - After each batch: verify output, write build-log entries, write dev-journal if discoveries, commit, update roadmap, push

## Key files to read

| File | Why |
|---|---|
| `docs/instructions/autonomous-build-plan.md` | The build recipe — read FIRST, cover to cover |
| `docs/architecture.md` | Skill inventory, agent structure, routing, vault structure |
| `docs/foundations.md` | Templates, config schemas, patterns, MCP tool surface |
| `docs/features/*.md` | Feature details per domain (10 files) |

## Quality expectations

This should be a multi-hour session producing high-quality output. Do not rush.

- **Features are the priority.** Every feature from architecture.md "Features covered" must be fully addressed in the skill's Procedure section — not mentioned, but executable.
- **Follow the Golden Rule.** These are LLM instructions, not code. Specify WHAT to do and WHERE, not HOW to parse text or understand language. If an LLM would get it right without the instruction, don't write it.
- **Self-review is real.** Each subagent does 3 review rounds (coverage, quality, consistency). Every round must find at least one improvement. Rubber-stamp reviews are failures.
- **Calibrate from the example.** The build plan has a calibration excerpt showing what good Procedure looks like. Match that level of detail — specific vault paths, clear decision criteria, realistic examples.
- **Provenance markers belong in steering.** Skills do NOT include marker rules. The conventions steering file owns them.

## Batch execution

| Batch | What | Mode |
|---|---|---|
| A | Foundations revision | Sequential |
| B | MCP server | Sequential |
| C | All 8 skill subagents (capture; sync+wrap-up; triage+process; prep-meeting+process-meeting; brief; draft+draft-replies; calendar; review+self-track+park) | **Parallel** |
| D | Steering files, then main agent | Sequential |
| E | Cross-skill audit | Sequential |

For each subagent, use the prompt template from the build plan. For Batch C, spawn all 8 subagents simultaneously.

After each batch: verify output (files exist, not truncated, features covered), commit with appropriate prefix (`feat:` for skills/MCP/steering/agent, `docs:` for foundations, `fix:` for audit), update roadmap tasks to Done, push.

## If you hit limits

If you're running low on context or approaching time limits:
- Commit whatever batch is complete
- Update roadmap (mark completed tasks as Done)
- Push to remote
- The user will start a new session with the resume prompt

## When done

Run the pre-flight check from the build plan. Report:
- Files created (count and list)
- Feature coverage (any gaps?)
- Build log entries (assumptions/questions for user review)
- Any issues that need user attention

Start now. Read the build plan first.

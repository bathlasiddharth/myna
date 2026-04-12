# Autonomous Build Plan

This document is the complete recipe for building Myna's skills autonomously. An orchestrator Claude session reads this plan and spawns subagents to build each component.

**Architecture:** Myna uses Claude Code's native skills mechanism. Skills are `SKILL.md` files under `agents/skills/myna-{name}/`. Steering skills are preloaded via the agent's `skills:` frontmatter. There is NO MCP server for vault operations — all vault I/O uses Claude Code built-in tools (Read, Write, Edit, Grep, Glob). External MCPs (email, Slack, calendar) are user-provided.

**You are writing 24 new skills from scratch.** There are no existing skills to update or rewrite — the old skills have been deleted. Write fresh from the feature specs and architecture. Do not look for or reference old skill files.

**This is a long-running session.** You are building the backbone of Myna — 24 skills that determine whether the product works. Every skill deserves full attention, including the last one. Do not speed up, skip steps, or reduce quality as the session progresses. Skill #24 gets the same effort as skill #1.

---

## Golden Rule: These Are LLM Instructions, Not Code

**You are writing instructions for an AI agent, not programming a state machine.** LLMs already know how to summarize, write professional emails, parse natural language, format markdown, determine intent, extract key information, and generate coherent output. Do NOT teach them these things.

**What to specify:**
- **What** to do (goals, outcomes, deliverables)
- **Where** to read and write (vault paths, file names, sections)
- **When** to choose between options (decision criteria — e.g., when to use [Auto] vs [Inferred])
- **What NOT to do** (constraints, boundaries, safety rails)

**What NOT to specify:**
- How to understand text (the LLM already does this)
- How to summarize or extract key points (the LLM already does this)
- How to format markdown (the LLM already does this)
- How to write in a professional tone (the LLM already does this)
- Step-by-step parsing logic ("read the subject line, identify the topic, determine if...") — just say "determine the relevant project from the email content"

**Test:** For every line in your skill file, ask: "Would an LLM get this wrong without this instruction?" If no, delete the line.

**Example — BAD (over-specified):**
```
1. Read the email content carefully
2. Identify the main topic of the email
3. Look for action items mentioned in the email
4. For each action item, determine who is responsible
5. Format each action item as a markdown TODO
6. Determine the priority based on urgency words like "ASAP", "urgent", "critical"
```

**Example — GOOD (goal-oriented):**
```
1. Extract action items from the email. For each, capture: task description,
   owner (from context or explicit mention), due date (if stated), project
   (match against projects.yaml). Format as Obsidian Tasks plugin TODOs.
```

---

## Repo Structure

```
agents/
  main.md                              # Main agent instructions
  skills/
    myna-sync/SKILL.md                 # Feature skills (24 total)
    myna-plan/SKILL.md
    ...
    myna-steering-safety/SKILL.md      # Steering skills (6 total)
    myna-steering-conventions/SKILL.md
    myna-steering-output/SKILL.md
    myna-steering-system/SKILL.md
    myna-steering-memory/SKILL.md
    myna-steering-vault-ops/SKILL.md
```

---

## Skill Format

Each skill is a directory with a `SKILL.md` file (+ optional `examples.md` for skills with many worked examples). Claude Code loads all files in the directory when invoked.

**Required frontmatter:**
```yaml
---
name: myna-{name}
description: {what this skill does — Claude uses this for auto-invocation. ~250 chars. Front-load the action.}
user-invocable: true
argument-hint: "{hint for slash command arguments}"
---
```

**Body structure is up to each subagent.** Don't apply a template — figure out what structure suits each skill. Some need step-by-step procedures, some need decision trees, some are simple enough for focused paragraphs.

---

## Quality Bar

These skills are Myna's backbone. A mediocre skill means a broken feature in production. Apply this bar to every skill — don't lower it as the session progresses.

**A good skill:**
- A fresh session with only SKILL.md + 6 steering skills can execute it correctly without reading any other docs
- Every vault entry format is shown explicitly in the skill, not deferred to steering or architecture
- At least one worked example per major workflow path — realistic, not toy scenarios
- All vault operations use Claude Code built-in tools (Read, Write, Edit, Grep, Glob) — no Obsidian MCP. **If you encounter references to "Obsidian MCP", "myna-obsidian", or MCP vault tools in any doc you read, ignore them — those are stale references from a previous architecture. Use built-in tools instead.**
- Output uses light emojis in section headings and status labels (e.g. ✅ completed, ⚠️ blockers, 📋 tasks) — professional, not decorative. Each skill decides what fits its output; don't overuse.
- The `description` field is specific enough that Claude would auto-invoke it for the right intents AND would NOT invoke it for neighboring skills' intents
- Edge cases are handled: missing files, ambiguous entity names, feature toggles disabled, empty data sources

**What separates good from mediocre:**
- **Good:** Every feature from the spec has a clear, executable procedure. You can point to exactly where each feature is handled.
- **Mediocre:** Features mentioned but Procedure doesn't explain how to do them.
- **Good:** Specific vault paths, section headers, config fields. "Append to `Projects/{project}.md` under `## Timeline`"
- **Mediocre:** "Write the update to the appropriate project file."
- **Good:** Worked examples show a complete flow — user phrase, files read, decisions made, files written, output shown to user. Multiple scenarios if the skill has multiple modes.
- **Mediocre:** Examples are one-liners: "User says X → skill does Y."
- **Good:** Instructions tell Claude what to accomplish, not how to think. Only specifies where Claude might get the default wrong.
- **Mediocre:** Over-specified with step-by-step parsing logic, or under-specified leaving ambiguous decisions to Claude's default behavior.

---

## Build Order

### Completed (prerequisites for this build)

| Step | What | Status |
|------|------|--------|
| P0 | Updated architecture.md + foundations.md for 24 native skills | Done |
| P0.5 | Removed Obsidian MCP from architecture, added vault-ops steering | Done |
| P1 | Wrote 6 steering skills | Done |

### Remaining (this session)

4 subagents run **in parallel**, one per domain batch. One commit per skill.

**Note:** Main agent rewrite, install script, and doc updates are a separate session (P3). This session only writes the 24 feature skills.

---

## Skill Batches

### Batch 1: Day Lifecycle + Calendar (5 skills)

**Read:** `docs/features/daily-workflow.md`, `docs/features/meetings-and-calendar.md` (Time Block/Calendar/Task Breakdown sections), `docs/features/cross-domain.md` (carry-forward patterns)

| Skill | Intent | Features to cover from specs |
|---|---|---|
| `myna-sync` | Set up or refresh your day | Morning Sync, Daily Note, Weekly Note (first sync of week), Plan Tomorrow, Journal auto-archiving |
| `myna-plan` | Planning advice — inline only, no vault writes | Plan Day, Priority Coaching, Week Optimization |
| `myna-wrap-up` | Close out your day | End of Day Wrap-Up, contribution detection, carry-forward, reflection |
| `myna-weekly-summary` | Summarize your week | Weekly Summary, Team Health snapshot (for managers) |
| `myna-calendar` | Time blocks, reminders, task breakdown | Time Block Planning, Calendar Reminders, Task Breakdown |

**Boundaries:** sync does NOT include planning modes (that's plan). plan NEVER writes to vault. wrap-up does NOT include weekly summary. calendar NEVER adds attendees.

### Batch 2: Email Pipeline + Meeting Lifecycle (5 skills)

**Read:** `docs/features/email-and-messaging.md`, `docs/features/meetings-and-calendar.md` (Meeting File/Process Meeting/Summaries sections)

| Skill | Intent | Features to cover from specs |
|---|---|---|
| `myna-email-triage` | Sort inbox emails into folders | Email Triage (all 3 steps) |
| `myna-process-messages` | Extract data from email/Slack/docs → vault | Email Processing, Messaging Processing, Document Processing, Dedup, Meeting Summaries from Email, Unreplied Tracker (as byproduct) |
| `myna-draft-replies` | Batch process forwarded DraftReplies emails | Email Draft Reply (DraftReplies folder path), Follow-Up Meeting Draft |
| `myna-prep-meeting` | Generate meeting prep | Meeting File Prep, meeting type inference, conversation coaching |
| `myna-process-meeting` | Process meeting notes into vault | Process Meeting, Universal Done (meeting path) |

**Boundaries:** email-triage is PURELY classification — never extracts vault data. process-messages skips the DraftReplies folder. draft-replies ONLY reads the DraftReplies folder.

### Batch 3: Information Retrieval + People Management (7 skills)

**Read:** `docs/features/people-management.md`, `docs/features/projects-and-tasks.md` (Project Status/Blocker sections), `docs/features/email-and-messaging.md` (Unreplied Tracker section)

| Skill | Intent | Features to cover from specs |
|---|---|---|
| `myna-brief-person` | Person briefing | Person Briefing |
| `myna-brief-project` | Project status (quick + full modes) | Project Status Summary |
| `myna-team-health` | Team health dashboard for all directs | Team Health Overview |
| `myna-unreplied-threads` | What's waiting on you vs what you're waiting on | Unreplied & Follow-up Tracker queries |
| `myna-blockers` | Scan projects for blockers and stuck items | Blocker Detection |
| `myna-1on1-analysis` | 1:1 pattern analysis across sessions | 1:1 Pattern Analysis |
| `myna-performance-narrative` | Performance review narrative + calibration | Performance Narrative, Review Calibration |

**Boundaries:** Only performance-narrative writes to vault (Drafts/). All others are read-only inline output. Never infer engagement, morale, or performance — present factual data only.

### Batch 4: Writing, Capture, Self-Tracking, Context, Memory, Review (7 skills)

**Read:** `docs/features/writing-and-drafts.md` (all EXCEPT Pre-Read Preparation — deferred), `docs/features/cross-domain.md` (Quick Capture/Park & Resume/Link Manager), `docs/features/self-tracking.md`, `docs/features/daily-workflow.md` (Review Queue), `docs/features/projects-and-tasks.md` (Task Management)

| Skill | Intent | Features to cover from specs |
|---|---|---|
| `myna-draft` | Generate professional content | Email Draft Reply (conversation path), Follow-Up Email/Meeting Draft, Structured Draft, Recognition Draft, Help Me Say No, Difficult Conversation Prep, Monthly Update |
| `myna-rewrite` | Fix grammar, adjust tone, or fully rewrite | Message Rewriting (3 modes: fix/tone/rewrite) |
| `myna-capture` | Route user data to vault | Quick Capture, Observations, Recognition, Task Management (add/recurring), Link Manager (save), Project/Person File Management |
| `myna-self-track` | Log contributions + career docs | Contributions Tracking, Self-Narrative Generation, Contribution Queries, Self-calibration |
| `myna-park` | Save/resume context across sessions | Park & Resume |
| `myna-learn` | Myna's experiential memory | Emergent memory: capture, reflect, delete, negotiate |
| `myna-process-review-queue` | Process review queue items | Review Queue processing (review-work, review-people, review-self) |

**Boundaries:** draft does NOT include message rewriting (that's rewrite). self-track handles SELF-narratives only (others → performance-narrative). learn never writes to CLAUDE.md. process-review-queue does NOT handle review-triage.md (that's email-triage).

---

## Per-Subagent Protocol

Every skill subagent follows this protocol. **Do not rush any step.** The last skill in your batch deserves the same attention as the first. If you notice yourself writing shorter examples or skipping edge cases toward the end, stop and reset your pace.

### 1. Read

Read ALL of these before writing anything:
- ALL feature files listed in your batch's "Read" line — read every section mentioned, not just the first file
- `docs/architecture.md` (full)
- `docs/design/foundations.md` (full) — especially §2 (file templates) for canonical vault entry formats
- All 6 steering skills under `agents/skills/myna-steering-*/SKILL.md` — to understand what rules are already handled by steering so you don't duplicate them in feature skills (provenance markers, append-only discipline, confirmation policy, etc.)

**Do not start writing after reading just architecture or just one feature file.** The feature files contain critical details that architecture only summarizes. Reading all sources before writing is what produces cohesive skills.

### 2. Write

For each skill in your batch:

1. **Gather features.** Read all the feature spec sections listed in "Features to cover." List every behavior, mode, and edge case the skill must support. This is your raw material.

2. **Design the skill.** Now step back and think: what structure makes this skill cohesive? Group related behaviors into a natural workflow — not one section per feature, but a unified procedure where features are supported inherently. A skill that handles 5 features should NOT read like 5 mini-skills stitched together. It should read like one clear set of instructions that a person would follow, where the features emerge naturally from the workflow.

3. **Write cohesively.** Write the skill as a unified whole. The reader should not be able to tell which lines map to which feature — they should just see a clear, complete procedure. If the skill has distinct modes (e.g., myna-rewrite has fix/tone/rewrite), those are natural sections. But if the features are parts of one workflow (e.g., myna-sync's daily note + calendar + tasks + priorities are all part of "setting up your day"), write them as one flowing procedure, not as labeled feature blocks.

4. **Write to the correct path.** Each skill is a directory: `agents/skills/myna-{name}/SKILL.md` (not a flat file). Create the directory first if it doesn't exist. If the skill needs an `examples.md`, put it in the same directory.

5. **Commit:** `mkdir -p agents/skills/myna-{name} && git add agents/skills/myna-{name}/ && git commit -m "feat(skills): add myna-{name} skill"`

### 3. Review (after writing all skills in batch)

**Reviews are not a formality.** Every round MUST find at least one thing to improve. If you find nothing, you're not looking hard enough. A "no issues found" result means the review failed, not that the skills are perfect.

**Round 1: Feature coverage.**
For each skill, re-read the feature spec sections listed in "Features to cover." For every feature in the spec:
- Point to the exact place in your SKILL.md that handles it. If you can't point to a specific place, the feature isn't covered — add it.
- Check the feature spec for sub-bullets, edge cases, and details that your skill may have summarized away. Feature specs often have specifics that the architecture table doesn't show.
- Verify the skill doesn't cover features that belong to a neighboring skill (check the Boundaries note for your batch).

Fix all gaps before Round 2.

**Round 2: Skill quality.**
Read each skill as if you've never seen it before. For each skill, answer these questions honestly:
- **Auto-invocation:** Is the `description` accurate and specific enough? Would Claude invoke this skill for the right user intents? Would it ALSO incorrectly invoke it for intents that belong to a different skill? Test mentally with 3-4 example user phrases.
- **Self-containedness:** Could a fresh session execute this with ONLY SKILL.md + steering? Are entry formats inlined or just referenced? Are vault paths concrete or vague?
- **Instructions:** Are they clear and unambiguous, or does anything rely on context that only exists in your head from reading the specs? Would a different Claude session interpret any instruction differently than you intended?
- **Worked examples:** Do they show a realistic complete flow (user phrase → files read → decision → files written → output to user)? Or are they abbreviated happy-path sketches?
- **Calibration:** Is anything over-specified (teaching Claude what it already knows) or under-specified (leaving ambiguous decisions to Claude's defaults when the default would be wrong)?

Fix all issues. Amend commits if needed.

### 4. Push

After all skills pass review: `git pull --rebase origin main && git push origin main`

Other subagents may have pushed first. The rebase ensures your commits land cleanly on top. If rebase fails (conflict on the same file — unlikely since batches have zero file overlap), flag to the orchestrator.

### 5. Report

Report to orchestrator (under 30 lines):
```
Files: [list of created files]
Features covered: [count] — [list]
Issues: [any gaps or concerns]
```

---

## Orchestrator Protocol

### Model Split

The orchestrator runs in **Opus** (design judgment, cross-skill evaluation). Subagents run in **Sonnet** (executing well-defined skill writing from clear specs). When spawning subagents, set `model: "sonnet"`. Do not reduce effort level — subagents should run at the same high effort as the orchestrator.

Why: Sonnet's natural conciseness produces leaner LLM instructions. Opus would over-engineer individual skills. But cross-skill review requires comparing 24 skills holistically — that's Opus's strength.

### Starting the Build

1. Read this plan (full file)
2. Read `docs/roadmap.md` — check task status
3. Read `docs/architecture.md` and `docs/design/foundations.md` (full files)
4. For each batch, prepare the subagent prompt. **Subagents cannot read this plan — you must include everything they need.** Each subagent prompt must contain:
   - The **Golden Rule** section (what to specify, what not to, bad/good examples)
   - The **Skill Format** section (frontmatter, body structure)
   - The **Quality Bar** section (all 7 criteria + all 4 good/mediocre comparisons)
   - The **full Per-Subagent Protocol** (Read → Write → Review → Push → Report)
   - The **batch table** for that subagent (skills + intents + features to cover)
   - The **Boundaries** note for that batch
   - The **docs to read** for that batch
   - Instruction to also read: `docs/architecture.md` (full), `docs/design/foundations.md` (full), and all 6 steering skills under `agents/skills/myna-steering-*/SKILL.md` (to understand what's already handled there and avoid duplicating steering rules in feature skills)
   - Do NOT paraphrase — include the sections verbatim or the subagent will lose precision
5. Spawn 4 subagents in parallel (one per batch, `model: "sonnet"`)
6. Wait for all to complete. **Do not write any skills yourself — your job is orchestration and cross-skill review only.**

### After All Subagents Complete: Cross-Skill Review

**Read all 24 SKILL.md files.** Do not spot-check — read every one. Then check:

1. **Boundary bleed:** For each related pair, read both skills and verify neither contains logic that belongs in the other:
   - sync ↔ plan (sync writes vault, plan is inline only)
   - wrap-up ↔ weekly-summary (daily vs weekly scope)
   - email-triage ↔ process-messages (classification vs extraction)
   - draft ↔ rewrite (generation vs transformation)
   - draft ↔ draft-replies (conversation path vs DraftReplies folder)
   - self-track ↔ performance-narrative (self vs others)
   - learn ↔ capture (behavioral patterns vs entity data)
   - process-review-queue ↔ email-triage (review queues vs triage queue)

2. **Description collision:** Read all 24 `description` fields together. Would any two trigger for the same user intent? If so, make one more specific.

3. **Format consistency:** Skills across different batches that write the same vault entry types must use identical formats. Check:
   - Task format (capture, process-messages, process-meeting, wrap-up, calendar)
   - Timeline entry format (capture, process-messages, process-meeting)
   - Observation format (capture, process-messages, process-meeting)
   - Contribution format (wrap-up, self-track, process-meeting)

4. **Steering duplication:** No feature skill should contain rules that belong in steering (provenance marker rules, append-only rules, confirmation policy, external content framing rules). These are handled by the 6 steering skills.

5. **No MCP references:** `grep -rl "obsidian MCP\|myna-obsidian" agents/skills/myna-*/` should return 0 results.

Fix all issues, commit, push.

### Pre-flight Check

```bash
# All 24 skill directories exist
ls agents/skills/myna-{sync,plan,wrap-up,weekly-summary,calendar}/SKILL.md  # 5
ls agents/skills/myna-{email-triage,process-messages,draft-replies,prep-meeting,process-meeting}/SKILL.md  # 5
ls agents/skills/myna-{brief-person,brief-project,team-health,unreplied-threads,blockers,1on1-analysis,performance-narrative}/SKILL.md  # 7
ls agents/skills/myna-{draft,rewrite,capture,self-track,park,learn,process-review-queue}/SKILL.md  # 7

# No MCP references in any skill
grep -rl "obsidian MCP\|myna-obsidian" agents/skills/myna-*/  # expect 0

# All have valid frontmatter
grep -l "user-invocable: true" agents/skills/myna-*/SKILL.md | wc -l  # expect 24
```

Update `docs/roadmap.md` task P2-T13 to Done. Report completion to user.

### Error Handling

- Subagent fails or produces bad output → re-spawn with clarifying prompt and specific feedback on what went wrong
- Subagent returns fewer skills than expected → check if it hit context limits. Re-spawn for remaining skills only.
- Subagent writes flat files instead of directories → fix paths before committing
- Design gap discovered → document, continue building, flag to user
- Two skills contradict → cross-skill review resolves; if it can't, flag to user
- Session hitting limits → commit whatever is complete, update roadmap, push. Resume in next session.

---

## What "Done" Looks Like

1. All 24 feature skill directories exist under `agents/skills/myna-*/`
2. All 6 steering skill directories exist (already done from P1)
3. Cross-skill review found no unresolved boundary or format issues
4. All features from the feature spec files are covered across the 24 skills
5. No skill references Obsidian MCP
6. Roadmap task P2-T13 marked Done

---
name: myna-dev-execution-prompt
description: |
  Generate a self-contained execution prompt for Myna development — a fresh session can run it autonomously to implement changes, update docs, review its own work, and push to a feature branch. Use after /myna-dev-brainstorm or any design discussion. Triggers: "write the execution prompt", "create the build prompt", "crystallize this", "package this for implementation".
argument-hint: "[prompt name, e.g. customization-layer]"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Agent
  - AskUserQuestion
effort: max
---

# Myna Execution Prompt Generator

You are a senior Myna contributor who just watched a design session. Your job: write the implementation spec that a fresh Claude Code session can execute autonomously — no human involvement until the branch is ready for review.

The output is a markdown file at `docs/prompts/[name].md` that gets copy-pasted into a new session.

---

## Myna Context (baked in — don't re-read these docs every time)

### Architecture
- **Agent file** (`agents/main.md`): system prompt, survives context compaction. Routing rules, identity, session start, direct operations, and core rules live here.
- **Steering skills** (6 files, `myna-steering-*`): preloaded via agent frontmatter, loaded into conversation history — get dropped after compaction. Cross-cutting rules only.
- **Feature skills** (24 files, `myna-*/SKILL.md`): native Claude Code skills, auto-discovered, loaded on demand.
- **Install script** (`install.sh`): copies skills to `~/.claude/skills/`, generates agent file, creates vault structure.
- **Config** (`_system/config/*.yaml`): workspace, projects, people, meetings, communication-style, tags.

### Core Constraints
- Draft, never send. No external actions except personal calendar events with no attendees.
- Vault-only writes. All file writes under `{{VAULT_PATH}}/{{SUBFOLDER}}/`.
- Claude-first (D046). Targets Claude Code, no adapter layer.
- Agent file body = highest persistence. Critical logic goes here.
- Progressive disclosure. Feature skills load on demand via description matching.

### Git Conventions
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- Scope is the feature or area being changed — `feat(setup):`, `feat(config-ui):`, `fix(capture):`. Never use task IDs or group IDs as scope (no `feat(G1):`, `fix(C15):`).
- Never auto-commit — only when explicitly asked
- Never add Co-Authored-By lines
- Atomic commits — one logical change per commit
- Always commit to a new branch, never to main

### Docs That May Need Updating
When making changes, check if these need updates (don't always include all — only the ones affected):
- `docs/architecture.md` — when structural changes are made
- `docs/decisions.md` — when new decisions are settled (use next D-number in sequence)
- `docs/open-questions.md` — when new questions surface
- `README.md` — when user-facing behavior changes
- `docs/post-install-checklist.md` — when setup/install changes

---

## Phase 1: Extract and Clarify

Read the conversation, extract what you need, and resolve ambiguity before doing anything else.

### 1a. Design Decisions
What was settled? List each as a clear statement. These go into the prompt as "already decided — do not re-debate."

### 1b. Tasks
What needs to change? Identify every file that needs creating, editing, or updating. Group by logical unit of work, not by file.

### 1c. Verify against reality
Read the actual files that will be edited. Check whether the brainstorm's assumptions about file structure, naming, and current state are correct.

### 1d. Open Questions
What wasn't settled? What assumptions from the brainstorm don't match what you read in 1c?

### 1e. Clarify with the user

Check which of the docs listed above need updating based on the changes. Flag any task too ambiguous for autonomous execution. Present everything in one shot:

```
Here's what I extracted. Confirm or adjust:

**Tasks:** [numbered list]

**Open questions** (if any):
1. [Question] — [why it matters]
   - Option A: [description] | Option B: [description]
   - Recommendation: [A or B] because [reason]

**Doc updates I plan to include:** [list]

Say "agreed" to accept all recommendations, or specify what to change.
```

**Only ask questions that would actually block autonomous execution.** Zero questions is fine if the brainstorm was thorough.

---

## Phase 2: Assess

### Scope
- **Small (1-2 tasks):** Simple direct prompt. Every task still gets a review subagent + fix cycle.
- **Medium (3-4 tasks):** Sequential tasks, review subagent after each.
- **Large (5+ tasks):** Parallel branches where safe, sequential otherwise. Review subagent after each task.

### Task Dependencies
Every task runs as a subagent (Agent tool). This eliminates context bleed between tasks and gives each task full isolated attention. The only decision to make is: **parallel** or **sequential**?

- **Parallel subagents** (5+ tasks only): tasks with zero file overlap and no dependency on each other. Each gets its own branch and runs simultaneously. The orchestrator merges all branches after. Only parallelize when you are certain there is no chance of conflicts — verify the exact files each task touches.
- **Sequential subagents**: everything else. Run one at a time on the feature branch. Use when tasks share files, depend on a prior task's output, or file overlap is uncertain.

**Parallelization rule:** only parallelize when you have verified the file sets are completely disjoint. If there is any doubt, make it sequential. Wrong parallelization causes merge conflicts; unnecessary sequencing just costs time — and session length is not a concern.

### Risk Assessment
- **High risk:** `agents/main.md` (routing), `install.sh` (user-facing), skill files with complex logic → stricter review.
- **Low risk:** doc updates, config changes, new files → lighter review.

### Review Persona
Match reviewer lens to the work. Each task gets a dedicated review subagent — write the subagent prompt in the task's `#### Review — Agent tool` block. The subagent reads the changed files and checks the assertions. Persona examples: "Principal Engineer checking correctness", "Product Manager checking UX flow", "SRE checking shell safety".

### Model Selection
Default to Sonnet. Use Opus only for ambiguous requirements or complex existing code.

### Session Splitting
Split into multiple prompts if 8+ tasks spanning unrelated domains, or tasks have commit-level dependencies. Each prompt is self-contained; later prompts check out the branch from the first.

---

## Phase 3: Generate

Write the prompt to `docs/prompts/[name].md`. The name is either specified by the user or derived from the feature name.

### Prompt Structure

```markdown
# [Title]

[1-2 sentence description.]

**You are the orchestrator.** Your only job is sequencing, branch management, and coordination — you do not implement tasks. Each task subagent (ST-N) owns its implementation, review loop, and commit. You own branches, the run log, merges, and the final push.

**Setup — do this before spawning any subagent:**

1. Create the feature branch:
   ```
   git checkout -b feat/[feature-name]
   ```
2. Create branches for parallel tasks only (sequential task branches are created just before spawning each one):
   ```
   git checkout -b feat/[feature]-st-1 feat/[feature-name]
   git checkout -b feat/[feature]-st-2 feat/[feature-name]
   git checkout feat/[feature-name]
   ```
3. Commit the execution prompt doc:
   ```
   git add docs/prompts/[name].md
   git commit -m "docs: add [name] execution prompt"
   ```
4. Create the run log at `tmp/[feature]-run.md`:
   ```markdown
   # [feature] — [date]

   ## Tasks
   - [ ] ST-1: [Task title] — branch `feat/[feature]-st-1` — pending
   - [ ] ST-2: [Task title] — branch `feat/[feature]-st-2` — pending
   - [ ] ST-3: [Task title] — branch `feat/[feature]-st-3` — pending

   ## Reviews
   (none yet)

   ## Unresolved
   (none)
   ```

**Execution plan**

Parallel (spawn all simultaneously — zero file overlap verified):
- ST-1: [Task title] — `feat/[feature]-st-1` — touches `[file A]` only
- ST-2: [Task title] — `feat/[feature]-st-2` — touches `[file B]` only

Sequential (spawn one at a time after parallel merges):
- ST-3: [Task title] — `feat/[feature]-st-3`

After each subagent reports back:
- **If "Done":** update run log (mark complete, add review round count and report path), merge + delete branch, proceed
- **If "Unresolved":** update run log (mark failed, note report path and issues), leave branch unmerged, skip tasks that depend on this one, continue unblocked tasks

Merge + delete (Done path only):
```
git checkout feat/[feature-name]
git merge feat/[feature]-st-N
git branch -d feat/[feature]-st-N && git push origin --delete feat/[feature]-st-N
```
Resolve any conflicts before proceeding.

**For sequential tasks:** create the branch just before spawning — after the prior task's branch is merged:
```
git checkout -b feat/[feature]-st-N feat/[feature-name]
```

## Context
[What all subagents need to know — project background, conventions, key constraints.]

## Design Decisions (already settled — do not re-debate)
[Numbered decisions from the brainstorm + clarifications.]

---

## ST-1: [Task title] — parallel

Spawn this subagent with the Agent tool. Prompt:

> **Context:** [Myna project context, relevant conventions]
>
> **Your job:** [What needs to change and why. Constraints: what not to do.]
>
> **Acceptance criteria:**
> - [Specific assertion]
> - [Specific assertion]
>
> **Steps:**
> 1. `git checkout feat/[feature]-st-1` (branch already exists)
> 2. Read these files: `[file1]`, `[file2]` — verify current state before changing anything
> 3. Implement the task
> 4. Commit: `[type]([scope]): [what changed]`
> 5. Review loop (max 3 rounds):
>    - Spawn a review subagent (Agent tool): `Run /myna-dev-review --task "[feature]-st-1" --base "feat/[feature-name]" --criteria "[acceptance criteria as comma-separated assertions]". Report back the stdout summary and report path.`
>    - Read the summary. Fix any Critical or Important issues → `git commit -m "fix: ..."` → re-spawn review.
>    - Repeat until clean or 3 rounds done. If still unresolved, note the report path and issues.
> 6. Push: `git push origin feat/[feature]-st-1`
> 7. Report back: "Done — [round count] review round(s)" or "Unresolved: [list] — report: tmp/reviews/task-[feature]-st-1.md"

---

## ST-2: [Task title] — parallel

Spawn this subagent with the Agent tool. Prompt:

> [Same structure as ST-1, adapted for this task. Branch: `feat/[feature]-st-2`.]

---

## ST-3: [Task title] — sequential (after parallel merges)

Spawn this subagent with the Agent tool. Prompt:

> [Same structure as ST-1, adapted for this task. Branch: `feat/[feature]-st-3`.]

---

## Quality checks
- All task branches merged and deleted
- Run log has no pending or in-progress items
- No unresolved issues carried forward

## Final push
If any tasks are marked failed in the run log: stop — do not push. Report unresolved items with report paths.

Otherwise: `git push origin feat/[feature-name]`

## Summary
Write `tmp/[feature]-summary.md`:
```markdown
# [feature] — session summary

**Branch:** feat/[feature-name]
**Date:** [date]

## Tasks
- ST-1: [title] — done (N review rounds)
- ST-2: [title] — failed (see tmp/reviews/task-[feature]-st-2.md)

## Files changed
- [list from git diff feat/[feature-name] --name-only]

## Review findings
[Per task: N Critical, N Important — resolved/unresolved]

## Notes
[Any unresolved issues, conflicts resolved, judgment calls made]
```
```

### Writing Principles

**Self-contained.** A fresh session must execute without asking anything. Test: "If a stranger pasted this, would they succeed?"

**Specific over general.** "Check YAML frontmatter has exactly 6 entries" beats "verify frontmatter looks correct."

**Quality over speed.** Session length is not a concern. Every task gets full attention — a review subagent, a fix cycle, a clean commit. The goal is zero human rework after the session completes.

**Three roles, clean separation.** Orchestrator sequences and merges — never implements. Task subagent (ST-N) implements, reviews, commits — never touches other tasks. Review subagent reads and reports — never fixes. Keep each role doing only its job.

**ST-N prompts are self-contained.** Each task subagent prompt must include everything it needs: context, task definition, branch instructions (if parallel), the review subagent prompt, commit instructions. It cannot ask the orchestrator for clarification.

**No meta-instructions.** Everything in the file is for the executing model.

**Doc updates are real tasks.** Same treatment as code changes — instructions, review criteria, quality checks.

---

## Phase 4: Review (1 cycle only)

Spawn a review subagent. One cycle — the prompt is a document, not implementation.

The reviewer checks:
1. **Autonomy** — will it run without asking the user anything?
2. **Completeness** — every task and doc update present?
3. **Accuracy** — file paths correct? Files exist?
4. **Dependencies** — parallel phases truly independent?
5. **Review criteria** — specific enough to catch real issues?

**Review discipline:** Only flag real problems. Don't manufacture findings. Clean review is valid.

---

## Phase 5: Fix and Summarize

Fix valid issues. Then present:

```
## Execution Summary

**Prompt:** docs/prompts/[name].md
**Model:** [Sonnet/Opus] — [why]
**Sessions:** [1 or N]
**Branch:** [type]/[name]

### Tasks
1. [Task] — [description] | Review: [persona]
2. [Task] — [description] | Review: [persona]
...

### Execution Plan
[Parallel/sequential structure]

### Key Decisions
- [Decisions the user should be aware of]

### Concerns
- [Trade-offs or risks before running]
```

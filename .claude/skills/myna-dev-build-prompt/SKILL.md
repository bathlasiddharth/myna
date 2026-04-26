---
name: myna-dev-build-prompt
description: |
  Generate a self-contained execution prompt for Myna development — a fresh session can run it autonomously to implement changes, update docs, review its own work, and push to a feature branch. Use after /myna-dev-brainstorm or any design discussion. Triggers: "generate prompt", "write the execution prompt", "crystallize this", "package this for implementation".
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

You are a senior Myna contributor who just finished a design discussion. Your job: write an execution prompt that a fresh Claude Code session can run autonomously — no questions asked, no human involvement until the branch is ready for review.

**The standard:** when the session completes, the user should be able to read the summary, open the PR diff, and merge — not fix things first. Zero human rework is the goal.

**The mental model:** you are briefing a team of engineers, not writing a recipe. Each task subagent gets a clear problem statement, context, and definition of done — then figures out the implementation itself. The prompt captures *what* and *why*, not *how*.

**Built-in quality loop:** every task subagent reviews its own work before reporting back — spawning a dedicated review subagent, fixing Critical and Important issues, and iterating up to 3 rounds. The prompt you write must include this loop. Quality is enforced autonomously, not left to the human reviewer.

The output is a markdown file at `tmp/[name]/[prefix]-prompt.md`.

**Prefix rule:** derive a 2-5 char prefix from the prompt name — first letter of each hyphen-separated word. `beta-fixes` → `bf`, `config-ui` → `cu`, `customization-layer` → `cl`. Use this prefix on every file in the session folder so tab titles are identifiable.

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
- `docs/design/architecture.md` — when structural changes are made
- `docs/design/product-decisions.md` — when new product/behavior decisions are settled (use next D-number in sequence)
- `docs/design/architecture-decisions.md` — when new runtime/install decisions are settled (use next D-number in sequence)
- `README.md` — when user-facing behavior changes
- `docs/guide/post-install-checklist.md` — when setup/install changes

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

**Changelog entries this run will add** (from tasks marked changelog: yes — edit before approving):
- [Added/Fixed/Changed] [description]
*(omit section if no tasks are marked changelog: yes)*

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

### Doc Updates
Check whether any of these need updating based on the changes. If yes, add a dedicated final sequential task — always last, always after all implementation tasks are merged (docs depend on knowing what actually changed):
- `docs/design/architecture.md` — structural changes
- `docs/design/product-decisions.md` or `docs/design/architecture-decisions.md` — new decisions settled (next D-number in sequence)
- `README.md` — user-facing behavior changes
- `docs/guide/post-install-checklist.md` — setup/install changes

If none of these are affected, skip the doc task — don't add a placeholder.

### Risk Assessment
- **High risk:** `agents/main.md` (routing), `install.sh` (user-facing), skill files with complex logic → stricter review.
- **Low risk:** doc updates, config changes, new files → lighter review.

### Review Persona
Match reviewer lens to the work. Each task gets a dedicated review subagent invoked via `/myna-dev-review --task`. Persona examples: "Principal Engineer checking correctness", "Product Manager checking UX flow", "SRE checking shell safety". Bake the relevant persona into the task's `--criteria` or the Context block so the reviewer has the right lens.

### Model Selection
Default to Sonnet. Use Opus only for ambiguous requirements or complex existing code.

### Session Splitting
Split into multiple prompts if 8+ tasks spanning unrelated domains, or tasks have commit-level dependencies. Each prompt is self-contained; later prompts check out the branch from the first.

---

## Phase 3: Generate

Write the prompt to `tmp/[name]/[prefix]-prompt.md`. The name is either specified by the user or derived from the feature name. Derive the prefix (first letter of each hyphen-separated word) and use it on every file in the session folder.

### Prompt Structure

```markdown
# [Title]

[1-2 sentence description.]

**Goal:** zero human rework. When this session completes, the user reads the summary, opens the PR diff, and merges — without fixing anything first. Each task subagent is responsible for its own quality: implement → review → fix → commit. The review loop is not optional.

**You are the orchestrator.** Your only job is sequencing, branch management, and coordination — you do not implement tasks. Each task subagent (T-N) owns its implementation, review loop, and commit. You own branches, the run log, merges, and the final push.

**Setup — do this before spawning any subagent:**

1. Create the feature branch:
   ```
   git checkout -b feat/[feature-name]
   ```
2. Create branches and worktrees for parallel tasks only (sequential task branches are created just before spawning each one):
   ```
   git branch feat/[feature]-t-1 feat/[feature-name]
   git branch feat/[feature]-t-2 feat/[feature-name]
   mkdir -p tmp/[feature]/worktrees
   git worktree add tmp/[feature]/worktrees/t-1 feat/[feature]-t-1
   git worktree add tmp/[feature]/worktrees/t-2 feat/[feature]-t-2
   ```
   Each worktree is an isolated working directory with its own HEAD — parallel subagents won't race on `git checkout`.
3. Create the run log at `tmp/[feature]/[prefix]-run.md`:
   ```markdown
   # [feature] — [date]

   ## Tasks
   - [ ] T-1: [Task title] — branch `feat/[feature]-t-1` — pending
   - [ ] T-2: [Task title] — branch `feat/[feature]-t-2` — pending
   - [ ] T-3: [Task title] — branch `feat/[feature]-t-3` — pending

   ## Reviews
   (none yet — reports appear as tmp/[feature]/reviews/[short-name]-rN.md)

   ## Unresolved
   (none)
   ```

**Execution plan**

Parallel (spawn all simultaneously — zero file overlap verified):
- T-1: [Task title] — `feat/[feature]-t-1` — touches `[file A]` only
- T-2: [Task title] — `feat/[feature]-t-2` — touches `[file B]` only

Sequential (spawn one at a time after parallel merges):
- T-3: [Task title] — `feat/[feature]-t-3`

After each subagent reports back:
- **If "Done":** update run log (mark complete, add review round count and report path), merge + delete branch, proceed
- **If "Unresolved":** update run log (mark failed, note report path and issues), leave branch unmerged, skip tasks that depend on this one, continue unblocked tasks

Merge + delete (Done path only):

**Parallel tasks** — rebase in the worktree first so the merge is always a fast-forward, then remove the worktree:
```
git -C tmp/[feature]/worktrees/t-N rebase feat/[feature-name]
git checkout feat/[feature-name]
git merge --ff-only feat/[feature]-t-N
git worktree remove tmp/[feature]/worktrees/t-N
git branch -d feat/[feature]-t-N
```

**Sequential tasks** — the feature branch hasn't moved since this task branched, so fast-forward succeeds directly:
```
git checkout feat/[feature-name]
git merge --ff-only feat/[feature]-t-N
git branch -d feat/[feature]-t-N
```

If `--ff-only` fails, stop and report — do not fall back to a merge commit.

**For sequential tasks:** create the branch just before spawning — after the prior task's branch is merged:
```
git checkout -b feat/[feature]-t-N feat/[feature-name]
```

## Context
[What all subagents need to know — project background, conventions, key constraints.]

## Design Decisions (already settled — do not re-debate)
[Numbered decisions from the brainstorm + clarifications.]

## Changelog entries approved for this run
*(omit section if no tasks are marked changelog: yes)*
- T-[N]: [approved changelog-line from the task]

---

## T-1: [Task title] — parallel

Spawn this subagent with the Agent tool. Prompt:

> **Problem:** [What's wrong and why it matters.]
>
> **Correct behavior:** [What the system should do — described, not coded.]
>
> **Context:** [Relevant background the subagent needs to understand the problem.]
>
> **Suggested files:** `[file1]`, `[file2]` — use your own judgment if the right change belongs elsewhere.
>
> **Don't touch:** [What to leave alone.]
>
> **Done when:**
> - [Specific, verifiable assertion]
> - [Specific, verifiable assertion]
>
> ---
> **After implementing,** invoke:
> ```
> /myna-dev-task-protocol --branch feat/[feature]-t-1 --base feat/[feature-name] --criteria "[done-when assertions as comma-separated string]" --short-name [short-name] --feature [feature] --commit-msg "[type]([scope]): [description]"
> ```
> `--short-name`: 2-3 words from this task title, lowercase hyphen-separated (e.g. `base-guard`, `email-sort`).
> `--commit-msg`: the conventional commit message for your implementation.
>
> **Working directory:** `cd tmp/[feature]/worktrees/t-1` before reading or editing any files, and run all git commands from there. The branch `feat/[feature]-t-1` is already checked out in this worktree — do not run `git checkout`.

---

## T-2: [Task title] — parallel

Spawn this subagent with the Agent tool. Prompt:

> [Same structure as T-1. Branch: `feat/[feature]-t-2`.]

---

## T-3: [Task title] — sequential (after parallel merges)

Spawn this subagent with the Agent tool. Prompt:

> [Same structure as T-1. Branch: `feat/[feature]-t-3`. Create branch just before spawning: `git checkout -b feat/[feature]-t-3 feat/[feature-name]`.]

---

## T-N: Doc updates — sequential (always last, omit if no docs affected)

Spawn this subagent with the Agent tool. Prompt:

> **Problem:** The implementation tasks changed [X]. The following docs are now stale or incomplete: [list only affected docs].
>
> **Correct behavior:** Each listed doc reflects the actual changes made — new decisions recorded with the next D-number, architecture section updated to match new structure, open questions added if surfaced.
>
> **Context:** Read the implementation diffs on `feat/[feature-name]` before editing — update only what the changes actually affect, not a general refresh.
>
> **Suggested files:** [list only affected docs from: `docs/design/architecture.md`, `docs/design/product-decisions.md`, `docs/design/architecture-decisions.md`, `README.md`, `docs/guide/post-install-checklist.md`]
>
> **Done when:**
> - [Specific assertion per doc, e.g. "product-decisions.md or architecture-decisions.md contains entry D0XX for [decision]"]
>
> ---
> **After implementing,** invoke:
> ```
> /myna-dev-task-protocol --branch feat/[feature]-t-N --base feat/[feature-name] --criteria "[done-when assertions]" --short-name doc-updates --feature [feature] --commit-msg "docs([scope]): [description]"
> ```
> Create branch before implementing: `git checkout -b feat/[feature]-t-N feat/[feature-name]`

---

## Quality checks
- All task branches merged and deleted
- Run log has no pending or in-progress items
- No unresolved issues carried forward

## Final push
If any tasks are marked failed in the run log: stop — do not push. Report unresolved items with report paths.

Otherwise: `git push origin feat/[feature-name]`

## Summary
Write `tmp/[feature]/[prefix]-summary.md`:
```markdown
# [feature] — session summary

**Branch:** feat/[feature-name]
**Date:** [date]

## Tasks
- T-1: [title] — done (1 review round) — tmp/[feature]/reviews/[t-1-short-name]-r1.md
- T-2: [title] — done (2 review rounds) — tmp/[feature]/reviews/[t-2-short-name]-r1.md, [t-2-short-name]-r2.md
- T-3: [title] — failed — tmp/[feature]/reviews/[t-3-short-name]-r1.md, [t-3-short-name]-r2.md, [t-3-short-name]-r3.md

## Files changed
- [list from git diff main...feat/[feature-name] --name-only]

## Review findings
[Per task: N Critical, N Important found in r1 — resolved/unresolved by final round]

## Notes
[Judgment calls: any files changed beyond the suggested list, approach deviations, unresolved issues, conflicts resolved]
```

Then print the final output to the user:
```
Done — [N] tasks, [N] failed.
Branch: feat/[feature-name]

Run log:  tmp/[feature]/[prefix]-run.md
Summary:  tmp/[feature]/[prefix]-summary.md

[any manual steps needed]
```

### Writing Principles

**Self-contained.** A fresh session must execute without asking anything. Test: "If a stranger pasted this, would they succeed?"

**Specify behavior, not replacements.** Describe what's wrong and what correct behavior looks like. Do not paste current code and exact replacements — that removes the subagent's thinking. The only exception: transformations with precision requirements a description can't convey (e.g., heredoc escaping rules, exact API signatures). Acceptance criteria are the quality gate, not the implementation guide.

**File paths are hints.** Suggest the most likely files, but instruct the subagent to use its own judgment — if it reads the files and finds the right change belongs elsewhere, it should do that and note it in the summary.

**Specific over general.** "Check YAML frontmatter has exactly 6 entries" beats "verify frontmatter looks correct." This applies to acceptance criteria, not to implementation steps.

**No open fields — exact values or explicit source.** Any field a subagent could "fill in with something appropriate" is a hallucination invitation. Two categories to watch: (1) **Counts in acceptance criteria** — verify the exact number by reading the actual files before writing it (`ls agents/dashboards/ | wc -l`), never estimate. (2) **Metadata and embedded content** — if a task writes a manifest, config, or file that embeds exact strings (author, repo URL, keywords, JSON config, heredoc content), either specify the exact value in the prompt or write "copy verbatim from `[source file]`, do not reconstruct from memory." "Replicate from X" is not strong enough — say "verbatim."

**Quality over speed.** Session length is not a concern. Every task gets full attention — a review subagent, a fix cycle, a clean commit. The goal is zero human rework after the session completes.

**Three roles, clean separation.** Orchestrator sequences and merges — never implements. Task subagent (T-N) implements, reviews, commits — never touches other tasks. Review subagent reads and reports — never fixes. Keep each role doing only its job.

**T-N prompts are self-contained.** Each task subagent prompt must include everything it needs: context, task definition, branch instructions (if parallel), the review subagent prompt, commit instructions. It cannot ask the orchestrator for clarification.

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

**Prompt:** tmp/[name]/[prefix]-prompt.md
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

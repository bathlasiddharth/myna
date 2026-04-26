---
name: myna-dev-execute-tasks
description: |
  Run the Myna dev task queue — reads pending tasks from tmp/tasks.md, executes them sequentially on a single fix branch, each with its own implement→review→fix loop, then creates one PR. Use when: "run the queue", "execute tasks", "process the queue", "work through the task list". Re-reads the queue before each task, so tasks added mid-run are picked up automatically.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Agent
effort: max
---

# Myna Execute Tasks

You are the queue orchestrator. Your job: run every pending task in `tmp/tasks.md` sequentially on a single branch, each via a dedicated task subagent, then create one PR. You do not implement anything yourself — you sequence, coordinate, and track.

---

## Step 1 — Read the Queue

Read `tmp/tasks.md`. If it doesn't exist:
```
tmp/tasks.md not found. Add tasks first with /myna-dev-task-add.
```
Stop.

If no pending tasks in the table:
```
No pending tasks in tmp/tasks.md.
```
Stop.

List what you found:
```
Found [N] pending task(s):
- Task [#]: [Title]
- Task [#]: [Title]
```

---

## Step 2 — Create the Branch

Get today's date:
```bash
date +%Y-%m-%d
```

Try `fix/[date]`:
```bash
git checkout -b fix/[date] 2>/dev/null && echo "ok" || echo "exists"
```

If exists, try `fix/[date]-2`, `fix/[date]-3`, etc. until one succeeds.

Record the branch name — all tasks run on this branch.

---

## Step 3 — Set Up the Run Log

Create the run folder and log:
```bash
mkdir -p tmp/[date]/reviews
```

Write `tmp/[date]/run.md`:
```markdown
# Queue run — [date]

**Branch:** fix/[date]

## Tasks
| # | Title | Status | Review rounds | Reports |
|---|---|---|---|---|
| [#] | [Title] | pending | — | — |
| [#] | [Title] | pending | — | — |

## Notes
(none yet)
```

---

## Step 4 — Execute Tasks

Process pending tasks in order (lowest task number first — FIFO).

**Before each task:** re-read `tmp/tasks.md`. This picks up any tasks added while the queue is running. If new pending tasks appeared below the current position, they will be processed in subsequent iterations of this loop.

### For each pending task:

#### 4a. Derive the short-name

From the task title, extract a 2-3 word identifier: lowercase, hyphen-separated, drop articles and prepositions. Used for review file naming.

Examples:
- "Add base guard to calendar skill" → `base-guard`
- "Fix email triage sort order" → `email-sort`
- "Update vault path in meeting skill" → `meeting-path`
- "Remove duplicate steering logic from capture" → `capture-steering`

#### 4b. Record the base commit

```bash
git rev-parse HEAD
```

Save this SHA as `BEFORE_SHA` for this task. This scopes the review diff to only this task's changes, not everything on the branch.

#### 4c. Update run log — mark in progress

Update the task's row in `tmp/[date]/run.md` to `in-progress`.

#### 4d. Spawn the task subagent

Use the Agent tool. Prompt:

```
You are a Myna dev task subagent. Implement the task below, then invoke /myna-dev-task-protocol to commit, review, fix, and push.

---
[paste the full task body from tmp/tasks.md — the entire ## Task [N] — [Title] section]
---

After implementing, invoke:
/myna-dev-task-protocol --branch fix/[date] --base [BEFORE_SHA] --criteria "[done-when assertions as comma-separated string]" --short-name [short-name] --feature [date] --commit-msg "[type]([scope]): [description]"

Branch fix/[date] already exists and you are already on it — do not create it.

Report back exactly as implement-task instructs: "Done — [N] round(s) — [paths]" or "Unresolved: [list] — [paths]".
```

Replace `[done-when assertions]` with the task's "Done when" bullets joined with ", ".

Replace `[type]([scope]): [description]` with a conventional commit message appropriate for the task. Use `fix` for bug fixes, `feat` for new behavior, `docs` for doc-only changes. Scope is the skill or area being changed.

Wait for the subagent to complete and report back.

#### 4e. Update after completion

**If "Done":**
- Update `tmp/tasks.md` table row: status → `done`, fill in review rounds and report paths
- Update `tmp/[date]/run.md` table row: same
- **Changelog:** if the task's `changelog` field is `yes` and a `changelog-line` field is present, append that line to the `[Unreleased]` section in `CHANGELOG.md` at the repo root. Read the current `[Unreleased]` block, append the line under it, and write back. Do this once per task at completion — not per commit within the task. Skip silently if `changelog: no` or the field is absent.
- Continue to the next task

**If "Unresolved":**
- Update `tmp/tasks.md` table row: status → `failed`, fill in report paths
- Update `tmp/[date]/run.md` table row: same; add to Notes section: "Task [#] failed: [unresolved issues]"
- Continue to the next task — do not block the queue

**If subagent errors or does not complete:**
- Update status to `error` in both files
- Note in run log
- Continue

---

## Step 5 — Write the Summary

After all pending tasks have been processed, write `tmp/[date]/summary.md`:

```markdown
# Queue run — [date]

**Branch:** fix/[date]
**Tasks processed:** [N]

## Results

| # | Title | Result | Review rounds | Reports |
|---|---|---|---|---|
| [#] | [Title] | done | [N] | [short-name]-r1.md[, -r2.md] |
| [#] | [Title] | failed | [N] | [short-name]-r1.md, ... |

## Review findings
[Per task: what was found in r1, what was resolved, what remained]

## Notes
[Any deviations, files changed beyond suggestions, judgment calls]
```

---

## Step 6 — Create PR or Report Failures

**If all tasks are done (no failures):**

```bash
git push origin fix/[date]
```

```bash
gh pr create \
  --title "fix: queue run [date] — [N] tasks" \
  --body "$(cat <<'EOF'
## Queue run [date]

[N] task(s) completed.

### Tasks
- Task [#]: [Title] — done ([N] review round(s))
- Task [#]: [Title] — done ([N] review round(s))

### Review summary
[Brief: total findings across all tasks, all resolved]

### Files changed
[git diff main...fix/[date] --name-only output]

Run log: tmp/[date]/run.md
Summary: tmp/[date]/summary.md
EOF
)"
```

Print the PR URL.

**If any tasks failed:**

Do not create the PR. Report:
```
Queue run complete — [N] done, [M] failed.

Failed tasks:
- Task [#]: [Title] — [unresolved issues] — [report paths]

The branch fix/[date] has been pushed with the completed tasks.
Resolve the failed tasks manually and push, or add them back to tmp/tasks.md and run the queue again.

Summary: tmp/[date]/summary.md
```

---

## What You Do Not Do

- Do not implement tasks yourself — every task goes to a subagent.
- Do not create per-task branches — all tasks run on `fix/[date]`.
- Do not merge anything to main — the PR is for human review.
- Do not stop the queue when a task fails — continue with the remaining tasks.
- Do not re-read the queue at the start and never again — re-read before each task.

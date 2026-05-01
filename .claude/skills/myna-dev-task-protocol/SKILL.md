---
name: myna-dev-task-protocol
description: |
  Shared commit→review→fix protocol for Myna dev task subagents. Not user-invocable. Called by T-N subagents after implementing their task — handles the full quality loop: commit, run myna-dev-review up to 3 rounds, fix Critical/Important issues between rounds, report back. Does NOT push — the orchestrator owns all remote pushes.
user-invocable: false
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Skill
---

# Myna Implement Task

This skill is the shared protocol for T-N subagents in Myna development sessions. It is never invoked directly by a user — only by task subagents spawned by `myna-dev-build-prompt` or `myna-dev-execute-tasks`.

You are a T-N subagent that has finished implementing. Your job now: commit your work, run the review loop, fix what's found, and report back clearly. Do NOT push — the orchestrator owns all remote pushes.

---

## Arguments

$ARGUMENTS

Parse the following from `$ARGUMENTS`:

| Argument | Example | Required |
|---|---|---|
| `--branch [name]` | `feat/config-ui-t-1` | Yes |
| `--base [name]` | `feat/config-ui` | Yes |
| `--criteria "[string]"` | `"criterion 1, criterion 2"` | Yes |
| `--short-name [name]` | `base-guard` | Yes — 2-3 words from task title, hyphen-separated, lowercase |
| `--feature [name]` | `config-ui` | Yes — matches the session folder under `tmp/` |
| `--commit-msg "[message]"` | `"feat(config-ui): add base guard"` | Yes — full conventional commit message |

If any argument is missing, stop immediately:
```
Missing argument: --[name]. This skill is called by T-N subagents — check the invocation in the execution prompt.
```

---

## Step 1 — Verify Branch

Confirm you are on the correct branch:
```bash
git branch --show-current
```

If not on `--branch`, check it out:
```bash
git checkout [branch]
```

---

## Step 2 — Commit

Stage only the files you changed. Never use `git add -A` or `git add .` — these pick up unrelated changes and files that should remain unstaged.

Read what changed:
```bash
git status --short
```

Add only files you intentionally modified or created during this task. Do not add files from other parts of the working tree you did not touch. Honor `.gitignore` — do not add ignored files.

Commit:
```bash
git commit -m "[commit-msg]"
```

If there is nothing to commit (clean working tree), skip the commit and proceed to Step 3 — the work may have been committed earlier in the subagent's session.

---

## Step 3 — Review Round 1

Create the reviews folder if it doesn't exist:
```bash
mkdir -p tmp/[feature]/reviews
```

Invoke the review:
```
/myna-dev-review --task "[feature]/[short-name]-r1" --base "[base]" --criteria "[criteria]"
```

The report is always saved at `tmp/[feature]/reviews/[short-name]-r1.md` — even if CLEAN.

Read the stdout summary line. Branch on result:
- **CLEAN** → jump to Step 5 (report back)
- **ISSUES FOUND** → proceed to Step 4a

---

## Step 4a — Fix and Round 2

Read `tmp/[feature]/reviews/[short-name]-r1.md`.

Fix every **Critical** and **Important** issue. For **Minor** and **Nitpick**: use judgment — fix if trivial and clearly correct, skip if uncertain or time-consuming.

Amend the original commit (same discipline as Step 2 — only files you changed):
```bash
git add [specific files]
git commit --amend --no-edit
```

Run round 2:
```
/myna-dev-review --task "[feature]/[short-name]-r2" --base "[base]" --criteria "[criteria]"
```

Report saves to `tmp/[feature]/reviews/[short-name]-r2.md`.

- **CLEAN** → jump to Step 5
- **ISSUES FOUND** → proceed to Step 4b

---

## Step 4b — Fix and Round 3

Read `tmp/[feature]/reviews/[short-name]-r2.md`.

Fix Critical and Important issues. Same judgment rule for Minor/Nitpick.

Amend the original commit:
```bash
git add [specific files]
git commit --amend --no-edit
```

Run round 3:
```
/myna-dev-review --task "[feature]/[short-name]-r3" --base "[base]" --criteria "[criteria]"
```

Report saves to `tmp/[feature]/reviews/[short-name]-r3.md`.

**Stop after round 3 regardless of result.** Do not run a fourth round.

Proceed to Step 5.

---

## Step 5 — Report Back

Determine which rounds ran (r1 always, r2 if ISSUES FOUND in r1, r3 if ISSUES FOUND in r2).

**If no unresolved Critical or Important issues after the final round:**
```
Done — [N] review round(s) — tmp/[feature]/reviews/[short-name]-r1.md[, [short-name]-r2.md][, [short-name]-r3.md]
```

**If unresolved Critical or Important issues remain after round 3:**
```
Unresolved: [list each issue briefly] — tmp/[feature]/reviews/[short-name]-r1.md, [short-name]-r2.md, [short-name]-r3.md
```

**If any files changed beyond what your T-N brief suggested:** append to the report:
```
Also changed: [file1], [file2]
```

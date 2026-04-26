# Contributing to Myna

Myna includes project-scoped dev skills in `.claude/skills/myna-dev-*/` that automate the full contributor workflow — from idea validation through implementation, review, and merge. These skills are only available when you have the Myna repo open in Claude Code; they are not installed to users' machines.

---

## Getting Started

Clone the repo and open it in Claude Code:

```bash
git clone https://github.com/bathlasiddharth/myna.git
cd myna
claude
```

All dev skills are automatically available as `/myna-dev-*` commands.

---

## Two Workflows

### Feature Path — Design to Implementation

Use when: proposing a new skill, redesigning an existing behavior, or any change where the right approach isn't obvious upfront.

```
/myna-dev-brainstorm [describe your idea or problem]
```

This runs an interactive design session. The skill:
1. Reads the relevant files (vision, decisions, actual skill code)
2. Validates the idea against vision fit, architecture constraints, and settled decisions
3. Explores options with trade-offs and a recommendation
4. Converges on a settled design

When design is settled, say **"generate prompt"** — the skill invokes `/myna-dev-build-prompt`, which writes a self-contained execution prompt to `tmp/[name]/[prefix]-prompt.md`.

Paste that prompt into a new Claude Code session. It runs autonomously: implements the changes, reviews its own work (up to 3 rounds), fixes Critical and Important issues, and pushes a feature branch. Open a PR when done.

**Skills in this path:**
| Skill | Purpose |
|-------|---------|
| `/myna-dev-brainstorm` | Interactive design session — validity-first, then options |
| `/myna-dev-build-prompt` | Packages design decisions into an autonomous execution prompt |
| `/myna-dev-task-protocol` | Internal — used by task subagents to commit, review, fix, and push |
| `/myna-dev-review` | Manual or task-mode review of agent artifacts |

---

### Fix Path — Queue to PR

Use when: fixing a known bug, making a small change, or after `/myna-dev-diagnose` has identified the problem and selected an approach.

**Step 1 — Diagnose:**
```
/myna-dev-diagnose [describe the problem or proposed change]
```

This validates the problem against vision and architecture, then generates options with a recommendation. Say **"add this"** when you've picked an option — it invokes `/myna-dev-task-add`.

**Step 2 — Add to queue:**
```
/myna-dev-task-add [describe the task]
```

Drafts a structured task entry (problem, correct behavior, done-when criteria) and shows it for approval before appending to `tmp/tasks.md`. You can also invoke this directly to add any task.

**Step 3 — Execute:**
```
/myna-dev-execute-tasks
```

Reads all pending tasks from `tmp/tasks.md` and runs them sequentially on a single `fix/[date]` branch. Each task:
- Gets its own subagent with full implementation context
- Goes through up to 3 review rounds, fixing Critical and Important issues between rounds
- Commits and reports back

After all tasks complete, creates a single PR for the full queue run. If any tasks fail, the branch is pushed with completed tasks and failures are reported — no PR created until all pass.

**Skills in this path:**
| Skill | Purpose |
|-------|---------|
| `/myna-dev-diagnose` | Validates problem, generates options — entry point for fixes |
| `/myna-dev-task-add` | Drafts and queues a task entry in `tmp/tasks.md` |
| `/myna-dev-execute-tasks` | Runs the queue on a fix branch, one task at a time, with review loops |
| `/myna-dev-task-protocol` | Internal — used by task subagents to commit, review, fix, and push |

---

## Periodic QA

Run these any time — not part of a specific change:

| Skill | What it does |
|-------|-------------|
| `/myna-dev-improve` | Full quality pipeline: lint until clean, then review → fix → verify |
| `/myna-dev-review` | Deep technical review of skills against 8 dimensions |
| `/myna-dev-consistency` | QA pass for vault format consistency across all skills |
| `/myna-dev-coverage` | Audit: does every feature from `docs/features/` have executable steps in a skill? |

---

## Dev Skill Inventory

| Skill | Invocable | Purpose |
|-------|-----------|---------|
| `myna-dev-brainstorm` | yes | Design session — validity-first |
| `myna-dev-build-prompt` | yes | Generate autonomous execution prompt |
| `myna-dev-diagnose` | yes | Validate problems and generate fix options |
| `myna-dev-task-add` | yes | Draft and queue a task entry |
| `myna-dev-execute-tasks` | yes | Run the task queue on a fix branch |
| `myna-dev-review` | yes | Deep review of agent artifacts |
| `myna-dev-improve` | yes | Full quality pipeline |
| `myna-dev-consistency` | yes | Cross-skill vault format audit |
| `myna-dev-coverage` | yes | Feature spec vs skill coverage audit |
| `myna-dev-task-protocol` | no | Internal — commit→review→fix→push protocol for task subagents |

---

## Conventions

- **Conventional commits:** `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`
- **Scope** is the skill or area being changed — `feat(calendar):`, `fix(capture):`. Never use task IDs as scope.
- **Never auto-commit** — only when explicitly asked.
- **Atomic commits** — one logical change per commit.
- **Never add Co-Authored-By lines.**

## Key Docs

| File | Purpose |
|------|---------|
| `docs/vision.md` | North star — what Myna is and is not |
| `docs/decisions.md` | Settled decisions — don't re-debate |
| `docs/design/architecture.md` | Runtime model, skill inventory, vault structure |
| `docs/design/foundations.md` | Vault folder structure, canonical file formats |
| `docs/features/` | Approved features per domain — authoritative source |

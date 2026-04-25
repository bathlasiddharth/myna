---
name: myna-dev-review
description: |
  Deep technical review of Myna agent artifacts — evaluates skills, steering skills, main agent, and config examples against 8 review dimensions. Produces a structured report with severity-rated issues, fix options, and convergence status. Report only — does not fix. Use when: "review the skills", "audit agents", "quality check", "run a review".
argument-hint: "[file paths, --uncommitted, or blank for full scope]"
user-invocable: true
effort: max
---

# Myna Dev Review

Deep technical review of Myna agent artifacts — evaluates every skill, steering skill, main agent, and config example against 8 review dimensions (frontmatter, description quality, instruction clarity, feature completeness, vault format correctness, safety, output usefulness, steering duplication). Produces a structured report with severity-rated issues, fix options, and convergence status. Report only — does not fix. Reviews find real issues and fix them directly in the review+fix cycle.

## Arguments

$ARGUMENTS

Parse for:
- **Scope:** file paths, glob patterns, `--uncommitted`, or no arguments (default scope below)
- **`--task "[label]"`:** task review mode — see below
- Anything else: error out with a note on valid usage

**Default scope** (no arguments): all of the following:
- `agents/skills/myna-*/SKILL.md` — all 24 feature skills
- `agents/skills/myna-steering-*/SKILL.md` — all 6 steering skills
- `agents/main.md`
- `agents/config-examples/*.yaml.example`

**`--uncommitted`:** resolve to only files with uncommitted git changes under `agents/`. Use `git status --short agents/` to identify them.

**`--task "[label]" --base "[base-branch]"`:** task review mode. Intended for use by task subagents (ST-N) in execution prompts. If `--task` is present but `--base` is missing, error out: "Task mode requires --base. Usage: --task \"label\" --base \"branch-name\""
- Scope: files changed on the current branch vs `[base-branch]`, resolved via `git diff [base-branch]...HEAD --name-only -- agents/`. This is reliable regardless of commit timing.
- Label: used for the output filename, e.g. `--task "beta-fixes-st-2"` → saves to `tmp/reviews/task-beta-fixes-st-2.md`
- Report: saved to `tmp/reviews/task-[label].md` (not `docs/reviews/`) — these files are gitignored. Create `tmp/reviews/` if it doesn't exist.
- No convergence tracking, no report numbering
- `--criteria "[comma-separated assertions]"`: optional task-specific acceptance criteria checked after the 8 dimensions
- Print a brief summary to stdout after saving: findings count by severity + CLEAN/ISSUES FOUND + path to report file

If the resolved scope is empty, error out: "No files matched the scope — check your arguments."

---

## Setup: Read Context Before Reviewing

Read ALL of these before touching any file in scope:

1. **`agents/skills/myna-steering-*/SKILL.md`** — all 6 steering skills. These are the shared behavioral rules. Every review dimension checks against them.

2. **`docs/architecture.md`** — specifically:
   - §2 Skill Inventory table: "Features covered:" line for each skill. This is the authoritative source for what each skill is responsible for.
   - §11 (or wherever "How Myna Runs on Claude Code" is): how the main agent, steering skills, and feature skills relate at runtime.

3. **`docs/design/foundations.md`** — vault folder structure, canonical file templates (project, person, meeting, draft, daily note, etc.), naming conventions, all entry formats (Timeline, Observation, Recognition, Task, Review Queue). Any vault path or format discrepancy is checked against this.

4. **`docs/features/*.md`** — the feature spec files. Cross-reference each in-scope skill against its owning feature spec to evaluate completeness. Match skill → feature spec via the architecture.md "Features covered:" line.

5. **`docs/decisions.md`** — settled decisions. Pay attention to: draft-never-send, vault-only writes, no skill chaining, deferred features (don't raise issues for out-of-scope things), Golden Rule, D046 (Claude-first).

6. **`docs/reviews/`** — all previous review/fix/verify reports. Scan for:
   - Issues that a previous fix report pushed back on with documented reasoning — do NOT re-raise those.
   - Patterns that were previously fixed — check if they've regressed.

Build a mental map of: each in-scope skill → its feature owner(s) → the vault destinations it writes to → the steering skills that govern its behavior. You need all three layers to review well.

---

## Review Methodology

**One subagent per skill/file.** Each file gets its own dedicated reviewer subagent with full context. This prevents later files getting shallow attention as context fills up.

**If scope has 1–3 files:** review them directly in the main context — skip subagents.

**If scope has 4+ files:** spawn one subagent per file, all in parallel. Yes, this means up to 31 parallel subagents for a full review. Thoroughness matters more than speed.

---

## Review Dimensions

Each file is evaluated against all 8 dimensions:

### Dimension 1 — Frontmatter Correctness
Valid fields, name matches directory, description under 250 chars, user-invocable set correctly, argument-hint present for user-facing skills.

### Dimension 2 — Description Quality for Auto-Discovery
Can Claude determine when to load this skill from the description alone? Differentiates from sibling skills? Includes natural trigger phrases?

### Dimension 3 — Instruction Clarity
Can Claude execute every step without guessing? No vague verbs, no ambiguous file paths, no missing branch criteria, no implicit assumptions.

### Dimension 4 — Feature Completeness
Cross-reference architecture.md "Features covered:" against feature specs. Every assigned feature has executable steps (read → decide → write), not just a mention.

### Dimension 5 — Vault Format Correctness
Every vault write matches canonical formats in foundations.md. File paths, section names, entry formats, provenance markers, config field names all correct.

### Dimension 6 — Safety
Draft-never-send, vault-only writes, no skill chaining, external content delimiters, calendar three-layer protection, bulk write confirmation, append-only sections.

### Dimension 7 — Output Usefulness
Specific and actionable output. File links (Obsidian URI + disk path). No AI tells. Follow-up suggestions as text, not auto-invocations.

### Dimension 8 — Steering Duplication
Feature skills should not duplicate rules already in steering skills. Flag duplicates with citations.

---

## Issue Severity

- **Critical:** breaks functionality, safety violation, skill undiscoverable
- **Important:** Claude would struggle to execute, feature missing from spec, significant format drift
- **Minor:** polish issue, Golden Rule violation, slight inconsistency
- **Nitpick:** style preference, cosmetic only

Each non-Nitpick issue gets three options and a recommendation. Quote specific text, cite line numbers, ground in references.

**Do not manufacture findings.** If a dimension is clean, say "no issues."

---

## Report

**Standard mode:** save to `docs/reviews/review-{NNN}.md` (next number in sequence).

**Task mode (`--task`):** save to `tmp/reviews/task-[label].md`. Create `tmp/reviews/` if it doesn't exist.

After saving, print summary:

Standard mode:
```
Myna Review — Cycle {NNN} complete.
Report: docs/reviews/review-{NNN}.md

{N} Critical  {N} Important  {N} Minor  {N} Nitpick
Convergence: {CONVERGED | CONTINUE}
Files reviewed: {count}
```

Task mode:
```
Task Review complete.
Report: tmp/reviews/task-[label].md

{N} Critical  {N} Important  {N} Minor  {N} Nitpick
{CLEAN | ISSUES FOUND}
Files reviewed: {count}
```

Convergence (standard mode only) = 0 Critical + 0 Important.

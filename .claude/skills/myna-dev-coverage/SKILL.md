---
name: myna-dev-coverage
description: |
  Audit Myna skills for feature coverage — does every feature from docs/features/*.md have executable instructions in its owning skill? Not "mentioned" — actually covered with read/decide/write steps. Saves a coverage report. Use when: "coverage audit", "are all features implemented?", "check feature coverage".
argument-hint: "[file paths, --uncommitted, or blank for full scope]"
user-invocable: true
effort: max
---

# Myna Dev Coverage

Audit Myna skills for feature coverage — does every feature from `docs/features/*.md` have executable instructions in its owning skill? Not "mentioned" — actually covered with steps Claude would follow.

## Arguments

$ARGUMENTS

Parse for:
- No arguments: all feature skills + steering + main + config examples
- Specific paths/globs: check only matching skills (always read ALL feature spec files regardless)
- `--uncommitted`: only skills with uncommitted changes
- Anything else: error out

## Setup

Read ALL of these before auditing:
1. `docs/design/architecture.md` — extract "Features covered:" for every skill. Build complete map: skill → features.
2. All feature spec files in `docs/features/*.md`
3. `docs/design/foundations.md` — vault structure, canonical templates
4. Every skill file in scope

## Coverage Grades

- **FULL** — executable read → decide → write steps for every meaningful behavior. Minor defaults Claude handles are fine.
- **PARTIAL** — core behavior covered but specific behaviors/edge cases the spec explicitly calls out are missing.
- **NONE** — assigned in architecture but no executable steps in the skill body.

## What "Executable" Means

A sub-feature has executable steps if the skill has:
- Specific file paths to read
- Specific data to extract or decisions to make
- Specific files/sections to write to
- Concrete output format

NOT executable: named in a comment, described only in a worked example, covered by a vague verb.

## Methodology

For 1-4 skills: audit directly. For 5+: spawn one subagent per skill, all in parallel.

Each audit: build sub-feature checklist from spec → grade each against skill body → report gaps with quotes from both spec and skill.

## Report

Save to `tmp/reviews/coverage-{NNN}.md`.

Print summary:
```
Myna Feature Coverage — Cycle {NNN} complete
Report: tmp/reviews/coverage-{NNN}.md

{total} sub-features checked across {n} skills
FULL: {count} ({pct}%) | PARTIAL: {count} ({pct}%) | NONE: {count} ({pct}%)
Overall coverage: {pct}%
```

## Rules
- Feature spec files are always read in full regardless of scope.
- Non-functional requirements are enforced by steering skills — don't audit feature skills against them.
- "Mentioned" is not coverage.
- Do not flag deferred features as gaps (check decisions.md).
- Do not manufacture gaps. Different implementation that produces correct output = FULL.
- Steering-covered behaviors relied on correctly by feature skill = FULL.

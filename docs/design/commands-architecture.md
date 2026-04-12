# Myna Review Commands — Architecture

## Overview

Six slash commands that create a self-improvement loop for Myna's agent artifacts:

```
/myna-review → (optionally edit report) → /myna-fix → /myna-verify → done or repeat
```

Fast path: `/myna-improve` runs the full loop autonomously.

## Commands

| Command | Role | Produces |
|---------|------|----------|
| `/myna-review` | The Critic — finds real issues | `review-{NNN}.md` |
| `/myna-fix` | The Implementer — fixes or pushes back | `fix-{NNN}.md` + code changes |
| `/myna-verify` | The Closer — confirms fixes worked | `verify-{NNN}.md` |
| `/myna-coverage` | Feature audit — spec vs skill | `coverage-{NNN}.md` |
| `/myna-consistency` | Format audit — cross-skill | `consistency-{NNN}.md` |
| `/myna-improve` | Full pipeline — autonomous loop | All of the above |

## Report Storage

All reports are saved to `docs/reviews/` with cycle-numbered filenames:

```
docs/reviews/
  phase1-review.md    # Pre-command reviews (moved here)
  phase1-review-2.md
  review-001.md       # First review cycle
  fix-001.md        # Fixes for first review
  verify-001.md     # Verification of first fixes
  review-002.md     # Second review cycle (if verify said NOT CLEAN)
  fix-002.md
  verify-002.md
  coverage-001.md   # Standalone coverage audit
  consistency-001.md # Standalone consistency audit
```

Cycle numbers are shared across review/fix/verify triads. Coverage and consistency have their own numbering.

## Targeting

All commands accept the same targeting arguments via `$ARGUMENTS`:

| Argument | Meaning | Example |
|----------|---------|---------|
| File path(s) | Review only those files | `agents/skills/sync.md` |
| Directory | All files in directory | `agents/skills/` |
| Glob pattern | Matching files | `agents/skills/*.md` |
| `--uncommitted` | Files with uncommitted changes | |
| (none) | All agent artifacts | |

Default scope (no arguments): `agents/main.md`, `agents/steering/*.md`, `agents/skills/*.md`, `agents/config-examples/*.yaml.example`, `agents/myna-agent-template.md`

## Issue ID Format

Issues use severity-prefixed IDs: `[C01]`, `[I01]`, `[M01]`, `[N01]`

- **C** = Critical — breaks functionality, violates architecture, data loss risk
- **I** = Important — degrades quality, missing features, vague procedures
- **M** = Minor — polish, wording, unnecessary lines
- **N** = Nitpick — style preference

## Convergence

The loop stops when a review shows 0 Critical + 0 Important issues (the "convergence signal"). This typically takes 2-3 cycles for a mature codebase.

## Oscillation Prevention

Each command reads previous cycle reports before acting:

1. **/myna-review** reads prior fix reports. If a fix report said "No change — [reasoning]" for an issue, the reviewer does NOT re-raise it unless there's new evidence.
2. **/myna-fix** reads the review and can push back with "No change — [reasoning]" when a recommendation would make things worse.
3. **/myna-improve** monitors issue counts per cycle. If cycle N finds MORE issues than N-1, it stops to avoid runaway oscillation.

## Evaluation Dimensions

Reviews evaluate agent artifacts on 10 Myna-specific dimensions:

1. **Feature Completeness** — every feature from `docs/features/*.md` has executable steps in its skill
2. **Instruction Clarity** — Claude would know what to do at every step
3. **Golden Rule Compliance** — every line earns its place (no teaching Claude what it already knows)
4. **Cross-File Consistency** — shared vault destinations get identical formatting
5. **Edge Cases** — first run, missing files, ambiguous entities, empty results
6. **Safety** — draft-never-send, vault-only, no chaining, calendar protection
7. **Output Usefulness** — helps a tech professional, not generic AI output
8. **Claude Behavioral Fit** — counteracts Claude's tendencies
9. **Provenance & Conventions** — markers, date+source, append-only
10. **Config & System** — toggles, degradation, config field correctness

## Context Loading

Every command reads project docs before acting:

- `docs/architecture.md` — skill inventory, feature mapping
- `docs/design/foundations.md` — vault structure, canonical formats
- `docs/features/*.md` — authoritative feature specs
- `docs/instructions/autonomous-build-plan.md` — Golden Rule
- `agents/steering/*.md` — cross-cutting rules
- `docs/decisions.md` — settled decisions (what's in scope, what's deferred)

## Mode Flags

### /myna-fix modes

| Flag | Behavior |
|------|----------|
| (default) | Fix each issue or push back with reasoning |
| `--auto` | Implement all recommendations, no pushback |
| Issue IDs | Only fix listed issues: `/myna-fix C01 I03 I07` |

### /myna-improve flags

| Flag | Behavior |
|------|----------|
| `--cycles N` | Max iteration cycles (default 3) |
| (targeting) | Same as other commands |

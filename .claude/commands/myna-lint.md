Run mechanical lint checks on Myna's agent artifacts. Fast, deterministic, repeatable — complements the LLM-based review commands.

## Execution

Run the lint script:

```
bash scripts/lint-agents.sh
```

Report the results to the user.

## Arguments

$ARGUMENTS

- **No arguments:** run all checks, report results
- **`--fix`:** after running checks, fix self-containment violations (see below)
- **`--save`:** save findings as a `## Phase 0 — Lint` section in `docs/reviews/review-{NNN}.md` (auto-determines next number from existing files)

## Checks

The script runs 8 checks:

1. **Self-containment** — no references to `foundations.md`, `architecture.md`, `decisions.md`, `docs/` paths, or decision IDs (D001-D047) in deployed artifacts. These don't exist at runtime.
2. **Required sections** — every skill has Purpose, Triggers, Inputs, Procedure, Output, Rules
3. **Worked examples** — every skill has an Example section
4. **Skill directory cross-reference** — main.md skill table matches actual skill files
5. **Steering file existence** — all 4 steering files present
6. **Safety keywords** — flags "send"/"post"/"deliver" outside refusal context (warnings only)
7. **MCP server** — source and package.json exist
8. **Config examples** — all 6 .yaml.example files present

Errors cause FAIL status. Warnings are informational (manual review).

## Fix Mode

If `--fix` was requested and there are self-containment errors:

For each **design doc reference** (e.g., "use the draft file format from foundations.md section 2.9"):
1. Read the referenced section from the design doc
2. Inline the relevant content directly into the agent artifact, replacing the reference
3. The artifact must be self-contained after the fix — no reader should need to look elsewhere

For each **decision ID** (e.g., "D003", "D018"):
1. Read the decision from `docs/decisions.md`
2. Replace the decision ID with the operative rule it represents
3. Example: replace "Absolute — D003" with the actual three-layer protection rule, or simply remove the ID if the rule is already stated in context

After fixing, re-run the lint to confirm all self-containment errors are resolved.

For non-self-containment errors (missing sections, missing examples), list them and suggest what to add — these require manual judgment, not mechanical fixes.

## Save Mode

If `--save` was requested, write findings as a `## Phase 0 — Lint` section in `docs/reviews/review-{NNN}.md`. Check existing review files in `docs/reviews/` to determine the next number. Format:

```
## Phase 0 — Lint

### Errors Found

| # | Check | File | Issue | Fix Applied |
|---|-------|------|-------|-------------|
| 1 | {check name} | {file} | {description} | {what was done, or "unfixed" if --fix not used} |

### Warnings

| # | Check | File | Issue | Action |
|---|-------|------|-------|--------|
| 1 | {check name} | {file} | {description} | {noted / not concerning / flagged for review} |

**Lint summary:** {n} errors found, {n} fixed. {n} warnings reviewed. Final status: PASS / {n} errors remaining / {n} warnings remaining.
```

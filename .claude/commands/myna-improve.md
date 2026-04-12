Run the complete improvement pipeline autonomously. This is a long-running command — each phase deserves full attention. Never rush, never cut corners, never skim files. Read every file completely, think through every issue carefully, and produce thorough work at each step.

## Arguments

$ARGUMENTS

Parse arguments for:
- **`--cycles N`:** Maximum review-fix-verify cycles (default 3). Beyond 3, diminishing returns and oscillation risk increase.
- **Targeting:** Same as other commands — file paths, directories, glob patterns, `--uncommitted`, or default to all agent artifacts. Pass targeting through to each phase.

## Setup

1. Read the methodology from the individual command files — read each one IN FULL, do not skim:
   - `.claude/commands/myna-lint.md` — lint methodology (new: Phase 0)
   - `.claude/commands/myna-review.md` — review methodology
   - `.claude/commands/myna-fix.md` — fix methodology
   - `.claude/commands/myna-verify.md` — verify methodology

2. Read project context once (shared across all phases) — read each one IN FULL:
   - `docs/architecture.md` — skill inventory, feature mapping
   - `docs/design/foundations.md` — canonical formats, templates
   - `docs/features/*.md` — all 10 feature spec files
   - `docs/instructions/autonomous-build-plan.md` — Golden Rule (lines 9-45)
   - `agents/steering/*.md` — all 4 steering files
   - `docs/decisions.md` — settled decisions

3. Check `docs/reviews/` for previous reports to determine starting cycle number.

4. Announce: "Starting improvement pipeline (max {N} cycles) targeting {scope description}."

---

## Phase 0 — Lint (runs once, before any review cycles)

Mechanical checks first. These catch structural issues that don't need LLM judgment — fixing them before the review prevents the reviewer from wasting time on things a grep could find.

### Step 0a: Run the lint

Execute: `bash scripts/lint-agents.sh`

Read the full output. Categorize every error and warning.

### Step 0b: Fix self-containment violations

For each self-containment error (design doc references, decision IDs):

**Design doc references** (e.g., "use the draft file format from foundations.md section 2.9"):
1. Read the referenced design doc section IN FULL — understand what content it provides
2. Read the agent artifact file IN FULL — understand the surrounding context
3. Inline the relevant content directly into the artifact, replacing the reference
4. The artifact must be completely self-contained after the fix — a fresh Claude session with only the artifact and steering files must be able to execute it without needing any design doc
5. Re-read the modified section to verify it reads naturally and is complete

**Decision IDs** (e.g., "D003", "D018"):
1. Read the full decision from `docs/decisions.md` — understand the operative rule
2. Read the artifact file to see how the ID is used in context
3. If the rule is already stated in full and the ID is just a label: remove the ID reference
4. If the ID is a shorthand for a rule not fully stated: inline the operative rule, remove the ID
5. Re-read the modified section to verify the rule is clear without the ID

### Step 0c: Fix structural errors

For each non-self-containment error from the lint:

**Missing skill sections** (Output, etc.):
1. Read the FULL skill file to understand what the skill does
2. Read the skill file format spec from `.claude/commands/myna-review.md` (the Required Sections list)
3. Read 2-3 other skill files that DO have the missing section — understand the pattern and depth
4. Write the missing section with appropriate content for this skill
5. Re-read the full skill file to verify the new section fits naturally

**Missing worked examples:**
1. Read the FULL skill file to understand all workflow paths
2. Read 2-3 other skills' worked examples to understand the expected depth and format
3. Write a realistic worked example showing: user input → what the skill reads → what it decides → what it writes → what it tells the user
4. For skills with multiple workflow paths, write one example per major path
5. Re-read the examples to verify they're realistic and cover the key paths

### Step 0d: Re-run lint and commit

1. Re-run: `bash scripts/lint-agents.sh`
2. If errors remain: fix them. Repeat until lint passes (0 errors).
3. Warnings are informational — review each one, note any that are genuinely concerning, but don't block on them.
4. Hold lint findings in memory — they will be written as a "Lint" section at the top of the first cycle's review file (`docs/reviews/review-{NNN}.md`) in Phase 1.
5. Do NOT commit yet — all changes will be committed once at the end of the pipeline.
6. Announce: "Phase 0 complete. Lint: {original errors} errors fixed, {warnings} warnings reviewed. Moving to review cycles."

---

## Review-Fix-Verify Cycles (Phase 1-3, repeated up to max cycles)

For each cycle (1 to max cycles):

### Phase 1 — Review

**This is the most important phase. Do not rush it.** Read every file in scope completely. Cross-reference every feature. Think about every edge case. A shallow review produces shallow fixes that create oscillation.

Follow the FULL review methodology from `.claude/commands/myna-review.md`:

1. Read every file in scope IN FULL — not just the sections you think might have issues
2. For each file, evaluate against ALL 10 dimensions:
   - Feature Completeness — cross-reference against `docs/features/*.md` sub-features one by one
   - Instruction Clarity — trace through each procedure step as if you were Claude executing it
   - Golden Rule Compliance — for each line, ask "would Claude get this wrong without it?"
   - Cross-File Consistency — compare output formats against foundations.md canonical templates
   - Edge Cases — mentally simulate: empty vault, missing files, no calendar MCP, re-run
   - Safety — trace every write path, verify draft-never-send, vault-only, no chaining
   - Output Usefulness — imagine the output for a real user scenario
   - Claude Behavioral Fit — check for anti-verbosity, anti-over-confirmation, scope boundaries
   - Provenance & Conventions — verify marker usage, date+source format, append-only
   - Config & System — check toggle usage, field names, graceful degradation
3. Read previous cycle reports for oscillation prevention — do NOT re-raise pushed-back issues without new evidence
4. For each issue found: think carefully about severity (is it really Critical, or just Important?), write a clear problem statement with quoted text, provide 2-3 genuine options, and recommend one with reasoning
5. Save as `docs/reviews/review-{NNN}.md`. If this is cycle 1, include lint findings at the top under a `## Phase 0 — Lint` section:

```
## Phase 0 — Lint

### Errors Found and Fixed

| # | Check | File | Issue | Fix Applied |
|---|-------|------|-------|-------------|
| 1 | {check name} | {file} | {description} | {what was done} |

### Warnings Reviewed

| # | Check | File | Issue | Action |
|---|-------|------|-------|--------|
| 1 | {check name} | {file} | {description} | {noted / not concerning / flagged for review} |

**Lint summary:** {n} errors fixed, {n} warnings reviewed. Final status: PASS / {n} warnings remaining.
```

**Early exit:** If the review finds 0 Critical + 0 Important issues, announce convergence and skip to the final summary.

### Phase 2 — Fix (Auto Mode)

**Do not rush fixes.** Each fix changes a shipped artifact. A careless fix creates the next cycle's issues.

Follow the FULL fix methodology from `.claude/commands/myna-fix.md` in auto mode:

1. For each issue (Critical first, then Important, Minor, Nitpick):
   a. Read the affected file IN FULL — not just the problem area
   b. Understand the surrounding context before editing
   c. Implement the recommended option
   d. After editing, re-read the changed section AND adjacent sections to verify:
      - The fix makes sense in context
      - No contradictions introduced
      - The fix doesn't break a different evaluation dimension
   e. Check: did this fix affect a shared vault destination? If so, verify other skills that write to the same destination still match
2. After all fixes:
   a. Re-read EVERY modified file in full one more time
   b. Cross-check: if you changed a format, do all skills using that format still agree?
   c. If any fix introduced a new problem, fix it immediately and document both
3. Save fix report as `docs/reviews/fix-{NNN}.md`
4. Do NOT commit yet — all changes will be committed once at the end of the pipeline.

### Phase 3 — Verify

**Verification is not a rubber stamp.** Re-read the actual files — do not just check that edits were made. Confirm the edits actually resolve the concern.

Follow the FULL verify methodology from `.claude/commands/myna-verify.md`:

1. For each issue marked "Implemented":
   a. Read the file at the referenced location — what does it look like NOW?
   b. Does it actually address the review's concern? Or was the fix superficial?
   c. Is the fix correct against canonical formats and steering rules?
   d. Verdict: Resolved or Not Resolved (with explanation)
2. Regression check:
   a. Read every modified file in full
   b. Cross-skill consistency check on shared destinations
   c. Safety check — no accidental send/post/write-outside-vault paths introduced
3. Save verify report as `docs/reviews/verify-{NNN}.md`

**If CLEAN:** Announce and proceed to final summary.
**If NOT CLEAN and more cycles remain:** Continue to next cycle.
**If NOT CLEAN and no cycles remain:** Stop and note remaining issues.

### Oscillation Guard

Before starting each cycle after the first:
1. Compare the blocking issue count (Critical + Important) from the current review against the previous cycle
2. If current >= previous: STOP immediately
3. Announce: "Cycle {N} found {current} blocking issues vs {previous} in cycle {N-1}. Stopping to prevent oscillation. Review the reports manually."

---

## Commit

After the pipeline completes, create a single commit containing only the files the pipeline modified (agent artifacts and review reports). Do NOT include unrelated files. Stage files explicitly by name.

Commit message: `fix(agents): improvement pipeline — {n} lint errors fixed, {n} review issues fixed across {n} cycles`

## Final Summary

After committing, produce a comprehensive summary:

```
## Improvement Summary

**Cycles completed:** {N} of {max}
**Stop reason:** {Converged | Max cycles reached | Oscillation detected}

### Phase 0 — Lint
- Errors found and fixed: {n}
- Warnings reviewed: {n}

### Issues by Severity (all review cycles combined)

| Severity | Found | Fixed | Remaining |
|----------|-------|-------|-----------|
| Critical | {n} | {n} | {n} |
| Important | {n} | {n} | {n} |
| Minor | {n} | {n} | {n} |
| Nitpick | {n} | {n} | {n} |

### Files Modified
{list of all files changed across all phases}

### Reports Generated
{list of all report files created}
```

## Pacing Rules

These rules exist to prevent the natural tendency to accelerate through later phases as fatigue sets in. Every phase matters equally.

1. **Never skim a file.** If a phase says "read file X", read all of it. Not the first 50 lines. Not a summary. All of it.
2. **Never skip a dimension.** The review has 10 evaluation dimensions. Evaluate every file against every dimension. If a dimension doesn't apply to a file, note "N/A" — don't just skip it silently.
3. **Never copy a fix from the review recommendation without thinking.** The review suggests options. Before implementing, re-read the file and verify the suggestion still makes sense in the full context.
4. **Never verify by checking that an edit was made.** Verify by reading what the file says NOW and judging whether it addresses the original concern.
5. **Quality over speed.** This command is expected to run for a long time. The user walked away. They want to come back to genuinely improved artifacts, not a fast report that missed issues. Take the time each phase needs.
6. **Announce progress between phases.** After each phase completes, output a brief status: what was done, what was found, what comes next. This creates a readable log the user can review.

## Output

After the final summary, tell the user:
1. Overall result: "Artifacts improved" or "Artifacts partially improved — {n} issues remain"
2. All report file paths
3. If issues remain: suggest running `/myna-review` manually to inspect what's left
4. Run `bash scripts/lint-agents.sh` one final time and report: "Final lint: {n} errors, {n} warnings"

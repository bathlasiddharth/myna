Verify that fixes from /myna-fix actually resolved the issues without introducing regressions. This closes the review-fix-verify loop.

## Arguments

$ARGUMENTS

Parse arguments: cycle number (e.g., `3` or `003`) to verify a specific cycle. Default: verify the latest cycle (highest-numbered `fix-*.md`).

## Setup

1. Find the fix report to verify:
   - If a cycle number is given, look for `fix-{NNN}.md`
   - Otherwise, find the highest-numbered `fix-*.md` in `docs/reviews/`
   - If no fix report exists, error: "No fix report found. Run /myna-fix first."

2. Find the corresponding review report (`review-{NNN}.md` with the same cycle number).

3. Read both reports in full.

4. Read project context:
   - `docs/design/foundations.md` — canonical entry formats (the source of truth for formatting)
   - `agents/steering/*.md` — conventions, safety rules (the source of truth for rules)
   - `docs/architecture.md` — feature-to-skill mapping

5. Read all files that were modified according to the fix report.

## Verification

For each issue in the review report, check the fix report's action and verify against the actual file:

### For issues marked "Implemented":

1. Read the file at the location referenced in the review's "Problem" field
2. Does the file now address the concern? Look for the specific change described in the fix report.
3. Is the fix correct? Does it match the canonical format from foundations.md? Does it follow the conventions from steering files?
4. Is the fix complete? Or was it superficial — changing the obvious part but missing a deeper issue?
5. Verdict: **Resolved** (fix is correct and complete) or **Not Resolved** (with explanation of what's still wrong)

### For issues marked "No change" (pushed back):

1. Read the reasoning in the fix report
2. Is the pushback sound? Does it cite specific project context (decisions, Golden Rule, architecture)?
3. Read the actual file — does the current implementation support the pushback's reasoning?
4. Verdict: **Accepted** (pushback reasoning is sound) or **Rejected** (pushback is wrong — with explanation)

### For issues marked "Skipped":

Note as "Skipped — not verified" and move on.

## Regression Check

After checking individual issues:

1. Read all files modified by the fix
2. For each modified file, check: do the changes fit naturally with the surrounding content? Any contradictions introduced?
3. Cross-skill consistency: if a format was changed in one skill, do other skills writing to the same vault destination still produce matching output? Check at minimum:
   - Project timeline entry format across process, process-meeting, capture
   - Person observation format across process, process-meeting, capture
   - Contributions log format across wrap-up, process, process-meeting, capture, self-track
   - Task TODO format across process, process-meeting, capture
4. Safety check: did any fix accidentally introduce a path that sends, posts, or writes outside the vault?
5. List any regressions found with the same detail level as review issues (file, problem, impact)

## Verify Report

Save as `docs/reviews/verify-{NNN}.md` using the same cycle number.

Report structure:

**Header:** Title (`Myna Verify Report — Cycle {NNN}`), date, references to review and fix reports.

**Issue Verification section:** For each issue:
- Issue ID and title
- Fix action (Implemented/No change/Skipped)
- Verification verdict (Resolved/Not Resolved/Accepted/Rejected/Skipped)
- Evidence — what the file looks like now, or why the pushback is sound/unsound

**Regressions section:** Any new issues introduced by the fixes. Each regression gets a description, affected file, and impact.

**Verdict:**
- **CLEAN** — all implemented fixes are resolved, all pushbacks are accepted, no regressions found. Recommend: stop iterating.
- **NOT CLEAN** — with a list of what's still wrong (unresolved fixes, rejected pushbacks, regressions). Recommend: run `/myna-review` again to pick up remaining issues.

Include counts: issues verified, resolved, not resolved, pushbacks accepted, pushbacks rejected, regressions found.

## Output

Tell the user:
1. Verify report path
2. Verdict: CLEAN or NOT CLEAN
3. Counts: resolved, not resolved, regressions
4. Next step: "Artifacts are clean — no further iteration needed" or "Run `/myna-review` again to address remaining issues"

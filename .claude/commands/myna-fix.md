Read the latest Myna review report and implement fixes. You are a thoughtful implementer — not a blind executor. You can push back on recommendations that would make things worse.

## Arguments

$ARGUMENTS

Parse arguments for:
- **`--auto`:** Implement all recommendations without pushback. For when the user trusts the reviewer.
- **Issue IDs** (e.g., `C01 I03 I07`): Only fix the listed issues. Skip all others.
- **No flags:** Default mode — for each issue, implement the recommended fix OR push back with documented reasoning.

## Setup

1. Find the latest review report in `docs/reviews/` (highest-numbered `review-*.md`). If none exists, error: "No review report found. Run /myna-review first."

2. Read the review report. Note all issues, their severities, recommended options, and affected files.

3. Read project context:
   - `docs/architecture.md` — skill inventory, feature mapping
   - `docs/design/foundations.md` — canonical entry formats, templates
   - `docs/instructions/autonomous-build-plan.md` — Golden Rule (lines 9-45)
   - `agents/steering/*.md` — conventions, safety rules
   - `docs/decisions.md` — settled decisions

4. Read all files referenced in the review's issues.

5. If previous fix reports exist, read them to understand the history of decisions.

## Fix Methodology

Process each issue from the review (Critical first, then Important, then Minor, then Nitpick):

### Default Mode

For each issue:

**Option A — Implement the fix:**
1. Read the affected file(s) in full
2. Implement the recommended option (or choose a different option if you have good reason — document why)
3. After editing, re-read the changed section to confirm it makes sense in context
4. Check: did the fix introduce any inconsistency with other files that write to the same vault destination?
5. Record: which option was implemented and why

**Option B — Push back:**
If the recommended fix would make things worse, or the current approach is already correct:
1. Document: "No change — {specific reasoning}"
2. Explain what the reviewer missed or why the current approach is better
3. Pushback must be specific: "The reviewer suggests X, but this would break Y because Z" — not "I think it's fine as-is"

### Auto Mode (--auto)

Implement the recommended option for every issue. No pushback. Still document what was done.

### Selective Mode (issue IDs)

Only process the listed issue IDs. Skip all others (mark as "Skipped — not selected").

## Self-Verification

After all fixes are applied:

1. Re-read each modified file in full
2. Check that the fixes are internally consistent (no contradictions within the same file)
3. Check cross-file consistency: if you changed a format in one skill, do other skills writing to the same destination still match?
4. If a fix introduced a new problem, fix it immediately and document both the fix and the correction

## Fix Report

Determine the cycle number from the review being fixed (if the review is `review-003.md`, the fix report is `fix-003.md`). Save as `docs/reviews/fix-{NNN}.md`.

Report structure:

**Header:** Title (`Myna Fix Report — Cycle {NNN}`), date, mode (default/auto/selective), reference to review report.

**Actions section:** For each issue from the review:

Each action entry contains:
- Issue ID and title (matching the review)
- **Action**: "Implemented Option {N}" or "No change" or "Skipped — not selected"
- **Changes**: What was changed (or reasoning for no change)
- **Files modified**: List of files touched for this issue

**Summary:** Total issues addressed, total pushed back, total skipped, list of all files modified.

## Git Commit

After all fixes are applied and the fix report is saved, create a single atomic commit:
- Stage all modified agent artifact files AND the fix report
- Commit message: `fix(agents): address review cycle {NNN} — {n} issues fixed`
- Include a body listing the issue IDs addressed

If no fixes were made (all pushed back), skip the commit and note this.

## Output

Tell the user:
1. Fix report path
2. Count of issues fixed, pushed back, and skipped
3. Files modified
4. Next step: "Run `/myna-verify` to confirm fixes are correct"

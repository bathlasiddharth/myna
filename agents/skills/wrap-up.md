# Wrap-Up

## Purpose

Closes out the day or the week — compares what you planned against what happened, detects contributions worth tracking, moves unfinished items forward, and generates weekly summaries.

## Triggers

- End of day: "wrap up", "end my day", "close out today"
- Weekly summary: "weekly summary", "summarize my week"

## Inputs

- Today's daily note `Journal/DailyNote-{today}.md` (sync snapshots, task checkboxes, meeting checkboxes)
- Task items across project files (completed today, still open)
- Project timelines (decisions logged today)
- Meeting files processed today (via process-meeting)
- `Journal/contributions-{monday-date}.md` — existing contributions (for dedup)
- `ReviewQueue/review-self.md` — for uncertain contribution routing
- `_system/config/workspace.yaml` — user role (determines contribution categories), feature toggles
- Tomorrow's daily note (if it exists — for appending unfinished items)
- For weekly summary: all daily notes for the current week, weekly note, contributions log, project files

## Procedure

### End of Day Wrap-Up

1. Read today's daily note. Find the **first** sync snapshot (earliest `## Sync —` section) and extract the Immediate Attention items. These are what was planned.

2. Compare planned vs actual:
   - **Completed:** tasks marked done, meetings checked off, delegations resolved since the first sync
   - **Not started:** items still open with no progress
   - **Partially done:** items with some activity but not completed (e.g., task has subtasks, some checked)

3. Detect contributions from today's completed work:
   - Scan completed tasks, decisions logged in project timelines, meetings debriefed (via process-meeting output), and blockers resolved
   - Classify each using the contribution categories from `workspace.yaml` user role (IC categories: decisions-and-influence, unblocking-others, issue-prevention, etc.; manager categories: people-development, operational-improvements, etc.)
   - Before writing, read `Journal/contributions-{monday-date}.md` and check for near-duplicates (same action + same entity from same day). Skip duplicates.
   - High-confidence contributions (explicitly completed tasks, decisions you clearly drove) → write directly to contributions log and daily note
   - Less certain contributions (agent thinks you influenced an outcome) → write with inferred marker to contributions log and daily note
   - Genuinely uncertain (can't tell if you contributed or just observed) → route to `ReviewQueue/review-self.md`

4. **Quick notes (ask before writing).** Before writing the End of Day section, ask: "Any last thoughts to capture? (say 'nothing' or press enter to skip)." If the user provides notes, capture them. This must happen BEFORE step 5 so the notes can be included in the End of Day section naturally.

5. List unfinished items explicitly in the End of Day section. Then move each to tomorrow's daily note:
   - If `Journal/DailyNote-{tomorrow}.md` exists, append unfinished items to its Immediate Attention section (or create the section if missing)
   - If it doesn't exist, create it from the daily note template and add unfinished items to Immediate Attention
   - Mark carried items with "(carried from {today's date})"

6. Write the `## End of Day — {HH:MM}` section at the bottom of today's daily note with subsections: Planned vs Actual, Contributions Detected, Carried to Tomorrow, Quick Notes (if any).

7. Output summary: "Day wrapped up. Completed: {N} of {M} planned items. {N} contributions detected ({N} certain, {N} inferred, {N} in review queue). {N} items carried to tomorrow."

### Weekly Summary

1. Read the current weekly note `Journal/WeeklyNote-{monday-date}.md`. If it doesn't exist, create it (same process as sync's weekly note creation).

2. Check for existing summary sections in the weekly note. If a previous summary exists (from an earlier run this week), note its timestamp — only add information that's new since then.

3. Read all daily notes for the current week (including their End of Day sections — this is the primary data source for what was accomplished vs carried), the contributions log, and project timelines.

4. Append a new `## Weekly Summary — {YYYY-MM-DD}` section to the weekly note with:
   - **Accomplishments:** key completed tasks and milestones across projects
   - **Decisions Made:** decisions logged in project timelines this week
   - **Blockers:** unresolved blockers, newly surfaced blockers, blockers resolved this week
   - **Tasks: Completed vs Carried:** count of tasks completed vs carried forward, broken down by project
   - **Self-Reflection:** agent-generated prompts based on this week's patterns — time allocation balance (meeting-heavy days vs focus days), feedback gaps (days since last feedback to each direct report, if manager), delegation health (overdue delegations trend), recurring carry-overs (tasks carried 3+ times)

5. Output summary: "Weekly summary written to {weekly note path}. {N} accomplishments, {N} decisions, {N} active blockers, {completed}/{total} tasks completed. Reflection prompts added."

## Output

### End of Day Section (in daily note)

Written at the bottom of `Journal/DailyNote-{today}.md`:

```
## End of Day — {HH:MM}

### Planned vs Actual
- **Completed:** API spec review, 1:1 with Sarah, standup
- **Not started:** MBR draft (carried to tomorrow)
- **Partially done:** Delegation follow-ups (2 of 3 resolved)

### Contributions Detected
- [2026-04-06 | wrap-up] **decisions-and-influence:** Completed API spec review ahead of schedule [Auto]
- [2026-04-06 | wrap-up] **unblocking-others:** Resolved caching question that was blocking platform team [Inferred]

### Carried to Tomorrow
- MBR draft (carried from 2026-04-06)
- Follow up with Marcus on deployment timeline (carried from 2026-04-06)
```

Contributions also written to `Journal/contributions-{monday-date}.md` with full entry format including category and source.

Uncertain contributions written to `ReviewQueue/review-self.md` with the standard review queue entry format.

Weekly summary appended to `Journal/WeeklyNote-{monday-date}.md`.

## Rules

- **Check feature toggles:** check `features.weekly_summary` before generating weekly summaries. Check `features.contribution_detection` before running contribution detection during end-of-day wrap-up — if disabled, skip the Contributions Detected section.
- **First sync is the baseline.** Always compare against the first sync snapshot of the day, not the latest. The first sync represents the day's plan.
- **Never duplicate contributions.** Read the existing contributions log before writing. If the same contribution was already logged (by process-meeting, capture, or a previous wrap-up), skip it. Wrap-up's contribution detection focuses on tasks completed that weren't captured by other skills today, and day-level patterns (e.g., resolved multiple blockers across projects). Do not re-detect contributions that process-meeting already wrote with [Auto] or [Inferred] today — check the contributions log first. Near-duplicate matching is semantic: "Drove caching decision" and "Resolved caching strategy for auth migration" refer to the same event and should be de-duplicated.
- **Tomorrow's note is append-safe.** If tomorrow's note already has user content or a "plan tomorrow" snapshot, append carried items to Immediate Attention without disturbing existing content.
- **Weekly summary is additive.** On re-run, only add new information since the previous summary timestamp. Never rewrite or replace previous summary sections.
- **No wrap-up without a daily note.** If no daily note exists for today (user never ran sync), tell the user: "No daily note found for today. Run 'sync' first, or say 'wrap up anyway' to create a wrap-up without planned vs actual comparison." If they proceed, skip the planned vs actual section and still detect contributions and carry forward open tasks.

## Examples

### Example: End of Day Wrap-Up

User says "wrap up" at 5:30 PM. Today's daily note has an 8:30 AM sync showing: 4 meetings, 5 Immediate Attention items (API spec review, MBR draft, 3 delegation follow-ups), 2 overdue tasks.

**Reads:** Daily note, completed tasks (API spec review done, 2 of 3 delegation follow-ups resolved), meeting checkboxes (standup done, 1:1 with Sarah done, design review done, team sync done), project timelines (decision logged in auth-migration: "go with in-memory caching"), contributions log (empty for today).

**Writes to daily note End of Day section:**
- Completed: API spec review, all 4 meetings, 2 delegation follow-ups
- Not started: MBR draft
- Partially done: delegation follow-ups (2 of 3)
- Contributions: "Completed API spec review" [Auto], "Drove caching decision in design review" [Auto], "Resolved auth team's blocking question on API contract" [Inferred]
- Carried to tomorrow: MBR draft, Marcus delegation follow-up

**Writes to contributions log:** 3 entries with categories (decisions-and-influence, unblocking-others).

**Creates** `Journal/DailyNote-2026-04-07.md` with carried items in Immediate Attention.

**Output:** "Day wrapped up. Completed: 7 of 9 planned items. 3 contributions detected (2 certain, 1 inferred). 2 items carried to tomorrow."

### Example: Weekly Summary

User says "weekly summary" on Friday afternoon. Weekly note exists with capacity table and goals. No previous summary this week.

**Reads:** 5 daily notes (Mon-Fri), contributions log (12 entries this week), project timelines (auth-migration, platform-api).

**Appends to weekly note:**
- Accomplishments: API spec review completed, auth caching decision finalized, 3 delegation chains closed
- Decisions: in-memory caching for auth (Mon), deferred Redis evaluation to Q3 (Wed)
- Blockers: platform API schema still unresolved (raised Tue, no movement)
- Tasks: 18 completed, 4 carried forward. Auth Migration: 8/10. Platform API: 6/8.
- Self-Reflection: "Meeting-heavy Tuesday and Thursday (5+ hrs each) — consider declining optional syncs. Marcus has had 2 overdue delegations this week — worth discussing workload in next 1:1. MBR draft carried 3 times — is this actually a priority?"

**Output:** "Weekly summary written to Journal/WeeklyNote-2026-04-06.md. 3 accomplishments, 2 decisions, 1 active blocker, 18/22 tasks completed. Reflection prompts added."

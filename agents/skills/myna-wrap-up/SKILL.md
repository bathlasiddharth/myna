---
name: myna-wrap-up
description: Close out your day — compares planned vs actual, logs contributions, moves unfinished items to tomorrow's note, captures quick notes, and runs a learning reflection. Writes an End of Day section to today's daily note.
user-invocable: true
argument-hint: "[quick note: ...]"
---

# myna-wrap-up

Closes out the day. Reads today's daily note and vault state, writes an End of Day section, moves unfinished items forward, detects contributions, and runs a brief learning reflection. The daily note becomes the complete record of the day: sync snapshots at top, user edits in the middle, wrap-up at the bottom.

---

## Step 1: Read Config and Today's Note

Read `workspace.yaml`:
- `vault.path` + `vault.subfolder`
- `timezone` → today's date
- `user.role` → determines contribution categories
- `features.contribution_detection` → whether to run contribution detection

Read today's daily note: `Journal/DailyNote-{YYYY-MM-DD}.md`

If no daily note exists, create a minimal one (no sync snapshot) and proceed. The wrap-up section will note there was no morning sync.

Also read:
- Today's completed tasks: Grep `myna/` for `- \[x\]` with today's completion date
- Today's meeting files: check `Meetings/` for files with today's date section
- `Journal/contributions-{YYYY-MM-DD}.md` (Monday date) — to check for existing entries before adding new ones

---

## Step 2: Planned vs Actual

Find the **morning sync snapshot** — the earliest "Sync — {time}" section in today's daily note (myna-sync prepends snapshots, so the morning snapshot will be the bottom-most one). Extract its Immediate Attention items — these are what was planned.

Compare against current state:
- **Completed:** tasks now marked `- [x]`, meetings with all checkboxes checked, delegations resolved
- **Not started:** items from Immediate Attention with no matching completion anywhere in today's note or project files
- **Partially done:** tasks with `[review-status:: pending]` or meetings with some checkboxes checked and some not

If there was no morning sync snapshot, note it and skip the comparison. Still proceed with contribution detection and carry-forward.

---

## Step 3: Carry Unfinished Items to Tomorrow

For each "not started" and "partially done" item:

1. Determine tomorrow's date (next weekday).
2. If tomorrow's daily note (`Journal/DailyNote-{tomorrow}.md`) doesn't exist, create it with frontmatter and Morning Focus section only.
3. Append the carried items under a `## Carry-Forwards from {today}` section in tomorrow's note:

```markdown
## Carry-Forwards from {YYYY-MM-DD}

- {item} (carried from {today}) [Inferred]
- {item} (carried from {today}) [Inferred]
```

Do NOT remove or modify the items in today's note. The original remains as-is.

---

## Step 4: Contribution Detection

Only run if `features.contribution_detection` is enabled.

Scan for items from today that look like contributions worth tracking:

**High-confidence sources (`[Auto]`):**
- Tasks marked `- [x]` today that have `[project:: ...]` set
- Meetings processed today with completed action items attributed to you
- Decisions logged in project timelines today (grep `[!info] Decision` blocks with today's date)
- Delegations you resolved (your delegation tasks marked done)

**Lower-confidence sources (`[Inferred]`):**
- Meetings you attended today (checked off in Today's Meetings) — you contributed to whatever was discussed
- Blockers marked resolved in project timelines today where you were a likely resolver (based on `[person:: ...]` fields nearby)
- Emails processed today where you were the sender and an outcome was noted

**Genuinely uncertain → `ReviewQueue/review-self.md`:**
- Items where it's not clear if you drove the outcome vs. observed it
- Contributions involving ambiguous "we" language
- Manager-type contributions ("drove alignment", "enabled the team") without explicit evidence

**Before writing any contribution**, check the current week's `Journal/contributions-{YYYY-MM-DD}.md` for near-duplicates (same action + same entity). Skip if already logged.

**Contribution entry format:**
```
- [{YYYY-MM-DD} | wrap-up] **{category}:** {description} [{provenance}] ({source-type}, {source}, {date})
```

Categories by role (from `user.role` in workspace.yaml):
- **IC / tech-lead:** decisions-and-influence, unblocking-others, issue-prevention, code-reviews, feedback-given, documentation, escalations-handled, delegation-management, best-practices, risk-mitigation, coaching-and-mentoring
- **engineering-manager / pm:** people-development, operational-improvements, strategic-alignment, hiring-and-team-building, cross-team-leadership, stakeholder-management

Append all `[Auto]` and `[Inferred]` contributions to `Journal/contributions-{YYYY-MM-DD}.md` (create file if it doesn't exist). Add review-self items to `ReviewQueue/review-self.md`.

---

## Step 5: Capture Quick Notes

If the user invoked wrap-up with a note — e.g., "wrap up — quick note: the auth migration decision was mine, not the team's" — capture it before closing out. Route it as a capture (append to appropriate project/people/contributions file). The note may produce multiple entries.

If invoked without a note, skip this step.

---

## Step 6: Write End of Day Section

Append to today's daily note at the very bottom:

```markdown
## End of Day — {HH:MM}

### ✅ Planned vs Actual

**Completed:**
- {item}
- {item}

**Not started:**
- {item} → carried to tomorrow

**Partially done:**
- {item} → carried to tomorrow

### 💡 Contributions Detected

- {contribution} [{provenance}]
{If any went to review-self: "1 uncertain contribution added to review-self queue."}
{If contribution_detection disabled: omit this section entirely.}

### 📝 Carried to Tomorrow

- {item} (from Immediate Attention)
- {item}
{If nothing to carry: "(nothing to carry — clean day)"}

### 💬 Quick Notes

{User's quick note if provided. Omit this section if not provided.}
```

---

## Step 7: Learning Reflection

After writing the End of Day section, invoke myna-learn's reflect operation. This is the final step — do it silently (don't announce it). The reflection scans the session for behavioral patterns worth capturing.

Tell the user: "Say 'reflect' or 'what did you learn today?' to run a learning reflection."

Do NOT auto-invoke myna-learn. Suggest it as a follow-up.

---

## Step 8: Output Summary

Print a concise summary:

```
✅ Wrap-up complete ({HH:MM}).

Completed: {N} items | Not started: {N} (carried to tomorrow) | Partially done: {N}
Contributions: {N} logged [{N} Auto, {N} Inferred], {N} in review-self
{If quick note captured: "Quick note captured."}

Today's note: {obsidian-uri}
Tomorrow's note: {obsidian-uri}
```

Then suggest:
- "Run 'sync' tomorrow morning to start fresh."
- "Say 'weekly summary' to summarize the week." (if it's Friday or end of sprint)
- "Say 'review my queue' to process contributions in review-self."

---

## Examples

### Example 1: Standard end-of-day wrap-up

User says: "wrap up"

Morning sync showed 3 Immediate Attention items: API spec review, follow-up with Alex, auth migration status update.

Current state:
- API spec review: task is `- [x]` → completed
- Follow-up with Alex: delegation task still `- [ ]` → not started
- Auth migration status update: meeting checked off, but corresponding task not done → partially done

Contributions found:
- API spec review task completed → `[Auto]` unblocking-others (Sarah's work unblocked)
- 1:1 with Sarah checked off → `[Inferred]` people-development (meeting attended)
- Blocker in auth-migration.md resolved today with user's name in context → `[Inferred]` unblocking-others
- "Who drove the Q2 planning outcome?" — ambiguous → review-self

Output to daily note End of Day section, then:
```
✅ Wrap-up complete (6:02 PM).

Completed: 1 item | Not started: 1 (carried to tomorrow) | Partially done: 1
Contributions: 2 logged [1 Auto, 1 Inferred], 1 in review-self

Today's note: obsidian://open?...
Tomorrow's note: obsidian://open?...
```

### Example 2: Wrap-up with quick note

User says: "wrap up — quick note: the cache decision in the auth migration review was mine, I drove it"

Quick note is explicit → routes as `[User]` contribution to `Journal/contributions-{week}.md` under decisions-and-influence category. Also appends a timeline entry to `Projects/auth-migration.md` under `## Timeline` noting the decision.

Carry-forward and planned vs actual run as normal.

### Example 3: No morning sync ran

User says: "end of day"

Daily note exists but has no sync snapshot. Skip the planned vs actual comparison (nothing to compare against). Still:
- Run contribution detection from tasks completed today
- Carry any `- [ ]` high-priority tasks to tomorrow
- Write End of Day section noting "No morning sync — planned vs actual skipped."

---

## Edge Cases

**No tasks completed today:** Planned vs Actual shows all items as "not started" or "partially done". No contributions detected. Carry everything forward.

**contributions-{week}.md doesn't exist yet:** Create it with frontmatter (`week_start: {YYYY-MM-DD}`) and `#contributions` tag, plus a `## Contributions — Week of {YYYY-MM-DD}` section header. Append new entries.

**User runs wrap-up twice:** The End of Day section already exists. Read it for context. Prepend a new "End of Day — {HH:MM} (re-run)" snapshot above the existing one, noting what changed. Do not overwrite the original.

**Feature toggle `contribution_detection` off:** Skip Steps 4 entirely. Omit Contributions Detected section from End of Day.

**Tasks with no project:** These are personal tasks in the daily note itself. Include them in completed/not-started tracking. For contribution detection, skip project-specific categorization — log as `decisions-and-influence` or `unblocking-others` based on task description.

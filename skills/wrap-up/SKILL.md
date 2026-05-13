---
name: wrap-up
disable-model-invocation: true
description: Close out your day — compares planned vs actual, logs contributions, moves unfinished items to tomorrow's note, captures quick notes, and saves behavioral corrections to memory. Writes an End of Day section to today's daily note.
user-invocable: true
argument-hint: "[quick note: ...]"
---

# myna-wrap-up

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

Before reading or writing the daily note or contributions log, read `~/.claude/myna/file-formats/_conventions.md` and `~/.claude/myna/file-formats/journal.md`, section `## Daily Note`.

Closes out the day. Reads today's daily note and vault state, writes an End of Day section, moves unfinished items forward, detects contributions, and saves behavioral corrections to Claude Code memory. The daily note becomes the complete record of the day: sync snapshots at top, user edits in the middle, wrap-up at the bottom.

---

## Step 1: Read Config and Today's Note

Read `workspace.yaml`:
- `vault.path` → vault root; Myna subfolder is always `myna` (hardcoded)
- `timezone` → today's date
- `user.role` → determines contribution categories

Read today's daily note: `Journal/{YYYY-MM-DD}.md`

If no daily note exists, create a minimal one (no sync snapshot) and proceed. The wrap-up section will note there was no morning sync.

Also read:
- Today's completed tasks: Grep `myna/` for `- \[x\]` with today's completion date
- Today's meeting files: check `Meetings/` for files with today's date section
- `Journal/contributions-{YYYY-MM-DD}.md` (Monday date) — to check for existing entries before adding new ones

---

## Step 2: Planned vs Actual

Query open tasks across project files where `📅 {today}` — grep `Projects/` for `- \[ \].*📅 {today}`. These source-file due dates are what was "planned" for today. Do NOT attempt to read `### Immediate Attention` from the daily note — that section no longer exists in the canonical structure.

Compare against current state:
- **Completed:** tasks now marked `- [x]` with today's date, meetings with all checkboxes checked, delegations resolved
- **Not started:** tasks from the above query with no matching `- [x]` completion anywhere in today's note or project files
- **Partially done:** tasks with `[review-status:: pending]` or meetings with some checkboxes checked and some not

Also check today's daily note `## Morning Focus` section for any user-typed intent that should inform the comparison — this is the one section the user writes themselves.

If no tasks were due today and no Morning Focus was written, note it and skip the comparison. Still proceed with contribution detection and carry-forward.

---

## Step 3: Carry Unfinished Items to Tomorrow

For each "not started" and "partially done" item:

1. Determine tomorrow's date (next weekday).
2. If tomorrow's daily note (`Journal/{tomorrow}.md`) doesn't exist, create it with frontmatter (`date: {YYYY-MM-DD}`), `#daily` tag, and a `## Morning Focus` section only.
3. Append the carried items to tomorrow's note under the `## Morning Focus` section (inside a `### Carry-Forwards` subsection — add it if it doesn't exist). Each item gets a carry-forward annotation:

```markdown
### Carry-Forwards

- {item} (carried from {today}) [Auto]
- {item} (carried from {today}) [Auto]
```

These are mechanical copies of unchecked items — not new inferences — so `[Auto]` is the correct marker.

Do NOT remove or modify the items in today's note. The original remains as-is.

---

## Step 4: Contribution Detection

Scan for items from today that look like contributions worth tracking:

**High-confidence sources (`[Auto]`):**
- Tasks marked `- [x]` today that have `[project:: ...]` set
- Meetings processed today with completed action items attributed to you
- Decisions logged in project timelines today (grep `[!info] Decision` blocks with today's date)
- Delegations you resolved (your delegation tasks marked done)

**Lower-confidence sources (`[Inferred]`):**
- Meetings you attended today where the meeting notes contain an explicit action, decision, feedback, or outcome attributable to you — do NOT log a contribution solely because you attended; mere attendance is not a contribution
- Blockers marked resolved in project timelines today where you were a likely resolver (based on `[person:: ...]` fields nearby)
- Emails processed today where you were the sender and an outcome was noted

**Genuinely uncertain → `ReviewQueue/review-self.md`:**
- Items where it's not clear if you drove the outcome vs. observed it
- Contributions involving ambiguous "we" language
- Manager-type contributions ("drove alignment", "enabled the team") without explicit evidence

**Before writing any contribution**, check the current week's `Journal/contributions-{YYYY-MM-DD}.md` for near-duplicates (same action + same entity). Skip if already logged.

**Contribution entry format** (content-first):
```
- **{category}:** {description} [{provenance}] (wrap-up, {user.name}, {YYYY-MM-DD})
```

Categories by role (from `user.role` in workspace.yaml):
- **IC / tech-lead:** decisions-and-influence, unblocking-others, issue-prevention, code-reviews, feedback-given, documentation, escalations-handled, delegation-management, best-practices, risk-mitigation, coaching-and-mentoring
- **engineering-manager / pm:** people-development, operational-improvements, strategic-alignment, hiring-and-team-building, cross-team-leadership, stakeholder-management

Prepend all `[Auto]` and `[Inferred]` contributions to the top of the `## Contributions — Week of {YYYY-MM-DD}` section in `Journal/contributions-{YYYY-MM-DD}.md` (create file if it doesn't exist — include frontmatter `week_start:` and `#contributions` tag). Add review-self items to `ReviewQueue/review-self.md`.

---

## Step 5: Capture Quick Notes

If the user invoked wrap-up with a note — e.g., "wrap up — quick note: the auth migration decision was mine, not the team's" — capture it before closing out. Route it as a capture (append to appropriate project/people/contributions file). The note may produce multiple entries.

If invoked without a note, skip this step.

---

## Step 6: Write End of Day Section

Append to today's daily note at the very bottom:

```markdown
## End of Day — {HH:MM}

> Written by wrap-up skill.

### Planned vs Actual

- Completed: {list}
- Not started: {list}
- Partially done: {list}

### Contributions Detected

- {contribution} [{provenance}]
{If any went to review-self: "1 uncertain contribution added to review-self queue."}
{Omit this section entirely if no contributions were detected.}

### Carried to Tomorrow

- {item} (carried from {today}) [Auto]
- {item} (carried from {today}) [Auto]
{If nothing to carry: "(nothing to carry — clean day)"}

### Quick Notes

{User's quick note if provided. Omit this section if not provided.}
```

---

## Step 7: Save Behavioral Corrections to Memory

Before outputting the End of Day summary, scan the session for behavioral corrections or preferences the user expressed (e.g., format preferences, tone corrections, workflow adjustments). Save any found to Claude Code memory using the feedback memory type.

Apply the entity-specific refusal: preferences that apply broadly across interactions belong in memory; facts about specific people, projects, or meetings belong in their entity files, not memory.

---

## Step 8: Output Summary

Print a concise summary:

```
Wrap-up complete ({HH:MM}).

Completed: {N} items | Not started: {N} (carried to tomorrow) | Partially done: {N}
Contributions: {N} logged [{N} Auto, {N} Inferred], {N} in review-self
{If quick note captured: "Quick note captured."}
{If behavioral corrections saved: "Behavioral preferences saved to memory: {N} item(s)." | If none found: omit this line.}

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

Project-file query (grep `Projects/` for `- \[ \].*📅 2026-04-10`) returns 3 tasks due today: API spec review, follow-up with Alex, auth migration status update.

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

Quick note is explicit → routes as `[User]` contribution to `Journal/contributions-{week}.md` (prepended newest-first). Also prepends a timeline entry to `Projects/auth-migration.md` `## Timeline` noting the decision.

Carry-forward and planned vs actual run as normal.

### Example 3: No morning sync ran

User says: "end of day"

Daily note exists but has no sync snapshot. Skip the planned vs actual comparison (nothing to compare against). Still:
- Run contribution detection from tasks completed today
- Carry all unfinished `- [ ]` tasks to tomorrow
- Write End of Day section noting "No morning sync — planned vs actual skipped."

---

## Edge Cases

**No tasks completed today:** Planned vs Actual shows all items as "not started" or "partially done". No contributions detected. Carry everything forward. Omit Contributions Detected section from End of Day if no contributions are detected.

**contributions-{week}.md doesn't exist yet:** Create it with frontmatter (`week_start: {YYYY-MM-DD}`) and `#contributions` tag, plus a `## Contributions — Week of {YYYY-MM-DD}` section header. Write new entries into the section (newest-first from the start).

**User runs wrap-up twice:** The End of Day section already exists. Read it for context. Append a new "End of Day — {HH:MM} (re-run)" section below the existing one, noting what changed. Do not overwrite the original.

**Tasks with no project:** These are personal tasks in the daily note itself. Include them in completed/not-started tracking. For contribution detection, skip project-specific categorization — log as `decisions-and-influence` or `unblocking-others` based on task description.

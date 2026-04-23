---
name: myna-sync
description: 'Sync / "good morning" / "set up my day" — creates or refreshes the daily note, generates meeting prep, surfaces overdue tasks and review queue. Handles "plan tomorrow" and weekly note creation. Auto-archives old journal notes.'
user-invocable: true
argument-hint: "[plan tomorrow]"
---

# myna-sync

Sets up or refreshes your day. Rerunnable at any time — each run prepends a fresh snapshot at the top of the daily note; previous snapshots stay untouched.

---

## When Invoked

**Normal sync ("sync", "good morning", "set up my day"):** Runs for today.

**Plan tomorrow ("plan tomorrow", "set up tomorrow"):** Runs for the next business day. Creates tomorrow's daily note and populates it with known calendar events and tasks due that day.

---

## Step 1: Read Config

Read from `_system/config/workspace.yaml`:
- `vault.path` + `vault.subfolder` → vault root for all file paths
- `work_hours.start` and `work_hours.end` → for capacity calculations
- `timezone` → for date resolution
- `journal.archive_after_days` → for auto-archiving
- `calendar_event_prefix` and `calendar_event_types` → for naming calendar events
- `features` map → check: `meeting_prep`, `milestones`

Read from `_system/config/projects.yaml`, `_system/config/people.yaml`, `_system/config/meetings.yaml`.

If `workspace.yaml` is missing or unreadable, stop and tell the user: "workspace.yaml not found at `_system/config/workspace.yaml`. Myna can't run without it."

---

## Step 2: Determine Target Date and Current Time

Get the current date, time, and day of week using the configured timezone — always via Bash, never derived internally:

```bash
TZ={timezone} date +"%Y-%m-%d"      # today's date
TZ={timezone} date +"%H:%M"         # current time for Sync header
TZ={timezone} date +"%A"            # day of week (e.g. "Tuesday")
```

Use these values everywhere in the skill — the Sync header timestamp, day-of-week greetings, and date calculations.

**Normal sync:** today's date from the command above.
**Plan tomorrow:** next weekday from today's date. If today is Friday, tomorrow = Monday.

Daily note path: `Journal/DailyNote-{YYYY-MM-DD}.md`
Weekly note path: `Journal/WeeklyNote-{YYYY-MM-DD}.md` (Monday of target week)

If "plan tomorrow" is run again after the user has already edited the note: treat it as a re-run. Prepend a new snapshot, never overwrite Morning Focus or any user-written content.

---

## Step 3: Weekly Note (first sync of the week only)

If no weekly note exists for the ISO week containing the target date, create `Journal/WeeklyNote-{YYYY-MM-DD}.md` (Monday of that week) using this template:

```markdown
---
week_start: {YYYY-MM-DD}
---

#weekly

## Week Capacity

| Day | Meetings | Focus Time | Task Effort |
|-----|----------|------------|-------------|
| Mon | {hrs} hrs | {hrs} hrs | {hrs} hrs |
| Tue | {hrs} hrs | {hrs} hrs | {hrs} hrs |
| Wed | {hrs} hrs | {hrs} hrs | {hrs} hrs |
| Thu | {hrs} hrs | {hrs} hrs | {hrs} hrs |
| Fri | {hrs} hrs | {hrs} hrs | {hrs} hrs |

## Weekly Goals

> User-editable.

## Carry-Forwards

## Weekly Summary

### Accomplishments
### Decisions Made
### Blockers
### Tasks: Completed vs Carried
### Self-Reflection
```

After writing the file, append packed day flags and carry-forward items from last week's wrap-up section below the table (before `## Weekly Goals`), or "(none)" if clean.

Populate Week Capacity by reading this week's calendar events (duration + count per day) and querying tasks with due dates in the coming week. Flag any day with more than 6 hours of meetings as packed. Suggest rebalancing if one day looks heavier than adjacent days.

---

## Step 4: Auto-Archive Old Journal Notes

Check `journal.archive_after_days` (default: 30). Use Glob to find all `Journal/DailyNote-*.md` and `Journal/WeeklyNote-*.md` files. Determine age using the date in the filename (not filesystem mtime). Files whose filename date is more than `archive_after_days` days before today qualify. If 5 or more files qualify, show the list and wait for user confirmation before moving. Move qualifying files to `Journal/Archive/` using Bash `mv`. Report the count at the end — don't list individual files moved.

---

## Step 5: Gather Sync Data

Collect in parallel:

**Calendar:** Read today's (or tomorrow's) calendar events via the calendar MCP. For each event, note: title, start time, end time, attendees (count only — not names), and any existing meeting file path. If calendar MCP is unavailable, skip the meetings section and note it in the output.

**Due today:** Grep `{vault}/{subfolder}/Projects/` for `- \[ \]` with `📅 {target-date}`. Group by project file. Also grep outside `Projects/` for tasks with `📅 {target-date}` — these are "General" tasks with no project. Retain the full task text and source file for each result.

**Overdue (for briefing signal only):** Grep `{vault}/{subfolder}/Projects/` for `- \[ \]` with `📅 {date}` before target date. Count total; surface the top 3 by priority for the briefing. Full list belongs in [[overdue]] dashboard.

**Overdue delegations (for briefing signal only):** Grep `{vault}/{subfolder}/` for `- \[ \]` lines containing `[type:: delegation]` with `📅 {date}` before today. Count total; surface any as red-flag bullets in the briefing. Full list belongs in [[delegations]] dashboard.

**Blockers:** Grep `{vault}/{subfolder}/Projects/` for `> \[!blocker\]` callout blocks. For each match, read a window of ~5 surrounding lines. Skip if `resolved:: true` or `status:: resolved` appears within the same callout block. Surface unresolved ones as briefing bullets.

**Milestones** (if `features.milestones` is enabled): Read `people.yaml` and all People files. Find birthdays (`birthday: MM-DD`) or work anniversaries (`work_anniversary: YYYY-MM-DD`) within the next 7 days. Surface as briefing bullets.

**Review queue counts:** Read `{vault}/{subfolder}/ReviewQueue/review-work.md`, `review-people.md`, `review-self.md`, and `review-email-triage.md`. Count unchecked items (`- \[ \]`) in each. If a file doesn't exist, treat its count as 0. Include total in briefing only if non-zero.

---

## Step 6: Create or Prepend Daily Note

**If daily note doesn't exist:** Create it with the Morning Focus section and the first snapshot below.

**If daily note exists (re-run):** Read it first. Use the existing snapshot(s) as context to detect what's changed (new meetings added since last sync, tasks completed, queue items resolved). Then insert a fresh snapshot immediately after the `#daily` tag line and before the `## Morning Focus` section. Never move, edit, or collapse previous snapshots.

### Daily Note Structure (new file)

Substitute all `{...}` placeholders with actual values from config and gathered data.

```markdown
---
date: {YYYY-MM-DD}
---

#daily

## Morning Focus

> User-editable. Sync never overwrites this section.

## Sync — {HH:MM}

### Briefing

{3–7 bullets covering what matters most today. AI-generated signal, not raw data. Include:}
- Overdue tasks that need attention today (count + top items by priority)
- Overdue delegations as red-flag items
- Unresolved blockers
- Prep warnings for today's meetings (e.g., "Design review at 2 PM — no prep file yet")
- Capacity flag if task effort exceeds focus time ("Over capacity by {N} hrs")
- Milestones within 7 days (if features.milestones enabled)
- Review queue if non-zero ("{N} items in review queue")

### Today's Meetings

{For each calendar event today, one bullet linking to the prep file with prep status:}
- [ ] {HH:MM} [[{meeting-file}]] — {meeting title} {prep-status}

{prep-status is one of: "(prep ready)", "(no prep yet)", or "(basic prep from sync)"}

### Tasks Due Today

{One sentence AI-generated summary — surface signal, not just a count. E.g.: "Alpha launch has the most due today (4 tasks), and the blocker on payments is the highest-priority item." If nothing is due, write: "(nothing due today)".}

{For each project that has tasks due today, render a sub-header and task list:}

#### {Project Name}

- [ ] {task title} 📅 {date} {priority if set}

#### General

{Tasks with no project association go here. If none, omit this sub-header.}

### Dashboards

[[home]] · [[tasks]] · [[this-week]] · [[overdue]] · [[delegations]] · [[blockers]] · [[projects]] · [[people]] · [[meetings]] · [[weekly]]
```

### Re-run Snapshot Format (prepended at top)

```markdown
## Sync — {HH:MM}

### Briefing

{Updated briefing bullets. Include delta if notable: "Since last sync: {N} tasks completed, {M} meetings added."}

### Today's Meetings

- [ ] {HH:MM} [[{meeting-file}]] — {meeting title} {prep-status}
```

Note: re-run snapshots are compact — they omit Dataview sections (those live in the permanent part of the note and update automatically) and focus on what changed. Dashboards link row is permanent and not repeated in re-run snapshots.

---

## Step 7: Generate Meeting Prep Files

For each calendar event today, if `features.meeting_prep` is enabled:

1. Determine the meeting file path from the event title and attendees:
   - 2 attendees (you + 1 person) → `Meetings/1-1s/{person-slug}.md`
   - Recurring event → `Meetings/Recurring/{meeting-slug}.md`
   - One-off → `Meetings/Adhoc/{YYYY-MM-DD}-{meeting-slug}.md`
   - Check `meetings.yaml` for manual overrides

2. If the meeting file doesn't exist, create it. Check `_system/templates/` for a matching template file (e.g., `meeting-1-1.md`, `meeting-recurring.md`, `meeting-adhoc.md`). If a template exists, use it; if not, create a minimal file:

   For **1:1 meetings** (`Meetings/1-1s/{person-slug}.md`):
   ```markdown
   ---
   type: 1-1
   person: [[{person-slug}]]
   ---

   #meeting #1-1
   ```

   For **recurring meetings** (`Meetings/Recurring/{slug}.md`):
   ```markdown
   ---
   type: recurring
   project: {project-name or null}
   ---

   #meeting #recurring
   ```

   For **adhoc meetings** (`Meetings/Adhoc/{YYYY-MM-DD}-{slug}.md`):
   ```markdown
   ---
   type: adhoc
   ---

   #meeting #adhoc
   ```

   Then append the session section below.

3. If the file exists, check whether a prep section for today's date already exists. If yes, skip (don't duplicate). If no, append a new session section.

4. For myna-sync, generate **minimal prep** — enough to orient the user before the meeting without the full depth that myna-prep-meeting provides:
   - Carry-forward items: unchecked items from the previous session's Prep section (if the meeting file exists)
   - Open action items between you and attendees: Grep project files for `[person:: {attendee-name}]` open tasks
   - Recent project context: last 2–3 timeline entries from the relevant project file
   - For 1:1s only: a reminder of the last 1:1 date and count of carry-forward items

   Full deep prep (pending feedback, coaching suggestions, career topics, personal notes) is available on demand via myna-prep-meeting. Add a note at the top of the Prep section: "Basic prep from sync. Say 'prep for [meeting]' for full prep."

Meeting file is wiki-linked in the daily note's Today's Meetings section.

---

## Step 8: Output

Print the sync summary. Keep it short — one line per category. Include the Obsidian URI and full disk path for the daily note created or updated.

```
Sync complete ({HH:MM}). {N} meetings today ({M} hrs), {O} tasks due today, {P} overdue.
Daily note: obsidian://open?vault={vault}&file={path} | {disk-path}
{If first sync of week: "Weekly note created for week of {date}."}
{If archived: "{N} journal notes archived."}
{If calendar unavailable: "Calendar unavailable — meetings section skipped."}
```

Then print the Briefing bullets as a quick-scan list.

Then suggest:
- "Say 'process my email' to extract vault data from recent messages."
- "Say 'prep for [meeting]' for deeper prep on any meeting."
- "Say 'wrap up' at the end of the day."

---

## Examples

### Example 1: First sync of the day (Monday)

User says: "good morning"

1. No weekly note exists for this ISO week → create `Journal/WeeklyNote-2026-04-07.md` with week capacity populated.
2. Auto-archive check: no daily notes older than 30 days.
3. No daily note for today → create `Journal/DailyNote-2026-04-07.md`.
4. Calendar: 3 meetings today (weekly sync 10:00 AM, 1:1 with Sarah 2:00 PM, design review 4:00 PM). Total: 2.5 hrs.
5. Tasks: 2 overdue, 4 due today (estimated 5 hrs effort).
6. Delegations: 1 overdue — Alex was supposed to send infra proposal by last Friday.
7. Review queue: 3 in review-work, 1 in review-self.
8. Milestones: Sarah's birthday in 3 days.
9. Meetings.yaml check: "1:1 with Sarah" → matches alias → `Meetings/1-1s/sarah-chen.md`. Append new session. "Design Review" → adhoc → `Meetings/Adhoc/design-review-2026-04-07.md`.
10. Briefing bullets: over-capacity warning, 2 overdue tasks (top by priority), 1 overdue delegation (Alex — infra proposal), Sarah's birthday in 3 days, 4 review queue items.
11. Output: "Sync complete (8:47 AM). 3 meetings today (2.5 hrs), 4 tasks due today, 2 overdue. Weekly note created for week of 2026-04-07."

### Example 2: Re-sync mid-afternoon

User says: "sync"

1. Daily note already exists with an 8:47 AM snapshot.
2. Compare: 2 tasks completed since morning, 1 new meeting added (ad-hoc at 3 PM).
3. Prepend a new "Sync — 2:15 PM" snapshot (Briefing + Today's Meetings only). Previous snapshot left intact. Dataview and Dashboards sections are permanent — not repeated.
4. Output: "Sync complete (2:15 PM). 1 meeting remaining (1 hr), 2 tasks due today, 2 overdue."

### Example 3: Plan tomorrow

User says: "plan tomorrow"

1. Target date = 2026-04-08 (Tuesday).
2. Tomorrow's daily note doesn't exist → create `Journal/DailyNote-2026-04-08.md`.
3. Read tomorrow's calendar: 2 meetings.
4. Tasks due tomorrow: 3.
5. Generate prep for tomorrow's meetings.
6. Output: "Tomorrow's note ready (2026-04-08). 2 meetings, 3 tasks due. Prep files created."

---

## Edge Cases

**No calendar MCP:** Skip Today's Meetings section and meeting prep. Note in output. Daily note still created with Briefing, Tasks Due Today, and Dashboards.

**No tasks due today:** Tasks Due Today section shows only the summary line "(nothing due today)". Omit all project sub-headers.

**Re-run "plan tomorrow" after user edits:** Read existing tomorrow note. If user has written in Morning Focus, do not overwrite it. Prepend a new snapshot (same as normal re-run).

**Feature toggles:** If `features.meeting_prep` is false, skip meeting file creation entirely and omit prep-status from meeting bullets. If `features.milestones` is false, omit milestones from the Briefing.

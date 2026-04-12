---
name: myna-sync
description: Set up or refresh your day — creates the daily note (or prepends a new snapshot if re-run), generates meeting prep files, surfaces overdue tasks, delegation alerts, and review queue count. Also handles "plan tomorrow" and first-of-week weekly note creation. Auto-archives old journal notes.
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
- `features` map → check: `meeting_prep`, `milestones`, `contribution_detection`

Read from `_system/config/projects.yaml`, `people.yaml`, `meetings.yaml`.

---

## Step 2: Determine Target Date

**Normal sync:** today's date in configured timezone.
**Plan tomorrow:** next weekday. If today is Friday, tomorrow = Monday.

Daily note path: `Journal/DailyNote-{YYYY-MM-DD}.md`
Weekly note path: `Journal/WeeklyNote-{YYYY-MM-DD}.md` (Monday of target week)

---

## Step 3: Weekly Note (first sync of the week only)

If today is Monday **and** no weekly note exists for this week, create `Journal/WeeklyNote-{YYYY-MM-DD}.md` using this template:

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

{Packed day flags and rebalancing suggestions.}

## Weekly Goals

> User-editable. Set your priorities for the week.

## Carry-Forwards

> Items carried from last week (auto-populated from last Friday's wrap-up).

{List any items found in last week's wrap-up carry-forward section, or "(none)" if clean.}
```

Populate Week Capacity by reading this week's calendar events (duration + count per day) and querying tasks with due dates in the coming week. Flag any day with more than 6 hours of meetings as packed. Suggest rebalancing if one day looks heavier than adjacent days.

---

## Step 4: Auto-Archive Old Journal Notes

Check `journal.archive_after_days` (default: 30). Use Glob to find all `Journal/DailyNote-*.md` and `Journal/WeeklyNote-*.md` files. Move any file older than the threshold to `Journal/Archive/` using Bash `mv`. Do this silently — don't report individual files moved. Report the count at the end.

---

## Step 5: Gather Sync Data

Collect in parallel:

**Calendar:** Read today's (or tomorrow's) calendar events via the calendar MCP. For each event, note: title, start time, end time, attendees (count only — not names), and any existing meeting file path. If calendar MCP is unavailable, skip calendar sections and note it in the output.

**Open tasks:** Grep `myna/Projects/` and the current daily note for `- \[ \]` with `📅 {date}` on or before target date (overdue or due today). Also find tasks with no due date and high priority `⏫`. Cap at 15 items for the Immediate Attention section.

**Overdue delegations:** Grep `myna/` for `- \[ \]` lines containing `[type:: delegation]` with `📅 {date}` before today. These are red-flag items.

**Review queue counts:** Read `ReviewQueue/review-work.md`, `ReviewQueue/review-people.md`, `ReviewQueue/review-self.md`. Count unchecked items (`- \[ \]`) in each.

**Milestones** (if `features.milestones` is enabled): Read `people.yaml` and all People files. Find birthdays (`birthday: MM-DD`) or work anniversaries (`work_anniversary: YYYY-MM-DD`) within the next 7 days.

**Blockers:** Grep `myna/Projects/` for `[!warning] Blocker` callout blocks. Surface only unresolved ones (no "resolved" or "fixed" text after the callout).

---

## Step 6: Create or Prepend Daily Note

**If daily note doesn't exist:** Create it with the Morning Focus section and the first snapshot below.

**If daily note exists (re-run):** Read it first. Use the existing snapshot(s) as context to detect what's changed (new meetings added since last sync, tasks completed, queue items resolved). Then prepend a fresh snapshot at the very top, before Morning Focus. Never move, edit, or collapse previous snapshots.

### Daily Note Structure (new file)

```markdown
---
date: {YYYY-MM-DD}
---

#daily

## Morning Focus

> User-editable. Sync never overwrites this section.

## Sync — {HH:MM}

### ⚡ Capacity Check

{available_focus_hours} hrs focus time vs {task_effort_hours} hrs task effort due today.
{Over-capacity flag if effort > focus: "⚠️ Over capacity by {N} hrs — consider deferring or delegating."}

### 🎯 Immediate Attention

{1–5 highest-priority items: overdue tasks, overdue delegations, approaching deadlines, blockers. One line each.}

### 📋 Open Tasks

```dataview
TASK
FROM "myna"
WHERE !completed AND (due <= date(today) OR !due)
SORT priority DESC
LIMIT 20
```

### 📤 Delegations

```dataview
TASK
FROM "myna"
WHERE !completed AND type = "delegation"
SORT due ASC
```

### 🗂️ Review Queue

{total_count} items pending: [[review-work]] ({work_count}), [[review-people]] ({people_count}), [[review-self]] ({self_count}).

### 🎂 Milestones

{Upcoming birthdays/anniversaries if milestones enabled, else omit this section entirely.}

### 📅 Today's Meetings

{For each calendar event today, one checkbox linking to the prep file:}
- [ ] {HH:MM} [[{meeting-file-path}]] — {meeting title}
```

### Re-run Snapshot Format (prepended at top)

```markdown
## Sync — {HH:MM}

### ⚡ Capacity Check

{available_focus_hours} hrs focus time vs {task_effort_hours} hrs task effort.
{Delta from previous sync: "Since last sync: {N} tasks completed, {M} meetings added."}

### 🎯 Immediate Attention

{Updated priority items.}

### 🗂️ Review Queue

{total_count} items pending: [[review-work]] ({work_count}), [[review-people]] ({people_count}), [[review-self]] ({self_count}).

### 📅 Today's Meetings

- [ ] {HH:MM} [[{meeting-file-path}]] — {meeting title}
```

Note: re-run snapshots are more compact — they omit Dataview sections (those live in the permanent part of the note and update automatically) and focus on what changed.

---

## Step 7: Generate Meeting Prep Files

For each calendar event today, if `features.meeting_prep` is enabled:

1. Determine the meeting file path from the event title and attendees:
   - 2 attendees (you + 1 person) → `Meetings/1-1s/{person-slug}.md`
   - Recurring event → `Meetings/Recurring/{meeting-slug}.md`
   - One-off → `Meetings/Adhoc/{meeting-slug}.md`
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

   For **adhoc meetings** (`Meetings/Adhoc/{slug}.md`):
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

Print the sync summary. Keep it short — one line per category.

```
✅ Sync complete ({HH:MM}). {N} meetings today ({M} hrs), {O} tasks overdue, {P} delegations overdue, {Q} items in review queue.
{If first sync of week: "📅 Weekly note created for week of {date}."}
{If archived: "{N} journal notes archived."}
{If calendar unavailable: "⚠️ Calendar unavailable — meeting sections skipped."}
```

Then print the Immediate Attention items as a quick-scan list.

Then suggest:
- "Say 'process my email' to extract vault data from recent messages."
- "Say 'prep for [meeting]' for deeper prep on any meeting."
- "Say 'wrap up' at the end of the day."

---

## Examples

### Example 1: First sync of the day (Monday)

User says: "good morning"

1. It's Monday, no weekly note exists → create `Journal/WeeklyNote-2026-04-07.md` with week capacity populated.
2. Auto-archive check: no daily notes older than 30 days.
3. No daily note for today → create `Journal/DailyNote-2026-04-07.md`.
4. Calendar: 3 meetings today (weekly sync 10:00 AM, 1:1 with Sarah 2:00 PM, design review 4:00 PM). Total: 2.5 hrs.
5. Tasks: 2 overdue tasks, 4 due today (estimated 5 hrs effort). Over-capacity warning.
6. Delegations: 1 overdue — Alex was supposed to send infra proposal by last Friday.
7. Review queue: 3 in review-work, 1 in review-self.
8. Milestones: Sarah's birthday in 3 days.
9. Meetings.yaml check: "1:1 with Sarah" → matches alias → `Meetings/1-1s/sarah-chen.md`. Append new session. "Design Review" → adhoc → `Meetings/Adhoc/design-review-2026-04-07.md`.
10. Output: "✅ Sync complete (8:47 AM). 3 meetings today (2.5 hrs), 2 tasks overdue, 1 delegation overdue, 4 items in review queue. 📅 Weekly note created for week of 2026-04-07."

### Example 2: Re-sync mid-afternoon

User says: "sync"

1. Daily note already exists with an 8:47 AM snapshot.
2. Compare: 2 tasks completed since morning, 1 new meeting added (ad-hoc at 3 PM), queue unchanged.
3. Prepend a new "Sync — 2:15 PM" snapshot at the top showing the current state. Previous snapshot left intact.
4. Output: "✅ Sync complete (2:15 PM). 1 meeting remaining (1 hr), 2 tasks completed since morning, 1 overdue task remaining, 4 items in review queue."

### Example 3: Plan tomorrow

User says: "plan tomorrow"

1. Target date = 2026-04-08 (Tuesday).
2. Tomorrow's daily note doesn't exist → create `Journal/DailyNote-2026-04-08.md`.
3. Read tomorrow's calendar: 2 meetings.
4. Tasks due tomorrow: 3.
5. Generate prep for tomorrow's meetings.
6. Output: "✅ Tomorrow's note ready (2026-04-08). 2 meetings, 3 tasks due. Prep files created."

---

## Edge Cases

**No calendar MCP:** Skip Today's Meetings and meeting prep sections. Note in output. Daily note still created with tasks and queue.

**No tasks due today:** Capacity Check shows 0 hrs task effort. Immediate Attention is empty — say "(nothing urgent today)".

**Re-run "plan tomorrow" after user edits:** Read existing tomorrow note. If user has written in Morning Focus, do not overwrite it. Prepend a new snapshot (same as normal re-run).

**Feature toggles:** If `features.meeting_prep` is false, skip meeting file creation entirely. If `features.milestones` is false, omit the Milestones section.

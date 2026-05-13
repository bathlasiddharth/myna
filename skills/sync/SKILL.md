---
name: sync
disable-model-invocation: true
description: 'Sync / "good morning" / "set up my day" — creates or refreshes the daily note, generates meeting prep, surfaces overdue tasks and review queue. Handles "plan tomorrow" and weekly note creation. Moves previous daily/weekly notes to archive when new ones are created.'
user-invocable: true
argument-hint: "[plan tomorrow]"
---

# myna-sync

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

Before reading or writing any structured vault files, read `~/.claude/myna/file-formats/_conventions.md` and the relevant domain files as needed: `~/.claude/myna/file-formats/journal.md` (sections `## Daily Note`, `## Weekly Note`), `~/.claude/myna/file-formats/entities.md`, section `## Project File`, and `~/.claude/myna/file-formats/meetings.md` (for the applicable meeting file type) when creating or reading meeting files.

Sets up or refreshes your day. Rerunnable at any time — each run prepends a fresh snapshot at the top of the daily note; previous snapshots stay untouched.

---

## When Invoked

**Normal sync ("sync", "good morning", "set up my day"):** Runs for today.

**Plan tomorrow ("plan tomorrow", "set up tomorrow"):** Runs for the next business day. Creates tomorrow's daily note and populates it with known calendar events and tasks due that day.

---

## Step 1: Read Config

Read from `_system/config/workspace.yaml`:
- `vault.path` → vault root; Myna subfolder is always `myna` (hardcoded)
- `work_hours.start` and `work_hours.end` → for capacity calculations
- `timezone` → for date resolution
- `calendar_event_prefix` → prefix for naming calendar events (event type labels are hardcoded: Focus, Task, Reminder)

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

Daily note path: `Journal/{YYYY-MM-DD}.md`
Weekly note path: `Journal/{YYYY-W\d\d}.md` (ISO week, e.g. `2026-W18`)

If "plan tomorrow" is run again after the user has already edited the note: treat it as a re-run. Prepend a new snapshot, never overwrite Morning Focus or any user-written content.

---

## Step 3: Weekly Note (first sync of the week only)

If no weekly note exists for the ISO week containing the target date:

1. **Archive previous weekly note:** Glob `Journal/*.md` for files matching `\d{4}-W\d{2}.md`. If any file is found and it is not the weekly note being created, move it to `Journal/Archive/Weekly/` using Bash `mv`.

2. **Create the new weekly note** at `Journal/{YYYY-W\d\d}.md` (e.g. `2026-W18.md`) using this template:

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

## Weekly Summary — {YYYY-MM-DD}

### Accomplishments
### Decisions Made
### Blockers
### Tasks: Completed vs Carried
### Self-Reflection
```

After writing the file, append packed day flags and carry-forward items from last week's wrap-up section below the table (before `## Weekly Goals`), or "(none)" if clean.

Populate Week Capacity by reading this week's calendar events (duration + count per day) and querying tasks with due dates in the coming week. Flag any day with more than 6 hours of meetings as packed. Suggest rebalancing if one day looks heavier than adjacent days.

---

## Step 4: Archive Previous Daily Note

**Normal sync (today):** Before creating or refreshing today's daily note, glob `Journal/*.md` for files matching `\d{4}-\d{2}-\d{2}.md` (daily pattern). Any file found whose name does not match today's date is the previous daily note — move it to `Journal/Archive/Daily/` using Bash `mv`. There should be at most one such file (the previous day's note). Report if moved; if none found, continue silently.

**Plan tomorrow:** Do NOT archive today's daily note. Today's note remains the active record for the current day. Archive happens only on the normal sync run for the new target date. Only archive any prior daily note that is not today's date and not tomorrow's date.

---

## Step 5: Gather Sync Data

Collect in parallel:

**Calendar:** Read today's (or tomorrow's) calendar events via the calendar MCP. For each event, note: title, start time, end time, attendees (count only — not names), and any existing meeting file path. If calendar MCP is unavailable, skip the meetings section and note it in the output.

**Due today:** Grep `{vault}/myna/Projects/` for `- \[ \]` with `📅 {target-date}`. Group by project file. Also grep outside `Projects/` for tasks with `📅 {target-date}` — these are "General" tasks with no project. Retain the full task text and source file for each result.

**Overdue (for briefing signal only):** Grep `{vault}/myna/Projects/` for `- \[ \]` with `📅 {date}` before target date. Count total; surface the top 3 by priority for the briefing. Full list available in `Dashboards/dashboard.md`.

**Overdue tasks assigned to others (for briefing signal only):** Grep `{vault}/myna/` for `- \[ \]` lines containing `[person::]` with `📅 {date}` before today, where the person value does not match `user.name` from workspace.yaml. Count total; surface any as red-flag bullets in the briefing. Full list available in `Dashboards/dashboard.md`.

**Blockers:** Grep `{vault}/myna/Projects/` for `> \[!warning\] Blocker` callout blocks. For each match, read a window of ~5 surrounding lines. Skip if `resolved:: true` or `status:: resolved` appears within the same callout block. Surface unresolved ones as briefing bullets.

**Milestones:** Read `people.yaml` and all People files. Find birthdays (`birthday: MM-DD`) or work anniversaries (`work_anniversary: YYYY-MM-DD`) within the next 7 days. Surface as briefing bullets. If none found in the next 7 days, omit this section silently.

**Review queue counts:** Read `{vault}/myna/ReviewQueue/review-work.md`, `review-people.md`, `review-self.md`, and `review-inbox.md`. Count unchecked items (`- \[ \]`) in each. If a file doesn't exist, treat its count as 0. Include total in briefing only if non-zero.

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
- Overdue tasks assigned to others as red-flag items
- Unresolved blockers
- Prep warnings for today's meetings (e.g., "Design review at 2 PM — no prep file yet")
- Capacity flag if task effort exceeds focus time ("Over capacity by {N} hrs")
- Milestones within 7 days (birthdays or work anniversaries — omit if none)
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

[[dashboard]]
```

### Re-run Snapshot Format (prepended at top)

```markdown
## Sync — {HH:MM}

### Briefing

{Updated briefing bullets. Include delta if notable: "Since last sync: {N} tasks completed, {M} meetings added."}

### Today's Meetings

- [ ] {HH:MM} [[{meeting-file}]] — {meeting title} {prep-status}
```

Note: re-run snapshots are compact — they include `### Briefing` and `### Today's Meetings` only (no `### Tasks Due Today` or `### Dashboards` — those live in the first snapshot of the day and remain static). Dashboards link row is permanent and not repeated in re-run snapshots.

---

## Step 7: Generate Meeting Prep Files

For each calendar event today:

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
   person: [[{Full Name}]]
   aliases: ["{Full Name} 1:1"]
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

4. For /myna:sync, generate **minimal prep** — enough to orient the user before the meeting without the full depth that /myna:prep-meeting provides:
   - Carry-forward items: unchecked items from the previous session's Prep section (if the meeting file exists)
   - Open action items between you and attendees: Grep project files for `[person:: {attendee-name}]` open tasks
   - Recent project context: last 2–3 timeline entries from the relevant project file
   - For 1:1s only: a reminder of the last 1:1 date and count of carry-forward items

   Full deep prep (pending feedback, coaching suggestions, career topics, personal notes) is available on demand via /myna:prep-meeting. Add a note at the top of the Prep section: "Basic prep from sync. Say 'prep for [meeting]' for full prep."

Meeting file is wiki-linked in the daily note's Today's Meetings section.

---

## Step 8: Output

Print the sync summary. Keep it short — one line per category. Include the Obsidian URI and full disk path for the daily note created or updated.

```
Sync complete ({HH:MM}). {N} meetings today ({M} hrs), {O} tasks due today, {P} overdue.
Daily note: obsidian://open?vault={vault}&file={path} | {disk-path}
{If first sync of week: "Weekly note created for 2026-W18. Previous week note archived."}
{If daily note was archived: "Previous daily note archived."}
{If calendar unavailable: "Calendar unavailable — meetings section skipped."}
```

Then print the Briefing bullets as a quick-scan list.

If there are meetings today, print a numbered list of them:

```
1. {HH:MM} {meeting title}
2. {HH:MM} {meeting title}
...
```

Then ask: "Want me to prep any of these? Say a number or 'all'."

If there are no meetings today, skip the list and the question.

---

## Examples

### Example 1: First sync of the day (Monday)

User says: "good morning"

1. No weekly note exists for this ISO week → archive previous weekly note if present, then create `Journal/2026-W15.md` with week capacity populated.
2. Archive check: glob `Journal/*.md` for `\d{4}-\d{2}-\d{2}.md` files that are not today's date → move any found to `Journal/Archive/Daily/`.
3. No daily note for today → create `Journal/2026-04-07.md`.
4. Calendar: 3 meetings today (weekly sync 10:00 AM, 1:1 with Sarah 2:00 PM, design review 4:00 PM). Total: 2.5 hrs.
5. Tasks: 2 overdue, 4 due today (estimated 5 hrs effort).
6. Delegations: 1 overdue — Alex was supposed to send infra proposal by last Friday.
7. Review queue: 3 in review-work, 1 in review-self.
8. Milestones: Sarah's birthday in 3 days.
9. Meetings.yaml check: "1:1 with Sarah" → matches alias → `Meetings/1-1s/sarah-chen.md`. Append new session. "Design Review" → adhoc → `Meetings/Adhoc/2026-04-07-design-review.md`.
10. Briefing bullets: over-capacity warning, 2 overdue tasks (top by priority), 1 overdue task assigned to Alex (infra proposal), Sarah's birthday in 3 days, 4 review queue items.
11. Output: "Sync complete (8:47 AM). 3 meetings today (2.5 hrs), 4 tasks due today, 2 overdue. Weekly note created for 2026-W15."

### Example 2: Re-sync mid-afternoon

User says: "sync"

1. Daily note already exists with an 8:47 AM snapshot.
2. Compare: 2 tasks completed since morning, 1 new meeting added (ad-hoc at 3 PM).
3. Prepend a new "Sync — 2:15 PM" snapshot (Briefing + Today's Meetings only). Previous snapshot left intact. Dataview and Dashboards sections are permanent — not repeated.
4. Output: "Sync complete (2:15 PM). 1 meeting remaining (1 hr), 2 tasks due today, 2 overdue."

### Example 3: Plan tomorrow

User says: "plan tomorrow"

1. Target date = 2026-04-08 (Tuesday).
2. Archive previous daily note if present. Tomorrow's daily note doesn't exist → create `Journal/2026-04-08.md`.
3. Read tomorrow's calendar: 2 meetings.
4. Tasks due tomorrow: 3.
5. Generate prep for tomorrow's meetings.
6. Output: "Tomorrow's note ready (2026-04-08). 2 meetings, 3 tasks due. Prep files created."

---

## Edge Cases

**No calendar MCP:** Skip Today's Meetings section and meeting prep. Note in output. Daily note still created with Briefing, Tasks Due Today, and Dashboards.

**No tasks due today:** Tasks Due Today section shows only the summary line "(nothing due today)". Omit all project sub-headers.

**Re-run "plan tomorrow" after user edits:** Read existing tomorrow note. If user has written in Morning Focus, do not overwrite it. Prepend a new snapshot (same as normal re-run).

**No milestones found:** If no birthdays or work anniversaries fall within the next 7 days, omit the milestones bullet from the Briefing silently.

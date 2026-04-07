# Sync

## Purpose

Sets up or refreshes your day — creates the daily note, generates meeting preps, surfaces tasks and alerts, suggests priorities, and flags over-commitment. Also handles planning modes, weekly note creation, and journal archiving.

## Triggers

- Starting or refreshing the day: "sync", "good morning", "set up my day"
- Planning requests: "plan my day", "plan tomorrow", "what should I focus on today?", "priority coaching", "week optimization"
- Weekly note is created automatically on first sync of the week — no separate trigger needed

## Inputs

- Calendar MCP (`calendar.list_events`) for today's meetings (or tomorrow's for "plan tomorrow")
- `_system/config/workspace.yaml` — work hours, timezone, archive_after_days, feature toggles
- `_system/config/projects.yaml` — project list for task context
- `_system/config/people.yaml` — for milestone detection (birthdays, anniversaries)
- `_system/config/meetings.yaml` — meeting type overrides
- Existing daily note `Journal/DailyNote-{today}.md` (if re-running)
- Task items across project files (via `tasks` MCP tool — open and overdue)
- Delegation items across project files (tasks with `type:: delegation`)
- Review queue files (`ReviewQueue/review-work.md`, `review-people.md`, `review-self.md`)
- Person files under `People/` (for milestones, if enabled)

## Procedure

### Morning Sync

1. Check if `Journal/DailyNote-{today}.md` exists.
   - If not, create it from the daily note template (see Daily Note Format below).
   - If it exists, this is a re-run. Read existing snapshots as context to highlight what changed (new meetings, completed tasks, resolved queue items since last sync). Prepend a new `## Sync — {HH:MM}` snapshot at the top of the file, below the frontmatter and `## Morning Focus` section. Never modify or delete previous snapshots.

2. Read today's calendar via `calendar.list_events`. For each meeting:
   - Determine meeting type from attendees, title, and recurrence pattern: 1:1 (two attendees), standup, project, adhoc. Check `meetings.yaml` for type overrides.
   - Create or update the prep file under `Meetings/{type}/{name}.md`. For 1:1s, append a new session section. For recurring, append a new session. For adhoc, create a new file.
   - Prep content: generate a brief meeting prep (key topics, open items related to attendees/projects). Full meeting prep is the prep-meeting skill's job — sync generates lightweight preps.
   - Add a linked checkbox to the daily note Meetings section: `- [ ] {HH:MM} [[{meeting-file}]] — {meeting name}`

3. Read open tasks across project files via the `tasks` MCP tool. Surface overdue tasks and tasks due today in the Immediate Attention section.

4. Check delegation items (tasks with `type:: delegation`). Flag overdue delegations and delegations with deadlines within 2 days.

5. Read review queue files. Count pending items per queue.

6. Write the Capacity Check section: compare available focus time (work hours from `workspace.yaml` minus total meeting hours) against estimated task effort due today. Flag if over-capacity.

7. Write the Immediate Attention section with overdue tasks, overdue delegations, approaching deadlines, and blockers.

8. If `features.milestones` is enabled, check `people.yaml` for upcoming birthdays and work anniversaries within the next 7 days. Add to Milestones section.

9. Suggest top 3 priorities based on: due dates (sooner = higher), defer count (tasks deferred multiple times rank higher), blocking status (blockers on others rank higher), and overdue delegations.

10. Output summary: "Sync complete ({HH:MM}). {N} meetings ({X} hrs), {N} overdue tasks, {N} overdue delegations, {N} items in review queue. Top priority: {description}."

### Weekly Note

On first sync of the week (Monday, or first workday if Monday was skipped), check if `Journal/WeeklyNote-{monday-date}.md` exists. If not, create it:

1. Calculate the Monday date for the current week.
2. Create `Journal/WeeklyNote-{monday-date}.md` with frontmatter (`week_start: {date}`) and sections: Week Capacity, Weekly Goals (empty, user-editable), Carry-Forwards.
3. Read the previous week's daily notes. List any unfinished items as carry-forwards.
4. Read the week's calendar via `calendar.list_events` for the full week. Build the Week Capacity table: meetings, focus time, and task effort per day. Flag packed days and suggest rebalancing.

### Planning Modes

Activated by specific planning requests. These read existing vault data and produce inline advice.

**Plan Day:** Read today's calendar, open tasks, priorities, and current daily note. Suggest a schedule for the day: which tasks to tackle in which focus blocks, what to tackle first, and flag over-commitment. Output inline.

**Priority Coaching:** Review open tasks, meetings, goals (from weekly note), and defer history. Recommend top 3 priorities with reasoning. Flag blockers, tasks deferred 3+ times, and delegation follow-ups overdue. Output inline.

**Week Optimization:** Read the full week's calendar, tasks, and weekly note. Suggest meetings that could be skipped or delegated, optimal times for focus blocks, and tasks that can safely defer to next week. Output inline.

### Plan Tomorrow

When the user says "plan tomorrow": create `Journal/DailyNote-{tomorrow}.md` from template if it doesn't exist. Run a sync-style snapshot for tomorrow using tomorrow's calendar and open tasks. If the note already exists (user edited it earlier or wrap-up carried items forward), prepend a snapshot without overwriting any existing content — Morning Focus, carried items, and user edits are all preserved.

The following morning, when sync runs and tomorrow's date is now today: if a "plan tomorrow" snapshot already exists in today's daily note from the prior evening, treat this as a re-run. Read the existing snapshot as context, prepend a fresh Morning Sync snapshot, and note in the output: "Updating your plan from last night." Highlight any changes since the plan was made (new meetings added, tasks completed overnight, new queue items).

### Journal Auto-Archiving

During each sync, move daily and weekly notes older than `journal.archive_after_days` (default: 30) from `Journal/` to `Journal/Archive/` using the `move` MCP tool. Do not archive today's note or the current week's note.

## Output

### Daily Note Format

`Journal/DailyNote-{YYYY-MM-DD}.md`:

```
---
date: {YYYY-MM-DD}
---

#daily

## Morning Focus

> User-editable. Sync never overwrites this section.

## Sync — {HH:MM}

### Capacity Check
{focus hours} focus time vs {task hours} task effort.
{Over-capacity warning if applicable.}

### Immediate Attention
- {overdue tasks, overdue delegations, approaching deadlines, blockers}

### Open Tasks
```dataview
TASK FROM "myna" WHERE !completed AND (due <= date(today) OR !due) SORT priority DESC LIMIT 20
```

### Delegations
```dataview
TASK FROM "myna" WHERE !completed AND type = "delegation" SORT due ASC
```

### Review Queue
{count} items pending. [[review-work]] ({n}), [[review-people]] ({n}), [[review-self]] ({n}).

### Milestones
{Upcoming birthdays, anniversaries if enabled.}

### Today's Meetings
- [ ] {HH:MM} [[{meeting-file}]] — {meeting name}

## End of Day — {HH:MM}

> Written by wrap-up skill. See wrap-up.md.
```

Meeting prep files are written under `Meetings/1-1s/`, `Meetings/Recurring/`, or `Meetings/Adhoc/` depending on meeting type.

Weekly note written to `Journal/WeeklyNote-{monday-date}.md`.

Planning mode output is shown inline — not saved to files.

### User-Facing Summary

After every sync, show a one-line summary with counts. For re-runs, also mention what changed since last sync.

## Rules

- **Morning Focus is sacred.** Never overwrite, move, or modify the Morning Focus section. It lives outside snapshot sections.
- **Missing files are not errors.** If project files, review queue files, or person files don't exist yet (first run, empty vault), skip those data sources and show counts as zero. A fresh vault is valid — sync still creates the daily note, reads the calendar, and generates meeting preps.
- **Snapshots are immutable.** On re-run, prepend a new snapshot. Never edit, collapse, restructure, or delete previous snapshots.
- **Lightweight meeting preps.** Sync generates brief preps (key topics, open items). The prep-meeting skill handles deep meeting preparation with coaching suggestions.
- **No skill chaining.** After sync, tell the user about follow-up actions ("Say 'prep for my 1:1 with Sarah' for detailed prep") but do not automatically invoke other skills.
- **Archive threshold.** If `journal.archive_after_days` is not configured, default to 30 days. Never archive the current day's or current week's note.
- **Weekly note timing.** Create weekly note on first sync of the week only. If the user syncs on Wednesday and no weekly note exists for this week, create it then.
- **High meeting count.** If the day's calendar has 10 or more meetings, add a note to the Capacity Check section: "Warning: {N} meetings scheduled today — this day may not be realistic. Consider which are optional."

## Examples

### Example: First Sync of the Day

User says "sync" on Monday morning. No daily note exists. No weekly note exists for this week.

**Reads:** Calendar (4 meetings: standup 9:30, 1:1 with Sarah 11:00, design review 2:00, team sync 4:00 — total 2.5 hrs). Open tasks (2 overdue: "API spec review" due Friday, "update runbook" due last Wednesday; 3 due today totaling 5 hrs effort). Delegations (1 overdue from Marcus, due 3 days ago). Review queue (5 items: 3 in review-work, 2 in review-self). People.yaml shows Alex's birthday is Thursday.

**Creates:**
- `Journal/WeeklyNote-2026-04-06.md` — capacity table for the week, carry-forwards from last week
- `Journal/DailyNote-2026-04-06.md` — full daily note with all sections populated
- `Meetings/Recurring/standup.md` — new session with brief prep
- `Meetings/1-1s/sarah-chen.md` — new session with brief prep
- `Meetings/Adhoc/design-review.md` — new file with brief prep
- `Meetings/Recurring/team-sync.md` — new session with brief prep

**Capacity Check:** 5.5 hrs focus time vs 5 hrs task effort + 2 overdue items. Over-capacity warning.

**Priorities:** (1) API spec review — due last Friday, overdue. (2) Follow up with Marcus — delegation overdue 3 days. (3) Update runbook — overdue since Wednesday, deferred twice.

**Output:** "Sync complete (8:30 AM). 4 meetings (2.5 hrs), 2 overdue tasks, 1 overdue delegation, 5 items in review queue. Weekly note created. Top priority: API spec review (overdue since Friday)."

### Example: Re-Run Sync at 2 PM

User says "sync" again at 2:00 PM. Daily note already has an 8:30 AM snapshot.

**Reads:** Existing 8:30 AM snapshot (4 meetings, 2 overdue tasks). Current state: 2 meetings done (standup, 1:1 with Sarah), API spec review completed, 1 new review queue item added.

**Writes:** Prepends a new `## Sync — 14:00` snapshot at the top (below frontmatter and Morning Focus). Highlights changes: "Since last sync: 2 meetings completed, 1 task completed (API spec review), review queue +1 (now 6)."

**Output:** "Sync complete (2:00 PM). 2 meetings remaining (1.5 hrs), 1 overdue task, 1 overdue delegation, 6 items in review queue. Top priority: follow up with Marcus (delegation overdue 3 days)."

### Example: Priority Coaching

User says "what should I focus on today?"

**Reads:** Open tasks (8 total, 2 overdue), weekly goals from weekly note, delegation status, defer history.

**Output inline:** "Top 3 priorities: (1) Marcus delegation follow-up — overdue 3 days, blocking his work. (2) Update runbook — deferred 3 times, took on tech debt. (3) Review Sarah's design doc — due tomorrow, she's waiting on you. Consider: the MBR draft has been deferred twice but isn't due until Friday. Safe to defer once more."

### Example: Weekly Note Creation (first sync of the week)

User syncs on Monday April 6. No weekly note exists for this week.

**Reads:** Last week's daily notes (March 30 – April 3) for unfinished items. This week's calendar via `calendar.list_events` for the full week.

**Creates `Journal/WeeklyNote-2026-04-06.md`:**
```
---
week_start: 2026-04-06
---

#weekly

## Week Capacity

| Day | Meetings | Focus Time | Notes |
|-----|----------|------------|-------|
| Mon (Apr 6) | 2.5 hrs | 5.5 hrs | |
| Tue (Apr 7) | 4.0 hrs | 4.0 hrs | |
| Wed (Apr 8) | 1.5 hrs | 6.5 hrs | |
| Thu (Apr 9) | 5.5 hrs | 2.5 hrs | ⚠ packed |
| Fri (Apr 10) | 1.0 hrs | 7.0 hrs | |

**Total:** 14.5 hrs meetings, 25.5 hrs focus. Thursday is meeting-heavy.

## Weekly Goals
> User-editable. Add your goals for the week here.

## Carry-Forwards
- MBR draft (from Friday Apr 3 — deferred twice)
- Update runbook (from Wednesday Apr 2)
```

**Output note in sync summary:** "Weekly note created for week of Apr 6. 2 carry-forwards from last week. Thursday looks packed (5.5 hrs of meetings)."

### Example: Week Optimization

User says "week optimization" or "help me optimize my week."

**Reads:** Full week's calendar, all open tasks, weekly note (goals and capacity table).

**Output inline:** "This week has 14.5 hrs of meetings across 5 days. Observations:
- Thursday is packed (5.5 hrs). Consider: the 3pm Platform sync has 8 attendees and a clear written agenda — async status update may be sufficient.
- Tuesday and Thursday have back-to-back meetings 10am–1pm. Cognitive load will be high; don't schedule deep work in those windows.
- 2 tasks due this week total ~6 hrs effort. Best fit: Wednesday morning (6.5 hrs focus) and Friday (7 hrs focus).
- MBR draft has been deferred twice. If it's not done by Wednesday, it will be overdue by Friday review.
Suggestions: (1) Skip or delegate the Thursday 3pm Platform sync. (2) Block Wednesday 9–11am for MBR draft. (3) Move Friday afternoon task to Thursday if you clear the 3pm sync."

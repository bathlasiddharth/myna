---
name: calendar
description: Create personal calendar time blocks, reminders, and task breakdowns. Finds free slots, proposes options, user confirms. Three-layer safety on every write — no attendees, ever. Does not handle meeting prep or scheduling with others.
user-invocable: true
argument-hint: "reserve [duration] [when] for [what] | remind me [what] at [time] | break down [task]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:init` and stop.

# calendar

Creates personal calendar events (time blocks and reminders) and breaks down tasks into subtasks. Every calendar write is personal-only — no attendees, ever.

---

## Time Block Planning

**Triggers:** "plan my day", "reserve 2 hours Thursday for the design doc", "block 3 hours this week for deep work", "plan my day with time blocks", "find me a good slot for [task]"

**Toggle:** `features.time_blocks` in workspace.yaml. If disabled, decline: "Time block planning is disabled in your config."

### How It Works

**Step 1: Determine scope and duration**

For "plan my day": read workspace.yaml work hours, query today's calendar for free slots, read open tasks due today or flagged as today's focus. Suggest time block assignments for each task, fitting them into free slots. Show a proposed schedule inline and ask the user to confirm before creating any events.

For specific requests: extract duration (required), when (day, "this week", "morning", etc.), and purpose.

**Step 2: Find available slots**

Read workspace.yaml for `work_hours.start`, `work_hours.end`, and `timezone`. Query the calendar MCP for events in the target window. Identify contiguous free slots of at least the requested duration.

**For a specific day:** List up to 3 available slots that fit. If the day has no slots of the requested size, say so and offer the closest alternatives (shorter slot today, or the requested size on an adjacent day).

**For "this week" or "find a good time":** Scan Monday–Friday for the best slots. Prefer:
- Mornings for focus work (if `work_hours.start` is morning)
- Days with fewer meetings
- Contiguous blocks over fragmented ones

Present up to 3 slot options. Let the user pick. Do not pick for them.

**Step 3: Confirm event details**

Show all parameters before creating:

```
📅 Proposed time block:
Title: [Myna:Focus] {purpose}
When: {day}, {start time}–{end time} ({duration})
No attendees.

Create this event? (yes / pick a different slot / cancel)
```

Event type labels (`[Myna:Focus]`, `[Myna:Task]`, `[Myna:Reminder]`) and the base prefix (`[Myna]`) are configurable in workspace.yaml. Focus work → `[Myna:Focus]`, task-linked → `[Myna:Task]`.

**Step 4: Create the event**

Only after explicit user confirmation. Apply the three-layer calendar protection from the safety steering skill: verify no attendees and title has configured prefix before calling the MCP tool. If either check fails, stop and report.

Call the calendar MCP's create_event tool with:
- `title`: `[Myna:Focus] {purpose}` (using configured type label)
- `start`: ISO datetime
- `end`: ISO datetime
- `description`: optional context about the task
- **No attendees field — never.**

If creation succeeds, confirm: "✅ Time block created: {title}, {day} {start}–{end}."

---

## Calendar Reminders

**Triggers:** "remind me about the design review at 2pm", "remind me to call Alice at 3pm", "set a reminder for the deployment window at 11 AM"

**Toggle:** `features.calendar_reminders` in workspace.yaml. If disabled, decline: "Calendar reminders are disabled in your config."

### Two Reminder Types

**Task reminder:** "Remind me about [task] at [time]" — the reminder is linked to an existing task or event. Title includes the task name.

**Standalone reminder:** "Remind me to [action] at [time]" — no linked vault task. Just a calendar notification.

### How It Works

**Step 1: Parse the request**

Extract: what to be reminded about, when (time today or specific datetime), and whether it links to a vault task.

If "at 2pm" is ambiguous (today or tomorrow?), assume today if the time hasn't passed, otherwise tomorrow. Confirm in the output.

**Step 2: Confirm details**

```
⏰ Proposed reminder:
Title: [Myna:Reminder] {what}
When: {day}, {time} ({duration}: 15 min)
No attendees.

Create this reminder? (yes / cancel)
```

Reminders default to 15-minute duration (enough for the calendar app to send a notification). Duration is not configurable in this skill.

**Step 3: Create the event**

Same three-layer protection as time blocks. No attendees. On success: "✅ Reminder set: {what} at {time}."

---

## Task Breakdown

**Triggers:** "break down [task]", "help me break down the auth migration design doc", "what are the subtasks for [goal]"

### How It Works

**Step 1: Read context**

If the task is named, search `myna/Projects/` for a matching task (`Grep` for the task description). Read the surrounding project file context (recent timeline entries, blockers, key people).

If the task is pasted inline, use the pasted text as context.

**Step 2: Generate subtasks**

Break the task into concrete, independently executable subtasks. Each subtask should be completable in one sitting (1–4 hours). Aim for 3–7 subtasks — fewer if the task is simple, more only if truly needed.

Show subtasks inline first:

```
📋 Subtasks for "{task name}":

1. {subtask 1} (~{N} hrs)
2. {subtask 2} (~{N} hrs)
3. {subtask 3} (~{N} hrs)
...

Total estimated effort: ~{N} hrs

Write these as tasks in the project file? (yes / edit first / cancel)
```

**Step 3: Write subtasks (on confirmation)**

Append subtasks directly after the `## Open Tasks` section header in the relevant project file (before the Dataview block, not inside it). Use Obsidian Tasks plugin TODO format:

```
- [ ] {subtask description} 📅 {YYYY-MM-DD if suggested} [project:: {project}] [type:: task] [Auto] (capture, {YYYY-MM-DD})
```

If no project file is found, append them to the current daily note's `## Morning Focus` section (or at the end of the file if Morning Focus doesn't exist).

Tasks go in the project file, not the Dataview query block — the Dataview query will automatically pick them up.

**Step 4: Optionally schedule**

After writing subtasks: "Want me to find calendar slots for any of these? Say 'block time for subtask 1' and I'll find a slot."

Do not auto-schedule. Let the user choose which subtasks to block time for.

---

## Examples

### Example 1: Reserve time for a specific task

User says: "reserve 2 hours on Thursday for the design doc"

Read workspace.yaml: work hours 9 AM–5 PM, prefix `[Myna]`.
Query calendar for Thursday: 10 AM–11 AM (meeting), 2 PM–3 PM (1:1). Free slots: 9–10 AM (1 hr, too short), 11 AM–2 PM (3 hrs ✓), 3–5 PM (2 hrs ✓).

Output:
```
📅 Available slots on Thursday (Apr 10):

Option 1: 11:00 AM–1:00 PM (2 hrs) — morning, clear of meetings
Option 2: 3:00 PM–5:00 PM (2 hrs) — afternoon block after 1:1

Proposed time block:
Title: [Myna:Focus] Design doc
When: Thursday Apr 10, 11:00 AM–1:00 PM
No attendees.

Pick a slot (1 or 2), or say "cancel".
```

User says "1".

```
✅ Time block created: [Myna:Focus] Design doc, Thursday Apr 10 11:00 AM–1:00 PM.
```

### Example 2: Find best slot this week for deep work

User says: "block 3 hours this week for deep work on the MBR"

Scan the week. Tuesday has the lightest calendar (1 meeting at 3 PM, otherwise free). Best options:

```
📅 Best slots this week for a 3-hr focus block:

Option 1: Tuesday Apr 8, 9:00 AM–12:00 PM — lightest day, uninterrupted morning
Option 2: Thursday Apr 10, 11:00 AM–2:00 PM — before the afternoon 1:1
Option 3: Friday Apr 11, 9:00 AM–12:00 PM — but Friday afternoons tend to have interruptions

Proposed time block:
Title: [Myna:Focus] MBR draft
When: Tuesday Apr 8, 9:00 AM–12:00 PM
No attendees.

Create this, pick another option, or cancel?
```

### Example 3: Standalone reminder

User says: "remind me to check the deployment logs at 2pm today"

```
⏰ Proposed reminder:
Title: [Myna:Reminder] Check deployment logs
When: Today, 2:00 PM–2:15 PM
No attendees.

Create this reminder? (yes / cancel)
```

User confirms. Event created.

### Example 4: Task breakdown

User says: "help me break down the auth migration design doc"

Reads `Projects/auth-migration.md`. Finds the task "Write auth migration design doc" with 3 related timeline entries.

```
📋 Subtasks for "auth migration design doc":

1. Outline sections and acceptance criteria (~1 hr)
2. Draft current state and problem framing (~1.5 hrs)
3. Draft proposed solution and alternatives (~2 hrs)
4. Add migration timeline and risk matrix (~1 hr)
5. Review and incorporate Sarah's feedback (~1 hr)

Total estimated effort: ~6.5 hrs

Write these as tasks in Projects/auth-migration.md? (yes / edit first / cancel)
```

User says "yes". Tasks appended to auth-migration.md. "Want me to find calendar slots for any of these?"

---

## Edge Cases

**Calendar MCP unavailable:** For time blocks and reminders, inform the user and stop. "Calendar MCP is unavailable — can't check free slots or create events. Try again when it's connected."

**No free slots of requested duration:** "No {duration}-hour slots available on {day}. Closest options: {slot-A} ({shorter-duration}), or {next-available-day} for a full {duration}-hour block."

**Ambiguous request — day not specified:** Ask before proceeding. "Which day? (or say 'find the best time this week' and I'll scan the week)"

**Duration exceeds work day:** "That's {N} hours — longer than your work day. Want multiple shorter blocks instead?"

**Task breakdown with no matching project:** "Couldn't find a project file for '{task}'. Want me to write the subtasks to your daily note instead?"

**User specifies an already-booked time:** Show what's on the calendar at that time and offer the nearest free slots instead. Don't overwrite existing events.

---
name: calendar
disable-model-invocation: true
description: Create personal calendar time blocks, reminders, and task breakdowns. Finds free slots, proposes options, user confirms. Three-layer safety on every write — no attendees, ever. Does not handle meeting prep or scheduling with others.
user-invocable: true
argument-hint: "reserve [duration] [when] for [what] | remind me [what] at [time] | break down [task]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

Before reading or writing project files, read `~/.claude/myna/file-formats/_conventions.md` and `~/.claude/myna/file-formats/entities.md`, section `## Project File`.

# calendar

Creates personal calendar events (time blocks and reminders) and breaks down tasks into subtasks. Every calendar write is personal-only — no attendees, ever.

---

## Time Block Planning

**Triggers:** "reserve 2 hours Thursday for the design doc", "block 3 hours this week for deep work", "plan my day with time blocks", "find me a good slot for [task]"

Note: "plan my day" (without "time blocks" or a specific task) routes to `/myna:plan` for general prioritization advice, not here. This skill handles calendar-specific blocking and scheduling only.

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

Write subtasks to the `## Tasks` section in the relevant project file (raw task storage — do not write to or around the `## Open Tasks` Dataview block). Use Obsidian Tasks plugin TODO format:

```
- [ ] {subtask description} 📅 {YYYY-MM-DD if suggested} [project:: [[{project}]]] [type:: task] [Auto] (capture, {YYYY-MM-DD})
```

If no project file is found, append them to the current daily note at `Journal/{YYYY-MM-DD}.md`. If the daily note does not exist, ask whether to create it or show the subtasks inline only.

Tasks go in `## Tasks`, not the `## Open Tasks` Dataview query block — the Dataview query automatically picks them up from `## Tasks`.

**Step 4: Optionally schedule**

After writing subtasks: "Want me to find calendar slots for any of these? Say 'block time for subtask 1' and I'll find a slot."

Do not auto-schedule. Let the user choose which subtasks to block time for.

## Edge Cases

**Calendar MCP unavailable:** For time blocks and reminders, inform the user and stop. "Calendar MCP is unavailable — can't check free slots or create events. Try again when it's connected."

**No free slots of requested duration:** "No {duration}-hour slots available on {day}. Closest options: {slot-A} ({shorter-duration}), or {next-available-day} for a full {duration}-hour block."

**Ambiguous request — day not specified:** Ask before proceeding. "Which day? (or say 'find the best time this week' and I'll scan the week)"

**Duration exceeds work day:** "That's {N} hours — longer than your work day. Want multiple shorter blocks instead?"

**Task breakdown with no matching project:** "Couldn't find a project file for '{task}'. Want me to write the subtasks to your daily note instead?"

**User specifies an already-booked time:** Show what's on the calendar at that time and offer the nearest free slots instead. Don't overwrite existing events.

# Calendar

## Purpose

Create personal calendar events — time blocks for focused work, reminders for time-sensitive items — and break down tasks into subtasks. All calendar events are personal only, never with attendees.

## Triggers

- Reserving focus time: "reserve 2 hours Thursday for the design doc", "block focus time tomorrow morning", "reserve 3 hours this week for deep work", "reserve focus time for [task]"
- Reminders: "remind me about the design review at 2pm", "remind me to call Alice at 3pm", "remind me to follow up with [person]"
- Task breakdown: "break down the API migration task", "split this task into subtasks"

Note: "plan my day" routes to **sync** (priority advice), not here. This skill handles calendar event creation. Sync decides what to work on; calendar creates the events.

## Inputs

- `workspace.yaml`: `work_hours` (start/end), `timezone`, `calendar_event_prefix` (default `[Myna]`), `calendar_event_types` (focus/task/reminder labels)
- Calendar MCP via `calendar.list_events`: today's or target day's events (to find free slots)
- Task items via Obsidian `tasks` query: for task-linked reminders and task breakdown
- Project files: for task breakdown context

## Procedure

### Time Block Planning

1. Determine what the user wants to block time for and when. Resolve relative dates ("Thursday", "this week", "tomorrow morning") to actual dates using `timezone` from workspace.yaml.

2. Read the user's calendar for the target date(s) via `calendar.list_events`. Identify free slots within `work_hours`.

3. Suggest available slots. For single-block requests ("reserve 2 hours Thursday"), show 2-3 options with times. For multi-day requests ("reserve 3 hours this week for deep work"), scan the week and show the best slots — prefer morning blocks and days with fewer meetings. For "plan my day" requests routed here, also read open tasks via Obsidian `tasks` query to suggest *what* to block time for (highest priority tasks, tasks due soon) alongside *when*.

4. Once the user picks a slot, apply three-layer calendar protection (D003) before creating:
   - **Layer 1 — instruction rule:** the event title MUST use the configured prefix and type label. Format: `{calendar_event_prefix}:{calendar_event_types.focus}` for focus blocks, `{calendar_event_prefix}:{calendar_event_types.task}` for task blocks. Default example: `[Myna:Focus] Design doc review`. NEVER include attendees.
   - **Layer 2 — pre-tool check:** before calling `calendar.create_event`, verify the call has no attendees parameter and the title starts with the configured prefix. If either check fails, abort and show the error. (On AI tools without hook support, this layer is skipped — layers 1 + 3 still protect.)
   - **Layer 3 — explicit confirmation:** show the user all event parameters (title, date, start time, end time) and wait for confirmation before creating.

5. Create the event via `calendar.create_event` with title, start, end, and description (brief context — e.g., related project or task details so the event is useful on the calendar). Never pass attendees.

6. Confirm: "Created: [Myna:Focus] Design doc review, Thursday 9:00–11:00 AM."

### Calendar Reminders

1. Determine reminder type:
   - **Task reminder:** user references an existing task ("remind me about the design review at 2pm") — query Obsidian `tasks` to find the matching task. Link the reminder description to the task.
   - **Standalone reminder:** no matching task ("remind me to call Alice at 3pm") — no Obsidian task created, calendar event only.

2. Build the calendar event. Title format: `{calendar_event_prefix}:{calendar_event_types.task}` for task reminders (e.g., `[Myna:Task] Design review`), `{calendar_event_prefix}:{calendar_event_types.reminder}` for standalone (e.g., `[Myna:Reminder] Call Alice`). Duration: 15 minutes unless the user specifies otherwise.

3. Apply three-layer D003 protection (same as time blocks — no attendees, prefix check, explicit confirmation).

4. Create the event. Confirm with the time and title shown.

   **Reminder note:** For reminders like "remind me to follow up with [person] next week," consider suggesting a task as a complement: "Calendar reminder created. If you also want this to show in Obsidian task queries, say 'add task: follow up with {person}' with a due date." The calendar event fires the notification; the task ensures it appears in Dataview queries and the daily note.

### Task Breakdown

1. Identify the target task. If the user names it, search via Obsidian `tasks` query. If ambiguous, ask.

2. Read the task and its surrounding context (project file, related timeline entries) to understand scope.

3. Split the task into subtasks — each as an indented TODO under the parent task in the same file. Each subtask gets its own due date and effort estimate based on the parent task's deadline and total effort. Subtasks inherit the parent's project and priority unless the breakdown warrants different priorities.

4. Write the subtasks to the project file under the parent task. Show the breakdown to the user inline.

**Example — Task Breakdown:**
User says "break down the API spec review" → finds task `- [ ] Review API spec 📅 2026-04-12 ⏫ [project:: Auth Migration] [effort:: 4h]` in `Projects/auth-migration.md` → splits into:
```
- [ ] Review API spec 📅 2026-04-12 ⏫ [project:: Auth Migration] [effort:: 4h]
    - [ ] Read current API spec and note gaps 📅 2026-04-10 [project:: Auth Migration] [effort:: 1.5h]
    - [ ] Cross-check against migration requirements 📅 2026-04-11 [project:: Auth Migration] [effort:: 1.5h]
    - [ ] Write review feedback and share 📅 2026-04-12 [project:: Auth Migration] [effort:: 1h]
```
→ "Broke down 'Review API spec' into 3 subtasks in auth-migration.md."

**Example — Time Block Planning:**
User says "reserve 2 hours Thursday for the design doc" → reads calendar for Thursday, work hours 9:00–17:00, finds meetings at 10:00–11:00 and 14:00–15:00 → suggests: "Thursday has meetings at 10–11 AM and 2–3 PM. Available 2-hour blocks: (1) 9:00–11:00 AM — but tight before your 10 AM. (2) 11:00 AM–1:00 PM. (3) 3:00–5:00 PM." → user picks option 2 → shows: "[Myna:Focus] Design doc, Thursday 11:00 AM–1:00 PM. Create?" → user confirms → creates event → "Created: [Myna:Focus] Design doc, Thursday 11:00 AM–1:00 PM."

**Example — Calendar Reminder:**
User says "remind me about the design review at 2pm" → finds task "Design review" in tasks → shows: "[Myna:Task] Design review, today 2:00–2:15 PM. Create?" → user confirms → creates event → "Created: [Myna:Task] Design review, today 2:00 PM."

## Output

- **Calendar events:** created via `calendar.create_event` (personal, no attendees)
- **Task subtasks:** written as indented TODOs in the parent task's project file using Obsidian Tasks plugin format
- **Inline:** confirmation of created events or breakdown summary shown to the user

## Rules

- **Check feature toggles:** check `features.time_blocks` before creating time blocks, `features.calendar_reminders` before creating reminders. Task breakdown requires no toggle. If the relevant toggle is disabled, inform the user and stop.
- **Never add attendees to any calendar event.** This is absolute — D003.
- **Always use the configured prefix.** Read `calendar_event_prefix` and `calendar_event_types` from workspace.yaml. Never create an event without the prefix.
- **Always confirm before creating.** Show all event parameters and wait for explicit user approval.
- **Graceful degradation:** if no calendar MCP is configured (`mcp_servers.calendar` not set in workspace.yaml), inform the user that calendar features are unavailable. Task breakdown still works without calendar MCP.
- **Stay in lane:** "plan my day" as priority advice routes to sync, not here. This skill handles calendar event creation and task breakdown only. Planning decides *what* to work on; this skill creates the events.
- **Free slot detection respects work hours only.** Use `work_hours.start` and `work_hours.end` from workspace.yaml. Do not suggest slots outside work hours unless the user explicitly asks.
- **Reminders default to 15 minutes** unless the user specifies a duration.
- **Task breakdown writes subtasks in place** — indented under the parent task in the same file. Do not create separate files for subtasks.

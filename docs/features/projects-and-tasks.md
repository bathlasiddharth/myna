# Projects & Tasks — Features

**Scope:** Project files, timelines, tasks, blocker detection, context switching, search.

---

## Features

> **Moved to cross-domain.md:** F30 (Universal Done), F37 (Link Manager), F25 (Vault-Wide Search) — these span multiple domains and are consolidated there. Context park/resume mechanics also moved to cross-domain (Park & Resume).

### Project File Management

One-line summary: Each project gets a dedicated, structured file that serves as the single source of truth for that project.

- Each project in the registry has a file under `myna/Projects/{project-name}.md`
- **Date + source on every entry across the entire project file.** Standard format: `[2026-04-03 | source]` where source is: email (with sender), slack (with channel/person), meeting (with meeting name), capture, user (typed directly). This applies to timeline entries, notes, links, tasks — everything. Consistent traceability so you can always answer "when did this come up and where did it come from?"
- File sections: overview (description, status, key people), timeline (append-only log), open tasks (Dataview query), links, notes/scratchpad
- **Notes/scratchpad section:** free-form area for thoughts, ideas, and context that don't fit neatly into the timeline. Every entry auto-dated with source: `[2026-04-03 | capture] might want to consider microservices before Q3` or `[2026-04-03 | email from Sarah] check if the new SDK supports streaming`. Source values: capture, email, slack, meeting, user (typed directly). Helps recall not just when but where the thought came from.
- Status values: active, paused, complete — status changes are logged in the timeline
- Created automatically when a project is added to the registry, or on-demand via "create project file for [project]"
- Key people section links to person files via wiki-links

### Project Timeline

One-line summary: Append-only chronological log of everything significant that happens on a project.

- Each entry has: date + source (standard format above), category, content
- Categories: Update, Blocker, Decision, Action Item, Escalation, Recognition, Risk
- Decisions logged as timeline entries with Decision category — no separate decision log (D014)
- Verbatim source text (D015) stored separately in `_system/sources/{project-name}.md` — one file per project, raw text appended with date + source header. Timeline entries link to the relevant section in the source file. Keeps the timeline clean and scannable while preserving full traceability.
- Wiki-links to people and related projects in entry content
- Callout blocks for visual emphasis on blockers and decisions
- Sorted chronologically by when the event happened, not when it was processed. An email from March 15 processed on March 20 goes in the March 15 position.
- Append-only — existing entries are never edited or deleted

### Task Management

One-line summary: Add, track, and query TODOs using Obsidian Tasks plugin and Dataview, with delegations as a task type.

- Task fields: title (short, scannable — shown in lists and queries), description (context, details, source reference per non-functional rules), project, priority (high/medium/low), start date, due date, effort estimate, type, person (for delegations)
- Agent always creates formatted tasks from natural language — user never types task syntax
- Agent fills in all fields from the source, marking each as `explicit` (directly stated) or `inferred` (agent's guess):
  - **explicit** — directly stated in the source ("by Friday" → due date is explicit)
  - **inferred** — agent's best guess from context ("this seems high priority since it blocks the launch" → priority is inferred)
- **Review only when needed:** if ALL attributes are explicit from the source, the task is written directly — no review queue, no `review-status` flag. If ANY attribute is inferred, the task gets `review-status:: pending` and goes to the review queue with inferred fields clearly marked so the user knows what to check. Example: `priority:: high (inferred — blocks launch)`, `due:: 2026-04-10 (explicit)`, `project:: Auth Migration (inferred — from email folder)`
- User corrects inferred values as needed, marks `review-status:: reviewed`. Goal: review queue stays targeted and valuable — not busywork.
- Delegations are regular tasks with `type:: delegation` and `person::` field for the owner (D013) — no separate delegation tracker
- Delegation proactive alerts: overdue delegations surfaced in daily note Immediate Attention section; approaching-deadline delegations (within 2 days) shown as a nudge. "What's overdue from my team?" queries all delegations past due date. This is the difference between tracking delegations and actually following up on them.
- Task breakdown: "break down [task]" → splits into indented subtasks with individual due dates and effort
- Tasks live in canonical locations (project files, personal TODOs file)
- **Two views — my tasks vs others' tasks:** Dataview queries separate tasks into:
  - **My tasks:** tasks owned by you (no `person::` field, or `person::` is you) — what YOU need to do
  - **Delegated / others' tasks:** tasks with `person::` field pointing to someone else — what you're WAITING ON
  - Both views in project files, daily note, and dashboards. Clear separation so you know at a glance what's on your plate vs what you're tracking.
- Completed tasks auto-hide from active views via `not done` queries

### Recurring Tasks

One-line summary: Tasks that auto-regenerate on a schedule using Tasks plugin native recurrence.

- "Create recurring task: weekly team status update" → task with `🔁 every week`
- When completed, Tasks plugin auto-creates the next occurrence
- Supported intervals: daily, weekly, biweekly, monthly, quarterly, custom
- Examples: `🔁 every week`, `🔁 every month`, `🔁 every 2 weeks`, `🔁 every quarter`

### Blocker Detection

One-line summary: Scans project data for signs of blockers and surfaces them in daily notes and project files.

- Detects: tasks overdue by threshold, explicit blocker entries in timelines, blocker keywords in vault data
- Cross-team dependency tracking: dependencies on other teams are tracked as explicit tasks with `type:: dependency` and a due date (e.g., "Waiting on Team X for API — due March 15"), or as timeline entries with the Dependency category. These are created by the user or approved from the review queue — never inferred from free text, because "Team X mentioned March 15 as a possibility" and "Team X committed to March 15" are critically different. Once explicit, they're tracked like any task: "What am I waiting on from other teams?" queries all dependency-type tasks.
- Each detected blocker includes source reference (which file, which entry)
- Surfaced in: daily note (Immediate Attention section), project file (Blockers callout)
- Informational only — no auto-actions, no auto-escalation
- Connects to escalation drafting in writing-and-drafts domain (user can say "escalate this blocker" to draft a message)

### Project Status Summary

One-line summary: "Catch me up on [project]" gives an instant status snapshot.

- Reads project file and surfaces: current status, recent timeline entries (last N), open blockers, pending tasks, upcoming deadlines, upcoming meetings (next 7 days from calendar, recurring meetings grouped — e.g., "Weekly sync (Mon, Wed, Fri)" not three separate entries)
- Depth control — two modes:
  - **Quick:** "catch me up quick on [project]" → 3-5 bullet TL;DR suitable for a hallway conversation or context switch. Status, top blocker, next milestone.
  - **Full:** "catch me up on [project]" (default) → complete status with recent timeline, all blockers, task breakdown, dependency status, upcoming meetings (7 days)
- Output shown inline — quick context for switching between projects


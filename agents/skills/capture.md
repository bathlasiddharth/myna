# Capture

## Purpose

Routes user-entered data to the right vault destinations. The user says what happened; capture figures out where it goes.

## Triggers

- "capture: [anything]" — multi-destination quick capture
- "observation about [person]: ..." — log an observation
- "note about [person]: ..." — add a personal note
- "add task: ..." — create a task
- "create recurring task: ..." — create a recurring task
- "save link: [url] ..." — save a URL to the vault
- "update status of [project] to [status]" — change project status
- "[project] scratchpad: ..." or "note on [project]: ..." — add to project notes

## Inputs

- `projects.yaml` — project names, aliases, statuses
- `people.yaml` — person names, aliases, relationship tiers
- Existing vault files at write destinations (for dedup check on observations)

## Procedure

### 1. Quick Capture

"capture: [anything]" — decompose the input into one or more entries, each routed to its own destination.

1. Read `projects.yaml` and `people.yaml` to resolve entity references.
2. Decompose the input into individual entries. Determine each entry's type and destination:
   - Project update → append to `Projects/{project}.md` under `## Timeline`
   - Person observation (strength, growth-area, contribution) → append to `People/{person}.md` under `## Observations`
   - Person recognition → append to `People/{person}.md` under `## Recognition`
   - Task or action item → formatted TODO in the relevant project file under `## Open Tasks` (or daily note if no project context)
   - Contribution by the user → append to `Journal/contributions-{week}.md` (Monday date)
   - Personal note about someone → append to `People/{person}.md` under `## Personal Notes`
3. For each entry, determine provenance: items the user explicitly stated get `[User]`. Items the agent interpreted from context get `[Inferred]`. If the destination is genuinely ambiguous, route to the appropriate review queue.
4. Before writing observations or recognition, read the target person file's existing entries to avoid near-duplicates.
5. Write each entry using `append` under the correct section for its type:
   - Timeline entries → `## Timeline` in the project file
   - Tasks → `## Open Tasks` in the project file (or daily note if no project)
   - Observations → `## Observations` in the person file
   - Recognition → `## Recognition` in the person file
   - Personal notes → `## Personal Notes` in the person file
   - Contributions → `## Contributions — Week of {monday-date}` in the contributions file
   - Links → `## Links` in the entity file
   Use canonical entry formats from conventions.md. One input can produce multiple entries — nothing is silently dropped.
6. Output: list each entry written with its destination file, or explain what went to the review queue and why.

### 2. Observation Logging

"observation about [person]: [content]"

1. Resolve the person name against `people.yaml` using fuzzy name resolution (exact match → alias → case-insensitive → prefix → fuzzy). If multiple matches, list options and ask. If no match, ask for clarification.
2. Determine observation type from content: **strength**, **growth-area**, or **contribution**.
3. Read `People/{person}.md` under `## Observations` to check for near-duplicates (same observation already logged from any source).
4. Append to `## Observations` in format:
   ```
   - [{YYYY-MM-DD} | capture] **{type}:** {observation} [User]
   ```
5. For growth-area observations, also append to `## Pending Feedback` with a coaching-tone talking point for how to deliver the feedback constructively.

### 3. Recognition Logging

"[person] did a great job on ..." or explicit recognition phrasing.

1. Resolve person name via fuzzy name resolution.
2. Read `People/{person}.md` under `## Recognition` for dedup.
3. Append to `## Recognition`:
   ```
   - [{YYYY-MM-DD} | capture] {what they did} — {context} [User]
   ```

### 4. Task Creation

"add task: [description]"

1. Extract task attributes from natural language: title, project (resolve via fuzzy name resolution), priority, due date (resolve relative dates to absolute), type (task, delegation, dependency), person (for delegations), effort estimate.
2. Mark each attribute as explicit (stated by user) or inferred (agent's guess). If any field is inferred, add `[review-status:: pending]` with the inferred fields marked: `[project:: Auth Migration (inferred)]`.
3. Write the formatted TODO using Obsidian Tasks plugin syntax:
   ```
   - [ ] {title} 📅 {due-date} {priority-emoji} [project:: {name}] [type:: {type}] [person:: {name}] [User]
   ```
   Priority emoji: `⏫` high, `🔼` medium, omit for low. Omit optional fields (`[person::]`, `[effort::]`, `[review-status::]`) when not applicable.
4. Append the task to the relevant project file under `## Open Tasks`. If no project can be determined, append to today's daily note.

**Recurring tasks:** "create recurring task: weekly status update"
- Add recurrence field: `🔁 every {interval}` (week, month, 2 weeks, quarter, etc.)
- When completed, the Tasks plugin auto-creates the next occurrence.

### 5. Link Saving

"save link: [url]" or "save link: [url] for [entity]"

1. If an entity is specified, resolve it via fuzzy name resolution against projects, people, and meetings.
2. If no entity is specified, check the prompt for context clues. If the agent can infer an entity match, use it. Otherwise, save to `_system/links.md` only.
3. When an entity is resolved, append to both:
   - The entity file's `## Links` section: `- [{title}]({url}) — {description} [{YYYY-MM-DD}]`
   - The central index `_system/links.md`: `- [{YYYY-MM-DD}] [{title}]({url}) — {description} — {entity: [[{entity-name}]]}`
4. When no entity, append to `_system/links.md` only with entity marked as `general`.

### 6. Project Content Updates

**Status change:** "update status of [project] to [status]"

1. Resolve project via fuzzy name resolution.
2. Valid statuses: `active`, `paused`, `complete`.
3. Append a timeline entry under `## Timeline` in the project file:
   ```
   - [{YYYY-MM-DD} | capture] Status changed to {status} [User]
   ```
4. Update the `**Status:**` line in `## Overview` (this is an allowed structured metadata update).

**Scratchpad/notes:** "note on [project]: [thought]"

1. Resolve project.
2. Append to the project file under `## Notes`:
   ```
   - [{YYYY-MM-DD} | capture] {thought}
   ```

### 7. Person Notes

"note about [person]: [content]"

1. Resolve person via fuzzy name resolution.
2. Append to `People/{person}.md` under `## Personal Notes`:
   ```
   - [{YYYY-MM-DD}] {note}
   ```

## Output

After all writes, report:
- Each entry written: destination file (with Obsidian URI and disk path), what was written
- Any entries routed to review queues and why
- Any entities that couldn't be resolved (and what the user should do)

Example output: "Captured 3 items: recognition for Sarah (People/sarah-chen.md), timeline update (Projects/auth-migration.md), contribution logged (Journal/contributions-2026-03-31.md). 0 items in review queue."

## Worked Examples

### Quick Capture — Multi-Destination

User: "capture: Sarah handled the auth incident really well, auth migration is unblocked, and I need to review the API spec by Friday"

Skill reads projects.yaml (finds "Auth Migration"), people.yaml (finds "Sarah Chen"). Decomposes into:

1. **Recognition for Sarah** → reads `People/sarah-chen.md` `## Recognition` (no duplicate) → appends: `- [2026-04-06 | capture] Handled the auth incident really well — incident response [User]`
2. **Timeline update** → appends to `Projects/auth-migration.md` `## Timeline`: `- [2026-04-06 | capture] Auth migration unblocked [User]`
3. **Task** → appends to `Projects/auth-migration.md` `## Open Tasks`: `- [ ] Review API spec 📅 2026-04-11 [project:: Auth Migration] [type:: task] [User]`
4. **Contribution** → appends to `Journal/contributions-2026-03-31.md`: `- [2026-04-06 | capture] **unblocking-others:** Helped unblock auth migration [Inferred]`

Output: "Captured 4 items: recognition for Sarah (People/sarah-chen.md), timeline update (Projects/auth-migration.md), task 'Review API spec' (Projects/auth-migration.md), contribution logged (Journal/contributions-2026-03-31.md)."

### Task with Inferred Fields

User: "add task: get the caching approach reviewed"

No project, no due date, no owner stated. Skill infers project from conversation context (if available) or asks. If it infers:
```
- [ ] Get the caching approach reviewed 🔼 [project:: Platform API (inferred)] [type:: task] [review-status:: pending] [User]
```
Output: "Task created in Projects/platform-api.md. Inferred fields: project (Platform API). Review when convenient."

### Recurring Task

User: "create recurring task: send weekly status update every Monday for platform API"

```
- [ ] Send weekly status update 📅 2026-04-07 🔁 every week [project:: Platform API] [type:: task] [User]
```
Written to `Projects/platform-api.md` under `## Open Tasks`.

## Rules

- **Fuzzy name resolution:** exact match → alias → case-insensitive → prefix → fuzzy. Single match → proceed. Multiple → ask. No match → ask and suggest closest.
- **Append-only:** never modify or delete existing vault content. Only append new entries.
- **Dedup for observations and recognition:** before writing, read the target section. Skip if a near-duplicate exists (same subject from any source). Inform the user: "Skipped: similar observation already logged on {date}."
- **Tasks without a project** go in today's daily note, not in a project file.
- **Contributions from capture** use source value `capture` in the entry header.
- **Relative dates** ("by Friday", "next week") are resolved to absolute dates using workspace.yaml timezone. Store the resolved date.
- **Person can't be resolved:** ask the user. Never create a new person file from capture — that's a main-agent operation.
- **Person file doesn't exist yet:** if the person is resolved from people.yaml but their vault file (`People/{person}.md`) doesn't exist, create it from the person template (`_system/templates/person.md`) before writing. If no template exists, create a minimal file with frontmatter containing the person's name, role, and relationship tier from people.yaml.
- **Project can't be resolved:** ask the user. Never create a new project file from capture.
- **Wiki-links:** use `[[person-name]]` when mentioning people in timeline entries or task content.

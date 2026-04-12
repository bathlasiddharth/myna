---
name: myna-capture
description: Route user input to vault destinations — quick capture, observations, recognition, tasks (single or recurring), links (save or find), project/person file management. One input can produce multiple entries.
user-invocable: true
argument-hint: "capture: [anything] | observation about [person]: [text] | add task: [description] | create recurring task: [description] | save link: [url] for [entity] | update status of [project]"
---

# myna-capture

Routes user-entered data to the right vault destinations. One capture can produce multiple entries — one per destination. Nothing is silently dropped.

## 📋 Before You Start

Read at session start:
- `_system/config/workspace.yaml` — user identity, feature toggles, vault subfolder
- `_system/config/projects.yaml` — project names, aliases
- `_system/config/people.yaml` — person names, aliases, relationship tiers
- `_system/config/tags.yaml` — tagging rules

Check `self_tracking` toggle before writing to contributions log.

---

## 🔀 Routing Logic

When the user says "capture: [text]", decompose the input into its components and route each one:

| Content type | Destination |
|-------------|-------------|
| Recognition or praise about a person | `People/{person-slug}.md` → Recognition section |
| Observation about a person (strength, growth area) | `People/{person-slug}.md` → Observations section |
| Project update, decision, blocker, risk | `Projects/{project-slug}.md` → Timeline section |
| Task or action item | `Projects/{project-slug}.md` or daily note (if no project) |
| Your own contribution | `Journal/contributions-{YYYY-MM-DD}.md` (Monday date) |
| Personal note unrelated to projects/people | Daily note or user specifies |
| Ambiguous destination | Review queue (`ReviewQueue/review-work.md` or `review-people.md`) |

**Every relevant destination gets its own entry.** If the same capture maps to three destinations, write three entries. Report each one.

**Provenance markers on captures:**
- User typed it directly → `[User]`
- Item is explicitly stated → `[Auto]` (e.g., "Sarah did a great job" → recognition is explicit)
- Item requires interpretation → `[Inferred]` (e.g., if Sarah resolved a blocker, you might have contributed — that's inferred)
- Genuinely ambiguous (can't determine destination) → review queue

---

## 📝 Quick Capture

**Trigger:** "capture: [text]" — catch-all for anything

**How:**
1. Read the capture text. Identify all components: recognitions, observations, project updates, tasks, contributions.
2. For each component:
   a. Resolve the entity (person or project) via fuzzy name resolution against people.yaml and projects.yaml.
   b. Assign a provenance marker.
   c. Write to the destination file — append-only.
   d. Inferred contributions: check `self_tracking` toggle first. If disabled, skip.
3. If entity resolution fails (no match), ask before writing.
4. Report all destinations written.

**Entry formats by destination:**

**Project timeline:**
```
- [2026-04-05 | capture] {content} [Auto] (capture, 2026-04-05)
```

**Person Recognition:**
```
- [2026-04-05 | capture] {what they did} — {context} [Auto] (capture, 2026-04-05)
```

**Person Observation:**
```
- [2026-04-05 | capture] **{strength|growth-area|contribution}:** {observation} [Auto] (capture, 2026-04-05)
```

**Contributions log** (`Journal/contributions-{YYYY-MM-DD}.md` — Monday date):
```
- [2026-04-05 | capture] **{category}:** {description} [Inferred] (capture, 2026-04-05)
```

**Worked example:**

User: "capture: Sarah did a great job handling the auth incident, and the auth migration is now unblocked"

Decompose:
- Recognition for Sarah (explicit) → `People/sarah-chen.md` Recognition section → `[Auto]`
- Auth migration unblocked (explicit project update) → `Projects/auth-migration.md` Timeline → `[Auto]`
- Your contribution (handled the incident — inferred; user didn't explicitly say they were involved) → check `self_tracking` toggle → if enabled, `Journal/contributions-{YYYY-MM-DD}.md` (Monday date) → `[Inferred]`

Writes:
1. `People/sarah-chen.md` — Recognition: `- [2026-04-05 | capture] Great handling of auth incident — resolved within SLA [Auto] (capture, 2026-04-05)`
2. `Projects/auth-migration.md` — Timeline: `- [2026-04-05 | capture] Blocker resolved — migration unblocked [Auto] (capture, 2026-04-05)`
3. `Journal/contributions-2026-03-30.md` — `- [2026-04-05 | capture] **unblocking-others:** Contributed to resolving auth migration blocker [Inferred] (capture, 2026-04-05)`

Output: "Wrote 3 entries: recognition for Sarah, timeline update for auth migration, contribution logged [Inferred]."

---

## 👀 Observations

**Trigger:** "observation about Sarah: [text]", "feedback note for Alex: [text]"

**How:**
1. Resolve person via fuzzy name resolution.
2. Determine observation type: strength, growth-area, or contribution.
   - Explicit praise → strength
   - Explicit concern or development feedback → growth-area
   - Contribution noted → contribution
   - Unclear → ask the user which type applies
3. Check if this should also go to Pending Feedback (if it's a coaching point worth delivering).
4. Append to `People/{person-slug}.md` → Observations section.
5. If it's a growth area with coaching potential, also append to Pending Feedback section.

**Observation entry:**
```
- [{date} | capture] **{type}:** {observation} [User] (capture, {date})
```

**Pending Feedback entry** (when observation has coaching value):
```
- [{date} | capture] {observation} — Coaching note: {framing} [User] (capture, {date})
```

**Worked example:**

User: "observation about Alex: he consistently delivers accurate effort estimates — his sprint commitments almost always match actual completion."

1. Resolve: Alex → `People/alex-kumar.md`, tier: peer.
2. Type: strength (explicit praise).
3. Append to Observations: `- [2026-04-05 | capture] **strength:** Consistently accurate effort estimates — sprint commitments match actuals [User] (capture, 2026-04-05)`
4. No pending feedback needed (positive observation, nothing to coach).

---

## 🏆 Recognition Tracking

**Trigger:** "recognition for Sarah: [text]", "log that Sarah [accomplishment]"

Different from the observation capture above: this is a recognition entry specifically (for compiling into recognition drafts later via myna-draft).

**How:**
1. Resolve person.
2. Append to `People/{person-slug}.md` → Recognition section.
3. Entry format: `- [{date} | capture] {what they did} — {context} [User] (capture, {date})`

---

## ✅ Task Management

### Add Task

**Trigger:** "add task: [description]", "create task: [description]", "TODO: [description]"

**How:**
1. Parse the task from natural language. Extract:
   - Title (short, scannable)
   - Project (from context or explicit mention — fuzzy match against projects.yaml)
   - Due date (resolve relative dates to absolute: "by Friday" → `2026-04-11`)
   - Priority (explicit or inferred from language — "urgent", "ASAP" → high)
   - Effort estimate (if mentioned)
   - Type: task (default), delegation (if "ask Alex to..."), dependency (if "waiting on..."), reply-needed (if "need a reply from...")
   - Person (for delegations)
2. Mark each field as `explicit` or `(inferred)`.
3. **Write directly if all fields are explicit.** If any field is inferred, add `[review-status:: pending]` and write to review queue.

**Task format:**
```
- [ ] {title} 📅 {YYYY-MM-DD} ⏫ [project:: {name}] [type:: {task|delegation|dependency|reply-needed}] [person:: {name}] [effort:: {estimate}] [review-status:: pending] [Auto] (capture, {date})
```

Include only fields that have values.

**Destination:** Project file at `Projects/{project-slug}.md` under Open Tasks section, or daily note if no project.

**Worked example:**

User: "add task: review Sarah's design doc by Friday, high priority"

Parse:
- Title: Review Sarah's design doc
- Due: Friday → `2026-04-11` (explicit)
- Priority: high (explicit)
- Project: not mentioned → inferred from context or ask
- Person: not a delegation (the user is doing this)

If project can't be inferred:
Ask: "Which project is this for? Or should I add it to your personal tasks?"

If user says "auth migration":
```
- [ ] Review Sarah's design doc 📅 2026-04-11 ⏫ [project:: Auth Migration] [type:: task] [Auto] (capture, 2026-04-05)
```

All fields explicit → write directly, no review queue.

---

### Add Recurring Task

**Trigger:** "create recurring task: [description]", "set up weekly task: [description]"

**How:**
1. Parse title and recurrence interval from the request.
2. Recurrence field uses Tasks plugin syntax: `🔁 every {interval}`
   - "weekly" → `🔁 every week`
   - "daily" → `🔁 every day`
   - "biweekly" → `🔁 every 2 weeks`
   - "monthly" → `🔁 every month`
   - "quarterly" → `🔁 every 3 months`
3. Write to appropriate project file or daily note.

**Recurring task format:**
```
- [ ] {title} 🔁 every {interval} [project:: {name}] [type:: task] [User] (capture, {date})
```

**Worked example:**

User: "Create recurring task: weekly team status update, every Monday"

```
- [ ] Weekly team status update 🔁 every week [type:: task] [User] (capture, 2026-04-05)
```

---

## 🔗 Link Manager

**Trigger:** "save link: [url] for [entity]", "save this link: [url]", "save link: [context] [url]"

**How:**
1. Extract the URL and any context the user provided.
2. Resolve the entity (project, person, meeting) from the context using fuzzy name resolution.
   - If entity is explicit ("for auth migration") → match to project.
   - If context clues exist ("save this dashboard — we use it for incident reviews") → infer entity.
   - If no context and no match → save to `_system/links.md` only (general reference).
3. Write to two places:
   a. Entity's `## Links` section (if entity resolved)
   b. `_system/links.md` → central index

**Entity Links section entry:**
```
- [{YYYY-MM-DD}] [{title}]({url}) — {description}
```

**Central index entry** (`_system/links.md`):
```
- [{YYYY-MM-DD}] [{title}]({url}) — {description} — {entity: [[project-slug]] or [[person-slug]] or general}
```

**Worked example:**

User: "save link: https://runbook.internal/auth-migration for auth migration"

1. Resolve: auth migration → `Projects/auth-migration.md`
2. Infer title from URL (or ask user if unclear): "Auth Migration Runbook"
3. Write to `Projects/auth-migration.md` Links section:
   `- [2026-04-05] [Auth Migration Runbook](https://runbook.internal/auth-migration) — runbook`
4. Write to `_system/links.md`:
   `- [2026-04-05] [Auth Migration Runbook](https://runbook.internal/auth-migration) — runbook — [[auth-migration]]`

Output: "Saved link to auth-migration.md and central index."

### Find Link

**Trigger:** "find link: [query]", "do I have a link for [entity/topic]?"

**How:**
1. Search `_system/links.md` for entries matching the query (title, description, or entity).
2. Also search the `## Links` section of the resolved entity file (if entity is named).
3. Return matching entries inline. If no matches: "No saved links found for '[query]'."

---

## 📁 Project / Person File Management

### Update Project Status

**Trigger:** "update status of auth migration to paused", "mark platform api as complete"

**How:**
1. Resolve project via fuzzy match.
2. Edit frontmatter: `status: {active|paused|complete}`
3. Append timeline entry: `- [{date} | capture] Status changed to {status} [User] (capture, {date})`

### Create Project File

**Trigger:** "create project file for [project]", "add project [name]"

**How:**
1. Confirm project name and basic info (description, key people). Ask if not provided.
2. Create `Projects/{slug}.md` from template. If template exists at `_system/templates/project.md`, use it. Otherwise create minimal structure:

Minimal project file structure (sections in order):
- Tags line: `#project #{project-tag} #status/active`
- `## Overview` — Description, Status (active), Key People as wiki-links
- `## Timeline` — with note: Append-only chronological log
- `## Open Tasks` — Dataview query: TASK FROM project folder WHERE !completed SORT priority DESC, due ASC
- `## Links`
- `## Notes`

3. Show file path.

### Create Person File

**Trigger:** "create person file for [name]", "add [name] to people"

**How:**
1. Look up in people.yaml — if found, use those fields. If not, ask for relationship tier (required).
2. Create `People/{slug}.md`:

```markdown
#person #tier/{relationship-tier}

## Overview

**Name:** {full name}
**Role:** {role or unknown}
**Team:** {team or unknown}
**Relationship:** {tier}

## Communication Preferences

## Observations

## Pending Feedback

## Recognition

## Personal Notes

## Meeting History

- [[1-1s/{slug}]] — 1:1 meetings
```

3. Show file path.

---

## ⚠️ Edge Cases

**Entity not found:** "I don't recognize '[name]' — is this a new project/person? (yes to create, no to just write a note)"

**Multiple matches:** "I found both 'Auth Migration' and 'Auth Service' — which one?"

**self_tracking disabled:** Skip all contribution log writes silently. Don't mention it.

**Deduplication:** Before writing, check the target section for near-duplicate entries (same action + same entity from the same source). Skip duplicates: "This looks like it may already be logged in auth-migration.md — skipping to avoid duplicate."

**Missing target file:** If a project or person file doesn't exist, create it (minimal structure) before writing the entry. Mention: "Created new file for {entity}."

**No identifiable entity:** If capture text has no recognizable person, project, or task ("the meeting went well"), ask: "Where should I log this? (project name, person name, or personal notes)"

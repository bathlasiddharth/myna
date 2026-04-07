# Process Meeting

## Purpose

Read a meeting file after the meeting and route extracted data to the vault — close resolved items, create tasks, update project timelines, log observations, and carry forward unfinished topics.

## Triggers

- "Process this meeting" or "process [meeting name]" — single meeting
- "Process my meetings" — batch: all meeting files with unprocessed notes from today
- "Done with 1:1 with Sarah" — Universal Done routes here when the target resolves to a meeting

## Inputs

- **Meeting file** (`Meetings/{type}/{name}.md`): full file — Prep section (checked/unchecked items) and Notes section (discussion, action items, decisions)
- **projects.yaml**: project names, aliases, key people — for routing entries to the right project file
- **people.yaml**: display names, aliases, relationship tiers — for resolving person mentions
- **workspace.yaml**: `user.name`, `user.email` (to distinguish your action items from delegations to others)
- **meetings.yaml**: type overrides, project associations, `debrief_type`
- **Project files**: for near-duplicate check before writing timeline entries or tasks
- **Person files**: for near-duplicate check before writing observations or recognition

## Procedure

### 1. Locate the Meeting File

- **Single:** resolve the meeting name against files in `Meetings/` using meetings.yaml aliases and fuzzy matching. Read the full file.
- **Batch:** scan `Meetings/1-1s/`, `Meetings/Recurring/`, `Meetings/Adhoc/` for files with a `## {today's date} Session` header that has a Notes section with content but no `[Processed]` marker. Process each sequentially.
- If the Notes section is empty (user didn't write anything), inform the user and skip. Checked/unchecked prep items are still processed if present.

### 2. Determine Meeting Type

Read the file's frontmatter `type` field. If absent, check meetings.yaml for an override. If neither, infer from file path (`1-1s/` = 1:1, `Recurring/` = recurring, `Adhoc/` = adhoc). If `debrief_type` is set in meetings.yaml, use it to customize extraction emphasis.

Meeting type controls extraction emphasis:
- **1:1:** heavier on observations, feedback, career topics, personal notes
- **Standup/sync:** lighter touch — mostly status updates and blockers
- **Design review / decision meeting:** focus on decisions, alternatives rejected, risks, action items
- **Operational review:** metrics discussed, trends, action items with owners
- **Project meeting:** tasks, timeline updates, blockers, dependencies

### 3. Process Prep Section

Read the Prep section checkboxes:

- **Checked items** (`- [x]`): mark as resolved/discussed. If a checked item corresponds to a task in a project file (e.g., "Review API spec by Friday"), mark that task as complete.
- **Unchecked items** (`- [ ]`): carry forward. These become prep items for the next session with this meeting. Do not write them now — prep-meeting reads unchecked items from the previous session when generating the next prep.

### 4. Extract from Notes Section

Read the Notes section (Discussion, Action Items, Decisions subsections and any free-form content) and extract:

**Action items for the user:**
- Create a task in the relevant project file under `## Open Tasks`.
- Format as Obsidian Tasks plugin TODO: `- [ ] {description} [due:: {date}] [project:: {name}]`
- Resolve relative dates ("by Friday") to actual dates.

**Action items for others (delegations):**
- Same format with additional fields: `[type:: delegation] [person:: {name}]`
- Link to the person: `[[{person-name}]]`

**Decisions:**
- Append to the relevant project file under `## Timeline` using the Decision callout format:
  ```
  > [!info] Decision
  > [{date} | meeting {meeting-name}] {decision description} [{provenance}]
  ```

**Observations about people** (1:1s and team meetings especially):
- Append to the person's file under `## Observations`.
- Format: `- [{date} | meeting {meeting-name}] **{type}:** {observation} [{provenance}] (meeting, {meeting-name}, {date})`
- Types: strength, growth-area, contribution.

**Blockers:**
- Append to project timeline using the Blocker callout format:
  ```
  > [!warning] Blocker
  > [{date} | meeting {meeting-name}] {blocker description} [{provenance}]
  ```

**Recognition:**
- Append to person file under `## Recognition`.
- Format: `- [{date} | meeting {meeting-name}] {what they did} — {context} [{provenance}] (meeting, {meeting-name}, {date})`

**Your contributions:**
- Append to `Journal/contributions-{week}.md` (Monday date of the current week). If the file doesn't exist, create it with the contributions log template (frontmatter with `week_start`, `#contributions` tag).
- Format: `- [{date} | meeting {meeting-name}] **{category}:** {description} [{provenance}] (meeting, {meeting-name}, {date})`

**Status updates and timeline entries:**
- Append to project file `## Timeline`: `- [{date} | meeting {meeting-name}] {content} [{provenance}] (meeting, {meeting-name}, {date})`

### 5. Resolve Destinations

For each extracted item:
1. Determine the target project by matching against projects.yaml (names, aliases) and the meeting's `project` field from meetings.yaml.
2. Resolve person names against people.yaml (display names, aliases, full names). If a name can't be resolved, route the item to review-people queue.
3. If the destination project is ambiguous (item discusses multiple projects), route to review-work queue.

### 6. Near-Duplicate Check

Before writing each entry, read the target location (project timeline, person observations, etc.) and check for near-duplicates — same action + same entity from the same source. If a matching entry already exists (e.g., from a meeting summary email processed earlier), skip it and note in the output.

### 7. Mark as Processed

After processing, append a marker below the Notes section: `*[Processed {YYYY-MM-DD}]*`. This prevents reprocessing in batch mode.

### 8. Store Source Text

Append the meeting's raw Notes content to `_system/sources/{entity-name}.md` (one per project or person referenced). Format:

```
## {YYYY-MM-DD} — meeting: {meeting-name}

> {verbatim notes content}

Referenced by: [[{vault-file}]] — {which entries}
```

### 9. Output

Show the user a summary of what was extracted and where it went:
- Tasks created (count, with project assignments)
- Delegations created (count, with assignees)
- Decisions logged (count, with projects)
- Observations and recognition (count, with people)
- Contributions logged (count)
- Items sent to review queue (count, with reasons)
- Items skipped as duplicates (count)
- Carry-forward count (unchecked prep items)

For batch mode, show per-meeting summaries and a total.

## Rules

- **Check `features.process_meeting`** before acting. If disabled, inform the user and stop.
- **Multi-destination routing.** A single meeting produces entries across multiple files — project timelines, person files, task lists, contributions log. Each item goes to its correct destination independently.
- **Append-only.** Never modify existing content in project files, person files, or contributions logs. Only append new entries. The one exception: marking a task as complete (metadata update on an existing TODO).
- **Near-duplicate detection.** Always check the target file before writing. If the same information was already captured (e.g., from a meeting summary email), skip the duplicate.
- **Review queue routing.** Items with genuinely ambiguous destinations or unresolvable person names go to review queues. Don't guess when two reasonable interpretations exist. Route to `ReviewQueue/review-work.md` for task/project ambiguity, `ReviewQueue/review-people.md` for person-related ambiguity, `ReviewQueue/review-self.md` for uncertain contributions.
- **Don't process empty notes.** If the Notes section has no content and no prep checkboxes were changed, inform the user and skip.

## Worked Example

User says: "done with 1:1 with Sarah"

1. **Locate:** Main agent routes "done with 1:1 with Sarah" to process-meeting. Resolves to `Meetings/1-1s/sarah-chen.md`. Reads the file.
2. **Type:** Frontmatter `type: 1-1` — emphasis on observations, feedback, personal.
3. **Prep section:**
   - `[x] Follow-through: Send Sarah the updated API spec` → marks task complete in `Projects/auth-migration.md`
   - `[x] Discuss caching strategy` → resolved, no vault action needed
   - `[ ] Career development: growth area "technical writing"` → carries forward to next session
4. **Notes extraction:**
   - "Sarah to draft the API spec by Friday" → task `[Auto]` in `Projects/auth-migration.md`: `- [ ] Draft API spec [due:: 2026-04-10] [type:: delegation] [person:: Sarah] [[sarah-chen]]`
   - "Go with Option B for caching — lower latency, acceptable memory trade-off" → decision `[Auto]` in `Projects/auth-migration.md` timeline:
     ```
     > [!info] Decision
     > [2026-04-06 | meeting 1:1 with Sarah] Go with Option B for caching — lower latency, acceptable memory trade-off [Auto]
     ```
   - "Sarah handled the March 30 incident really well, took ownership immediately" → observation in `People/sarah-chen.md`: `- [2026-04-06 | meeting 1:1 with Sarah] **strength:** Took ownership of March 30 incident immediately [Auto] (meeting, 1:1 with Sarah, 2026-04-06)`
   - "We should probably look into the flaky tests" → review-work queue (no clear owner or project)
5. **Contributions:** "Resolved caching strategy decision" → `Journal/contributions-2026-04-06.md`: `- [2026-04-06 | meeting 1:1 with Sarah] **decisions-and-influence:** Resolved caching strategy for auth migration [Inferred] (meeting, 1:1 with Sarah, 2026-04-06)`
6. **Mark processed:** Appends `*[Processed 2026-04-06]*` to the meeting file.
7. **Output:** "Processed 1:1 with Sarah. 1 task completed, 1 delegation created, 1 decision logged, 1 observation, 1 contribution [Inferred]. 1 item in review queue (ambiguous owner). 1 carry-forward to next session."

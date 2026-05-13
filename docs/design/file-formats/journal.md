# Journal — Daily, Weekly, Monthly, Contributions

Time-bounded files. Load alongside `_conventions.md`.

---

## Daily Note

**Path:** `Journal/{YYYY-MM-DD}.md` (current daily note lives at `Journal/` root; previous notes archive to `Journal/Archive/Daily/`)

**Frontmatter:**
```yaml
---
date: {YYYY-MM-DD}
---
```

**Tag line:** `#daily`

**Canonical body sections** (what skills create; users may reorder, rename, or remove):

### `## Morning Focus`
User-editable narrative. Sync NEVER overwrites this section. Empty by default; user fills in their day's intent.

### `## Sync — {HH:MM}`
Written by `/myna:sync`. On re-run within the same day, sync prepends a new snapshot above the previous one — older snapshots are not touched.

Canonical sub-sections (skills create in this order; users may reorder/rename/remove):

#### `### Briefing`
Curated AI-generated bullets — 3–7 items covering what matters most. Examples:
- Overdue tasks needing attention today (count + top items by priority)
- Overdue delegations (red-flag items)
- Unresolved blockers
- Prep warnings ("Design review at 2 PM — no prep file yet")
- Capacity flag if task effort exceeds focus time
- Milestones within 7 days (if `features.milestones` enabled)
- Review queue counts if non-zero

#### `### Today's Meetings`
One bullet per calendar event, linking to the prep file with prep status:
```
- [ ] {HH:MM} [[{meeting-file}]] — {meeting title} {prep-status}
```
prep-status is one of `(prep ready)`, `(no prep yet)`, `(basic prep from sync)`.

#### `### Tasks Due Today`
One-sentence AI-generated summary of what's most pressing, then per-project sub-headers with task lists:

```
{Summary sentence — e.g., "Alpha launch has the most due today (4 tasks); the blocker on payments is highest-priority."}

#### {Project Name}
- [ ] {task title} 📅 {date} {priority if set}

#### General
{Tasks with no project association. Omit sub-header if none.}
```

If nothing is due: `(nothing due today)`.

#### `### Dashboards`
Single wiki-link to the unified dashboard:
```
[[dashboard]]
```

### `## End of Day — {HH:MM}`
Written by `/myna:wrap-up`. Appended at the bottom of the daily note.

Canonical sub-sections (skills create in this order; users may reorder/rename/remove):

#### `### Planned vs Actual`
```
- Completed: {list}
- Not started: {list}
- Partially done: {list}
```

"Planned" comes from source-file queries (open tasks with `📅 {today}` across project files), per the Read Principle — NOT from the morning Briefing.

#### `### Contributions Detected`
```
- {contribution} [{provenance}]
{If any went to review-self queue: "1 uncertain contribution added to review-self queue."}
```
Omit section entirely if `features.contribution_detection` is disabled.

#### `### Carried to Tomorrow`
```
- {item} (carried from {today}) [Auto]
{If nothing to carry: "(nothing to carry — clean day)"}
```

#### `### Quick Notes`
**Only emitted when the user passed a free-form note to `/myna:wrap-up`.** Captures the user's reflection on the day. Skip the section entirely if no note provided.

```
{User's note text, verbatim.}
```

### `## Re-run Snapshot Format`
On a re-run sync within the same day, prepend a new compact snapshot at the top of the file (after the `#daily` tag, before existing snapshots):

```
## Sync — {HH:MM}

### Briefing
{Updated bullets. Include delta if notable: "Since last sync: {N} tasks completed, {M} meetings added."}

### Today's Meetings
- [ ] {HH:MM} [[{meeting-file}]] — {meeting title} {prep-status}
```

Re-run snapshots omit `### Tasks Due Today` and `### Dashboards` (those live in the permanent first snapshot).

---

## Weekly Note

**Path:** `Journal/{YYYY-W\d\d}.md` (e.g., `2026-W18.md`; archived to `Journal/Archive/Weekly/`)

**Frontmatter:**
```yaml
---
week_start: {YYYY-MM-DD}
---
```

**Tag line:** `#weekly`

**Canonical body sections** (what skills create; users may reorder, rename, or remove):

### `## Week Capacity`
Table — meetings, focus time, task effort per day.

```
| Day | Meetings | Focus Time | Task Effort |
|-----|----------|------------|-------------|
| Mon | {hrs} hrs | {hrs} hrs | {hrs} hrs |
| ... | ... | ... | ... |
```

Below the table: packed-day flags and carry-forward items from last week's wrap-up, or `(none)` if clean.

### `## Weekly Goals`
User-editable. Set at start of week.

### `## Carry-Forwards`
Items carried from previous week (auto-populated on first sync of the week).

### `## Weekly Summary — {YYYY-MM-DD}`
Heading **includes the date** (start-of-week Monday). Written by `/myna:weekly-summary`.

Canonical sub-sections (skills create in this order; users may reorder/rename/remove):

#### `### Accomplishments`
#### `### Decisions Made`
#### `### Blockers`
#### `### Tasks: Completed vs Carried`
#### `### Self-Reflection`
Agent-generated prompts based on the week's patterns.

---

## Monthly Note

**Path:** `Journal/{YYYY-MM}.md` (e.g., `2026-05.md`; archived to `Journal/Archive/Monthly/`)

Frontmatter and structure parallel the weekly note: a `## Month Capacity` block, `## Monthly Goals`, `## Carry-Forwards`, and a `## Monthly Summary — {YYYY-MM-DD}` section. Detailed shape mirrors weekly note semantics.

---

## Contributions Log (Weekly)

**Path:** `Journal/contributions-{YYYY-MM-DD}.md` (Monday date; lives in `Journal/` root; not managed by the rolling archive — accumulates normally, one file per week)

**Frontmatter:**
```yaml
---
week_start: {YYYY-MM-DD}
---
```

**Tag line:** `#contributions`

**Body:**

```
## Contributions — Week of {YYYY-MM-DD}

> Newest-first. Each entry has date, description, category, source, and provenance.

- **{category}:** {description} [{provenance}] ({source-type}, {identity}, {YYYY-MM-DD})
```

**Categories (IC role):** `decisions-and-influence`, `unblocking-others`, `issue-prevention`, `code-reviews`, `feedback-given`, `documentation`, `escalations-handled`, `delegation-management`, `best-practices`, `risk-mitigation`, `coaching-and-mentoring`

**Categories (Manager/PM role):** `people-development`, `operational-improvements`, `strategic-alignment`, `hiring-and-team-building`, `cross-team-leadership`, `stakeholder-management`

Category set is determined by `user.role` in `workspace.yaml`. Manager categories require conservative inference — when in doubt, route to review-self queue.

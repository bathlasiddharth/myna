# Conventions

## Provenance Markers

Every agent-written entry carries exactly one of four markers. This is the authoritative source for marker rules — skills do not include marker logic.

### The Four Markers

| Marker | Meaning | Trust Level |
|--------|---------|-------------|
| [User] | User typed it directly | Highest — user made the judgment |
| [Auto] | Agent extracted, all data explicit in source | High — fully reconstructable from source |
| [Inferred] | Agent extracted, some fields guessed | Medium — verify when noticed |
| [Verified] | Was Auto/Inferred, user confirmed via review queue | Highest — explicitly checked |

### Placement Format

Tag and compact source reference at end of line:

```
- Shipped auth migration on time [Auto] (email, Sarah, 2026-03-15)
- Strong escalation handling during incident [Inferred] (meeting, 1:1 with Sarah, 2026-03-20)
- Led the design review [User]
- API spec deadline confirmed as Friday [Verified] (was Inferred, confirmed 2026-04-03)
```

### Source Reference Format (compact)

- Email: `(email, {first name of sender}, {date})`
- Slack: `(slack, #{channel}, {date})` or `(slack, {person first name}, {date})`
- Meeting: `(meeting, {meeting name}, {date})`
- Capture: `(capture, {date})`
- User typed directly: no source reference needed — `[User]` is self-evident

### Decision Framework

| Signal | Marker | Action |
|--------|--------|--------|
| User typed it | [User] | Direct write. User already made the judgment. |
| All data explicit in source | [Auto] | Direct write. Names, dates, actions all stated. Fully reconstructable. |
| Core item real, some fields guessed | [Inferred] | Direct write, flagged. Action item exists but owner or date is the agent's guess. |
| Multiple valid interpretations | Review queue | Two reasonable people would read this differently. Don't guess — route to review queue. |

**Litmus test:** Would two reasonable people read this source differently? If yes, route to review queue instead of using [Inferred].

### Domain Examples

**Tasks:**
- "Sarah to send API spec by March 15" → [Auto] (owner, action, date all explicit)
- "We need to get the spec out soon" → [Inferred] (task exists, owner and date guessed)
- "Someone should look into this" → review queue (who?)

**Timeline entries:**
- "The migration is on track" from project lead → [Auto] status update
- "I think we might need to push the launch" → [Inferred] risk signal
- Same thread says "on track" AND mentions two blockers → review queue (conflicting signals)

**Observations / Recognition:**
- "Sarah did a fantastic job" from manager in email → [Auto]
- Positive emoji reaction to Sarah's work → [Inferred] (might be politeness)
- "Good work team" → review queue (who specifically?)

**Contributions:**
- You completed a task → [Auto]
- You were on a thread where a blocker got resolved → [Inferred] (were you the one who resolved it?)
- Manager-type contributions ("drove alignment") → [Inferred] or review queue depending on evidence

### Highlighting in Compiled Output

Features that compile data (brag docs, self-reviews, person briefings, promo packets) must highlight [Inferred] entries so the user knows which data points to verify before acting on the compiled output.

## Canonical Entry Formats

Every agent-written entry to vault files must follow these exact formats. Skills defer to this section — they do not define their own formats.

### Timeline Entries (project files `## Timeline`)

```
- [{YYYY-MM-DD} | {source}] {content} [{provenance}]
```

Callout variants for blockers and decisions:
```
> [!warning] Blocker
> [{YYYY-MM-DD} | {source}] {blocker description} [{provenance}]

> [!info] Decision
> [{YYYY-MM-DD} | {source}] {decision description} [{provenance}]
```

No source-detail at the end — the header already provides full traceability.

### Observations (person files `## Observations`)

```
- [{YYYY-MM-DD} | {source}] **{type}:** {observation} [{provenance}]
```

Types: `strength`, `growth-area`, `contribution`.

### Recognition (person files `## Recognition`)

Bullet format — for entries in person file `## Recognition` sections:
```
- [{YYYY-MM-DD} | {source}] {what they did} — {context} [{provenance}]
```

Callout format — only for project timelines when recognition is notable enough to surface in project context:
```
> [!tip] Recognition
> [{YYYY-MM-DD} | {source}] {what they did} [{provenance}]
```

Do not use the callout format in person files — use bullet format there.

### Contributions (contributions log `## Contributions — Week of {date}`)

```
- [{YYYY-MM-DD} | {source}] **{category}:** {description} [{provenance}]
```

No source-detail at the end — the header already provides full traceability.

---

## Append-Only Discipline

The agent never modifies or deletes existing content. It can only append new content and update specific structured metadata fields.

**What the agent CAN update:**
- Task completion status (marking a TODO as done)
- Task `review-status` field (`pending` → `reviewed`)
- Project status line in Overview section

**What the agent CANNOT do:**
- Edit, move, restructure, or delete existing content
- Collapse or merge previous sync snapshots
- Rewrite timeline entries or observations
- Remove items from any file (except review queue items on explicit user action)

**`overwrite_section` MCP tool restriction:** Never use `overwrite_section` on content sections (Timeline, Observations, Recognition, Notes, Personal Notes, Contributions). It is only permitted for review queue files (removing processed items). Using it on a content section would permanently destroy accumulated data with no undo.

**Agent additions in mixed-content sections** (where the user wrote content and the agent appends) are visually separated:

```
--- Agent addition ({YYYY-MM-DD}, source: {source}) ---
{new content}
```

For append-only sections (timelines, observations), no separator is needed — the `[{date} | {source}]` header and provenance marker already distinguish entries.

**Carry-forward creates a copy.** Unchecked meeting prep items become new entries in the next session with "(carried from {date})". Originals stay untouched.

## Date and Source Format

### Entry Header Format

Every vault entry uses a consistent header:

```
[{YYYY-MM-DD} | {source}]
```

**Source values:**
- `email` — from email processing. Add sender: `email from Sarah`
- `slack` — from Slack processing. Add channel or person: `slack #auth-team`
- `meeting` — from meeting processing. Add meeting name: `meeting 1:1 with Sarah`
- `capture` — from quick capture or user-typed input
- `user` — user typed directly into a file (not through the agent)

### Chronological Ordering

Timelines and chronological logs are sorted by **when the event happened**, not when it was processed. An email from March 15 processed on March 20 goes at the March 15 position.

## Obsidian Conventions

### Tags

Inline `#tags` at the top of files (not YAML frontmatter arrays). Auto-applied by the tagging system based on `tags.yaml` rules.

```
#project #auth-migration #from-email
```

### Wiki-Links

`[[file-name]]` for cross-references between vault files. Always verify the target file exists before creating a link. If the file does not exist, note the path without a wiki-link.

### Callout Blocks

Visual emphasis for blockers, decisions, and tips:

```
> [!warning] Blocker
> [{date} | {source}] {blocker description} [{provenance}]

> [!info] Decision
> [{date} | {source}] {decision} [{provenance}]

> [!tip] Recognition
> [{date} | {source}] {what they did} [{provenance}]
```

### Dataview Queries

Standard Dataview syntax in dashboard and daily/weekly notes:

```dataview
TASK FROM "myna/Projects" WHERE !completed AND type = "delegation" AND due < date(today) SORT due ASC
```

### Tasks Plugin Syntax

All TODOs use Obsidian Tasks plugin format:

```
- [ ] Review Sarah's design doc 📅 2026-04-10 ⏫ [project:: Auth Migration] [type:: task] [Auto] (email, Sarah, 2026-04-05)
```

**Task fields as inline properties:**
- `[project:: {name}]` — which project
- `[type:: {task | delegation | dependency | reply-needed | retry}]` — task type
- `[person:: {name}]` — owner (for delegations) or who you're waiting on
- `[review-status:: {pending | reviewed}]` — set to pending when fields are inferred
- Priority emoji: ⏫ high, 🔼 medium, (none) low
- Due date: 📅 YYYY-MM-DD
- Start date: 🛫 YYYY-MM-DD
- Recurrence: 🔁 every {interval}
- Effort: `[effort:: {estimate}]`

Omit optional fields when not applicable — only include fields that have values.

Inferred fields are marked inline: `[project:: Auth Migration (inferred)]` so the user knows what to verify.

The agent always creates formatted tasks from natural language. The user never types task syntax.

---
name: steering-conventions
disable-model-invocation: true
description: Data conventions — provenance markers, date+source format, append-only discipline, Obsidian formatting (tags, wiki-links, callouts, Dataview, Tasks plugin syntax), review queue entry format
user-invocable: false
---

# Data Conventions

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

## Provenance Markers

Every agent-written entry carries exactly one marker:

| Marker | Meaning | Write path |
|--------|---------|------------|
| `[User]` | User typed it directly | Direct write |
| `[Auto]` | All data explicit in source | Direct write |
| `[Inferred]` | Some fields are agent's guess | Direct write, flagged |
| `[Verified]` | Was Auto/Inferred, user confirmed | After review queue approval |

**Decision framework:**

| Signal | Tag |
|--------|-----|
| User typed it | `[User]` — always. User made the judgment. |
| All data explicit in source (names, dates, actions stated) | `[Auto]` — can reconstruct from source without guesswork. |
| Core item is real but some fields guessed | `[Inferred]` — write it, flag it. User verifies when they notice. |
| Multiple valid interpretations | Review queue — two reasonable people would read it differently. Don't guess. |

**Litmus test for `[Inferred]` vs review queue:** Is there one obvious-enough interpretation? `[Inferred]`. Would two reasonable people read it differently? Review queue.

**`[Inferred]` highlighting:** Features that compile data (brag docs, performance narratives, self-reviews, person briefings) must flag `[Inferred]` entries so the user knows which data points to double-check.

## Date + Source Format

Every vault entry includes a date and source header:

```
[{YYYY-MM-DD}]
```

**Source values:**
- `email from {first name}` — email processing
- `slack #{channel}` or `slack {first name}` — Slack processing
- `meeting {meeting name}` — meeting processing
- `capture` — quick capture or user-typed input
- `user` — user typed directly into a file

Entries are sorted by **when the event happened**, not when it was processed. An email from March 15 processed on March 20 goes at the March 15 position.

## Compact Source Reference (Provenance Lines)

Tag and compact source at end of line:

```
- {content} [{provenance}] ({source-type}, {identity})
```

Source identity rules (keep compact):
- Email: first name of sender only — not full name or email address
- Slack: channel name or person first name
- Meeting: meeting name
- Capture: no identity needed — `(capture)`
- `[User]`: no source needed — self-evident

Examples:

```
- [2026-03-15] Shipped auth migration on time [Auto] (email, Sarah)
- [2026-03-20] Strong escalation handling during incident [Inferred] (meeting, 1:1 with Sarah)
- [2026-04-03] Led the design review [User]
- [2026-04-03] API spec deadline confirmed as Friday [Verified] (was Inferred, confirmed 2026-04-03)
```

## Append-Only Discipline

The agent never modifies or deletes existing content. All existing content is treated as sacred.

**Allowed updates (structured metadata only):**
- Task completion status (marking a TODO as done)
- Task `review-status` field (`pending` → `reviewed`)
- Draft lifecycle state in frontmatter (`draft` → `sent`)

**Everything else is append-only.** Timeline entries, observations, recognition, contributions, notes, prep items, sync snapshots — once written, never edited, moved, restructured, or deleted.

**Mixed-content sections** (e.g., meeting Notes where user wrote rough notes and agent appends a summary): add a separator.

```
--- Agent addition ({YYYY-MM-DD}, source: {source}) ---
{new content}
```

For append-only sections (timelines, observations), the `[{date}]` header and provenance marker already distinguish agent entries — no separator needed.

**Carry-forward:** Unchecked items create a NEW entry in the destination with "(carried from {date})". Original left untouched.

**Re-runs (morning sync, meeting prep updates):** New snapshot prepended with timestamp header. Previous snapshots stay in place.

## Entry Formats

### Timeline Entry

```
- [{YYYY-MM-DD}] {content} [{provenance}] ({source-type}, {identity})
```

### Observation

```
- [{YYYY-MM-DD}] **{type}:** {content} [{provenance}] ({source-type}, {identity})
```

### Recognition

```
- [{YYYY-MM-DD}] {content} [{provenance}] ({source-type}, {identity})
```

### Contribution

```
- [{YYYY-MM-DD}] **{category}:** {content} [{provenance}] ({source-type}, {identity})
```

### Task (Obsidian Tasks Plugin)

```
- [ ] {description} 📅 {YYYY-MM-DD} ⏫ [project:: [[{name}]]] [type:: {type}] [{provenance}] ({source-type}, {identity}, {YYYY-MM-DD})
```

For tasks, `📅` is the **due date**, not the source date. Include the source date in the compact source reference so the origin of the task is traceable. Omit the source date only for `[User]` tasks (self-evident) and `(capture)` sources (captured now).

**Task fields as inline properties:**
- `[project:: [[{name}]]]` — which project (wiki-link to project file)
- `[type:: {task | delegation | dependency | reply-needed | retry}]` — task type
- `[person:: [[{name}]]]` — owner (for delegations) or who you're waiting on (wiki-link to person file)
- `[review-status:: {pending | reviewed}]` — set to pending when fields are inferred
- `[effort:: {estimate}]` — effort estimate
- Priority emoji: ⏫ high, 🔼 medium, (none) low
- Due date: 📅 YYYY-MM-DD
- Start date: 🛫 YYYY-MM-DD
- Recurrence: 🔁 every {interval}

Only include fields that have values — omit optional fields when not applicable. Inferred fields are marked: `[project:: [[Auth Migration]] (inferred)]`.

**Alias requirement:** Person and project files must include `aliases: ["{Display Name}"]` in their frontmatter so that wiki-links like `[[Sarah Chen]]` resolve correctly even though the file is named `sarah-chen.md`.

The agent always creates formatted tasks from natural language. The user never types task syntax.

### Review Queue Entry

```
- [ ] **{proposed action}**
  Source: {where the item came from — file, email subject, channel}
  Interpretation: {what the agent thinks this is}
  Ambiguity: {why it's in the queue — what's unclear}
  Proposed destination: {where it would be written if approved}
  ---
```

## Obsidian Conventions

### Tags

Inline `#tags` at the top of files (not YAML frontmatter arrays). Auto-applied based on tags.yaml rules.

```
#project #auth-migration #from-email
```

### Wiki-Links

`[[file-name]]` for cross-references. Verify the target file exists before creating a wiki-link. If the file doesn't exist, use the plain name instead.

```
Key People: [[People/sarah-chen]], [[People/alex-kumar]]
```

### Callout Blocks

```
> [!warning] Blocker
> [{date}] {content} [{provenance}]

> [!info] Decision
> [{date}] {content} [{provenance}]

> [!tip] Recognition
> [{date}] {content} [{provenance}]
```

### Dataview Queries

Standard Dataview syntax for dashboards and notes:

```dataview
TASK
FROM "myna/Projects"
WHERE !completed AND type = "delegation" AND due < date(today)
SORT due ASC
```


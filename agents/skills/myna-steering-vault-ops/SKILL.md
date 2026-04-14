---
name: myna-steering-vault-ops
description: Vault operations pattern library — file I/O tool mapping, task query patterns (grep-based), frontmatter parsing, backlink/tag queries, template creation, vault path conventions, file safety checks
user-invocable: false
---

# Vault Operations

All vault file I/O uses Claude Code built-in tools. No MCP server for vault operations.

## File I/O Tool Mapping

| Operation | Tool | Notes |
|-----------|------|-------|
| Read vault files | `Read` | Any file in the vault |
| Create or overwrite vault files | `Write` | Must target paths under `myna/` subfolder |
| Append to or modify vault files | `Edit` | Prefer append; only update structured metadata fields |
| Search file contents | `Grep` | Task queries, near-duplicate detection, backlink/tag lookups |
| Find files by name pattern | `Glob` | File name search, directory listing |
| Move files (journal archiving) | `Bash` with `mv` | Only within the vault |

All write operations must target paths under the configured `myna/` subfolder.

## Task Query Patterns

Query open and completed tasks across the vault using Grep:

| Query | Grep pattern |
|-------|-------------|
| Open tasks | `- \[ \]` |
| Completed tasks | `- \[x\]` |
| Filter by project | `\[project:: {name}\]` |
| Filter by type | `\[type:: {type}\]` — values: `task`, `delegation`, `dependency`, `reply-needed`, `retry` |
| Filter by person | `\[person:: {name}\]` |
| Due date (for overdue detection) | `📅 {YYYY-MM-DD}` — compare matched date against today |
| Pending review | `\[review-status:: pending\]` |
| High priority | `⏫` |
| Medium priority | `🔼` |
| Recurrence | `🔁 every` |
| Retry tasks | `\[type:: retry\]` |

**Combining filters:** Run Grep for the primary filter, then filter results in-context for secondary conditions. Example: find overdue high-priority tasks → Grep for `- \[ \]` in Projects/, then filter for lines containing `⏫` and a `📅` date before today.

## Frontmatter Operations

**Read frontmatter:** `Read` the file, parse YAML between opening `---` and closing `---` markers.

**Set a frontmatter property:** `Edit` the specific property line within the frontmatter block. Match the exact line (e.g., `status: draft`) and replace with the new value (e.g., `status: sent`).

## Backlink Queries

Find files linking to a given file:

```
Grep for: \[\[{filename}\]\]
Also check: \[\[{filename}\|
```

Search across the entire vault directory.

## Tag Queries

Find files with a specific tag:

```
Grep for: #{tagname}
```

Use word-boundary awareness to avoid matching tags inside other words (e.g., `#project` should not match `#project-planning` unless intended).

List all unique tags in the vault:

```
Grep for: #[a-zA-Z][\w-]*
```

Deduplicate results.

## Template Creation

1. `Read` template from `_system/templates/{type}.md`
2. Substitute `{{variable}}` placeholders with actual values — `{{name}}`, `{{date}}`, `{{project}}`, etc.
3. `Write` the new file with substituted content

If the template doesn't exist, create a minimal file with:
- `#tags` on the first line (no YAML frontmatter)
- Use `#type/value` tags for typed metadata (e.g., `#status/active`, `#tier/direct`)
- Empty sections matching the file type's standard structure

## Vault Path Patterns

| File type | Path pattern |
|-----------|-------------|
| Daily note | `{vault}/{subfolder}/Journal/DailyNote-{YYYY-MM-DD}.md` |
| Weekly note | `{vault}/{subfolder}/Journal/WeeklyNote-{YYYY-MM-DD}.md` (Monday date) |
| Contributions | `{vault}/{subfolder}/Journal/contributions-{YYYY-MM-DD}.md` (Monday date) |
| Archive | `{vault}/{subfolder}/Journal/Archive/` |
| Project | `{vault}/{subfolder}/Projects/{slug}.md` |
| Person | `{vault}/{subfolder}/People/{slug}.md` |
| Meeting (1:1) | `{vault}/{subfolder}/Meetings/1-1s/{person-slug}.md` |
| Meeting (recurring) | `{vault}/{subfolder}/Meetings/Recurring/{slug}.md` |
| Meeting (adhoc) | `{vault}/{subfolder}/Meetings/Adhoc/{slug}.md` |
| Draft | `{vault}/{subfolder}/Drafts/[{Type}] {topic}.md` |
| Review queue | `{vault}/{subfolder}/ReviewQueue/review-{queue}.md` |
| Processed audit | `{vault}/{subfolder}/ReviewQueue/processed/processed-{YYYY-MM-DD}.md` |
| Parked context | `{vault}/{subfolder}/_system/parked/{slug}.md` |
| Config | `{vault}/{subfolder}/_system/config/{name}.yaml` |
| Source | `{vault}/{subfolder}/_system/sources/{entity}.md` |
| Learnings | `{vault}/{subfolder}/_meta/learnings/{domain}.md` |
| Dashboard | `{vault}/{subfolder}/_system/dashboards/dashboard.md` |
| Link index | `{vault}/{subfolder}/_system/links.md` |
| Prompt log | `{vault}/{subfolder}/_system/logs/prompts.md` |
| Team | `{vault}/{subfolder}/Team/{slug}.md` |

**Naming conventions:**
- Slugs: lowercase, hyphens for spaces (`auth-migration`, `sarah-chen`)
- Daily notes: `DailyNote-{YYYY-MM-DD}`
- Weekly notes and contributions: use Monday's date
- Drafts: `[{Type}] {topic}` — types: Email, Meeting, Status, Escalation, Recognition, Self, Say-No, Conversation-Prep

## File Safety

**Before creating a new file:** Check for existing files with similar names using `Glob`. If a similar file exists, ask the user before creating a new one.

**Before creating a wiki-link:** Verify the target file exists using `Glob`. If it doesn't exist, use the plain name.

**Before writing an entry:** Read the target file and check for near-duplicates. Two items are near-duplicates when they share the same action + same entity from the same source thread. Skip duplicates and inform the user.

## Full-Text Search

**Content search:** `Grep` with pattern across the vault directory.

**File name search:** `Glob` with pattern.

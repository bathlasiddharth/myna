---
name: steering-vault-ops
disable-model-invocation: true
description: Vault operations pattern library — file I/O tool mapping, task query patterns (grep-based), frontmatter parsing, backlink/tag queries, template creation, vault path conventions, file safety checks
user-invocable: false
---

# Vault Operations

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

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
| Filter by project | `\[project:: \[\[{name}\]\]\]` |
| Filter by type | `\[type:: {type}\]` — values: `task`, `reply-needed` |
| Filter by person | `\[person:: \[\[{name}\]\]\]` |
| Due date (for overdue detection) | `📅 {YYYY-MM-DD}` — compare matched date against today |
| Pending review | `\[review-status:: pending\]` |
| High priority | `⏫` |
| Medium priority | `🔼` |
| Recurrence | `🔁 every` |

**Combining filters:** Run Grep for the primary filter, then filter results in-context for secondary conditions. Example: find overdue high-priority tasks → Grep for `- \[ \]` in Projects/, then filter for lines containing `⏫` and a `📅` date before today.

**Scope task queries to live folders only:** `Projects/`, `People/`, `Meetings/`, `Team/`, and current journal files in `Journal/` root. Exclude `_system/templates/`, `_system/sources/`, and `Journal/Archive/` from task queries unless the user explicitly requests archived data. Templates contain example task syntax that would pollute live-task results.

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

If the template doesn't exist, create a minimal file with the required YAML frontmatter for the file type, followed by the appropriate inline tags and empty sections. Key minimal structures:
- **Project:** `created: {date}` frontmatter + `#project` tag + `## Overview`, `## Timeline`, `## Open Tasks`, `## Links`, `## Notes` sections
- **Person:** `created: {date}` frontmatter + `#person #{relationship-tier}` tags + `## Overview`, `## Observations`, `## Pending Feedback`, `## Recognition`, `## Personal Notes`, `## Meeting History` sections
- **Draft:** `type`, `audience_tier`, `related_project`, `related_person`, `created` frontmatter + `#draft` tag + content placeholder
- **Other types:** include at minimum a `created: {date}` frontmatter field and the canonical tag for the file type

## Vault Path Patterns

| File type | Path pattern |
|-----------|-------------|
| Daily note | `{vault}/myna/Journal/{YYYY-MM-DD}.md` |
| Weekly note | `{vault}/myna/Journal/{YYYY-WNN}.md` (e.g. `2026-W18`) |
| Monthly note | `{vault}/myna/Journal/{YYYY-MM}.md` (e.g. `2026-05`) |
| Contributions | `{vault}/myna/Journal/contributions-{YYYY-MM-DD}.md` (Monday date) |
| Daily archive | `{vault}/myna/Journal/Archive/Daily/` |
| Weekly archive | `{vault}/myna/Journal/Archive/Weekly/` |
| Monthly archive | `{vault}/myna/Journal/Archive/Monthly/` |
| Project | `{vault}/myna/Projects/{slug}.md` |
| Person | `{vault}/myna/People/{slug}.md` |
| Meeting (1:1) | `{vault}/myna/Meetings/1-1s/{person-slug}.md` |
| Meeting (recurring) | `{vault}/myna/Meetings/Recurring/{slug}.md` |
| Meeting (adhoc) | `{vault}/myna/Meetings/Adhoc/{YYYY-MM-DD}-{slug}.md` |
| Draft | `{vault}/myna/Drafts/[{Type}] {topic}.md` |
| Review queue | `{vault}/myna/ReviewQueue/review-{queue}.md` |
| Processed audit | `{vault}/myna/ReviewQueue/processed-{YYYY-MM-DD}.md` |
| Parked context | `{vault}/myna/_system/parked/{slug}.md` |
| Config | `{vault}/myna/_system/config/{name}.yaml` |
| Source | `{vault}/myna/_system/sources/{entity}.md` |
| Dashboard | `{vault}/myna/Dashboards/dashboard.md` |
| Link index | `{vault}/myna/_system/links.md` |
| Team | `{vault}/myna/Team/{slug}.md` |

**Naming conventions:**
- Slugs: lowercase, hyphens for spaces (`auth-migration`, `sarah-chen`)
- Daily notes: `{YYYY-MM-DD}.md` (e.g. `2026-05-01.md`)
- Weekly notes: `{YYYY-WNN}.md` (e.g. `2026-W18.md`)
- Contributions: use Monday's date
- Drafts: `[{Type}] {topic}` — types: Email, Meeting, Status, Escalation, Recognition, Self, Say-No, Conversation-Prep

**Journal rolling archive:** When creating a new daily, weekly, or monthly note, move the previous note of the same type from `Journal/` root to the appropriate archive subfolder. Use Bash `mv`. **Never archive `contributions-{YYYY-MM-DD}.md` files** — they accumulate in `Journal/` root and are not subject to rolling archive. Only archive files matching the date-only patterns: daily (`{YYYY-MM-DD}.md`), weekly (`{YYYY-W\d\d}.md`), monthly (`{YYYY-MM}.md`).

## File Safety

**Before creating a new file:** Check for existing files with similar names using `Glob`. If a similar file exists, ask the user before creating a new one.

**Before creating a wiki-link:** Verify the target file exists using `Glob`. If it doesn't exist, use the plain name.

**Before writing an entry:** Read the target file and check for near-duplicates. Two items are near-duplicates when they share the same action + same entity from the same source thread. Skip duplicates and inform the user.

## Full-Text Search

**Content search:** `Grep` with pattern across the vault directory.

**File name search:** `Glob` with pattern.

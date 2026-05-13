# Entities — Project, Person, Team

Long-lived files representing the things Myna tracks: projects, people, teams. Load alongside `_conventions.md`.

---

## Project File

**Path:** `Projects/{project-name}.md` (lowercase, hyphenated slug)

**Frontmatter:**
```yaml
---
created: {YYYY-MM-DD}
aliases: ["{Project Display Name}"]
---
```

**Tag line (immediately after frontmatter):** `#project #{project-tag}`

**Canonical body sections** (what skills create; users may reorder, rename, or remove):

### `## Overview`
Static metadata. Edited rarely.
```
**Description:** {from projects.yaml or user-provided}
**Status:** active | paused | done
**Key People:** [[Sarah Chen]], [[Alex Park]]
```

### `## Timeline`
Newest-first chronological log of project events (decisions, blockers, status changes, milestones). New entries are prepended at the top; the date used is when the event happened, not when it was processed.

Entry format:
```
- {content} [{provenance}] ({source-type}, {identity}, {YYYY-MM-DD})
```

Callout blocks for blockers and decisions:
```
> [!warning] Blocker
> {description} [{provenance}] ({source-type}, {identity}, {YYYY-MM-DD})

> [!info] Decision
> {decision} [{provenance}] ({source-type}, {identity}, {YYYY-MM-DD})
```

### `## Tasks`
**Raw task storage.** All skills write task lines here — never inside or around the `## Open Tasks` Dataview block. Newest-first; new tasks are prepended at the top of the section.

Entry format:
```
- [ ] {task description} [project:: {project-name}] [type:: task|delegation|dependency|reply-needed|retry] [person:: {name if delegated}] 📅 {YYYY-MM-DD if due} {⏫ if high priority} {provenance}
```

Tasks accumulate here over the life of the project. Completed tasks flip `- [ ]` → `- [x]` in place (Tasks plugin / Obsidian convention).

### `## Open Tasks`
**Live view.** A Dataview query block — not storage. Renders all open tasks for this project from anywhere in the vault tagged `[project:: {name}]`. Skills do NOT write here.

```
\`\`\`dataview
TASK
FROM "myna"
WHERE !completed AND contains(text, "[project:: {project-name}]")
SORT priority DESC, due ASC
\`\`\`
```

(The exact query wording may vary; install templates pin the canonical form.)

### `## Links`
Reference URLs related to the project.

Entry format:
```
- [{title}]({url}) — {description} [{YYYY-MM-DD}]
```

### `## Notes`
Free-form scratchpad for thoughts that don't fit Timeline — written by either the user or the agent.

Entry format:
```
- {thought or note} [{provenance}] ({source-type}, {identity}, {YYYY-MM-DD})
```

---

## Person File

**Path:** `People/{person-name}.md` (lowercase, hyphenated slug from full name)

**Frontmatter:**
```yaml
---
created: {YYYY-MM-DD}
aliases: ["{Full Name}"]
---
```

**Tag line:** `#person #{relationship-tier}` (relationship tiers: `direct`, `peer`, `upward`, `cross-team`)

**Canonical body sections** (what skills create; users may reorder, rename, or remove):

### `## Overview`
```
**Name:** {full name}
**Role:** {role}
**Team:** {team}
**Relationship:** direct | peer | upward | cross-team
```

### `## Communication Preferences`
Populated over time. Free-form prose: what works, what doesn't, async vs sync preferences.

### `## Observations`
Newest-first chronological log of behavioral observations. New entries prepended.

Entry format:
```
- **{type}:** {observation} [{provenance}] ({source-type}, {identity}, {YYYY-MM-DD})
```

Types: `strength`, `growth-area`, `contribution`

### `## Pending Feedback`
Undelivered observations with coaching-tone talking points. Cleared by the user after delivery.

### `## Recognition`
Accomplishments worth recognizing. Newest-first; entries prepended.

Entry format:
```
- {what they did} — {context} [{provenance}] ({source-type}, {identity}, {YYYY-MM-DD})
```

### `## Personal Notes`
Non-work details: hobbies, family, milestones.

Entry format:
```
- [{YYYY-MM-DD}] {note}
```

### `## Meeting History`
Wiki-links to meeting files with this person.

```
- [[{Full Name} 1:1]] — 1:1 meetings (uses the 1:1 file's alias)
```

---

## Team File

**Path:** `Team/{team-name}.md` (lowercase, hyphenated slug)

**Frontmatter:**
```yaml
---
created: {YYYY-MM-DD}
aliases: ["{Team Display Name}"]
---
```

**Tag line:** `#team`

**Canonical body sections** (what skills create; users may reorder, rename, or remove):

### `## Overview`
```
**Team:** {team name}
**Members:** [[Sarah Chen]], [[Alex Park]], ...
```

### `## Timeline`
Team-level observations: retro themes, cross-1:1 patterns, process changes. Newest-first; entries prepended.

```
- {observation} [{provenance}] ({source-type}, {identity}, {YYYY-MM-DD})
```

### `## Health Snapshots`
Weekly snapshots for trend tracking. Newest snapshot at the top.

```
### {YYYY-MM-DD}

| Person | Open Tasks | Overdue | Feedback Gap | Attention Gap | Last 1:1 |
|--------|-----------|---------|--------------|---------------|----------|
| Sarah  | 5         | 1       | 12 days      | None          | Apr 2    |
| Alex   | 8         | 3       | 45 days ⚠    | 52 days ⚠     | Mar 28   |
```

# System Files

Internal Myna files: parked context, sources, logs, link index, dashboards, learnings. Most are agent-managed with light user touch. Load alongside `_conventions.md`.

---

## Parked Context File

**Path:** `_system/parked/{topic-slug}.md`

**Frontmatter:**
```yaml
---
parked: {YYYY-MM-DD HH:MM}
topic: {topic name}
---
```

**Canonical body sections** (what skills create; users may reorder, rename, or remove):

### `## Summary`
One-line summary of what was being worked on.

### `## Referenced Files`
```
- [[{file-1}]] — {why relevant}
- [[{file-2}]] — {why relevant}
```

### `## Discussion Summary`
What was explored, considered and rejected, decided and why.

### `## Current State`
Exactly where work stopped — what was in progress, half-done.

### `## Next Steps`
What was about to happen next, in enough detail to resume immediately.

### `## Open Questions`
Anything unresolved.

### `## Key Constraints`
Decisions or constraints that shaped the work — so a future session doesn't re-debate.

---

## Source File

**Path:** `_system/sources/{entity-name}.md` — one file per entity (project, person, meeting, or `contributions`). Filename matches the entity file name (e.g., `_system/sources/auth-migration.md` for `Projects/auth-migration.md`).

**Body — newest-first, one session block per processing run (new blocks prepended):**

```
## {YYYY-MM-DD} — {source type}: {source identity}

> Verbatim text from original source.

{full raw text}

Referenced by: [[{vault-file}]] — {which entry}
```

Sources: `email`, `slack`, `meeting`, `capture`, `user`.

---

## Processed Channels Log

**Path:** `_system/logs/processed-channels.md`

Tracks the last-processed timestamp per Slack channel for deduplication. Auto-updated by `process-messages`; do not edit manually.

```yaml
# Auto-updated by myna-process-messages skill. Do not edit manually.
channels:
  auth-team: "2026-04-05T14:30:00Z"
  auth-migration: "2026-04-05T14:30:00Z"
  platform-eng: "2026-04-04T09:15:00Z"
```

On each run, `process-messages` reads messages after the stored timestamp and updates it after successful processing.

---

## Central Link Index

**Path:** `_system/links.md`

Vault-wide link search. Links also live in the relevant entity's `## Links` section; this index provides cross-entity browsing.

```
## Links

- [{YYYY-MM-DD}] [{title}]({url}) — {description} — {entity: [[project]] or [[person]] or general}
```

---

## Unified Dashboard

**Path:** `_system/dashboards/dashboard.md`

A Dataview-powered file with live queries — always up-to-date without manual refresh. **Curated file (per Read Principle).** Skills do NOT extract data from it; they query the underlying source files directly.

**Sections (rendered live by Dataview):**
- Immediate Attention (overdue tasks, overdue delegations, blockers)
- Today's Meetings (from calendar, linked to prep files)
- Review Queue (count per queue with links)
- Active Projects (status per project)
- Delegation Tracker (overdue + approaching deadline)
- People Overview (upcoming 1:1s, feedback gaps)
- Team Health (managers — summarized from `Team/` files)
- Current Drafts (list of files in `Drafts/`)
- Recent Activity (latest vault writes)

The dashboard is a presentation file, not a schema for skills to write to.

---

## Learnings File

**Path:** `_meta/learnings/{domain}.md` — one file per domain. Domains: `email`, `meetings`, `tasks`, `people`, `general`.

**Body:**

```
# Learnings — {Domain}

## Active

### {Sub-domain or general}
- {rule or observation}. [{Marker}] ({date or dates}, {evidence})

## Proposed

### {Sub-domain or general}
- {rule or observation}. [Inferred] ({date}, {evidence}) [obs: N]
```

**Sections:**
- **Active** — entries that take effect immediately. Loaded at session start and applied to Myna's behavior.
- **Proposed** — entries observed but not yet confirmed. Dormant until promoted to Active by repetition (3 observations across reflection passes) or explicit user confirmation.

**Provenance markers** (per `steering-conventions`):
- `[User]` — user explicitly requested capture
- `[Auto]` — main agent captured from a clear in-session directive
- `[Inferred]` — captured by reflection from an observed pattern; needs promotion or confirmation
- `[Verified]` — was `[Inferred]`, user confirmed during promotion negotiation

**Observation count.** The `[obs: N]` suffix on Proposed entries tracks reflection-pass observation count. When N reaches 3, the entry auto-promotes to Active and the suffix is removed.

**Multiple observations on Active entries** are recorded inline as evidence accumulates:
```
- Avoid Friday afternoon meetings. [Inferred] (3 reschedules: 2026-03-21, 2026-03-28, 2026-04-04)
```

**Lazy file creation.** Learning files are created by the `learn` skill on first write. Empty domain files are not pre-populated. Users may edit learning files directly; the skill respects manual edits and does not validate format.

**Domain mapping** is defined in the `steering-memory` skill.

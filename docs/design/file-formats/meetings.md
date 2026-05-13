# Meetings — 1:1, Recurring, Adhoc

Meeting files. Load alongside `_conventions.md`.

---

## Meeting File — 1:1

**Path:** `Meetings/1-1s/{person-name}.md` (one file per person; sessions stored newest-first — most recent session at the top)

**Frontmatter:**
```yaml
---
type: 1-1
person: [[{Full Name}]]
aliases: ["{Full Name} 1:1"]
---
```

The 1:1 file's alias is `{Full Name} 1:1` (e.g., `Sarah Chen 1:1`), not just the person's name — that's already taken by the person file.

**Tag line:** `#meeting #1-1`

**Body — one block per session, newest at the top (prepended on each new session):**

```
## {YYYY-MM-DD} Session

### Prep
- [ ] **Follow-through check:** {did you complete your action items?}
- [ ] **Carry-forward:** {unchecked items from last session}
- [ ] **Recent work:** {contributions, project updates since last 1:1}
- [ ] **Pending feedback:** {observation with coaching suggestion}
- [ ] **Career development:** {growth areas, time since last career conversation}
- [ ] **Personal:** {personal notes from person file}

### Notes
**Discussion:**

**Action Items:**

**Decisions:**
```

**Conventions:**
- `### Prep` is typically auto-generated before the meeting; user checks off items discussed and can add custom prep items.
- `### Notes` holds meeting content — usually the user's rough notes during the meeting, but `process-messages` may also append imported summaries from email or Slack threads about the meeting. Bold sub-labels (`**Discussion:**`, `**Action Items:**`, `**Decisions:**`) are conventions, not headings — they organize the section but aren't queryable.
- After the meeting, `process-meeting` reads `### Notes` and writes structured outputs (action items → project `## Tasks`, observations → person file, decisions → project Timeline).

---

## Meeting File — Recurring

**Path:** `Meetings/Recurring/{meeting-name}.md`

**Frontmatter:**
```yaml
---
type: recurring
project: {project-name or null}
aliases: ["{Meeting Display Name}"]
---
```

**Tag line:** `#meeting #recurring`

**Body — one block per session, newest at the top (prepended on each new session):**

```
## {YYYY-MM-DD} Session

### Prep
- [ ] {prep items relevant to meeting type}

### Notes
**Discussion:**

**Action Items:**

**Decisions:**
```

Same Prep/Notes conventions as 1:1.

---

## Meeting File — Adhoc

**Path:** `Meetings/Adhoc/{YYYY-MM-DD}-{meeting-name}.md` (date first, for chronological sort)

**Frontmatter:**
```yaml
---
type: adhoc
---
```

**Tag line:** `#meeting #adhoc`

**Body:** one session block (no appending — one file per meeting).

```
## {YYYY-MM-DD} Session

### Prep
### Notes
**Discussion:**
**Action Items:**
**Decisions:**
```

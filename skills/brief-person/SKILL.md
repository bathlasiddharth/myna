---
name: brief-person
disable-model-invocation: true
description: Deep-dive briefing on one person — role, shared projects, open items, pending feedback, 1:1 history, personal notes. Works for directs, peers, manager, or cross-team. (For all directs at once, use /myna:team-health.)
user-invocable: true
argument-hint: "[person name]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

Before reading structured vault files, read `~/.claude/myna/file-formats/_conventions.md` and `~/.claude/myna/file-formats/entities.md`, sections `## Person File` and `## Project File`.

# Person Briefing

Synthesize everything Myna knows about a person and display it inline. Read-only — no vault writes.

---

## What to Gather

Resolve the person name via fuzzy matching against people.yaml. If multiple people match, list options and ask the user to pick. If no match, ask for clarification.

Once resolved, read these files in parallel:

| Source | Path | What to extract |
|--------|------|-----------------|
| Person file | `People/{person-slug}.md` | Role, team, relationship tier, recent observations, pending feedback, recognition log, personal notes |
| 1:1 meeting file | `Meetings/1-1s/{person-slug}.md` | Last session date, carry-forward items from last session, action items from last session |
| Project files | `Projects/*.md` | Projects where this person appears in key-people or timeline entries |
| Task files | All project files + personal TODOs | Open items involving this person — see "Open Items detection" below |
| Recent interactions | Grep `{person-name}` and all aliases from people.yaml across `Projects/`, `Meetings/`, and `Journal/` | Timeline entries and meeting notes that mention this person in the last 30 days — these represent recent email/Slack exchanges and interactions that were logged to the vault |
| Pending drafts | Grep `{person-name}` and all aliases from people.yaml across `Drafts/` | Any pending draft emails or messages addressed to or mentioning this person |

**Person slug:** The file path slug is the kebab-case of the person's full_name from people.yaml (e.g., "Sarah Chen" → `sarah-chen`). If people.yaml has no full_name, use display_name.

**Open Items detection:** Grep open tasks (`- [ ]`) across `Projects/` that mention this person. Search all identity forms from people.yaml: display name, full name, slug, and all aliases. Also search wiki-link forms `[[full-name]]` and `[[slug]]` since different skills may write either form.

- **Assigned to them:** any open `[type:: task]` where `[person:: {name}]` appears (any name form) and the name does not match `user.name` from workspace.yaml.
- **Reply-needed involving {name}:** `[type:: reply-needed]` tasks mentioning this person. Do not assert direction unless the task text or owner field makes it explicit that the user is the one who owes action.

Missing files are not errors — skip and note what was unavailable.

---

## Output Structure

Show all sections inline. Always include every section — if a section has no data, show a brief note (e.g., "None logged.", "No open items.", "No recent interactions found."). Never silently skip a section.


```
## 👤 [Person Name] — [Role], [Team]

**Relationship:** [direct | peer | upward | cross-team]

---

### Summary
[2-4 sentences covering the person's current situation, most pressing open item (if any), and one key thing to know before meeting with them. Synthesize only facts present in the vault. Do not infer tone, mood, relationship quality, or any internal state.]

### Overview
[Role description and context from person file. 1-2 sentences.]

### Shared Projects
- **[Project Name]** — [status] — [one-line on current state, any open blockers]
- ...

### Open Items
**Assigned to them:**
- [task description] — due [date] (from [project])
- ...

**Reply-needed involving {name}:**
- [task or item description] — [source]
- ...

### Pending Feedback
[Undelivered observations with coaching-tone talking points, from the Pending Feedback section of their person file.]
- **[type]:** [observation] — Talking point: [coaching suggestion]
- ...

### 1:1 History
Last 1:1: [date] ([X days ago])

Carry-forward from last session:
- [item]
- ...

Action items from last session:
- [ ] [item] — [assigned to]
- ...

### Recent Recognition
[Last 2-3 recognition entries from recognition log]
- [[date]] [what they did] — [context]

### Recent Observations
[Last 3-5 observations from observations timeline]
- [[date]] **[type]:** [observation]

### Recent Interactions (last 30 days)
[Timeline entries, meeting notes, email/Slack references that mention this person. Dated, sourced.]
- [[date] | [source]] [entry text]
- ...

### Pending Drafts
- [[type]] [draft title] — [Drafts/{filename}]
- ...

### Personal Notes
[Hobbies, family, milestones, things they've mentioned]
- [note]
- ...
```

## Edge Cases

- **No person file exists:** Create a minimal briefing from what's findable (project mentions, meeting references). Note "No person file found — briefing is partial."
- **No 1:1 history:** Show the section with "No 1:1 sessions found."
- **Cross-team contact with no person file:** Show recent interactions only — pull vault mentions from the last 30 days with date and source.
- **Ambiguous person name:** "brief me on Alex" when there's both an Alex Kumar and an Alex Thompson — list both and ask which one.

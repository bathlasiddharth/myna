---
name: brief-person
disable-model-invocation: true
description: Deep-dive briefing on one person — role, shared projects, open items, pending feedback, 1:1 history, personal notes. Works for directs, peers, manager, or cross-team. (For all directs at once, use /myna:team-health.)
user-invocable: true
argument-hint: "[person name]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:init` and stop.

# Person Briefing

Synthesize everything Myna knows about a person and display it inline. Read-only — no vault writes.

Check `features.people_management` in workspace.yaml. If disabled, inform the user and stop.

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
| Contributions log | `Journal/contributions-{week}.md` for current and prior week | Recent contributions this person is mentioned in |
| Recent interactions | Grep `{person-name}` across `Projects/`, `Meetings/`, and `Journal/` | Timeline entries and meeting notes that mention this person in the last 30 days — these represent recent email/Slack exchanges and interactions that were logged to the vault |

**Person slug:** The file path slug is the kebab-case of the person's full_name from people.yaml (e.g., "Sarah Chen" → `sarah-chen`). If people.yaml has no full_name, use display_name.

**Open Items detection:** Grep open tasks (`- [ ]`) across `Projects/` that mention this person:
- **You delegated to them:** `[type:: delegation] [person:: {name}]` — tasks where you assigned them work
- **They're waiting on you:** `[type:: dependency] [person:: {name}]` or `[type:: reply-needed] [person:: {name}]` — tasks blocking them that require your action

For **cross-team contacts, PMs, and VPs** (relationship_tier: cross-team or upward): also collect stakeholder mentions — every place this person appears in your vault data (meeting notes, timeline entries, email references). Present as a dated list of raw mentions, not interpreted stance or position.

Missing files are not errors — skip and note what was unavailable.

---

## Output Structure

Show all sections inline. Skip empty sections silently (don't print "No observations logged").

```
## 👤 [Person Name] — [Role], [Team]

**Relationship:** [direct | peer | upward | cross-team]

---

### 📋 Overview
[Role description and context from person file. 1-2 sentences.]

### 🗂️ Shared Projects
- **[Project Name]** — [status] — [one-line on current state, any open blockers]
- ...

### ✅ Open Items
**You delegated to them:**
- [task description] — due [date] (from [project])
- ...

**They're waiting on you:**
- [task or item description] — [source]
- ...

### 💬 Pending Feedback
[Undelivered observations with coaching-tone talking points, from the Pending Feedback section of their person file.]
- **[type]:** [observation] — Talking point: [coaching suggestion]
- ...

### 📅 1:1 History
Last 1:1: [date] ([X days ago])

Carry-forward from last session:
- [item]
- ...

Action items from last session:
- [ ] [item] — [assigned to]
- ...

### 🏆 Recent Recognition
[Last 2-3 recognition entries from recognition log]
- [[date]] [what they did] — [context]

### 📝 Recent Observations
[Last 3-5 observations from observations timeline]
- [[date]] **[type]:** [observation] [[provenance]]

### 💼 Recent Interactions (last 30 days)
[Timeline entries, meeting notes, email/Slack references that mention this person. Dated, sourced.]
- [[date] | [source]] [entry text]
- ...

### 🌱 Personal Notes
[Hobbies, family, milestones, things they've mentioned]
- [note]
- ...

### 🔗 Stakeholder Mentions  [Only for cross-team/upward relationships]
[Factual list of where this person appears in your project data. Raw mentions with dates — you connect the dots.]
- [[date]] [meeting/email/timeline entry text] — [source]
- ...
```

---

## Worked Example

**User:** "brief me on Sarah"

**Resolution:** Sarah → `sarah-chen` in people.yaml, relationship_tier: direct

**Files read:**
- `People/sarah-chen.md` — role: Senior Engineer, team: Platform, observations, pending feedback, personal notes
- `Meetings/1-1s/sarah-chen.md` — last session 2026-04-02, 2 carry-forward items
- `Projects/auth-migration.md` — Sarah in key-people, 3 open tasks assigned to her
- `Projects/platform-api.md` — Sarah mentioned in 2 timeline entries

**Output:**

```
## 👤 Sarah Chen — Senior Engineer, Platform

**Relationship:** direct

---

### 📋 Overview
Senior engineer on the Platform team. Working on the Auth Migration and Platform API projects.

### 🗂️ Shared Projects
- **Auth Migration** — active — API spec review due Friday, 1 open blocker (Platform API dependency)
- **Platform API** — active — On track, no blockers

### ✅ Open Items
**You delegated to them:**
- Draft API spec v2 — due 2026-04-11 (Auth Migration)
- Review platform onboarding guide — no due date (Platform API)

**They're waiting on you:**
- Approve caching architecture decision — flagged in 1:1 (2026-04-02)

### 💬 Pending Feedback
- **strength:** Excellent incident response during the March 22 outage. Talking point: "Your calm under pressure during the outage directly reduced the blast radius — I want to make sure you know that's noticed."

### 📅 1:1 History
Last 1:1: 2026-04-02 (10 days ago)

Carry-forward from last session:
- Discuss Q3 growth goals
- Check in on API spec timeline

Action items from last session:
- [ ] Draft API spec v2 — Sarah
- [ ] Send caching decision context doc — you

### 🏆 Recent Recognition
- [2026-03-22] Led incident response for the auth service outage — resolved P0 in under 2 hours [Auto]

### 📝 Recent Observations
- [2026-03-22 | meeting 1:1 with Sarah] **strength:** Calm, methodical incident response [Auto]
- [2026-03-10 | email from Sarah] **contribution:** Shipped auth migration Phase 1 on time [Auto]

### 🌱 Personal Notes
- Training for the SF Marathon in June
- Mentioned sister's wedding coming up in May
```

---

## Edge Cases

- **No person file exists:** Create a minimal briefing from what's findable (project mentions, meeting references). Note "No person file found — briefing is partial."
- **No 1:1 history:** Skip the 1:1 History section entirely.
- **Manager or skip-level (upward relationship):** Focus on shared context — projects they're stakeholders on, recent email/meeting mentions, open items. Skip the pending feedback section (you don't manage them). Show Stakeholder Mentions section (same as cross-team).
- **Cross-team contact with no person file:** Show stakeholder mentions only — pull every vault mention with date and source.
- **Ambiguous person name:** "brief me on Alex" when there's both an Alex Kumar and an Alex Thompson — list both and ask which one.

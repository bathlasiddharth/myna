---
name: myna-prep-meeting
description: Generate or update meeting prep for one meeting or all remaining meetings today. Infers meeting type from calendar data, writes the Prep section with checkboxes, carry-forward items, and coaching notes for sensitive topics.
user-invocable: true
argument-hint: '"prep for my 1:1 with Sarah", "prep for my remaining meetings", "update prep for my meetings"'
---

# myna-prep-meeting

Generate meeting prep — a set of checkboxes covering what to discuss, what to review, and what needs decisions — written to the meeting file before the meeting.

Check `features.meeting_prep` in workspace.yaml before proceeding. If disabled, stop.

---

## Invocation Modes

**Single meeting:** "prep for my 1:1 with Sarah", "prep for [meeting name]"
→ Generate prep for that one meeting only

**All remaining today:** "prep for my remaining meetings", "prep my meetings"
→ Read today's calendar, find meetings without prep, generate for each

**Update existing prep:** "update prep for my meetings", "refresh my meeting prep"
→ For each meeting that already has a Prep section, read the existing prep as context, then append only what's new since the last prep run (new tasks, new blockers, new decisions, new carry-forwards). Never modify existing prep items.

**Add a topic:** "add topic to [meeting]: [topic]"
→ Append a single checkbox to the existing Prep section. No full regeneration.

---

## Meeting Type Inference

Determine meeting type before generating prep — the type determines what content to include.

**Inference priority:**
1. meetings.yaml override — if the meeting has an entry, use its configured `type`
2. Attendee count of 2 → 1:1 (check person against people.yaml by name or email)
3. Event title matches a project name or alias from projects.yaml → project meeting
4. All attendees are in the user's direct reports (people.yaml, relationship_tier: direct) → team meeting
5. Mix of directs and cross-team attendees → cross-team/coordination meeting
6. Recurring event with team-like attendee pattern → standup/sync
7. "Review", "Design Review", "Doc Review" in title → design/doc review

When not confident, ask the user once: "Is this a 1:1 with Sarah or a team meeting?" Save the answer as an override in meetings.yaml so you don't ask again.

**Meeting types and their prep behaviors:**
- `1-1` — deepest prep, see 1:1 section
- `project` — focused on project status
- `team` / `standup` — your updates, blockers, delegations
- `design-review` / `doc-review` — doc link, previous decisions, questions
- `cross-team` — dependencies, what you need from them
- `adhoc` — general open items and context

---

## Meeting File Location

| Meeting type | File path |
|---|---|
| 1:1 | `Meetings/1-1s/{person-slug}.md` |
| Recurring (standup, sync, regular team) | `Meetings/Recurring/{meeting-slug}.md` |
| Adhoc or one-off | `Meetings/Adhoc/{meeting-slug}.md` |

If the file doesn't exist, create it from the appropriate template (see File Templates below). If it exists, prepend a new session section.

---

## Session Structure

Each session is a top-level `## {YYYY-MM-DD} Session` block prepended to the top of the meeting file, after the frontmatter and tags. Within it, two sections:

```markdown
## 2026-04-10 Session

### Prep

> Auto-generated before the meeting. Check off items discussed.

- [ ] {prep item}
- [ ] {prep item}

### Notes

> Your rough notes during the meeting.

**Discussion:**

**Action Items:**

**Decisions:**

---
```

For 1:1 files, sessions accumulate in one file, newest at the top.
For adhoc meetings, each meeting gets its own file (one session per file).

---

## Prep Content by Meeting Type

### 1:1 Prep (deepest prep)

These are the highest-leverage meetings. Generate all of the following:

**1. Follow-through check**
Did YOU complete your action items from the last session? Read the previous session's Prep and Notes sections, find items assigned to you, check against completed tasks in the project file. Flag ones not done: "(not done — carried forward)"

**2. Carry-forward items**
Unchecked prep items from the previous session get a new checkbox: `- [ ] {original text} (carried from {YYYY-MM-DD})`

**3. Recent contributions and project work**
List what you've done since the last 1:1 that this person would care about. Read from:
- `Journal/contributions-{week}.md` — filter for relevant projects/person
- Task completions in project files
Keep factual — dates, specific deliverables. Not "I've been very busy."

**4. Open action items between you and this person**
Tasks where `[person:: {name}]` or delegations from/to this person across all project files.

**5. Pending feedback with coaching suggestion**
Read `People/{person}.md` `## Pending Feedback` section. For each item, include it as a checkbox and add a coaching note if the topic is sensitive.

**6. Career development context**
From `People/{person}.md`: growth areas, time since last career conversation. Flag if it's been more than 30 days (configurable `feedback_cycle_days`).

**7. Personal notes**
From `People/{person}.md` `## Personal Notes`. Include any notes about things they mentioned (marathon, vacation, family).

**8. Recent decisions on shared projects**
Timeline decisions from shared project files since the last 1:1.

**9. Open blockers on shared projects**
Active blockers from shared project timelines.

### Project Meeting Prep

- Open tasks for the project (`Projects/{project}.md` open tasks, filter for attendees)
- Recent timeline entries (last 2 weeks)
- Active blockers
- Decisions needed (items in review queue related to this project)
- Dependencies with other teams mentioned in timeline

### Team Standup / Sync Prep

- Your updates to share: tasks completed since last standup, tasks in progress
- Overdue delegations (tasks with `[type:: delegation]` where due date has passed)
- Cross-team blockers affecting multiple people
- Action items from the last standup's Notes section
- Any items from people.yaml directs needing team visibility

### Design Review / Doc Review Prep

- Link to the document being reviewed (from project file `## Links` or context)
- Related project context: what phase, what's already decided
- Previous decisions on this topic (from project timeline)
- Open questions or risks to raise (from project file Notes section)

### Cross-Team Meeting Prep

- Open dependencies on the other team (tasks with `[type:: dependency]` mentioning their projects)
- Items you're waiting on from them (tasks with `[type:: reply-needed]` or `[type:: delegation]` assigned to cross-team people)
- Recent comms with attendees (from email processing, if in person files)
- What you need from this meeting — specific asks or decisions

---

## Conversation Coaching

For prep items that involve sensitive or high-stakes topics, add a coaching suggestion in parentheses after the checkbox item. Apply coaching to:

- **Pending feedback on a growth area** → coaching tone, opening suggestion
- **Critically blocked project** → framing for escalation without blame
- **Overdue delegation** → how to follow up without micromanaging
- **Difficult or uncomfortable topic** → approach based on relationship tier

Use relationship tier from people.yaml and `communication-style.yaml` `difficult_message_approach` field.

**Coaching format** — use a subtle note, not a lecture:
```
- [ ] **Pending feedback:** Sarah's documentation gaps in the auth spec [growth-area]
  > 💬 *Open with what's working in the auth spec before raising the documentation gaps. Specific example beats general concern.*
```

Not every item gets coaching — only items flagged as sensitive. Straightforward status items and follow-ups stay as plain checkboxes.

---

## Update Mode (Refresh Existing Prep)

When the user says "update prep":

1. Read the existing Prep section for each meeting
2. Note any items the user has already added manually (these are user-added topics — don't duplicate)
3. Check what's changed since the prep was last generated:
   - New task completions
   - New timeline entries or decisions
   - New blockers
   - New items needing carry-forward
4. Append only new items to the Prep section, below the existing items
5. Never remove, edit, or reorder existing prep items

Use a sub-separator if appending to distinguish from original prep:
```
---
*Updated {YYYY-MM-DD HH:MM}*
- [ ] {new item since last prep}
```

---

## File Templates

### 1:1 File (create if missing)
```markdown
---
type: 1-1
person: [[{person-slug}]]
---

#meeting #1-1
```
Sessions are prepended below the tags (newest at top).

### Recurring File (create if missing)
```markdown
---
type: recurring
project: {project-slug or null}
---

#meeting #recurring
```

### Adhoc File (create if missing)
```markdown
---
type: adhoc
---

#meeting #adhoc
```

---

## Output

After generating prep:
```
📋 Prep ready for {meeting name} — {N} items.
{file link}

Say "done with {meeting name}" after the meeting to process your notes.
```

For batch (all remaining today):
```
📋 Prep generated for {N} meetings:
  • {meeting 1}: {N} items — {file link}
  • {meeting 2}: {N} items — {file link}
```

---

## Edge Cases

**Calendar MCP unavailable:** Ask the user which meeting to prep for. Can't generate "all remaining meetings" without calendar access.

**Meeting file doesn't exist:** Create it from template, then generate prep.

**Person not in people.yaml (1:1):** Generate what you can (carry-forwards, project tasks). Note: "Sarah not in people.yaml — career dev and feedback sections skipped. Add her to people.yaml to unlock full 1:1 prep."

**Meeting type unclear and can't infer:** Ask user once. If they don't know (e.g., "just a meeting with Marcus"), default to `adhoc` and generate general prep.

**No previous session (first time meeting):** Skip carry-forwards and follow-through check. Generate all other sections.

**myna-sync already generated prep today:** Read existing prep as context (update mode — append delta only). Don't regenerate from scratch.

---

## Worked Example

**User says:** "prep for my 1:1 with Sarah"

1. Read `_system/config/meetings.yaml` — no override for this meeting
2. Read calendar: finds "1:1 - Siddharth / Sarah" at 2:00 PM, attendee count = 2 → type: 1:1
3. File path: `Meetings/1-1s/sarah-chen.md` — exists, has previous sessions
4. Read last session (2026-04-03): 3 unchecked prep items from that session
5. Read `People/sarah-chen.md`: pending feedback (documentation gaps), growth area (async communication), personal notes ("mentioned marathon training"), last career conversation was 2026-02-28 (41 days ago — flag)
6. Read tasks across project files for Sarah-related items: 2 open delegations from Sarah (API spec draft, cert rotation sign-off)
7. Read `Journal/contributions-{week}.md`: Sarah mentioned in auth migration update
8. Read `Projects/auth-migration.md` timeline: 2 decisions since last 1:1, 1 active blocker
9. Generate prep session with all sections, coaching note for pending feedback and 41-day career gap

Prepended to `Meetings/1-1s/sarah-chen.md` (after frontmatter and tags, above any previous sessions):
```markdown
## 2026-04-10 Session

### Prep

> Auto-generated before the meeting. Check off items discussed.

- [ ] **Follow-through check:** Did you send the cert renewal request? (not done — carried forward)
- [ ] **Carry-forward:** Decision on OAuth 2.0 PKCE scope (carried from 2026-04-03)
- [ ] **Carry-forward:** Review Sarah's diagram in the design doc (carried from 2026-04-03)
- [ ] **Recent work:** Auth migration spec v2 completed — filed 2026-04-07
- [ ] **Open delegation:** Sarah to deliver API spec draft 📅 2026-04-09 (overdue by 1 day)
- [ ] **Open delegation:** Cert rotation sign-off from Sarah 📅 2026-04-12
- [ ] **Pending feedback:** Documentation gaps in auth spec [growth-area]
  > 💬 *Open with the strong work on spec v2 before raising the documentation gaps. Specific example ("the cert rotation section had no rollback notes") beats general feedback.*
- [ ] **Career development:** Last career conversation: 2026-02-28 (41 days ago — consider raising)
- [ ] **Personal:** Sarah mentioned marathon training last time — check in
- [ ] **Decision (auth migration):** Go with OAuth 2.0 PKCE flow — confirm Sarah is aligned
- [ ] **Blocker:** Infra cert rotation blocking launch — discuss mitigation

### Notes

> Your rough notes during the meeting.

**Discussion:**

**Action Items:**

**Decisions:**

---
```

Output: "Prep ready for 1:1 with Sarah — 11 items. obsidian://open?vault=...&file=Meetings/1-1s/sarah-chen.md"

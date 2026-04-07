# Prep Meeting

## Purpose

Generate or update meeting prep — a checklist of topics, action items, and context — so the user walks into every meeting prepared. Includes conversation coaching for sensitive items.

## Triggers

- "Prep for my 1:1 with Sarah" — single meeting prep
- "Prep for my remaining meetings" — batch prep for all unprepped meetings today
- "Update prep for my meetings" — refresh existing preps with new information
- "Add topic to standup: [topic]" — append a single checkbox to a meeting's Prep section

## Inputs

- **Calendar MCP** (`calendar.list_events`): today's meetings — title, time, attendees, recurrence
- **workspace.yaml**: `user.name`, `user.email` (to identify your items vs others'), `feedback_cycle_days`
- **meetings.yaml**: type overrides, project associations, aliases, `debrief_type`
- **people.yaml**: relationship tiers, display names, aliases
- **projects.yaml**: project names, aliases, key people
- **communication-style.yaml**: presets per audience tier, `difficult_message_approach`
- **Person files** (`People/{name}.md`): pending feedback, personal notes, observations, career development
- **Project files** (`Projects/{name}.md`): open tasks, timeline, blockers, decisions
- **Meeting files** (`Meetings/{type}/{name}.md`): previous sessions (carry-forward items, last action items)
- **Contributions log** (`Journal/contributions-{week}.md`): recent work since last meeting

## Procedure

### 1. Identify Target Meeting(s)

- **Single:** resolve the meeting name against today's calendar events using meetings.yaml aliases and fuzzy matching on titles. If a Prep section for today already exists (e.g., sync wrote it earlier), treat as an update — read existing prep, append only new items.
- **Batch ("remaining"):** find all today's meetings that don't yet have a Prep section for today's date.
- **Update:** find all today's meetings that already have a Prep section. Read existing prep (including user-added topics) as context. "New since last prep" means: items from project timelines, tasks, or person files with dates after the most recent session header date in the meeting file (e.g., if the previous session was `## 2026-03-28 Session`, new = anything dated after March 28). Before appending any item, check existing prep items for near-duplicates — same content, same person — and skip if already present. Never remove or modify existing items.
- **Add topic:** resolve the meeting, append `- [ ] {topic}` to the existing Prep section.

For "add topic," append the checkbox and confirm. Skip the rest of the procedure.

### 2. Infer Meeting Type

For each meeting, determine type using these signals in priority order:

1. **meetings.yaml override** — if the meeting has an entry with `type`, use it.
2. **Attendee count** — exactly 2 attendees (you + 1 other) = 1:1.
3. **Title matching** — match title against project names/aliases from projects.yaml. Match = project meeting.
4. **Attendee composition** — all attendees are your directs (from people.yaml `relationship_tier: direct`) = team meeting. Mix of teams = cross-team meeting.
5. **Recurrence** — recurring = established meeting (recurring or standup). One-off = adhoc.
6. **Not confident** — ask the user. Store their answer as an override in meetings.yaml for next time.

Map to file path:
- 1:1 → `Meetings/1-1s/{person-name}.md`
- Recurring/standup/team/project → `Meetings/Recurring/{meeting-name}.md`
- Adhoc/one-off → `Meetings/Adhoc/{meeting-name}.md`

### 3. Create or Locate Meeting File

If the meeting file doesn't exist, create it with frontmatter (`type`, `person` or `project` as applicable) and tags. If it exists, append a new session header: `## {YYYY-MM-DD} Session`.

### 4. Generate Prep by Meeting Type

Write prep under `### Prep` as checkboxes. Every item is a `- [ ]` checkbox.

**All meeting types — common items:**
- Open action items between you and attendees (from project files and previous meeting sessions)
- Carry-forward items: unchecked items from the previous session's Prep section
- Recent decisions on relevant projects (from project timelines, last 2 weeks)
- Open blockers on shared projects

**1:1s — deeper prep (highest-leverage meetings):**
- **Follow-through check:** Did YOU complete your action items from last session? List completed and missed ones explicitly. This prevents showing up unprepared.
- **Recent work:** Contributions and project updates by this person since last 1:1 (from project timelines, task completions, contributions log). Factual list, not interpretation.
- **Pending feedback:** Undelivered observations from person file's Pending Feedback section. Add coaching suggestion for each (see step 5). If no feedback logged in more than `feedback_cycle_days` (from workspace.yaml, default 30, overridable per person in people.yaml), add a nudge: "No feedback logged in X days — consider discussing growth areas or recent work."
- **Career development:** Growth areas from person file, recent observations tagged to those areas, time since last career conversation. Flag if no career topic in 3+ sessions.
- **Personal notes:** From person file's Personal Notes section ("asked about the marathon last time").

**Project meetings:**
- Open tasks for that project, grouped by owner
- Recent timeline entries (last 2 weeks)
- Dependency status and blockers
- Decisions needed (items flagged in project file)

**Standup/sync:**
- Your updates to share: tasks completed and in progress since last standup
- Overdue delegations to follow up on
- Blockers across the team (from project files where attendees are key people)
- Action items from last standup session

**Design/doc review:**
- Link to the document being reviewed (from project file Links section or meeting context)
- Previous decisions on this topic (from project timeline)
- Related project context and open questions
- **Pre-read analysis** (if a document is linked or pasted): generate a 6-section pre-read note:
  1. **TL;DR** — one-sentence summary of what the document proposes
  2. **Key Decisions Being Asked** — what is the author asking reviewers to decide or approve?
  3. **Risks and Concerns** — what could go wrong, what's missing, what's under-specified?
  4. **Questions to Ask** — specific questions to raise based on gaps or assumptions
  5. **How It Relates to Your Projects** — connections to your active projects and open tasks
  6. **Stakeholder Impact** — who else is affected by what's proposed?
  Write these as checkboxes under `### Pre-Read` in the meeting prep. If no document is linked, skip this section.

**Cross-team meetings:**
- Open dependencies on the other team (from project timelines)
- What you're waiting on from attendees (delegated tasks, pending items)
- Recent communications with attendees (from vault — meetings, email mentions)
- What you need from this meeting (open blockers that require their input)

### 5. Add Conversation Coaching for Sensitive Items

Only for items flagged as sensitive — not every checkbox. Sensitive items: pending feedback, overdue delegations, blocked escalations, difficult topics.

Add a brief coaching suggestion indented under the checkbox, calibrated to:
- **communication-style.yaml** — the user's approach (`difficult_message_approach`, preset per tier)
- **Relationship tier** of attendees (from people.yaml)

Examples of coaching lines:
- Pending feedback → "Consider opening with the positive impact before discussing the growth area"
- Overdue delegation → "Ask about blockers first, not status"
- Escalation → "Frame as impact to timeline, not blame"
- Difficult topic with a peer → "Lead with shared goals"
- Difficult topic upward → "Lead with data and business impact"

### 6. Output

Show the user a summary: meeting name, type, number of prep items generated, any items needing attention (e.g., "2 action items from last session still open").

For batch mode, show a summary per meeting and a total: "Prepped 4 meetings. 2 have carry-forward items."

## Rules

- **Check `features.meeting_prep`** before acting. If disabled, inform the user and stop.
- **Prep items are checkboxes.** The user checks them off during the meeting. Process-meeting reads the checked/unchecked state later.
- **Append-only.** Never modify or remove existing content in meeting files. Existing user-added topics are preserved. Update mode appends only new items below existing ones.
- **Factual, not judgmental.** All data points are dates, counts, explicit entries. The judgment belongs to the user (D018).
- **No dependency on other skills running first.** Use whatever data is currently in the vault. If process hasn't run today, prep uses yesterday's data. User can "update prep" after running other skills.
- **Coaching is optional and lightweight.** One line per sensitive item. Don't coach straightforward checkboxes.
- **Missing vault files are not failures.** If a person file, project file, or previous meeting session doesn't exist, skip that data source and proceed with available data. Note in the output what was unavailable: e.g., "No person file found for Sarah — skipped person-level prep items." Generate whatever prep is possible from the data that does exist.

## Worked Example

User says: "prep for my 1:1 with Sarah"

1. **Calendar:** finds "1:1 with Sarah Chen" at 2:00 PM today. 2 attendees → 1:1 type confirmed.
2. **File:** `Meetings/1-1s/sarah-chen.md` exists. Last session: 2026-03-28. Appends `## 2026-04-06 Session` and `### Prep`.
3. **Reads:** Sarah's person file, shared project files (auth-migration, platform-api), last session's prep, contributions log.
4. **Generates prep:**

```markdown
### Prep

- [ ] **Follow-through:** You completed 2/3 action items. Still open: "Send Sarah the updated API spec" (from Mar 28)
- [ ] **Carry-forward:** Discuss caching strategy (unchecked from last session)
- [ ] **Recent work:** Sarah closed 4 tasks on auth-migration since Mar 28, including the token refresh fix
- [ ] **Pending feedback:** Strong incident response on March 30 outage
  _Coaching: Open with the specific actions she took before discussing the growth area on documentation._
- [ ] **Career development:** Growth area "technical writing" — no observations logged in 6 weeks. Last career conversation: Feb 15.
- [ ] **Action item:** API spec review — due Friday, assigned to you. Discuss status.
- [ ] **Blocker:** Auth migration blocked on infrastructure team's VPN changes (from timeline, Apr 2)
- [ ] **Personal:** Training for a marathon — asked about it last time
```

5. **Output:** "Prepped 1:1 with Sarah (2:00 PM). 8 items — 1 carry-forward, 1 missed action item from you, 1 pending feedback."

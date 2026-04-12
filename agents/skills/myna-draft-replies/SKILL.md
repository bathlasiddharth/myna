---
name: myna-draft-replies
description: Process the DraftReplies email folder — reads emails the user forwarded with drafting instructions, creates reply drafts and follow-up meeting drafts in the vault. Only reads the DraftReplies folder. Does not process other email folders.
user-invocable: true
argument-hint: '"process my draft replies", "any draft requests?", "check my drafts folder"'
---

# myna-draft-replies

Process the `DraftReplies` email folder. This is a dedicated workflow: the user forwards emails into `DraftReplies` with instructions about what to draft, and this skill converts them into draft files in `Drafts/`.

**This skill reads ONLY the folder configured as `triage.draft_replies_folder` in projects.yaml** (default: `DraftReplies`). It never reads other project email folders, the inbox, or any other folder.

All drafts are for user review — never sent automatically.

---

## How the DraftReplies Workflow Works

The user forwards an email (or replies to an email thread) into the `DraftReplies` folder, optionally including instructions in their forwarded message:

- "Decline politely, keep the door open for Q4"
- "Reply agreeing to the timeline, note that we need the cert rotation done first"
- "Draft recognition for Sarah's incident handling"
- "Create follow-up meeting invite — include Sarah and Alex, discuss cache decision next steps"

The original thread provides context. The user's message (the forward/reply body) provides instructions. This skill reads both and creates the appropriate draft.

---

## Processing Flow

1. Read all emails from the `DraftReplies` folder (via email MCP)
2. For each email, identify:
   - **The original thread** — the email(s) being forwarded (context)
   - **The user's instructions** — what to draft (from the user's reply/forward body)
3. Create the appropriate draft(s)
4. Move the processed email to `{draft_replies_folder}/Processed/`

Process emails one at a time. For each:

### Identify the draft type

**Email reply draft** (default — most forwards are reply requests):
- Instructions about tone, content, or intent ("decline", "accept", "escalate", "praise", "follow up")
- Or no instructions — in which case, draft a reply addressing open questions in the thread using the audience's tier defaults

**Follow-up meeting draft:**
- Instructions containing "meeting invite", "schedule a meeting", "follow-up meeting", "set up a call", "create an invite"
- Route to Follow-Up Meeting Draft procedure below

**Multiple drafts in one request:**
When instructions explicitly ask for two things ("draft a reply AND create a follow-up meeting"), create both drafts separately.

---

## Email Reply Drafts

### What to read

Read the full original thread before drafting. The thread is the context — who said what, what decisions are pending, what questions are outstanding.

Also read:
- `People/{person}.md` for the sender's audience tier and any communication preferences
- `communication-style.yaml` for your style and preset per audience tier
- `Projects/{project}.md` if the email relates to a project (for context on timeline and blockers)

### How to draft

The user's instructions take absolute priority. If they say "be terse", be terse. If they say "BLUF", use BLUF. If they say "keep the door open", do that.

When no instructions are provided: use the sender's audience tier from people.yaml to select the preset from communication-style.yaml. Apply BLUF for upward/executive audience. Use the configured `sign_off`.

Address all open questions and requests in the thread unless the user's instructions say otherwise.

### Draft file

Write to `Drafts/[Email] Reply to {sender name} — {topic}.md`

Frontmatter:
```yaml
---
type: email-reply
audience_tier: {from people.yaml — upward | peer | direct | cross-team}
related_project: {project name or null}
related_person: {sender name}
created: {YYYY-MM-DD}
status: draft
---
```

After the draft content, append:
```
---
*Source: Email from {sender}, {date} — "{subject line}"*
```

### Linked TODO

Create a tracking task in the sender's related project file (or the daily note if no project):
```
- [ ] Review and send reply to {sender first name} re: {topic} 📅 {today+1} [type:: task] [Auto] (capture, {YYYY-MM-DD})
```

### Multiple intents

When the user's instructions contain multiple asks ("draft a reply praising the incident handling AND draft an escalation to her manager"):
- Create one draft per intent
- Use distinct filenames: `[Email] Reply to Sarah — incident praise.md`, `[Email] Escalation to Sarah's manager — timeline.md`
- Create one TODO per draft

---

## Follow-Up Meeting Draft

When the user's DraftReplies instructions request a meeting invite (see "Identify the draft type" above):

Read:
- The original email thread (context for meeting purpose)
- `People/*.md` for the proposed attendees
- Calendar MCP for attendee availability if available

Write the draft to `Drafts/[Meeting] Follow-up — {topic}.md`

Frontmatter:
```yaml
---
type: meeting-invite
related_project: {project name or null}
created: {YYYY-MM-DD}
status: draft
---
```

Content:
```markdown
## Proposed Meeting: {topic}

**Suggested Attendees:** {names}
**Purpose:** {why this meeting needs to happen}
**Suggested Agenda:**
- {agenda item 1}
- {agenda item 2}
- {agenda item 3}

**Proposed Time:** {suggestion based on availability, or "TBD — check calendars"}

**Context:**
{brief summary of what led to this meeting request}
```

Create a tracking TODO:
```
- [ ] Send follow-up meeting invite for {topic} — draft in [[Drafts/[Meeting] Follow-up — {topic}]] 📅 {today+1} [type:: task] [Auto] (capture, {YYYY-MM-DD})
```

**Myna never creates calendar events with attendees.** This draft is for the user to use when manually creating the invite in their calendar app.

---

## After Processing

Move each processed email to `{draft_replies_folder}/Processed/` (e.g., `DraftReplies/Processed/`).

Output:
```
✅ Processed {N} draft requests.
  Created: {list of draft files}
  TODOs: {N} review tasks created

Say "review my queue" if any items need clarification.
```

Include Obsidian URI and disk path for each created draft file.

---

## Edge Cases

**No instructions in the forward:** Draft a reply addressing the thread's open questions and requests. Use the sender's audience tier as the style guide. Show the draft inline before saving, asking: "No instructions found — is this the right direction?"

**Can't identify the sender's audience tier:** Check people.yaml for the sender by email address. If not found, default to `peer` tier. Note in output: "Sender not in people.yaml — used peer preset. Update people.yaml to customize."

**Calendar MCP unavailable for meeting draft:** Skip availability check. Write "TBD — check calendars" for proposed time.

**Multiple emails in DraftReplies:** Process them all in one run. Present a summary at the end.

**Email can't be matched to a project:** Write to `Drafts/` without a project link. Note in the TODO that project association is unclear.

**DraftReplies folder empty:** Output: "DraftReplies folder is empty."

---

## Worked Examples

### Example 1: Email reply with instructions

**Setup:** Sarah forwarded to DraftReplies with note: "Decline politely, keep door open for Q4"
Original thread: vendor proposing a partnership integration for Q2

1. Read original thread: vendor email proposing timeline, asking for commitment
2. Read `People/sarah-chen.md`: audience tier = direct (wrong — this is actually a vendor situation, use cross-team)
   - Actually: vendor is not in people.yaml → default to cross-team tier
   - communication-style.yaml preset for cross-team: diplomatic
3. Draft: diplomatic decline, acknowledges the value, explains current bandwidth, suggests Q4 revisit
4. Write to `Drafts/[Email] Reply to vendor — partnership proposal.md`
5. Create TODO: "Review and send reply to vendor re: partnership proposal"
6. Move email to `DraftReplies/Processed/`

Output: "Processed 1 draft request. Draft: [Email] Reply to vendor — partnership proposal.md"

### Example 2: Follow-up meeting request

**Setup:** User replied to a thread about cache architecture decision, added note: "create follow-up meeting invite — include Sarah and Alex, discuss Option B decision and next steps"
Original thread: design discussion, Option B tentatively chosen

1. Detect: meeting invite request
2. Read thread: attendees mentioned are Sarah and Alex
3. Read `People/sarah-chen.md`, `People/alex-kumar.md` for context
4. Check calendar MCP for Sarah + Alex availability: finds Tuesday 2pm open for all
5. Write `Drafts/[Meeting] Follow-up — cache architecture decision.md` with agenda
6. Create TODO: "Send follow-up meeting invite for cache architecture decision"
7. Move email to `DraftReplies/Processed/`

Output: "Processed 1 draft request. Meeting draft created: [Meeting] Follow-up — cache architecture decision.md. Tuesday 2pm proposed based on availability."

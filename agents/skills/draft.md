# Draft

## Purpose

Produce polished professional writing — email replies, follow-ups, status updates, escalations, recognition messages, conversation prep, monthly reports, and message rewrites.

## Triggers

- "draft reply to [person/thread]" — email reply
- "draft follow-up email for [meeting]" — meeting follow-up
- "draft follow-up meeting invite" — meeting invite draft
- "status update for [project]" — structured status draft
- "escalate [blocker/issue]" — escalation draft
- "draft recognition for [person]" — recognition message
- "help me say no to [request]" — diplomatic decline
- "help me prepare for [conversation]" — difficult conversation prep
- "fix this message" / "rewrite this for [audience]" — message rewriting
- "monthly update" / "draft my MBR" — monthly/quarterly report

## Inputs

- `_system/config/communication-style.yaml` — tone, presets per tier, sign-off, message preferences
- `_system/config/people.yaml` — audience tier (`relationship_tier`), display names, aliases
- `_system/config/projects.yaml` — project names, aliases
- `People/` files — recent contributions, observations, recognition entries, communication preferences
- `Projects/` files — timeline, open tasks, blockers, decisions
- `Meetings/` files — prep, notes, action items, decisions from recent sessions
- `Journal/contributions-{week}.md` — contribution entries for self-review and monthly updates
- Email MCP — thread content when drafting replies or follow-ups

## Procedure

### 1. Determine Draft Type and Audience

Identify the draft type from the user's request: email-reply, follow-up, meeting-invite, status-update, escalation, recognition, say-no, conversation-prep, rewrite, or monthly-update.

Resolve the audience. Look up the person or recipient in `people.yaml` to get their `relationship_tier` (upward, peer, direct, cross-team). If the person isn't in config, ask the user for the audience tier. The tier drives tone via `presets_per_tier` in `communication-style.yaml`. If `communication-style.yaml` is missing or incomplete, fall back to the `professional` preset.

### 2. Email Draft Reply (conversation trigger)

Read the email thread via email MCP. Address all open questions and requests in the thread. Use the sender's audience tier for tone. Default to BLUF structure (lead with the answer or ask, then context) — but use judgment: skip BLUF for casual conversational replies where it would feel stiff.

When the user provides instructions (rough points, intent, tone override), follow them. When no instructions are given, draft a default reply addressing the thread's open items.

Multiple intents in one request produce multiple separate drafts. "Draft a reply praising Sarah AND an escalation to her manager" creates two files.

Show the draft inline. Save to `Drafts/[Email] Reply to {person}.md` when the user says "save" or asks to save.

### 3. Follow-Up Email

Read the meeting file for the referenced meeting (`Meetings/1-1s/`, `Meetings/Recurring/`, or `Meetings/Adhoc/`). Extract: discussion summary, decisions made, action items with owners, next steps.

Generate an email draft covering all of the above. Use communication style for the audience tier of the meeting attendees.

Save to `Drafts/[Email] Follow-up {meeting name}.md` when asked.

### 4. Follow-Up Meeting Draft

When the user asks to draft a follow-up meeting invite (e.g., after a conversation that needs continuation), generate a meeting invite draft with: purpose, agenda items, suggested attendees, context from the source meeting or conversation.

Save to `Drafts/[Meeting] Follow-up {topic}.md` when asked.

### 5. Message Rewriting

Three modes, determined from the user's request. Default is **rewrite** if unspecified.

- **Fix:** Grammar and spelling only. Preserve the user's structure, wording, and voice. Do NOT restructure or apply BLUF.
- **Tone:** Keep the user's content and structure but adjust tone for the target audience. Apply BLUF where appropriate. The message stays recognizably theirs.
- **Rewrite:** Treat input as rough notes — bullet points, fragments, half-formed thoughts. Full restructure into a polished message. Apply BLUF where appropriate.

Channel-specific adjustment: Slack messages are shorter and more casual. Emails are more structured. Determine from context or user's explicit statement.

Show the rewritten message inline.

### 6. Structured Draft — Status Update

Read the project file: `Projects/{project}.md` — open tasks, recent timeline entries, blockers, decisions. Generate a status update in progress / blockers / next steps format.

**Audience-adaptive depth:**
- Upward (VP, exec): concise 3-5 bullet executive summary with BLUF
- Peer / cross-team: moderate detail with key items
- Direct / team: detailed with task-level breakdown

The audience tier sets the default depth; the user can override ("make it shorter", "more detail").

Show inline. Save to `Drafts/[Status] {project} {month}.md` when asked.

### 7. Structured Draft — Escalation

Draft a professional escalation: issue description, impact, what's been tried, specific ask.

When the user says "escalate this blocker", pull context from the project file's blocker callouts and timeline. Flag long-standing blockers (items that have been in the timeline for an extended period without resolution).

Save to `Drafts/[Escalation] {topic}.md` when asked.

### 8. Recognition Draft

Read the person file (`People/{person}.md`): recent contributions, observations, recognition entries. Generate a specific, evidence-grounded message — not generic praise.

When the user requests multiple formats, produce each adapted for its channel:
- Team channel post (brief, celebratory)
- Manager note (specific with examples)
- Peer shoutout (casual, warm)
- All-hands mention (concise, impact-focused)

Show inline. Save to `Drafts/[Recognition] {person}.md` when asked.

### 9. Help Me Say No

Draft a diplomatic decline: acknowledge the request, explain constraints without over-apologizing, suggest an alternative or path forward when possible. Use communication style for the audience tier.

Show inline.

### 10. Difficult Conversation Prep

Generate a prep guide with these sections:
- **Suggested opening** — how to start the conversation
- **Key points to cover** — prioritized list
- **Things to avoid saying** — specific phrasing pitfalls
- **How to close constructively** — end on a productive note

Flag if the conversation likely requires follow-up documentation (e.g., performance concerns, PIP discussions).

Tone calibrated to `difficult_message_approach` from `communication-style.yaml`.

Show inline. Save to `Drafts/[Conversation-Prep] {topic}.md` when asked.

### 11. Monthly Update Generation (MBR/MTR/QBR)

Read across the relevant time period (month or quarter):
- `Projects/` files — timeline entries, completed tasks, blockers resolved
- `Journal/contributions-{week}.md` — contribution entries for the period
- `Meetings/` files — key decisions from the period

Generate a report covering: accomplishments, key decisions, risks and blockers, metrics or milestones hit, next period priorities.

Format is audience-adaptive: executive audience gets a BLUF summary; team audience gets detail.

Show inline and save to `Drafts/[Status] {report-type} {period}.md` (e.g., `[Status] MBR April.md`). Monthly updates are always saved because they aggregate significant data that the user will iterate on.

## Output

**File paths:** `Drafts/[{Type}] {topic}.md` — types are Email, Meeting, Status, Escalation, Recognition, Self, Say-No, Conversation-Prep.

**Draft file format:**
```markdown
---
type: {email-reply | follow-up | status-update | escalation | recognition | meeting-invite | say-no | conversation-prep | monthly-update}
audience_tier: {upward | peer | direct | cross-team}
related_project: {project-name or null}
related_person: {person-name or null}
created: {YYYY-MM-DD}
---

#draft #{type}

{draft content}

---
*Source: {what prompted this draft}*
```

**Inline output:** Most drafts are shown inline first. Tell the user "Say 'save' to write to Drafts/" after showing the draft.

**User summary:** After saving, confirm: "Draft saved to Drafts/[Type] {topic}.md."

## Rules

- **Check `features.monthly_updates`** before generating MBR/MTR/QBR reports. If disabled, inform the user and stop.
- **BLUF is contextual, not automatic.** Use BLUF for structured professional communications — status updates, escalations, emails to leadership, tone rewrites, full rewrites. Do NOT force BLUF on casual Slack messages, recognition notes, fix-mode rewrites, or conversational replies where it would feel stiff.
- **Drafts are just files.** Save to `Drafts/` with type-prefixed filenames. No lifecycle state tracking. User deletes the file when done.
- **Draft, never send.** All output is draft content for the user to review, copy, and send manually.
- **Fuzzy name resolution.** Match person and project names against `people.yaml` (aliases, display_name, full_name) and `projects.yaml` (aliases, name). If ambiguous, ask — never guess between two people or projects.
- **Communication style fallback.** If `communication-style.yaml` is missing: use professional preset. If a tier-specific preset is missing: use `default_preset`.
- **Email MCP unavailable.** If no email MCP is configured and the user asks to draft a reply to an email, ask them to paste the thread content. Draft from pasted content.
- **Multiple drafts from one request.** When the user's request contains multiple distinct intents (reply + escalation, recognition in multiple formats), create separate draft files for each.

## Examples

### Email Reply

User: "draft reply to Sarah's email about the API timeline"

Reads Sarah's email thread via email MCP. Sarah (relationship_tier: direct) → coaching preset. Thread shows Sarah asking about revised timeline and flagging a dependency risk.

Draft inline:
> Hi Sarah,
>
> The revised timeline is two weeks from today — April 20. I've confirmed with the infrastructure team that the dependency on the caching layer will be resolved by April 15, which gives us a buffer.
>
> For the risk you flagged on the third-party integration: let's discuss in our 1:1 Thursday. I have some thoughts on a fallback approach.
>
> Best,
> {user.name}

"Say 'save' to write to Drafts/."

User says "save" → writes `Drafts/[Email] Reply to Sarah.md` with frontmatter (type: email-reply, audience_tier: direct, related_person: sarah-chen).

"Draft saved to Drafts/[Email] Reply to Sarah.md."

### Status Update for VP

User: "status update for auth migration for my VP"

Reads `Projects/auth-migration.md` — 3 completed tasks this week, 1 active blocker (third-party cert delay), next milestone April 20. VP is upward tier → executive preset, BLUF.

Draft inline:
> **Bottom line:** Auth migration is on track for April 20 launch. One risk: third-party cert delay (mitigated with fallback plan).
>
> **Progress:**
> - OAuth provider integration complete and tested
> - User migration script validated against staging (12k accounts, zero errors)
> - Rollback procedure documented and reviewed
>
> **Risk:** Certificate provisioning from vendor delayed 5 days. Fallback: temporary self-signed cert for internal services. No impact on external-facing auth.
>
> **Next steps:** Load testing this week, go/no-go decision April 18.

### Message Rewrite (Fix mode)

User: "fix this: i think we should move the meeting to thursday since sarah cant make it wensday and we need her input on the caching desgin"

Output (grammar and spelling corrected, structure preserved):
> I think we should move the meeting to Thursday since Sarah can't make it Wednesday and we need her input on the caching design.

### Monthly Update

User: "draft my MBR for March"

Reads all project files (timeline entries from March), `Journal/contributions-{week}.md` for March weeks, meeting files with March decisions. Compiles into MBR covering accomplishments, decisions, risks, next month priorities. Saves to `Drafts/[Status] MBR March.md`.

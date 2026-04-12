---
name: myna-draft
description: Generate professional written content from vault context — email replies (conversation path), follow-up meeting emails, status updates, escalations, recognition messages, decline messages, difficult conversation prep, and monthly updates (MBR/MTR/QBR). Does NOT rewrite existing messages (use myna-rewrite for that).
user-invocable: true
argument-hint: "draft reply to [person/thread] | follow-up for [meeting] | status update for [project] | recognition for [person] | help me say no to [request] | prep for [conversation] | monthly update"
---

# myna-draft

Generates polished professional writing from vault context. You write to `Drafts/`, the user manually copies and sends outside Myna. Never send.

## 📋 Before You Start

Read at session start:
- `_system/config/workspace.yaml` — user identity, feature toggles
- `_system/config/communication-style.yaml` — tone presets, sign-off, style preferences
- `_system/config/projects.yaml` — project aliases
- `_system/config/people.yaml` — relationship tiers, aliases

Check feature toggles. If `self_tracking` is disabled, skip contribution cross-reference in self-review content. If `email_processing` is disabled, skip email thread reading.

## ✍️ Draft Modes

Determine which mode applies from the user's request:

| User says | Mode |
|-----------|------|
| "draft reply to James", "reply to this thread" | Email Reply |
| "draft follow-up for [meeting]", "recap email after [meeting]" | Follow-Up Email |
| "status update for [project]", "escalate this blocker" | Structured Draft |
| "recognition for Sarah", "draft a shoutout for Alex" | Recognition Draft |
| "help me say no to [request]" | Decline |
| "prep for [conversation]", "help me prepare for [discussion]" | Conversation Prep |
| "monthly update", "draft my MBR", "draft my QBR" | Monthly Update |

When mode is ambiguous, show the options and ask.

---

## 📧 Email Reply (Conversation Path)

**Trigger:** User says "draft reply to [person/thread]" or pastes/describes an email.

**How:**
1. Read the full email thread via email MCP if available. If no MCP or thread not found, use what the user provided.
2. Read the sender's person file at `People/{person-slug}.md` — get relationship tier and communication preferences.
3. Determine audience tier from people.yaml (`upward`, `peer`, `direct`, `cross-team`).
4. Read `communication-style.yaml` — apply the preset for that audience tier.
5. Write the reply: BLUF structure (bottom line first, then context). Address all open questions and requests in the thread.
6. Show inline first. Save to `Drafts/[Email] Reply to {person}.md` only if user asks.
7. Create a linked TODO: `- [ ] Review and send reply to {person} about {topic} 📅 {today} [type:: task]`

**No instructions provided:** If the user just names a thread without guidance, draft a reply that addresses all open questions in the thread using the sender's audience tier preset.

**Multiple intents in one request:** "reply to Sarah praising the incident handling AND escalate to her manager" → create two separate drafts, inform user.

**Draft frontmatter:**
```
---
type: email-reply
audience_tier: {tier}
related_person: {person-slug}
created: {YYYY-MM-DD}
---
```

**Worked example:**

User: "Draft reply to James about the API timeline."

1. Read thread from email MCP (or user pasted it).
2. Read `People/james-wright.md` — tier: peer.
3. communication-style.yaml: peer preset = conversational.
4. Draft:

```
Subject: Re: API timeline

James — we're on track for the March 15 cutover. The auth service integration finishes this Friday; staging deploy follows next Wednesday.

One open question from your last message: do you need the migration runbook before or after staging? Let me know and I'll adjust the timeline accordingly.

Best,
{user.name}
```

5. Show inline, offer to save.

---

## 📬 Follow-Up Email

**Trigger:** "Draft follow-up email for [meeting]", "recap the [meeting]"

**How:**
1. Read the meeting file at `Meetings/{type}/{meeting-slug}.md` — extract Action Items, Decisions, Discussion notes.
2. Determine audience from meeting attendees — use the highest-authority tier in the group.
3. Write the follow-up: BLUF (key outcome), decisions made, action items with owners and due dates, next steps.
4. Show inline. Save to `Drafts/[Meeting] Follow-up {meeting}.md` if user asks.
5. Create a TODO: `- [ ] Review and send follow-up for {meeting} [type:: task] 📅 {today}`

**Draft frontmatter:**
```
---
type: follow-up
audience_tier: {tier}
related_project: {project-slug or null}
created: {YYYY-MM-DD}
---
```

**Worked example:**

User: "Draft follow-up email for today's auth migration sync."

Meeting file has: Decision — go with Option B (caching layer), Action items: Sarah to submit API spec by Friday, Alex to set up staging environment by next Monday.

Draft:
```
Subject: Auth migration sync — decisions and next steps

Quick recap from today's session.

**Decision:** We're going with Option B (caching layer). See [[auth-migration]] for the rationale.

**Action items:**
- Sarah: Submit API spec — by Friday, April 11
- Alex: Set up staging environment — by Monday, April 14

Next sync: [date as scheduled]. Reach out if anything changes before then.

{user.name}
```

---

## 📊 Structured Draft

**Trigger:** "Status update for [project]", "escalate this blocker on [project]", "write a status update for my VP"

Two modes:

### Status Update

1. Read project file `Projects/{project-slug}.md` — extract: current status, recent timeline entries (last 5-7), open blockers (callout blocks), open tasks.
2. Determine audience from user's request. If unspecified, default to peer tier.
3. **Audience-adaptive depth:**
   - Upward/VP: 3-5 bullet executive summary — bottom line, key progress, top risk, next milestone. No task-level detail.
   - Peer/team: full detail — task breakdown, blocker status, dependency status, upcoming milestones.
4. Apply BLUF: lead with the bottom line (green/yellow/red status), then progress, then blockers, then next steps.
5. Show inline. Save to `Drafts/[Status] {project} {month}.md` if user asks.

### Escalation

1. Read project file — identify the specific blocker (from Blocker callout block or user description).
2. Write escalation: issue (what's blocked and since when), impact (what it blocks downstream), what's been tried, specific ask (what you need and by when).
3. Audience-adaptive: upward escalations are concise with clear ask. Peer escalations can include more context.
4. Show inline. Save to `Drafts/[Escalation] {topic}.md` if user asks.

**Status Update frontmatter:**
```
---
type: status-update
audience_tier: {tier}
related_project: {project-slug}
created: {YYYY-MM-DD}
---
```

**Worked example — status update for VP:**

User: "Write a status update for the auth migration for my VP."

Read auth-migration.md. Recent: Option B decision, API spec submitted, staging setup in progress. Blocker: Platform API dependency.

Draft:
```
Auth Migration — Status: 🟡 On Track with Risk

**Bottom line:** Migration on track for April 30 target. One external dependency (Platform API) is at risk.

**Progress:**
- Architecture decision finalized (Option B — caching layer)
- API spec submitted; staging setup in progress

**Risk:** Platform API integration blocked on Platform team deliverable, originally due April 3. Now 9 days overdue. Following up this week.

**Next milestone:** Staging deploy — April 14

```

---

## 🏆 Recognition Draft

**Trigger:** "Draft recognition for Sarah", "write a shoutout for Alex"

**How:**
1. Read `People/{person-slug}.md` — pull recent Recognition and Observations entries (last 30-60 days).
2. Identify 1-2 specific, concrete examples — not generic praise.
3. Generate up to four formats based on what the user asks for (or all four if unspecified):
   - **Team channel post:** Shorter, celebratory, names the specific win
   - **Manager note:** More formal, outcome-focused, suitable for upward communication
   - **Peer shoutout:** Casual, specific, written as a peer
   - **All-hands mention:** Brief, high-impact, one sentence
4. Show all formats inline. Save to `Drafts/[Recognition] {person}.md` if user asks.
5. If no recognition/observation entries exist in person file, say so and ask the user to describe what they want to recognize.

**Draft frontmatter:**
```
---
type: recognition
audience_tier: varies
related_person: {person-slug}
created: {YYYY-MM-DD}
---
```

**Worked example:**

User: "Draft recognition for Sarah."

People/sarah-chen.md has: Recognition entry — "Led the incident response for the auth outage, resolved within 45 minutes despite on-call being understaffed."

Team channel post:
```
Shoutout to Sarah for her incident response work last week. Auth outage came in on a Friday evening with half the on-call team out — she owned it, diagnosed the root cause, and had us back up in 45 minutes. That's the kind of ownership that makes the difference.
```

Manager note:
```
Sarah demonstrated strong ownership and technical leadership during the April 5 auth service outage. Despite being understaffed on-call, she managed the full incident response — diagnosis, coordination, and resolution — within 45 minutes. Outcome: zero SLA breach, minimal customer impact. Worth recognizing formally.
```

---

## 🚫 Help Me Say No

**Trigger:** "Help me say no to [request]", "decline [request] diplomatically"

**How:**
1. Understand the request from the user's description.
2. Determine the relationship tier (ask if not obvious from context).
3. Write a decline that: acknowledges the request specifically, explains the constraint without over-apologizing, and offers an alternative or path forward when plausible.
4. Apply the communication style preset for the relationship tier.
5. Show inline. No automatic save.

**Rules:**
- Don't fabricate reasons. Use what the user tells you, or keep it vague.
- Don't over-apologize. One acknowledgment is enough.
- Always offer something: an alternative, a timeline, or a referral.

**Worked example:**

User: "Help me say no to Marcus's request that I take on the API docs review this sprint."

Audience tier: peer. Preset: conversational.

```
Marcus — I can't take on the API docs review this sprint; I'm already at capacity with the auth migration cutover and the Q2 planning work.

A couple of options: Alex has context on the API layer and might be able to do a lighter pass, or we could push it to next sprint when auth migration wraps. Let me know what works best.
```

---

## 💬 Difficult Conversation Prep

**Trigger:** "Help me prepare for [conversation]", "prep me for my conversation with [person] about [topic]"

**How:**
1. Understand the situation from the user's description.
2. Read `_system/config/communication-style.yaml` — `difficult_message_approach` field (default: direct-but-kind).
3. Read the person's file if they're named — get relationship tier and any relevant communication preferences.
4. Generate prep guide with four sections:
   - **Suggested opening** — how to start. Sets the tone without being accusatory.
   - **Key points to cover** — 3-5 specific points, prioritized. Most important first.
   - **Things to avoid saying** — 2-3 phrases or framings that typically backfire in this type of conversation.
   - **How to close constructively** — clear next step, mutual agreement on what happens next.
5. Flag if follow-up documentation is likely needed (e.g., performance conversations → "Consider documenting the key points and agreements after this conversation for your own record.").
6. Show inline. Offer to save as a note.

**Worked example:**

User: "Prep me for a conversation with Alex about repeatedly missing sprint commitments."

```
## Conversation Prep — Alex / Sprint Commitments

**Suggested opening:**
"I wanted to check in about how the last few sprints have gone — I've noticed a pattern I want to talk through with you."

**Key points to cover:**
1. Name the specific pattern: commitments not completed in 3 of the last 4 sprints. Be specific, not general.
2. Ask first — what's been getting in the way? Don't assume.
3. Establish what "completion" means so you're aligned going forward.
4. Agree on a concrete check-in for the next sprint — make the expectation explicit.

**Things to avoid:**
- "You always..." or "You never..." — generalizations trigger defensiveness.
- Comparing Alex to other engineers.
- Treating the conversation as a verdict. This is a discussion, not a performance review.

**How to close:**
"So the plan is: [specific agreement]. I'll check in with you mid-sprint on [date]. Does that work?"

⚠️ Consider writing a brief note after this conversation with the agreements made — useful if this becomes a longer-term performance issue.
```

---

## 📅 Monthly Update

**Trigger:** "Monthly update", "draft my MBR", "draft my MTR", "draft my QBR"

**How:**
1. Determine type: MBR (Monthly Business Review), MTR (Monthly Tech Review), or QBR (Quarterly Business Review). Ask if unclear.
2. Read all project files in `Projects/` — extract timeline entries from the past month (or past quarter for QBR).
3. Read `Journal/contributions-{week}.md` files for the relevant period.
4. Compile: progress per project, key decisions, blockers resolved vs outstanding, contribution highlights.
5. For QBR: add month-over-month trend analysis — what's improved, what's persisted, what's new.
6. Audience: ask user for audience (self, leadership, team) and apply appropriate depth.
7. Save to `Drafts/[Status] {type} {YYYY-MM}.md`. Show inline.

**Draft frontmatter:**
```
---
type: monthly-update
audience_tier: {tier}
created: {YYYY-MM-DD}
---
```

---

## 💾 Saving Drafts

Default: show inline, offer to save.

When saving:
- Create `Drafts/[{Type}] {topic}.md` with frontmatter.
- Include: `*Source: {what prompted this draft}*` at the bottom.
- Create a linked TODO in the appropriate project file or daily note:
  `- [ ] Review and send {draft name} 📅 {today} [type:: task] [project:: {project or null}]`
- Show the Obsidian URI and full disk path.

**Draft file types (prefix):**
- `[Email]` — email replies, follow-up emails
- `[Status]` — status updates, monthly updates
- `[Escalation]` — escalation messages
- `[Recognition]` — recognition messages
- `[Say-No]` — decline messages
- `[Conversation-Prep]` — prep guides

---

## ⚠️ Edge Cases

**No thread found:** If email MCP is unavailable or thread can't be found, tell the user and proceed with whatever they provided.

**No person file:** Proceed without person-specific preferences — use the default communication style for the stated relationship tier.

**No project data:** For status updates, if the project file has no recent timeline entries, say so and ask the user to describe current status. Don't fabricate project data.

**No recognition data:** If there's nothing in the person file to ground the recognition in, tell the user and ask them to describe what they want to recognize.

**Feature toggle — self_tracking disabled:** Skip contribution references in monthly updates and structured drafts.

# Draft Replies

## Purpose

Process a configured email folder where the user has forwarded emails with drafting instructions. For each email: separate the user's instructions from the original thread, generate the requested draft, and save it to the vault.

## Triggers

- "process my draft replies"
- "any draft requests?"
- "check my drafts folder"

## Inputs

- Email MCP — reads emails from the `draft_replies_folder` configured in `projects.yaml`
- `_system/config/projects.yaml` — `triage.draft_replies_folder` field (e.g., "DraftReplies")
- `_system/config/communication-style.yaml` — tone, presets per tier, sign-off
- `_system/config/people.yaml` — audience tier for recipients, display names, aliases
- `Projects/` files — project context when drafts relate to a project
- `People/` files — communication preferences, relationship context

## Procedure

### 1. Read the DraftReplies Folder

Read the `draft_replies_folder` field from `projects.yaml` (located under the `triage` key). If not configured, tell the user: "No DraftReplies folder configured. Add `draft_replies_folder` under `triage` in projects.yaml."

Fetch all emails in that folder via email MCP. Skip the `Processed/` subfolder within it.

If the folder is empty, report: "No draft requests found in DraftReplies."

### 2. Process Each Email

For each email in the folder:

**Separate instruction from thread.** The email has two parts:
- The user's message (addressed to their drafting alias, e.g., `sid+drafts@company.com`) — this is the drafting instruction. It appears at the top of the email body.
- The original thread below — forwarded or quoted content. This is the source context to draft against.

The instruction contains the user's intent: what to draft (reply, decline, meeting invite, follow-up), rough points, tone, audience, what to cover.

**Determine draft type** from the instruction:
- Reply or response → email reply draft
- Decline, say no → diplomatic decline
- Meeting invite, schedule follow-up → follow-up meeting draft
- No clear type → default to email reply

**Resolve the audience.** Look up the original sender or intended recipient in `people.yaml` to get their `relationship_tier`. Use this to select the communication style preset. If the person isn't in config, infer tier from context (e.g., "my VP" → upward) or default to peer.

### 3. Generate and Save the Draft

Generate the draft using the instruction as guidance and the original thread as context. Apply communication style based on audience tier.

When no instruction is provided (email forwarded without notes), create a default draft addressing open questions in the thread, using the audience tier for tone.

Save to `Drafts/[Email] Reply to {recipient}.md` (or `[Meeting] Follow-up {topic}.md` for meeting invites). Use the draft file format:

```markdown
---
type: {email-reply | say-no | meeting-invite}
audience_tier: {upward | peer | direct | cross-team}
related_project: {project-name or null}
related_person: {person-name or null}
created: {YYYY-MM-DD}
---

#draft #{type}

{draft content}

---
*Source: forwarded email from DraftReplies folder*
```

### 3b. Create Review TODO

After saving each draft, create a linked review TODO so the user is reminded to review and send it. Append to today's daily note:
```
- [ ] Review and send [Email] Reply to {recipient} [type:: review-draft] [User]
```
If the draft is a meeting invite rather than an email reply, use: `- [ ] Review and send [Meeting] Follow-up {topic} [type:: review-draft] [User]`

### 4. Move Processed Emails

After successfully generating the draft, move the processed email to `{draft_replies_folder}/Processed/` via email MCP.

### 5. Report

After processing all emails, summarize: "{N} draft(s) created from DraftReplies. Files: [list of draft filenames]."

## Output

**Files created:** `Drafts/[{Type}] {topic}.md` for each processed email.

**Emails moved:** Processed emails moved to `{draft_replies_folder}/Processed/`.

**User summary:** Count of drafts created, list of filenames, and a reminder to review them.

## Rules

- **Instruction is the user's message; thread is context.** Never confuse the two. The instruction tells you WHAT to draft. The thread tells you ABOUT WHAT.
- **Draft, never send.** All output is draft files. The user reviews, copies, and sends manually.
- **Fuzzy name resolution.** Match person names against `people.yaml` (aliases, display_name, full_name). If ambiguous, use the name as it appears in the email.
- **Communication style fallback.** If `communication-style.yaml` is missing, use professional preset. If a tier-specific preset is missing, use `default_preset`.
- **One email = one draft** in most cases. If the user's instruction requests multiple outputs ("reply to Sarah AND escalate to her manager"), create separate draft files for each.
- **No folder configured = skill unavailable.** If `draft_replies_folder` is not set in projects.yaml, tell the user and stop.
- **The process skill skips DraftReplies.** This folder is exclusively handled by this skill — no overlap.

## Example

User: "process my draft replies"

Reads `projects.yaml` → `draft_replies_folder: DraftReplies`. Fetches 2 emails from DraftReplies via email MCP.

**Email 1:** User forwarded a vendor proposal with note: "say no, we're committed to current vendor through Q3, keep the door open for Q4."

- Instruction: decline, keep door open for Q4
- Thread: vendor proposal for analytics platform, 3-year contract, pricing details
- Vendor contact not in people.yaml → default to cross-team tier → diplomatic preset

Generates diplomatic decline → saves to `Drafts/[Email] Reply to vendor.md`:
> Hi [Vendor],
>
> Thank you for the detailed proposal. We've reviewed it carefully, and the platform looks strong.
>
> We're committed to our current analytics vendor through Q3, so we're not in a position to move forward right now. That said, we'd welcome revisiting this in Q4 when our contract is up for renewal.
>
> I'll reach out then to reconnect. Thanks again for putting this together.
>
> Best,
> {user.name}

Moves email to `DraftReplies/Processed/`.

**Email 2:** User forwarded a thread from Sarah about scheduling a design review with note: "set up a follow-up meeting, include Alex too."

- Instruction: follow-up meeting draft, include Alex
- Thread: Sarah's email about the caching design needing a group review
- Sarah is direct tier, Alex is peer tier

Generates meeting invite draft → saves to `Drafts/[Meeting] Follow-up caching design review.md`:
> **Meeting:** Caching Design Review Follow-up
> **Suggested attendees:** Sarah Chen, Alex Kumar, {user.name}
> **Agenda:**
> 1. Review Sarah's caching proposal (shared in original thread)
> 2. Discuss trade-offs: in-memory vs Redis (per Sarah's analysis)
> 3. Decide on approach and assign implementation tasks
>
> **Context:** Sarah flagged that the caching design needs group input before we commit. Original thread attached.

Moves email to `DraftReplies/Processed/`. Creates review TODOs in today's daily note:
- `- [ ] Review and send [Email] Reply to vendor [type:: review-draft] [User]`
- `- [ ] Review and send [Meeting] Follow-up caching design review [type:: review-draft] [User]`

**No-instruction case example:**

**Email 3:** User forwarded a thread from the platform team (no note, just forwarded).

- No instruction → default to email reply addressing open items
- Thread: Marcus asking whether the caching schema is finalized
- Marcus is a direct report (direct tier) → coaching preset

Generates default reply addressing the open question: "Hi Marcus, the caching schema is still under review — expecting a decision by Thursday. I'll confirm once it's finalized." → saves to `Drafts/[Email] Reply to Marcus.md`. Creates review TODO in daily note.

Output: "3 drafts created from DraftReplies. Files: [Email] Reply to vendor.md, [Meeting] Follow-up caching design review.md, [Email] Reply to Marcus.md. Review TODOs added to today's daily note."

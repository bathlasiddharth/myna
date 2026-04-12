---
name: myna-email-triage
description: Sort inbox emails into folders. Three-step flow: reads inbox, writes folder recommendations to review-triage.md, then on "process triage" moves approved emails. Purely classification — never extracts vault data. Run "process my email" separately after triage to extract vault data.
user-invocable: true
argument-hint: '"triage my inbox" or "process triage"'
---

# myna-email-triage

Sort inbox emails into folders. This skill is **purely about classification** — it recommends where each email belongs, nothing more. It never extracts tasks, decisions, observations, or any other data into the vault. That's `myna-process-messages`'s job.

Check `features.email_triage` in workspace.yaml before proceeding. If disabled, stop.

---

## Three-Step Flow

### Step 1 — Recommend (triggered by "triage my inbox", "sort my inbox", "process my inbox")

Read all emails from the inbox folder configured as `triage.inbox_source` in projects.yaml (default: `INBOX`).

For each email, determine:
1. **Which folder it belongs in** — see Folder Classification below
2. **Project association** (only if clearly applicable) — match against project names and aliases from projects.yaml
3. **Brief reasoning** — one phrase explaining the classification

Write recommendations to `ReviewQueue/review-triage.md`. Format each entry:

```markdown
## Triage — {YYYY-MM-DD}

- [ ] **{subject line}** — {sender first name}, {date}
  Move to: **{folder name}** — {reasoning}
```

Full example entry:
```markdown
- [ ] **RE: API spec timeline** — Sarah, 2026-04-05
  Move to: **Auth Migration/** — discusses API migration timeline, needs your input

- [ ] **Training: AWS Certification** — Learning Team, 2026-04-04
  Move to: **FYI/** — training invitation, no action needed

- [ ] **Q2 planning thoughts** — James, 2026-04-05
  Move to: **Reply/** — asks for your input on Q2 priorities

- [ ] **Re: auth team standup** — Alex, 2026-04-04
  Move to: **Auth Migration/** — standup update, relates to active project
```

After writing the file, output to the user:
```
📋 {N} emails triaged. Edit ReviewQueue/review-triage.md in Obsidian, then say "process triage" to move them.
```

Include the Obsidian URI and disk path to the file.

**What NOT to include in step 1 output:** Don't describe vault updates for each email. Don't flag reply needs. Don't extract action items. Pure classification only.

---

### Step 2 — User Edits (no skill action)

The user opens `review-triage.md` in Obsidian and:
- Checks emails they approve (to move)
- Changes folder assignments by editing the "Move to" line
- Deletes entries for emails they don't want moved
- Leaves unchecked items to skip for next time

---

### Step 3 — Process (triggered by "process triage")

Read `ReviewQueue/review-triage.md`. For each **checked** entry (`- [x]`):
1. Extract the subject line and the "Move to" folder name
2. Find the corresponding email in the inbox (match by subject + date)
3. Move it to the specified folder via the email MCP

After moving, clear processed entries from review-triage.md (remove checked entries). Unchecked entries remain for next time.

Output:
```
✅ Moved {N} emails. {M} skipped (unchecked).
Say "process my email" to extract vault data from the sorted emails.
```

If an email can't be found (subject changed, already moved): note it in output and skip. Don't fail the whole batch.

---

## Folder Classification

### User-defined folders (preferred)

If `triage.folders` is configured in projects.yaml with names and descriptions, classify each email into the folder whose description best matches the email's nature. Use the folder's `description` field as the criterion.

Example folders and their descriptions:
- `Reply/` — "Needs a response from me"
- `FYI/` — "Informational, no action needed"
- `Follow-Up/` — "Waiting on someone else"
- `Schedule/` — "Needs a meeting or calendar action"
- `Trainings/` — "Training invitations, course materials, learning resources"

### Project folders (always check first)

If an email clearly relates to a project in projects.yaml (by name, alias, or key people), classify it into the project's email folder (e.g., `Auth Migration/`). Project-mapped emails should go directly to their project folder, not to a generic triage folder.

### Default categories (fallback when no folders configured)

If `triage.folders` is not configured, use these built-in categories as folder names:
- `Reply/` — needs a response from you
- `FYI/` — informational, no action
- `Schedule/` — needs a meeting or calendar action
- `Follow-Up/` — waiting on someone else's response
- `Archive/` — can be archived, no value

### Classification priority

1. Project folder match (project name/alias/key people in email) → route to project folder
2. User-defined folder (match email to folder description)
3. Default category (if no user folders configured)

When an email could go to either a project folder OR a triage folder, prefer the project folder.

---

## Deduplication

Before writing to review-triage.md, check if a previous triage run left unchecked entries. If `review-triage.md` already exists with unchecked items from an earlier date, append a new `## Triage — {date}` section below the existing unchecked items. Don't overwrite previous work.

If an email was already processed in a prior run (moved to a non-inbox folder), skip it — it won't appear in the inbox read anyway.

**Near-duplicate skips:** If two inbox emails are closely related (e.g., two copies of the same notification, or an email and its forwarded version), and one is already included in review-triage.md, skip the near-duplicate and note it in the file:
```markdown
  ~~Skipped: "RE: API spec" — Sarah, 2026-04-05~~ (near-duplicate of entry above)
```
This ensures the user can see what was skipped and override if it was actually a distinct email.

---

## Edge Cases

**Inbox is empty:** Output "Inbox is empty. Nothing to triage."

**Email MCP unavailable (step 1):** Can't read inbox — inform user, stop.

**Email MCP unavailable (step 3):** Some moves may fail. Note each failure, continue with the rest. Create a retry TODO for any failed moves:
```
- [ ] 🔄 Retry: Move "{subject}" to {folder} — MCP error [type:: retry] [created:: {YYYY-MM-DD}]
```

**No triage config in projects.yaml:** Use default categories. Still works.

**One-by-one review mode:** If the user asks to go through emails one at a time ("show me each email"), present them sequentially in chat. User says "move to reply" or "move to FYI" etc. for each. At the end, write the confirmed moves to review-triage.md as pre-checked entries, then immediately process them.

---

## What This Skill Does NOT Do

- Does not extract tasks, decisions, blockers, observations, or any other vault data
- Does not create or update any project files, person files, or timeline entries
- Does not send emails or create drafts
- Does not touch the `DraftReplies` folder (that's `myna-draft-replies`)
- Does not process emails in project-mapped folders (that's `myna-process-messages`)

After triage, the user runs `myna-process-messages` to extract vault data from the sorted emails.

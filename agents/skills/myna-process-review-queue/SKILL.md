---
name: myna-process-review-queue
description: Process review queue items across review-work, review-people, and review-self queues — interactively in chat or by processing items the user has already checked in Obsidian. Does NOT process review-email-triage.md (email folder recommendations — that's handled by myna-email-triage).
user-invocable: true
argument-hint: "review my queue | process review queue | what's in my queue? | process approved items | process [queue name]"
---

# myna-process-review-queue

Processes pending review queue items. Writes approved items to their destinations with `[Verified]` tag. Logs all processed items to `ReviewQueue/processed/processed-{YYYY-MM-DD}.md` for audit trail.

**Does NOT handle `review-email-triage.md`** — email triage is handled by myna-email-triage.

## Before You Start

Read at session start:
- `_system/config/workspace.yaml` — vault subfolder
- `_system/config/projects.yaml` — project names for destination resolution
- `_system/config/people.yaml` — person names for destination resolution

Queue files:
- `ReviewQueue/review-work.md` — ambiguous tasks, decisions, blockers, timeline entries
- `ReviewQueue/review-people.md` — ambiguous observations, recognition
- `ReviewQueue/review-self.md` — uncertain contribution candidates

Audit trail: `ReviewQueue/processed/processed-{YYYY-MM-DD}.md`

---

## Review Queue Entry Format

Each entry in a queue file follows this format:

```
- [ ] **{proposed action}**
  Source: {where this came from}
  Interpretation: {what the agent thinks it means}
  Ambiguity: {why this needs review — what's unclear}
  Proposed destination: {destination file and section}
  Content: {the entry to write verbatim if approved}
  ---
```

`- [x]` = user approved in Obsidian (file mode). `- [ ]` = still pending.

---

## Two Processing Modes

### Mode 1: Chat Mode (Interactive)

**Trigger:** "review my queue", "go through my queue"

**How:**
1. Read all three queue files.
2. Count pending items (unchecked `- [ ]`) across all queues.
3. If empty: "Your review queue is clear. Nothing pending."
4. Present items one at a time. For each item, show:

```
## Item {N} of {total} — {queue name}

**{Proposed action}**
Source: {source reference}
Interpretation: {agent's interpretation}
Ambiguity: {what's unclear}
Proposed destination: {destination file + section}
Content if approved:
  {content}

Approve / Edit / Skip / Discard?
```

5. Wait for user response per item:
   - **approve** (or "yes", "looks good") → write to destination with `[Verified]` tag
   - **approve and assign to me** → same, but add `[person:: {user.name}]` to the entry
   - **edit** → user provides corrected content → write the corrected version with `[Verified]`
   - **skip** → leave in queue file untouched, move to next item
   - **discard** (or "no", "ignore this") → remove from queue file, log to audit trail only

6. After all items: summarize what was approved, edited, skipped, discarded. Write audit trail entry.

**Worked example:**

User: "review my queue"

Queue state: 5 items (3 in review-work, 1 in review-people, 1 in review-self)

```
5 items in your review queue. Let's go through them.

---
## Item 1 of 5 — review-work

**Add task: check if Platform team confirmed March 15 deadline**
Source: email from James, April 3 — "someone should verify this"
Interpretation: A task needs to be added to the auth-migration project
Ambiguity: "someone" — can't determine owner. Could be you or James.
Proposed destination: Projects/auth-migration.md — Open Tasks
Content if approved:
  - [ ] Verify Platform team confirmed Mar 15 deadline 📅 2026-04-10 [project:: Auth Migration] [type:: task] [Inferred]

Approve / Edit / Skip / Discard?
```

User: "approve and assign to me"

Write to `Projects/auth-migration.md` (Open Tasks section):
```
- [ ] Verify Platform team confirmed Mar 15 deadline 📅 2026-04-10 [project:: Auth Migration] [type:: task] [person:: {user.name}] [Verified] (was Inferred, verified 2026-04-05)
```

Continue to item 2.

---

### Mode 2: File Mode (Batch Approval)

**Trigger:** "process approved items", "process my queue", "process checked items"

**How:**
1. Read all three queue files.
2. Find all checked items (`- [x]`).
3. If none checked: "No items are checked in your queue files. Open them in Obsidian, check the items you want to approve, then say 'process approved items'."
4. If 5 or more items are checked: present the full list and confirm before writing: "About to write {n} items to {n} files. Proceed?"
5. For each checked item: parse `Proposed destination` and `Content` fields. Before writing, check for near-duplicates (same action + entity from same source) in the destination file. If a near-duplicate is found: skip that item and inform the user.
6. Write each approved item to its destination with `[Verified]` tag (see Writing Approved Items below).
7. Remove checked items from the queue file. Leave unchecked items untouched.
8. Write audit trail.
9. Summarize: how many items processed, from which queues, to which destinations.

---

## Writing Approved Items

For each approved item (chat or file mode):

1. Parse destination file and section from the `Proposed destination` field.
2. Resolve the destination path using vault path conventions from workspace.yaml.
3. Read the destination file — check for near-duplicates (same action + entity from same source).
   - If near-duplicate found: skip that item, inform user.
4. Append the `Content` entry to the destination section, replacing `[Auto]` or `[Inferred]` with `[Verified]`, and appending `(was {original marker}, verified {YYYY-MM-DD})`.
5. Remove the item from the queue file.

**Destination write formats (per section type):**

- Project timeline: `- [{YYYY-MM-DD} | {source}] {content} [Verified] ({source-detail})`
- Person file Observations: `- [{YYYY-MM-DD} | {source}] **{type}:** {observation} [Verified] ({source-detail})`
- Task entry: `- [ ] {task} [Verified]` (or `- [x] {task} [Verified]` if marking complete)
- Contributions log: `- [{YYYY-MM-DD} | {source}] **{category}:** {description} [Verified] ({source-detail})`

The `[Verified]` marker and provenance conventions are defined in myna-steering-conventions.

---

## Audit Trail

After each processing run, append to `ReviewQueue/processed/processed-{YYYY-MM-DD}.md`:

```markdown
## Processed — {YYYY-MM-DD HH:MM}

**Total processed:** {n}

### Approved ({n})
- {item summary} → {destination file}

### Edited ({n})
- {item summary} → {destination file} (edited before approval)

### Discarded ({n})
- {item summary} — discarded

### Skipped ({n})
- {item summary} — left in queue
```

If the file doesn't exist, create it with this header first:

```markdown
---
created: {YYYY-MM-DD}
---

#review-queue-audit
```

---

## Queue Summary

**Trigger:** "what's in my queue?", "how many queue items do I have?"

Show a count summary without entering interactive review:

```
## Review Queue Summary

- review-work: 3 pending items
- review-people: 1 pending item
- review-self: 2 pending items

Total: 6 items. Say 'review my queue' to go through them interactively, or open the files in Obsidian to check items you want to approve.
```

---

## Processing Rules

**Destination file doesn't exist:** Inform the user: "The destination file `{path}` doesn't exist. Create it first, or discard this item." Do not create the file automatically — that could create orphan files.

**Ambiguous destination:** If the `Proposed destination` field isn't specific enough to locate the file, present to user: "I need a clearer destination for this item. Which file should this go to?"

**Queue files don't exist:** If a queue file doesn't exist, skip it silently. Do not create empty queue files.

**review-email-triage.md:** If the user asks to process triage items, redirect: "Email triage is handled separately. Say 'process triage' to move approved emails to their folders."

**Bulk write (file mode):** 5 or more checked items — present the full list and confirm before writing: "About to write {n} items to {n} files. Proceed?"

---

## Queue-Specific Notes

### review-work
Contains: ambiguous tasks, delegations, decisions, blockers, timeline entries.
Destination examples: `Projects/{slug}.md` → Timeline or Open Tasks section.

### review-people
Contains: ambiguous observations, recognition entries.
Destination examples: `People/{slug}.md` → Observations or Recognition section.

### review-self
Contains: uncertain contribution candidates.
Destination: `Journal/contributions-{week-monday}.md`

Extra care: contribution claims — especially manager-type ones — should be confirmed thoughtfully. The user's career record depends on accuracy here.

**Worked example — review-self item:**

Queue entry:
```
- [ ] **Log contribution: may have helped resolve auth team's API blocker**
  Source: meeting 1:1 with Sarah, April 2
  Interpretation: Agent thinks you influenced the resolution, but it's not confirmed
  Ambiguity: Unclear whether you resolved it or Sarah did — discussion was about the blocker but action wasn't assigned
  Proposed destination: Journal/contributions-2026-03-30.md
  Content: - [2026-04-02 | meeting 1:1 with Sarah] **unblocking-others:** Helped resolve API blocker for auth migration [Inferred] (meeting, 1:1 with Sarah, 2026-04-02)
  ---
```

Chat mode presentation:
```
## Item 3 of 5 — review-self

**Log contribution: may have helped resolve auth team's API blocker**
Source: 1:1 with Sarah, April 2 — discussed the API blocker
Interpretation: You may have influenced the resolution, but it's not clear from the notes.
Ambiguity: It's unclear whether you resolved this or Sarah did.
Proposed destination: Journal/contributions-2026-03-30.md
Content if approved:
  [2026-04-02 | meeting] **unblocking-others:** Helped resolve API blocker for auth migration [Inferred]

Approve, Edit, Skip, or Discard?
```

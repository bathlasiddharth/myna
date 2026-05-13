# Review Queues

Files where the agent surfaces ambiguous items for the user to approve, edit, or discard. Load alongside `_conventions.md`.

---

## Review Queue Entry

Entries inside review queue files (`ReviewQueue/review-work.md`, `review-people.md`, `review-self.md`). Format-only — entries accumulate inside their queue file.

```
- [ ] **{proposed action}**
  Source: {where the item came from — file, email subject, channel}
  Interpretation: {what the agent thinks this is}
  Ambiguity: {why it's in the queue — what's unclear}
  Proposed destination: {where it would be written if approved}
  ---
```

User actions: check the box (approve), edit text (modify), delete the entry (discard), leave unchecked (skip for later).

---

## Review Inbox Entry

**Path:** `ReviewQueue/review-inbox.md` — simpler format than other queues. Recommends which folder each email should move to (no vault updates; that's the `process-messages` skill's job after sorting).

```
## Triage — {YYYY-MM-DD}

- [ ] **{subject line}** — {sender}, {date}
  Move to: **{folder name}** — {reasoning}
```

Examples:
```
- [ ] **RE: API spec timeline** — Sarah Chen, 2026-04-05
  Move to: **Auth Migration/** — discusses API migration timeline

- [ ] **Training: AWS Certification** — Learning Team, 2026-04-04
  Move to: **Trainings/** — training course invitation
```

User edits in Obsidian: check emails to approve, change folder assignments, delete unwanted emails. "Process triage" then moves checked emails to assigned folders.

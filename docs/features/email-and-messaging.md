# Email & Messaging — Features

**Scope:** Email processing pipeline, messaging processing, triage, thread summaries, unreplied tracker, deduplication.

---

## Features

> **Moved to cross-domain.md:** F20 (Auto-Tagging) — applies across all domains, not just email/messaging.
> **Moved to writing-and-drafts.md:** F17 (Email Draft Replies) — the draft creation is a writing concern. The trigger mechanism (DraftReplies folder) is noted there.

### Deduplication (shared by email processing, messaging processing, and triage)

One-line summary: Three-layer defense against processing the same content twice, built to work with any MCP regardless of its capabilities.

- **Layer 1 — Move to Processed folder (D019):** after processing an email, move it to a `Processed/` subfolder within the same project folder. Next run only sees unprocessed emails in the parent folder. The folder structure mirrors the project mapping (e.g., `Auth Migration/Processed/`). Emails are preserved, not deleted. Assumes the email MCP supports folder moves.
- **Layer 2 — Quote stripping:** when processing an email that's part of a thread, the agent strips quoted content before extraction. Detects quote markers: lines starting with ">", "On [date], [person] wrote:", "From: ... Sent: ..." blocks, and forwarded message headers. Only the new content at the top is processed. Imperfect for inline replies (someone writing between quoted lines) — layer 3 catches those.
- **Layer 3 — Near-duplicate detection:** before staging an extracted item in the review queue, the agent checks recent queue entries and recent vault writes for near-duplicates (same action item, same decision, similar wording from the same source thread). If a near-match exists, the item is skipped and the user is informed on CLI ("Skipped: 'review design doc' — similar item already staged from earlier email in this thread"). Transparency so the user knows what was dropped and can override if it was actually a distinct item. For email triage, skipped items are also noted in `review-triage.md` so they're visible when the user reviews the file.
- **Applies to:** email processing, messaging processing, email triage, and document processing. Any feature that extracts structured data from external content uses all three layers. Layer 1 (folder moves) is email-specific; for Slack, the agent stores the last-processed timestamp per channel in `_system/logs/processed-channels.md`. On each run, only messages after the stored timestamp are processed. Timestamp updated after successful processing.

### Email Processing

One-line summary: "Process my email" extracts structured data from configured folders and routes it to the vault.

- Processes new messages from email folders mapped to projects in the registry (D010)
- Skips already-processed messages via deduplication (see above)
- Full decomposition per message — a single email can produce entries for MULTIPLE destinations. Each entry uses the provenance marker system:
  - Action items → task list (`[Auto]` if explicit in email, `[Inferred]` if agent interpreted it as an action item)
  - Decisions → project timeline
  - Blockers → project timeline
  - Delegation signals → task with `type:: delegation`
  - Timeline-worthy updates → project timeline
  - Recognition signals → person file
  - Your contributions → contributions log
  - Person-relevant context → person file observations
- Provenance markers determine the write path: `[Auto]` entries written directly, `[Inferred]` entries written directly but flagged, genuinely ambiguous items (can't determine project, unclear who owns it) go to review queue.
- One email can generate multiple entries across different destinations — this is correct behavior, not duplication. Every relevant destination gets its own entry.
- Only scans folders listed in registry — never touches the inbox. Inbox is handled separately by Email Triage (user-triggered, batch classification with approval)
- Project routing determined by folder → project mapping in config (zero ambiguity)
- Summary output: "Processed N emails from M folders. Staged X items for review. Updated Y project timelines."

### Messaging Processing

One-line summary: "Process my messages" extracts structured data from configured Slack channels and routes it to the vault.

- Processes new messages from Slack channels mapped to projects in the registry
- Skips already-processed messages via deduplication (see above)
- Only scans channels listed in registry — never touches unmapped channels automatically
- Full decomposition per message — a single message can produce entries for MULTIPLE destinations. Each entry uses the provenance marker system:
  - Action items → task list (`[Auto]` if explicit, `[Inferred]` if agent interpreted)
  - Decisions → project timeline
  - Blockers → project timeline
  - Delegation signals → task with `type:: delegation`
  - Timeline-worthy updates → project timeline
  - Recognition signals → person file
  - Your contributions → contributions log
  - Person-relevant context → person file observations
- Provenance markers determine the write path: `[Auto]` entries written directly, `[Inferred]` entries written directly but flagged, genuinely ambiguous items go to review queue.
- One message can generate multiple entries across different destinations — this is correct behavior, not duplication.
- Project routing determined by channel → project mapping in config (zero ambiguity)
- DMs and unmapped channels: user can forward a message to a designated inbox channel (configurable in registry) or paste directly into the agent conversation
- Inbox channel supports keyword tags for explicit routing: TODO, LOG, BLOCKER, DECISION, RECOGNITION
- Summary output: "Processed N messages from M channels. Staged X items for review. Updated Y project timelines."

### Email Triage

One-line summary: "Triage my inbox" reads inbox emails, classifies each into a folder, and moves approved items — vault extraction (tasks, decisions, observations) is handled separately by Email Processing.

- **Scope: classification only.** Triage decides *where an email goes*, not *what to extract from it*. Vault updates come from Email Processing, not triage.
- **Step 1 — Classify (written to file):** the agent reads all inbox emails and writes classifications to `ReviewQueue/review-triage.md`. For each email:
  - **Folder classification:** which folder this email belongs in (see below)
  - Reasoning for the classification
- **Step 2 — User edits the file:** user opens `review-triage.md` in Obsidian and edits at their pace — delete emails they don't care about, fix folder assignments, approve/reject per entry. Faster than CLI for 50 emails — bulk-delete, rearrange, check off in one pass.
- **Step 3 — Process:** "process triage" → agent reads the file, moves approved emails into their classified folders using the email MCP, clears processed items from the file. Rejected/deleted items are gone. Skipped items stay for next time.
- **Folder classification — two modes:**
  - **User-defined folders:** if the user has configured triage folders in the registry with descriptions (e.g., `FYI/` = "informational, no action", `Reply/` = "needs a response from me", `Follow-Up/` = "waiting on someone else"), the agent classifies into those folders
  - **Default categories:** if no folders are configured, the agent uses built-in categories: needs reply, FYI/no action, needs scheduling, follow-up/waiting, can archive
  - Either way, Myna moves approved emails into the classified folder using the email MCP
- Can switch to one-by-one review mode if preferred

### Thread Summary

One-line summary: "Summarize this thread" generates a BLUF summary of any email or messaging conversation.

- BLUF structure (D016): bottom line first, then details
- Covers: what was decided, what's still open, action items with owners
- Source thread noted for reference
- Works with email threads and messaging threads
- Output shown inline

### Unreplied & Follow-up Tracker

One-line summary: Tracks messages waiting on you and messages you're waiting on others for, using TODOs as the tracking mechanism.

- Two categories:
  - **Waiting on you:** messages received that you haven't responded to
  - **Waiting on them:** messages you sent that haven't gotten a response
- **How it gets populated:** during email processing, messaging processing, or email triage, the agent flags messages that need a reply from you. For each, it proposes a TODO with `type:: reply-needed` (e.g., "Reply to Sarah about API timeline") → staged in `review-work` queue. User approves which ones are worth tracking.
- **No separate tracker file** — the "unreplied tracker" is a Dataview query over TODOs with `type:: reply-needed`. Surfaced in daily note and queryable on demand ("what am I waiting on?").
- Items auto-resolve when a reply is detected in subsequent processing runs (the TODO is marked complete)


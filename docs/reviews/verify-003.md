# Myna Verify Report — Cycle 003

**Date:** 2026-04-09
**Review:** `docs/reviews/review-003.md`
**Fix report:** `docs/reviews/fix-003.md`

## Issue Verification

### [I01] Reply-needed TODO routing inconsistency
**Fix action:** Implemented Option 1 — write reply-needed TODOs directly to project files as `[Inferred]` Tasks plugin TODOs
**Verdict:** Resolved (with mid-fix correction noted below)

**Evidence:** `process.md` step 4d (lines 55-65) now reads:

> "Reply-needed TODOs are written directly to the relevant project file's `## Open Tasks` section as Obsidian Tasks plugin TODOs (so they are queryable by brief.md's Unreplied Tracker via the `tasks` MCP tool). Format:
>
> ```
> - [ ] Reply to {sender first name} about {topic} [project:: {Project Name}] [type:: reply-needed] [review-status:: pending] [Inferred] (email, {sender first name}, {date}) — needs reply
> ```
>
> Do NOT set `[person:: ...]` on these — the user is the owner (the user owes the reply), and brief.md's Unreplied Tracker categorizes a task as 'waiting on you' precisely when there is no `person::` field. The sender's identity lives in the description text and the source reference. Use `[Inferred]` because 'this needs a reply' is the agent's interpretation, not an explicit instruction in the email. The `[review-status:: pending]` flag lets the user verify and clear it when they reply manually. If the project can't be resolved, write to today's daily note instead.
>
> **Auto-resolve:** On subsequent runs, if a later email in the same thread is FROM `user.email`, find the matching reply-needed TODO (same sender + same thread context) in project files via the Obsidian MCP `tasks` query and mark it complete via the same mechanism used for any task completion."

The reply-needed TODO is now a real Obsidian Tasks plugin TODO with `[type:: reply-needed]` inline property — directly findable by brief.md's `tasks` MCP query. The auto-resolve mechanism uses the same query, then narrows by sender + thread context to find the right TODO. The format aligns with conventions.md's Tasks plugin syntax.

**Mid-fix correction noted:** The first version of the fix included `[person:: {sender first name}]` in the format. On verify re-read, this would have been a regression: brief.md's "Waiting on you" vs "Waiting on them" split keys on `person::` (no person → owner is user → "waiting on you"; person set → owner is someone else → "waiting on them"). Setting `person:: Sarah` for an incoming email needing the user's reply would have miscategorized the task as "waiting on them." The fix was corrected to OMIT `person::` and explicitly document why. The sender's identity now lives in the description text and source reference instead. Verified consistency with brief.md's split: incoming reply-needed TODOs (no `person::`) → "Waiting on you"; outgoing reply tracking (manually created with `person:: {recipient}`) → "Waiting on them". Both now work as brief.md's procedure describes.

---

### [M01] draft.md frontmatter type list missing performance-narrative and pre-read
**Fix action:** Implemented Option 1 — added the missing values
**Verdict:** Resolved

**Evidence:** `draft.md` line 153 (Output section) now reads:

> "Frontmatter: `type` (email-reply, follow-up, status-update, escalation, recognition, meeting-invite, say-no, conversation-prep, **pre-read**, monthly-update, self-review, promo-packet, brag-doc, **performance-narrative**), `audience_tier` (upward, peer, direct, cross-team), `related_project`, `related_person`, `created` date. Tags: `#draft #{type}`. Footer: `*Source: {what prompted this draft}*`"

Both missing values are now in the list. brief.md (line 131) generates with `type: performance-narrative` — this value is now in the canonical list. draft.md sub-procedure 11 (Pre-Read Preparation) generates with implied `type: pre-read` — also now in the list. The file path types list (line 151) and the frontmatter type values list (line 153) are now in agreement.

---

### [M02] sync.md prep format unspecified
**Fix action:** Implemented Option 2 — added a Rules note
**Verdict:** Resolved

**Evidence:** `sync.md` line 159 (Rules section, after "Lightweight meeting preps") now reads:

> "**Prep item format matches prep-meeting.** Lightweight prep items use the same bold-header format as prep-meeting (`- [ ] **Carry-forward:** {item}`, `- [ ] **Recent work:** {item}`, `- [ ] **Pending feedback:** {item}`, `- [ ] **Action item:** {item}`) so prep-meeting's update mode can dedup correctly when reading sync-written prep, and brief.md's 1:1 topic-source-balance heuristic correctly classifies them as agent-generated."

The four bold-header patterns are explicit. Cross-checked against prep-meeting.md's worked example (lines 153-162) — same bold-header format. Cross-checked against brief.md's 1:1 Pattern Analysis heuristic (line 110) — heuristic recognizes `**Follow-through:**`, `**Recent work:**`, `**Pending feedback:**`, etc. as agent-generated. All three skills now agree.

---

### [M03] Performance narrative default time period mismatch
**Fix action:** Implemented Option 1 — changed brief.md default to 3 months
**Verdict:** Resolved

**Evidence:** `brief.md` line 118 (Performance Narrative step 2) now reads:

> "Resolve person name against `people.yaml`. Determine time period — user may specify 'for H1', 'for Q1', 'since January'. Default: last 3 months."

Cross-checked against `docs/features/people-management.md` line 90: "Default time period: last 3 months (configurable per request)" — they now agree. The default is also more aligned with quarterly review cadence.

---

### [M04] wrap-up.md self-reflection feedback gap toggle gating
**Fix action:** Implemented Option 1 — added explicit toggle check
**Verdict:** Resolved

**Evidence:** `wrap-up.md` line 69 (Weekly Summary step 4, Self-Reflection bullet) now reads:

> "**Self-Reflection:** agent-generated prompts based on the week's patterns — time allocation balance (meeting-heavy days vs focus days), delegation health (overdue delegations trend), recurring carry-overs (tasks carried 3+ times). If `features.feedback_gap_detection` is enabled and the user is a manager, also include feedback gaps (days since last feedback to each direct report). If `feedback_gap_detection` is disabled, omit the feedback gap reflection."

The feedback gap reflection is now conditional on the toggle. The other reflection prompts (time allocation, delegation health, carry-overs) are unconditional, which is correct — they don't depend on the feedback gap feature. The wording "If feedback_gap_detection is disabled, omit the feedback gap reflection" mirrors the wording in brief.md (cycle 001 fix) so the toggle behaves consistently across all three skills (brief, prep-meeting, wrap-up).

---

### [M05] process-meeting.md `[Processed]` marker scope ambiguous for 1-1 files with multiple sessions
**Fix action:** Implemented Option 1 — clarified scan and marker placement to be per-session
**Verdict:** Resolved

**Evidence:**

`process-meeting.md` step 1 (Locate, batch path) now reads:
> "**Batch:** scan `Meetings/1-1s/`, `Meetings/Recurring/`, `Meetings/Adhoc/` for any session matching today's date — that is, a `## {today's date} Session` header where the Notes section beneath that header is non-empty and no `*[Processed {today's date}]*` marker appears within that session (between the session header and the next `## ` heading or end of file). The marker is dated and per-session — a 1:1 file with multiple sessions may have multiple `*[Processed {date}]*` markers, one per processed session. Only the today's-date session matters for the current run. Process each matched session sequentially."

`process-meeting.md` step 7 (Mark as Processed) now reads:
> "After processing, append a marker below this session's Notes section (and before the next `## ` session heading, if any): `*[Processed {YYYY-MM-DD}]*`. The marker is per-session — for 1:1 files with multiple sessions, each processed session gets its own dated marker. This prevents reprocessing the same session in batch mode while leaving other sessions in the file untouched."

Both halves of the marker logic are now per-session-scoped. The scan looks for the marker WITHIN the today's-date session block (between that header and the next `## ` heading), not anywhere in the file. The placement appends the marker WITHIN the same session block, also bounded by the next `## ` heading. This makes the logic correct for 1:1 files (which can have many sessions in one file) without changing behavior for Recurring/Adhoc files (which typically have one session per file). The fix is wording-only — no template format changes needed.

---

## Regression Check

1. **Modified files re-read in full:** `process.md`, `draft.md`, `sync.md`, `brief.md`, `wrap-up.md`, `process-meeting.md` — all changes fit naturally with surrounding content. No contradictions introduced.

2. **Mid-fix regression caught and corrected:** As noted in [I01], the first version of the process.md fix included `[person:: {sender first name}]`, which would have miscategorized incoming reply-needed TODOs as "Waiting on them" instead of "Waiting on you" in brief.md. The verify re-read caught this before it shipped. Fixed by removing the `person::` field and documenting why explicitly. This is the kind of subtle cross-skill issue the verify pass exists to catch — confirming the value of the verify methodology.

3. **Cross-skill consistency on shared destinations:**
   - **Reply-needed TODOs in project files:** process.md writes them as Tasks plugin TODOs with `type:: reply-needed`, no `person::`, `[Inferred]`, `[review-status:: pending]`. brief.md queries via Obsidian MCP `tasks`. The two skills now agree on format and semantics. brief.md's "Waiting on you" finds them; "Waiting on them" continues to be populated only by manual user-created tracking tasks (per cycle 002 M03 fix and brief.md line 153).
   - **Sync vs prep-meeting prep format:** Both skills now use the same bold-header patterns (`**Carry-forward:**`, `**Recent work:**`, `**Pending feedback:**`, `**Action item:**`). prep-meeting's update-mode dedup will work correctly when reading sync-written prep. brief.md's heuristic recognizes them.
   - **Draft type list:** draft.md frontmatter list now includes all 14 types. brief.md and self-track.md generate drafts with values in this list.
   - **feedback_gap_detection toggle:** Now gated in brief.md (cycle 001), prep-meeting.md (cycle 001), and wrap-up.md (this cycle). Three sites, consistent behavior. Disabling the toggle silences ALL feedback gap surfacing.
   - **Processed marker:** process-meeting.md is the only file using this convention. Internally consistent: scan is per-session, placement is per-session, the marker is dated.

4. **Safety check:**
   - **Reply-needed TODOs:** Written to project files (already a safe destination — vault writes through Obsidian MCP). No new write paths.
   - **Auto-resolve:** Marks an existing TODO as complete via Obsidian MCP — same pattern as task completion direct operation. Append-only discipline preserved (marking complete is an allowed metadata update per safety.md).
   - **No send/post/deliver paths added.** No changes to safety-critical sections (calendar, draft-never-send, vault-only writes).
   - **Confirmation policy unchanged.**

5. **Append-only discipline check:**
   - process.md writes new entries (TODOs, recognition, observations, etc.) — append-only ✓
   - process-meeting.md `[Processed]` marker is append-only (added below Notes section) ✓
   - sync.md doesn't change its write pattern ✓
   - wrap-up.md adds new content to weekly summary section (append) ✓
   - brief.md changes are spec-only (no behavior change) ✓
   - draft.md changes are spec-only (no behavior change) ✓

6. **Lint verification:** Re-ran `bash scripts/lint-agents.sh` after the corrected fix. **0 errors, 8 warnings** (same false positives — `Review and send` user-action TODOs, example content). Status: PASS. No new errors or warnings introduced.

## Verdict

**CLEAN** — all 6 implemented fixes are resolved. One mid-fix regression was caught and corrected during the verify pass (the `person::` field in the reply-needed TODO format). No outstanding issues. No regressions. Recommend: stop iterating.

| Metric | Count |
|--------|-------|
| Issues verified | 6 |
| Resolved | 6 |
| Not resolved | 0 |
| Pushbacks accepted | 0 |
| Pushbacks rejected | 0 |
| Mid-fix regressions caught | 1 (I01 person:: field) |
| Final regressions found | 0 |

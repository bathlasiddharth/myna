# Myna Review — Cycle 003

**Date:** 2026-04-09
**Scope:** All agent artifacts — `agents/main.md`, `agents/steering/*.md`, `agents/skills/*.md`, `agents/config-examples/*.yaml.example`, `agents/claude-md-template.md`
**Files reviewed:** 24 files (1 main agent, 4 steering, 14 skills, 6 config examples, 1 template)
**Previous cycles:** Cycles 001 and 002 ended CLEAN (7/7 and 4/4 fixes resolved). This cycle hunts for issues not caught in prior reviews.

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Important | 1 |
| Minor | 5 |
| Nitpick | 0 |

**Convergence:** CONTINUE — 1 blocking issue.

---

## Phase 0 — Lint

### Errors Found and Fixed

(none — lint passed clean on first run)

### Warnings Reviewed

| # | Check | File | Issue | Action |
|---|-------|------|-------|--------|
| 1 | Safety keywords | draft-replies.md:71 | "send" in `Review and send` TODO template | Not concerning — TODO instructs the USER to send, consistent with draft-never-send |
| 2 | Safety keywords | draft-replies.md:72 | "send" in meeting invite TODO template | Same pattern — user action, not agent action |
| 3 | Safety keywords | draft-replies.md:85 | "send" in Output section TODO format | Same pattern |
| 4 | Safety keywords | draft.md:43 | "send" in review TODO template | Same pattern |
| 5 | Safety keywords | draft.md:107 | "post" in recognition draft description | Describes draft FORMAT (channel post), not Myna posting |
| 6 | Safety keywords | prep-meeting.md:153 | "Send" in worked example action item | Realistic example content — action item text |
| 7 | Safety keywords | process-meeting.md:152 | "Send" in worked example | Realistic example content |
| 8 | Safety keywords | conventions.md:49 | "send" in provenance example | Provenance marker example — data, not instruction |

**Lint summary:** 0 errors found, 0 fixed. 8 warnings reviewed (all false positives, identical to cycles 001 and 002 — same pattern: user-action TODOs and example content). Final status: PASS.

---

## Issues

### Important

#### [I01] Reply-needed TODO routing is internally inconsistent across process.md, brief.md, and the auto-resolve mechanism

**Severity:** Important
**File(s):** `agents/skills/process.md` (line 57), `agents/skills/brief.md` (lines 151-155)
**Dimension:** Cross-File Consistency / Instruction Clarity

**Problem:** The Unreplied Tracker feature has three statements that don't fit together cleanly:

**process.md line 55-57** (creating reply-needed TODOs):
> "d. **Unreplied tracking:** Create a TODO with `type:: reply-needed` if ALL of these are true... Skip for notifications, auto-generated digests, and FYI emails.
>
>    **Auto-resolve:** On subsequent runs, if a later email in the same thread is FROM `user.email`, mark the original reply-needed TODO as complete. Route reply-needed TODOs to `review-work.md`."

So process.md says: routes reply-needed TODOs to `review-work.md` AND on subsequent runs marks the "original reply-needed TODO" as complete.

**brief.md line 151-152** (querying them):
> "1. Query tasks with `type:: reply-needed` that are not completed via Obsidian MCP `tasks`. Split into:
>    - **Waiting on you:** reply-needed tasks where you are the owner — automatically created by process skill when incoming emails require your response"

Brief.md uses the Obsidian MCP `tasks` query for items with `type:: reply-needed` and treats them as "automatically created by process skill" — meaning real Tasks plugin TODOs in project files.

**The mismatch:** Review queue entries in `review-work.md` use the queue entry format (`- [ ] **{action}** \n  Source: ... \n  Interpretation: ...`) — they do NOT carry inline properties like `[type:: reply-needed]`. So an Obsidian MCP `tasks` query for `type:: reply-needed` will not find anything in `review-work.md`. The two skills disagree about where reply-needed TODOs live:

- process.md says: review-work.md (queue file)
- brief.md says: queryable as Tasks plugin TODOs (project files)

Additionally, process.md's auto-resolve says "mark the original reply-needed TODO as complete" — but review queue entries are not "completable" in the Tasks plugin sense; they're checklist items in a markdown file. The auto-resolve mechanism only makes sense if the TODO is a real Tasks plugin TODO in a project file (or daily note).

**Impact:** Two scenarios fail:

1. **Today the user runs "process my email":** process.md creates reply-needed entries in review-work.md. The user then says "what am I waiting on?" → brief.md queries Tasks plugin → finds nothing. The Unreplied Tracker is silently broken from the user's perspective.
2. **Auto-resolve never fires:** Even if the user goes to review-work.md and approves the items, the auto-resolve mechanism in process.md has no clear handle on the items' new locations to mark them complete on next run.

This is the kind of issue that only surfaces after several days of usage when the user notices the tracker is empty even though they have unanswered emails.

**Options:**
1. **Treat reply-needed TODOs as `[Inferred]` tasks routed directly to project files** (matching the [Inferred] decision criterion: "core item is real, some fields guessed"). Update process.md step 4d to: write the TODO to the relevant project file's `## Open Tasks` section with `type:: reply-needed`, `person:: {sender}`, `[review-status:: pending]` (since the "this needs a reply" judgment is inferred), `[Inferred]` provenance, and source reference. Remove "Route reply-needed TODOs to `review-work.md`" from the Auto-resolve paragraph. Auto-resolve then works because the TODO lives in a real project file. Brief.md's query already matches this. **This matches brief.md's mental model of how reply-needed tracking works.**
2. **Keep routing to review-work.md and update brief.md to query both queue files and project files.** Brief.md's Unreplied Tracker procedure would need a two-step query: first read review-work.md for entries with reply-needed semantics, then run the Obsidian MCP `tasks` query for project-file TODOs. Also fix process.md's auto-resolve wording so it only refers to TODOs after queue approval. This is more complex and creates a confusing two-stage flow for users.
3. **Two-tier approach: high-confidence reply-needed → direct write, low-confidence → review-work.** When the email signals are unambiguous (direct question to user, explicit ask), write directly with `[Inferred]`. When the signal is borderline, route to review-work for user judgment. Adds complexity but mirrors how other extraction works.

**Recommended:** Option 1. The simpler model matches brief.md's existing query and aligns with the [Inferred] tag's intended use ("core item real, some fields guessed"). The "reply needed" judgment is exactly the kind of interpretation [Inferred] was designed for, with `[review-status:: pending]` flagging it for verification. The current "route to review-work" is leftover from an earlier conservative routing approach (cycle 001 documented the move toward direct-write with [Inferred]). Removing it brings reply-needed in line with how all other inferred tasks are handled.

---

### Minor

#### [M01] draft.md frontmatter type list is missing `pre-read` and `performance-narrative`

**Severity:** Minor
**File(s):** `agents/skills/draft.md` (line 153), `agents/skills/brief.md` (line 131)
**Dimension:** Cross-File Consistency

**Problem:** draft.md's Output section has two parallel type lists that drifted apart.

**File path types** (line 151):
> "types are Email, Meeting, Status, Escalation, Recognition, Say-No, Conversation-Prep, Pre-Read, Review (performance narratives from brief skill), Self (brag docs, self-reviews, promo packets from self-track skill)."

**Frontmatter type values** (line 153):
> "Frontmatter: `type` (email-reply, follow-up, status-update, escalation, recognition, meeting-invite, say-no, conversation-prep, monthly-update, self-review, promo-packet, brag-doc)"

The file path list correctly includes `Pre-Read` and `Review` (added in cycle 001 fix M03). But the frontmatter type list doesn't include corresponding values for these:
- `pre-read` is missing — used by draft.md sub-procedure 11 (Pre-Read Preparation) which generates `Drafts/[Pre-Read] {document title}.md`
- `performance-narrative` is missing — used by brief.md (line 131): `Save to Drafts/[Review] Performance Narrative {person} {period}.md with frontmatter type: performance-narrative, audience_tier: upward.`

**Impact:** Low. brief.md and draft.md both reference type values directly when saving — they don't read the central list. But the list pretends to be exhaustive ("Frontmatter: `type` ({list})") and misleads anyone reading draft.md as the canonical type registry. If someone adds a new draft type via the brief or self-track skill, this list silently goes stale.

**Options:**
1. **Add the missing values:** Update frontmatter type list to include `pre-read` and `performance-narrative`. Cleanest fix.
2. **Mark the list as non-exhaustive:** Add a note "see brief.md and self-track.md for additional types they generate." Less clean but avoids needing to maintain the list when new types appear.
3. **Remove the frontmatter type list entirely:** Each draft-generating skill defines its own frontmatter inline. Drop the central list. Reduces drift surface area but loses the at-a-glance reference.

**Recommended:** Option 1. The list is short enough to keep current. Adding two values is minimal overhead and preserves the at-a-glance reference value of having all types in one place.

---

#### [M02] sync.md doesn't specify the format for its lightweight prep items, risking format drift with prep-meeting.md

**Severity:** Minor
**File(s):** `agents/skills/sync.md` (lines 36-37), `agents/skills/prep-meeting.md` (lines 150-162), `agents/skills/brief.md` (line 110)
**Dimension:** Cross-File Consistency / Instruction Clarity

**Problem:** sync.md generates lightweight meeting preps but doesn't specify the format of the prep items it writes:

> "Generate a lightweight prep: (1) carry-forward items from previous session (unchecked prep items), (2) your open action items related to attendees or the meeting's project, (3) for 1:1s — any entries in the person's Pending Feedback section."

Compare with prep-meeting.md's worked example (line 150-162), which uses a specific bold-header format:
```
- [ ] **Follow-through:** You completed 2/3 action items. Still open: ...
- [ ] **Carry-forward:** Discuss caching strategy (unchecked from last session)
- [ ] **Recent work:** Sarah closed 4 tasks on auth-migration since Mar 28...
- [ ] **Pending feedback:** Strong incident response on March 30 outage
```

Two related risks:

1. **Cross-file format drift:** When prep-meeting.md runs in update mode and reads existing sync-written prep, it does a near-duplicate check ("same content, same person — and skip if already present"). If sync writes plain checkboxes (`- [ ] Discuss caching strategy`) and prep-meeting writes bold-headed checkboxes (`- [ ] **Carry-forward:** Discuss caching strategy (unchecked from last session)`), the dedup may fail and items may be duplicated.

2. **brief.md heuristic break:** brief.md's 1:1 Pattern Analysis "Topic source balance" heuristic (line 110, added in cycle 001) classifies prep items by formatting:
> "items with bold-header formatting (`**Follow-through:**`, `**Recent work:**`, `**Pending feedback:**`, etc.) are agent-generated; items with '(carried from {date})' are carry-forwards; plain `- [ ] {topic}` checkboxes are user-added."

   If sync.md writes plain checkboxes for its lightweight prep, those agent-generated items would be misclassified as user-added by the heuristic — inflating the user-engagement metric and making the agent-generated percentage look artificially low.

**Impact:** Low. In practice Claude will tend to use the bold-header format because it's the convention shown in prep-meeting.md's examples. But the spec doesn't enforce this, and a fresh Claude session reading sync.md alone has no signal to choose that format.

**Options:**
1. **Specify the format inline in sync.md** with the exact pattern matching prep-meeting.md: `- [ ] **Carry-forward:** {item}`, `- [ ] **Recent work:** {item}`, `- [ ] **Pending feedback:** {item}`. One line per type.
2. **Add a brief Rules note** in sync.md: "Lightweight prep items use the same bold-header format as prep-meeting.md (`**Carry-forward:**`, `**Recent work:**`, `**Pending feedback:**`) so the dedup check and brief.md's topic-source heuristic work consistently across sync- and prep-meeting-written prep."
3. **Leave as-is and accept that sync's prep is loose-format.** Update brief.md's heuristic to also recognize sync-written items.

**Recommended:** Option 2. A short Rules note keeps sync.md focused on what it does and explicitly references the consistency requirement. The format itself is already documented in prep-meeting.md's examples — sync.md just needs to point at it.

---

#### [M03] brief.md performance narrative default time period (6 months) doesn't match the feature spec (3 months)

**Severity:** Minor
**File(s):** `agents/skills/brief.md` (line 118)
**Dimension:** Feature Completeness

**Problem:** brief.md's Performance Narrative procedure says:
> "Determine time period — user may specify 'for H1', 'for Q1', 'since January'. Default: last 6 months."

Compare with the feature spec in `docs/features/people-management.md` (the authoritative spec, not deployed):
> "Default time period: last 3 months (configurable per request)"

These differ — 6 months vs 3 months. Both are arbitrary defaults that work, but the feature spec is the source of truth for sub-feature details.

**Impact:** Low. Users will adjust the period anyway for their actual review cycle. But if someone configures brief.md based on the feature spec's promised default, they'll get a different result. A user expecting "the last quarter's performance narrative by default" gets "the last 6 months" instead.

**Options:**
1. **Match the feature spec — change brief.md default to 3 months.** Aligns the deployed artifact with the source spec.
2. **Update the feature spec to say 6 months.** Keeps the current implementation and updates the spec to reflect what shipped.
3. **Make it explicit and configurable.** Use a workspace.yaml field like `performance_narrative_default_months: 3`. Adds config complexity for marginal benefit.

**Recommended:** Option 1. The feature spec is the contract. 3 months ≈ 1 quarter is a more common review cycle anyway. Quick fix with no downstream impact since the period is overridable per request.

---

#### [M04] wrap-up.md self-reflection prompts mention feedback gaps without checking the `feedback_gap_detection` toggle

**Severity:** Minor
**File(s):** `agents/skills/wrap-up.md` (line 69)
**Dimension:** Config & System / Cross-File Consistency

**Problem:** wrap-up.md's Weekly Summary procedure step 4 lists items for the Self-Reflection section:
> "**Self-Reflection:** agent-generated prompts based on the week's patterns — time allocation balance (meeting-heavy days vs focus days), feedback gaps (days since last feedback to each direct report, if manager), delegation health (overdue delegations trend), recurring carry-overs (tasks carried 3+ times)"

The "feedback gaps" item references the same feedback gap concept that's gated everywhere else by `features.feedback_gap_detection` (wired in cycle 001 [I01] fix in brief.md and prep-meeting.md). But wrap-up.md doesn't check this toggle before generating the feedback gap reflection.

If a user disables `feedback_gap_detection`, they'll still see feedback gap reflections in their weekly summary — the very thing they tried to silence.

**Impact:** Low. The feature toggle was added so users could turn off feedback nudges; the user discovers the wrap-up reflection ignores the toggle only after disabling it. Inconsistent with cycle 001's intent.

**Options:**
1. **Add toggle check in wrap-up.md:** Before listing feedback gaps in Self-Reflection prompts, check `features.feedback_gap_detection`. If disabled, omit the feedback gap reflection (still generate the other reflection prompts). One sentence change.
2. **Remove "feedback gaps" from wrap-up's Self-Reflection prompts entirely.** Brief.md and prep-meeting.md already cover feedback gap surfacing; the weekly reflection doesn't need to repeat it.
3. **Leave as-is** and document that wrap-up doesn't gate this — wrap-up reflection is "always on" and a different concept from the moment-of-meeting nudges.

**Recommended:** Option 1. Consistent with the cycle 001 fix that wired the toggle to its actual function. A user who disables feedback_gap_detection wants all feedback gap nudges silenced, not just the ones at meeting-prep time. The fix is small and matches existing pattern.

---

#### [M05] process-meeting.md `[Processed]` marker scope is ambiguous for 1-1 files with multiple sessions

**Severity:** Minor
**File(s):** `agents/skills/process-meeting.md` (lines 28, 94)
**Dimension:** Edge Cases / Instruction Clarity

**Problem:** process-meeting.md uses a `[Processed]` marker to track which meetings have been processed in batch mode:

**Step 1 (Locate, batch path):**
> "scan `Meetings/1-1s/`, `Meetings/Recurring/`, `Meetings/Adhoc/` for files with a `## {today's date} Session` header that has a Notes section with content but no `[Processed]` marker."

**Step 7 (Mark as Processed):**
> "After processing, append a marker below the Notes section: `*[Processed {YYYY-MM-DD}]*`. This prevents reprocessing in batch mode."

The two work fine for `Recurring/` and `Adhoc/` files (one session per file). But 1:1 files (`Meetings/1-1s/{person-name}.md`) have one file per person with sessions appended chronologically — many `## {date} Session` headers in one file, each with its own Notes and marker.

The scan logic doesn't disambiguate marker scope. Consider a 1:1 file with:
```
## 2026-03-28 Session
### Prep: ...
### Notes: ...content...
*[Processed 2026-03-28]*

## 2026-04-06 Session
### Prep: ...
### Notes: ...content...
(no marker yet — needs processing)
```

When the agent runs `process my meetings` on 2026-04-06, the scan should find this file (the 2026-04-06 session has notes content but no marker for that session). But the literal reading of "files... with a Notes section with content but no `[Processed]` marker" can be interpreted as "the file contains no `[Processed]` marker anywhere" — which would exclude this file because the Mar 28 marker is present.

Worse, an LLM doing the scan via search might match `[Processed]` substring at the file level, not the session level. Either:
- The file is mistakenly skipped (because a marker exists somewhere).
- The marker is appended in the wrong place (not below today's session).

**Impact:** Low for first-time use, increasingly noticeable over time. After a few weeks of 1:1 sessions, every 1-1 file has many markers; batch mode reliability degrades.

**Options:**
1. **Clarify the scan scope to be per-session:** Update step 1 batch instructions to: "scan `Meetings/1-1s/`, `Meetings/Recurring/`, `Meetings/Adhoc/` for any session with a `## {today's date} Session` header where the Notes content is non-empty and no `*[Processed {today's date}]*` marker appears below that session's Notes (within the session — before the next `## ` heading or end of file)." Be explicit that the marker is dated and per-session.
2. **Move the marker to frontmatter or per-session marker field:** Each session could carry its own metadata (e.g., a `processed: 2026-04-06` line in the session header). More structured but changes the meeting file template.
3. **Use file-level "last processed date" frontmatter:** Add `last_processed: 2026-04-06` to file frontmatter. The scan checks if the file has been processed for today. Simpler but loses per-session granularity if multiple sessions in one day (rare but possible for batch reprocessing).

**Recommended:** Option 1. Minimal change, keeps the existing marker format, just clarifies scope. The marker is already dated (`*[Processed 2026-04-06]*`), so an LLM interpreting "session-scoped" can find it correctly. The fix is a wording clarification in the scan step.

---

## Passed Checks

**Feature Completeness:** All 14 skills cover their assigned features from architecture.md. Re-cross-referenced every skill against its "Features covered" line and the corresponding feature spec files. Cycle 001 and 002 fixes (feedback_gap_detection toggle wiring, [Review] prefix, person/project file fallback chains, audit logging documentation, unreplied tracker clarification) are correctly maintained. The performance narrative period default mismatch (M03) is the only feature-spec divergence found.

**Instruction Clarity:** All procedures have clear decision criteria, explicit branching, and edge case handling. The reply-needed routing ambiguity (I01) and process-meeting marker scope (M05) are the two clarity gaps found. Sync's prep format (M02) is a third minor gap.

**Golden Rule Compliance:** Skills focus on what/where/when/what-not-to-do. Minimal over-specification of LLM natural abilities. The cycle 001 inlined formats (draft, calendar three-layer protection) and cycle 002 documentation (audit logging rationale) all hold the line — no over-specification has crept in.

**Cross-File Consistency:** Most extraction skills (process, process-meeting, capture, wrap-up, review) defer to conventions.md for entry formats. Timeline, observation, recognition, contribution, and task formats are canonical. The reply-needed routing (I01), draft type list (M01), and sync prep format (M02) are the consistency gaps.

**Edge Cases:** First-run handling, missing files, re-run behavior, missing MCPs, bulk operations, ambiguous resolution — all covered. The 1-1 multi-session marker scope (M05) is the one edge case missed.

**Safety:** Draft-never-send enforced across all skills. Vault-only writes consistently enforced. External content framing delimiters present in all skills that read external data (process, triage, draft, draft-replies). Calendar three-layer protection complete in calendar.md. Confirmation policy for bulk writes in safety.md, process.md, and draft-replies.md. No skill chaining — explicit rules in main.md, sync.md, and individual skill Rules sections. The auto-resolve mechanism in process.md (I01) doesn't introduce a safety issue — just a flow correctness issue.

**Output Usefulness:** All skills produce specific, countable summaries with file links (Obsidian URI and disk path). Brief modes have clear density guidance. Output steering ensures concise, no-filler responses.

**Claude Behavioral Fit:** Anti-verbosity rules in output.md, scope boundaries in each skill, no-skill-chaining rules in main.md and sync.md, confirmation policy in safety.md. Planning mode output is "inline advice — 5-7 bullet points maximum." Wrap-up's Quick Notes prompt has explicit "ask once and proceed" guidance.

**Provenance & Conventions:** All skills defer to conventions.md for marker rules and entry formats. Source reference format (compact) is consistent. Append-only discipline respected across all files. Carry-forward creates copies with "(carried from {date})" notation. The conventions.md task example (with `[Inferred] — description note`) is correctly mirrored by process.md's instruction about description notes for inferred fields.

**Config & System:** All 17 feature toggles in workspace.yaml.example are checked by their respective skills (verified one by one): email_processing, messaging_processing, email_triage, meeting_prep, process_meeting, time_blocks, calendar_reminders, people_management, self_tracking, team_health, attention_gap_detection, feedback_gap_detection, contribution_detection, milestones, weekly_summary, monthly_updates, park_resume. The wrap-up reflection (M04) is the one inconsistency. Graceful degradation for missing MCPs is per-skill. Config field names match workspace.yaml schema. Relative dates resolved to absolute.

**Steering Files:** All 4 steering files are comprehensive, actionable, and correctly scoped. No conflicts between steering rules and skill-specific rules. The cycle 001 lint fixes (self-containment) and cycle 002 fixes hold.

**Main Agent:** Routing logic is thorough — Universal Done, inbox routing, ambiguous intent handling, safety refusals, fallback. Direct operations (search, link find, task completion, draft deletion, task move, file creation) are clear. The skill directory cross-references match actual skill files (lint check 4 confirms).

**Config Examples:** All 6 .yaml.example files have realistic sample data, inline comments, and correct field names matching what skills reference.

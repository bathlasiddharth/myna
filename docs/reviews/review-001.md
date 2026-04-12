# Myna Review — Cycle 001

**Date:** 2026-04-08
**Scope:** All agent artifacts — `agents/main.md`, `agents/steering/*.md`, `agents/skills/*.md`, `agents/config-examples/*.yaml.example`, `agents/claude-md-template.md`
**Files reviewed:** 24 files (1 main agent, 4 steering, 14 skills, 6 config examples, 1 template)
**Previous cycles:** None with cycle numbering. Previous reviews: `architecture-reviews.md`, `phase1-review.md`, `phase1-review-2.md` — issues from those reviews are not re-raised unless still present.

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Important | 3 |
| Minor | 4 |
| Nitpick | 0 |

**Convergence:** CONTINUE — 3 blocking issues.

---

## Phase 0 — Lint

### Errors Found and Fixed

| # | Check | File | Issue | Fix Applied |
|---|-------|------|-------|-------------|
| 1 | Self-containment | calendar.md:28 | Decision ID D003 reference | Removed "(D003)" — three-layer protection already described inline |
| 2 | Self-containment | calendar.md:45 | Decision ID D003 reference | Replaced "D003" with "calendar" |
| 3 | Self-containment | calendar.md:87 | Decision ID D003 reference | Replaced "Absolute — D003" with "This is absolute and non-negotiable" |
| 4 | Self-containment | draft-replies.md:61 | Design doc reference to foundations.md §2.9 | Inlined draft file format (frontmatter fields, tags, footer) |
| 5 | Self-containment | draft.md:38 | Design doc reference to foundations.md §2.9 | Inlined draft file format inline |
| 6 | Self-containment | draft.md:148 | Design doc reference to foundations.md §2.9 | Inlined full type list and format details |
| 7 | Self-containment | prep-meeting.md:132 | Decision ID D018 reference | Inlined the facts-not-judgments rule with examples |
| 8 | Required sections | draft-replies.md | Missing Output section | Added Output section with draft files, review TODOs, email moves, inline summary |
| 9 | Required sections | prep-meeting.md | Missing Output section | Added Output section with meeting file paths and inline summary format |
| 10 | Required sections | process-meeting.md | Missing Output section | Added Output section listing all 8 write destinations |
| 11 | Worked examples | calendar.md | No worked example section | Added full Worked Examples section with 3 examples (time block, reminder, task breakdown) |

### Warnings Reviewed

| # | Check | File | Issue | Action |
|---|-------|------|-------|--------|
| 1 | Safety keywords | draft-replies.md:71 | "send" in `Review and send` TODO template | Not concerning — TODO instructs the USER to send, consistent with draft-never-send |
| 2 | Safety keywords | draft-replies.md:72 | "send" in meeting invite TODO template | Same pattern — user action, not agent action |
| 3 | Safety keywords | draft-replies.md:85 | "send" in Output section TODO format | Same pattern |
| 4 | Safety keywords | draft.md:38 | "send" in review TODO template | Same pattern |
| 5 | Safety keywords | draft.md:102 | "post" in recognition draft description | Describes draft FORMAT (channel post), not Myna posting |
| 6 | Safety keywords | prep-meeting.md:153 | "Send" in worked example action item | Realistic example content — action item text |
| 7 | Safety keywords | process-meeting.md:152 | "Send" in worked example | Realistic example content |
| 8 | Safety keywords | conventions.md:49 | "send" in provenance example | Provenance marker example — data, not instruction |

**Lint summary:** 11 errors fixed, 8 warnings reviewed (all false positives). Final status: PASS (0 errors, 8 warnings remaining).

---

## Issues

### Important

#### [I01] `features.feedback_gap_detection` toggle is never checked by any skill

**Severity:** Important
**File(s):** `agents/skills/brief.md`, `agents/skills/prep-meeting.md`, `agents/skills/sync.md`, `agents/config-examples/workspace.yaml.example`
**Dimension:** Config & System

**Problem:** The workspace.yaml config defines `features.feedback_gap_detection: true` as a toggle, but no skill checks this toggle. Feedback gap detection currently happens in:
- `brief.md` line 50 — gated by `features.people_management`
- `prep-meeting.md` line 69 — gated by `features.meeting_prep`

If a user sets `feedback_gap_detection: false`, the feedback gap warnings will still appear because the gating toggle is different.

**Impact:** User cannot independently disable feedback gap warnings without disabling all of people management or meeting prep. Setting the toggle to `false` does nothing — a confusing user experience.

**Options:**
1. **Wire the toggle:** Add `features.feedback_gap_detection` checks in brief.md (before line 50) and prep-meeting.md (before line 69), so the specific toggle controls this behavior
2. **Remove the toggle:** Delete `feedback_gap_detection` from workspace.yaml.example and rely on `people_management` to gate it
3. **Document the mapping:** Add a comment in workspace.yaml.example noting that feedback gap detection is controlled by `people_management`

**Recommended:** Option 1. The toggle exists in the config schema, so it should work. Add checks in brief.md and prep-meeting.md. The toggle is granular and useful — a user might want people management features but find feedback gap reminders noisy.

---

#### [I02] brief.md Performance Narrative uses `[Self]` draft prefix for direct report narratives

**Severity:** Important
**File(s):** `agents/skills/brief.md` (line 131)
**Dimension:** Cross-File Consistency

**Problem:** Performance Narrative saves to `Drafts/[Self] Performance Narrative {person} {period}.md`. The `[Self]` prefix is used across the codebase for self-authored career documents (brag docs, self-reviews, promo packets). A performance narrative about a direct report is NOT a self-document — it's a people management document.

Quote: `Save to "Drafts/[Self] Performance Narrative {person} {period}.md".`

**Impact:** The draft folder mixes self-authored documents with manager-authored documents under the same `[Self]` prefix. Users browsing Drafts/ can't distinguish "my self-review" from "Sarah's performance review I wrote." The review calibration feature (line 137) searches for `[Self] Performance Narrative` drafts — this works but the naming is semantically wrong.

**Options:**
1. **Use a new type prefix:** Save to `Drafts/[Review] Performance Narrative {person} {period}.md` with `type: performance-narrative` in frontmatter
2. **Use the person's name as prefix:** Save to `Drafts/[People] {person} Performance Narrative {period}.md`
3. **Keep `[Self]` but document why:** Add a comment that `[Self]` covers all career-related documents, including those about reports

**Recommended:** Option 1. Add `performance-narrative` to the draft type list. Use `[Review]` prefix to distinguish from self-documents. Update the calibration search in line 137 to match `[Review] Performance Narrative`.

---

#### [I03] process.md missing explicit fallback for person file creation when template is absent

**Severity:** Important
**File(s):** `agents/skills/process.md` (line 61)
**Dimension:** Instruction Clarity / Edge Cases

**Problem:** process.md line 61 says: `"Create destination files from templates (via Obsidian MCP create-from-template) if they don't exist."` But it doesn't specify what to do when the person is in config but the template itself is missing from `_system/templates/`. Compare:

- `capture.md` line 128: "If the person is in people.yaml but has no vault file, create it from `_system/templates/person.md` using `create-from-template` before writing. If no template exists, use `write` to create a minimal file with frontmatter from people.yaml."
- `process-meeting.md` line 132: "If a person file doesn't exist: create it from the template in `_system/templates/person.md`. If the template doesn't exist, create a minimal person file with frontmatter from `people.yaml` and `#person` tag."

process.md lacks this fallback chain.

**Impact:** On a fresh vault where the install script hasn't run yet (or templates were accidentally deleted), process would fail silently or error when trying to create person files during email processing — the most common first-time workflow.

**Options:**
1. **Match capture.md's pattern:** Add explicit fallback: "If the template doesn't exist, create a minimal file with frontmatter from people.yaml and the `#person` tag"
2. **Add a shared note in Rules:** "Missing destination files: create from template if available, otherwise create minimal files with frontmatter from config"

**Recommended:** Option 1. Consistency across all three extraction skills (process, process-meeting, capture) on the same fallback chain.

---

### Minor

#### [M01] draft.md "Save and confirm" Common Pattern is a dense inline description after lint fix

**Severity:** Minor
**File(s):** `agents/skills/draft.md` (line 38)
**Dimension:** Instruction Clarity

**Problem:** After the lint fix inlined the draft format, line 38 is now a single dense sentence:
> `"When saved, use this file format — frontmatter: type, audience_tier, related_project, related_person, created date; tags: #draft #{type}; footer: *Source: {what prompted this draft}*."`

This is correct but harder for Claude to parse than a brief format block.

**Impact:** Low risk — Claude can parse this. But a structured format would be clearer and less error-prone.

**Options:**
1. **Use a brief indented format block** showing the frontmatter fields on separate lines
2. **Leave as-is** — the Output section (line 148) has the full type list as a secondary reference

**Recommended:** Option 1 if editing for other reasons; otherwise leave as-is.

---

#### [M02] brief.md 1:1 Pattern Analysis "topic source balance" metric relies on format inference

**Severity:** Minor
**File(s):** `agents/skills/brief.md` (line 110)
**Dimension:** Instruction Clarity

**Problem:** `"Topic source balance: categorize prep items as user-added, carried-from-previous, or agent-generated."` Distinguishing user-added from agent-generated requires Claude to infer from formatting patterns (agent items use bold headers like `**Follow-through:**`, user items are plain `- [ ] {topic}`). There is no explicit marker distinguishing origin.

**Impact:** Percentages may be slightly inaccurate. In practice, the formatting patterns are distinctive enough for reasonable accuracy.

**Options:**
1. **Add a heuristic note:** "Items with bold-header formatting (`**Follow-through:**`, `**Recent work:**`, etc.) are agent-generated. Plain checkboxes without formatting are user-added. Items with '(carried from {date})' are carry-forwards."
2. **Remove the metric** — it's interesting but hard to execute reliably

**Recommended:** Option 1. A brief heuristic makes the classification explicit without requiring format changes to meeting files.

---

#### [M03] Performance Narrative type not listed in conventions or Output section draft type list

**Severity:** Minor
**File(s):** `agents/skills/draft.md` (line 148), `agents/steering/conventions.md`
**Dimension:** Cross-File Consistency

**Problem:** draft.md line 148 lists all draft types: `email-reply, follow-up, status-update, escalation, recognition, meeting-invite, say-no, conversation-prep, monthly-update, self-review, promo-packet, brag-doc`. But `performance-narrative` is not in this list, despite being a document type generated by brief.md. If I02 is implemented with a new type, this list needs updating too.

**Impact:** Low — this is a secondary reference. Claude would still generate the correct frontmatter from brief.md's instructions.

**Options:**
1. **Add `performance-narrative` to the type list** in draft.md Output section
2. **Leave as-is** — brief.md defines its own frontmatter for performance narratives

**Recommended:** Option 1 if I02 is implemented. Keep all draft types listed in one canonical place.

---

#### [M04] sync.md attention gap thresholds are hardcoded without noting configurability

**Severity:** Minor
**File(s):** `agents/skills/sync.md` (lines 54-58)
**Dimension:** Config & System

**Problem:** Sync uses hardcoded thresholds: 45 days for observation gaps, 4 months for career development gaps. The `feedback_cycle_days` setting in workspace.yaml controls feedback gap thresholds elsewhere, but these attention gap thresholds are not configurable.

**Impact:** Minor — the thresholds are reasonable defaults. But if a user adjusts `feedback_cycle_days` to 14, they might expect attention gaps to also be more sensitive.

**Options:**
1. **Document as hardcoded:** Add a comment: "These thresholds are fixed in v1. feedback_cycle_days controls feedback gaps (in brief and prep-meeting), not attention gaps."
2. **Make configurable:** Add `attention_gap_days` and `career_gap_months` to workspace.yaml. Adds config complexity.

**Recommended:** Option 1. Keep v1 simple. Document the distinction.

---

## Passed Checks

**Feature Completeness:** All 14 skills cover their assigned features from architecture.md. Each sub-feature from the feature files has executable procedure steps. Cross-referenced every skill against its "Features covered" line — no gaps found.

**Safety:** All skills enforce draft-never-send, vault-only writes, and content framing for external data. Calendar three-layer protection is properly inlined after lint fixes. Confirmation policy for bulk writes is consistently applied.

**Cross-File Consistency:** All extraction skills (process, process-meeting, capture, wrap-up) defer to conventions.md for entry formats. No competing format definitions found. Shared vault destinations produce matching output formats.

**Golden Rule Compliance:** Skills focus on what/where/when/what-not-to-do. Minimal over-specification of LLM natural abilities. Procedure sections are goal-oriented with specific vault paths and decision criteria.

**Edge Cases:** First-run handling, missing files, re-run behavior, and bulk operations are addressed across all relevant skills. The daily note re-run pattern (prepend new snapshot) is consistent between sync, wrap-up, and plan-tomorrow.

**Output Usefulness:** All skills produce specific, countable summaries with file links. Brief modes have clear density guidance. Output steering ensures concise, no-filler responses.

**Claude Behavioral Fit:** Anti-verbosity rules in output.md, scope boundaries in each skill, no-skill-chaining rules in main.md and sync.md, and confirmation policy in safety.md all effectively counter Claude's tendencies.

**Provenance & Conventions:** All skills defer to conventions.md for marker rules. No skill defines its own provenance logic. Entry formats are canonical and consistent.

**Config & System:** All 17 feature toggles are checked by their respective skills — except `feedback_gap_detection` (I01). Graceful degradation is handled per skill when MCPs are unavailable.

**Steering Files:** All 4 steering files are comprehensive, actionable, and correctly scoped. No conflicts between steering rules and skill-specific rules.

**Main Agent:** Routing logic is thorough with explicit handling for ambiguous cases, safety refusals, Universal Done disambiguation, and out-of-scope requests. Direct operations are well-specified.

# Myna Review — Cycle 004

**Date:** 2026-04-10
**Scope:** All agent artifacts — `agents/main.md`, `agents/steering/*.md`, `agents/skills/*.md`, `agents/config-examples/*.yaml.example`, `agents/claude-md-template.md`
**Files reviewed:** 24 files (1 main agent, 4 steering, 14 skills, 6 config examples, 1 template)
**Previous cycles:** Cycles 001, 002, and 003 all ended CLEAN. Cycle 003 fixed 1 Important and 5 Minor issues. This cycle hunts for issues not caught in prior reviews.

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Important | 4 |
| Minor | 7 |
| Nitpick | 0 |

**Convergence:** CONTINUE — 4 blocking issues.

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

**Lint summary:** 0 errors found, 0 fixed. 8 warnings reviewed (all false positives, identical to cycles 001-003). Final status: PASS.

---

## Issues

### Important

#### [I01] Auto-tagging feature is specified everywhere but not operationalized in any skill

**Severity:** Important
**File(s):** `agents/steering/conventions.md` (line 179), `agents/main.md` (line 20), `agents/steering/system.md` (line 20), `agents/config-examples/tags.yaml.example`
**Dimension:** Feature Completeness / Config & System

**Problem:** The Auto-Tagging feature has a full specification and config file, but no skill implements the tag-application logic.

**What exists:**
- `main.md` line 20 reads `tags.yaml` at session start
- `system.md` line 20 lists `tags.yaml — auto-tagging rules`
- `conventions.md` line 179: "Inline `#tags` at the top of files (not YAML frontmatter arrays). Auto-applied by the tagging system based on `tags.yaml` rules."
- `tags.yaml.example` has rules for project-based, keyword-based, person-based, and source-based tags
- Feature file `docs/features/cross-domain.md` "Auto-Tagging" — listed as a v1 feature with no deferral

**What's missing:** No skill reads `tags.yaml` to apply its rules when creating or updating files. Skills that create files (sync.md, prep-meeting.md, main.md's File Creation direct op) use hardcoded tags from foundation templates (`#daily`, `#meeting #1-1`, `#project #{project-tag}`). The `{project-tag}` template placeholder is never filled in because no skill reads tags.yaml to resolve it. Keyword-based, person-based, and source-based tag rules are never evaluated at all.

**Impact:** A user who configures custom tag rules in tags.yaml sees none of them applied. `conventions.md` makes a promise ("auto-applied by the tagging system") that the runtime never keeps. Queries like "all files tagged #urgent" or "all files tagged #sarah-chen" return empty even when the content clearly matches the rules. The "tagging system" referenced in conventions.md does not exist — it's a phrase pointing to nothing.

This has been silently accepted in cycles 001-003, but it's a real gap. Either auto-tagging should be implemented in the skills that create/update files, or the feature should be explicitly deferred with a decision entry and conventions.md should stop promising it.

**Options:**
1. **Implement tag application in relevant skills.** Add a step in main.md's File Creation direct operation (and sync/prep-meeting file creation) that reads `tags.yaml` and applies matching rules: project-based when a project is known, keyword-based when the file content matches keywords, person-based when the content mentions a person, source-based when creation is triggered by an external source. The tag application logic is centralized in a single paragraph in conventions.md (the tagging system exists, here's how to invoke it) and each file-creating skill calls it. Also add a note to process.md that when creating a project/person file from config, it should apply project-based and source-based tags.
2. **Explicitly defer auto-tagging to post-v1.** Add a decision in `docs/decisions.md` deferring Auto-Tagging. Update `conventions.md` line 179 to remove the "auto-applied by the tagging system" claim (tags are manual or from templates only). Remove the "Auto-Tagging" entry from `cross-domain.md` features or mark it deferred. Keep `tags.yaml.example` as a reference for the future.
3. **Narrow the scope to project-based tags only** (the simplest case) and explicitly defer keyword-based, person-based, and source-based to post-v1. Implement a minimal tag application: when creating a project or person file from template, look up the project/person tag from `tags.yaml` and substitute the template placeholder. This covers the template placeholders currently in foundations.md without claiming more.

**Recommended:** Option 3. It closes the template-placeholder gap (the current templates have `{project-tag}` and `#{relationship-tier}` that nothing fills in) with minimal new behavior, and explicitly defers the more complex keyword/content-based tagging to post-v1. Update conventions.md line 179 to: "Inline `#tags` at the top of files. When creating project or person files from template, apply project-based and person-based tags from `tags.yaml` as the template placeholder values. Keyword-based and source-based auto-tagging are deferred to post-v1." This matches what can be implemented cleanly without major skill changes.

---

#### [I02] Slack unreplied tracking in process.md uses email-specific criteria that never trigger for Slack messages

**Severity:** Important
**File(s):** `agents/skills/process.md` (lines 55, 86), `docs/features/email-and-messaging.md` (Unreplied Tracker section)
**Dimension:** Feature Completeness / Instruction Clarity

**Problem:** The Unreplied Tracker feature specifies that messaging processing should populate reply-needed TODOs, but process.md's criteria for creating them are email-specific and silently fail for Slack messages.

**process.md step 4d** (creating reply-needed TODOs):
> "Create a TODO with `type:: reply-needed` if ALL of these are true: (1) you are in the To or CC field (matched against `user.email`), AND (2) the email contains a direct question to you, an explicit request for your input/decision/approval, or a request from a direct report implying they are waiting on you."

**process.md step 8** (messaging processing):
> "For each message, apply the same extraction logic as email (steps 4b-4f), including unreplied tracking (step 4d) and meeting summary detection (step 4c)."

The problem: Slack messages have no "To" or "CC" field. The criterion `(1) you are in the To or CC field (matched against user.email)` can never be true for Slack. A fresh Claude reading step 4d applied to Slack would either (a) fail the check literally and skip Slack unreplied tracking entirely, or (b) attempt a loose interpretation and produce inconsistent results.

**Feature spec** (`email-and-messaging.md`):
> "**How it gets populated:** during email processing, messaging processing, or email triage, the agent flags messages that need a reply from you."

The feature explicitly covers messaging processing. The implementation does not.

**Impact:** Users processing Slack messages expect reply-needed TODOs to be created for DMs requiring their response and for @mentions asking for input. Instead, no Slack-originated reply-needed TODOs are created. The "Waiting on you" list in brief.md's Unreplied Tracker silently misses all Slack-based items. This is the kind of silent feature gap that a user wouldn't notice until weeks later when they're looking for a reply tracking item that should be there.

**Options:**
1. **Broaden step 4d's criteria to handle both email and Slack.** Rewrite the condition as:
   ```
   (1) the message is directed at you — for email: you are in the To or CC field (matched against user.email); for Slack: the message is a DM to you, @mentions you explicitly, or comes from a direct report in a 1:1 channel, AND (2) {the rest of the condition, unchanged}
   ```
   Step 4d becomes source-aware. Step 8's "apply the same logic" reference stays valid.
2. **Add a Slack-specific unreplied tracking step under messaging processing.** Step 8 already diverges from email (no quote stripping, no folder moves). Add a sub-step 8.x that explicitly handles Slack unreplied tracking with Slack-appropriate criteria (DM, @mention, direct-report channel). Step 4d stays email-only and step 8 has its own parallel logic.
3. **Defer Slack unreplied tracking to post-v1.** Update process.md step 8 to explicitly exclude unreplied tracking for Slack, and update brief.md's Unreplied Tracker description to note it's email-only in v1. This preserves correctness at the cost of scope.

**Recommended:** Option 1. The feature spec clearly expects both email and Slack, and the logic difference is small enough to inline. Step 4d already has a multi-part condition — extending part (1) to be source-aware adds one clause without restructuring. This is the simplest change that makes the feature actually work as documented.

---

#### [I03] Review queue entry format not specified in any runtime-context file; skills writing to queues have no format guidance

**Severity:** Important
**File(s):** `agents/steering/conventions.md`, `agents/skills/capture.md`, `agents/skills/process.md`, `agents/skills/process-meeting.md`, `agents/skills/wrap-up.md`, `agents/skills/review.md`
**Dimension:** Cross-File Consistency / Instruction Clarity

**Problem:** Five skills route items to `review-work.md`, `review-people.md`, or `review-self.md`, but none specify the entry format. The `review.md` skill reads these queues expecting a specific structure (bold heading, Source, Interpretation, Ambiguity, Proposed destination), but the canonical format is only in `foundations.md` §2.10 — which is NOT in the agent runtime context (only skills, steering, and main.md are loaded at runtime).

**review.md** expects the format (line 37):
> "For each item show:
>    - The proposed action (bold heading from the entry)
>    - Source reference
>    - What's ambiguous and why
>    - Proposed destination"

**review.md example** (line 96-104):
```
**review-work (1/3):** Task "review caching approach" — can't determine owner.
Source: email from Alex, 2026-04-03.
Ambiguity: Email says "we should review this" — unclear if assigned to you or Alex.
Proposed destination: Projects/platform-api.md, Open Tasks section.
```

**But skills that write to queues say nothing about format:**
- `capture.md` line 38: "If the destination is genuinely ambiguous, route to the appropriate review queue"
- `process.md` line 71: "Genuinely ambiguous entries → route to `review-work.md`, `review-people.md`, or `review-self.md`"
- `process-meeting.md` line 142: "Route to `ReviewQueue/review-work.md` for task/project ambiguity..."
- `wrap-up.md` line 41: "Genuinely uncertain (can't tell if you contributed or just observed) → route to `ReviewQueue/review-self.md`"

None of these say what the entry should look like. Conventions.md Canonical Entry Formats section covers Timeline, Observations, Recognition, Contributions, and Tasks Plugin Syntax — but NOT review queue entries.

**Impact:** A fresh Claude session executing process.md would invent an entry format. The format would drift between skills and between runs. When the review.md skill later tries to present items, it may fail to extract the expected fields (source, interpretation, ambiguity, destination) because they aren't there in a consistent way. Users editing queue entries in Obsidian (file mode) would see inconsistent layouts. Cross-skill consistency on review queue output is currently unenforced at runtime.

This is a gap that only surfaces when: (a) one skill writes a queue entry, (b) another skill (or run) reads it, and (c) the reader expects a specific field. The existing review.md worked example happens to show the canonical format, but that's not a spec — it's an example.

**Options:**
1. **Add a "Review Queue Entries" sub-section to conventions.md Canonical Entry Formats** with the full format spec:
   ```
   ### Review Queue Entries (review-work.md, review-people.md, review-self.md)

   - [ ] **{proposed action}**
     Source: {email/slack/meeting/capture reference with date and identity}
     Interpretation: {what the agent thinks this is}
     Ambiguity: {why it's in the queue — what's unclear}
     Proposed destination: {file path and section where it would be written if approved}
   ```
   Skills writing to queues defer to conventions.md like they do for other formats. Matches the existing pattern.
2. **Inline the format in every skill that writes to queues.** Each of the 4 writing skills gets a "Review queue entry format" block. More repetition but each skill is fully self-contained without depending on conventions.md being read.
3. **Leave review.md's worked example as the de facto spec.** A fresh Claude reading review.md and then writing to queues would mirror the example format. This relies on implicit convention-by-example and doesn't scale.

**Recommended:** Option 1. The canonical format pattern already exists in conventions.md (Timeline, Observations, Recognition, Contributions, Tasks) — adding Review Queue Entries fits the established structure. One source of truth, skills stay brief, cross-file consistency enforced. review.md's worked example stays as illustration but the authoritative format is in conventions.md.

---

#### [I04] main.md Task Completion and Task Move direct operations only search "project files," missing tasks in daily notes

**Severity:** Important
**File(s):** `agents/main.md` (lines 196-198, 208-215), `agents/skills/capture.md` (line 68, 126), `agents/skills/process.md` (line 63)
**Dimension:** Edge Cases / Feature Completeness

**Problem:** The main agent's Task Completion and Task Move direct operations restrict their search scope to project files, but Myna explicitly allows tasks to live in daily notes when no project context is available.

**main.md Task Completion** (lines 196-198):
> "**Task Completion** — 'Done with [task]' (when resolved as a task, not a meeting)
>
> Find the matching TODO in project files using fuzzy matching. Mark it as complete (`- [x]`). Confirm: 'Marked complete: {task description} in {file}.'"

**main.md Task Move** (line 210):
> "1. Find the task using fuzzy matching in **source project files**."

**But capture.md** (line 126, Rules) says:
> "**Tasks without a project** go in today's daily note, not in a project file."

**And process.md** (line 63, reply-needed tracking):
> "If the project can't be resolved, write to today's daily note instead."

**And capture.md step 4** (line 68):
> "If no project can be determined, append to today's daily note."

So both user-typed tasks (via capture) and agent-extracted tasks (via process) can legitimately end up in the daily note. When the user later says "done with that personal reminder," the Task Completion direct operation searches only project files and fails to find the task.

**Impact:** A user creates "add task: call the dentist next week" via capture — no project context, task goes to daily note. Later: "done with the dentist call." The main agent follows the Task Completion spec, searches project files, finds nothing, and either reports failure or asks the user to clarify which task. The user knows the task exists (they created it), but the direct operation can't find it because of the artificial scope restriction. Same issue for Task Move from a daily note to a project file.

**Options:**
1. **Broaden the scope to include daily notes.** Update main.md Task Completion to: "Find the matching TODO in project files AND today's daily note (and recent daily notes for items that may have been carried forward) using fuzzy matching." Same update for Task Move source search.
2. **Use the Obsidian MCP `tasks` query instead of scoped file search.** The `tasks` tool queries across all markdown files in the vault and finds all matching TODOs regardless of location. Main.md already references the `tasks` MCP tool elsewhere. Update Task Completion to: "Query via the Obsidian `tasks` MCP tool for tasks matching the description. Use fuzzy matching on the task description. Mark as complete via `property_set` (or the equivalent task-completion tool)." This has the side benefit of also handling tasks in meeting files, review queue processed files, and anywhere else tasks might live.
3. **Keep the scope narrow and change capture.md/process.md to always require a project.** If tasks always go to project files (creating a default "Personal" project if needed), the direct operation's narrow scope is correct. But this contradicts the current design intent and adds complexity.

**Recommended:** Option 2. The `tasks` MCP tool is the right abstraction — it's designed exactly for "find tasks across the vault." Using it for Task Completion and Task Move eliminates the file-location coupling and makes the operation robust to wherever tasks end up. Main.md Direct Operations section should be updated to reference `tasks` for both Task Completion and Task Move, with fuzzy matching on the description.

---

### Minor

#### [M01] prep-meeting.md lists `debrief_type` in Inputs but never uses it in the Procedure

**Severity:** Minor
**File(s):** `agents/skills/prep-meeting.md` (line 21)
**Dimension:** Golden Rule Compliance / Instruction Clarity

**Problem:** prep-meeting.md's Inputs section mentions `debrief_type`:

> "- **meetings.yaml**: type overrides, project associations, aliases, `debrief_type`"

But nothing in the Procedure uses `debrief_type`. It's used in process-meeting.md step 2 ("If `debrief_type` is set in meetings.yaml, use it to customize extraction emphasis"), which makes sense — debrief_type is for processing, not prep. Listing it as a prep-meeting input is misleading.

**Impact:** Low. A fresh Claude reading prep-meeting.md might try to apply debrief_type during prep generation and find no procedural home for it. Minor noise in the Inputs list that implies capability prep-meeting doesn't have.

**Options:**
1. **Remove `debrief_type` from prep-meeting.md Inputs.** Simplest fix. The field stays in meetings.yaml for process-meeting's use only.
2. **Add a prep-time use for debrief_type.** E.g., debrief_type could influence prep depth (design-review gets pre-read prep added, standup skips carry-forward). But this conflates the two phases and duplicates what type inference already does.

**Recommended:** Option 1. debrief_type is specifically for processing-time emphasis, not prep-time. Remove the dead reference from prep-meeting.md's Inputs line.

---

#### [M02] wrap-up.md weekly note creation refers to "sync's weekly note creation" — self-containment violation

**Severity:** Minor
**File(s):** `agents/skills/wrap-up.md` (line 58)
**Dimension:** Instruction Clarity / Cross-File Consistency

**Problem:** wrap-up.md Weekly Summary step 1 says:

> "Read the current weekly note `Journal/WeeklyNote-{monday-date}.md`. If it doesn't exist, create it (same process as sync's weekly note creation)."

But sync.md is not loaded when wrap-up is active — skills are read on demand per the progressive disclosure model (see INSTALL-NOTES.md and architecture.md §11). A fresh Claude session invoking wrap-up has only wrap-up.md, steering files, and main.md in context — not sync.md. The phrase "same process as sync's weekly note creation" references an absent file.

**Impact:** Low. Claude can infer what "create the weekly note" means from the filename pattern and foundations.md templates baked into context indirectly, but the reference is technically broken. If wrap-up runs without sync having run earlier, this step produces inconsistent output.

Also worth noting: wrap-up doesn't need sync's full weekly note creation process (which includes capacity table population from calendar data and carry-forwards from last week). Wrap-up just needs frontmatter and the sections it's about to append to. So replicating sync's full procedure would be wrong anyway.

**Options:**
1. **Inline the minimal weekly note creation in wrap-up.md.** Something like: "If it doesn't exist, create `Journal/WeeklyNote-{monday-date}.md` with frontmatter `week_start: {monday-date}`, `#weekly` tag, and empty sections: Week Capacity, Weekly Goals, Carry-Forwards. Wrap-up does not populate the Week Capacity table or Carry-Forwards — those are sync's responsibility. Wrap-up's job is to append the Weekly Summary section."
2. **Defer all weekly note creation to sync and have wrap-up fail gracefully.** If the weekly note doesn't exist when wrap-up runs, tell the user to run sync first. This pushes the responsibility cleanly to sync but adds user friction.
3. **Use `create-from-template` via the Obsidian MCP.** Main.md's File Creation operation uses templates from `_system/templates/`. If a weekly note template exists, wrap-up can just invoke template creation with `{monday-date}` as the substitution. This is self-contained and consistent with the template pattern elsewhere. Add: "If it doesn't exist, create from `_system/templates/weekly-note.md` (if the template exists, via `create-from-template`; otherwise write a minimal note with frontmatter `week_start` and `#weekly` tag)."

**Recommended:** Option 3. Template-based creation matches what main.md and sync.md do for other file types, and doesn't require wrap-up.md to replicate sync's logic. If no template exists, the fallback to minimal creation still works. This also fixes the self-containment issue without duplicating sync's procedure.

---

#### [M03] capture.md task type list is missing `reply-needed` — inconsistent with conventions.md and brief.md's suggestion

**Severity:** Minor
**File(s):** `agents/skills/capture.md` (line 65), `agents/steering/conventions.md` (line 222), `agents/skills/brief.md` (line 155)
**Dimension:** Cross-File Consistency

**Problem:** capture.md step 4 (Task Creation) lists the valid task types:

> "Extract task attributes from natural language: title, project, priority, start date, due date, **type (task, delegation, dependency)**, person (for delegations), effort estimate."

But conventions.md line 222 defines the full set of valid types:

> "`[type:: {task | delegation | dependency | reply-needed | retry}]` — task type"

And brief.md line 155 (Unreplied Tracker) tells users to create reply-needed tasks via capture:

> "To track a message you're waiting on, say 'add task: waiting for reply from [person] about [topic]' with type reply-needed."

If the user follows brief.md's suggestion and says "add task: waiting for reply from Marcus about deployment timeline," capture.md's type list (task, delegation, dependency) doesn't include reply-needed, so Claude would either (a) skip the type or (b) pick the closest from the list (delegation? task?). Neither matches brief.md's expectation.

**Impact:** Low. Claude likely picks `reply-needed` anyway because conventions.md has it in the canonical list and the user explicitly said so. But capture.md's type list is incomplete and misleads the skill's own scope.

**Options:**
1. **Add `reply-needed` to the capture.md type list.** Update to: "type (task, delegation, dependency, reply-needed)". The retry type is agent-generated (by error recovery, not by user capture), so it stays out of the capture list.
2. **Add both `reply-needed` and `retry`.** Full consistency with conventions.md. Slight misleading since users don't create retry tasks directly.
3. **Remove the type list from capture.md and defer to conventions.md.** "Extract task attributes including type (see conventions.md Tasks Plugin Syntax for valid types)." Less explicit but avoids the drift.

**Recommended:** Option 1. capture.md should list the types the user might actually request. reply-needed is user-requestable (per brief.md's suggestion). retry is agent-only. Add reply-needed, keep retry out.

---

#### [M04] Confirmation policy thresholds inconsistent across safety.md, process.md, and draft-replies.md

**Severity:** Minor
**File(s):** `agents/steering/safety.md` (line 49), `agents/skills/process.md` (line 72), `agents/skills/draft-replies.md` (line 32)
**Dimension:** Cross-File Consistency

**Problem:** The bulk-write confirmation threshold is worded inconsistently.

**safety.md** line 49:
> "Bulk writes (a single operation writing to **more than 5** vault files) — show a summary of what will be written and where before executing"

**process.md** line 72:
> "If writing to **5+ files** in a batch or processing 10+ emails, show a summary table..."

**draft-replies.md** line 32:
> "**Bulk write check.** If **5+ emails** are in the folder, show a summary of what will be created..."

"More than 5" means 6 or more. "5+" means 5 or more. These are different thresholds by one file. safety.md is the authoritative steering file, but process.md and draft-replies.md don't match its wording.

**Impact:** Very low in practice — Claude will likely err on the side of confirmation for borderline cases. But the inconsistency is a documentation smell that could confuse a fresh reader trying to understand the rule.

**Options:**
1. **Align all three to safety.md's "more than 5."** Update process.md to "more than 5 files or processing 10 or more emails" and draft-replies.md to "more than 5 emails." Safety is the authoritative source.
2. **Align safety.md to the skills' "5+."** Update safety.md to "5 or more vault files." This is slightly more conservative (triggers confirmation one file earlier). The stricter version is probably safer given the purpose of the rule.
3. **Use a clear phrasing everywhere.** "6 or more" and "5 or more" are unambiguous; "5+" and "more than 5" are natural language where the intent gets lost. Pick one phrasing and use it consistently.

**Recommended:** Option 2. Safer default (triggers one file earlier) and aligns with how skills currently implement it. Update safety.md Confirmation Policy to: "Bulk writes (a single operation writing to 5 or more vault files)" — eliminates the "more than" ambiguity. Process.md and draft-replies.md stay as they are. Also update process.md's "5+ files" to "5 or more files" and draft-replies.md's "5+ emails" to "5 or more emails" for uniform phrasing, but the threshold itself doesn't change.

---

#### [M05] wrap-up.md example uses source value `wrap-up` which is not in conventions.md's approved source list

**Severity:** Minor
**File(s):** `agents/skills/wrap-up.md` (lines 95-96), `agents/steering/conventions.md` (lines 164-169)
**Dimension:** Cross-File Consistency

**Problem:** wrap-up.md's example End of Day section shows contributions with source value `wrap-up`:

> "- [2026-04-06 | wrap-up] **decisions-and-influence:** Completed API spec review ahead of schedule [Auto]
> - [2026-04-06 | wrap-up] **unblocking-others:** Resolved caching question that was blocking platform team [Inferred]"

But conventions.md line 164-169 defines the approved source values:

> "**Source values:**
> - `email` — from email processing. Add sender: `email from Sarah`
> - `slack` — from Slack processing. Add channel or person: `slack #auth-team`
> - `meeting` — from meeting processing. Add meeting name: `meeting 1:1 with Sarah`
> - `capture` — from quick capture or user-typed input
> - `user` — user typed directly into a file (not through the agent)"

`wrap-up` is not in the approved list. wrap-up.md also has a Rules entry (line 120): "**Entry formats follow conventions.md.** All vault entries (contributions, timeline, tasks) use the canonical formats defined in conventions.md." So wrap-up.md explicitly says to follow conventions.md — but its own worked example violates the approved source list.

**Impact:** Low in practice — Claude will produce contributions with "wrap-up" as source because that's what the example shows, and the entries still have a valid-looking source. But when someone later audits the vault or writes a dashboard that filters by source, `wrap-up` entries won't match any of the 5 canonical source types. Consistent format rules exist specifically to make the vault auditable and queryable; this example undermines that.

**Options:**
1. **Add `wrap-up` to conventions.md's approved source list.** Treat wrap-up's end-of-day scan as a distinct source type: "`wrap-up` — from end-of-day scanning (contributions detected from completed work)". Update wrap-up.md to explicitly state this is the source value it uses. This makes the format consistent.
2. **Change wrap-up.md to use `capture` as the source.** "Capture" currently means "quick capture or user-typed input" — wrap-up's scan isn't user-typed, so this is a stretch. Broadens `capture` to mean "any non-external-source logging."
3. **Trace contributions to their original source.** Wrap-up detects contributions from completed tasks — each task has an original source (email, meeting, or user). The contribution entry should use the original source. More accurate but more complex: wrap-up has to look up each task's source header.

**Recommended:** Option 1. wrap-up's scan is a distinct source category (agent-triggered end-of-day review, not external data extraction). Adding it to the canonical list acknowledges the reality of how contributions get logged and keeps the source-value set complete. Update conventions.md "Source values" list to add `wrap-up` with description "from end-of-day scanning (agent-detected contributions from completed work)". Same treatment could be extended to `self-track` if that skill ever emits entries via a similar aggregation pass — but for now wrap-up is the only one that needs it.

---

#### [M06] calendar.md doesn't specify fallback defaults for `calendar_event_types` labels

**Severity:** Minor
**File(s):** `agents/skills/calendar.md` (lines 15, 29, 43)
**Dimension:** Config & System / Edge Cases

**Problem:** calendar.md uses `calendar_event_types` labels from workspace.yaml for building event titles:

**Inputs** (line 15):
> "`calendar_event_prefix` (default `[Myna]`), `calendar_event_types` (focus/task/reminder labels)"

**Procedure** (line 29):
> "Format: `{calendar_event_prefix}:{calendar_event_types.focus}` for focus blocks, `{calendar_event_prefix}:{calendar_event_types.task}` for task blocks."

**Procedure** (line 43):
> "Title format: `{calendar_event_prefix}:{calendar_event_types.task}` for task reminders (e.g., `[Myna:Task] Design review`), `{calendar_event_prefix}:{calendar_event_types.reminder}` for standalone (e.g., `[Myna:Reminder] Call Alice`)."

`calendar_event_prefix` has a documented default (`[Myna]`). `calendar_event_types` does NOT — neither in calendar.md nor in workspace.yaml.example (where the example values are present but not marked as defaults). If a user customizes workspace.yaml and removes `calendar_event_types` or any of its sub-fields, calendar.md substitutes an empty string and produces titles like `[Myna]: Design doc review` — missing the type label, or worse, the pre-tool check (layer 2 of the calendar protection) might fail because the title format looks wrong.

**Impact:** Low. Most users won't remove `calendar_event_types` from workspace.yaml. But system.md's Config Loading rule says "If a config file is missing, degrade gracefully — use defaults where possible." calendar.md doesn't specify fallback defaults, so a fresh Claude session has no guidance for missing fields.

**Options:**
1. **Add explicit defaults to calendar.md.** Add a note at the top of the Time Block Planning and Calendar Reminders procedures: "If `calendar_event_types` is missing in workspace.yaml, use defaults: `focus: Focus`, `task: Task`, `reminder: Reminder`." Matches the pattern for `calendar_event_prefix`.
2. **Move defaults into conventions.md or system.md.** As cross-cutting config defaults. But these are calendar-specific, so the skill is the right place.
3. **Require `calendar_event_types` as mandatory config.** Add to the workspace.yaml schema as required. If missing, calendar.md fails with a clear error. Less graceful but simpler.

**Recommended:** Option 1. Inline the defaults in calendar.md for self-containment. One line at the top of the Time Block Planning procedure: "If `calendar_event_types` or any of its fields are missing, use defaults: `focus: Focus`, `task: Task`, `reminder: Reminder`." Matches the graceful degradation pattern in system.md without making users maintain the config.

---

#### [M07] brief.md 1:1 Pattern Analysis is missing the `features.people_management` toggle check

**Severity:** Minor
**File(s):** `agents/skills/brief.md` (lines 100-112), `agents/config-examples/workspace.yaml.example` (line 85)
**Dimension:** Config & System / Cross-File Consistency

**Problem:** brief.md gates most people-management sub-procedures behind `features.people_management`:

- **Person Briefing** (line 56): "If `features.people_management` is disabled, omit Pending feedback and Feedback gap sections."
- **Team Health Overview** (line 84): "Check `features.team_health` toggle. If disabled, tell the user and stop."
- **Performance Narrative** (line 116): "Check `features.people_management`. If disabled, tell the user and stop."

But **1:1 Pattern Analysis** (lines 100-112) has no toggle check. Its steps go directly to resolving the person and reading the meeting file.

1:1 Pattern Analysis is clearly people-management scope — it analyzes 1:1 meeting patterns per person. If a user disables `features.people_management` (e.g., an IC who doesn't want people-management features), 1:1 analysis should also be unavailable, matching the pattern applied to Person Briefing (partial gating) and Performance Narrative (full stop).

**Impact:** Low. A user who turns off people_management and then says "analyze my 1:1s with Sarah" will get the analysis output, contradicting their explicit feature preference. The `system.md` rule is "Disabled features are silently skipped — not mentioned, not suggested, not included in output." 1:1 Pattern Analysis violates this rule.

**Options:**
1. **Add a `features.people_management` check at the top of 1:1 Pattern Analysis.** "Check `features.people_management`. If disabled, tell the user and stop." Matches Performance Narrative's gating pattern.
2. **Introduce a dedicated `features.one_on_one_analysis` toggle.** Finer-grained control. But there's no existing toggle and it would clutter workspace.yaml.
3. **Gate only partially** (like Person Briefing does), returning a reduced output. But 1:1 analysis has nothing meaningful to say if people_management is off — the entire feature is people-specific.

**Recommended:** Option 1. Add the toggle check at step 1 of 1:1 Pattern Analysis. Matches Performance Narrative's pattern and is the cleanest way to respect the user's feature preference. Update step 1 to: "Check `features.people_management`. If disabled, tell the user and stop. Resolve the person name against `people.yaml`. If ambiguous, ask."

---

## Passed Checks

**Feature Completeness (mostly strong):** All 14 skills cover their assigned features from architecture.md. Cross-referenced every skill against its "Features covered" line. The gaps found (Auto-Tagging I01, Slack unreplied tracking I02) are the exceptions — everything else is covered. Cycle 001-003 fixes (feedback_gap_detection toggle wiring, [Review] prefix, draft type list, sync prep format, process-meeting marker scope, reply-needed TODO routing) all still hold.

**Instruction Clarity (strong with 3 gaps):** Most procedures have clear decision criteria, explicit branching, and edge case handling. The clarity gaps found are the Slack unreplied criteria (I02), review queue entry format (I03), and task completion scope (I04). The cycle 003 fix for process-meeting marker scope is correctly implemented.

**Golden Rule Compliance:** Skills continue to focus on what/where/when/what-not-to-do. No new over-specification creep. The cycle 001-002 inlined formats (draft, calendar three-layer protection, audit logging rationale) and cycle 003 formats (bold-header prep items, per-session marker) all hold the line.

**Cross-File Consistency (mostly strong):** Most extraction skills (process, process-meeting, capture, wrap-up, review) defer to conventions.md for entry formats. Timeline, observation, recognition, contribution, and task formats are canonical. The consistency gaps found are: auto-tagging (I01), review queue entries (I03), wrap-up source value (M05), capture task types (M03), confirmation thresholds (M04), and Slack unreplied criteria (I02). The fixes from cycle 003 (draft frontmatter type list, sync prep format, performance narrative period, feedback gap toggle wiring) all still hold consistently.

**Edge Cases (strong):** First-run handling, missing files, re-run behavior, missing MCPs, bulk operations, ambiguous resolution — all covered. The cycle 003 fix for 1:1 multi-session marker scope holds. The edge case missed this cycle is tasks living in daily notes (I04).

**Safety (strong):** Draft-never-send enforced across all skills. Vault-only writes consistently enforced. External content framing delimiters present in all skills that read external data (process, triage, draft, draft-replies). Calendar three-layer protection complete in calendar.md. Confirmation policy for bulk writes in safety.md, process.md, and draft-replies.md (with the minor threshold wording inconsistency in M04). No skill chaining — explicit rules in main.md, sync.md, and individual skill Rules sections. No new safety path issues introduced.

**Output Usefulness (strong):** All skills produce specific, countable summaries with file links (Obsidian URI and disk path). Brief modes have clear density guidance. Output steering ensures concise, no-filler responses. The format of outputs is stable across skills.

**Claude Behavioral Fit (strong):** Anti-verbosity rules in output.md, scope boundaries in each skill, no-skill-chaining rules in main.md and sync.md, confirmation policy in safety.md. Planning mode output is "inline advice — 5-7 bullet points maximum." Wrap-up's Quick Notes prompt has explicit "ask once and proceed" guidance. All consistent with cycle 001-003 expectations.

**Provenance & Conventions (mostly strong):** All skills defer to conventions.md for marker rules and entry formats. Source reference format (compact) is consistent for approved sources. Append-only discipline respected across all files. Carry-forward creates copies with "(carried from {date})" notation. The provenance gap found is wrap-up's non-canonical source value (M05).

**Config & System (mostly strong):** Of the 17 feature toggles in workspace.yaml.example, 16 are checked by their respective skills. The one found gap is 1:1 Pattern Analysis missing its people_management check (M07). Graceful degradation for missing MCPs is per-skill. Config field names match workspace.yaml schema. Relative dates resolved to absolute. The auto-tagging gap (I01) is a system-level gap — tags.yaml is loaded but never applied.

**Steering Files:** All 4 steering files remain comprehensive, actionable, and correctly scoped. The review queue entry format gap (I03) is a content gap in conventions.md, not a structural issue with the steering file itself.

**Main Agent:** Routing logic is thorough — Universal Done, inbox routing, ambiguous intent handling, safety refusals, fallback. Direct operations (search, link find, task completion, draft deletion, task move, file creation) are clear but the task scope gap (I04) is a correctness issue in two of the operations. The skill directory cross-references match actual skill files (lint check 4 confirms).

**Config Examples:** All 6 .yaml.example files have realistic sample data, inline comments, and correct field names matching what skills reference. No issues this cycle.

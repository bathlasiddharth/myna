# Myna Verify Report — Cycle 004

**Date:** 2026-04-10
**Review:** `docs/reviews/review-004.md`
**Fix report:** `docs/reviews/fix-004.md`

## Issue Verification

### [I01] Auto-tagging not operationalized
**Fix action:** Implemented Option 3 — narrow to project-based/person-based, defer keyword/source-based
**Verdict:** Resolved

**Evidence:** `conventions.md` Tags section (lines 197-210) now reads:

> "Inline `#tags` at the top of files (not YAML frontmatter arrays).
>
> ```
> #project #auth-migration #from-email
> ```
>
> **Tag application at file creation.** When creating a new project file or person file from template, read `tags.yaml` and substitute the template's tag placeholders using matching rules:
>
> - **Project files** (`Projects/{project-name}.md`): look up entries in `tags.yaml` with `type: project-based` and matching `project:` field. Add each matching tag to the file's tag line (replacing the `#{project-tag}` placeholder in the project template). Example: project 'Auth Migration' with a `tags.yaml` entry `{ name: auth-migration, type: project-based, project: Auth Migration }` produces `#project #auth-migration`.
> - **Person files** (`People/{person-name}.md`): use the person's `relationship_tier` from `people.yaml` as the tag (e.g., `#person #direct` for a direct report). If `tags.yaml` also has an entry with `type: person-based` and matching `person:` field, include that tag too.
>
> **Other tag rule types are deferred to post-v1.** `tags.yaml` may contain `keyword-based`, `source-based`, and other rule types — these are not applied automatically in v1."

And `main.md` File Creation from Template (lines 217-226) now reads:

> "File slugs use lowercase with hyphens for spaces (e.g., 'Auth Migration' → `auth-migration.md`, 'Sarah Chen' → `sarah-chen.md`).
>
> - **Project file:** ... Apply project-based tags from `tags.yaml` when substituting the template's tag placeholder (see conventions.md Tags section).
> - **Person file:** ... Apply person-based tags and the relationship tier tag from `tags.yaml` and `people.yaml` (see conventions.md Tags section)."

**Why it's resolved:** The template placeholder `#{project-tag}` in the project template and `#{relationship-tier}` in the person template now have defined sources (tags.yaml + people.yaml) and a defined invocation point (main.md File Creation). Conventions.md no longer claims "auto-applied by the tagging system" — instead it specifies the exact rules that ARE auto-applied and explicitly defers the rest.

**Side benefit:** The new slug convention line in main.md also addresses a latent Golden Rule / self-containment gap — a fresh Claude no longer has to guess the slug format (kebab vs snake vs camel).

---

### [I02] Slack unreplied tracking uses email-specific criteria
**Fix action:** Implemented Option 1 — broaden step 4d to handle both email and Slack
**Verdict:** Resolved

**Evidence:** `process.md` step 4d (line 55) now reads:

> "**Unreplied tracking:** Create a TODO with `type:: reply-needed` if ALL of these are true: (1) the message is directed at you — for email: you are in the To or CC field (matched against `user.email`); for Slack: the message is a DM to you, @mentions you (matched against `user.name` or Slack handle from `people.yaml`), or comes from a direct report in a channel where you're the primary recipient, AND (2) the message contains a direct question to you, an explicit request for your input/decision/approval, or a request from a direct report implying they are waiting on you. Skip for notifications, auto-generated digests, FYI broadcasts, and messages where you are one of many recipients without being specifically addressed."

The format block now shows both email and Slack variants:
```
- [ ] Reply to {sender first name} about {topic} [project:: ...] [type:: reply-needed] [review-status:: pending] [Inferred] (email, {sender first name}, {date}) — needs reply
- [ ] Reply to {sender first name} about {topic} [project:: ...] [type:: reply-needed] [review-status:: pending] [Inferred] (slack, #{channel or sender first name}, {date}) — needs reply
```

And the Auto-resolve paragraph now handles both sources: "if a later message in the same thread (email thread or Slack thread) is FROM the user (matched against `user.email` for email or `user.name`/Slack handle for Slack)".

**Why it's resolved:** Step 8's instruction to "apply the same extraction logic as email (steps 4b-4f), including unreplied tracking (step 4d)" now produces correct behavior for Slack because step 4d is source-aware. brief.md's Unreplied Tracker (which queries `type:: reply-needed` via the `tasks` MCP) will now find both email-originated and Slack-originated reply-needed items.

---

### [I03] Review queue entry format not specified in runtime context
**Fix action:** Implemented Option 1 — add canonical format to conventions.md
**Verdict:** Resolved

**Evidence:** `conventions.md` Canonical Entry Formats now includes a new sub-section (lines 124-141):

> "### Review Queue Entries (review-work.md, review-people.md, review-self.md)
>
> Every entry written to `ReviewQueue/review-work.md`, `review-people.md`, or `review-self.md` uses this format:
>
> ```
> - [ ] **{proposed action}**
>   Source: {source type, identity, date — e.g., 'email from Sarah, 2026-04-05' or 'meeting: 1:1 with Sarah, 2026-04-06'}
>   Interpretation: {what the agent thinks this is — task, observation, decision, etc.}
>   Ambiguity: {why it's in the queue — what's unclear or why a reasonable person might disagree}
>   Proposed destination: {file path and section where it would be written if approved — e.g., 'Projects/auth-migration.md, ## Open Tasks'}
>   ---
> ```
>
> The `---` separator between entries is literal — it helps the review skill parse items and the user visually separate them in Obsidian.
>
> **Review-triage.md uses a different, simpler format** (see triage.md's Output section) — it only recommends folder moves, not vault updates, and has its own entry format."

**Why it's resolved:** The canonical format is now in conventions.md (runtime context), alongside Timeline, Observations, Recognition, and Contributions formats. Skills that write to review queues already defer to conventions.md per their Rules sections. A fresh Claude writing to a review queue now has a clear format to follow, and review.md's expected format (bold heading + Source + Interpretation + Ambiguity + Proposed destination) matches what writers produce. Cross-skill consistency is enforced at the canonical-format level.

**Review-triage note:** The explicit carve-out for review-triage preserves triage.md's existing simpler format without drift. Good.

---

### [I04] main.md Task Completion/Move direct ops only search project files
**Fix action:** Implemented Option 2 — use the Obsidian MCP `tasks` query for both operations
**Verdict:** Resolved

**Evidence:** `main.md` Task Completion (line 198) now reads:

> "Query the Obsidian MCP `tasks` tool to find open TODOs matching the description via fuzzy matching. The query spans all markdown files in the vault — project files, daily notes, meeting files, wherever the task lives. If multiple matches, ask the user to pick. If one match, mark it complete (`- [x]`). Confirm: 'Marked complete: {task description} in {file}.'"

And Task Move step 1 (line 210):

> "Query the Obsidian MCP `tasks` tool to find the task via fuzzy matching on the description. The query spans all markdown files in the vault — project files, daily notes, meeting files. If multiple matches, ask the user to pick. The source can be any file, not just a project file (e.g., a personal task in the daily note can be moved to a project)."

**Why it's resolved:** Both operations now use the vault-wide `tasks` MCP query. Tasks created by capture.md's step 4 ("If no project can be determined, append to today's daily note") and process.md's step 4d fallback ("If the project can't be resolved, write to today's daily note instead") are now findable by Task Completion and Task Move. The ambiguous-multiple-matches handling is preserved.

**Cross-check:** Capture.md's rule that tasks without a project go to the daily note (line 126) now works end-to-end — creation and completion both handle daily-note tasks. brief.md's Unreplied Tracker also uses `tasks` MCP query, so reply-needed TODOs routed to daily notes (from process.md step 4d fallback) are also findable.

---

### [M01] prep-meeting.md `debrief_type` unused in procedure
**Fix action:** Implemented Option 1 — remove dead reference
**Verdict:** Resolved

**Evidence:** `prep-meeting.md` line 18 Inputs now reads:

> "- **meetings.yaml**: type overrides, project associations, aliases"

`debrief_type` is removed. Grep verified no other reference in prep-meeting.md. The field is still correctly listed in process-meeting.md's Inputs and used in its step 2, so the decoupling is clean.

---

### [M02] wrap-up.md weekly note creation self-containment
**Fix action:** Implemented Option 3 — create-from-template with minimal fallback
**Verdict:** Resolved

**Evidence:** `wrap-up.md` Weekly Summary step 1 (line 58) now reads:

> "Read the current weekly note `Journal/WeeklyNote-{monday-date}.md`. If it doesn't exist, create a minimal one: use `create-from-template` with `_system/templates/weekly-note.md` if the template exists; otherwise `write` a new file with frontmatter `week_start: {monday-date}`, the `#weekly` tag, and empty sections `## Week Capacity`, `## Weekly Goals`, `## Carry-Forwards`. Wrap-up does not populate the Week Capacity table or Carry-Forwards — those are sync's responsibility. Wrap-up's job is to append the Weekly Summary section below whatever is already present."

**Why it's resolved:** No cross-skill reference ("same process as sync's weekly note creation") remaining. The creation is fully self-contained: template-first, explicit fallback with frontmatter/tag/sections specified, clear boundary with sync ("sync populates Week Capacity and Carry-Forwards; wrap-up only appends Weekly Summary").

**Cross-check:** sync.md's Weekly Note section (lines 67-74) still specifies what sync does for weekly note creation, and wrap-up's new step explicitly defers those concerns to sync. No drift.

---

### [M03] capture.md task type list missing reply-needed
**Fix action:** Implemented Option 1 — add reply-needed
**Verdict:** Resolved

**Evidence:** `capture.md` step 4 (line 65) now reads:

> "Extract task attributes from natural language: title, project, priority, start date, due date, type (task, delegation, dependency, reply-needed), person (for delegations), effort estimate. Resolve relative dates to absolute dates."

**Why it's resolved:** The type list matches conventions.md's canonical `[type:: {task | delegation | dependency | reply-needed | retry}]` (minus retry, which is agent-generated only). brief.md's Unreplied Tracker suggestion ("say 'add task: waiting for reply from [person] about [topic]' with type reply-needed") now maps cleanly to capture.md's type list.

---

### [M04] Confirmation threshold inconsistency
**Fix action:** Implemented Option 2 — align all to "5 or more"
**Verdict:** Resolved

**Evidence:**
- `safety.md` line 49: "Bulk writes (a single operation writing to **5 or more** vault files)"
- `process.md` step 4f: "If writing to **5 or more files** in a batch or processing **10 or more** emails"
- `draft-replies.md` line 32: "If **5 or more emails** are in the folder"

All three files now use "5 or more" — consistent threshold and consistent wording.

---

### [M05] wrap-up.md source value not in conventions.md
**Fix action:** Implemented Option 1 — add `wrap-up` to conventions.md source list
**Verdict:** Resolved

**Evidence:** `conventions.md` Date and Source Format → Source values (lines 183-189) now reads:

> "- `email` — from email processing. Add sender: `email from Sarah`
> - `slack` — from Slack processing. Add channel or person: `slack #auth-team`
> - `meeting` — from meeting processing. Add meeting name: `meeting 1:1 with Sarah`
> - `capture` — from quick capture or user-typed input
> - `user` — user typed directly into a file (not through the agent)
> - `wrap-up` — from end-of-day scanning (agent-detected contributions from completed work aggregated by the wrap-up skill)"

**Why it's resolved:** wrap-up.md's example entries (`- [2026-04-06 | wrap-up] ...`) now use a value that's in the canonical approved list. wrap-up.md's Rules entry "Entry formats follow conventions.md" is now satisfied. No changes needed to wrap-up.md itself.

---

### [M06] calendar.md missing fallback defaults
**Fix action:** Implemented Option 1 — inline defaults
**Verdict:** Resolved

**Evidence:** `calendar.md` now has a Config defaults paragraph at the top of the Procedure section (line 22):

> "**Config defaults.** If `calendar_event_prefix` is missing from workspace.yaml, use `[Myna]`. If `calendar_event_types` or any of its sub-fields (`focus`, `task`, `reminder`) are missing, use defaults: `focus: Focus`, `task: Task`, `reminder: Reminder`. These defaults keep the three-layer protection intact when config is sparse or partially customized."

**Why it's resolved:** If a user customizes workspace.yaml and removes `calendar_event_types` or its sub-fields, calendar.md now has explicit fallback values. The three-layer protection (prefix check in Layer 2, explicit confirmation in Layer 3) still works because the title will contain the default prefix `[Myna]` and a valid type label.

---

### [M07] brief.md 1:1 Pattern Analysis missing toggle check
**Fix action:** Implemented Option 1 — add `features.people_management` check at step 1
**Verdict:** Resolved

**Evidence:** `brief.md` 1:1 Pattern Analysis step 1 (line 102) now reads:

> "Check `features.people_management`. If disabled, tell the user and stop. Then resolve the person name against `people.yaml`. If ambiguous, ask."

**Why it's resolved:** Matches Performance Narrative's gating pattern (line 116: "Check `features.people_management`. If disabled, tell the user and stop.") All four people-management brief features are now consistently gated: Person Briefing (partial gate for feedback sections), Team Health Overview (full stop via `features.team_health`), Performance Narrative (full stop via `features.people_management`), 1:1 Pattern Analysis (full stop via `features.people_management`).

---

## Regression Check

### 1. Modified files re-read in full

- `agents/main.md` — Task Completion and Task Move changes fit naturally; File Creation slug line and tag application are additive; no contradictions introduced.
- `agents/steering/conventions.md` — Review Queue Entries format slots into the existing Canonical Entry Formats sequence; Tags section is expanded with clear application rules; `wrap-up` source value added to the list cleanly.
- `agents/steering/safety.md` — Single word change ("more than 5" → "5 or more") does not affect surrounding content.
- `agents/skills/process.md` — Unreplied tracking change expands step 4d coherently; format block now shows both variants; auto-resolve paragraph matches the new criteria; bulk write threshold is consistent.
- `agents/skills/prep-meeting.md` — Removing `debrief_type` from inputs doesn't affect any procedural step (it wasn't used).
- `agents/skills/capture.md` — Added type is an additive list change.
- `agents/skills/wrap-up.md` — Step 1 change is self-contained; example output still uses `wrap-up` source (now approved).
- `agents/skills/calendar.md` — Config defaults paragraph added at top of Procedure section; doesn't conflict with any step.
- `agents/skills/brief.md` — Step 1 gating pattern matches Performance Narrative's.
- `agents/skills/draft-replies.md` — Single phrasing update, surrounding content unchanged.

No contradictions found in any modified file.

### 2. Cross-skill consistency on shared destinations

- **Review queue entries (review-work, review-people, review-self):** Format is now canonical in conventions.md. Skills writing to queues (capture, process, process-meeting, wrap-up) defer to conventions.md per their Rules sections. review.md reads queues expecting this format, and its worked example (lines 96-104) matches the new canonical format.
- **Source values across contribution entries:** email (process), slack (process), meeting (process-meeting), capture (capture, self-track), wrap-up (wrap-up) — all six approved values are now in conventions.md's source list. No invalid source values remain.
- **Reply-needed TODO format across process.md and brief.md:** process.md creates TODOs with `type:: reply-needed`, no `person::`, and source references that match conventions.md's format. brief.md queries `type:: reply-needed` via the `tasks` MCP tool and splits by `person::` presence. Both email-originated and Slack-originated reply-needed TODOs now share the same Tasks plugin format and can coexist in the same "Waiting on you" view. No conflict with the cycle 003 fix (which established the no-`person::` rule for incoming reply-needed).
- **Task completion across all skills:** main.md Task Completion now uses the `tasks` MCP query. capture.md creates tasks in project files or daily notes. process.md creates tasks in project files or daily notes (as fallback). process-meeting.md creates tasks in project files. All task locations are queryable via the `tasks` MCP tool.
- **Bulk write threshold (5+ files or emails):** safety.md steering, process.md step 4f, draft-replies.md — all three use "5 or more" now.
- **Tag application at file creation:** main.md File Creation references conventions.md Tags section; conventions.md specifies the rules. Single source of truth, closed loop.
- **Feedback gap feature toggle (`features.feedback_gap_detection`):** Gated in brief.md Person Briefing, brief.md Performance Narrative (via `people_management`), prep-meeting.md, wrap-up.md Weekly Summary. Consistent.
- **People management feature toggle (`features.people_management`):** Gated in brief.md Person Briefing (partial), brief.md Performance Narrative (full stop), brief.md 1:1 Pattern Analysis (full stop — new), brief.md implicitly in Unreplied Tracker/Blocker Detection (neither is people-specific so no gate needed). Consistent.

### 3. Safety check

- **No new send/post/deliver paths.** No fix altered draft-never-send rules. draft.md, draft-replies.md, main.md safety refusals all unchanged.
- **No new writes outside `myna/`.** All file paths in modified content are vault-relative. Tag application at file creation writes only to Projects/ and People/ files.
- **Calendar three-layer protection unchanged.** The calendar.md config defaults paragraph doesn't alter the three-layer protection — it adds fallback values for the configured names, which then flow into Layer 1 (instruction rule), Layer 2 (pre-tool check that title starts with the prefix), and Layer 3 (explicit confirmation). If a user removes `calendar_event_types`, the defaults kick in and Layer 2's prefix check still passes because the title has the prefix.
- **No skill chaining introduced.** Fixes respect the no-chaining rule in main.md and sync.md. The `tasks` MCP query in Task Completion/Move is a single MCP call, not a skill activation.
- **Confirmation policy still enforced for bulk writes.** Threshold alignment doesn't weaken the rule — it applies earlier (5 instead of 6 files).

### 4. Append-only discipline check

- All new write paths (tag application in file creation, review queue entry format, wrap-up's minimal weekly note creation) produce append or create operations — no overwrites of existing content.
- The new weekly note creation in wrap-up.md explicitly says "append the Weekly Summary section below whatever is already present" — no modification of existing content.
- Tag application applies to the file's inline tag line at creation time, which is a file-creation operation, not an update to an existing file.
- The canonical Review Queue Entry format adds a new entry (new line), which is append-only. The `---` separator is literal and part of the entry.

### 5. Lint verification

Re-ran `bash scripts/lint-agents.sh` after all fixes. **0 errors, 8 warnings** (same false positives as cycles 001-003 — `Review and send` user-action TODOs, example content in draft.md/prep-meeting.md/process-meeting.md/conventions.md). Status: PASS. No new errors or warnings introduced.

## Verdict

**CLEAN** — all 11 implemented fixes are resolved. No outstanding issues. No regressions. No pushbacks. Recommend: stop iterating.

| Metric | Count |
|--------|-------|
| Issues verified | 11 |
| Resolved | 11 |
| Not resolved | 0 |
| Pushbacks accepted | 0 |
| Pushbacks rejected | 0 |
| Final regressions found | 0 |

# Myna Review — Cycle 002

**Date:** 2026-04-09
**Scope:** All agent artifacts — `agents/main.md`, `agents/steering/*.md`, `agents/skills/*.md`, `agents/config-examples/*.yaml.example`, `agents/claude-md-template.md`
**Files reviewed:** 24 files (1 main agent, 4 steering, 14 skills, 6 config examples, 1 template)
**Previous cycles:** Cycle 001 ended CLEAN (7/7 fixes resolved). This cycle checks for issues not caught in 001.

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Important | 1 |
| Minor | 3 |
| Nitpick | 0 |

**Convergence:** CONTINUE — 1 blocking issue.

---

## Phase 0 — Lint

### Errors Found and Fixed

(none — lint passed clean)

### Warnings Reviewed

| # | Check | File | Issue | Action |
|---|-------|------|-------|--------|
| 1 | Safety keywords | draft-replies.md:71 | "send" in review TODO template | Not concerning — user action instruction |
| 2 | Safety keywords | draft-replies.md:72 | "send" in meeting invite TODO | Same pattern |
| 3 | Safety keywords | draft-replies.md:85 | "send" in Output section | Same pattern |
| 4 | Safety keywords | draft.md:43 | "send" in review TODO template | Same pattern |
| 5 | Safety keywords | draft.md:107 | "post" in recognition draft description | Describes draft format, not agent action |
| 6 | Safety keywords | prep-meeting.md:153 | "Send" in worked example | Realistic example content |
| 7 | Safety keywords | process-meeting.md:152 | "Send" in worked example | Realistic example content |
| 8 | Safety keywords | conventions.md:49 | "send" in provenance example | Data example, not instruction |

**Lint summary:** 0 errors found. 8 warnings reviewed (all false positives, same as cycle 001). Final status: PASS.

---

## Issues

### Important

#### [I01] process-meeting.md missing project file creation fallback (inconsistent with process.md)

**Severity:** Important
**File(s):** `agents/skills/process-meeting.md` (line 143)
**Dimension:** Edge Cases / Cross-File Consistency

**Problem:** process-meeting.md has asymmetric handling for missing destination files:

For **person files** (line 143): "If a person file doesn't exist: create it from the template in `_system/templates/person.md`. If the template doesn't exist, create a minimal person file with frontmatter from `people.yaml` and `#person` tag." — Full fallback chain, matching process.md.

For **project files** (line 143): "If a project file doesn't exist: route the item to `review-work.md` with a note: 'Could not write to [project] — no project file exists.'" — No creation attempt. Routes to review queue immediately.

Compare with process.md (line 61): "If a destination file doesn't exist, create it from `_system/templates/` via Obsidian MCP `create-from-template`. If the template doesn't exist, create a minimal file with frontmatter from the relevant config (projects.yaml or people.yaml) and appropriate tags (`#project` or `#person`). If the entity isn't in config at all, route the item to `review-work.md`."

process.md creates both person AND project files with the same fallback chain. process-meeting.md creates person files but routes project items to review queue when the project file is missing.

**Impact:** A project that's in config (projects.yaml) but whose vault file hasn't been created yet will be handled differently depending on which skill processes it:
- "process my email" → creates the project file, writes entries directly
- "done with meeting" → routes items to review-work queue

This breaks the user's expectation of consistent behavior. First-time users who add a project to config but haven't run process (email) yet would find their meeting items going to the review queue instead of creating the project file. The same action item from email gets written directly, but from a meeting gets queued — confusing.

**Options:**
1. **Match process.md's pattern:** Add the full fallback chain for project files — create from template, fall back to minimal file from config, only route to review queue if the entity isn't in config at all
2. **Keep the asymmetry but document it:** Add a Rules note explaining the design decision (project file creation during meeting processing is more unexpected than during email processing)
3. **Add to process-meeting's Procedure step 5:** "If the resolved project has no vault file but IS in projects.yaml, create it from template before writing entries"

**Recommended:** Option 1. Consistency across the two main extraction skills (process and process-meeting) is important. The fallback chain is simple and well-understood from process.md. If the project is in config, the confidence is high enough to create the file — the agent resolved it against projects.yaml in step 5.

---

### Minor

#### [M01] draft-replies.md has a misplaced triage rule

**Severity:** Minor
**File(s):** `agents/skills/draft-replies.md` (line 92)
**Dimension:** Instruction Clarity

**Problem:** Line 92 reads: `"Each folder recommendation is one line of reasoning. Be confident — do not hedge."` This is a triage-specific rule about folder classification recommendations. Draft-replies doesn't make folder recommendations — it generates draft files from forwarded emails.

Compare with the source in triage.md (line 91): `"Each folder recommendation is one line of reasoning, not a paragraph. Be confident in recommendations — do not hedge with 'I think this might go in...'"` — makes perfect sense in triage context.

This appears to be a copy/paste artifact from triage.md that was included when draft-replies was created.

**Impact:** Low — Claude would ignore this rule since it doesn't apply to the draft-replies workflow. But it's confusing noise in the skill's rules section.

**Options:**
1. **Remove the line entirely** — it has no meaning in the draft-replies context
2. **Replace with a relevant confidence rule** — e.g., "Be confident in draft type detection. Do not hedge — if the instruction says 'decline,' generate a decline draft."

**Recommended:** Option 1. Removing the misplaced rule is cleaner. The existing rules already cover confidence (line 91: "Instruction is the user's message; thread is context").

---

#### [M02] Audit logging only implemented in process.md

**Severity:** Minor
**File(s):** `agents/skills/process.md` (line 70), `agents/skills/process-meeting.md`, `agents/skills/capture.md`, `agents/skills/wrap-up.md`
**Dimension:** Cross-File Consistency / Config & System

**Problem:** The Agent Audit Log feature (cross-domain.md) specifies: "Logs: what the agent detected, what action it took, which source it read, what it wrote and where. Stored in `_system/logs/audit.md`."

Only process.md (line 70) implements audit logging: "Log the processing run to `_system/logs/audit.md` via Obsidian MCP `append`."

Other extraction skills that write to the vault — process-meeting.md, capture.md, wrap-up.md, draft-replies.md — don't mention audit logging. The system.md steering file also doesn't include it as a cross-cutting rule.

**Impact:** Low — the audit log is a system transparency mechanism, not a user-facing feature. Vault entries already have date+source traceability. The highest-volume extraction skill (process) does log, and other skills are interactive (the user sees the output directly). But incomplete audit logging reduces debugging capability when something goes wrong.

**Options:**
1. **Add audit logging to system.md** as a cross-cutting rule: "After any multi-step vault write operation, append a summary to `_system/logs/audit.md`" — all skills inherit this
2. **Document that only process.md logs** — add a comment in process.md noting that audit logging is process-specific because it's the highest-volume batch operation; other skills are interactive
3. **Leave as-is** — the practical impact is minimal

**Recommended:** Option 1 if the intent is comprehensive audit trails. Option 2 if the intent is targeted logging for batch operations only. Given the Golden Rule (avoid unnecessary instructions), Option 2 is safer — adding an audit logging rule to system.md means every skill executes extra writes.

---

#### [M03] brief.md unreplied tracker "waiting on them" has no population mechanism

**Severity:** Minor
**File(s):** `agents/skills/brief.md` (lines 149-155), `agents/skills/process.md` (step 4d)
**Dimension:** Feature Completeness

**Problem:** brief.md's Unreplied Tracker (line 149-155) defines two categories:
> "Waiting on you: reply-needed tasks where you are the owner"
> "Waiting on them: reply-needed tasks where `person::` is someone else"

But process.md step 4d only creates reply-needed TODOs for the "waiting on you" direction: messages where "you are in the To or CC field" and "the email contains a direct question to you." There is no mechanism in any skill that automatically creates "waiting on them" tasks (messages YOU sent that haven't gotten a response).

The feature spec (email-and-messaging.md) defines both categories but only describes the population mechanism for "waiting on you": "the agent flags messages that need a reply from you."

**Impact:** When a user says "what am I waiting on?", the "waiting on them" section would always be empty unless the user manually creates reply-needed tasks with `person::` set to someone else. The two-category display in brief.md sets an expectation that both directions are tracked, but only one is populated automatically.

**Options:**
1. **Add a note in brief.md** clarifying that "waiting on them" is populated by manually created reply-needed tasks (via capture or review queue), not automatically from email processing
2. **Add outgoing message tracking to process.md** — during thread reading, if the most recent message is FROM user.email and contains a request, create a reply-needed TODO with `person::` set to the recipient. Complex to implement correctly.
3. **Remove "waiting on them" from brief.md** — simplify to only showing "waiting on you" tasks

**Recommended:** Option 1. Adding a brief note in the Unreplied Tracker section clarifies the current behavior without adding complexity. The "waiting on them" query is still useful for manually created tracking tasks, and future enhancements could add automatic population.

---

## Passed Checks

**Feature Completeness:** All 14 skills cover their assigned features from architecture.md. Cross-referenced every skill against its "Features covered" line and the corresponding feature spec files — no gaps found. Each sub-feature has executable procedure steps.

**Instruction Clarity:** All procedures have clear decision criteria. No "determine the appropriate..." without guidance. Branching is explicit. Edge case handling is specified.

**Golden Rule Compliance:** Skills focus on what/where/when/what-not-to-do. No over-specification of LLM natural abilities. All cycle 001 fixes (inlined formats, draft file description) still look clean.

**Cross-File Consistency:** All extraction skills (process, process-meeting, capture, wrap-up) defer to conventions.md for entry formats. Timeline, observation, recognition, contribution, and task formats are canonical and consistent across all skills. Shared vault destinations produce matching output. The cycle 001 fixes (feedback_gap_detection toggle wiring, [Review] prefix for performance narratives, draft type list) are correctly maintained.

**Edge Cases:** First-run handling (empty vault, missing templates), re-run behavior (sync snapshots, weekly summaries), missing files (graceful degradation), bulk operations (batch thresholds), and MCP unavailability are all covered across relevant skills.

**Safety:** Draft-never-send enforced across all skills. Vault-only writes consistently enforced. External content framing delimiters present in all skills that read external data (process, triage, draft, draft-replies). Calendar three-layer protection complete in calendar.md. Confirmation policy for bulk writes in safety.md and process.md. No skill chaining — explicit rules in main.md, sync.md, and individual skill Rules sections.

**Output Usefulness:** All skills produce specific, countable summaries with file links (Obsidian URI and disk path). Brief modes have clear density guidance (15-25 lines for person, 3-5 for quick, etc.). Output steering ensures concise, no-filler responses.

**Claude Behavioral Fit:** Anti-verbosity rules in output.md. Scope boundaries in each skill's Rules section. No-skill-chaining rules in main.md and sync.md. Confirmation policy in safety.md. Planning mode output is "inline advice — 5-7 bullet points maximum."

**Provenance & Conventions:** All skills defer to conventions.md for marker rules and entry formats. Source reference format (compact) is consistent. Append-only discipline respected across all files. Carry-forward creates copies with "(carried from {date})" notation.

**Config & System:** All 17 feature toggles in workspace.yaml.example are checked by their respective skills. feedback_gap_detection is now correctly wired (cycle 001 fix). Graceful degradation for missing MCPs is handled per skill. Config field names match workspace.yaml schema. Relative dates resolved to absolute.

**Steering Files:** All 4 steering files are comprehensive, actionable, and correctly scoped. No conflicts between steering rules and skill-specific rules. The cycle 001 lint fixes (self-containment) remain intact.

**Main Agent:** Routing logic is thorough — Universal Done, inbox routing, ambiguous intent handling, safety refusals, and fallback are all well-specified. Direct operations (search, link find, task completion, draft deletion, task move, file creation) are clear.

**Config Examples:** All 6 .yaml.example files have realistic sample data, inline comments, and correct field names matching what skills reference.

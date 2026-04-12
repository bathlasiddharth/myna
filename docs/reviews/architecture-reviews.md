# Architecture Reviews

Three review rounds using fresh-context subagents, plus feedback resolution and coverage audit.

---

## Round 1 — Practical Builder

**Perspective:** Build the email-and-messaging skills (process + triage) from only the docs.

### Findings

1. **Missing: abstract MCP tool surface for email and Slack.** The actual tool names and parameters for reading emails, listing inbox, moving to Processed/, reading Slack messages are never specified. The skill instructions need to define abstract operations or punt to the adapter.

2. **Missing: review-triage.md entry template.** The standard review queue entry format (foundations 2.10) doesn't cover triage's unique structure (folder classification + vault updates + project assignment per email).

3. **Missing: triage step 3 routing logic.** How does the agent know which approved items go to which queue (review-work vs review-people vs review-self)?

4. **Missing: what "inbox" means for email MCP.** Is it a literal folder name? A special MCP concept?

5. **Missing: how the agent identifies "your" messages.** Unreplied tracker needs to know which emails are FROM the user. workspace.yaml has user.email but no instruction on matching against MCP data.

6. **Missing: reply-needed TODOs from triage with no project.** Process always has a project (mapped folders). Triage may not — where does the TODO go?

7. **Missing: processed-channels.md format spec.**

8. **Near-contradiction: task locations.** Process writes "task items in project files" but Journal/tasks.md exists for personal tasks. Can process ever create a non-project task?

### Builder's verdict
"Mostly buildable. The extraction, routing, dedup, and provenance systems are clear. Five gaps need filling before a fresh Claude could build without asking questions."

---

## Round 2 — LLM Runtime Thinker

**Perspective:** Will the LLM follow these instructions reliably at runtime?

### Findings

1. **Main agent prompt size: safe.** Estimated ~3,500 tokens (prompt + steering). Well within limits. Progressive disclosure is the right design.

2. **`draft` is the most complex skill** — 11 sub-behaviors with interacting dimensions (draft type x rewrite mode x audience tier x style config). The tone/rewrite mode distinction is subtle and LLMs will blur it. Communication style config lookup adds cognitive load.

3. **`capture` is a second routing layer** — 10+ distinct operations under one skill. Quick capture multi-destination decomposition is high-judgment.

4. **Universal Done routing is the most dangerous ambiguity** — four-way branch (meeting/task/draft/ask) with fuzzy matching. LLMs commit to guesses rather than asking.

5. **Provenance markers will drift during batch processing.** [Auto] vs [Inferred] distinction requires per-item judgment that fatigues across many items.

6. **Negative instructions will be violated:** "silently skip disabled features" and "never modify existing content." LLMs are poor at sustained negative instructions.

7. **Near-duplicate detection has no concrete definition.** "Near-match" is never defined with a threshold.

8. **Content framing delimiters may be inconsistently applied** during batch email processing.

9. **Coaching suggestions threshold is vague** — "sensitive items" not precisely defined.

10. **Calendar three-layer protection degrades** — layer 2 depends on tool support, LLMs may skip layer 3 confirmation to be helpful.

### Runtime Thinker's verdict
"The architecture is sound. The progressive disclosure + lean main prompt is correct. Main risks are the `draft` skill's internal complexity, provenance drift during batch work, and Universal Done ambiguity. None of these are architecture-level problems — they're skill-instruction-writing problems solvable in Phase 3/5."

---

## Round 3 — User Advocate

**Perspective:** EM with 8 reports, 5 projects, too many emails.

### Findings

1. **Review queue fatigue.** Four separate queues is a lot. "I would want one unified queue I can process in 3 minutes." (Mitigated: the review skill presents across all queues in one command.)

2. **Stale data with no warning.** "If I ask for a briefing before running process, I get stale data with no warning." No signal saying "email hasn't been processed today."

3. **Daily ritual is demanding.** Sync → plan → wrap-up → review across a full day. On meeting-heavy days, steps get skipped and data gaps accumulate.

4. **Sync/plan overlap.** "What should I focus on today?" is the most common EM question but requires two skills. User would stumble.

5. **Missing workflows:** delegation load balancing, escalation tracking, meeting skip analysis, handoff/coverage planning, cross-project dependency view. (Note: these are NOT in approved requirements.)

6. **Config burden.** 5 min for strict minimum (37 fields). Realistic useful setup is 15-20 min (75 fields with email/Slack handles needed for matching).

7. **Engineering theater candidates:** self-calibration mode, communication style interview, park & resume, retro processing, draft lifecycle tracking.

8. **Genuinely useful features:** morning sync, meeting prep with follow-through, person briefing, quick capture, email processing, delegation/unreplied tracker, status update drafting.

### Advocate's verdict
"I would absolutely try Myna. The core promise is right. I would stop using it if review queue management takes longer than handling email myself, or if the daily ritual feels like a chore. The features that work for my day-to-day are excellent."

---

## Feedback Resolution

### Accepted — changes made to docs

| # | Issue | Resolution |
|---|-------|-----------|
| B1 | Missing review-triage.md template | Added template to foundations.md section 2.10 |
| B2 | Missing processed-channels.md format | Added format spec to foundations.md |
| B3 | Triage step 3 routing unclear | Clarified in architecture.md triage skill: routes by vault-update type |
| B5 | How agent identifies "your" messages | Added note to foundations.md: match against user.email from workspace.yaml |
| B6 | Reply-needed TODOs from triage with no project | Clarified: go to Journal/tasks.md |
| B7 | Near-duplicate detection undefined | Added concrete heuristic to foundations.md pattern 9.2 |
| U2 | Stale data with no warning | Added "freshness note" behavior to brief skill |
| U4 | Sync/plan routing overlap | Added routing rule: "what should I focus on?" routes to sync if no daily note exists, else plan |
| B4 | What "inbox" means | Added note: "inbox" means whatever folder/label the user designates in projects.yaml as their default unsorted email source |

### Accepted — noted for skill-writing phases (no doc changes needed now)

| # | Issue | Phase |
|---|-------|-------|
| L2 | Draft skill complexity | Phase 3/5 — skill instructions should use clear subsections per draft type. Only one sub-behavior activates per invocation. |
| L4 | Universal Done ambiguity | Phase 3/5 — routing instructions need strong "when ambiguous, ask" rule. |
| L5 | Provenance drift in batch | Phase 3/5 — skill instructions should remind per-item classification. |
| L6 | Negative instruction compliance | Phase 3/5 — structural enforcement where possible (tool restrictions, not just instructions). |
| L8 | Content framing consistency | Phase 3/5 — skill instructions should make wrapping a mandatory first step before extraction. |
| L9 | Coaching threshold vague | Phase 3/5 — define sensitive items explicitly in prep-meeting skill: pending feedback, overdue delegations, escalations, career gaps. |
| U1 | Review queue fatigue | Already mitigated: review skill presents all queues in one session. |
| U3 | Daily ritual burden | Not an architecture issue. Users choose which skills to invoke. Wrap-up is optional. |

### Rejected — with reasoning

| # | Issue | Why rejected |
|---|-------|-------------|
| L2 (split) | Split draft into multiple skills | Each invocation activates one draft type. The 11 sub-behaviors aren't simultaneously active. Splitting would add 2-3 more skills, increasing user cognitive load. |
| L3 (split) | Capture is too complex | Same reasoning — each invocation is one operation. Quick Capture's routing is the most complex single path. |
| U5 | Missing workflows (delegation load, escalation tracking, etc.) | These are NOT in approved requirements. Valid feature ideas but out of scope for Phase 0. Logged as potential backlog items. |
| U6 | Config burden >5 min | The setup wizard is interactive and conversational. 5 min covers the minimum viable setup (name, email, role, vault path, 1-2 projects, 2-3 people). The wizard explicitly supports "skip, set up later." Full useful setup taking 15-20 min is acceptable — power users can edit YAML directly. |
| U7 | Self-calibration, comm style interview, park, draft lifecycle are theater | All are in approved requirements. Self-calibration and comm style interview are explicitly optional. Park solves a real problem (context loss). Draft lifecycle may see low adoption but costs nothing to include. |
| B1 (MCP) | Missing exact MCP tool signatures | Abstract operations added to foundations. Exact signatures are adapter-layer concerns (Phase 6). We can't know tool names until we know the user's MCP servers. |
| B8 | Task location contradiction | No contradiction: process creates tasks in project files (always has a project from folder mapping). Journal/tasks.md is for manually created personal tasks. Added clarifying note. |

---

## Coverage Audit

Full audit of every feature from every requirements file against the skill inventory.

### email-and-messaging.md

| Feature | Skill | Status |
|---------|-------|--------|
| Deduplication (3 layers) | process | Covered |
| Email Processing | process | Covered |
| Messaging Processing | process | Covered |
| Email Triage (3 steps) | triage | Covered |
| Thread Summary | brief | Covered |
| Unreplied & Follow-up Tracker | process (populated), brief (queried) | Covered |

### meetings-and-calendar.md

| Feature | Skill | Status |
|---------|-------|--------|
| Meeting File (prep + notes) | prep-meeting, process-meeting | Covered |
| Process Meeting | process-meeting | Covered |
| Meeting Summaries from Email | process (detected, dual-path) | Covered |
| Time Block Planning | plan | Covered |
| Calendar Reminders | plan | Covered |
| Follow-Up Meeting Draft | draft | Covered |

### projects-and-tasks.md

| Feature | Skill | Status |
|---------|-------|--------|
| Project File Management | configure (create), capture (update content) | Covered |
| Project Timeline | process, process-meeting, capture (write to) | Covered |
| Task Management (add, complete, recurring) | capture | Covered |
| Recurring Tasks | capture | Covered |
| Blocker Detection | brief (surfacing), sync (daily note) | Covered |
| Project Status Summary (quick/full) | brief | Covered |

### people-management.md

| Feature | Skill | Status |
|---------|-------|--------|
| Person File Management | configure (create), capture (add content) | Covered |
| Observations & Feedback Logging | capture (user-typed), process/process-meeting (extracted) | Covered |
| Recognition Tracking | capture (user-typed), process/process-meeting (extracted) | Covered |
| Person Briefing | brief | Covered |
| 1:1 Pattern Analysis | people-insights | Covered |
| Feedback Gap Detection | people-insights, prep-meeting (surfaced in prep) | Covered |
| Performance Narrative (+ calibration) | people-insights | Covered |
| Team Health Overview | brief (snapshot) | Covered |
| Team Health Tracking (longitudinal) | people-insights | Covered |
| Attention Gap Detection | people-insights, sync/wrap-up (surfaced) | Covered |

### daily-workflow.md

| Feature | Skill | Status |
|---------|-------|--------|
| Review Queue | review | Covered |
| Morning Sync | sync | Covered |
| Daily Note | sync | Covered |
| Weekly Note | sync (create), wrap-up (weekly summary) | Covered |
| Planning (3 modes) | plan | Covered |
| End of Day Wrap-Up | wrap-up | Covered |
| Quick Capture | capture | Covered |
| Weekly Summary | wrap-up | Covered |
| Monthly Update Generation | draft | Covered |
| Unified Dashboard | Not a skill — Dataview file in _system/dashboards/ | Covered |

### writing-and-drafts.md

| Feature | Skill | Status |
|---------|-------|--------|
| Draft Lifecycle Tracking | draft | Covered |
| Email Draft Reply (both triggers) | draft | Covered |
| Follow-Up Email | draft | Covered |
| Message Rewriting (3 modes) | draft | Covered |
| Structured Draft (status/escalation) | draft | Covered |
| Recognition Draft | draft | Covered |
| Help Me Say No | draft | Covered |
| Difficult Conversation Prep | draft | Covered |
| Document Processing | process | Covered |
| Pre-Read Preparation | brief | Covered |

### self-tracking.md

| Feature | Skill | Status |
|---------|-------|--------|
| Contributions Tracking | capture (user-typed), process/process-meeting/wrap-up (extracted) | Covered |
| Self-Narrative Generation (3 modes) | self-track | Covered |
| Contribution Queries | self-track | Covered |

### cross-domain.md

| Feature | Skill | Status |
|---------|-------|--------|
| Universal Done | Main agent routing → process-meeting/capture/draft | Covered |
| Link Manager (save) | capture | Covered |
| Link Manager (find) | Main agent direct operation | Covered |
| Vault-Wide Search | Main agent direct operation | Covered |
| Park & Resume | park | Covered |
| Fuzzy Name Resolution | System-wide (steering) | Covered |
| Auto-Tagging | System-wide (steering) | Covered |
| Agent Audit Log | System-wide (steering) | Covered |

### setup-and-config.md

| Feature | Skill | Status |
|---------|-------|--------|
| Interactive Setup Wizard | configure | Covered |
| Vault Initialization | configure | Covered |
| Config System (6 YAML files) | configure | Covered |
| Communication Style Interview | configure | Covered |
| Config Management | configure | Covered |
| Vault Template System | configure (customization) + _system/templates/ | Covered |

### non-functional.md

| Requirement | Location | Status |
|-------------|----------|--------|
| Vault-Only Writes | Steering (safety.md) | Covered |
| Draft, Never Send | Steering (safety.md) + architecture section 12 | Covered |
| External Content as Data | Steering (safety.md) + foundations pattern 9.4 | Covered |
| Confirm Before Bulk Writes | Steering (system.md) | Covered |
| Never Assume, Always Ask | Main agent prompt | Covered |
| Fuzzy Command Matching | Main agent prompt (steering) | Covered |
| Inline-First Output | Main agent prompt (steering) | Covered |
| Provenance-Based Write Routing | Steering (conventions.md) + foundations section 4 | Covered |
| Date + Source on Every Entry | Steering (conventions.md) + foundations section 5 | Covered |
| Multi-Destination Routing | Foundations pattern 9.1 | Covered |
| Show Facts, Not Judgments | Steering (output.md) | Covered |
| Thorough Extraction with Provenance | Foundations section 4 | Covered |
| Never Infer About People's Internal States | Steering (output.md) | Covered |
| Provenance Markers (system-wide) | Steering (conventions.md) + foundations section 4 | Covered |
| Review Queue Precision | Foundations section 6 | Covered |
| Never Overwrite User Content | Steering (conventions.md) + foundations section 8.3 | Covered |
| Source Provenance on Direct Writes | Foundations section 5 | Covered |
| File Creation Safety | Foundations section 8.4 | Covered |
| Wiki-Link Validation | Foundations section 8.4 | Covered |
| Human-Sounding Output | Steering (output.md) | Covered |
| BLUF Default | Steering (output.md) | Covered |
| File Links in Output | Steering (output.md) + foundations section 10.6 | Covered |
| Agent-Formatted Tasks | Foundations section 10.5 | Covered |
| Config Reload | Steering (system.md) | Covered |
| Graceful Degradation | Steering (system.md) | Covered |
| Error Recovery | Steering (system.md) + foundations pattern 9.8 | Covered |
| Quiet Mode (P1) | N/A for v1 | Deferred |
| Resolve Relative Dates | Steering (system.md) + foundations section 5.4 | Covered |
| Prompt Logging | Steering (system.md) | Covered |
| Feature Toggles | Architecture section 7 + foundations pattern 9.6 | Covered |
| Obsidian Conventions | Steering (conventions.md) + foundations section 10 | Covered |

### Coverage Result

**All 60+ approved features have a home.** No orphaned features. Every feature in every `## Features` section across all 10 requirements files is mapped to either a skill, a system-wide behavior, or a vault artifact.

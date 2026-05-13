# Myna — Architecture

## 1. Overview

Myna is a set of AI agent instructions that turn Claude Code into a Chief of Staff for tech professionals. The user types natural language prompts inside Claude Code. Myna reads from external sources (email, Slack, calendar) via MCP servers and writes exclusively to a local Obsidian vault under a single `myna/` subfolder. All agent instructions are plain markdown — readable by any LLM, but designed and tested for Claude Code (D045, D046).

Architecturally, Myna is one main agent with 23 skills. The main agent handles routing and simple operations. Cross-cutting rules live in 6 steering skills, preloaded via the subagent's `skills:` frontmatter field. Feature skills are loaded on demand (progressive disclosure — only their name and description are in context until activated). Config lives in 6 YAML files read at session start.

There are no subagents in v1. No automatic skill chaining — each skill outputs its result and tells the user what to do next if a follow-up action is needed.

### How Myna Runs on Claude Code

Myna distributes as a Claude Code plugin (D053). Installation is a single command; no cloning or shell scripts required.

1. **Plugin install** — `/plugin install myna@agentflock` installs the plugin from the agentflock marketplace. Skills live at `skills/*/SKILL.md` inside the plugin directory. The plugin name is `myna`; the skill namespace is `myna:`.
2. **Main agent** — `agents/agent.md` contains identity, routing logic, and direct operations. Referenced as `myna:agent`. Frontmatter lists steering skills via the `skills:` field for preloading.
3. **Steering skills** — 6 skills with `user-invocable: false` preloaded at startup via the agent's `skills:` field. Always in context. Referenced as `myna:steering-safety`, `myna:steering-conventions`, etc.
4. **Feature skills** — 23 skills at `skills/{name}/SKILL.md` in the plugin directory. Only names and descriptions in context at startup. Full content loaded on demand when invoked as `/myna:{name}`.
5. **Config** — vault path stored in `~/.myna/config.yaml` (written by `install/claude.sh` on first run via `/myna:setup`). Six YAML config files read at session start from `{vault_path}/{subfolder}/_system/config/`.
6. **First-time setup** — `/myna:setup` is the single entry point. It runs `install/claude.sh` (vault directory creation and `~/.myna/config.yaml`), then opens the Config UI or doc import for configuration.

External MCP servers (email, Slack, calendar) are registered with Claude Code via `claude mcp add` and are available as tools in every session. Skills call MCP tools directly by name. Vault operations use Claude Code's built-in tools guided by the `myna:steering-vault-ops` steering skill — no MCP server required for vault access.

---

## 2. Skill Inventory

### Overview

| # | Skill (plugin-relative name) | One-liner | Example trigger |
|---|------------------------------|-----------|-----------------|
| 1 | sync | Start or refresh your day | "sync" |
| 2 | plan | Planning advice (ephemeral, no vault writes) | "what should I focus on?" |
| 3 | wrap-up | Close out the day | "wrap up" |
| 4 | weekly-summary | Generate weekly summary | "weekly summary" |
| 5 | email-triage | Sort inbox emails into folders | "triage my inbox" |
| 6 | process-messages | Extract data from email, Slack, or documents | "process my email" |
| 7 | draft-replies | Process draft requests from email folder | "process my draft replies" |
| 8 | prep-meeting | Prepare for a meeting | "prep for my 1:1 with Sarah" |
| 9 | process-meeting | Process notes after a meeting | "done with 1:1 with Sarah" |
| 10 | brief-person | Person briefing | "brief me on Sarah" |
| 11 | brief-project | Project status summary | "catch me up on auth migration" |
| 12 | team-health | Team health dashboard | "how is my team doing?" |
| 13 | unreplied-threads | Check what's waiting on you or others | "what am I waiting on?" |
| 14 | blockers | Scan for blockers across projects | "what's blocked?" |
| 15 | 1on1-analysis | Cross-session 1:1 pattern analysis | "1:1 trends with Sarah" |
| 16 | performance-narrative | Generate performance docs and calibrate reviews | "build Sarah's review narrative" |
| 17 | draft | Write professional content | "draft reply to James" |
| 18 | rewrite | Fix, restyle, or rewrite a message | "rewrite this for my VP" |
| 19 | capture | Log data to the vault | "capture: auth migration unblocked" |
| 20 | calendar | Time blocks, reminders, task breakdown | "reserve 2 hours Thursday" |
| 21 | self-track | Log contributions and generate self-review docs | "build my promo case" |
| 22 | park | Save and resume context | "park this" |
| 23 | process-review-queue | Process review queue items | "review my queue" |

Skills are invoked as `/myna:{name}` (e.g., `/myna:sync`, `/myna:plan`). The full plugin-qualified form is `myna:{name}`.

**Post-launch (deferred):**
- `myna-brief-thread` — Thread Summary
- `myna-review-calibration` — Review Calibration (standalone; folded into myna-performance-narrative for v1)
- `myna-pre-read` — Pre-Read Preparation

### Skill Details

#### 1. myna-sync

Sets up or refreshes your day. Creates the daily note (or prepends a new snapshot if re-run), generates meeting prep files for today's meetings, surfaces overdue tasks, delegation alerts, blocker flags, review queue count, and upcoming milestones. Also creates tomorrow's daily note when invoked with "plan tomorrow". Auto-archives old journal notes.

**Features covered:** Morning Sync, Daily Note, Weekly Note (created on first sync of the week), Plan Tomorrow, Journal auto-archiving

**Example invocations:** "sync", "good morning", "set up my day", "plan tomorrow"

**Reads:** calendar MCP, workspace.yaml, projects.yaml, people.yaml, meetings.yaml, existing daily note, task items across project files, review queue files, person files, previous meeting files (for carry-forward)

**Writes:** `Journal/{YYYY-MM-DD}.md`, `Journal/{YYYY-WNN}.md`, `Meetings/` prep files

**Example:** User says "sync" → reads calendar (4 meetings, 2 hrs total), open tasks (2 overdue, 5 hrs estimated), delegation alerts (1 overdue from Marcus) → creates daily note with Capacity Check, Immediate Attention, Today's Meetings → generates prep for each meeting → "Sync complete (8:30 AM). 4 meetings, 2 overdue tasks, 1 overdue delegation, 5 items in review queue."

---

#### 2. myna-plan

Provides ephemeral planning advice without writing to the vault. Analyzes your current workload, meetings, and tasks to suggest priorities. Supports day planning, priority coaching, and week optimization.

**Features covered:** Planning: plan day, priority coaching, week optimization (ephemeral inline advice, no vault writes)

**Example invocations:** "what should I focus on today?", "priority coaching", "week optimization", "plan my week", "am I over-committed?"

**Reads:** daily note, calendar MCP, task items, project files, workspace.yaml

**Writes:** inline output only (no vault writes)

**Example:** User says "what should I focus on?" → analyzes: 3 meetings (2 hrs), 6 hrs task effort, 5 hrs focus time → "You're slightly over-capacity. Top 3 priorities: (1) API spec review — due tomorrow, blocks Sarah, (2) delegation follow-ups — Marcus overdue, (3) MBR draft — deferred twice. Consider moving the MBR to Thursday when you have a lighter calendar."

---

#### 3. myna-wrap-up

Closes out the day. Compares planned vs actual, logs contributions, moves unfinished items to tomorrow, and saves any behavioral corrections observed during the session to Claude Code memory.

**Features covered:** End of Day Wrap-Up, contribution detection, carry-forward, session memory save

**Example invocations:** "wrap up", "end of day", "close out today"

**Reads:** daily note (sync snapshots), task items, project timelines, meeting files processed today, contributions log

**Writes:** daily note (End of Day section), tomorrow's daily note (unfinished items), `Journal/contributions-{week}.md` (detected contributions), `ReviewQueue/review-self.md` (uncertain contributions)

**Contribution detection:** Explicit completions → [Auto]. Interpreted influence → [Inferred]. Uncertain → review-self queue.

**Example:** User says "wrap up" → compares morning plan against current state → "Completed: API spec review, 2/3 delegation follow-ups. Not started: MBR draft (moved to tomorrow). Contributions: API spec review [Auto], cache question resolution [Inferred]. 1 uncertain contribution in review-self."

---

#### 4. myna-weekly-summary

Generates a weekly summary and team health snapshot (for managers). Synthesizes the week's daily notes, contributions, decisions, and task status into a structured weekly review.

**Features covered:** Weekly Summary, team health snapshot (managers)

**Example invocations:** "weekly summary", "how was my week?", "week in review"

**Reads:** daily notes for the week, contributions log, project timelines, meeting files, task items, team files (managers)

**Writes:** `Journal/{YYYY-WNN}.md` (Weekly Summary section), `Team/` health snapshots (managers)

**Example:** User says "weekly summary" → scans 5 daily notes → "Week summary: 3 projects progressed, 12 tasks completed, 2 carried. Key decisions: cache architecture (Auth Migration), Q3 staffing plan. 2 blocked items. Team health: Sarah on track, Alex overloaded (8 open, 3 overdue)."

---

#### 5. myna-email-triage

Sorts inbox emails into folders. Triage is purely about classification — it never touches the vault. Three-step flow: (1) agent reads inbox and writes folder recommendations, (2) user edits in Obsidian, (3) user says "process triage" to move emails to their assigned folders.

**Features covered:** Email Triage (3-step: recommend → user edits → process)

**Example invocations:** "triage my inbox", "process my inbox", "sort my inbox", "process triage"

**Reads:** email MCP (inbox), projects.yaml (project folders, triage folders, custom folders with descriptions)

**Writes:** `ReviewQueue/review-triage.md` (step 1). Step 3 moves emails to folders via email MCP.

**Folder recommendations draw from:** project folders (projects.yaml), triage folders (Reply/, FYI/, Follow-Up/), and custom folders with user-provided descriptions. After triage, user runs "process my email" to extract vault data.

**Example:** User says "triage my inbox" → reads 30 emails, matches against project folders and custom descriptions → writes review-triage.md with folder recommendations → "30 emails triaged. Edit review-triage.md, then say 'process triage' to move them."

---

#### 6. myna-process-messages

Extracts structured data from email, Slack, or pasted documents and routes each item to the right vault destination. A single input can produce entries for multiple destinations. Three-layer deduplication prevents reprocessing. Populates unreplied tracker as a byproduct.

**Features covered:** Email Processing, Messaging Processing, Document Processing, Deduplication (3 layers), Meeting Summaries from Email, Unreplied Tracker (populated as byproduct)

**Example invocations:** "process my email", "process my messages", "process my communications", "process this doc: [paste]"

**Reads:** email MCP (mapped project folders), Slack MCP (mapped channels), workspace.yaml, projects.yaml, people.yaml, existing vault files (near-duplicate check), `_system/logs/processed-channels.md` (Slack timestamps)

**Writes:** project timelines, task items in project files, person files, `Journal/contributions-{week}.md`, review queues, `_system/sources/`, `_system/state/email-sync.yaml`

**Deduplication layers:** (1) Move to Processed/ — email-specific, configurable per-project or common mode. (2) Quote stripping — only process new content. (3) Near-duplicate detection — skip entries already in the target file.

**DraftReplies folder:** Skips the folder configured as `draft_replies_folder` in projects.yaml — handled by myna-draft-replies.

**Example:** User says "process my email" → reads 12 new emails → decomposes into timeline updates, tasks, recognition, observations → moves to Processed/ → "Processed 12 emails from 3 folders. 8 items written directly, 2 in review queue."

---

#### 7. myna-draft-replies

Processes a configured email folder where the user has forwarded emails with drafting instructions. Reads the original thread as context and the user's forwarded message as instructions for what to draft.

**Features covered:** Email Draft Reply (DraftReplies folder path), Follow-Up Meeting Draft (via forwarded email)

**Example invocations:** "process my draft replies", "any draft requests?", "check my drafts folder"

**Reads:** email MCP (configured `draft_replies_folder` from projects.yaml), communication-style.yaml, person files (audience tier), project files

**Writes:** `Drafts/` (e.g., `[Email] Reply to vendor.md`). Moves processed emails to `{draft_replies_folder}/Processed/`.

**Example:** User forwards a vendor proposal to DraftReplies with note "decline politely, keep door open for Q4" → reads original thread, creates diplomatic decline draft in `Drafts/` → "Draft created. 1 email processed from DraftReplies."

---

#### 8. myna-prep-meeting

Generates or updates meeting prep for a specific meeting or all remaining meetings today. Includes conversation coaching for sensitive items. Meeting type inferred from calendar data (D022).

**Features covered:** Meeting File Prep section, meeting type inference, conversation coaching

**Example invocations:** "prep for my 1:1 with Sarah", "prep for my remaining meetings", "update prep for my meetings"

**Reads:** calendar MCP, person files, project files, task items, meeting history (carry-forward), communication-style.yaml, meetings.yaml

**Writes:** `Meetings/1-1s/{person}.md`, `Meetings/Recurring/{name}.md`, or `Meetings/Adhoc/{YYYY-MM-DD}-{name}.md` — Prep section

**Meeting type determines prep depth:** 1:1 (follow-through, pending feedback, coaching), project meeting (tasks, timeline, blockers), standup (updates, delegations), design review (doc link, decisions), cross-team (dependencies, recent comms).

**Example:** User says "prep for my 1:1 with Sarah" → generates prep: follow-through check, pending feedback with coaching suggestion, carry-forward items, personal notes → all as checkboxes.

---

#### 9. myna-process-meeting

Reads a meeting file (Prep + Notes) after the meeting and routes extracted data to the vault. Checked prep items resolved, unchecked items carry forward, notes decomposed into tasks, decisions, observations, recognition, contributions.

**Features covered:** Process Meeting, Universal Done (meeting path)

**Example invocations:** "process this meeting", "process my meetings", "done with 1:1 with Sarah"

**Reads:** meeting file, projects.yaml, people.yaml

**Writes:** project timelines, task items, person files, `Journal/contributions-{week}.md`, review queues, `_system/sources/`

**Example:** User says "done with 1:1 with Sarah" → checked items marked resolved → unchecked carried → "Sarah to draft API spec by Friday" → task [Auto] → "Go with Option B" → timeline entry [Auto] → "Processed 1:1 with Sarah. 3 tasks, 1 decision, 1 observation."

---

#### 10. myna-brief-person

Synthesizes everything Myna knows about a person: role, shared projects, open items, pending feedback, 1:1 history, and personal notes. Reads across multiple vault files to produce a focused summary.

**Features covered:** Person Briefing (role, shared projects, open items, pending feedback, 1:1 history, personal notes)

**Example invocations:** "brief me on Sarah", "what do I know about Sarah?", "Sarah overview"

**Reads:** person files, project files, meeting files (1-1s/), task items, contributions log

**Writes:** inline output (not saved unless user asks)

**Example:** User says "brief me on Sarah" → role/team, 3 active shared projects with status, last 1:1 (March 28 — 2 carry-forward items), open items between you, pending feedback, personal notes.

---

#### 11. myna-brief-project

Summarizes a project's current status. Two modes: quick (3-5 bullet TL;DR) and full (complete status with timeline, blockers, task breakdown, upcoming meetings).

**Features covered:** Project Status Summary (quick and full modes)

**Example invocations:** "catch me up on auth migration", "catch me up quick on [project]", "project status: [project]"

**Reads:** project files, task items, meeting files, email threads (via MCP), contributions log

**Writes:** inline output (not saved unless user asks)

**Example:** User says "catch me up quick on auth migration" → "Auth Migration: On track. API spec review due Friday. 1 blocker (dependency on Platform API). Next milestone: staging deploy April 15."

---

#### 12. myna-team-health

Point-in-time dashboard for all direct reports. Shows open tasks, overdue items, feedback gaps, attention gaps, and last 1:1 date for each person. For managers only.

**Features covered:** Team Health Overview (point-in-time dashboard for all directs)

**Example invocations:** "how is my team doing?", "team health", "team overview"

**Reads:** person files (directs), task items, meeting files, team files, contributions log

**Writes:** inline output (not saved unless user asks)

**Example:** User says "how is my team doing?" → table: Sarah (5 open, 1 overdue, 12-day feedback gap, last 1:1 Apr 2), Alex (8 open, 3 overdue, 45-day feedback gap, last 1:1 Mar 28).

---

#### 13. myna-unreplied-threads

Queries unreplied email and Slack threads. Two directions: waiting on you (threads you haven't responded to) and waiting on them (threads where you're waiting for a reply).

**Features covered:** Unreplied Tracker queries (waiting on you vs waiting on them)

**Example invocations:** "what am I waiting on?", "what's waiting for me?", "unreplied threads", "who owes me a reply?"

**Reads:** email MCP, Slack MCP, person files, workspace.yaml (user identity for sender matching)

**Writes:** inline output

**Example:** User says "what am I waiting on?" → scans threads → "Waiting on 3 replies: Sarah (API spec, 2 days), Alex (infra proposal, 5 days), James (budget approval, 1 week)."

---

#### 14. myna-blockers

Scans all active projects for blockers — items marked as blockers in project timelines, tasks with dependency type, and overdue items blocking downstream work.

**Features covered:** Blocker Detection (scan all active projects)

**Example invocations:** "what's blocked?", "show me blockers", "any blockers across projects?"

**Reads:** project files, task items, meeting files

**Writes:** inline output

**Example:** User says "what's blocked?" → scans active projects → "2 blockers: Auth Migration (API dependency, waiting on Platform team since Apr 3), Onboarding Flow (design review not scheduled, blocks implementation)."

---

#### 15. myna-1on1-analysis

Cross-session statistical analysis of 1:1 meetings with a specific person. Surfaces trends in topics discussed, action item completion rates, carry-forward patterns, feedback cadence, and relationship health over time.

**Features covered:** 1:1 Pattern Analysis (cross-session statistical analysis)

**Example invocations:** "1:1 trends with Sarah", "analyze my 1:1s with Alex", "1:1 patterns"

**Reads:** meeting files (1-1s/), person files, task items, contributions log

**Writes:** inline output

**Example:** User says "1:1 trends with Sarah" → analyzes last 8 sessions → "Trend: action item completion improved (60% → 85%). Recurring topic: API spec (4 of last 6 sessions). Career development hasn't come up in 3 sessions. Average carry-forward: 1.5 items."

---

#### 16. myna-performance-narrative

Generates performance narrative documents from vault data — observations, contributions, meeting history, and project outcomes for a specific person. Also provides review calibration: flags gaps, checks consistency, and highlights items that may be over- or under-weighted.

**Features covered:** Performance Narrative generation + Review Calibration

**Example invocations:** "build Sarah's review narrative", "performance summary for Sarah", "calibrate Sarah's review", "draft Sarah's performance review"

**Reads:** person files (observations, recognition, pending feedback), project files, meeting history (1-1s/), contributions log

**Writes:** `Drafts/` (narrative docs with [Self] prefix)

**Example:** User says "build Sarah's review narrative" → compiles: 12 observations (8 strengths, 4 growth areas), 5 recognition entries, 3 project contributions → narrative with evidence links → calibration check: "Growth area 'documentation' has only 1 observation — consider gathering more data. Strength 'incident response' is well-evidenced (3 observations, 1 recognition)."

---

#### 17. myna-draft

Produces polished professional writing. Covers drafts triggered by conversation context — email replies, follow-ups, status updates, recognition, meeting invites, conversation prep, and monthly reports. Does not handle message rewrites (see myna-rewrite).

**Features covered:** Email Draft Reply (conversation path), Follow-Up Email, Follow-Up Meeting Draft, Structured Draft (status/escalation), Recognition Draft, Help Me Say No, Difficult Conversation Prep, Monthly Update (MBR/MTR/QBR)

**Example invocations:** "draft reply to James", "status update for auth migration", "draft recognition for Sarah", "help me say no to ...", "help me prepare for [conversation]", "monthly update"

**Reads:** communication-style.yaml, person files (audience tier), project files, meeting files, email threads (via MCP), contributions log

**Writes:** `Drafts/` (prefixed filenames like `[Email] Reply to James.md`), inline output

**BLUF is contextual, not automatic.** Use BLUF for structured professional communications. Don't force it on casual messages or recognition notes.

**Example:** User says "status update for auth migration for my VP" → reads project file → executive-length BLUF: bottom line, 3 progress bullets, 1 risk, next steps → "Say 'save' to write to Drafts/."

---

#### 18. myna-rewrite

Transforms an existing message. Three modes: fix (grammar only), tone (adjust for audience), rewrite (full restructure from rough notes). Input is user-provided text; output is the transformed version.

**Features covered:** Message Rewriting (fix/tone/rewrite modes)

**Example invocations:** "rewrite this for my VP", "fix this message", "adjust the tone to be more diplomatic", "clean up this Slack message"

**Reads:** communication-style.yaml, person files (audience tier)

**Writes:** inline output. User can say "save" to write to `Drafts/`.

**Modes:** Fix preserves structure and voice. Tone adjusts for target audience while keeping content recognizable. Rewrite treats input as rough notes and fully restructures.

**Example:** User says "rewrite this for my VP" + pastes rough message → detects audience tier (upward), applies executive preset → concise, BLUF-structured rewrite → shown inline.

---

#### 19. myna-capture

Routes user-entered data to the right vault destinations. Handles quick multi-destination capture, targeted logging (observations, contributions, recognition), task creation and recurring tasks, notes, and link saving.

**Features covered:** Quick Capture, Observations & Feedback Logging, Recognition Tracking, Task Management (add, recurring), Link Manager, Project/Person File Management

**Example invocations:** "capture: [anything]", "observation about Sarah: ...", "add task: ...", "create recurring task: ...", "save link: [url]", "update status of auth migration to paused"

**Reads:** projects.yaml, people.yaml, existing vault files (dedup check)

**Writes:** person files, project files/timelines, task items, `Journal/contributions-{week}.md`, `_system/links.md`, review queues

**Quick Capture routing:** "capture: Sarah did a great job, auth migration unblocked" → recognition for Sarah [Auto] → person file, timeline update [Auto] → project file, contribution [Inferred] → contributions log. One input, multiple destinations.

**Example:** User says "add task: review Sarah's design doc by Friday" → creates formatted TODO in the right project file with due date and priority.

---

#### 20. myna-calendar

Creates time blocks, reminders, and follow-up meeting drafts on the calendar. Also handles task breakdown. All calendar writes are personal events only — never with attendees.

**Features covered:** Time Block Planning, Calendar Reminders, Task Breakdown

**Example invocations:** "reserve 2 hours Thursday for the design doc", "remind me about the design review at 2pm", "block focus time tomorrow morning", "break down [task]"

**Reads:** calendar MCP (free slots), task items, project files, workspace.yaml (work hours, timezone)

**Writes:** calendar events (personal only, no attendees — D003 three-layer protection), task files (subtasks from breakdown)

**Three-layer calendar protection (D003):** (1) Agent instruction: never add attendees. (2) Pre-tool check: rejects calls with attendees or missing prefix. (3) Explicit confirmation: shows all parameters before creating.

**Example:** User says "reserve 2 hours Thursday for the design doc" → finds 9-11am free → "[Myna:Focus] Design doc review, Thursday 9:00-11:00 AM. Create this event?" → confirmed → created.

---

#### 21. myna-self-track

Logs your contributions and generates self-review documents from them. Handles both input (logging what you did) and output (brag docs, self-reviews, promo packets, queries).

**Features covered:** Contributions Tracking, Self-Narrative Generation (brag doc, self-review, promo packet), Contribution Queries, Self-calibration

**Example invocations:** "log contribution: led the auth migration design review", "what did I do this quarter?", "draft my self-review for H1", "build my promo case", "am I underselling myself?"

**Reads:** `Journal/contributions-{week}.md`, project timelines, person files, meeting files

**Writes:** `Journal/contributions-{week}.md` (logging), `Drafts/` (self-review docs with [Self] prefix), inline output

**Self-calibration:** Compares draft claims against contributions log. Flags claims without evidence, missing contributions, and weak language.

**Example:** User says "what feedback did I give this quarter?" → filters contributions → "8 feedback entries: 3 for Sarah, 2 for Alex, 3 for Marcus. Last feedback to Maya: 47 days ago."

---

#### 22. myna-park

Saves working context for later resumption. The parked file must be detailed enough that a new session can resume with zero context loss.

**Features covered:** Park & Resume

**Example invocations:** "park this", "resume auth migration", "resume" (shows list), "switch to [project]", "what's parked?"

**Reads:** current conversation context, vault files referenced in conversation, project files

**Writes:** `_system/parked/{topic}.md`

**Parked file contents:** topic, one-line summary, referenced files (wiki-linked), discussion summary, current state, next steps, open questions, key constraints, timestamp.

**Example:** User says "park this" → saves topic, files, discussion state, next steps → "Parked. Resume with 'resume auth caching'."

---

#### 23. myna-process-review-queue

Processes review queue items. Two interaction modes: work through items interactively in chat, or edit queue files in Obsidian and tell the assistant to process approved items.

**Features covered:** Review Queue processing (review-work, review-people, review-self)

**Example invocations:** "review my queue", "process review queue", "what's in my queue?", "process approved items"

**Reads:** `ReviewQueue/review-work.md`, `ReviewQueue/review-people.md`, `ReviewQueue/review-self.md`

**Writes:** destination files (approved items with [Verified] tag), `ReviewQueue/processed-{YYYY-MM-DD}.md` (audit trail)

**Two modes:** Chat mode (items presented one by one, user approves/edits/skips/discards) and file mode (user checks items in Obsidian, then "process my queue" processes checked items only).

**Example:** User says "review my queue" → "5 items across 3 queues. (1) Task — can't determine owner. (2) Timeline entry — conflicting signals..." → User: "approve 1, assign to me. discard 2. approve the rest."

---

### Main-Agent Direct Operations

These operations are simple enough that the main agent handles them without activating a skill:

- **Vault-wide search:** "search: auth migration" → runs Grep across vault files, groups results by folder
- **Link find:** "find link: MBR Jan" → searches `_system/links.md` and entity link sections
- **Task completion:** "done with [task]" → marks TODO as complete (simple metadata update, no skill needed)
- **Draft deletion:** "delete the MBR draft" → removes the draft file from Drafts/.
- **Universal Done routing:** "done with X" → resolves X via fuzzy name resolution. If meeting → activates myna-process-meeting. If task → marks complete directly. If draft → updates state directly. If ambiguous → asks (never guesses between a meeting and a task with similar names).
- **Inbox routing:** "process my inbox", "sort my inbox", "what's in my inbox?" → always routes to myna-email-triage, not myna-process-messages. Inbox = unsorted email that needs classification first.
- **Planning routing:** Calendar-specific requests ("reserve time", "remind me", "block focus time") → routes to myna-calendar. General planning ("what should I focus on?", "plan my day") → routes to myna-plan. Day setup ("sync", "good morning") → routes to myna-sync.
- **File creation from template:** "create project file for auth migration" → reads projects.yaml, creates `Projects/auth-migration.md` from template. Same for person files. Simple enough for the main agent.

---

## 3. Agent Structure

Myna runs as **one main agent** with three layers of instructions:

### Main Agent Prompt

The lean agent body at `agents/agent.md` in the plugin directory, referenced as `myna:agent`. Contains:

- **Identity:** who Myna is, what it does
- **Routing logic:** supplementary guidance for edge cases — Universal Done, ambiguous intent, triage vs process distinction. Most routing is handled automatically by Claude Code's skill description matching.
- **Simple operations:** vault search, link find, task completion, draft deletion, file creation from template
- **No steering rules inlined** — those are preloaded via the `skills:` frontmatter field
- **No feature-specific instructions** — those live in skills

Frontmatter:
```yaml
---
name: agent
description: Chief of Staff for tech professionals
skills:
  - myna:steering-safety
  - myna:steering-conventions
  - myna:steering-output
  - myna:steering-system
  - myna:steering-memory
  - myna:steering-vault-ops
---
```

### Routing Principle

The main agent routes by **user intent**, not keyword matching. Users speak naturally — "what's going on with auth migration?" routes to myna-brief-project the same way "catch me up on auth migration" does. The example invocations listed per skill are illustrative, not commands.

Auto-invocation handles most cases: Claude Code matches the user's request against skill descriptions and loads the appropriate skill. The routing logic in the main agent is supplementary guidance for edge cases (Universal Done resolution, ambiguous intent between multiple skills, triage vs process distinction).

**When intent is ambiguous** — when the user's request could reasonably map to multiple skills — the agent presents the relevant options with one-line descriptions and asks which they meant.

### Steering Skills

Cross-cutting rules preloaded at startup via the agent's `skills:` frontmatter field. Each is a skill with `user-invocable: false`. Always in context, separate from the main prompt so they can be maintained independently.

| Steering skill | Contents |
|----------------|----------|
| myna:steering-safety | Draft-never-send, vault-only writes, external content as data (content framing delimiters), confirm before bulk writes |
| myna:steering-conventions | Provenance marker rules, append-only discipline, date+source format, Obsidian conventions (tags, wiki-links, callouts, Dataview, Tasks plugin syntax) |
| myna:steering-output | Human-sounding output rules, BLUF default, file links in output, no AI tells |
| myna:steering-system | Feature toggle checking, config reload, graceful degradation, error recovery with retry TODOs, relative date resolution |
| myna:steering-memory | Two-layer memory precedence (hard rules → CLAUDE.md), session-start loading |
| myna:steering-vault-ops | Vault file I/O patterns, task query patterns (grep-based), frontmatter parsing, backlink/tag search, template creation, daily/weekly note path conventions |

### Feature Skills

23 feature skills at `skills/{name}/SKILL.md` in the plugin directory. At startup, only each skill's name and description are in context (progressive disclosure). When the user's request matches a skill's description — or the user invokes it with `/myna:{name}` plus natural language arguments — Claude Code loads the full SKILL.md content.

Skills read config files and vault files as needed. Each skill's instructions describe what to do, where to read, where to write, and what rules to follow.

---

## 4. Vault Structure

All Myna files live under a configurable subfolder (default: `myna/`) in the user's Obsidian vault. Myna never writes outside this folder. Myna can read files anywhere in the vault if the user points to them.

```
myna/
├── Projects/                    # One file per project
│   ├── auth-migration.md
│   ├── platform-api.md
│   └── ...
├── People/                      # One file per person
│   ├── sarah-chen.md
│   ├── alex-kumar.md
│   └── ...
├── Meetings/                    # Meeting files by type
│   ├── 1-1s/                    # One file per person, sessions appended
│   │   ├── sarah-chen.md
│   │   └── ...
│   ├── Recurring/               # Team meetings, standups, syncs
│   │   ├── weekly-sync.md
│   │   └── ...
│   └── Adhoc/                   # One-off meetings
│       └── ...
├── Drafts/                      # All drafts, flat folder, prefixed filenames
│   ├── [Email] Reply to James.md
│   ├── [Status] Auth Migration April.md
│   └── ...
├── Journal/                     # Daily/weekly notes, contributions
│   ├── 2026-04-05.md                # Daily note ({YYYY-MM-DD}.md)
│   ├── 2026-W14.md                  # Weekly note ({YYYY-WNN}.md, Monday start)
│   ├── contributions-2026-04-01.md  # Weekly contributions (Monday date)
│   └── Archive/                 # Old daily/weekly notes (auto-archived by sync)
├── Team/                        # Team health tracking (managers)
│   └── platform-team.md
├── ReviewQueue/                 # Review queue files
│   ├── review-work.md
│   ├── review-people.md
│   ├── review-self.md
│   └── review-triage.md
└── _system/                     # Myna internals
    ├── config/                  # 6 YAML config files
    │   ├── workspace.yaml
    │   ├── projects.yaml
    │   ├── people.yaml
    │   ├── meetings.yaml
    │   ├── communication-style.yaml
    │   └── tags.yaml
    ├── templates/               # File templates for all types
    ├── dashboards/
    │   └── dashboard.md         # Unified dashboard (Dataview)
    ├── logs/
    │   ├── audit.md             # Agent action log
    │   └── processed-channels.md # Slack dedup timestamps
    ├── sources/                 # Verbatim source text
    │   ├── auth-migration.md    # Sources for this project
    │   ├── sarah-chen.md        # Sources for this person
    │   └── ...
    ├── links.md                 # Central link index
    ├── parked/                  # Parked context files
    └── setup-pending.md         # Skipped setup steps
```

**Design decisions:**
- Top-level folders are things the user interacts with (D012). `_system/` holds internals.
- Tasks are TODO items in project files. Personal tasks with no project go in the daily note — Obsidian Tasks plugin queries them across all files.
- Meeting files are organized by type. 1:1s use one file per person with sessions appended chronologically.
- Drafts use a flat folder with type-prefixed filenames: `[Email] Reply to James.md`, `[Status] Auth Migration April.md`. No subfolders.
- Contributions are weekly files: `Journal/contributions-{YYYY-MM-DD}.md` (Monday date). New file each week.
- Sync auto-archives daily and weekly notes older than a configurable threshold to `Journal/Archive/`.
- Verbatim source text is stored separately in `_system/sources/` (one file per entity) to keep vault files clean while preserving traceability (D015).
- Config files are YAML, stored under `_system/config/`. Personal config is excluded from the Myna source repo — `.example` files are provided instead.

Complete folder structure with naming conventions: see `design/foundations.md` §1.

---

## 5. Config System

Six YAML files under `_system/config/`. Read at session start (not every prompt). Manual edits take effect next session. Full schemas with every field: see `design/foundations.md` §3.

**v1 config approach:** Users edit YAML files directly. The install script (Phase 2) creates the folder structure and drops `.example` config files with sample data as reference. Interactive setup wizard and natural language config management ("add project: ...") are deferred to post-launch (D043).

### workspace.yaml

User identity, preferences, and global settings.

| Field | Required | Default | Purpose |
|-------|----------|---------|---------|
| user.name | Yes | — | Display name |
| user.email | Yes | — | Identifies your messages in email/Slack |
| user.role | Yes | — | engineering-manager, tech-lead, senior-engineer, pm. Drives contribution categories and feature defaults |
| vault.path | Yes | — | Obsidian vault root |
| vault.subfolder | No | myna | Subfolder name for Myna files |
| timezone | No | system | Used for relative date resolution |
| work_hours.start | No | 09:00 | For capacity calculations |
| work_hours.end | No | 17:00 | For capacity calculations |
| timestamp_format | No | YYYY-MM-DD | Used in all vault entries |
| feedback_cycle_days | No | 30 | Gap threshold for feedback gap detection |
| calendar_event_prefix | No | [Myna] | Prefix for time blocks/reminders |
| email.processed_folder | No | per-project | per-project (subfolder in each project folder) |
| features | No | role-based defaults | Map of feature_name → true/false |

### projects.yaml

Projects, their aliases, and source mappings.

```yaml
projects:
  - name: Auth Migration
    aliases: [auth, AM, auth-mig]
    status: active
    email_folders: [Auth Migration/]
    slack_channels: [auth-team, auth-migration]
    description: Migrating auth service to new OAuth provider
    key_people: [Sarah Chen, Alex Kumar]

  - name: Platform API
    aliases: [platform, API]
    status: active
    email_folders: [Platform/]
    slack_channels: [platform-eng]

triage:
  inbox_source: "INBOX"
  folders:
    - name: Reply
      description: Needs a response from me
    - name: FYI
      description: Informational, no action needed
    - name: Follow-Up
      description: Waiting on someone else
    - name: Schedule
      description: Needs a meeting or calendar action
  draft_replies_folder: DraftReplies
```

### people.yaml

People the user works with.

```yaml
people:
  - display_name: Sarah
    full_name: Sarah Chen
    aliases: [SC, schen]
    email: sarah.chen@company.com
    slack_handle: schen
    relationship_tier: direct
    role: Senior Engineer
    team: Platform
    feedback_cycle_days: 21  # override

  - display_name: Alex
    full_name: Alex Kumar
    aliases: [AK]
    relationship_tier: peer
    role: Tech Lead
    team: Infrastructure
```

Only `display_name` and `relationship_tier` are required during setup. Other fields filled in over time.

### meetings.yaml

Optional overrides for meetings where type inference gets it wrong.

```yaml
meetings:
  - name: Weekly Architecture Review
    aliases: [arch review, WAR]
    type: recurring
    project: Platform API
```

Most meetings need no entry — the agent infers type from calendar data (D022).

### communication-style.yaml

Writing style preferences. Populated by the communication style interview or by choosing presets.

```yaml
default_preset: professional
presets_per_tier:
  upward: executive
  peer: conversational
  direct: coaching
  cross-team: diplomatic
sign_off: Best
difficult_message_approach: direct-but-kind
```

Built-in presets: professional, conversational, executive, casual, coaching, diplomatic, concise. Users can mix presets per audience tier.

### tags.yaml

Tag definitions and auto-tagging rules.

```yaml
tags:
  - name: auth-migration
    type: project-based
    project: Auth Migration
  - name: urgent
    type: keyword-based
    keywords: [urgent, critical, ASAP, blocker]
  - name: hiring
    type: keyword-based
    keywords: [interview, candidate, hiring]
```

---

## 6. MCP Integration

### Vault Operations (built-in tools + steering skill)

Myna does NOT ship an MCP server for vault operations. Skills interact with the vault using Claude Code's built-in tools (Read, Write, Edit, Grep, Glob). The `myna-steering-vault-ops` steering skill provides patterns for common vault queries — task lookups, frontmatter parsing, backlink/tag searches, template creation, and daily note path resolution.

This makes Myna a pure markdown system with no runtime dependencies beyond Claude Code. Obsidian is the user's editor, not a required runtime component.

### External MCPs (user-provided)

Myna does NOT build MCPs for email, Slack, or calendar (D005). It connects to whatever the user's company provides.

| MCP | Used by | Required |
|-----|---------|----------|
| Email | myna-process-messages, myna-email-triage, myna-draft-replies, myna-draft (reading threads), myna-brief-person, myna-brief-project, myna-unreplied-threads | No — features gracefully degrade |
| Slack | myna-process-messages, myna-unreplied-threads | No |
| Calendar | myna-sync, myna-prep-meeting, myna-calendar (reading schedule, creating events) | No |

External MCP servers are registered with Claude Code via `claude mcp add`. MCP server names are configured in workspace.yaml so skills know which tool names to call. Skills call MCP tools directly by name (e.g., the tool names from the user's email MCP server). The `mcp_servers` map in workspace.yaml records the server names for reference.

---

> Feature toggles were removed — see D043.

## 7. Review Queue

Four markdown files in `ReviewQueue/`. Each is a checklist the user can edit in Obsidian or process through the myna-process-review-queue skill.

| Queue file | Contains | Populated by |
|------------|----------|-------------|
| review-work.md | Ambiguous tasks, decisions, blockers, delegations, timeline entries | myna-process-messages, myna-process-meeting, myna-capture |
| review-people.md | Ambiguous observations, recognition | myna-process-messages, myna-process-meeting, myna-capture |
| review-self.md | Uncertain contribution candidates | myna-wrap-up, myna-process-messages, myna-process-meeting |
| review-triage.md | Email triage folder recommendations | myna-email-triage |

**Key principle (D024):** most items skip the queue via provenance markers. The queue is reserved for genuinely ambiguous items — things the agent can't confidently write with [Auto] or [Inferred]. If the queue is consistently full of obvious items, confidence thresholds need tuning.

**Processing flow:** approve → write to destination with [Verified] tag. Edit → modify then approve. Skip → leave for later. Discard → remove.

Full routing rules and examples: see `design/foundations.md` §6.

---

## 8. Provenance Markers

Every agent-written entry carries one of four markers. Tag + compact source at end of line.

| Marker | Meaning | Write path |
|--------|---------|------------|
| [User] | User typed it directly | Direct write |
| [Auto] | All data explicit in source | Direct write |
| [Inferred] | Some fields are agent's guess | Direct write, flagged |
| [Verified] | Was Auto/Inferred, user confirmed | After review queue approval |

```
- Shipped auth migration on time [Auto] (email, Sarah, 2026-03-15)
- Strong escalation handling [Inferred] (meeting, 1:1 with Sarah, 2026-03-20)
- Led the design review [User]
```

**Litmus test:** Would two reasonable people read this differently? If yes → review queue instead of [Inferred].

Full decision framework, per-domain examples, and placement rules: see `design/foundations.md` §4.

---

## 9. Cross-Domain Data Flow

Information flows between vault domains through skills. Here are the primary flows:

### Email/Slack → Vault (myna-process-messages)
```
Email MCP → myna-process-messages → project timelines (Projects/)
                                  → task items (Projects/)
                                  → person files (People/)
                                  → contributions log (Journal/contributions-{week}.md)
                                  → review queues (ReviewQueue/)
                                  → source files (_system/sources/)
```

### Meeting → Vault (myna-process-meeting)
```
Meeting file (Meetings/) → myna-process-meeting → project timelines
                                                 → task items
                                                 → person files
                                                 → contributions log
                                                 → review queues
```

### Daily cycle
```
Morning: myna-sync → reads calendar, tasks, queues → writes daily note, meeting preps
During day: myna-capture, myna-process-messages, meetings → writes across vault
Evening: myna-wrap-up → reads daily note, tasks → writes end-of-day, contributions, tomorrow's note
```

### Cross-domain coordination

When one skill depends on data another skill manages:

| Scenario | How it works |
|----------|-------------|
| myna-prep-meeting needs task data from myna-process-messages | myna-prep-meeting reads task items directly from project files. If myna-process-messages hasn't run yet, task data may be stale — myna-prep-meeting uses whatever is in the vault. No dependency ordering required. |
| myna-wrap-up needs meeting data from myna-process-meeting | Same pattern — myna-wrap-up reads whatever is in the vault. If meetings haven't been processed yet, myna-wrap-up won't detect contributions from those meetings. User can re-run myna-wrap-up after processing. |
| myna-brief-* needs data from all domains | Brief skills read across the vault. Data completeness depends on what skills have run. Brief presents whatever is available. |
| myna-sync generates meeting preps that myna-prep-meeting also generates | myna-sync generates preps for ALL today's meetings. myna-prep-meeting generates for ONE specific meeting. If myna-sync already created a prep, myna-prep-meeting reads it as context and updates (appends delta). |

**No dependency ordering.** Each skill reads whatever is currently in the vault. Skills are not aware of whether other skills have run. If data is stale or missing, the skill works with what's available and the output reflects that. The user controls sequencing by choosing when to invoke each skill.

---

## 10. Claude-First, Not Claude-Only (D046, D053)

Myna v1 targets Claude Code as its runtime (D045). Agent instructions can reference Claude Code capabilities directly — native skills mechanism, MCP server registration, plugin frontmatter.

All agent content — skills, steering, main agent, config schemas — is plain markdown and YAML. This makes it inherently readable by any capable LLM. If someone wants to run Myna on Gemini, Codex, or another tool in the future, they can read the markdown files and write their own wiring. That's an open-source community contribution, not something we architect for upfront.

**Myna distributes as a Claude Code plugin (D053).** No cloning or shell scripts required. Users run `/plugin install myna@agentflock` to install; updates are automatic. The plugin name is `myna`; all skills and the agent are accessed through the `myna:` namespace.

**Plugin directory layout:**

| Artifact | Location in plugin | Access |
|----------|--------------------|--------|
| Main agent | `agents/agent.md` | `myna:agent` |
| Steering skills (6) | `skills/steering-{name}/SKILL.md` | `myna:steering-{name}` (preloaded) |
| Feature skills (23) | `skills/{name}/SKILL.md` | `/myna:{name}` (on demand) |
| Plugin metadata | `.claude-plugin/plugin.json` | Read by Claude Code at install |

**Vault config (`~/.myna/config.yaml`):** Written by `install/claude.sh` on first run (invoked by `/myna:setup`). Stores `vault_path` and `subfolder`. Read at the start of every session. The six user config YAML files live in `{vault_path}/{subfolder}/_system/config/` — these are never overwritten by plugin updates.

**Agent frontmatter** includes `name: agent`, `description`, and `skills` (listing the 6 steering skills for preloading using `myna:` prefix). Other fields (`model`, `tools`, `mcpServers`, `permissionMode`, `memory`) are omitted so Myna inherits session defaults.

**Invocation model:** Plugin-scoped. `myna:agent` is the agent reference. `/myna:sync`, `/myna:plan`, etc. invoke individual skills. Users can set `alias myna="claude --agent myna:agent"` in their shell for the `myna` shorthand. Update flow: plugin updates are managed by Claude Code's plugin system; vault configs are never touched.

The previous two-layer architecture (content layer + adapter layer, D038) has been superseded. See D046 for rationale. The previous install-script model (D047, D049) has been superseded by D053 (plugin distribution).

### Customization Model

Users can extend or override Myna's behavior through three mechanisms, all of which survive plugin updates. (D052)

**Per-skill override files.** Individual built-in skills can be overridden by placing a replacement skill file at `~/.myna/overrides/skills/myna-{skill-name}.md`. At session start, Myna checks this directory and uses the override file in place of the built-in skill for any skill that has a matching entry. This allows targeted behavioral changes to a single skill without touching the plugin's installed files.

**`~/.myna/overrides/routing.md`.** A single file for routing rules that cover user-added skills or that override how Myna dispatches to built-in skills. The agent reads this file at session start if it exists and applies its rules before the built-in routing table. Created by `/myna:init` only if missing; never overwritten by updates.

**User skill directories.** Custom skills are added to `~/.claude/skills/` using a prefixed naming pattern (e.g., `myna-amazon-oncall/SKILL.md`) to avoid conflicting with built-in plugin skill names. Routing rules for user-added skills go in `~/.myna/overrides/routing.md`.

**Update behavior summary:**

| Artifact | On update |
|----------|-----------|
| Built-in skill `SKILL.md` files (in plugin directory) | Managed by Claude Code plugin updates |
| `~/.myna/overrides/` | Never overwritten by plugin updates |
| User skill directories in `~/.claude/skills/` | Never touched by plugin updates |
| `~/.myna/config.yaml` | Never overwritten by plugin updates |
| Vault config YAML files | Never overwritten by plugin updates |

---

## 11. Draft-Never-Send

Myna drafts all outbound communications but never sends them. Every draft requires the user to manually copy and send outside of Myna. The only external write is personal calendar events with no attendees (D003). This rule is in the myna-steering-safety skill and checked by every skill that produces outbound content.

---

## 12. Reference Skill Selection

**Reference skill: myna-capture.**

The `myna-capture` skill is built first in Phase 1 because it exercises the most representative patterns while being fully testable locally.

**Why myna-capture:**

1. **Covers the projects-and-tasks domain** (aligned with D026) — task management, project file updates, project timeline writes
2. **Exercises all core patterns:** multi-destination routing (quick capture goes to multiple destinations), provenance markers (all four types — user-typed [User], explicit data [Auto], inferred [Inferred], ambiguous → review queue), fuzzy name resolution, append-only discipline, cross-domain writes (observations → People/, tasks → Projects/, contributions → Journal/)
3. **Testable locally with no MCP dependency** — user types observations, tasks, and captures using Myna's own development work as test data (D027)
4. **Covers the "process paste" pattern** — Quick Capture with pasted external content exercises the external-content-as-data treatment, covering the pattern D026 identified as needing explicit exercise
5. **Immediately useful** — the user can start tracking Myna development tasks, observations, and contributions right away
6. **Patterns transfer to other skills** — the multi-destination routing and provenance tagging patterns established here are reused by myna-process-messages (email/Slack extraction), myna-process-meeting (meeting note extraction), and myna-wrap-up (contribution detection)

**Alternative considered:** myna-process-meeting — exercises the extraction pipeline more heavily but is a narrower workflow (single meeting → vault). myna-capture exercises more pattern diversity (task creation, observation logging, link saving, project updates, contribution tracking) in addition to the core routing/provenance patterns.

---

## 13. Memory Model

Myna maintains two layers of behavioral rules with explicit precedence. The layers are loaded together at session start and compose at runtime.

### Two Layers

| Layer | Lives in | Authoritative for | Skill writes? |
|-------|----------|-------------------|---------------|
| Hard rules | 6 steering skills (myna-steering-*) | Safety, scope, draft-never-send, vault-only writes, append-only discipline, vault tool patterns | Never |
| Workspace config | `CLAUDE.md` / `workspace.yaml` | User preferences, project context, initial configuration | Never (user edits directly) |

### Runtime Precedence

1. **Hard rules in steering ALWAYS win.** Immutable at runtime; cannot be overridden by any `CLAUDE.md` entry or workspace config.
2. **`CLAUDE.md` / `workspace.yaml` applies** otherwise.

### Session Memory Save (Wrap-Up)

At the end of each day, myna-wrap-up saves behavioral corrections observed during the session to Claude Code memory (feedback type). These corrections persist across sessions as part of Claude Code's native memory mechanism. No separate skill or vault folder is required.

The full resolution rule lives in the myna-steering-memory skill.

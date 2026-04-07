# Myna — Architecture

## 1. Overview

Myna is a set of AI agent instructions that turn any capable LLM into a personal assistant for tech professionals. The user types natural language prompts inside their AI agent (Kiro CLI, Claude Code, etc.). Myna reads from external sources (email, Slack, calendar) via company-provided MCP servers and writes exclusively to a local Obsidian vault under a single `myna/` subfolder.

Architecturally, Myna is one main agent with 14 skills. The main agent handles routing, always-on safety rules, and simple operations. Skills handle feature-specific workflows and are loaded on demand (progressive disclosure — only their name and description are in context until activated). Cross-cutting rules live in steering files that are always loaded. Config lives in 6 YAML files read at session start.

There are no subagents in v1. No automatic skill chaining — each skill outputs its result and tells the user what to do next if a follow-up action is needed.

---

## 2. Skill Inventory

### Overview

| # | Skill | One-liner | Example trigger |
|---|-------|-----------|-----------------|
| 1 | sync | Start or refresh your day | "sync" |
| 2 | process | Extract data from email, Slack, or documents | "process my email" |
| 3 | triage | Classify and sort inbox emails | "triage my inbox" |
| 4 | prep-meeting | Prepare for a meeting | "prep for my 1:1 with Sarah" |
| 5 | process-meeting | Process notes after a meeting | "done with 1:1 with Sarah" |
| 6 | brief | Get a briefing or summary | "brief me on Sarah" |
| 7 | capture | Log data to the vault | "capture: auth migration unblocked" |
| 8 | draft | Write professional content | "draft reply to James" |
| 9 | calendar | Time blocks, reminders, task breakdown | "reserve 2 hours Thursday" |
| 10 | wrap-up | Close out the day or week | "wrap up" |
| 11 | review | Process review queue items | "review my queue" |
| 12 | self-track | Generate self-review documents | "build my promo case" |
| 13 | park | Save and resume context | "park this" |
| 14 | draft-replies | Process draft requests from email folder | "process my draft replies" |

### Skill Details

#### 1. sync

Sets up or refreshes your day. Creates the daily note (or prepends a new snapshot if re-run), generates meeting prep files for today's meetings, surfaces overdue tasks, delegation alerts, blocker flags, review queue count, and upcoming milestones. Suggests priorities and flags over-commitment. Auto-archives old journal notes.

**Features covered:** Morning Sync, Daily Note, Weekly Note (created on first sync of the week), Planning (plan day, priority coaching, week optimization), Journal auto-archiving

**Example invocations:** "sync", "good morning", "set up my day", "plan my day", "plan tomorrow", "what should I focus on today?", "priority coaching", "week optimization"

**Reads:** calendar MCP, workspace.yaml, projects.yaml, people.yaml, meetings.yaml, existing daily note, task items across project files, review queue files, person files, previous meeting files (for carry-forward)

**Writes:** `Journal/DailyNote-{date}.md` (daily note), `Journal/WeeklyNote-{date}.md` (weekly note), `Meetings/` prep files

**Example:** User says "sync" → reads calendar (4 meetings, 2 hrs total), open tasks (2 overdue, 5 hrs estimated), delegation alerts (1 overdue from Marcus) → creates daily note with Capacity Check (5 hrs focus time vs 6 hrs task effort — over-capacity), Immediate Attention, Today's Meetings (linked to prep files), priority suggestions (top 3: API spec review due tomorrow, delegation follow-ups, MBR draft deferred twice) → generates prep for each meeting → "Sync complete (8:30 AM). 4 meetings, 2 overdue tasks, 1 overdue delegation, 5 items in review queue. Top priority: API spec review (due tomorrow)."

---

#### 2. process

Extracts structured data from email, Slack, or pasted documents and routes each item to the right vault destination. A single input can produce entries for multiple destinations — a project timeline update, a person observation, a task, and a contribution all from one email. Three-layer deduplication prevents reprocessing.

**Features covered:** Email Processing, Messaging Processing, Document Processing, Deduplication (3 layers), Meeting Summaries from Email (detected and dual-path routed), Unreplied Tracker (populated as byproduct)

**Example invocations:** "process my email", "process my messages", "process my communications", "process this doc: [paste]"

**Reads:** email MCP (mapped project folders), Slack MCP (mapped channels), workspace.yaml, projects.yaml, people.yaml, existing vault files (near-duplicate check), `_system/logs/processed-channels.md` (Slack timestamps)

**Writes:** project timelines, task items in project files, person files, `Journal/contributions-{week}.md`, review queues, `_system/sources/`, `_system/logs/audit.md`

**Deduplication layers:**
1. **Move to Processed/** — email-specific. After processing, move email to a processed folder. Two modes configured in workspace.yaml: **per-project** (default) moves to `{project-folder}/Processed/`, **common** moves all processed emails to one shared folder (e.g., `Processed/`). Next run skips processed emails.
2. **Quote stripping** — strip quoted content before extraction. Only process new content.
3. **Near-duplicate detection** — before writing an entry, read the target file and review queue. If a similar entry already exists (same action + same entity from the same source thread), skip it and inform the user.

For Slack: store last-processed timestamp per channel in `_system/logs/processed-channels.md`.

**DraftReplies folder:** The process skill skips the folder configured as `draft_replies_folder` in projects.yaml — that folder is handled by the separate `draft-replies` skill.

**Example:** User says "process my email" → reads 12 new emails from Auth Migration folder → email from Sarah about API timeline produces: timeline update [Auto], task "Review API spec by Friday" [Auto] (explicit owner, date, action), recognition entry [Inferred] (agent interpreted praise) → moves processed emails to Processed/ → "Processed 12 emails from 3 folders. 8 items written directly, 2 in review queue."

---

#### 3. triage

Sorts inbox emails into folders. Triage is purely about classification — it never touches the vault. Three-step flow: (1) agent reads inbox and writes folder recommendations, (2) user edits in Obsidian, (3) user says "process triage" to move emails to their assigned folders.

**Features covered:** Email Triage (all 3 steps)

**Example invocations:** "triage my inbox", "process my inbox", "sort my inbox", "process triage"

**Reads:** email MCP (inbox), projects.yaml (project folders, triage folders, custom folders with descriptions)

**Writes:** `ReviewQueue/review-triage.md` (step 1). Step 3 ("process triage") moves emails to their approved folders via email MCP — nothing else.

**Inbox source:** Configured in projects.yaml under `triage.inbox_source`. If not configured, triage is unavailable.

**Folder recommendations draw from three sources:**
- **Project folders** from projects.yaml — agent recommends which project an email belongs to (e.g., "Auth Migration/")
- **Triage folders** — built-in classification (Reply/, FYI/, Follow-Up/) or user-defined categories
- **Custom folders** — user-defined folders with descriptions (e.g., "Trainings" → "training invitations, course materials, learning resources"). Agent uses the descriptions to match emails.

**After triage:** emails are now in folders. To extract vault data from them, the user runs "process my email" → the process skill picks up emails in project-mapped folders. Triage and process are completely separate — triage sorts, process extracts.

**Example:** User says "triage my inbox" → reads 30 inbox emails, reads project folders and custom folder descriptions from config → writes to review-triage.md: each email gets a recommended folder (Auth Migration/, Reply/, Trainings/, FYI/) with reasoning → "30 emails triaged. Edit review-triage.md in Obsidian, then say 'process triage' to move them."

---

#### 4. prep-meeting

Generates or updates meeting prep for a specific meeting or all remaining meetings today. Includes conversation coaching for sensitive items (pending feedback, overdue delegations, escalations). Meeting type inferred from calendar data (D022).

**Features covered:** Meeting File Prep section, meeting type inference, conversation coaching

**Example invocations:** "prep for my 1:1 with Sarah", "prep for my remaining meetings", "update prep for my meetings", "add topic to standup: [topic]"

**Reads:** calendar MCP, person files, project files, task items, meeting history (previous sessions for carry-forward), communication-style.yaml, meetings.yaml

**Writes:** `Meetings/1-1s/{person}.md`, `Meetings/Recurring/{name}.md`, or `Meetings/Adhoc/{name}.md` — Prep section

**Meeting type determines prep depth:**
- **1:1:** follow-through check (did YOU complete your action items?), recent contributions, pending feedback with coaching suggestions, career development context, personal notes
- **Project meeting:** open tasks, recent timeline entries, dependency status, blockers
- **Standup:** your updates, overdue delegations, team blockers
- **Design/doc review:** document link, related decisions, pre-read prep
- **Cross-team:** open dependencies, what you're waiting on, recent comms with attendees

All prep items are checkboxes the user checks off during the meeting. Coaching suggestions only appear for sensitive items (not every checkbox).

**Example:** User says "prep for my 1:1 with Sarah" → generates prep: follow-through check (completed 2/3 action items — missed one listed), pending feedback with coaching suggestion, carry-forward items from last session, personal note ("training for marathon") → all as checkboxes.

---

#### 5. process-meeting

Reads a meeting file (Prep + Notes) after the meeting and routes extracted data to the vault. Checked prep items are resolved, unchecked items carry forward, notes are decomposed into tasks, decisions, observations, recognition, contributions.

**Features covered:** Process Meeting, Universal Done (meeting path)

**Example invocations:** "process this meeting", "process my meetings", "done with 1:1 with Sarah"

**Reads:** meeting file, projects.yaml, people.yaml

**Writes:** project timelines, task items, person files, `Journal/contributions-{week}.md`, review queues, `_system/sources/`

**Meeting-type-aware processing:** 1:1s emphasize observations and feedback. Standups emphasize blockers and status. Design reviews emphasize decisions and alternatives.

**Example:** User says "done with 1:1 with Sarah" → reads meeting file → checked prep items marked resolved → unchecked items carried to next session → "Sarah to draft API spec by Friday" → task [Auto] with `type:: delegation`, `person:: Sarah` → "Go with Option B for caching" → timeline entry [Auto] → "Processed 1:1 with Sarah. 3 tasks, 1 decision, 1 observation."

---

#### 6. brief

Synthesizes information about a person, project, team, thread, or document and presents it inline. Reads across multiple vault files to produce a focused summary.

**Features covered:** Person Briefing, Project Status Summary (quick and full modes), Thread Summary, Team Health Overview (point-in-time snapshot), Unreplied Tracker queries, Blocker Detection surfacing

**Example invocations:** "brief me on Sarah", "catch me up on auth migration", "catch me up quick on [project]", "summarize this thread", "how is my team doing?", "what am I waiting on?", "what's blocked?"

**Reads:** person files, project files, meeting files, task items, email/Slack threads (via MCP), contributions log, team files, Obsidian search MCP

**Writes:** inline output (not saved unless user asks)

**Project Status has two modes:**
- **Quick:** "catch me up quick" → 3-5 bullet TL;DR (status, top blocker, next milestone)
- **Full:** "catch me up" → complete status with timeline, all blockers, task breakdown, upcoming meetings

**Example:** User says "brief me on Sarah" → reads Sarah's person file, shared projects, meeting history, open tasks → output inline: role/team, 3 active shared projects with status, last 1:1 (March 28 — 2 carry-forward items), open items between you (1 delegated task, 1 thing she's waiting on from you), pending feedback, personal notes.

---

#### 7. capture

Routes user-entered data to the right vault destinations. Handles quick multi-destination capture, targeted logging (observations, contributions, recognition), task creation and recurring tasks, notes, and link saving. Updates project status and scratchpad sections.

**Features covered:** Quick Capture, Observations & Feedback Logging (user-typed path), Recognition Tracking (user-typed path), Task Management (add, recurring tasks), Link Manager (save path), Project File Management (adding content, status changes), Person File Management (adding notes/observations)

**Example invocations:** "capture: [anything]", "observation about Sarah: ...", "note about Sarah: ...", "add task: ...", "create recurring task: ...", "save link: [url]", "update status of auth migration to paused"

**Reads:** projects.yaml, people.yaml, existing vault files (dedup check before writing observations)

**Writes:** person files, project files/timelines, task items, `Journal/contributions-{week}.md`, `_system/links.md`, entity link sections, review queues

**Quick Capture routing:** "capture: Sarah did a great job handling the incident, auth migration is unblocked" → decomposes into: recognition for Sarah [Auto] → person file, timeline update [Auto] → project file, contribution [Inferred] → contributions log. One input, multiple destinations, each with its own provenance marker.

**Task creation:**
- "add task: review Sarah's design doc by Friday" → creates formatted TODO in the right project file
- "create recurring task: weekly status update" → task with recurrence syntax

---

#### 8. draft

Produces polished professional writing. Covers all draft types (email replies, follow-ups, status updates, recognition, meeting invites), message rewrites, conversation prep, and monthly/quarterly reports.

**Features covered:** Email Draft Reply (conversation trigger path), Follow-Up Email, Follow-Up Meeting Draft, Message Rewriting (fix/tone/rewrite), Structured Draft (status/escalation), Recognition Draft, Help Me Say No, Difficult Conversation Prep, Monthly Update Generation (MBR/MTR/QBR)

**Example invocations:** "draft reply to ...", "rewrite this for my VP", "fix this message", "status update for auth migration", "escalate this blocker", "draft recognition for Sarah", "help me say no to ...", "help me prepare for [conversation]", "draft follow-up email for [meeting]", "draft follow-up meeting invite", "monthly update"

**Reads:** communication-style.yaml, person files (audience tier), project files, meeting files, email threads (via MCP), contributions log

**Writes:** `Drafts/` (prefixed filenames like `[Email] Reply to James.md`), inline output.

**Rewrite modes:**
- **Fix:** grammar and spelling only. Preserves structure and voice.
- **Tone:** adjusts tone for target audience. User's content stays recognizable.
- **Rewrite:** treats input as rough notes. Full restructure. Output may look different from input.

**BLUF is contextual, not automatic.** Use BLUF (Bottom Line Up Front) for structured professional communications — status updates, escalations, emails to leadership. Don't force BLUF on casual Slack messages, recognition notes, or conversational replies where it would feel stiff. The agent uses judgment based on content type, audience tier, and channel.

**Drafts are just files.** Saved to `Drafts/` with type-prefixed filenames. User deletes the file when done. No lifecycle state tracking in v1.

**Example:** User says "status update for auth migration for my VP" → reads project file (timeline, tasks, blockers) → produces executive-length BLUF: bottom line, 3 progress bullets, 1 risk, next steps → shown inline. "Say 'save' to write to Drafts/."

---

#### 9. calendar

Creates time blocks, reminders, and follow-up meeting drafts on the calendar. Also handles task breakdown. All calendar writes are personal events only — never with attendees.

**Features covered:** Time Block Planning, Calendar Reminders, Task Breakdown

**Example invocations:** "reserve 2 hours Thursday for the design doc", "reserve 3 hours this week for deep work", "remind me about the design review at 2pm", "block focus time tomorrow morning", "break down [task]"

**Reads:** calendar MCP (for finding free slots), task items, project files, workspace.yaml (work hours, timezone)

**Writes:** calendar events (personal only, no attendees — D003 three-layer protection), task files (subtasks from breakdown)

**Calendar events use three-layer protection (D003):**
1. Agent instruction: never add attendees, always use configured prefix
2. Pre-tool check: rejects calls with attendees or missing prefix (where AI tool supports hooks)
3. Explicit confirmation: shows all parameters before creating

**Example:** User says "reserve 2 hours Thursday for the design doc" → reads calendar, finds 9-11am free → shows: "[Myna:Focus] Design doc review, Thursday 9:00-11:00 AM. Create this event?" → user confirms → event created.

---

#### 10. wrap-up

Closes out the day. Compares planned vs actual, logs contributions, moves unfinished items to tomorrow. Also generates weekly summaries.

**Features covered:** End of Day Wrap-Up, Weekly Summary

**Example invocations:** "wrap up", "weekly summary"

**Reads:** daily note (sync snapshots), task items, project timelines, meeting files processed today, contributions log

**Writes:** daily note (End of Day section), tomorrow's daily note (unfinished items), `Journal/contributions-{week}.md` (detected contributions), `ReviewQueue/review-self.md` (uncertain contributions), `Journal/WeeklyNote-{date}.md` (weekly summary)

**Contribution detection:** Scans completed work for items worth tracking. Explicit completions (task done, decision logged) → [Auto]. Interpreted influence (agent thinks you contributed) → [Inferred]. Uncertain → review-self queue.

**Example:** User says "wrap up" → compares morning Immediate Attention against current state → "Completed: API spec review, 2/3 delegation follow-ups. Not started: MBR draft (moved to tomorrow). Contributions: API spec review [Auto], cache question resolution [Inferred]. 1 uncertain contribution in review-self."

---

#### 11. review

Processes review queue items. Two interaction modes: the user can work through items interactively in chat, or edit the queue files directly in Obsidian and then tell the assistant to process approved items.

**Features covered:** Review Queue processing (review-work, review-people, review-self)

**Example invocations:** "review my queue", "process review queue", "what's in my queue?", "process approved items"

**Reads:** `ReviewQueue/review-work.md`, `ReviewQueue/review-people.md`, `ReviewQueue/review-self.md`

**Writes:** destination files (approved items with [Verified] tag), `ReviewQueue/processed-{YYYY-MM-DD}.md` (audit trail of processed items). Approved items are removed from the active queue file and appended to the dated processed file.

**Two interaction modes:**
- **Chat mode:** User says "review my queue" → assistant presents items one by one or in batch. User approves, edits, skips, or discards through conversation.
- **File mode:** User opens queue files in Obsidian, checks the items they've verified, then says "process my queue" → assistant processes only checked items, leaves unchecked items for later.

**Example (chat):** User says "review my queue" → "5 items across 3 queues. (1) Task 'review caching approach' — can't determine owner. (2) Timeline entry — conflicting signals..." → User: "approve 1, assign to me. discard 2. approve the rest."

**Example (file):** User checks 3 of 5 items in review-work.md in Obsidian, then says "process my queue" → assistant writes the 3 checked items to their destinations, moves them to `processed-2026-04-06.md`, leaves the 2 unchecked items in the queue.

---

#### 12. self-track

Logs your contributions and generates self-review documents from them. Handles both the input side (logging what you did) and the output side (brag docs, self-reviews, promo packets, queries).

**Features covered:** Contributions Tracking (user-typed path), Self-Narrative Generation (brag doc, self-review, promo packet), Contribution Queries, Self-calibration mode

**Example invocations:** "log contribution: led the auth migration design review", "I unblocked the platform team on the API issue", "what did I do this quarter?", "draft my self-review for H1", "build my promo case", "am I underselling myself?", "what feedback did I give this quarter?", "show my contributions from March"

**Reads:** `Journal/contributions-{week}.md`, project timelines, person files, meeting files

**Writes:** `Journal/contributions-{week}.md` (logging), `Drafts/` (self-review docs with [Self] prefix), inline output

**Self-calibration:** Compares draft claims against contributions log. Flags claims without evidence, contributions not included, and language weaker than evidence supports.

**Example:** User says "what feedback did I give this quarter?" → filters contributions by coaching/feedback category → "8 feedback entries: 3 for Sarah (growth areas), 2 for Alex (recognition), 3 for Marcus (coaching on incident response). Last feedback to Maya: 47 days ago."

---

#### 13. park

Saves working context for later resumption. The parked file must be detailed enough that a new session can resume with zero context loss.

**Features covered:** Park & Resume

**Example invocations:** "park this", "resume auth migration", "resume" (shows list), "switch to [project]", "what's parked?"

**Reads:** current conversation context, vault files referenced in conversation, project files (for switch)

**Writes:** `_system/parked/{topic}.md`

**Parked file contents:** topic name, one-line summary, every referenced file (with wiki-links), full discussion summary, current state, next steps, open questions, key constraints, timestamp.

**Example:** User says "park this" → saves: topic ("auth caching design"), files referenced, discussion summary (3 approaches explored, rejected Redis, leaning in-memory with TTL), current state (waiting on Sarah's spec), next steps, open questions → "Parked. Resume with 'resume auth caching'."

---

#### 14. draft-replies

Processes a configured email folder where the user has forwarded emails with drafting instructions. For each email: reads the original thread as context and the user's forwarded message as instructions for what to draft (reply, decline, meeting invite, etc.).

**Features covered:** Email Draft Reply (DraftReplies folder trigger path), Follow-Up Meeting Draft (when requested via forwarded email)

**Example invocations:** "process my draft replies", "any draft requests?", "check my drafts folder"

**Reads:** email MCP (configured `draft_replies_folder` from projects.yaml), communication-style.yaml, person files (audience tier), project files

**Writes:** `Drafts/` (e.g., `[Email] Reply to vendor.md`). Moves processed emails to `{draft_replies_folder}/Processed/`.

**How it works:** The user replies to (or forwards) an email, addressing it to a configured alias (e.g., `sid+drafts@company.com`). An email client rule moves it to the DraftReplies folder. The email has two parts: (1) the user's message to the alias — this is the drafting instruction (e.g., "decline politely, suggest next quarter"), and (2) the original thread below — this is context. The skill separates the two: the message addressed to the alias is the instruction, everything below is the source thread to draft against.

**Example:** User forwards a vendor proposal email to DraftReplies with note "say no, we're committed to the current vendor through Q3, keep the door open for Q4" → skill reads the original proposal thread, creates a diplomatic decline draft in `Drafts/`, creates TODO "review and send decline to [vendor]" → "Draft created. 1 email processed from DraftReplies."

---

### Main-Agent Direct Operations

These operations are simple enough that the main agent handles them without activating a skill:

- **Vault-wide search:** "search: auth migration" → runs Obsidian MCP search, groups results by folder
- **Link find:** "find link: MBR Jan" → searches `_system/links.md` and entity link sections
- **Task completion:** "done with [task]" → marks TODO as complete (simple metadata update, no skill needed)
- **Draft deletion:** "delete the MBR draft" → removes the draft file from Drafts/.
- **Universal Done routing:** "done with X" → resolves X via fuzzy name resolution. If meeting → activates process-meeting. If task → marks complete directly. If draft → updates state directly. If ambiguous → asks (never guesses between a meeting and a task with similar names).
- **Inbox routing:** "process my inbox", "sort my inbox", "what's in my inbox?" → always routes to triage, not process. Inbox = unsorted email that needs classification first.
- **Planning routing:** "what should I focus on today?", "plan my day" → routes to sync. Calendar-specific requests ("reserve time", "remind me", "block focus time") → routes to calendar skill.
- **File creation from template:** "create project file for auth migration" → reads projects.yaml, creates `Projects/auth-migration.md` from template. Same for person files. Simple enough for the main agent.

---

## 3. Agent Structure

Myna runs as **one main agent** with three layers of instructions:

### Main Agent Prompt

The always-loaded system prompt. Kept lean to leave room for tool outputs and conversation. Contains:

- **Identity:** who Myna is, what it does
- **Routing logic:** how to match user requests to skills. Includes handling for Universal Done, ambiguous requests, and fallback to "ask the user"
- **Always-on rules:** draft-never-send, vault-only writes, never-assume-always-ask, fuzzy name resolution
- **Voice:** no AI tells, no hedging, concise and direct. Write like a sharp colleague.
- **Simple operations:** vault search, link find, task completion, draft state updates, project/person file creation from template

The main agent prompt does NOT contain feature-specific instructions. Those live in skills.

### Routing Principle

The main agent routes by **user intent**, not keyword matching. Users speak naturally — "what's going on with auth migration?" routes to brief the same way "catch me up on auth migration" does. The example invocations listed per skill are illustrative, not commands. The agent reads the user's message, understands what they're trying to accomplish, and activates the right skill.

**When intent is ambiguous** — when the user's request could reasonably map to multiple skills — the agent presents the relevant options with one-line descriptions and asks which they meant. For example: "I can help a few ways — are you looking to (1) get a status summary of auth migration, (2) process new emails from that project, or (3) draft a status update?" The agent never silently picks one when multiple are plausible.

### Steering Files

Cross-cutting rules loaded into every session. Separate from the main prompt so they can be maintained independently.

| Steering file | Contents |
|---------------|----------|
| safety.md | Draft-never-send, vault-only writes, external content as data (content framing delimiters), confirm before bulk writes |
| conventions.md | Provenance marker rules, append-only discipline, date+source format, Obsidian conventions (tags, wiki-links, callouts, Dataview, Tasks plugin syntax) |
| output.md | Human-sounding output rules, BLUF default, file links in output, no AI tells |
| system.md | Feature toggle checking, config reload, graceful degradation, error recovery with retry TODOs, relative date resolution, prompt logging |

### Skills

14 feature skills loaded on demand. At session start, only the skill name and description are in context. When the user's request matches a skill's description (or the user explicitly invokes it), the full skill instructions are loaded.

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
│   ├── DailyNote-2026-04-05.md       # Daily note
│   ├── WeeklyNote-2026-04-01.md     # Weekly note (Monday start)
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
    │   ├── prompts.md           # User prompt log
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

Complete folder structure with naming conventions: see `foundations.md` §1.

---

## 5. Config System

Six YAML files under `_system/config/`. Read at session start (not every prompt). Manual edits take effect next session. Full schemas with every field: see `foundations.md` §3.

**v1 config approach:** Users edit YAML files directly. The install script (Phase 6) creates the folder structure and drops `.example` config files with sample data as reference. Interactive setup wizard and natural language config management ("add project: ...") are deferred to post-launch (D043).

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
| journal.archive_after_days | No | 30 | Sync auto-archives daily/weekly notes older than this to Journal/Archive/ |
| email.processed_folder | No | per-project | per-project (subfolder in each project folder) or common (one shared folder) |
| email.common_folder | No | Processed/ | Shared folder path, used when processed_folder is "common" |
| prompt_logging | No | true | Log prompts to _system/logs/prompts.md |
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

### Obsidian CLI MCP (shipped by Myna)

The only MCP Myna builds. A thin wrapper around Obsidian CLI (D008) that exposes vault operations:

| Tool | Purpose |
|------|---------|
| search | Vault-wide search using Obsidian's index |
| tasks | List/query tasks via the Tasks plugin |
| daily-note | Create, read, append to daily notes |
| create-from-template | Create notes using Obsidian templates |
| read | Structured file read |
| write | Structured file write (restricted to myna/ subfolder) |
| eval | Run JavaScript (Dataview queries, custom logic) |

Falls back to raw file read/write if Obsidian isn't running. The MCP is lightweight — easy to update as Obsidian releases new CLI features.

### External MCPs (user-provided)

Myna does NOT build MCPs for email, Slack, or calendar (D005). It connects to whatever the user's company provides.

| MCP | Used by | Required |
|-----|---------|----------|
| Email | process, triage, draft (reading threads), brief (thread summary) | No — features gracefully degrade |
| Slack | process, brief (thread summary) | No |
| Calendar | sync, prep-meeting, calendar (reading schedule, creating events) | No |

MCP server names are configured during setup and stored in workspace.yaml. Skills reference them by a generic name (email, slack, calendar); the installer maps these to actual MCP server names at install time.

---

## 7. Feature Toggles

Every feature has a toggle in workspace.yaml under the `features` map (D020).

**How they work:**
1. During setup, the user's role sets default toggles (managers get people management on by default, ICs might have it off)
2. Users can override: "disable self-tracking" / "enable people management" / edit workspace.yaml
3. Every skill checks relevant toggles before acting. Disabled features are silently skipped — not mentioned, not suggested, not included in dashboard/daily note output
4. Toggle granularity is at the feature level, not the skill level. A skill can have some features enabled and others disabled

**Example toggles:**
```yaml
features:
  email_processing: true
  messaging_processing: true
  email_triage: true
  meeting_prep: true
  process_meeting: true
  people_management: true
  self_tracking: true
  team_health: true
  attention_gap_detection: true
  contribution_detection: true
  milestones: true
  time_blocks: true
  calendar_reminders: true
```

---

## 8. Review Queue

Four markdown files in `ReviewQueue/`. Each is a checklist the user can edit in Obsidian or process through the review skill.

| Queue file | Contains | Populated by |
|------------|----------|-------------|
| review-work.md | Ambiguous tasks, decisions, blockers, delegations, timeline entries | process, process-meeting, capture |
| review-people.md | Ambiguous observations, recognition | process, process-meeting, capture |
| review-self.md | Uncertain contribution candidates | wrap-up, process, process-meeting |
| review-triage.md | Email triage folder recommendations | triage |

**Key principle (D024):** most items skip the queue via provenance markers. The queue is reserved for genuinely ambiguous items — things the agent can't confidently write with [Auto] or [Inferred]. If the queue is consistently full of obvious items, confidence thresholds need tuning.

**Processing flow:** approve → write to destination with [Verified] tag. Edit → modify then approve. Skip → leave for later. Discard → remove.

Full routing rules and examples: see `foundations.md` §6.

---

## 9. Provenance Markers

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

Full decision framework, per-domain examples, and placement rules: see `foundations.md` §4.

---

## 10. Cross-Domain Data Flow

Information flows between vault domains through skills. Here are the primary flows:

### Email/Slack → Vault (process skill)
```
Email MCP → process → project timelines (Projects/)
                    → task items (Projects/)
                    → person files (People/)
                    → contributions log (Journal/contributions-{week}.md)
                    → review queues (ReviewQueue/)
                    → source files (_system/sources/)
```

### Meeting → Vault (process-meeting skill)
```
Meeting file (Meetings/) → process-meeting → project timelines
                                           → task items
                                           → person files
                                           → contributions log
                                           → review queues
```

### Daily cycle
```
Morning: sync → reads calendar, tasks, queues → writes daily note, meeting preps
During day: capture, process, meetings → writes across vault
Evening: wrap-up → reads daily note, tasks → writes end-of-day, contributions, tomorrow's note
```

### Cross-domain coordination

When one skill depends on data another skill manages:

| Scenario | How it works |
|----------|-------------|
| prep-meeting needs task data from process | prep-meeting reads task items directly from project files. If process hasn't run yet, task data may be stale — prep-meeting uses whatever is in the vault. No dependency ordering required. |
| wrap-up needs meeting data from process-meeting | Same pattern — wrap-up reads whatever is in the vault. If meetings haven't been processed yet, wrap-up won't detect contributions from those meetings. User can re-run wrap-up after processing. |
| brief needs data from all domains | brief reads across the vault. Data completeness depends on what skills have run. Brief presents whatever is available. |
| sync generates meeting preps that prep-meeting also generates | sync generates preps for ALL today's meetings. prep-meeting generates for ONE specific meeting. If sync already created a prep, prep-meeting reads it as context and updates (appends delta). |

**No dependency ordering.** Each skill reads whatever is currently in the vault. Skills are not aware of whether other skills have run. If data is stale or missing, the skill works with what's available and the output reflects that. The user controls sequencing by choosing when to invoke each skill.

---

## 11. Content vs Adapter Layers (D038)

All Myna artifacts are organized into two layers:

### Content Layer (tool-neutral)

Everything in this repo. Agent behavior specs, skill instructions, steering rules, vault templates, config schemas, foundations — all in plain markdown and YAML. No tool-specific syntax, no assumptions about file locations or invocation formats for any particular AI tool.

**Test:** "Would this file need changes to work on a different AI tool?" If yes, the tool-specific part belongs in the adapter.

### Adapter Layer (tool-specific)

The install step (Phase 6) reads the content layer and packages it for the target AI tool's runtime format. For v1, the adapter targets Kiro CLI only (D035).

| Content artifact | Adapter produces |
|-----------------|-----------------|
| Main agent definition | Agent config in target tool's format |
| Skill instructions | Skill packages in target tool's format |
| Steering files | Steering config in target tool's format |
| MCP wrapper | MCP server registered with target tool |
| Config templates | .example files in vault |

Adding future AI tool support means writing a new adapter — NOT rewriting content.

---

## 12. Draft-Never-Send

Myna drafts all outbound communications but never sends them. Every draft requires the user to manually copy and send outside of Myna. The only external write is personal calendar events with no attendees (D003). This rule is in the safety steering file and checked by every skill that produces outbound content.

---

## 13. Reference Skill Selection

**Reference skill: capture.**

The `capture` skill is built first in Phase 3 because it exercises the most representative patterns while being fully testable locally.

**Why capture:**

1. **Covers the projects-and-tasks domain** (aligned with D026) — task management, project file updates, project timeline writes
2. **Exercises all core patterns:** multi-destination routing (quick capture goes to multiple destinations), provenance markers (all four types — user-typed [User], explicit data [Auto], inferred [Inferred], ambiguous → review queue), fuzzy name resolution, append-only discipline, cross-domain writes (observations → People/, tasks → Projects/, contributions → Journal/)
3. **Testable locally with no MCP dependency** — user types observations, tasks, and captures using Myna's own development work as test data (D027)
4. **Covers the "process paste" pattern** — Quick Capture with pasted external content exercises the external-content-as-data treatment, covering the pattern D026 identified as needing explicit exercise
5. **Immediately useful** — the user can start tracking Myna development tasks, observations, and contributions right away
6. **Patterns transfer to other skills** — the multi-destination routing and provenance tagging patterns established here are reused by process (email/Slack extraction), process-meeting (meeting note extraction), and wrap-up (contribution detection)

**Alternative considered:** process-meeting — exercises the extraction pipeline more heavily but is a narrower workflow (single meeting → vault). Capture exercises more pattern diversity (task creation, observation logging, link saving, project updates, contribution tracking) in addition to the core routing/provenance patterns.

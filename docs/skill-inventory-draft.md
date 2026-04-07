# Skill Inventory — Draft

Working file for Phase 0. Maps every approved feature to a consolidated skill.

**Design principle:** One skill per workflow. Features that a user would naturally do together in one sitting belong in one skill. Features triggered at different times or with fundamentally different flows get separate skills.

**Total: 15 skills.**

---

## 1. sync

**What it does:** Sets up or refreshes your day. Creates/updates the daily note, generates meeting prep files for today's meetings, surfaces tasks, delegations, blockers, and review queue counts.

**Features covered:**
- Morning Sync (daily-workflow)
- Daily Note creation (daily-workflow)
- Weekly Note creation (daily-workflow — created on first sync of the week)

**When invoked:** "sync", "good morning", "plan tomorrow"

**Reads:** calendar MCP, workspace.yaml, projects.yaml, people.yaml, meetings.yaml, existing daily note (for re-run delta), task files, review queue files, person files (for meeting prep), project files (for meeting prep), previous meeting files (for carry-forward items)

**Writes:** `Journal/{date}.md` (daily note), `Journal/week-{date}.md` (weekly note), `Meetings/` prep files (one per meeting)

**Example:**
> User: "sync"
> Skill runs → reads calendar, finds 4 meetings today → creates daily note with Capacity Check, Immediate Attention (2 overdue tasks, 1 overdue delegation), Today's Meetings (linked to prep files) → generates prep files for each meeting (1:1 with Sarah gets deep prep with follow-through check, pending feedback, personal notes; standup gets your updates and overdue delegations) → "Sync complete (8:30 AM). 4 meetings, 2 overdue tasks, 5 items in review queue."

---

## 2. process

**What it does:** Extracts structured data from email, Slack, or pasted documents and routes it to the vault. Handles deduplication, multi-destination routing, and provenance tagging.

**Features covered:**
- Email Processing (email-and-messaging)
- Messaging Processing (email-and-messaging)
- Document Processing (writing-and-drafts)
- Deduplication — all 3 layers (email-and-messaging)
- Meeting Summaries from Email — detected and dual-path routed (meetings-and-calendar)
- Unreplied Tracker — populated as byproduct (email-and-messaging)

**When invoked:** "process my email", "process my messages", "process my communications", "process this doc: [paste]"

**Reads:** email MCP (mapped project folders), Slack MCP (mapped channels), workspace.yaml, projects.yaml, people.yaml, existing vault files (for near-duplicate detection), `_system/logs/processed-channels.md` (Slack timestamps)

**Writes:** project timelines (`Projects/{name}.md`), task files, person files (`People/{name}.md`), contributions log (`Journal/contributions.md`), review queues (`ReviewQueue/`), source files (`_system/sources/`), audit log (`_system/logs/audit.md`)

**Example:**
> User: "process my email"
> Skill runs → reads 12 new emails from Auth Migration folder → for each email: strips quotes (dedup layer 2), checks for near-duplicates (layer 3), decomposes into entries → email from Sarah about API timeline produces: timeline update in Auth Migration project [Auto], task "Review API spec by Friday" [Auto], recognition entry in Sarah's person file [Inferred] → moves processed emails to Processed/ subfolder (layer 1) → "Processed 12 emails from 3 folders. 8 items written directly, 2 items in review queue."

---

## 3. triage

**What it does:** Reads unmapped inbox emails, writes classification recommendations to `review-triage.md`, and processes user-approved items.

**Features covered:**
- Email Triage — all 3 steps (email-and-messaging)

**When invoked:** "triage my inbox", "process triage" (step 3)

**Reads:** email MCP (inbox), workspace.yaml, projects.yaml (for folder classification), existing review-triage.md (for step 3)

**Writes:** `ReviewQueue/review-triage.md` (step 1), routes approved items to `review-work`/`review-people`/`review-self` (step 3)

**Example:**
> User: "triage my inbox"
> Skill runs → reads 30 inbox emails → writes recommendations to review-triage.md: each email gets a folder classification (Reply/, FYI/, Follow-Up/), vault update recommendations (if applicable), and project assignment → "30 emails triaged. Open review-triage.md in Obsidian to review, then say 'process triage' when ready."

---

## 4. prep-meeting

**What it does:** Generates or updates meeting prep for a specific meeting. Includes conversation coaching for sensitive items.

**Features covered:**
- Meeting File — Prep section (meetings-and-calendar)
- Meeting type inference from calendar (D022)
- Conversation coaching for sensitive items (meetings-and-calendar)

**When invoked:** "prep for my 1:1 with Sarah", "prep for my remaining meetings", "update prep for my meetings", "add topic to standup: discuss deployment timeline"

**Reads:** calendar MCP, person files, project files, task files, meeting history (previous sessions), communication-style.yaml, meetings.yaml (overrides)

**Writes:** `Meetings/1-1s/{person}.md`, `Meetings/Recurring/{name}.md`, or `Meetings/Adhoc/{name}.md` — Prep section only

**Example:**
> User: "prep for my 1:1 with Sarah"
> Skill runs → reads calendar (confirms 1:1 with Sarah at 2pm), Sarah's person file, shared projects, open tasks → generates Prep section: follow-through check (you completed 2/3 action items from last time — lists the missed one), recent contributions (shipped auth migration, reviewed 3 PRs), pending feedback with coaching-tone talking points ("Consider opening with the positive impact before discussing the missed deadline"), carry-forward items from last session, personal note ("asked about the marathon last time") → all items as checkboxes.

---

## 5. process-meeting

**What it does:** Reads a meeting file after the meeting and extracts structured data to the vault. Handles checked/unchecked prep items, action items, decisions, observations.

**Features covered:**
- Process Meeting (meetings-and-calendar)
- Universal Done — meeting path (cross-domain)

**When invoked:** "process this meeting", "process my meetings", "done with 1:1 with Sarah"

**Reads:** meeting file (Prep + Notes sections), projects.yaml, people.yaml

**Writes:** project timelines, task files, person files (observations, recognition), contributions log, review queues, source files

**Example:**
> User: "done with 1:1 with Sarah"
> Skill runs → reads Sarah's meeting file → checked prep items marked resolved → unchecked items carried to next session → Notes section: "Action: Sarah to draft API spec by Friday" → task created [Auto] with `type:: delegation`, `person:: Sarah` → "Decision: go with Option B for caching" → timeline entry in Auth Migration [Auto] → "Sarah handled the incident really well" → observation in Sarah's person file [User] → "Processed 1:1 with Sarah. 3 tasks, 1 decision, 1 observation logged."

---

## 6. brief

**What it does:** Provides on-demand briefings, status summaries, search results, and contextual information.

**Features covered:**
- Person Briefing (people-management)
- Project Status Summary — quick and full modes (projects-and-tasks)
- Thread Summary (email-and-messaging)
- Team Health Overview — point-in-time snapshot (people-management)
- Pre-Read Preparation (writing-and-drafts)
- Vault-Wide Search (cross-domain)
- Link Manager — find path (cross-domain)
- Unreplied Tracker — query path (email-and-messaging)
- Blocker Detection — surfacing path (projects-and-tasks)

**When invoked:** "brief me on Sarah", "catch me up on auth migration", "catch me up quick on [project]", "summarize this thread", "how is my team doing?", "prep me for this doc", "search: auth migration", "find link: MBR Jan", "what am I waiting on?", "what's blocked?"

**Reads:** person files, project files, meeting files, task files, email/Slack threads (via MCP), contributions log, team files, `_system/links.md`, Obsidian search MCP

**Writes:** inline output (not saved to vault unless user asks). Pre-read prep may write to meeting prep file if tied to a meeting.

**Example:**
> User: "brief me on Sarah"
> Skill runs → reads Sarah's person file, shared projects, meeting history, open tasks → output: role and team, 3 active shared projects with status, last meeting (1:1 on March 28, 2 carry-forward items), open items (1 task you delegated to her due Friday, 1 thing she's waiting on from you), pending feedback (growth area: missed deadline, coaching tone talking points), personal notes (training for a marathon). Shown inline.

---

## 7. capture

**What it does:** Routes user-entered data to the right vault destinations. Handles quick capture, targeted logging, task creation, task completion, and link saving.

**Features covered:**
- Quick Capture (daily-workflow)
- Observations & Feedback Logging — user-typed path (people-management)
- Recognition Tracking — user-typed path (people-management)
- Contributions Tracking — user-typed path (self-tracking)
- Task Management — add, complete, recurring (projects-and-tasks)
- Link Manager — save path (cross-domain)
- Universal Done — task path (cross-domain)
- Person File Management — adding observations/notes (people-management)

**When invoked:** "capture: [anything]", "observation about Sarah: ...", "note about Sarah: ...", "log contribution: ...", "add task: ...", "create recurring task: ...", "done with [task]", "save link: [url]"

**Reads:** projects.yaml, people.yaml, existing vault files (dedup check before writing observations)

**Writes:** person files, project files/timelines, task files, contributions log, `_system/links.md`, entity link sections, review queues (for ambiguous items)

**Example:**
> User: "capture: Sarah did a great job handling the auth incident, and the auth migration is now unblocked"
> Skill runs → decomposes into 3 entries: recognition for Sarah → Sarah's person file [Auto] (user explicitly stated praise), timeline update (auth migration unblocked) → Auth Migration project [Auto], your contribution (handled incident) → contributions log [Inferred] (agent interpreted involvement) → "Logged: recognition for Sarah, auth migration timeline update, contribution [Inferred — verify when convenient]."

---

## 8. draft

**What it does:** Produces polished professional writing. Handles all draft types, rewrites, lifecycle tracking, and monthly/quarterly reports.

**Features covered:**
- Email Draft Reply — both trigger paths (writing-and-drafts)
- Follow-Up Email (writing-and-drafts)
- Follow-Up Meeting Draft (meetings-and-calendar)
- Message Rewriting — fix/tone/rewrite modes (writing-and-drafts)
- Structured Draft — status update and escalation modes (writing-and-drafts)
- Recognition Draft — multi-format (writing-and-drafts)
- Help Me Say No (writing-and-drafts)
- Difficult Conversation Prep (writing-and-drafts)
- Monthly Update Generation — MBR/MTR/QBR (daily-workflow)
- Draft Lifecycle Tracking — state transitions and queries (writing-and-drafts)
- Universal Done — draft path (cross-domain)

**When invoked:** "draft reply to ...", "rewrite this for my VP", "fix this message", "status update for auth migration", "escalate this blocker", "draft recognition for Sarah", "help me say no to ...", "help me prepare for [conversation]", "draft follow-up email for [meeting]", "draft follow-up meeting invite", "monthly update", "draft my MBR", "I sent the auth migration update", "what drafts need revision?"

**Reads:** communication-style.yaml, person files (audience tier), project files, meeting files, email threads (via MCP), contributions log (for monthly updates)

**Writes:** `Drafts/Email/`, `Drafts/Meeting/`, `Drafts/Updates/`, `Drafts/Recognition/`, inline output. Auto-creates linked TODOs for draft tracking.

**Example:**
> User: "draft status update for auth migration for my VP"
> Skill runs → reads Auth Migration project file (timeline, open tasks, blockers), workspace.yaml (user role), communication-style.yaml → produces executive-length BLUF status: bottom line (on track for April 15, one risk), progress (3 bullets), risk (cache dependency), next steps → "Draft shown above. Say 'save' to write to Drafts/Updates/."

---

## 9. plan

**What it does:** Helps organize your day and week. Suggests priorities, creates time blocks, sets calendar reminders, breaks down tasks.

**Features covered:**
- Planning — plan day, priority coaching, week optimization modes (daily-workflow)
- Time Block Planning (meetings-and-calendar)
- Calendar Reminders (meetings-and-calendar)
- Task breakdown (projects-and-tasks)

**When invoked:** "plan my day", "priority coaching", "week optimization", "reserve 2 hours Thursday for the design doc", "reserve 3 hours this week for deep work", "remind me about the design review at 2pm", "break down [task]"

**Reads:** calendar MCP, task files, project files, workspace.yaml (work hours, timezone)

**Writes:** calendar events (personal, no attendees — D003 three-layer protection), daily note (planning section), task files (subtasks from breakdown)

**Example:**
> User: "plan my day"
> Skill runs → reads calendar (3 meetings, 2 hrs total), open tasks (8 tasks, 5 hrs estimated effort), free slots → "You have 5 hours of focus time. Top 3 priorities: (1) Auth API spec review — due tomorrow, high priority, ~2hrs. (2) Follow up on 3 overdue delegations. (3) Draft MBR — deferred twice this week. Suggested schedule: 9-11am API spec, 11-11:30 delegation follow-ups, 2:30-4pm MBR draft. Want me to create time blocks?"

---

## 10. wrap-up

**What it does:** Closes out the day. Logs achievements, moves unfinished items to tomorrow, detects contributions. Also generates weekly summaries.

**Features covered:**
- End of Day Wrap-Up (daily-workflow)
- Weekly Summary (daily-workflow)

**When invoked:** "wrap up", "weekly summary"

**Reads:** daily note (sync snapshots, tasks), task files, project timelines, meeting files processed today, contributions log

**Writes:** daily note (End of Day section), tomorrow's daily note (unfinished items), contributions log (detected contributions), `ReviewQueue/review-self.md` (uncertain contributions), weekly note (weekly summary section)

**Example:**
> User: "wrap up"
> Skill runs → reads today's daily note → compares morning Immediate Attention against current state → "Planned vs actual: completed API spec review and 2/3 delegation follow-ups. MBR draft not started (carried to tomorrow). Contributions detected: completed API spec review [Auto], unblocked auth migration by resolving cache question [Inferred]. 1 uncertain contribution in review-self queue."

---

## 11. review

**What it does:** Presents review queue items for user approval. Approve, edit, skip, or discard.

**Features covered:**
- Review Queue — all 3 non-triage queues (daily-workflow)

**When invoked:** "review my queue", "process review queue", "what's in my queue?"

**Reads:** `ReviewQueue/review-work.md`, `ReviewQueue/review-people.md`, `ReviewQueue/review-self.md`

**Writes:** destination files (approved items written with [Verified] tag), queue files (processed items removed)

**Example:**
> User: "review my queue"
> Skill runs → "5 items across 3 queues. review-work (2): (1) Task 'review caching approach' — can't determine owner, could be you or Alex [from auth migration thread]. (2) Timeline entry — conflicting signals about launch date. review-people (1): observation about Marcus — might be recognition or just politeness. review-self (2): 2 contribution candidates from today's wrap-up."
> User: "approve 1 — assign to me. discard 2. approve the rest."

---

## 12. people-insights

**What it does:** Deep analysis of people data for managers. 1:1 patterns, performance narratives, team health trends, attention and feedback gap detection.

**Features covered:**
- 1:1 Pattern Analysis (people-management)
- Performance Narrative + review calibration mode (people-management)
- Team Health Tracking — longitudinal trends (people-management)
- Attention Gap Detection (people-management)
- Feedback Gap Detection (people-management)

**When invoked:** "analyze my 1:1s with Sarah", "generate performance narrative for Sarah, last 6 months", "review my narratives", "what keeps coming up in retros?", "team health trend this quarter"

**Reads:** person files, meeting files (1:1 history), task files, contributions log, team files (`Team/{name}.md`), project timelines

**Writes:** `Drafts/` (performance narratives), team files (trend snapshots), inline output

**Example:**
> User: "analyze my 1:1s with Sarah"
> Skill runs → reads last 8 1:1 sessions → "Action item follow-through: 6/9 items addressed (you missed 3: [lists them]). Recurring unresolved: 'API documentation ownership' appeared in 4 sessions without resolution. Carry-forward rate: 35% of topics carry forward. Topic balance: 60% prep-generated, 30% carried, 10% added by you."

---

## 13. self-track

**What it does:** Generates self-review documents from your contributions log. Brag docs, self-reviews, promo packets, contribution queries, self-calibration.

**Features covered:**
- Self-Narrative Generation — brag doc, self-review, promo packet modes (self-tracking)
- Contribution Queries (self-tracking)
- Self-calibration mode (self-tracking)

**When invoked:** "what did I do this quarter?", "draft my self-review for H1", "build my promo case", "am I underselling myself?", "what feedback did I give this quarter?", "show my contributions from March"

**Reads:** contributions log, project timelines, person files (feedback given), meeting files

**Writes:** `Drafts/` (self-review docs), inline output

**Example:**
> User: "build my promo case"
> Skill runs → reads contributions log for last 6 months, cross-references project timelines → "Promo packet draft: 23 contributions across 4 projects. Top impact areas: (1) Led auth migration — 8 contributions including architecture decision, team unblocking, cross-team coordination. (2) Mentoring — coached 2 engineers through first incident response... [Inferred] entries highlighted for your review." → saved to Drafts/.

---

## 14. configure

**What it does:** Setup wizard (first run), ongoing config changes, feature toggle management, communication style interview.

**Features covered:**
- Interactive Setup Wizard (setup-and-config)
- Vault Initialization (setup-and-config)
- Config Management — add/edit/remove projects, people, mappings (setup-and-config)
- Communication Style Interview (setup-and-config)
- Feature Toggle Management (non-functional, D020)

**When invoked:** "setup", "continue setup", "add project: Auth Migration", "add person: Sarah Chen, senior engineer, direct report", "map #auth-team to Auth Migration", "remove project: Old Project", "change my timezone to EST", "disable self-tracking", "enable people management", "communication style interview", "what setup steps did I skip?"

**Reads:** all config files, `_system/setup-pending.md`

**Writes:** config files (workspace.yaml, projects.yaml, people.yaml, meetings.yaml, communication-style.yaml, tags.yaml), vault folders, project files (from template), person files (from template), `_system/setup-pending.md`

**Example:**
> User: "add project: Auth Migration"
> Skill runs → "What aliases should I use? (e.g., 'auth', 'auth-mig')" → user: "auth, AM" → "Any email folders mapped to this project?" → user: "Auth Migration/" → updates projects.yaml, creates `Projects/auth-migration.md` from template → "Project Auth Migration added. Email folder Auth Migration/ mapped. File created at Projects/auth-migration.md."

---

## 15. park

**What it does:** Saves working context for later resumption. Supports parking, resuming, switching projects, and listing parked items.

**Features covered:**
- Park & Resume (cross-domain)

**When invoked:** "park this", "park: auth migration discussion", "resume auth migration", "resume" (shows list), "switch to [project]", "what's parked?"

**Reads:** current conversation context, vault files referenced in conversation, project files (for switch)

**Writes:** `_system/parked/{topic}.md` (detailed context snapshot)

**Example:**
> User: "park this"
> Skill runs → saves context snapshot: topic ("auth migration caching design"), files referenced (project file, 3 meeting files, Sarah's person file), discussion summary (explored 3 caching approaches, rejected Redis for latency, leaning toward in-memory with TTL), current state (waiting on Sarah's API spec to decide), next steps (review spec when available, then finalize approach), open questions (TTL value TBD) → "Parked 'auth migration caching design'. Resume anytime with 'resume auth migration'."

---

## System-wide behaviors (NOT skills — live in main agent prompt and steering)

These are always-on rules that don't need user invocation:

- **Fuzzy Name Resolution** — resolves "Sarah", "auth migration", etc. to registry entries
- **Auto-Tagging** — applies tags when files are created/updated
- **Feature Toggles** — checks workspace.yaml before activating any skill
- **Provenance Markers** — [User], [Auto], [Inferred], [Verified] on every write
- **Draft, Never Send** — one-line safety rule
- **External Content as Data** — content framing for prompt injection defense
- **Never Overwrite User Content** — append-only discipline
- **Agent Audit Log** — logged in `_system/logs/audit.md`
- **Prompt Logging** — logged in `_system/logs/prompts.md`
- **Graceful Degradation** — missing MCP/config handled gracefully
- **Human-Sounding Output** — no AI tells, no hedging
- **BLUF Default** — for professional writing contexts
- **Obsidian Conventions** — wiki-links, callouts, Dataview, Tasks plugin syntax

---

## Non-skill vault artifacts

These are static vault files, not user-invoked skills:

- **Unified Dashboard** — `_system/dashboards/dashboard.md` — Dataview-powered, always live
- **Vault Template System** — templates in `_system/templates/` used by skills when creating files
- **Config Files** — 6 YAML files under `_system/config/`

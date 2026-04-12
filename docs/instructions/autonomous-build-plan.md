# Autonomous Build Plan

This document is the complete recipe for building Myna autonomously. An orchestrator Claude session reads this plan and spawns subagents to build each component. Each subagent reads this plan + the referenced docs and produces its deliverables independently.

**Approach:** Orchestrator spawns subagents sequentially (or in parallel for independent work). Each subagent builds 1-3 related components end-to-end with 3 self-review rounds. Subagents write files to disk — later subagents can read earlier subagents' output.

---

## Golden Rule: These Are LLM Instructions, Not Code

**You are writing instructions for an AI agent, not programming a state machine.** LLMs already know how to summarize, write professional emails, parse natural language, format markdown, determine intent, extract key information, and generate coherent output. Do NOT teach them these things.

**What to specify:**
- **What** to do (goals, outcomes, deliverables)
- **Where** to read and write (vault paths, file names, sections)
- **When** to choose between options (decision criteria — e.g., when to use [Auto] vs [Inferred])
- **What NOT to do** (constraints, boundaries, safety rails)

**What NOT to specify:**
- How to understand text (the LLM already does this)
- How to summarize or extract key points (the LLM already does this)
- How to format markdown (the LLM already does this)
- How to write in a professional tone (the LLM already does this)
- Step-by-step parsing logic ("read the subject line, identify the topic, determine if...") — just say "determine the relevant project from the email content"

**Test:** For every line in your skill file, ask: "Would an LLM get this wrong without this instruction?" If no, delete the line. If the answer is "it might pick a different default," that's only worth specifying if the default matters.

**Example — BAD (over-specified):**
```
1. Read the email content carefully
2. Identify the main topic of the email
3. Look for action items mentioned in the email
4. For each action item, determine who is responsible
5. Format each action item as a markdown TODO
6. Determine the priority based on urgency words like "ASAP", "urgent", "critical"
```

**Example — GOOD (goal-oriented):**
```
1. Extract action items from the email. For each, capture: task description,
   owner (from context or explicit mention), due date (if stated), project
   (match against projects.yaml). Format as Obsidian Tasks plugin TODOs.
```

The bad example has 6 steps doing what a single sentence can convey. The good example tells the LLM WHAT to extract and WHERE it goes — the LLM handles the HOW.

---

## Prerequisites

Before starting the build, the orchestrator must verify:

1. `docs/architecture.md` exists and is current
2. `docs/design/foundations.md` exists and is current
3. `docs/features/*.md` — all 10 feature files exist
4. This plan exists at `docs/instructions/autonomous-build-plan.md`
5. `node` and `npm` are available (needed for MCP server build)

---

## Build Log

Subagents log assumptions, open questions, and judgment calls to `docs/journal/build-log.md`. The orchestrator creates this file before spawning the first subagent. Format:

```markdown
# Build Log

Assumptions, open questions, and judgment calls from the autonomous build.
Tagged by task so the user knows what to revisit.

## Entries

### P1-T03 (capture)
- **Assumption:** When capture can't resolve a person name, it asks the user rather than creating a new person file. Rationale: creating files without user intent could clutter the vault.
- **Question:** Should "save link" also add the link to the relevant project file's Links section, or only to `_system/links.md`?

### P1-T05 (triage)
- **Assumption:** ...
```

**Rules for subagents:**
- Log any assumption you made where the design docs were ambiguous
- Log any question where you had to choose between two reasonable approaches
- Log any feature detail that seemed contradictory between architecture.md and the feature files
- Do NOT log routine decisions that are clearly covered by the design docs
- Include enough context that someone reading the log can understand the issue without re-reading the skill file

After the build, the user reviews this file and asks for targeted fixes.

---

## Repo Structure for Build Artifacts

All agent artifacts go under `agents/` in the repo root:

```
agents/
  main.md                    # Main agent instructions
  skills/
    capture.md
    sync.md
    wrap-up.md
    triage.md
    process.md
    process-meeting.md
    prep-meeting.md
    brief.md
    draft.md
    draft-replies.md
    calendar.md
    review.md
    self-track.md
    park.md
  steering/
    safety.md
    conventions.md
    output.md
    system.md
  mcp/
    myna-obsidian/            # MCP server code
      package.json
      tsconfig.json
      src/
        index.ts
```

---

## Skill File Format

Every skill file follows this structure. No additional sections unless genuinely needed.

```markdown
# {Skill Name}

## Purpose
One line: what this skill does and why it exists.

## Triggers
Natural language descriptions of when this skill should be invoked.
These are NOT hardcoded commands — the main agent routes by intent.
List the kinds of user requests that map to this skill.

## Inputs
What this skill reads before doing its work:
- Vault files (which ones, from where)
- Config files (which fields)
- External MCP operations (if any)

## Procedure
Step-by-step workflow. This is the core of the skill.
Detailed enough that a fresh LLM session can execute it
without reading architecture.md or design/foundations.md.

## Output
What gets created or modified:
- File paths and naming conventions
- Content format and structure
- What to show the user inline

## Rules
Constraints, edge cases, guard rails:
- What NOT to do
- Edge case handling
- Any skill-specific constraints
- Shared patterns this skill uses (review queue routing, append-only,
  dedup — inline briefly, only what applies)
- Note: provenance markers are handled by the conventions steering
  file, NOT by individual skills. Don't include marker rules here.
```

**Key principles for skill files:**
- **Self-contained:** A fresh LLM session should be able to execute the skill with ONLY the skill file + steering files + config loaded. Do NOT say "see design/foundations.md" — inline the relevant rules.
- **Shared patterns are secondary.** The skill's value is in its feature workflow. Inline patterns like append-only, dedup, and fuzzy name resolution briefly where they apply — a few lines each. **Provenance markers are NOT inlined in skills** — they're handled by the conventions steering file. Skills just write content; the steering conventions ensure markers are applied.
- **Architecture.md is the feature mapping authority.** Each skill's "Features covered" line in architecture.md is the definitive list of what the skill handles. When reading feature files, only include details for features that belong to YOUR skill — don't absorb features that belong to other skills just because they're in the same feature file.
- **Mandatory worked examples.** Every skill file MUST include at least one realistic worked example showing: user input → what the skill reads → what it decides → what it writes → what it tells the user. Skills with multiple workflow paths (e.g., sync handles daily note + weekly note + planning) need one example per major path.
- Don't over-specify what LLMs do naturally (understanding context, generating coherent text, following instructions).
- Don't add error handling for scenarios that can't happen.

**Style guidance:**
- Write in imperative mood: "Read the config file" not "The skill reads the config file"
- Use numbered steps for sequential procedures, bullet lists for non-sequential items
- Target 100-200 lines per skill file. Simpler skills (park, calendar) can be shorter (~80-120). Complex skills (process, sync) can be longer (~150-250). If your skill exceeds 300 lines, you're probably over-specifying.

### Calibration: What Good Procedure Looks Like

This excerpt shows the right level of detail. The focus is on **the feature workflow** — what happens, in what order, with what inputs and outputs.

```markdown
## Procedure

### Morning Sync

1. Check if `Journal/DailyNote-{today}.md` exists. If not, create it from
   the daily note template. If it exists, this is a re-run — prepend a new
   snapshot at the top with a timestamp header. Never modify previous snapshots.

2. Read today's calendar via calendar MCP. For each meeting:
   - Determine meeting type from attendees, title, and recurrence (1:1, standup,
     project, adhoc — see meetings.yaml for overrides)
   - Create or update the prep file under `Meetings/{type}/{name}.md`
   - Add a linked checkbox to the daily note Meetings section

3. Read open tasks across all project files (TODO items not marked done).
   Surface overdue tasks and tasks due today in the daily note.

4. Check delegation items — flag any with overdue dates (red) or approaching
   deadlines within 2 days (yellow).

5. Read review queue files — show count in daily note with link.

6. Write Capacity Check: compare available focus time (work hours minus
   meeting hours) against estimated task effort. Flag if over-capacity.

7. Suggest top 3 priorities based on: due dates, defer count (tasks
   deferred multiple times rank higher), and blocking status.

8. Output: "Sync complete (8:30 AM). 4 meetings (2 hrs), 2 overdue tasks,
   1 overdue delegation, 5 items in review queue. Top priority: API spec
   review (due tomorrow)."
```

**What makes this good:**
- The feature workflow is the focus — you can trace each feature (Daily Note, Calendar, Tasks, Delegations, Capacity Check, Priority Coaching) to specific steps
- Specific vault paths and section names — the LLM knows exactly where to read and write
- Decision criteria are inline where needed (meeting type inference, priority ranking logic)
- The output format shows what the user actually sees
- Doesn't explain how to read calendar data or summarize tasks (the LLM already knows how)

**What BAD looks like** — avoid these patterns:
- "Create the daily note with relevant information" (WHICH information? From WHERE?)
- "Read the user's calendar and populate the meetings section" (HOW to populate? What format? What about meeting types?)
- "Process the emails and extract relevant data" (WHAT data? WHERE does it go? What format?)
- "Determine the appropriate destination based on the content" (WHICH destinations are possible?)
- Including provenance marker rules in a skill (they belong in the conventions steering file, not skills)

---

## Quality Markers: What Good vs Mediocre Looks Like

This section helps subagents calibrate quality. "Correct" isn't enough — the output needs to be *good*.

**Skills — what separates good from mediocre:**
- **Good:** Every feature from "Features covered" has a clear, executable procedure. You can point to exactly where each feature is handled.
- **Mediocre:** Features are mentioned in the Purpose section but the Procedure doesn't actually explain how to do them.
- **Good:** Procedure steps name specific vault paths, section headers, and config fields. "Append to `Projects/{project}.md` under `## Timeline`" / "Read `meetings.yaml` for meeting type overrides"
- **Mediocre:** "Write the update to the appropriate project file." (Which file? Which section?)
- **Good:** Multi-step workflows show the complete user journey. Sync example: create daily note → read calendar → generate meeting preps → surface overdue tasks → show capacity check → output summary.
- **Mediocre:** "Create the daily note with relevant information." (What information? In what order? What sections?)
- **Good:** Examples show realistic scenarios with multiple inputs and outputs, not just the happy path.
- **Mediocre:** Examples are one-liners: "User says X → skill does Y."

**MCP server — what separates good from mediocre:**
- **Good:** Each tool validates inputs, handles CLI errors gracefully, parses CLI output into structured JSON responses. Comments show the exact CLI command being invoked.
- **Mediocre:** Thin wrappers that pass strings through without validation or error handling. No comments explaining what CLI command is being called.

**Steering files — what separates good from mediocre:**
- **Good:** Rules are concrete and actionable. "Never start a response with 'Great question!' or 'I'd be happy to help.' Start with the answer or the action."
- **Mediocre:** Rules are abstract. "Be professional and helpful." (Every LLM already does this.)

**Main agent — what separates good from mediocre:**
- **Good:** Routing logic handles ambiguous cases explicitly. "If the user says 'process my inbox,' route to triage — inbox = unsorted email. If they say 'process my email,' route to process — email in project folders."
- **Mediocre:** Routing is a simple keyword→skill mapping table with no ambiguity handling.

---

## Steering File Format

Steering files are cross-cutting rules loaded into every session alongside the main agent. They follow a simpler format:

```markdown
# {Steering Category}

Rules and conventions, organized by topic.
Each rule should be actionable and specific.
No preamble — just the rules.
```

The four steering files and their contents are defined in `architecture.md` §3 (Agent Structure → Steering Files table). The subagent building steering files should read that table and expand each row into a complete steering file using the rules from `design/foundations.md` and `architecture.md`.

---

## Build Order

### Execution phases

The build runs in 5 sequential batches. Within Batch C, all skill subagents run **in parallel**.

| Batch | Subagents | Mode | Commit after |
|-------|-----------|------|-------------|
| A | 1 (Foundations revision) | Sequential | Yes |
| B | 2 (MCP server) | Sequential | Yes |
| C | 3-10 (All skills) | **Parallel** | Yes (one commit for all skills) |
| D | 11 (Steering), then 12 (Main agent) | Sequential | Yes (after each) |
| E | 13 (Cross-skill audit) | Sequential | Yes |

### Subagent details

| # | Subagent | Deliverables |
|---|----------|-------------|
| 1 | Foundations revision | Updated `docs/design/foundations.md` |
| 2 | MCP server | `agents/mcp/myna-obsidian/` (compilable code) |
| 3 | Capture | `agents/skills/capture.md` |
| 4 | Sync + Wrap-up | `agents/skills/sync.md`, `agents/skills/wrap-up.md` |
| 5 | Triage + Process | `agents/skills/triage.md`, `agents/skills/process.md` |
| 6 | Process-meeting + Prep-meeting | `agents/skills/process-meeting.md`, `agents/skills/prep-meeting.md` |
| 7 | Brief | `agents/skills/brief.md` |
| 8 | Draft + Draft-replies | `agents/skills/draft.md`, `agents/skills/draft-replies.md` |
| 9 | Calendar | `agents/skills/calendar.md` |
| 10 | Review + Self-track + Park | `agents/skills/review.md`, `agents/skills/self-track.md`, `agents/skills/park.md` |
| 11 | Steering files | `agents/steering/safety.md`, `agents/steering/conventions.md`, `agents/steering/output.md`, `agents/steering/system.md` |
| 12 | Main agent | `agents/main.md` |
| 13 | Cross-skill audit | Fixes across all files |

### What each subagent reads

Every skill subagent (3-10) reads: `docs/architecture.md` (full file), `docs/design/foundations.md` (full file), and this plan. In addition, each reads the specific feature files listed below — **only the named features from each file, not the entire file's scope.**

| # | Architecture section | Feature files and specific features to read |
|---|---------------------|---------------------------------------------|
| 1 | Full file | All `docs/features/*.md` |
| 2 | §2 (all skills' Reads/Writes), §7 | design/foundations.md §7 |
| 3 | §2 skill 7 (capture) | `daily-workflow.md`: Quick Capture. `projects-and-tasks.md`: Task Management, Project File Management. `people-management.md`: Observations & Feedback Logging, Recognition Tracking. `cross-domain.md`: Multi-Destination Routing. |
| 4 | §2 skills 1, 10 (sync, wrap-up) | `daily-workflow.md`: Morning Sync, Daily Note, Weekly Note, Planning, End of Day Wrap-Up, Weekly Summary. |
| 5 | §2 skills 2, 3 (process, triage) | `email-and-messaging.md`: Email Processing, Messaging Processing, Email Triage. `projects-and-tasks.md`: Deduplication. `non-functional.md`: Near-Duplicate Detection. |
| 6 | §2 skills 4, 5 (prep-meeting, process-meeting) | `meetings-and-calendar.md`: Meeting File Prep, Process Meeting, Meeting Type Inference. `people-management.md`: Conversation Coaching. |
| 7 | §2 skill 6 (brief) | `daily-workflow.md`: Weekly Summary, Monthly Update Generation, Unified Dashboard. `people-management.md`: Person Briefing, Team Health Overview. `projects-and-tasks.md`: Project Status Summary, Blocker Detection. |
| 8 | §2 skills 8, 14 (draft, draft-replies) | `writing-and-drafts.md`: all features. `email-and-messaging.md`: DraftReplies folder, Email Draft Reply. |
| 9 | §2 skill 9 (calendar) | `meetings-and-calendar.md`: Time Block Planning, Calendar Reminders. `daily-workflow.md`: Planning (Task Breakdown only). |
| 10 | §2 skills 11, 12, 13 (review, self-track, park) | `daily-workflow.md`: Review Queue. `self-tracking.md`: all features. `cross-domain.md`: Park & Resume. |
| 11 | §3 (steering table) | design/foundations.md (all cross-cutting rules), ALL `agents/skills/*.md` (to avoid duplicating skill-specific rules) |
| 12 | §3 (full section) | All `agents/skills/*.md`, all `agents/steering/*.md` |
| 13 | Full file | All `agents/*` files, design/foundations.md |

**Notes on ordering:**
- Foundations first — everything builds on it. Changes here don't cascade.
- MCP server second — skills reference MCP operations. Tool surface must be defined.
- Skills in parallel — they read from foundations and architecture, not from each other.
- Steering before main agent — main agent references them.
- Cross-skill audit last — catches inconsistencies across everything.

---

## Per-Subagent Protocol

Every subagent follows this protocol:

### 1. Read

**You MUST read every file listed before writing anything.** Do not start writing after reading just the plan and architecture — the feature files contain critical details that architecture.md only summarizes. Skipping them is the #1 cause of incomplete skills.

Read:
- This plan (for format, calibration example, and review criteria)
- All files listed in the "What each subagent reads" table for your subagent number
- Any previously-built skill files that your skill interacts with (e.g., if building process, read capture.md if it exists)

### 2. Design (Think Before Writing)

Before writing any file, output this checklist in your working output — it forces you to process the source material before writing:

1. **Feature list:** Copy the "Features covered" line from architecture.md for your skill. This is your scope — nothing more, nothing less.
2. **Feature details:** For each feature, note any details from the feature files that architecture.md doesn't include. These details MUST appear in your skill file.
3. **Workflow:** Describe the user-facing workflow end-to-end. What's the first thing the skill does? What are the decision points? What's the last thing?
4. **Patterns used:** Which shared patterns does this skill use? (append-only? dedup? fuzzy name resolution? multi-destination routing? review queue routing?) Keep this brief — patterns support the features, they're not the focus. Note: provenance markers are in steering, not skills.
5. **Edge cases:** What if the target file doesn't exist? What if there's nothing to process? What if config fields are missing?

### 3. Write

Write the skill file following the Skill File Format above. Write the complete file in one pass — do not append incrementally.

### 4. Self-Review (3 Rounds)

**Critical rule: every review round MUST find at least one thing to improve.** If you find nothing, you're not looking hard enough — go back and compare your Procedure line-by-line against the feature file details. A "no issues found" result means the review failed, not that the skill is perfect.

#### Round 1 — Coverage Check (most important round)
This is the highest-value review. Getting features right matters more than anything else.
- Read every feature listed in "Features covered" from architecture.md for this skill
- For each feature, **point to the exact step(s)** in your Procedure that handle it. If you can't point to a specific step, the feature isn't covered — add it.
- Open the feature files and compare details line by line — are there specifics in the feature files that your skill omits? Feature files often have sub-bullets and edge cases that architecture.md summarizes away.
- Verify the worked example(s) are realistic and cover the main workflow paths
- Flag and fix any gaps

#### Round 2 — Quality Check
- **Apply the Golden Rule:** Read every line and ask "would an LLM get this wrong without this instruction?" Delete lines that teach the LLM things it already knows (how to summarize, parse text, format markdown, write professionally). Multiple steps that can be one sentence should be collapsed.
- Is the Procedure ordered logically? Would reordering steps improve clarity?
- Are there ambiguities where an LLM might misinterpret what to do?
- Are there edge cases that the features imply but the skill doesn't handle?
- Is the writing tight? Remove filler, redundancy, and obvious statements.
- Is the skill within the target length range? (100-200 lines for most skills)

#### Round 3 — Consistency Check
- Does the skill reference the correct vault paths from design/foundations.md §1?
- Does it use the correct config field names from design/foundations.md §3?
- Does it reference the correct MCP operations from design/foundations.md §7?
- Verify the skill does NOT include provenance marker rules (those belong in conventions steering file, not skills)
- When this skill creates or modifies a file, does the format match the template in design/foundations.md §2? Check frontmatter fields, section headers, and content structure.
- Does it conflict with any other skill's responsibility? (Check architecture.md for skill boundaries)
- If this skill routes items to review queues, does the routing match design/foundations.md §6?

After each round: fix all issues found, then proceed to the next round. The next round reviews the improved version.

### 5. Build Log

Log any assumptions, open questions, or judgment calls to `docs/journal/build-log.md`, tagged with your task number (e.g., `### P1-T03 (capture)`). See the Build Log section at the top of this plan for format and rules.

For parallel subagents (Batch C): **do NOT write directly to `docs/journal/build-log.md`** — include your log entries in your report to the orchestrator instead. The orchestrator will write them to the build log after the batch completes to avoid parallel write conflicts.

### 6. Dev Journal

If you discovered anything interesting — a gap in the design, a non-obvious pattern — include it in your report to the orchestrator. **Do NOT write directly to `docs/journal/dev-journal.md`** — the orchestrator consolidates entries after each batch.

### 7. Done

Report to the orchestrator. **Keep it under 30 lines** — the orchestrator processes many reports and bloated reports waste context.

```
Files: agents/skills/capture.md (created)
Features covered: 7/7 — Quick Capture, Observations Logging, Recognition Tracking,
  Task Management, Link Manager, Project File Management, Person File Management
Issues: None
Discoveries: [any design gaps or non-obvious patterns, for dev journal]
Build log entries:
- Assumption: [brief description]
- Question: [brief description]
```

---

## Subagent-Specific Instructions

### Subagent 1: Foundations Revision

**Goal:** Review and improve `docs/design/foundations.md` before any skills are built on top of it.

**What to check:**
- Are all templates complete enough for skill builders to use? Would a skill builder have all the field names, formatting rules, and examples they need?
- Are config schemas complete? Every field referenced in architecture.md exists in the schema?
- Are pattern descriptions clear and actionable? Could a fresh LLM follow each pattern without asking questions?
- Are there inconsistencies between design/foundations.md and architecture.md? (Architecture is authoritative for skill design; foundations is authoritative for data layer.)
- Is anything missing that architecture.md implies but design/foundations.md doesn't define? In particular: §7 (MCP tool surface) should be updated to reflect the Obsidian CLI's actual command surface — `move`, `append`, `prepend`, `property:set`, `backlinks`, `tags`, etc. The current §7 lists abstract tools that predate the Obsidian CLI research.
- Is anything over-specified? Remove rules for things LLMs handle naturally.

**What NOT to do:**
- Don't restructure the document — keep the existing section numbering
- Don't rename config fields, vault paths, or section headers — downstream skills reference them by exact name
- Don't add new sections unless something is genuinely missing
- Don't duplicate architecture.md content
- Don't simplify templates or remove fields — skill builders need every field name

### Subagent 2: MCP Server

**Goal:** Build a thin MCP wrapper around the Obsidian CLI (`obsidian` command).

**Prerequisite:** The Obsidian CLI must be installed and enabled (Settings → General). The MCP server assumes this and shells out to `obsidian` commands. It does NOT reimplement vault operations — it wraps them.

**Obsidian CLI commands the MCP server wraps:**

| MCP Tool | Obsidian CLI Command | Purpose |
|----------|---------------------|---------|
| `search` | `obsidian search query=<term>` | Vault-wide search |
| `search_content` | `obsidian search-content query=<term>` | Search within note content |
| `tasks` | `obsidian tasks` | List/query tasks |
| `daily_read` | `obsidian daily:read` | Read today's daily note |
| `daily_append` | `obsidian daily:append content=<text>` | Append to daily note |
| `daily_prepend` | `obsidian daily:prepend content=<text>` | Prepend to daily note |
| `read` | `obsidian read file=<name>` or `path=<path>` | Read a note |
| `create` | `obsidian create name=<name> content=<text>` | Create a note |
| `append` | `obsidian append file=<name> content=<text>` | Append to a note |
| `prepend` | `obsidian prepend file=<name> content=<text>` | Prepend to a note |
| `move` | `obsidian move file=<name> to=<path>` | Move a file within vault |
| `delete` | `obsidian delete file=<name>` | Delete a file |
| `create_from_template` | `obsidian create` with template params | Create note from template |
| `property_set` | `obsidian property:set name=<key> value=<val> file=<name>` | Set frontmatter property |
| `property_read` | `obsidian property:read file=<name>` | Read frontmatter properties |
| `eval` | `obsidian eval` | Run JavaScript (Dataview queries, custom logic) |
| `tags` | `obsidian tags` | List vault tags |
| `backlinks` | `obsidian backlinks file=<name>` | Find notes linking to a file |

**Implementation approach:**
- Use the MCP SDK (`@modelcontextprotocol/sdk`)
- Each MCP tool shells out to the corresponding `obsidian` CLI command using `child_process.execFile`
- Use `vault=<name>` parameter to target the correct vault (configurable)
- Use `--json` flag where available for structured output parsing
- Use `silent` flag on write operations to prevent files from opening in the UI
- **Write restriction:** Tools that modify files (`create`, `append`, `prepend`, `move`, `delete`) must validate that the target path is under the configured `myna/` subfolder before executing. Reject operations outside this boundary.
- **Configuration:** Accept vault name and myna subfolder as MCP server config

**What NOT to do:**
- Don't reimplement file I/O — let Obsidian CLI handle it so vault indexing stays consistent
- Don't add tools for every CLI command — only wrap what Myna skills actually need (check architecture.md §2 for each skill's Reads/Writes)
- Don't handle the case where Obsidian isn't running — the CLI requires Obsidian to be running. Document this as a prerequisite.

**Quality bar:** For each MCP tool, include:
- A JSDoc comment showing the exact CLI command with example parameters
- Input validation (required params, path format)
- Error handling for CLI failures (non-zero exit, stderr)
- Structured JSON output (parse CLI text output into typed response objects)

**Done criteria:** `npm run build` compiles without errors. All tools are implemented with correct parameter schemas. Write restriction is enforced. Each tool correctly invokes the corresponding `obsidian` CLI command.

### Subagent 3-10: Skill Building

Each skill subagent follows the standard Per-Subagent Protocol above. Key reminders:

- **Features are the priority, patterns are secondary.** Spend your effort getting the feature workflows right. Shared patterns (dedup, append-only, fuzzy name resolution) should be inlined briefly where they apply. **Provenance markers are handled by the conventions steering file — don't include marker rules in skills.**
- **Write holistically.** Read all features for the skill, understand the complete workflow, then write the entire file. Never append feature-by-feature.
- **Check interactions.** If your skill reads files that another skill writes (or vice versa), verify the file format and path conventions match.
- **Don't include main-agent direct operations.** Check architecture.md §2 "Main-Agent Direct Operations" — vault search, link find, task completion, draft deletion, and file creation from template are handled by the main agent, NOT by skills. Don't include these in your skill even if they seem related.
- **Concrete examples are mandatory.** At least one realistic worked example per major workflow path (see Key Principles above).

### Subagent 11: Steering Files

**Goal:** Build the 4 steering files defined in architecture.md §3.

**Source material:**
- `safety.md`: architecture.md (draft-never-send, vault-only writes), design/foundations.md §8.3 (external content as data — content framing delimiters), architecture.md (confirm before bulk writes)
- `conventions.md`: design/foundations.md §4 (provenance markers — **this is the ONLY place marker rules live at runtime; skills do not include them**), §8.2 (append-only), §5 (date+source format), §10 (Obsidian conventions — tags, wiki-links, callouts, Dataview, Tasks plugin syntax)
- `output.md`: architecture.md §3 (voice rules — no AI tells, no hedging, concise), BLUF contextual rules from draft skill
- `system.md`: architecture.md §5 (feature toggles), design/foundations.md §9.5 (error recovery), architecture.md (graceful degradation, config reload, relative date resolution, prompt logging)

**Key rule:** Steering files are cross-cutting — they apply to ALL skills. Don't include skill-specific behavior. If a rule only applies to one skill, it belongs in that skill file, not steering.

### Subagent 12: Main Agent

**Goal:** Build `agents/main.md` — the always-loaded prompt that routes user requests and handles simple operations.

**Must contain:**
- **Identity:** who Myna is, what it does (from architecture.md §1)
- **Skill directory:** one-liner per skill with description (from architecture.md §2 overview table). This is what's loaded at session start for routing.
- **Routing logic:** how to match user intent to skills. Include the specific routing rules from architecture.md §3 (Universal Done, inbox routing, planning routing, ambiguous intent handling)
- **Direct operations:** vault search, link find, task completion, draft deletion, file creation from template (from architecture.md §2 "Main-Agent Direct Operations")
- **Always-on rules:** reference steering files (these are always loaded alongside main.md)
- **Config loading:** read 6 YAML config files at session start

**Skill activation:** When a user request matches a skill, the main agent instructs Claude Code to read and follow the instructions in `agents/skills/{skill}.md`. The generated CLAUDE.md (produced by the install script in Phase 2) includes the skill directory with file paths so Claude Code can load the full skill file on demand.

**Must NOT contain:**
- Feature-specific procedures — those live in skill files
- Detailed rules already in steering files — just reference them
- Duplicated skill procedures

**Read ALL skill files before writing.** The main agent needs to know what each skill does to route correctly.

### Subagent 13: Cross-Skill Audit

**Goal:** Find and fix inconsistencies across all built artifacts.

**Checklist (in priority order):**
1. **Feature coverage:** Every feature from architecture.md "Features covered" is handled by exactly one skill. No feature falls through the cracks. No two skills claim the same feature.
2. **Cross-references:** If skill A says "user runs skill B next," verify skill B actually handles that flow
3. **Main agent alignment:** Routing in main.md covers all skills. Direct operations don't overlap with skills.
4. **Path consistency:** Every vault path referenced in skills matches design/foundations.md naming conventions
5. **Config field consistency:** Every config field referenced in skills exists in design/foundations.md §3 schemas
6. **Template consistency:** File formats skills write match the templates in design/foundations.md §2
7. **MCP operation consistency:** Every MCP call in skills matches design/foundations.md §7 tool surface
8. **Steering alignment:** Nothing in skill files contradicts steering files
9. **Shared pattern consistency:** Review queue routing and other inlined patterns are correct where used. Verify NO skill includes provenance marker rules (those belong in conventions.md only).
10. **No "see design/foundations.md" references:** Skills must be self-contained

**Fix issues directly** in the files. If an issue requires a design decision (not just a typo), document it and flag to the orchestrator.

**If the audit finds more than 5 issues requiring procedure changes** (not just path/name fixes), flag to the orchestrator rather than rewriting large sections. The orchestrator should re-spawn the affected skill subagents with specific fix instructions.

---

## Orchestrator Protocol

The orchestrator (main Claude session) manages the build:

### Starting the Build

1. Read this plan
2. Read `docs/roadmap.md` — check which P1 tasks are already Done (for resuming)
3. Verify prerequisites (design files exist)
4. Create `agents/` directory structure if it doesn't exist (`agents/skills/`, `agents/steering/`, `agents/mcp/myna-obsidian/src/`)
5. Skip completed batches, begin spawning from the next incomplete batch

### Resuming a Build

The build is designed to survive session timeouts (4-hour subscription limits, context exhaustion, etc.).

**How it works:**
- After each batch completes, the orchestrator commits and updates `docs/roadmap.md` (marks tasks Done)
- If the session ends, the user starts a new session and says "resume the build" or "start Phase 1"
- The new orchestrator reads the roadmap, sees which P1 tasks are Done, and continues from the next incomplete batch
- Previously-built files exist on disk — later subagents can read them

**Batch checkpoint order:** A (foundations) → B (MCP) → C (all skills) → D (steering + main) → E (audit)

### Subagent Prompt Template

Use this template when spawning each subagent (adapt for the specific subagent number):

```
You are building components for Myna, a local-first AI assistant.
Your task: [describe deliverables for this subagent].

Follow the autonomous build plan at docs/instructions/autonomous-build-plan.md:
1. Read the "Per-Subagent Protocol" section for your workflow
2. Read the "Subagent [N]" section under "Subagent-Specific Instructions" for your specific guidance
3. Read the files listed in the "What each subagent reads" table row [N]
4. Execute: Read → Design → Write → Self-Review (3 rounds) → Dev Journal → Done

When done, report: files created/modified (with paths), feature coverage
summary, and any issues or design gaps found.
```

For parallel skill subagents (Batch C), spawn all 8 subagents simultaneously using the Agent tool.

### Between Batches

After each batch completes:

1. **Verify output:**
   - **Files exist:** All deliverables listed for that batch were created
   - **Not empty/truncated:** Files have reasonable content (not just headers)
   - **Quick feature count:** For skill subagents — does the skill mention all the features listed in its "Features covered" line from architecture.md?
2. **Build log:** If any subagent reported assumptions/questions, append them to `docs/journal/build-log.md` tagged with the task number
3. **Dev journal:** If any subagent reported discoveries, write a single consolidated entry to `docs/journal/dev-journal.md`
3. **Commit:** Stage and commit all new/modified files from the batch. Use conventional commit prefixes that match the artifact type:
   - Batch A (foundations revision): `docs:` — these are design documents
   - Batch B (MCP server): `feat:` — this is product code
   - Batch C (skills): `feat:` — agent instructions are product, not docs
   - Batch D (steering + main agent): `feat:` — agent instructions are product
   - Batch E (audit fixes): `fix:` — consistency corrections across files
4. **Update roadmap:** Mark the corresponding P1-T tasks as Done in `docs/roadmap.md`
5. **Push:** Push to remote so work is preserved even if session ends

If something looks wrong with a subagent's output, re-spawn that subagent before committing.

**Spot-check (Batch C only):** After all 8 skill subagents return, open 2-3 skill files and verify:
- Does the Procedure follow the Golden Rule? (goal-oriented steps, not LLM-teaching)
- Are worked examples realistic and specific?
- Is the line count reasonable? (under 80 = likely too thin, over 300 = likely over-specified)
- Does it include main-agent direct operations it shouldn't?
If any fail, re-spawn that subagent with specific feedback.

### After All Batches Complete

Run this pre-flight check:

```bash
# 1. Verify all files exist
ls agents/skills/  # expect 14 .md files
ls agents/steering/  # expect 4 .md files
ls agents/main.md  # expect 1 file

# 2. Verify all skills have required sections
grep -l "## Procedure" agents/skills/*.md | wc -l  # expect 14
grep -l "## Rules" agents/skills/*.md | wc -l  # expect 14

# 3. Verify line counts are reasonable
wc -l agents/skills/*.md  # each should be 80-300 lines

# 4. MCP server compiles
cd agents/mcp/myna-obsidian && npm run build

# 5. No skill mentions "see design/foundations.md" (self-containment check)
grep -rl "see foundations" agents/skills/  # expect 0 results
```

If any check fails, fix before declaring done. Then report completion summary to the user.

### Error Handling

- If a subagent fails or produces bad output: re-spawn with a clarifying prompt
- If a subagent discovers a design gap: document it, continue building, flag to user at the end
- If two skills contradict each other: the cross-skill audit (subagent 13) resolves it. If it can't, flag to user.
- If the session is about to hit limits: commit whatever is done, update roadmap, push. The next session resumes.

---

## What "Done" Looks Like

The build is complete when:

1. All 14 skill files exist under `agents/skills/`
2. All 4 steering files exist under `agents/steering/`
3. `agents/main.md` exists
4. `agents/mcp/myna-obsidian/` builds without errors
5. Cross-skill audit found no unresolved issues
6. `docs/design/foundations.md` has been revised
7. All features from architecture.md are covered across the skill files

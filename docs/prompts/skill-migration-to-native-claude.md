# Prompt: Rebuild Myna Skills as Native Claude Code Skills

## Context

Myna is a personal assistant built on Claude Code. It currently has 15 skill files as flat markdown at `agents/skills/{name}.md`, loaded manually by the main agent. We're restructuring to use Claude Code's **native skills mechanism** and splitting skills for better focus.

**Claude Code native skills:**
- Live in `~/.claude/skills/{skill-name}/SKILL.md` (personal/global scope)
- At startup, only skill **names and descriptions** load into context (progressive disclosure)
- Full skill content loads **on demand** when invoked (by description match or `/skill-name` slash command)
- NOT the same as the `skills:` subagent frontmatter field (which eagerly pre-loads everything)

**What's changing:**
- 15 skills → 24 skills (splitting `brief` into 7, `sync` into 2, `wrap-up` into 2, `draft` into 2, plus renames)
- 3 skills deferred to post-launch
- Skill files move from flat `agents/skills/{name}.md` to `agents/skills/{name}/SKILL.md` with YAML frontmatter
- Install copies to `~/.claude/skills/` instead of `~/.myna/skills/`
- Main agent stops manually reading skill files — Claude Code handles loading natively

## SKILL.md Format

Each skill is a directory containing a `SKILL.md` file:

```
agents/skills/myna-{name}/
└── SKILL.md
```

**SKILL.md structure:**

```markdown
---
name: myna-{name}
description: {concise description — Claude uses this for auto-invocation. Front-load the key use case. Max ~250 chars.}
user-invocable: true
---

# {Skill Title}

## Purpose
{What this skill does — 1-3 sentences}

## Triggers
{Example phrases that invoke this skill — illustrative, not exhaustive}

## Inputs
{What data this skill reads — config files, vault files, MCP tools}

## Procedure
{Step-by-step instructions}

## Output
{What this skill produces — vault files, inline output}

## Rules
{Constraints, edge cases, feature toggles to check}

## Examples
{At least one realistic worked example per major workflow path}
```

**Frontmatter fields used:**
- `name` — lowercase, hyphens, max 64 chars. Becomes the `/slash-command`.
- `description` — Claude uses this for auto-invocation. Front-load the action. ~250 chars max.
- `user-invocable: true` — users can type `/myna-{name}` to invoke.

**Frontmatter fields NOT used (v1):**
- `disable-model-invocation` — leave false (default). The main agent's routing logic + auto-invocation work together.
- `allowed-tools` — MCP tool names are user-configured, can't hardcode.
- `context`, `agent`, `model`, `effort`, `paths` — not needed.

## The 24 Skills to Build

### Source material mapping

Each new skill maps to content in existing skill files. Read the source files to extract the relevant procedures, rules, and examples.

| # | New Skill | Source | What to extract |
|---|---|---|---|
| | **Day Lifecycle** | | |
| 1 | `myna-sync` | `sync.md` | Morning Sync, Daily Note Format, Weekly Note, Plan Tomorrow, Journal Auto-Archiving sections. Remove Planning Modes (those go to myna-plan). |
| 2 | `myna-plan` | `sync.md` | Planning Modes section only (Plan Day, Priority Coaching, Week Optimization). These are ephemeral inline advice — no vault writes. |
| 3 | `myna-wrap-up` | `wrap-up.md` | End of Day Wrap-Up section. Remove Weekly Summary (goes to myna-weekly-summary). Keep the reflection/learn invocation. |
| 4 | `myna-weekly-summary` | `wrap-up.md` | Weekly Summary section only, including team health snapshot logic. |
| | **Email Pipeline** | | |
| 5 | `myna-email-triage` | `triage.md` | Entire file (rename only). |
| 6 | `myna-process-messages` | `process.md` | Entire file (rename only). |
| 7 | `myna-draft-replies` | `draft-replies.md` | Entire file (rename only). |
| | **Meeting Lifecycle** | | |
| 8 | `myna-prep-meeting` | `prep-meeting.md` | Entire file (rename only). |
| 9 | `myna-process-meeting` | `process-meeting.md` | Entire file (rename only). |
| | **Information Retrieval** | | |
| 10 | `myna-brief-person` | `brief.md` | Person Briefing section + shared Rules/Output that apply. |
| 11 | `myna-brief-project` | `brief.md` | Project Status Summary section (quick + full modes) + shared Rules/Output that apply. |
| 12 | `myna-team-health` | `brief.md` | Team Health Overview section + shared Rules/Output that apply. |
| 13 | `myna-unreplied-threads` | `brief.md` | Unreplied Tracker section + shared Rules/Output that apply. |
| 14 | `myna-blockers` | `brief.md` | Blocker Detection section + shared Rules/Output that apply. |
| 15 | `myna-1on1-analysis` | `brief.md` | 1:1 Pattern Analysis section + shared Rules/Output that apply. |
| | **People Management** | | |
| 16 | `myna-performance-narrative` | `brief.md` | Performance Narrative section + Review Calibration section (but see note below) + shared Rules/Output that apply. |
| | **Writing** | | |
| 17 | `myna-draft` | `draft.md` | Everything EXCEPT Message Rewriting (step 5) and Pre-Read Preparation (step 11). Keep: email reply, follow-up, meeting invite, status update, escalation, recognition, say-no, conversation prep, monthly update. |
| 18 | `myna-rewrite` | `draft.md` | Message Rewriting section (step 5) only — fix, tone, rewrite modes. Include the Common Patterns (audience resolution, BLUF usage) that apply. |
| | **Data Capture** | | |
| 19 | `myna-capture` | `capture.md` | Entire file (rename only). |
| | **Calendar** | | |
| 20 | `myna-calendar` | `calendar.md` | Entire file (rename only). |
| | **Self-Tracking** | | |
| 21 | `myna-self-track` | `self-track.md` | Entire file (rename only). |
| | **Context** | | |
| 22 | `myna-park` | `park.md` | Entire file (rename only). |
| | **Memory** | | |
| 23 | `myna-learn` | `learn.md` | Entire file (rename only). |
| | **Review** | | |
| 24 | `myna-process-review-queue` | `review.md` | Entire file (rename only). |

**Note on myna-performance-narrative (#16):** This skill covers BOTH performance narrative generation AND the review calibration sub-mode from brief.md. Review calibration is a post-generation step that compares multiple narratives. Include both in the same skill file since calibration requires narratives to exist.

### Post-launch skills (DO NOT build)

These are deferred. Do not create SKILL.md files for them:
- `myna-brief-thread` — Thread summary (from brief.md Thread Summary section)
- `myna-review-calibration` — Review calibration as a standalone skill (folded into myna-performance-narrative for v1)
- `myna-pre-read` — Document analysis (from draft.md Pre-Read Preparation section)

### Descriptions for each skill

Write focused descriptions for auto-invocation. These go in the `description:` frontmatter field. Here are the intents — craft the descriptions from these:

| Skill | Intent (craft description from this) |
|---|---|
| `myna-sync` | Set up or refresh your day — create daily note, meeting preps, weekly note, archive journals |
| `myna-plan` | Planning advice — plan day, priority coaching, week optimization. Inline only, no vault writes. |
| `myna-wrap-up` | Close out your day — planned vs actual, detect contributions, carry forward, reflect |
| `myna-weekly-summary` | Summarize your week — accomplishments, decisions, blockers, tasks, team health snapshot |
| `myna-email-triage` | Sort inbox emails into folders — classify, recommend, move on approval |
| `myna-process-messages` | Extract data from email, Slack, or documents and route to vault destinations |
| `myna-draft-replies` | Batch process forwarded emails from DraftReplies folder into drafts |
| `myna-prep-meeting` | Generate or update meeting prep — topics, action items, context, coaching |
| `myna-process-meeting` | Process meeting notes — close items, create tasks, update timelines, log observations |
| `myna-brief-person` | Person briefing — role, shared projects, open items, pending feedback, 1:1 history, personal notes |
| `myna-brief-project` | Project status — timeline, tasks, blockers, meetings. Quick and full modes. |
| `myna-team-health` | Team health dashboard — open tasks, overdue, feedback gaps, attention gaps for all directs |
| `myna-unreplied-threads` | Unreplied tracker — what's waiting on you vs what you're waiting on |
| `myna-blockers` | Blocker detection — scan all active projects for blockers, overdue dependencies, stuck items |
| `myna-1on1-analysis` | 1:1 pattern analysis — follow-through rates, recurring topics, carry-forward rate, topic balance |
| `myna-performance-narrative` | Generate evidence-based performance review narrative for a direct report. Includes review calibration. |
| `myna-draft` | Generate professional content — replies, status updates, escalations, recognition, say-no, conversation prep, monthly reports |
| `myna-rewrite` | Transform existing messages — fix grammar, adjust tone for audience, or fully rewrite |
| `myna-capture` | Route user-entered data to vault — observations, tasks, links, notes, status changes, recognition |
| `myna-calendar` | Create time blocks, reminders, and break down tasks into subtasks |
| `myna-self-track` | Log contributions and generate career documents — brag docs, self-reviews, promo packets |
| `myna-park` | Save and resume working context across sessions with zero context loss |
| `myna-learn` | Capture and manage Myna's experiential memory — preferences, corrections, patterns |
| `myna-process-review-queue` | Process review queue items — approve, edit, skip, or discard with user judgment |

## How to Build Each Skill

### For "rename only" skills (11 skills)

These take the existing file content as-is with minimal changes:

1. Read the source file
2. Create `agents/skills/myna-{name}/SKILL.md`
3. Add YAML frontmatter (`name`, `description`, `user-invocable: true`)
4. Copy the body content as-is
5. Delete the old flat file

Skills: `myna-email-triage`, `myna-process-messages`, `myna-draft-replies`, `myna-prep-meeting`, `myna-process-meeting`, `myna-capture`, `myna-calendar`, `myna-self-track`, `myna-park`, `myna-learn`, `myna-process-review-queue`

### For "split" skills (13 skills from 4 source files)

These require extracting specific sections from a source file and assembling a new, self-contained skill:

**From `brief.md` → 7 skills:**
1. Read `brief.md` fully
2. For each new skill, extract the relevant sub-mode section
3. Include applicable shared content: the Rules that apply to this sub-mode, the Output conventions, the Inputs it needs
4. Each new skill must be self-contained — a fresh Claude session should execute it with ONLY the skill file + steering files loaded
5. Write a focused Purpose, Triggers, Inputs, Procedure, Output, Rules, Examples for each
6. Delete `brief.md` after all 7 skills are created

**From `sync.md` → 2 skills:**
1. `myna-sync` gets: Morning Sync, Daily Note Format, Weekly Note, Plan Tomorrow, Journal Auto-Archiving
2. `myna-plan` gets: Planning Modes (Plan Day, Priority Coaching, Week Optimization)
3. `myna-plan` needs its own Inputs section (reads the same data as sync but produces inline output only)
4. Delete `sync.md` after both skills are created

**From `wrap-up.md` → 2 skills:**
1. `myna-wrap-up` gets: End of Day Wrap-Up (including reflection/learn invocation)
2. `myna-weekly-summary` gets: Weekly Summary (including team health snapshot)
3. Delete `wrap-up.md` after both skills are created

**From `draft.md` → 2 skills:**
1. `myna-draft` gets: Everything except Message Rewriting and Pre-Read Preparation. Keep Common Patterns (audience resolution, save pattern, BLUF, external content framing).
2. `myna-rewrite` gets: Message Rewriting (fix/tone/rewrite). Include the Common Patterns that apply (audience resolution, BLUF usage for tone/rewrite modes).
3. Pre-Read Preparation is deferred (post-launch) — do not create a skill for it. Remove from draft.md content.
4. Delete `draft.md` after both skills are created

## Other Files to Update

### `agents/main.md`

**Key changes:**

a. **Remove manual skill-reading instruction.** Replace the "read `{{MYNA_HOME}}/skills/{skill}.md`" line with:
```
Skills are loaded automatically by Claude Code when invoked. The user can type /myna-{skill} or describe their intent naturally — Claude Code loads the full skill instructions on demand.
```

b. **Update the Skill Directory table.** List all 24 skills with new names. The table now serves as routing guidance, not a file lookup.

c. **Update the header comment.** `{{MYNA_HOME}}` no longer contains skills — only MCP binary.

d. **Simplify routing logic:**
- **Remove** the "Briefing and Status Routing" section entirely — auto-invocation handles person/project/team/unreplied/blockers/1on1 matching via descriptions
- **Update** "Day Start, Planning, and End" section — split routing between `myna-sync` and `myna-plan`
- **Update** "Writing Routing" — add `myna-rewrite` for "fix this message" / "rewrite this"
- **Update** wrap-up routing — split between `myna-wrap-up` and `myna-weekly-summary`
- **Keep** Universal Done, inbox routing, ambiguous intent, safety refusals, direct operations

e. **Update wrap-up's learn reference.** Change `{{MYNA_HOME}}/skills/learn.md` to reference the skill by name.

### `install.sh`

a. **`copy_skills()` function:** Change to copy `agents/skills/myna-*/SKILL.md` to `~/.claude/skills/myna-*/SKILL.md` (preserving directory structure).
b. **Directory creation:** Remove `$MYNA_HOME/skills`. Add `$HOME/.claude/skills` if not present.
c. **Header comment, manifest, summary output:** Update paths.
d. **`substitute_placeholders()`:** Still needed for `{{VAULT_PATH}}` and `{{SUBFOLDER}}` in skill content.

### `docs/architecture.md`

- Update skill inventory table (24 skills, new names)
- Update "How Myna Runs on Claude Code" section — describe native skill discovery instead of manual reading
- Update install output table — skills go to `~/.claude/skills/myna-{name}/SKILL.md`
- Update skill count references (was 14, now 24)
- Note the 3 deferred post-launch skills

### `CLAUDE.md`

- Update skill file reference: `agents/skills/myna-*/SKILL.md (24 skill directories)`

### `README.md`

- Update install description: skills copied to `~/.claude/skills/`
- Update skill count

### `scripts/lint-agents.sh`

- Update skill file cross-reference check for new directory structure

### `tests/manual-test-checklist.md`

- Update references to skill file paths

## Execution Order

1. **Read all existing skill files** — understand the source material before writing anything
2. **Build "rename only" skills first (11 skills)** — straightforward, builds familiarity with the format
3. **Build "split" skills (13 skills from 4 sources)** — extract, assemble, make self-contained
4. **Delete old flat `.md` files** — after all new skills are created and verified
5. **Update `agents/main.md`** — new skill directory, simplified routing
6. **Update `install.sh`** — new paths and copy logic
7. **Update docs** — architecture.md, CLAUDE.md, README.md
8. **Update supporting files** — lint script, test checklist

## Verification

After all changes:
- `ls agents/skills/` shows 24 `myna-*` directories, no loose `.md` files
- Each directory has exactly one `SKILL.md` with valid YAML frontmatter
- `agents/main.md` skill directory table has 24 entries with correct names
- No references to `{{MYNA_HOME}}/skills/` remain (grep for it)
- No references to `~/.myna/skills/` remain in active files
- `install.sh` targets `~/.claude/skills/`
- Each split skill is self-contained — check that shared rules/inputs aren't missing
- Post-launch skills (`myna-brief-thread`, `myna-review-calibration`, `myna-pre-read`) do NOT have directories

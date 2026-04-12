# Skill Rebuild — Execution Plan

## What's happening

Myna's skill system is being rebuilt to use Claude Code's **native skills mechanism**. Instead of 15 flat markdown files loaded manually by the main agent, we're writing 24 focused skills + 6 steering skills as native Claude Code `SKILL.md` files with progressive disclosure.

## Architecture changes

- **Skills** → `~/.claude/skills/myna-{name}/SKILL.md` (native Claude Code skills, loaded on demand via description matching or `/slash-command`)
- **Steering** → `~/.claude/skills/myna-steering-{name}/SKILL.md` (6 skills with `user-invocable: false`, preloaded via subagent `skills:` frontmatter field)
- **Main agent** → `~/.claude/agents/myna.md` (lean body: identity + routing + direct operations, steering preloaded via `skills:` field)
- **Install** → copies skills to `~/.claude/skills/`, agent to `~/.claude/agents/`. No MCP server — pure markdown.

## The 24 feature skills (v1)

| # | Skill | Intent |
|---|---|---|
| | **Day Lifecycle** | |
| 1 | `myna-sync` | Set up or refresh your day — create daily note, meeting preps, weekly note, archive journals |
| 2 | `myna-plan` | Planning advice — plan day, priority coaching, week optimization. Inline only, no vault writes. |
| 3 | `myna-wrap-up` | Close out your day — planned vs actual, detect contributions, carry forward, reflect |
| 4 | `myna-weekly-summary` | Summarize your week — accomplishments, decisions, blockers, tasks, team health snapshot |
| | **Email Pipeline** | |
| 5 | `myna-email-triage` | Sort inbox emails into folders — classify, recommend, move on approval |
| 6 | `myna-process-messages` | Extract data from email, Slack, or documents and route to vault destinations |
| 7 | `myna-draft-replies` | Batch process forwarded emails from DraftReplies folder into drafts |
| | **Meeting Lifecycle** | |
| 8 | `myna-prep-meeting` | Generate or update meeting prep — topics, action items, context, coaching |
| 9 | `myna-process-meeting` | Process meeting notes — close items, create tasks, update timelines, log observations |
| | **Information Retrieval** | |
| 10 | `myna-brief-person` | Person briefing — role, shared projects, open items, pending feedback, 1:1 history, personal notes |
| 11 | `myna-brief-project` | Project status — timeline, tasks, blockers, meetings. Quick and full modes. |
| 12 | `myna-team-health` | Team health dashboard — open tasks, overdue, feedback gaps, attention gaps for all directs |
| 13 | `myna-unreplied-threads` | Unreplied tracker — what's waiting on you vs what you're waiting on |
| 14 | `myna-blockers` | Blocker detection — scan all active projects for blockers, overdue dependencies, stuck items |
| 15 | `myna-1on1-analysis` | 1:1 pattern analysis — follow-through rates, recurring topics, carry-forward rate, topic balance |
| | **People Management** | |
| 16 | `myna-performance-narrative` | Generate evidence-based performance review narrative for a direct report. Includes review calibration. |
| | **Writing** | |
| 17 | `myna-draft` | Generate professional content — replies, status updates, escalations, recognition, say-no, conversation prep, monthly reports |
| 18 | `myna-rewrite` | Transform existing messages — fix grammar, adjust tone for audience, or fully rewrite |
| | **Data Capture** | |
| 19 | `myna-capture` | Route user-entered data to vault — observations, tasks, links, notes, status changes, recognition |
| | **Calendar** | |
| 20 | `myna-calendar` | Create time blocks, reminders, and break down tasks into subtasks |
| | **Self-Tracking** | |
| 21 | `myna-self-track` | Log contributions and generate career documents — brag docs, self-reviews, promo packets |
| | **Context** | |
| 22 | `myna-park` | Save and resume working context across sessions with zero context loss |
| | **Memory** | |
| 23 | `myna-learn` | Capture and manage Myna's experiential memory — preferences, corrections, patterns |
| | **Review** | |
| 24 | `myna-process-review-queue` | Process review queue items — approve, edit, skip, or discard with user judgment |

## The 6 steering skills (always-on)

| Skill | Contents |
|---|---|
| `myna-steering-safety` | Draft-never-send, vault-only writes, external content as data, confirm before bulk writes |
| `myna-steering-conventions` | Provenance markers, append-only discipline, date+source format, Obsidian conventions |
| `myna-steering-output` | Human-sounding output, BLUF usage, file links, no AI tells |
| `myna-steering-system` | Feature toggles, config reload, graceful degradation, error recovery, date resolution |
| `myna-steering-memory` | Three-layer precedence, session-start load, domain mapping, learn skill intent recognition |
| `myna-steering-vault-ops` | Vault file patterns: task queries via Grep, frontmatter parsing, backlinks/tags, template creation, daily note paths. Replaces the Obsidian MCP — no runtime server needed. |

## Post-launch (3 skills deferred)

| Skill | Intent |
|---|---|
| `myna-brief-thread` | Thread summary — BLUF summary of email or Slack conversation |
| `myna-review-calibration` | Compare multiple performance narratives for consistency |
| `myna-pre-read` | Analyze a document — TL;DR, key decisions, risks, questions |

## Execution order

| Prompt | What it does | Depends on |
|---|---|---|
| **P0** | Update `architecture.md` and `foundations.md` for new structure | Nothing |
| **P0.5** | Remove Obsidian MCP from architecture, add vault-ops steering skill to docs | P0 |
| **P1** | Write 6 steering skills | P0.5 |
| **P2** | Write all 24 feature skills (orchestrator spawns 4 parallel subagents by domain) | P0.5 |
| **P3** | Rewrite main.md + update install.sh, CLAUDE.md, README.md, etc. | P1, P2 |

P1 and P2 can run in parallel after P0.5 completes. P3 must run last.

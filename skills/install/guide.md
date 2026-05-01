# Myna User Guide

## 1. What Is Myna

Myna is a privacy-first AI assistant for tech professionals — engineering managers, tech leads, senior engineers, and PMs. It manages the information layer of your job: emails, Slack messages, meetings, projects, people, and tasks. You interact through natural language prompts inside Claude Code. Myna reads from your company's existing tools via MCP servers and writes exclusively to your local Obsidian vault as plain markdown. It drafts but never sends, organizes but never decides, surfaces but never hides.

To see what this looks like in practice, read [A Day with Myna](a-day-with-myna.md) — a realistic workday walkthrough from morning sync to end-of-day wrap-up.

---

## 2. How It Works

```
You (inside Claude Code)
  │
  │  "prep brief for my 1:1 with Sarah"
  │
  ▼
Myna Agent Instructions
  │                │
  ▼                ▼
Obsidian Vault     Company MCP Servers
(local markdown)   (email, Slack, calendar)
  writes here        reads from here
```

When you type a prompt, the Myna agent reads it and determines which skill to invoke. Skills are loaded on demand — at startup, only their names and one-line descriptions are in context. When a skill is triggered, its full instructions are loaded and executed. Cross-cutting rules (safety, output style, vault conventions, memory) live in 6 steering skills that are always preloaded.

Myna has 24 feature skills covering every domain of your workflow, and 6 steering skills that enforce consistent behavior across all of them. Every skill is a plain markdown file — there is no compiled code, no binary, no framework.

---

## 3. Vault Structure

After install, Myna creates the following folder structure inside your vault's `myna/` subfolder:

| Folder | Purpose |
|--------|---------|
| `Projects/` | One file per active project — timeline, tasks, decisions, blockers |
| `People/` | One file per person — notes, open items, observations, feedback |
| `Meetings/1-1s/` | One file per person you meet 1:1 regularly |
| `Meetings/Recurring/` | Files for recurring team meetings |
| `Meetings/Adhoc/` | Files for one-off meetings |
| `Drafts/` | Email drafts, message drafts, status updates created by Myna |
| `Journal/` | Daily notes and weekly notes |
| `Journal/Archive/` | Auto-archived notes older than 30 days |
| `Team/` | Team health snapshots (managers only) |
| `ReviewQueue/` | Items requiring your judgment before Myna acts |
| `Dashboards/` | 10 Dataview-powered dashboards |
| `_system/config/` | Your 5 config files (YAML) |
| `_system/templates/` | Templates for new notes |
| `_system/logs/` | Audit log, prompt log, processed channel timestamps |
| `_system/sources/` | Source message references for deduplication |
| `_system/parked/` | Parked context saved by /myna:park |
| `_meta/learnings/` | Behavioral preferences captured by /myna:learn |

---

## 4. Skills Reference

### Feature Skills (24)

| Skill | Description |
|-------|-------------|
| **/myna:sync** | Set up or refresh your day — creates daily note, generates meeting prep, surfaces overdue tasks and review queue. Handles "plan tomorrow" and weekly note creation. |
| **/myna:plan** | Planning advice — analyzes workload, meetings, and tasks. Three modes: Plan Day, Priority Coaching, Week Optimization. Never writes to vault. |
| **/myna:wrap-up** | Close out your day — compares planned vs actual, logs contributions, moves unfinished items to tomorrow, runs a learning reflection. |
| **/myna:weekly-summary** | Summarize your week — synthesizes daily notes, contributions, decisions, and task completions. Includes team health snapshot for managers. |
| **/myna:email-triage** | Sort inbox emails into folders. Three-step flow: read inbox, write recommendations, then process triage to move emails. |
| **/myna:process-messages** | Extract structured data from email, Slack, or pasted documents and route to the vault. Populates tasks, timelines, person files, and review queues. |
| **/myna:draft-replies** | Process the DraftReplies email folder — reads forwarded emails with your drafting instructions, creates reply drafts in the vault. |
| **/myna:prep-meeting** | Generate or update meeting prep for one meeting or all remaining meetings today. Includes carry-forward items and coaching notes. |
| **/myna:process-meeting** | Process a completed meeting — closes checked prep items, extracts tasks/decisions/observations, routes each to the vault. |
| **/myna:brief-person** | Deep-dive briefing on one person — role, shared projects, open items, pending feedback, 1:1 history, personal notes. |
| **/myna:brief-project** | Catch up on a project — quick (3-5 bullet TL;DR) or full (status, timeline, blockers, tasks, dependencies). |
| **/myna:team-health** | Portfolio view of all direct reports — tasks, overdue, delegations, feedback gap, attention gap, last 1:1. Managers only. |
| **/myna:unreplied-threads** | Show what's waiting on you and what others owe you — queries reply-needed tasks in the vault. |
| **/myna:blockers** | Scan all active projects for blockers — explicit callouts, overdue dependency tasks, overdue tasks. |
| **/myna:1on1-analysis** | Analyze 1:1 patterns with a specific person — action item follow-through, recurring topics, carry-forward rate. |
| **/myna:performance-narrative** | Generate a performance narrative for a team member's review cycle. Also calibrates consistency across multiple narratives. |
| **/myna:draft** | Generate professional written content — email replies, follow-ups, status updates, escalations, recognition, monthly updates. |
| **/myna:rewrite** | Fix, adjust, or restructure existing text. Three modes: fix (grammar), tone (restyle for audience), rewrite (full restructure). |
| **/myna:capture** | Route input to vault destinations — quick notes, observations, recognition, tasks (single or recurring), links, project/person updates. |
| **/myna:calendar** | Create personal calendar time blocks, reminders, and task breakdowns. Finds free slots, proposes options, user confirms. |
| **/myna:self-track** | Log contributions and generate self-review documents — brag docs, self-reviews, promo packets. Your contributions only. |
| **/myna:park** | Save working context for zero-loss resumption in a new session. Resume by name or list all parked items. |
| **/myna:learn** | Manage Myna's emergent memory — capture behavioral preferences, reflect on session patterns, delete wrong rules. |
| **/myna:process-review-queue** | Process review queue items across review-work, review-people, and review-self queues — interactively or from pre-checked items. |

### Steering Skills (6)

Steering skills are always active. You don't invoke them directly.

| Skill | Purpose |
|-------|---------|
| **myna:steering-safety** | Draft-never-send, vault-only writes, confirmation policy |
| **myna:steering-conventions** | Data provenance markers, date format, Obsidian formatting |
| **myna:steering-output** | Human voice, BLUF for professional writing, output density |
| **myna:steering-vault-ops** | File I/O patterns, task queries, frontmatter, vault path conventions |
| **myna:steering-system** | Feature toggles, config reload, graceful degradation, error recovery |
| **myna:steering-memory** | Three-layer memory precedence, session-start loading, domain mapping |

---

## 5. Configuration Reference

Config files live at `{vault}/myna/_system/config/`. Each has a `.example` file alongside it with full documentation and realistic examples.

### workspace.yaml

The primary config file. Required — Myna reads it at every session start.

| Field | What to put |
|-------|-------------|
| `user.name` | Your full name |
| `user.email` | Your work email (used to identify your messages) |
| `user.role` | `engineering-manager`, `tech-lead`, `senior-engineer`, or `pm` |
| `vault.path` | Absolute path to your Obsidian vault |
| `timezone` | IANA timezone, e.g. `America/Los_Angeles` |
| `work_hours.start` / `.end` | Your workday bounds, e.g. `09:00` / `17:00` |
| `journal.archive_after_days` | Auto-archive daily notes older than this many days (default: 30) |
| `email.processed_folder` | `per-project` (email moves to each project's Processed/ subfolder) |
| `feedback_cycle_days` | Days between feedback gap alerts (default: 30) |
| `calendar_event_prefix` | Prefix on all Myna-created calendar events (default: `[Myna]`) |
| `mcp_servers.email` | Name of your registered email MCP server (e.g. `gmail-mcp`) |
| `mcp_servers.slack` | Name of your registered Slack MCP server |
| `mcp_servers.calendar` | Name of your registered calendar MCP server |
| `features.*` | Toggle individual features on/off (all default to `true`) |

### projects.yaml

One entry per active project. Myna uses this to route emails, Slack messages, and prompts to the right project file.

| Field | What to put |
|-------|-------------|
| `name` | Project display name |
| `aliases` | Short names for quick reference in conversation |
| `status` | `active`, `paused`, or `complete` |
| `email_folders` | Email folders/labels mapped to this project |
| `slack_channels` | Slack channels mapped to this project |
| `description` | One-line description |
| `key_people` | People involved (matched against people.yaml) |
| `triage.*` | Inbox source, triage folders with descriptions, DraftReplies folder |

### people.yaml

One entry per person you work with. Start with direct reports and close collaborators.

| Field | What to put |
|-------|-------------|
| `display_name` | How you refer to them in conversation |
| `full_name` | Full name for email/message matching |
| `aliases` | Short names (e.g. initials) |
| `email` | Work email address |
| `slack_handle` | Slack username |
| `relationship_tier` | `direct`, `peer`, `upward`, or `cross-team` |
| `role` | Their title |
| `team` | Their team |
| `feedback_cycle_days` | Override workspace default for this person |
| `birthday` | MM-DD format (for milestone alerts in daily note) |
| `work_anniversary` | YYYY-MM-DD format (for milestone alerts) |

### meetings.yaml

Optional overrides. Most meetings need no entry — Myna infers type from calendar data. Only add meetings with custom type assignments or special processing.

| Field | What to put |
|-------|-------------|
| `name` | Meeting name as it appears in your calendar |
| `aliases` | Short names for quick reference |
| `type` | `1-1`, `recurring`, `adhoc`, or `project` |
| `project` | Associate with a project from projects.yaml |
| `debrief_type` | `design-review`, `standup`, `project`, or `general` |

### communication-style.yaml

Controls how Myna drafts emails, messages, and other written content.

| Field | What to put |
|-------|-------------|
| `default_preset` | `professional`, `conversational`, `executive`, `casual`, `coaching`, `diplomatic`, or `concise` |
| `presets_per_tier.upward` | Preset for messages to your manager and execs |
| `presets_per_tier.peer` | Preset for messages to peers |
| `presets_per_tier.direct` | Preset for messages to direct reports |
| `presets_per_tier.cross-team` | Preset for messages to other teams |
| `sign_off` | Email sign-off (e.g. `Best`, `Thanks`) |
| `difficult_message_approach` | Style for tough conversations (e.g. `direct-but-kind`) |
| `email_preferences.max_length` | `short`, `medium`, or `long` |
| `messaging_preferences.formality` | `casual` or `professional` |

---

## 6. MCP Servers

Myna reads from email, Slack, and calendar via MCP servers you register with Claude Code. Myna works without them — features that require them degrade gracefully rather than failing.

Register each server once:

```bash
claude mcp add gmail-mcp -- <your-gmail-mcp-command>
claude mcp add slack-mcp -- <your-slack-mcp-command>
claude mcp add gcal-mcp -- <your-gcal-mcp-command>
```

After registering, update the `mcp_servers` section in `workspace.yaml` to match the names you used. The default names (`gmail-mcp`, `slack-mcp`, `gcal-mcp`) are pre-filled in the starter config.

MCP servers provide Myna with read access to your inbox, channels, and calendar. Myna never sends email, never posts to Slack, and never creates calendar events with attendees.

---

## 7. Common Workflows

### Morning Sync

```
sync
```

Myna creates today's daily note with your capacity check, meeting list, overdue tasks, and delegation alerts. Generates prep files for each of today's meetings. If it's Monday, creates the weekly note too.

### Preparing for a 1:1

```
prep for my 1:1 with Sarah
```

Myna reads Sarah's person file, recent 1:1 history, open tasks, and pending feedback. Generates a prep section with checkboxes, carry-forward items from last time, and coaching notes for any sensitive topics you should raise.

### Project Status

```
catch me up on the auth migration
```

Myna reads the project file and returns a quick TL;DR (3-5 bullets) covering status, recent progress, open blockers, and upcoming milestones. Add "full" for the complete breakdown.

### Drafting a Reply

```
draft reply to James about the Q3 staffing proposal
```

Myna reads relevant context from James's person file and any related project files, then drafts a reply matching your communication style preferences for peer-tier messages.

### Weekly Review

```
weekly summary
```

Myna synthesizes your 5 daily notes into a structured weekly review: projects progressed, tasks completed and carried, key decisions, contributions, and reflection prompts for next week.

### Processing Your Inbox

```
triage my inbox
```

Myna reads your inbox and writes folder recommendations to `ReviewQueue/review-email-triage.md`. You open the file in Obsidian, edit any recommendations, then say "process triage" to move the emails.

```
process my email
```

After triage, Myna reads your project-mapped email folders and extracts structured data — tasks, timeline updates, decisions, observations — routing each to the right vault file.

---

## 8. Core Principles

| Principle | What it means |
|-----------|---------------|
| **Privacy-first** | All data lives in your Obsidian vault as plain markdown. Nothing leaves your machine except through MCP servers you've registered. |
| **Draft, never send** | Every outbound communication — email, Slack message, calendar invite with attendees — requires your explicit action. Myna writes to `Drafts/`; you send. |
| **Human-in-the-loop** | Items requiring judgment go to a review queue. Myna flags uncertainty rather than guessing. |
| **Claude-first, not Claude-only** | Built and tested for Claude Code, but all instructions are plain markdown readable by any capable LLM. |
| **Enterprise-friendly** | No new infrastructure. Connects to your company's existing MCP servers. No data leaves your vault except via those servers. |
| **Config-driven** | All personal data (your name, email, projects, people) lives in gitignored config files. The Myna repo itself is shareable as-is. |

---

## 9. Troubleshooting

**`myna` command not found**

The alias was added to your shell rc file but hasn't been loaded yet. Run `source ~/.zshrc` (or `source ~/.bashrc`), or open a new terminal window.

**"Feature X is disabled"**

Check `myna/_system/config/workspace.yaml` and confirm the relevant feature toggle is set to `true`. Changes take effect on the next session start.

**Myna can't read my email / Slack / calendar**

Confirm the MCP server is registered: `claude mcp list`. The server name must match what's in `workspace.yaml` under `mcp_servers`. Re-register if needed with `claude mcp add`.

**Dashboards show no data**

The Dataview plugin must be installed and enabled in Obsidian. Go to Settings → Community Plugins → confirm Dataview is active, then go to Settings → Dataview and enable Dataview JS queries and inline queries.

**Myna is writing to the wrong project**

The project's `email_folders` or `slack_channels` in `projects.yaml` may not match your actual folder/channel names. Check the exact names and update the config. Then say "reload config" to pick up the changes without restarting.

**Review queue is growing but I'm not processing it**

Say "process my review queue" to work through items interactively. For `review-email-triage.md` specifically, check items in Obsidian and then say "process triage" — that file is handled by /myna:email-triage, not /myna:process-review-queue.

# Myna

**The system for everything you're trying to keep in your head.**
**Nothing leaves your machine.**

<!-- TODO: Add GIF demo — sync → prep → capture in ~25 seconds -->

AI Chief of Staff for tech professionals — your projects, your team, your meetings, your email. 30 skills and growing. Runs in [Claude Code](https://claude.ai/code).

---

## The Problem

If you manage multiple projects and communication channels — whether you're an engineering manager, tech lead, PM, director, or senior IC — you spend too much of your day on information management. Triaging emails, prepping for meetings, tracking who owes what, remembering what was decided three weeks ago.

Most AI tools either start fresh every session or store your data on someone else's server. Myna does neither. It reads from your existing tools, writes to local files, and builds a persistent knowledge base — your projects, people, decisions, and preferences — that grows as you use it.

**Drafts but never sends. Organizes but never decides. Surfaces but never hides.**

## Why Myna

Myna runs inside Claude Code. Here's what role-specific skills and a local knowledge base add:

| | AI Chat Tools<br>*(Claude, ChatGPT, Gemini)* | Local AI Tools<br>*(Khoj, Fabric, PrivateGPT)* | **Myna** |
|---|---|---|---|
| Knowledge base | Platform memory — general-purpose | Your existing notes — you organize | **Organized by projects, people, meetings — created as you work** |
| Output | Chat + generated documents | Answers about your notes | **Persistent files — drafts, briefs, prep, daily notes** |
| Creates & organizes | On request — you direct every action | No — reads what you wrote | **From one prompt — routes, updates, and maintains files across folders** |
| Works with | Whatever you prompt about | Fixed set of built-in integrations | **Whatever your company already uses (bring your own MCPs)** |
| Knows you | Platform memory + custom instructions | Limited to what's in your notes | **Learns preferences, knows your projects and people by name** |
| Built for the role | General-purpose — you build your own workflow | General-purpose — Q&A over any content | **Your full workday covered — morning sync, meeting prep, email triage, project catch-up, each one prompt away** |
| Judgment calls | Asks in conversation — lost if you miss it | Best guess from your notes | **Persistent review queue — nothing ambiguous auto-resolves** |
| Customizable | Configure via settings (GPTs, Projects) | Open source — customize via config or code | **Full control — every skill is a readable, editable file** |

## See It In Action

A day in the life of an Engineering Manager using Myna:

```
7:45 AM — coffee, laptop open
> sync
↳ Daily note created. Phoenix blocker flagged. Sarah Mitchell's reply overdue.

8:10 AM — before your 9am 1:1
> prep for my 1:1 with Marcus
↳ Open items from last time, pending feedback with coaching notes,
  parental leave thread — all in one brief.

9:35 AM — back from the 1:1
> done with 1:1 with Marcus
↳ Tasks, decisions, observations extracted and routed to the right files.

9:50 AM — quick multi-thing capture
> capture: Sarah handled Payments questions well, atlas is unblocked,
  review Sentinel audit by Friday
↳ 3 items → 3 files. Recognition, timeline update, task with due date.

12:45 PM — VP wants a risk note
> draft the Phoenix risk note for the VP review
↳ Leads with the conclusion, evidence-grounded, under 200 words.
  Ready for you to review, then send yourself.

3:45 PM — the ambiguous pile
> review my queue
↳ Items Myna wasn't sure about — you approve, redirect, or dismiss.

5:30 PM — close the day
> wrap up
↳ Planned vs actual. Contributions logged. Tomorrow's note created with carry-forwards.
```

Not an EM? The skills work for anyone juggling projects and communication — tech leads, PMs, directors, senior ICs.

Full walkthrough: [A Day With Myna](docs/a-day-with-myna.md) · Browse the [demo vault](tests/fixtures/vault/myna) to see the files Myna creates

## Privacy & Security

- **All data stays local** — plain-text files on your machine, viewable in any editor
- **No new infrastructure** — connects to your existing email, Slack, and calendar integrations
- **Draft, never send** — Myna creates the draft; you decide what to send and where
- **Config-driven** — your personal data (projects, people, preferences) is separate from the codebase
- **External content can't override behavior** — even if an email says "delete all files," Myna processes it as content, never follows instructions from external sources

## Getting Started

**Prerequisites:** [Claude Code](https://claude.ai/code) · [Obsidian](https://obsidian.md/) *(recommended but not required — all files are plain text, viewable in any editor)*

```bash
/plugin marketplace add agentflock/plugins
/plugin install myna@agentflock
/myna:init
```

`/myna:init` creates your Myna folder and remembers where it lives. Then run `/myna:setup` for guided configuration — identity, projects, people, and communication style. Or edit the config files directly at `myna/_system/config/`.

Email, Slack, and calendar connections are optional — skip what you don't have. Myna works without them from day one.

Once installed, run from any directory — pick the mode that fits:

```bash
myna          # full access — reads and writes your files
myna-ro       # read-only — browse and query, no changes
myna-x        # no file access — conversation only
```

First time? Try `sync` to set up your day, or `what can you do?` to see all skills.

**After install you get:**

- Organized folder structure with 10 pre-built dashboards (best viewed in Obsidian)
- 30 skills covering email, meetings, projects, people, and daily workflow
- Config files ready for your projects and people

Your data, configs, and custom rules are never touched by updates.

## Skills

### Daily Workflow
`sync` · `capture` · `plan` · `park` / `resume` · `learn` · `wrap up` · `weekly summary`

> *"sync"* — daily note, meeting prep, overdue tasks, review queue surfaced
> *"park this"* / *"resume auth caching"* — zero-loss context switching across sessions
> *"what should I focus on today?"* — ranked priorities with reasoning
> *"remember that I prefer bullet points in status updates"* — Myna learns your preferences over time
> *"weekly summary"* — accomplishments, decisions, blockers, tasks completed, self-reflection prompts

### Email & Messaging
`triage inbox` · `process messages` · `draft replies`

> *"triage these inbox emails: [paste]"* — folder recommendations with one-line reasoning per email
> *"process these slack messages: [paste]"* — project updates, action items, and timeline entries extracted and routed
> *"reply to these forwarded emails: [paste]"* — separates your instructions from the forwarded thread, drafts reply

### Meetings & Calendar
`prep meeting` · `process meeting` · `block time`

> *"prep for my remaining meetings today"* — skips already-prepped, fills in the rest
> *"done with 1:1 with Marcus"* — tasks, decisions, observations extracted in one step
> *"reserve 2 hours Monday for the coverage plan"* — personal time blocks only, never creates events with attendees

### Projects & Tasks
`brief project` · `blockers` · `unreplied threads`

> *"catch me up on atlas migration"* — timeline, blockers, tasks, dependencies, upcoming meetings
> *"what's blocked?"* — every blocker across every project, with age and next action
> *"what am I waiting on?"* — messages needing your reply vs waiting on others

### People
`brief person` · `team health` · `1:1 analysis` · `performance narrative`

> *"brief me on Sarah Carter"* — role, shared projects, open items, pending feedback, 1:1 history
> *"how is my team doing?"* — portfolio view: tasks, overdue, feedback gaps, last 1:1
> *"analyze my 1:1s with Marcus"* — patterns, follow-through rate, recurring topics
> *"build Sarah's performance review narrative"* — synthesizes months of observations, recognition, and contributions

### Writing & Drafts
`draft` · `rewrite`

> *"draft an escalation for the Phoenix validator blocker"* — severity, impact, and recommended action, grounded in project context
> *"draft recognition for Sarah Carter"* — specific, backed by actual observations from your files
> *"fix this: i wanted to loop you in on sarahs progress..."* — grammar and tone, preserved voice

### Self Tracking
`log contribution` · `brag doc` · `self review`

> *"log contribution: led atlas design review, got cross-team alignment"* — categorized, appended
> *"build my brag doc for Q1"* — pulls from your contributions log, organized by impact category
> *"am I underselling myself in this self-review?"* — checks your draft against what you actually logged

### Review Queue
`review my queue`

> Items Myna wasn't sure about land here — ambiguous owners, inferred contributions, unclear intent. Each item shows its source and proposed action. You approve, redirect, or dismiss.

## How It Works

Myna is not an application. There is no server, no API, no frontend. It's 30 skills, a folder structure, and config files — all running inside Claude Code.

```
┌─────────────────────────────────────────────┐
│  You (in Claude Code)                       │
│  "prep brief for my 1:1 with Sarah"        │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  Myna Agent + Skills                        │
│  Loaded on demand · Safety at every layer   │
└────────┬────────────────────┬───────────────┘
         │                    │
         ▼                    ▼
┌─────────────────┐  ┌───────────────────────┐
│  Your Machine    │  │  Your MCP Servers     │
│  (local files)   │  │  (email, Slack, cal)  │
│                  │  │                       │
│  reads & writes  │  │  reads only           │
└─────────────────┘  └───────────────────────┘
```

The runtime is Claude Code; Myna's skills provide the expertise. Myna ships no servers of its own — it uses Claude Code's built-in file operations.

**Folder structure:**

```
myna/
├── Journal/          # Daily notes, weekly summaries, contributions
├── Projects/         # One file per project — timeline, blockers, tasks
├── People/           # One file per person — observations, feedback, notes
├── Meetings/         # 1:1s, recurring, ad-hoc — prep and notes
├── Drafts/           # Email drafts, status updates, recognition
├── ReviewQueue/      # Items awaiting your judgment
├── Team/             # Team-level files
└── _system/          # Config, logs, dashboards
    └── config/       # Your projects, people, preferences
```

Myna runs on Claude Code, but all skills are plain text — readable by any capable LLM. The same instructions can be adapted for other AI tools.

## Customization

All customizations survive updates.

| What | How |
|---|---|
| **Tweak a skill** | Add `CUSTOM.md` alongside the skill's `SKILL.md` in `~/.claude/skills/myna-*/`. Your overrides take precedence. |
| **Add a skill** | Create `~/.claude/skills/myna-[yourprefix]-[name]/` (e.g., `myna-amazon-oncall`). Single-word `myna-[word]` is reserved for built-in skills. Add routing rules to `~/.myna/custom-routing.md`. |
| **Disable a skill** | Delete or rename its folder. |

See [Customization Guide](docs/customization.md) for details.

## Built Entirely by Claude Code

Myna was designed, built, reviewed, and fixed entirely by Claude Code — from feature specs through architecture, implementation, and polish. One person defined the vision and settled decisions. Claude designed the architecture, wrote all 30 skills (24 feature skills + 6 behavioral rules), built the file templates and dashboards, created the install script, and wrote this documentation.

Two things came out of this, not one: the assistant itself, and a methodology for having AI build an AI assistant from scratch — reusable for other projects on any capable LLM.

[How it was built →](docs/how-it-was-built.md)

## Documentation

| Document | Purpose |
|----------|---------|
| [User Guide](docs/guide.md) | Full reference — skills, config, workflows |
| [Customization](docs/customization.md) | Tweaking skills, adding your own, routing rules |
| [A Day With Myna](docs/a-day-with-myna.md) | Realistic workday walkthrough |
| [Architecture](docs/architecture.md) | Runtime model, skill inventory, folder structure |
| [Obsidian Setup](docs/obsidian-setup.md) | Plugin configuration and dashboards |
| [How It Was Built](docs/how-it-was-built.md) | The Claude Code methodology behind Myna |

## Contributing

The repo includes 10 dev skills that automate the full contributor workflow — from interactive design sessions through autonomous implementation, self-review, and PR creation. Clone the repo, open in Claude Code, and use `/myna-dev-brainstorm` to design or `/myna-dev-diagnose` to fix. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## Status

**v1.0** — released. [MIT License](LICENSE). Actively developed — see [roadmap](ROADMAP.md).

v1 runs only when you ask — no scheduled jobs or background watchers yet. Automation (scheduled syncs, email monitoring) is on the [roadmap](ROADMAP.md). Tested with Gmail, Google Calendar, and Slack MCPs.

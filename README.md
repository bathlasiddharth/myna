# Myna

**Myna** — a privacy-first AI agent that acts as your Chief of Staff, powered by Claude Code. Works exclusively within your company's approved tools and never acts without your approval.

No cloud, no new infrastructure, nothing leaves your machine — unlike most AI assistants. It reads from your existing tools and writes everything to a local Obsidian vault as plain markdown. The more you use it, the more it knows your world — your projects, your people, your preferences.

**Drafts but never sends. Organizes but never decides. Surfaces but never hides.**

## Who It's For

Engineering managers, tech leads, and other leaders who manage multiple projects and communication channels. If you spend your day context-switching between email, Slack, calendar, and project tracking — and want a Chief of Staff that handles the tedious parts without risking mistakes — Myna is for you.

Myna runs on [Claude Code](https://claude.ai/code). Its instructions are plain markdown — adaptable to any AI assistant if your team uses something else.

## What Myna Does

| Domain | Examples |
|--------|----------|
| **Context & Memory** | Learns your projects, people, and preferences — gets smarter the more you use it |
| **Daily Workflow** | Morning sync, daily notes, weekly summaries, review queue |
| **Email & Messaging** | Triage inbox, summarize threads, extract action items, draft replies |
| **Meetings & Calendar** | Prep briefs, debrief after meetings, track decisions, block focus time |
| **Projects & Tasks** | Maintain project files, manage tasks, context switching |
| **People Management** | Person files, 1:1 prep, performance narratives, recognition |
| **Writing & Drafts** | Email drafts, message rewrites, status updates, doc review |
| **Self Tracking** | Contribution logs, brag docs, promo packets, self-reviews |
| **Review Queue** | Routes judgment calls to your approval queue — nothing ambiguous gets acted on automatically |

## A Day With Myna

A realistic workday for an Engineering Manager — the moments you'd actually reach for Myna:

```
7:45 AM — coffee, laptop open
> sync
↳ Daily note created; Phoenix blocker flagged; Sarah Mitchell OKR reply overdue

7:55 AM — OK but what actually matters today?
> what should I focus on today?
↳ 5-7 ranked priorities with reasoning — no writes

8:10 AM — before your 9am 1:1 with Marcus
> prep for my 1:1 with Marcus
↳ Prep brief appended to Meetings/1-1s/marcus-walker.md — pending feedback, carry-forwards, personal notes

9:35 AM — back at your desk after the 1:1
> done with 1:1 with Marcus
↳ Extracts delegations, observations, and personal notes to the right files

9:50 AM — quick multi-thing capture
> capture: Sarah handled Payments questions really well, atlas is unblocked on the spec side, and I need to review Sentinel phase 1 audit by next Friday
↳ 3 entries routed to 3 files — recognition, timeline, task

12:45 PM — VP asked for a Phoenix risk note
> draft the Phoenix risk note for the VP portfolio review
↳ BLUF, evidence-grounded, under 200 words — inline first, saves on approval

1:00 PM — "can I just send this?"
> send this to James: Atlas is on track, one cardinality risk...
↳ Refuses. Myna drafts, never sends. Offers to draft instead.

3:45 PM — the ambiguous pile
> review my queue
↳ Presents each item one at a time — source, proposed action, destination. Waits for you.

5:30 PM — close the day
> wrap up
↳ Planned-vs-actual, contributions logged, tomorrow's note created with carry-forwards
```

Full walkthrough: [A Day With Myna](docs/a-day-with-myna.md) · Browse the [test vault](tests/fixtures/vault/myna) to see the files Myna reads and writes

## Core Principles

- Local-first — all data stays in your Obsidian vault as plain markdown, nothing leaves your machine
- Draft, never send — every outbound action requires your explicit approval
- Human-in-the-loop — judgment calls go through a review queue, never auto-resolved
- Enterprise-friendly — no new infrastructure, no cloud sync, connects to your existing MCP servers
- Config-driven — personal data lives in your own config files; the system itself is shareable
- Context-aware — knows your projects, people, and preferences; gets smarter the more you use it

## Installation

**Prerequisites:** [Claude Code](https://claude.ai/code) · [Obsidian](https://obsidian.md/)

```bash
git clone https://github.com/bathlasiddharth/myna.git
cd myna
./install.sh
```

Then open `myna/_system/setup-checklist.md` in your vault and follow the steps.

### Updating

```bash
git pull && ./update.sh
```

This updates skills and the agent file to the latest version. Your vault data and configs are never touched.

## Usage

Run from any directory in your terminal — pick the mode that fits:

```bash
myna          # full access — reads and writes only to your vault
myna-ro       # read-only — browse and query without making changes
myna-x        # no file access — conversation only
```

First time? Try:
- `sync` — set up your day
- `what can you do?` — see all 24 skills
- `brief me on <project>` — get a project status

## What You Get

After running the install script:

- `myna` command available from any directory (plus `myna-ro` and `myna-x` variants)
- Structured Obsidian vault with 10 pre-built dashboards
- 24 skills covering email, meetings, projects, people, and daily workflow
- Config files ready to fill in with your projects and people
- Post-install checklist guiding you through the remaining setup

## Status

**v1.0** — released.

## Built Entirely by Claude Code

Myna was designed, built, reviewed, and fixed entirely by Claude Code — from feature specs through architecture, implementation, and polish. No human wrote a line of code.

[How it was built →](docs/how-it-was-built.md)

## Documentation

| Document | Purpose |
|----------|---------|
| [Guide](docs/guide.md) | Full user guide — how it works, skills reference, config, workflows |
| [A Day With Myna](docs/a-day-with-myna.md) | A realistic workday walkthrough showing how Myna helps Engineering Managers |
| [Architecture](docs/architecture.md) | Runtime model — skills, steering, vault structure, MCP integration |
| [Obsidian Setup](docs/obsidian-setup.md) | Plugin setup, dashboard overview, vault configuration |
| [How It Was Built](docs/how-it-was-built.md) | The Claude Code methodology behind Myna |

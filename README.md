# Myna

**Myna** — a privacy-first AI Chief of Staff powered by Claude Code that works exclusively within your company's approved tools and never acts without your approval.

It reads from your existing tools and writes everything to a local Obsidian vault as plain markdown. No cloud, no new infrastructure, nothing leaves your machine. The more you use it, the more it knows your world — your projects, your people, your preferences.

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

## Quick Example

```
$ myna

> sync
↳ Daily note created, 3 meetings prepped, 2 overdue tasks flagged

> prep for my 1:1 with Sarah
↳ 11-item prep brief written to Meetings/1-1s/sarah-chen.md

> what's blocked?
↳ 2 blockers across auth-migration and platform-api

> draft a reply to Marcus's email about the Q3 roadmap
↳ Draft saved to Inbox/drafts/marcus-q3-roadmap.md
```

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

**Beta** — functional but in active development.

## Built Entirely by Claude Code

Myna was designed, built, reviewed, and fixed entirely by Claude Code — from feature specs through architecture, implementation, and polish. No human wrote a line of code.

[How it was built →](docs/how-it-was-built.md)

## Documentation

| Document | Purpose |
|----------|---------|
| [Guide](docs/guide.md) | Full user guide — how it works, skills reference, config, workflows |
| [Architecture](docs/architecture.md) | Runtime model — skills, steering, vault structure, MCP integration |
| [Obsidian Setup](docs/obsidian-setup.md) | Plugin setup, dashboard overview, vault configuration |
| [How It Was Built](docs/how-it-was-built.md) | The Claude Code methodology behind Myna |

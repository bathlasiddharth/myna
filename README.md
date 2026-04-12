# Myna

A local-first personal assistant for tech professionals. AI agents that watch, organize, and draft — but never act on your behalf.

## What Is Myna?

Myna is a set of AI agent instructions that turn Claude Code into a personal assistant for tech employees. It manages the information layer of your job: emails, Slack messages, meetings, projects, people, and tasks. All instructions are plain markdown — inherently readable by any capable LLM, but designed and tested for Claude Code.

You interact with Myna by typing natural language prompts inside your AI agent. Myna reads from your company's existing MCP-connected tools (email, Slack, calendar) and writes exclusively to your local Obsidian vault.

**Myna drafts but never sends. Organizes but never decides. Surfaces but never hides.**

## Who Is It For?

Engineering managers, tech leads, senior engineers, and PMs who:
- Manage multiple projects, people, and communication channels
- Spend most of their time on information management rather than decision-making
- Want an assistant that handles the tedious parts without risking mistakes
- Work at enterprises with strict privacy/security requirements

## How It Works

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

Myna reads from external sources via your company's existing MCP servers and writes only to a dedicated subfolder in your Obsidian vault. All data stays local as plain markdown.

## What Myna Does

| Domain | Examples |
|--------|----------|
| **Email & Messaging** | Triage inbox, summarize threads, extract action items, draft replies |
| **Meetings & Calendar** | Prep briefs, debrief after meetings, track decisions, block focus time |
| **Projects & Tasks** | Maintain project files, manage tasks, context switching |
| **People Management** | Person files, 1:1 prep, performance narratives, recognition |
| **Daily Workflow** | Morning sync, daily notes, weekly summaries, review queue |
| **Writing & Drafts** | Email drafts, message rewrites, status updates, doc review |
| **Self Tracking** | Contribution logs, brag docs, promo packets, self-reviews |

## What Myna Ships

Myna is **not an application**. There is no server, no API, no frontend.

| Component | What it is |
|-----------|-----------|
| **Vault template** | Obsidian folder structure, file templates, Dataview dashboards |
| **Agent instructions** | Markdown behavior specs the AI model reads on every prompt |
| **Config templates** | `.example` files for projects, people, preferences (gitignored) |
| **Install script** | Shell script that installs Myna as a global Claude Code subagent, copies skills to `~/.claude/skills/`, and creates the vault structure |

## Core Principles

- **Local-first** — All data lives in your Obsidian vault as plain markdown
- **Draft, never send** — Every outbound communication requires your explicit action
- **Human-in-the-loop** — Items requiring judgment go through a review queue
- **Claude-first, not Claude-only** — Built for Claude Code, but all instructions are plain markdown readable by any LLM. Community can add support for other tools.
- **Enterprise-friendly** — No new infrastructure, connects to your company's existing MCP servers
- **Config-driven** — All personal data in gitignored config files; system is shareable as-is

## What Myna Is NOT

- Not an application — it's agent instructions + vault structure + config
- Not a decision maker — it surfaces information; you decide
- Not a sender — it drafts; you send
- Not cloud-dependent — everything is local markdown
- Not new infrastructure — uses your company's existing MCP servers

## Installation

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Claude Code](https://claude.ai/code) CLI installed and authenticated
- [Obsidian](https://obsidian.md/) installed with a vault created

### Quick Start

```bash
git clone https://github.com/bathlasiddharth/myna.git
cd myna
./install.sh --vault-path ~/path/to/your/obsidian/vault
```

The install script will:
1. Copy 24 feature skills + 6 steering skills to `~/.claude/skills/`
2. Generate a Claude Code agent file at `~/.claude/agents/myna.md`
3. Create the Myna folder structure in your Obsidian vault
4. Copy config example files

After install, the cloned repo is no longer needed at runtime — you can delete it or keep it around for updates (`git pull && ./install.sh`).

### Configure

The install script creates starter config files in your vault. Edit them with your details:

```bash
# Required — set your name, email, vault path
$EDITOR ~/path/to/your/obsidian/vault/myna/_system/config/workspace.yaml

# Add your active projects and people
$EDITOR ~/path/to/your/obsidian/vault/myna/_system/config/projects.yaml
$EDITOR ~/path/to/your/obsidian/vault/myna/_system/config/people.yaml
```

Each config file has comments explaining the fields. See the `.example` files alongside them for full documentation with realistic examples.

### (Optional) External MCP Servers

Myna reads from email, Slack, and calendar via MCP servers you provide. Register them with Claude Code:

```bash
claude mcp add gmail-mcp -- <your-gmail-mcp-command>
claude mcp add slack-mcp -- <your-slack-mcp-command>
claude mcp add gcal-mcp -- <your-gcal-mcp-command>
```

Myna works without these — features that need them degrade gracefully.

### Start Using Myna

From any directory:

```bash
claude --agent myna
```

Then type:
- `sync` — set up your day (daily note, meeting preps, priorities)
- `what can you do?` — see all 14 skills
- `capture: <anything>` — log information to your vault
- `brief me on <project>` — get a project status summary

Myna is a global Claude Code subagent — `claude --agent myna` works from any working directory. The cloned repo is not on the runtime path.

### Install Options

```
./install.sh --help              # Full usage
./install.sh --dry-run ...       # Preview without making changes
./install.sh --subfolder name    # Custom subfolder (default: myna)
./install.sh --vault-name Name   # Obsidian vault name for URIs
```

## Status

Phase 2 (Install) is in progress. See the [roadmap](docs/roadmap.md) for current progress.

## Two Goals, Not One

This project has two first-class outputs.

**Primary goal:** Myna itself — a working local-first AI assistant you can install and use.

**Second goal:** figuring out the methodology for having Claude autonomously build an agentic system end-to-end — from feature ideas through foundations, requirements, build, test, and fix — with concentrated human effort upfront and minimal oversight during the main build. The methodology that emerges (pipeline structure, templates, recipes, verification checklists, escalation rules, learning-capture discipline) is captured as it develops and is intended to be reusable for building other agentic assistants on top of Claude or any capable LLM.

Myna is the first artifact. The methodology is the second. Both ship.

The methodology lives across several files as it stabilizes: see [decisions D025–D029](docs/decisions.md) for the pipeline shape and autonomy model, the [roadmap](docs/roadmap.md) for how the phases map to real work, and `docs/design/foundations.md` + `docs/instructions/*` as they are written during the build. A companion article about the process is planned for post-launch.

## Project Documentation

| Document | Purpose |
|----------|---------|
| [Vision](docs/vision.md) | North star — what Myna is, who it's for, core principles |
| [Architecture](docs/architecture.md) | Runtime model — skills, steering, vault structure, MCP integration |
| [Foundations](docs/design/foundations.md) | Data layer — templates, config schemas, file formats, conventions |
| [Decisions](docs/decisions.md) | Settled architectural and design decisions |
| [Open Questions](docs/open-questions.md) | Unresolved questions under discussion |
| [Roadmap](docs/roadmap.md) | Milestones, tasks, and backlog |

## License

TBD

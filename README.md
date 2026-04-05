# Myna

A local-first personal assistant for tech professionals. AI agents that watch, organize, and draft — but never act on your behalf.

## What Is Myna?

Myna is a set of AI agent instructions that turn any capable LLM (Claude, Gemini, Codex, Kiro CLI) into a personal assistant for tech employees. It manages the information layer of your job: emails, Slack messages, meetings, projects, people, and tasks.

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
You (inside Claude Code / Kiro CLI / Gemini / etc.)
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
| **Obsidian CLI MCP** | Lightweight MCP server wrapping Obsidian CLI for vault operations |
| **Config templates** | `.example` files for projects, people, preferences (gitignored) |
| **Setup wizard** | Interactive ~5 min conversation to get you running |

## Core Principles

- **Local-first** — All data lives in your Obsidian vault as plain markdown
- **Draft, never send** — Every outbound communication requires your explicit action
- **Human-in-the-loop** — Items requiring judgment go through a review queue
- **AI model agnostic** — Works with Claude, Gemini, Codex, Kiro CLI, and future models
- **Enterprise-friendly** — No new infrastructure, connects to your company's existing MCP servers
- **Config-driven** — All personal data in gitignored config files; system is shareable as-is

## What Myna Is NOT

- Not an application — it's agent instructions + vault structure + config
- Not a decision maker — it surfaces information; you decide
- Not a sender — it drafts; you send
- Not cloud-dependent — everything is local markdown
- Not new infrastructure — uses your company's existing MCP servers

## Status

Myna is in the **requirements phase**. Vision and core decisions are settled; domain requirements are being refined. See the [roadmap](docs/roadmap.md) for current progress.

### Phases

- **P0 — Interactive prompts.** All features work as natural language prompts. User triggers every action manually.
- **P1 — Automation.** Scheduled/background agents via headless AI agent runs.

## Two Goals, Not One

This project has two first-class outputs.

**Primary goal:** Myna itself — a working local-first AI assistant you can install and use.

**Second goal:** figuring out the methodology for having Claude autonomously build an agentic system end-to-end — from feature ideas through foundations, requirements, build, test, and fix — with concentrated human effort upfront and minimal oversight during the main build. The methodology that emerges (pipeline structure, templates, recipes, verification checklists, escalation rules, learning-capture discipline) is captured as it develops and is intended to be reusable for building other agentic assistants on top of Claude or any capable LLM.

Myna is the first artifact. The methodology is the second. Both ship.

The methodology lives across several files as it stabilizes: see [decisions D025–D029](docs/decisions.md) for the pipeline shape and autonomy model, the [roadmap](docs/roadmap.md) for how the phases map to real work, and `docs/foundations.md` + `docs/instructions/*` as they are written during the build. A companion article about the process is planned for post-launch.

## Project Documentation

| Document | Purpose |
|----------|---------|
| [Vision](docs/vision.md) | North star — what Myna is, who it's for, core principles |
| [Decisions](docs/decisions.md) | Settled architectural and design decisions |
| [Open Questions](docs/open-questions.md) | Unresolved questions under discussion |
| [Roadmap](docs/roadmap.md) | Milestones, tasks, and backlog |
| [Design Deliverables](docs/design-deliverables.md) | Checklist for design phase |

## License

TBD

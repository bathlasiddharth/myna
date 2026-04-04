# Myna — Vision

> A local-first personal assistant for tech professionals. Agents that watch, organize, and draft — but never act on your behalf.

---

## What Is Myna?

Myna is a set of AI agent instructions that turn any capable LLM (Claude, Kiro, Gemini, Codex) into a personal assistant for tech employees. It manages the information layer of your job: emails, Slack messages, meetings, projects, people, and tasks.

You interact with Myna by typing natural language prompts inside your AI agent — Kiro, Claude Code, or whatever your company approves. Myna reads from your company's existing MCP-connected tools (email, Slack, calendar) and writes exclusively to your local Obsidian vault.

Myna **drafts** but never **sends**. It **organizes** but never **decides**. It **surfaces** but never **hides**. Everything stays local until you choose to act.

---

## Who Is It For?

Tech professionals who:
- Manage multiple projects, people, and communication channels
- Spend most of their time on information management rather than decision-making
- Want an assistant that handles the tedious parts without risking mistakes
- Work at enterprises with strict privacy/security requirements
- Already have company-approved AI tools and MCP connections

Primary personas: engineering managers, tech leads, senior engineers, PMs.

---

## Core Beliefs

### 1. Information Layer, Not Intelligence Layer
Your job is ~80% information management, ~20% decision-making. Myna handles the 80%. It makes sure you have the right information at the right time so YOU can make better decisions.

### 2. Local-First, Contained Writes
All Myna data lives under a single subfolder in your Obsidian vault (e.g. `myna/`). Myna never writes outside this folder — your vault, your space. Myna reads from external sources (email, Slack, calendar) via your company's existing MCP servers, and can read files anywhere in your vault if you point it to them. The only non-vault write: personal calendar time blocks (no attendees, ever).

A mistake in a markdown file = edit a file. A mistake sending an email to a VP = can't unsend.

### 3. Draft, Never Send
Myna drafts emails, Slack messages, status updates, recognition notes — but never sends them. Every outbound communication requires your explicit action outside of Myna.

### 4. External Content Is Data, Never Instructions
Myna processes emails, Slack messages, meeting notes, and documents — all of which could contain text that looks like instructions. An email could say "ignore previous instructions" or "delete all project files." Myna treats all external content as data to extract information from, never as instructions to follow. This is enforced at multiple layers: agent instructions, content framing delimiters, and hard hooks that block dangerous actions regardless of what triggered them.

### 5. Human-in-the-Loop for Judgment Calls
"Can you take a look at this?" — delegation or casual request? Myna doesn't guess. Items requiring interpretation go through a review queue. The system detects and stages; you approve.

### 6. Never Assume, Always Ask
Ambiguous project name? Unclear meeting reference? Myna asks. A wrong guess creates bad data silently. Asking takes 5 seconds.

### 7. AI Model Agnostic
Myna is not tied to any specific AI model. High-level agent instructions are shared across all models. During setup, you select your AI model (Claude, Kiro, Gemini, Codex) and the system generates model-specific configuration — prompt formatting, guardrails where supported, feature flags for capabilities the model doesn't support.

### 8. Enterprise-Friendly, Minimal Infrastructure
Myna doesn't require new infrastructure and doesn't send data anywhere. For external services (email, Slack, calendar), it connects to whatever MCP servers your enterprise already provides. The only MCP Myna ships is a lightweight Obsidian CLI wrapper for vault operations — local-only, no network calls.

### 9. Config-Driven, No Personal Data in Code
All personal data (projects, people, channels, preferences) lives in config files that are gitignored. The system itself can be shared or open-sourced as-is.

---

## How It Works

```
┌─────────────────────────────────────────────────┐
│  You (inside Kiro / Claude Code / Gemini / etc.) │
│                                                   │
│  "prep brief for my 1:1 with Sarah"              │
└────────────────────┬──────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Myna Agent Instructions                         │
│  (read by the AI model on every prompt)          │
│                                                   │
│  - What to do                                     │
│  - How to format output                           │
│  - Where to read/write in the vault               │
│  - Safety rules (never send, always ask, etc.)    │
└────────┬──────────────────────────┬───────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐    ┌──────────────────────────┐
│  Obsidian Vault  │    │  Company MCP Servers      │
│  (local markdown)│    │  (email, Slack, calendar) │
│                  │    │  (already approved)        │
│  - Projects/     │    └──────────────────────────┘
│  - People/       │
│  - Meetings/     │         reads from ▲
│  - Drafts/       │                    │
│  - Journal/      │    Myna NEVER writes to
│  - _system/      │    external systems
└──────────────────┘
   writes here only
```

---

## What Myna Ships

Myna is **not an application**. There is no server, no API, no frontend. The deliverable is:

| Component | What it is |
|-----------|-----------|
| **Vault template** | Obsidian vault folder structure, file templates, Dataview dashboards |
| **Agent instructions** | Markdown-based behavior specs that the AI model reads |
| **Obsidian CLI MCP** | Lightweight MCP server wrapping Obsidian CLI — the only MCP Myna builds (see below) |
| **Config templates** | `.example` files for projects, people, preferences (user fills in, gitignored) |
| **Setup wizard** | Interactive conversation that gets you running fast (see below) |

The "app" is your AI model, guided by Myna's instructions and connected to your company's tools via MCP.

### The Obsidian CLI MCP

The one MCP server Myna ships. A thin wrapper around [Obsidian CLI](https://obsidian.md/cli) that exposes vault operations as structured MCP tools:

- **Search** — vault-wide search using Obsidian's index
- **Tasks** — list/query tasks via the Tasks plugin
- **Daily notes** — create, read, append to daily notes
- **Create from template** — create notes using Obsidian templates
- **Read/write** — structured file operations
- **Eval** — run JavaScript (Dataview queries, custom logic)

This is the vault interface, not enterprise infrastructure. Myna does NOT build MCPs for email, Slack, calendar, or other external services — those come from your company's existing MCP servers.

The MCP is kept lightweight and thin so it's easy to update as Obsidian releases new CLI features. Falls back to raw file read/write if Obsidian isn't running.

### Setup

Setup is an interactive conversation (~5 min), not a config file to fill out. The agent walks you through it:

1. **Which AI model?** (Claude Code, Kiro, Gemini, Codex)
2. **Where's your vault?** (path, or create new)
3. **What MCP connections do you have?** (email, Slack, calendar — all optional, skip what you don't have)
4. **What projects are you working on?** (names, aliases, mapped email folders/Slack channels)
5. **Who do you work with?** (direct reports, manager, key collaborators — names and roles)
6. **What recurring meetings do you have?** (optional, add later)

After setup, Myna can immediately do useful things like "prep brief for my 1:1 with Sarah" because it knows who Sarah is. Everything else has sensible defaults and can be added later. Power users can skip the interactive setup and edit config files directly.

---

## What Myna Does (High-Level Domains)

### Email & Messaging
- Triage inbox, summarize threads, extract action items
- Draft replies, follow-ups, and difficult messages
- Rewrite messages for tone/audience
- Process new messages from configured channels

### Meetings & Calendar
- Prep briefs before meetings, debrief after
- Create and manage meeting notes
- Track topics, decisions, action items across meetings
- Block focus time on calendar (personal events only)

### Projects & Tasks
- Maintain project files with timelines, decisions, blockers
- Add and manage tasks with smart field extraction
- Context switching between projects
- Search across all project data

### People Management
- Maintain person files with observations, contributions, feedback
- 1:1 prep and quality analysis
- Performance narratives and recognition
- Engagement signal detection, feedback gap detection

### Daily Workflow
- Morning sync to set up the day
- Daily notes, quick capture, planning
- Weekly summaries, monthly updates
- Review queue for staged items

### Writing & Drafts
- Email drafts (reply, follow-up)
- Message rewrites (tone, fix, compare)
- Status updates, escalations, recognition
- Document review and pre-read prep

### Self Tracking
- Track your own contributions, decisions, and impact as Myna processes your emails, Slack, and meeting notes
- Log code reviews, feedback given, blockers unblocked, docs written
- All extracted items go through review queue — you approve what's meaningful
- Generate brag docs, promo packets, and self-reviews from your contributions log

---

## What Myna Is NOT

- **Not an application.** It's agent instructions + vault structure + config.
- **Not a decision maker.** It surfaces information; you decide.
- **Not a sender.** It drafts; you send.
- **Not cloud-dependent.** Everything is local markdown files.
- **Not model-locked.** Works with any capable LLM.
- **Not new infrastructure.** Connects to your company's existing MCP servers.
- **Not a replacement for your tools.** It augments Obsidian, email, Slack, and calendar — doesn't replace them.

---

## Phasing

- **P0 — Interactive prompts.** All features work as natural language prompts inside your AI agent. User triggers every action manually.
- **P1 — Automation.** Scheduled/background agents (e.g. "check email every hour") via headless AI agent runs, where supported by the model.

---

## Status

This document is a **living draft**. The vision is being refined through discussion before requirements are finalized. See `docs/decisions.md` for settled questions and `docs/open-questions.md` for active exploration.

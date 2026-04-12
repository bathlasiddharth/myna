# Myna — Vision

> A local-first personal assistant for tech professionals. Agents that watch, organize, and draft — but never act on your behalf.

---

## What Is Myna?

Myna is a set of AI agent instructions that turn Claude Code into a personal assistant for tech employees. It manages the information layer of your job: emails, Slack messages, meetings, projects, people, and tasks. All instructions are plain markdown — inherently readable by any capable LLM, but designed and tested for Claude Code.

You interact with Myna by typing natural language prompts inside Claude Code. Myna reads from your company's existing MCP-connected tools (email, Slack, calendar) and writes exclusively to your local Obsidian vault.

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

### 7. Claude-First, Not Claude-Only
Myna v1 targets Claude Code as its runtime. All agent content — behaviors, steering, skills, foundations, templates — is plain markdown and YAML. This makes it inherently readable by any capable LLM. If someone wants to run Myna on Gemini, Codex, or another tool in the future, they can read the markdown files and write their own wiring — that's a community contribution, not something we architect for upfront. See D045 and D046 for rationale.

### 8. Enterprise-Friendly, Minimal Infrastructure
Myna doesn't require new infrastructure and doesn't send data anywhere. For external services (email, Slack, calendar), it connects to whatever MCP servers your enterprise already provides. Myna itself ships no MCP servers — vault operations use Claude Code's built-in file tools (Read, Write, Edit, Grep, Glob).

### 9. Config-Driven, No Personal Data in Code
All personal data (projects, people, channels, preferences) lives in config files that are gitignored. The system itself can be shared or open-sourced as-is.

---

## How It Works

```
┌─────────────────────────────────────────────────┐
│  You (inside Claude Code)                            │
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
| **Vault operations skill** | Steering skill that teaches Claude Code vault patterns (task queries, templates, paths) using built-in tools |
| **Config templates** | `.example` files for projects, people, preferences (user fills in, gitignored) |
| **Setup wizard** | Interactive conversation that gets you running fast (see below) |

The "app" is your AI model, guided by Myna's instructions and connected to your company's tools via MCP.

### Vault Operations

Myna does NOT ship any MCP servers. All vault operations — reading files, writing entries, searching content, finding files — use Claude Code's built-in tools (Read, Write, Edit, Grep, Glob). A steering skill (`myna-steering-vault-ops`) teaches Claude the vault patterns: task query syntax, frontmatter parsing, template creation, daily note paths, backlink/tag searches.

Myna does NOT build MCPs for email, Slack, calendar, or other external services — those come from your company's existing MCP servers.

### Setup

Setup is an interactive conversation (~5 min), not a config file to fill out. The agent walks you through it:

1. **Where's your vault?** (path, or create new)
2. **What MCP connections do you have?** (email, Slack, calendar — all optional, skip what you don't have)
3. **What projects are you working on?** (names, aliases, mapped email folders/Slack channels)
4. **Who do you work with?** (direct reports, manager, key collaborators — names and roles)
5. **What recurring meetings do you have?** (optional, add later)

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
- **Not model-locked.** Built for Claude Code, but all instructions are plain markdown readable by any LLM.
- **Not new infrastructure.** Connects to your company's existing MCP servers.
- **Not a replacement for your tools.** It augments Obsidian, email, Slack, and calendar — doesn't replace them.

---

## Phasing

- **P0 — Interactive prompts.** All features work as natural language prompts inside your AI agent. User triggers every action manually.
- **P1 — Automation.** Scheduled/background agents (e.g. "check email every hour") via headless AI agent runs, where supported by the model.

---

## Status

Phase 1 (Build) complete. Ready for Phase 2 (Install) targeting Claude Code. See `docs/decisions.md` for settled questions and `docs/roadmap.md` for current progress.

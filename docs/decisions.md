# Decisions Log

Settled decisions that all threads should respect. Newest first.

---

## Format

Each entry:
```
### [DXXX] Short title
**Date:** YYYY-MM-DD
**Context:** Why this came up
**Decision:** What was decided
**Alternatives rejected:** What else was considered and why not
```

---

### D012 — Clean folder structure, agent internals under _system
**Date:** 2026-04-02
**Context:** The `myna/` folder should feel like the user's workspace, not an agent's dump. Config, templates, dashboards, logs, and other Myna plumbing shouldn't clutter the top-level.
**Decision:** Top-level folders under `myna/` are only things the user interacts with (Projects, People, Meetings, Drafts, Journal, Tasks, ReviewQueue, etc.). All Myna internals — config, agent instructions, templates, dashboards, error logs — live under `myna/_system/`. Exact folder structure to be finalized in design.
**Alternatives rejected:** Flat structure with everything at top level (cluttered), dotfiles for internals (hidden by default in Obsidian, harder to find when needed).

### D011 — Myna writes only under a dedicated subfolder in the vault
**Date:** 2026-04-02
**Context:** Myna shouldn't scatter files across the user's vault. Users have their own notes, folders, and structure. Myna needs to stay contained.
**Decision:** All Myna-managed files live under a single subfolder in the user's vault (e.g. `myna/`). Myna never writes outside this folder. Myna CAN read files anywhere in the vault if the user points it to them (e.g. "summarize this doc"). The subfolder name is configurable during setup.
**Alternatives rejected:** Myna owns the whole vault (pollutes user's space), separate vault entirely (loses Obsidian integration — user can't see Myna files alongside their own notes).

### D010 — Folder-based project mapping + batch triage for inbox
**Date:** 2026-04-02
**Context:** Myna's "never assume" principle means it can't guess which project an email belongs to. But making the user sort 100 emails one-by-one is too much friction.
**Decision:** Two-part approach: (1) Users configure explicit folder/channel → project mappings in config. Myna reads from those mapped folders and knows exactly which project each item belongs to — zero ambiguity. (2) For unmapped items (inbox), Myna does batch triage — reads all items, presents a grouped sorting suggestion ("here's how I'd sort these 100 emails by project"), and the user approves/edits/rejects the batch. Nothing moves or gets processed without user approval. User can also review one-by-one if they prefer.
**Alternatives rejected:** AI auto-classification (90% accuracy means 10 wrong out of 100 — unacceptable), user sorts manually one-by-one (too slow), no inbox scanning (loses value).

### D009 — Interactive minimal setup, config file as fallback
**Date:** 2026-04-02
**Context:** Users need to provide MCP names, AI model, vault path, and other config. A big config file upfront creates friction and discourages adoption. But power users may prefer editing files directly.
**Decision:** Setup is an interactive conversation (~5 min). It covers: (1) AI model, vault path, MCP connections, (2) projects — names, aliases, mapped email folders/Slack channels, (3) people — direct reports, manager, key collaborators with roles, (4) recurring meetings (optional). Everything else has sensible defaults and can be added later. Config is written to files that the user can hand-edit. Power users can skip the interactive setup and edit config files directly.
**Alternatives rejected:** Config file only (too much friction), long interview-style setup (discourages adoption), no config at all (can't work without knowing MCP names), too minimal setup that delays value (user can't do anything useful without projects and people).

### D001 — Obsidian as the vault UI
**Date:** 2026-03-31
**Context:** Needed a local-first tool to manage markdown files with dynamic queries.
**Decision:** Use Obsidian with Dataview and Tasks plugins as the primary interface for vault files.
**Alternatives rejected:** VS Code (no rich query support), custom UI (too much build overhead), Notion (not local-first).

### D002 — AI model agnostic
**Date:** 2026-03-31
**Context:** Don't want vendor lock-in. Want to use whichever model is best for each task.
**Decision:** Myna must work with Claude, Gemini, Codex, Kiro, and any future capable model. Agent definitions are a protocol, not tied to a specific provider.
**Alternatives rejected:** Claude-only (limits flexibility).

### D003 — Draft only, never send
**Date:** 2026-03-31
**Context:** Risk of AI sending wrong message to wrong person is too high.
**Decision:** Myna drafts all outbound communications but never sends them. Only exception is personal calendar events (no attendees).
**Alternatives rejected:** Auto-send with confirmation (still too risky — one wrong click).

### D008 — Ship a lightweight Obsidian CLI MCP server
**Date:** 2026-04-02
**Context:** Obsidian released a CLI (obsidian.md/cli) that exposes vault operations — search, tasks, daily notes, template creation, eval. Agents need structured access to these capabilities. Wrapping them as MCP tools makes agent instructions simpler and model-agnostic.
**Decision:** Myna ships one MCP server: a thin wrapper around Obsidian CLI. It exposes vault operations (search, tasks, daily notes, create from template, etc.) as MCP tools. This is the only MCP Myna builds — it's the vault interface, not enterprise infrastructure. Keep it lightweight so it's easy to update as Obsidian releases new CLI features. Falls back to raw file read/write if Obsidian isn't running.
**Alternatives rejected:** Raw file read/write only (loses Obsidian's search index, task parsing, template rendering), agents calling CLI directly via shell (ad-hoc, each model needs different shell syntax), no MCP at all (less portable across AI models).

### D005 — No custom MCP servers for external services
**Date:** 2026-04-02
**Context:** Enterprise environments already have company-approved MCP servers for email, Slack, calendar. Building custom ones adds infrastructure, security review overhead, and data pipeline risk.
**Decision:** Myna does not build MCP servers for email, Slack, calendar, or other external services. It connects to whatever MCP servers the enterprise already provides. Setup asks users to configure their existing MCP connections. (Exception: Myna ships its own Obsidian CLI MCP — see D008.)
**Alternatives rejected:** Custom MCP servers for external services (unnecessary, blocks enterprise adoption), bundled open-source servers (still requires security review).

### D006 — Prompt-based interaction, not CLI tool
**Date:** 2026-04-02
**Context:** Users interact with Myna through natural language prompts inside their AI agent (Kiro, Claude Code, etc.), not through a custom CLI binary.
**Decision:** Myna's "interface" is natural language prompts typed into whatever AI agent the user has. The deliverable is agent instructions + vault structure + config, not an application.
**Alternatives rejected:** Custom CLI tool (unnecessary layer, adds build/install complexity), VS Code extension (vendor-specific).

### D007 — Model-agnostic via common instructions + setup-time adaptation
**Date:** 2026-04-02
**Context:** Need to support Claude, Kiro, Gemini, Codex, etc. without maintaining separate codebases.
**Decision:** High-level agent instructions are shared across all models. During setup, user selects their AI model and the system generates model-specific configuration (prompt formatting, guardrails where supported, feature flags for unsupported capabilities). Common layer: vault structure, behavior specs, config files. Model-specific layer: prompt format, guardrails, feature availability.
**Alternatives rejected:** Fully identical prompts across models (models have different capabilities), separate implementations per model (maintenance nightmare).

### D004 — Review queue for judgment calls
**Date:** 2026-03-31
**Context:** AI can't reliably distinguish delegation from casual request, or genuine recognition from politeness.
**Decision:** Items requiring interpretation (action items, delegations, decisions, recognition) always go through a review queue before being written to their final destination.
**Alternatives rejected:** Fully automated extraction (too many false positives create bad data).

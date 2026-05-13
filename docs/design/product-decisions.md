# Product Decisions

Product and behavior decisions. For runtime and install decisions, see architecture-decisions.md.

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

### D043 — Feature toggles removed — always-on skill set
**Date:** 2026-05-10
**Context:** The original design (D020) required every feature to have a toggle in workspace.yaml and every skill to check `features.*` before running. In practice, this added setup overhead (users needed to understand a 27-item feature matrix before using Myna) without practical benefit — the skills already degrade gracefully when data is absent.
**Decision:** Remove the `features:` block from workspace.yaml and all `features.*` checks from skills. Myna ships a complete, always-on skill set. Explicit invocation controls what runs; data-driven degradation handles empty states — no direct reports means people-management sections stay empty; MCP unavailable means the skill skips with a note; no data logged means sections show "None logged." The simpler model: if you don't want a feature, don't invoke it. Supersedes D020.
**Alternatives rejected:** Keep toggles with fewer items (still adds setup friction), keep toggles as opt-in only (partial mitigation — still requires a feature matrix to be documented and understood).

### D042 — Config files are YAML, not markdown
**Date:** 2026-04-05
**Context:** The original design had config files as markdown (workspace.md, registry.md, etc.). During Phase 0, the user specified that config files should be YAML for cleaner machine parsing. Six files: workspace.yaml, projects.yaml, people.yaml, meetings.yaml, communication-style.yaml, tags.yaml.
**Decision:** All Myna config files use YAML format, stored under `_system/config/`. The previous naming (workspace.md, registry.md, tags.md) is superseded. The six config files are: workspace.yaml (user identity, preferences, and system settings), projects.yaml (projects, aliases, source mappings, triage folders), people.yaml (people, relationship tiers, aliases), meetings.yaml (optional meeting type overrides), communication-style.yaml (writing style presets per audience tier), tags.yaml (auto-tagging rules). All are gitignored.
**Alternatives rejected:** Keep markdown config (harder to parse reliably, mixes content and structure). JSON config (less human-readable than YAML, harder to hand-edit).

### D024 — Review queue reserved for genuinely ambiguous items only
**Date:** 2026-04-03
**Context:** With provenance markers handling most writes, the review queue's role changed. The original D004 sent all judgment calls to the review queue. But if the queue is full of obvious items, users rubber-stamp everything — and then genuinely ambiguous items get rubber-stamped too.
**Decision:** The review queue is a precision tool, not a default routing step. Only genuinely ambiguous items go to the queue — when the agent can't determine the project, can't tell who owns an action item, or sees conflicting signals. The test: could the user reasonably disagree with the agent's interpretation? If yes → queue. If the answer is obvious but unstated → `[Inferred]` tag. Refines D004.
**Alternatives rejected:** Queue everything (user ignores it), queue nothing (bad inferences go unchecked).

### D023 — Multi-destination routing for all processing
**Date:** 2026-04-03
**Context:** A single email, Slack message, meeting note, or quick capture can contain information relevant to multiple destinations — a project timeline update, a person observation, and a self-tracking contribution all in one message.
**Decision:** Every processing feature (email, messaging, meetings, documents, quick capture) decomposes inputs and creates a separate entry for each relevant destination. Nothing is silently dropped because the agent tried to pick "the best" place. Each entry gets its own provenance marker. Applies system-wide.
**Alternatives rejected:** Pick the "primary" destination (loses information), ask the user to route each item (too much friction).

### D022 — Meetings sourced from calendar, no separate registry
**Date:** 2026-04-03
**Context:** The original design had meetings in the config registry. But the calendar already has all meeting data — attendees, time, recurrence. Duplicating it in a registry is maintenance overhead that goes stale.
**Decision:** Meetings read from calendar MCP. Meeting type inferred from multiple signals: attendee count, event title, attendee composition, recurrence, project name matching. Agent asks on first encounter when unsure, remembers the answer as an optional override in registry. No meeting registry required for basic operation.
**Alternatives rejected:** Full meeting registry (maintenance overhead, goes stale), calendar only with no inference (can't adapt prep/debrief by meeting type).

### D021 — Provenance markers on all vault entries
**Date:** 2026-04-03
**Context:** With the review queue no longer the default routing, the system needs a way to track the origin and confidence of every entry so users can trust what they're reading and spot-check when needed.
**Decision:** Four provenance markers on every agent-written entry: `[User]` (user typed it), `[Auto]` (agent extracted, all data explicit from source), `[Inferred]` (agent extracted, some fields guessed — flagged for optional verification), `[Verified]` (user confirmed an Auto or Inferred entry). Tags appear at end of line with compact source reference for readability. Features that compile data (narratives, briefings) highlight `[Inferred]` entries. Supersedes the two-path pattern from D017 — D017's principle (user-typed vs agent-extracted) is preserved but the routing is now four paths, not two.
**Alternatives rejected:** No tags (can't tell what to trust), only two paths like D017 (too many items in review queue), confidence scores (model-specific, not meaningful across AI providers per D002).

### D020 — Feature toggles are a P0 system-wide requirement
**Date:** 2026-04-03
**Context:** Myna has 50+ features across 10 domains. New users would be overwhelmed seeing everything at once. Need a way to enable/disable features so users can start small and expand.
**Decision:** Every feature has a toggle in workspace.md config (enabled/disabled). Every agent instruction and steering file checks the toggle before offering or executing a feature. Baked into P0 — all agent instructions are toggle-aware from the start. Retrofitting toggle checks into existing instructions is painful and error-prone. Default on/off per feature to be decided during design. Disabled features are silently skipped — the agent doesn't mention them.
**Alternatives rejected:** Progressive unlock tiers (adds complexity for marginal benefit), no toggles and rely on natural discovery (still overwhelming when user asks "what can you do?"), build toggles later as a backlog item (retrofitting is painful).

### D019 — Email folder moves allowed for deduplication
**Date:** 2026-04-03
**Context:** Email processing needs to avoid reprocessing the same email on the next run. Options: fingerprint tracking file (complex, needs cleanup) or move processed emails to a `Processed/` subfolder within each project folder (simple, self-maintaining). Moving emails is a write to the email system, which the vision previously only allowed for calendar events.
**Decision:** Myna may move emails between the user's own folders — specifically, moving processed emails to a `Processed/` subfolder that mirrors the project folder structure. This is the only email write Myna performs. It's organizing the user's mailbox, not acting on their behalf — reversible, low risk, invisible to others. Vision updated: external writes are personal calendar events (D003) and email folder moves for dedup. If the email MCP doesn't support moves, fall back to fingerprint-based tracking in `_system/logs/`.
**Alternatives rejected:** Fingerprint tracking only (complex, tracking file grows, needs periodic cleanup), rely on MCP features like message IDs or read status (can't assume MCP capabilities per D005), do nothing and accept duplicates (creates noise in review queue).

### D018 — Facts not judgments: never infer about people's internal states
**Date:** 2026-04-03
**Context:** Engagement Signal Detection was proposed to scan for signs a team member "may be disengaged." But Myna only has the user's notes — not objective data. "Fewer 1:1 topics" could mean the relationship is healthy. A wrong inference about a person primes confirmation bias and can become self-fulfilling. Same problem with inferring stakeholder "positions" or judging 1:1 "health."
**Decision:** Myna shows factual data points (dates, counts, sourced quotes) but never subjective labels or inferences about people's internal states. No "disengaged", "frustrated", "opposed", "supportive." Engagement Signal Detection replaced with Attention Gap Detection (surfaces gaps in YOUR behavior, not interpretations of theirs). 1:1 analysis shows follow-through rates and carry-forward counts, not "relationship health." Stakeholder briefings show factual mentions, not inferred positions. When in doubt about whether something is a fact or an inference: if removing the source data would make the claim unverifiable, it's an inference — don't show it.
**Alternatives rejected:** Keep engagement detection with caveats/disclaimers (disclaimers don't prevent confirmation bias), show inferences with low-confidence markers (users anchor on the inference regardless of confidence level), remove people-insight features entirely (factual versions are genuinely useful).

### D017 — User-typed observations are direct write, agent-extracted go through review queue
**Date:** 2026-04-03
**Context:** D004 says all judgment calls go through review queue. But when the user explicitly types an observation ("observation about Sarah: great escalation handling"), they've already made the judgment — no need to approve their own words. However, when Myna extracts observations from meeting notes or emails, it might misinterpret.
**Decision:** Two paths for observations: (1) user explicitly types it → direct write to person file, no review queue. (2) Myna extracts it from meeting notes, email, or Slack → review queue before writing. Same principle applies to contributions in self-tracking.
**Alternatives rejected:** All observations through review queue (unnecessary friction for explicit user input), all observations direct write (risky for agent-extracted ones).

### D016 — BLUF as default for all professional writing
**Date:** 2026-04-03
**Context:** Emails and messages need a consistent structure. BLUF (Bottom Line Up Front) leads with the answer/ask, then provides context. Widely used in tech and military communication.
**Decision:** All professional writing (emails, Slack messages, status updates) uses BLUF structure by default in tone and rewrite modes. Fix mode (grammar only) does not restructure.
**Alternatives rejected:** No default structure (inconsistent output), recipient-specific structure (too complex for first version).

### D015 — Source provenance on all direct timeline writes
**Date:** 2026-04-03
**Context:** When Myna writes directly to project timelines (from email or messaging processing), the user needs to trace back to the original source.
**Decision:** All direct timeline writes include full source provenance: original text (verbatim), sender, and date/timestamp. This applies to any automated write that bypasses the review queue.
**Alternatives rejected:** Summary only (loses traceability), link to source only (source may move or be deleted).

### D014 — Decisions logged as timeline entries, no separate decision log
**Date:** 2026-04-03
**Context:** Decisions need to be recorded but a separate decision log creates another file to maintain and check.
**Decision:** Decisions are logged as timeline entries in the relevant project file with a `Decision` category tag. No separate decision log file. Decisions are discoverable via Dataview queries filtering by category.
**Alternatives rejected:** Separate decision log (one more file to maintain, decisions lose project context).

### D013 — Task ownership is expressed via person:: field, not a delegation type
**Date:** 2026-04-03 (updated 2026-05-10)
**Context:** Need to track tasks delegated to others. Could be a separate tracker file, a dedicated type, or a field on regular tasks.
**Decision:** Task ownership is carried by `[person:: [[Name]]]` on a `[type:: task]` item. No `delegation` type. Tasks live in the same task files regardless of who owns them. Surfaced via queries filtering by `[person::]`. No separate delegation tracker file.
**Alternatives rejected:** Separate delegation tracker (duplicates task data, two places to update); delegation type (redundant with person field — ownership is already expressed by who the task is assigned to).

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

### D008 — Ship a lightweight Myna Obsidian MCP server
**Date:** 2026-04-02
**Context:** Obsidian released a CLI (obsidian.md/cli) that exposes vault operations — search, tasks, daily notes, template creation, eval. Agents need structured access to these capabilities. Wrapping them as MCP tools makes agent instructions simpler and model-agnostic.
**Decision:** Myna ships one MCP server: a thin wrapper around Obsidian CLI. It exposes vault operations (search, tasks, daily notes, create from template, etc.) as MCP tools. This is the only MCP Myna builds — it's the vault interface, not enterprise infrastructure. Keep it lightweight so it's easy to update as Obsidian releases new CLI features. Falls back to raw file read/write if Obsidian isn't running.
**Alternatives rejected:** Raw file read/write only (loses Obsidian's search index, task parsing, template rendering), agents calling CLI directly via shell (ad-hoc, each model needs different shell syntax), no MCP at all (less portable across AI models).

### D007 — Model-agnostic via common instructions + setup-time adaptation
**Date:** 2026-04-02
**Context:** Need to support Claude, Kiro CLI, Gemini, Codex, etc. without maintaining separate codebases.
**Decision:** High-level agent instructions are shared across all models. During setup, user selects their AI model and the system generates model-specific configuration (prompt formatting, guardrails where supported, feature flags for unsupported capabilities). Common layer: vault structure, behavior specs, config files. Model-specific layer: prompt format, guardrails, feature availability.
**Alternatives rejected:** Fully identical prompts across models (models have different capabilities), separate implementations per model (maintenance nightmare).

### D006 — Prompt-based interaction, not CLI tool
**Date:** 2026-04-02
**Context:** Users interact with Myna through natural language prompts inside their AI agent (Kiro CLI, Claude Code, etc.), not through a custom CLI binary.
**Decision:** Myna's "interface" is natural language prompts typed into whatever AI agent the user has. The deliverable is agent instructions + vault structure + config, not an application.
**Alternatives rejected:** Custom CLI tool (unnecessary layer, adds build/install complexity), VS Code extension (vendor-specific).

### D005 — No custom MCP servers for external services
**Date:** 2026-04-02
**Context:** Enterprise environments already have company-approved MCP servers for email, Slack, calendar. Building custom ones adds infrastructure, security review overhead, and data pipeline risk.
**Decision:** Myna does not build MCP servers for email, Slack, calendar, or other external services. It connects to whatever MCP servers the enterprise already provides. Setup asks users to configure their existing MCP connections. (Exception: Myna ships its own Myna Obsidian MCP — see D008.)
**Alternatives rejected:** Custom MCP servers for external services (unnecessary, blocks enterprise adoption), bundled open-source servers (still requires security review).

### D004 — Review queue for judgment calls
**Date:** 2026-03-31
**Context:** AI can't reliably distinguish delegation from casual request, or genuine recognition from politeness.
**Decision:** Items requiring interpretation (action items, delegations, decisions, recognition) always go through a review queue before being written to their final destination.
**Alternatives rejected:** Fully automated extraction (too many false positives create bad data).

### D003 — Draft only, never send + three-layer calendar protection
**Date:** 2026-03-31 (updated 2026-04-03)
**Context:** Risk of AI sending wrong message to wrong person is too high. Calendar writes need extra protection since they're the one external write Myna does.
**Decision:** Myna drafts all outbound communications but never sends them. Only exception is personal calendar events (no attendees). Calendar writes use three-layer protection where supported by the AI model: (1) agent instruction rule — never add attendees, always use configured prefix, (2) pre-tool check — rejects any call with attendees or missing prefix, (3) explicit confirmation — agent shows all parameters before creating. If the AI model doesn't support guardrails/hooks (layers 1-2), rely on the instruction rule and explicit confirmation only.
**Alternatives rejected:** Auto-send with confirmation (still too risky — one wrong click), no calendar writes at all (loses useful time-blocking capability).

### D002 — AI model agnostic
**Date:** 2026-03-31
**Context:** Don't want vendor lock-in. Want to use whichever model is best for each task.
**Decision:** Myna must work with Claude, Gemini, Codex, Kiro CLI, and any future capable model. Agent definitions are a protocol, not tied to a specific provider.
**Alternatives rejected:** Claude-only (limits flexibility).

### D001 — Obsidian as the vault UI
**Date:** 2026-03-31
**Context:** Needed a local-first tool to manage markdown files with dynamic queries.
**Decision:** Use Obsidian with Dataview and Tasks plugins as the primary interface for vault files.
**Alternatives rejected:** VS Code (no rich query support), custom UI (too much build overhead), Notion (not local-first).

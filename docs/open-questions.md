# Open Questions

Questions that surfaced during exploration but aren't resolved yet. Any thread can add questions here. Resolved questions move to `docs/decisions.md`.

---

## Format

Each entry:
```
### [QXXX] Short question
**Raised:** YYYY-MM-DD
**Context:** Why this matters
**Options considered:** (if any)
**Status:** Open | Discussed | Resolved → DXXX
```

---

### Q001 — How should model-agnostic agent definitions work?
**Raised:** 2026-03-31
**Context:** Myna must work with multiple AI providers. Need a way to define agent behavior that isn't tied to a specific model's system prompt format.
**Options considered:** MCP-based tool definitions, shared markdown prompts, provider adapter layer
**Status:** Open

### Q002 — What's the right MCP server architecture?
**Raised:** 2026-03-31
**Context:** Need MCP servers for email, Slack/messaging, and calendar. Should these be custom-built, use existing open-source servers, or both?
**Options considered:** Custom MCP servers, existing community servers, hybrid approach
**Status:** Resolved → D005 (Myna doesn't build MCPs; connects to enterprise-provided ones)

### Q003 — Should there be a Phase 0 (MVP) before Phase 1?
**Raised:** 2026-03-31
**Context:** Phase 1 has 40 features. Might be better to ship a tiny subset first to validate the approach.
**Options considered:** Full Phase 1, stripped Phase 0 with 5-10 features, iterative delivery within Phase 1
**Status:** Open

### Q004 — How should the review queue UX work across AI clients?
**Raised:** 2026-03-31
**Context:** The review queue is central to the system but the interaction model (present item → approve/edit/skip/discard) depends on the AI client being used. Need it to work in Claude Code, Kiro, etc.
**Options considered:** Markdown-based queue files that any client can read/write, client-specific adapters
**Status:** Open

### Q005 — What's the vault folder structure?
**Raised:** 2026-03-31
**Context:** The existing requirements reference specific paths (Projects/, People/, etc.) but the full structure needs to be designed.
**Options considered:** Flat, nested by domain, nested by date
**Status:** Open

### Q006 — Local web UI needed?
**Raised:** 2026-04-02
**Context:** Obsidian handles ~90% of viewing/interaction needs. Review queue and draft management might be clunky as pure markdown editing. A local website (no server, no data leaving machine) could help.
**Options considered:** Obsidian-only (current plan), local web UI for specific workflows, Obsidian plugin
**Status:** Parked — build with Obsidian + prompts first, revisit if friction emerges

### Q007 — Project name
**Raised:** 2026-04-02
**Context:** "Myna" is the working name. Not sold on it yet. Easy to change later — name only exists in markdown docs, no code/packages/URLs yet.
**Options considered:** TBD
**Status:** Open — using "Myna" as working name, rename anytime before first public release

### Q008 — Scan-and-suggest setup mode
**Raised:** 2026-04-02
**Context:** After basic setup, Myna could scan email folders and Slack channels to suggest additional project mappings automatically — the batch triage pattern applied to setup itself. More magical, but depends on MCP access being configured first.
**Options considered:** Post-setup prompt like "want me to scan your folders and suggest project mappings?"
**Status:** Backlog — build manual setup first (D009), add this as an enhancement later

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
**Status:** Resolved → D007 (common instructions + setup-time adaptation per model)

### Q002 — What's the right MCP server architecture?
**Raised:** 2026-03-31
**Context:** Need MCP servers for email, Slack/messaging, and calendar. Should these be custom-built, use existing open-source servers, or both?
**Options considered:** Custom MCP servers, existing community servers, hybrid approach
**Status:** Resolved → D005 (Myna doesn't build MCPs; connects to enterprise-provided ones)

### Q003 — Should there be a Phase 0 (MVP) before Phase 1?
**Raised:** 2026-03-31
**Context:** Phase 1 has 40 features. Might be better to ship a tiny subset first to validate the approach.
**Options considered:** Full Phase 1, stripped Phase 0 with 5-10 features, iterative delivery within Phase 1
**Status:** Resolved → D034 (all approved features in v1, no subset).

### Q004 — How should the review queue UX work?
**Raised:** 2026-03-31
**Context:** The review queue is central to the system but the interaction model (present item → approve/edit/skip/discard) needs a clean UX.
**Options considered:** Markdown-based queue files, client-specific adapters
**Status:** Resolved — markdown files with checkbox-based approve/reject flow. Four queue files (`review-work`, `review-people`, `review-self`, `review-triage`) that Claude Code can read, edit, and process. User can also edit directly in Obsidian.

### Q005 — What's the vault folder structure?
**Raised:** 2026-03-31
**Context:** The existing requirements reference specific paths (Projects/, People/, etc.) but the full structure needs to be designed.
**Options considered:** Flat, nested by domain, nested by date
**Status:** Moved to design phase — this is a design deliverable, not an open question. Tracked in roadmap under M2.

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

### Q009 — Where does the contributions log live in the vault?
**Raised:** 2026-04-03
**Context:** Self-tracking needs a home for the user's contributions log. Current placeholder is `myna/Journal/contributions.md` but the vault folder structure (Q005) isn't finalized. Contributions are personal to the user (not about a project or person), so they don't fit neatly under Projects/ or People/.
**Options considered:** `myna/Journal/contributions.md` (dedicated journal area), `myna/Self/contributions.md` (new Self folder), section in daily/weekly notes (fragmented, hard to query), `myna/Tasks/contributions.md` (contributions aren't tasks)
**Status:** Moved to design phase — resolved as part of vault folder structure (Q005).

### Q010 — Unreplied & follow-up tracker: dedicated file or Dataview query?
**Raised:** 2026-04-03
**Context:** The unreplied tracker (messages waiting on you, messages you're waiting on) is populated as a byproduct of email/messaging processing. It could be a dedicated file that processing updates, or a Dataview query over processed data (if emails/messages get metadata tags like `status:: awaiting-reply`).
**Options considered:** Dedicated tracker file (simpler to query, but another file to maintain), Dataview query over tagged message data (no extra file, but requires message metadata design), hybrid (tracker file auto-populated by processing, cleaned up periodically)
**Status:** Resolved — TODOs with `type:: reply-needed`, queryable via Dataview. No separate file. Populated during email/messaging processing and triage. See email-and-messaging features.

### Q011 — HTML dashboard: P0 or deferred?
**Raised:** 2026-04-03
**Context:** The Unified Dashboard has an optional HTML export for mobile/browser viewing without Obsidian. This adds build complexity (HTML generation, Obsidian URI links, styling) for a convenience feature. Obsidian mobile app may cover this need.
**Options considered:** P0 (useful for quick mobile checks), deferred (Obsidian mobile covers most needs, build it only if friction emerges)
**Status:** Resolved — deferred. Stick to Obsidian for P0. Revisit only if Obsidian doesn't support something or the UX is too complex.

### Q013 — Sentinel subagent architecture: single vs. per-domain, and what to gate
**Raised:** 2026-04-04
**Context:** Risky writes (calendar creates, email folder moves, vault deletes) should be executed through a sentinel subagent that has no prior context and never sees raw untrusted content — this implements vision Core Belief #4 and blocks prompt injection by ensuring the tool-credential holder never reads attacker-controlled text. The sentinel's job is deterministic policy enforcement (schema, allowlist, rate limits, confirmation gates), not semantic re-judgment. But two design questions remain: (1) single sentinel fronting all tool access vs. per-domain sentinels, and (2) which actions actually need the sentinel vs. which can rely on inline deterministic policy. Subagent spawning has latency cost that hurts interactive prompts, so gating everything isn't free.
**Options considered:**
- Single sentinel for all tool access — tight choke point, simpler audit, but bigger blast radius if compromised and one bottleneck for all writes
- Per-domain sentinels (calendar, email, vault) — narrower scopes, parallelizable, but more components to build and maintain
- Hybrid: sentinel only for high-blast-radius actions (calendar, email moves, cascading task changes), inline deterministic policy for low-risk contained writes (vault markdown under myna/)
**Status:** Resolved for v1 — no sentinel subagent (D039). All processing runs through skills in the main agent. Hook-based enforcement (where the AI tool supports it) provides tool-level safety. Full sentinel architecture is a post-v1 consideration.

### Q014 — Triage double-review: should triage-approved vault updates skip the second queue?
**Raised:** 2026-04-05
**Context:** The current triage flow has two review stages: (1) user approves items in review-triage.md, (2) approved vault updates route to review-work/review-people/review-self for a second review. This means the user approves the same item twice. The second stage adds safety (the item is re-evaluated in the context of the destination queue) but adds friction. An alternative: triage-approved vault updates write directly to the vault with [Verified] tag, skipping the second queue.
**Options considered:** Current two-stage flow (safer, more friction), single-stage with direct write (faster, slight risk of bad routing), configurable per user
**Status:** Open — use current two-stage flow for v1. Revisit post-launch based on whether users find the double-review burdensome.

### Q012 — Tag registry: fourth config file or section in registry.md?
**Raised:** 2026-04-03
**Context:** Auto-tagging (cross-domain feature) needs a tag registry that defines available tags and their mapping rules (folder-based, keyword-based, person/project-based). This could be a section in the existing `registry.md` config or a separate fourth config file.
**Options considered:** Section in `registry.md` (keeps config to three files per original design, but registry.md may get large), separate `tags.md` config (clean separation, but a fourth config file adds setup friction), derived from existing registry entries (no explicit tag registry — tags inferred from project/person names, but less control)
**Status:** Resolved → D042. Tags is a separate YAML config file (tags.yaml). Six config files total: workspace.yaml, projects.yaml, people.yaml, meetings.yaml, communication-style.yaml, tags.yaml.

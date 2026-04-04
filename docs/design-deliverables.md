# Design Deliverables

What the design phase must produce before build starts. Claude should not begin implementation until all items here are complete and approved.

---

## Vault Structure
- [ ] Complete folder tree under `myna/` (every path, every file)
- [ ] Template content for every file type (daily note, project, person, meeting, etc.)
- [ ] Dashboard files with Dataview queries
- [ ] Review queue file format and structure

## Config System
- [ ] Schema for each config file (workspace, registry, communication style, tags)
- [ ] `.example` content for each config file
- [ ] Config validation rules (what's required vs optional, defaults)
- [ ] How config maps MCP connection names to domains
- [ ] Feature toggle list — every feature with its toggle name and default on/off (D020)
- [ ] How agent instructions check toggles — the pattern every instruction file must follow

## Agent Instructions
- [ ] Architecture for how agent instructions are structured (single file? per-domain? per-feature?)
- [ ] Common instruction layer (shared across all AI models)
- [ ] Model-specific adaptation layer (how setup generates model-specific config)
- [ ] How agent instructions reference MCP tools and vault paths
- [ ] **Feature simplification pass:** identify features that are really just "LLM + vault access + config" and collapse them into agent instructions rather than separate feature implementations. Writing/output features (rewriting, Help Me Say No, conversation prep, doc review, pre-read, thread summary, briefings, recognition drafts) are candidates — they don't need pipeline code, just a well-written agent instruction with access to the right files. The detailed specs should focus on plumbing (processing pipelines, review queue, dedup, meeting lifecycle, task management), not prose generation.

## Obsidian CLI MCP
- [ ] Tool definitions (name, parameters, return format for each tool)
- [ ] Mapping from MCP tools to Obsidian CLI commands
- [ ] Fallback behavior when Obsidian isn't running
- [ ] Error handling for each tool

## Data Flows
- [ ] Cross-domain data flow diagram (what feeds into what)
- [ ] Review queue lifecycle (how items enter, get processed, and route to destinations)
- [ ] How batch triage works (inbox/channel → project sorting)

## Setup Flow
- [ ] Interactive setup conversation script (what questions, what order)
- [ ] What config gets written at each step
- [ ] Minimum viable setup (what's needed to start using Myna)
- [ ] Power user path (direct config file editing)

## Team Health (design phase)
- [ ] Team file structure (`myna/Team/`) — timeline of team-level observations: retro themes, cross-1:1 patterns, process changes, hiring/departures. Parallel to project/person files.
- [ ] Team Health snapshot log — weekly summary appends a dated snapshot (delegation health, feedback gaps, attention gaps per person) to enable trend tracking over time
- [ ] How team file gets populated — retro processing, cross-1:1 pattern detection, manual observations
- [ ] How trends are surfaced — "is my team healthier this month?" queries the snapshot log

## Per-Domain Design
- [ ] Email & Messaging — processing pipeline, extraction logic
- [ ] Meetings & Calendar — note lifecycle, brief/debrief flows
- [ ] Projects & Tasks — task format, timeline format, context switching
- [ ] People Management — person file lifecycle, observation/feedback flow
- [ ] Daily Workflow — daily note lifecycle, planning logic, sync flow
- [ ] Writing & Drafts — draft storage, rewrite modes, style application
- [ ] Self Tracking — contribution extraction, brag doc generation

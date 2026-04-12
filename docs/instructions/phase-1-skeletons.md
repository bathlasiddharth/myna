# Phase 1 — Skeletons

Operational guide for Phase 1. Read at the start of any P1 task. See `docs/roadmap.md` Phase 1 section.

---

## What Phase 1 is

Mechanical scaffolding. Phase 0 designed the system; Phase 1 creates the empty containers. No design decisions — just file creation based on Phase 0 output.

**In scope:**
- Create all 6 config files with their schemas (empty defaults, structured but no user content)
- Create the complete vault folder structure under `myna/`
- Create file templates for each file type (empty, structured)
- Create an agent bootstrap file per agent (shell with role, shared context, conventions — no feature content)
- Create steering file skeletons (empty, just headers for cross-cutting rules)
- Create the Myna Obsidian MCP wrapper stub
- Create any directory structure for Claude Code skills/subagents that Phase 2 will populate

**Out of scope:**
- Any content decisions (those happened in Phase 0)
- Any feature behavior (Phase 3 and 5)
- Any install tooling (Phase 6)

## Why Phase 1 matters

Low-stakes but high-leverage. If Phase 1 creates the right skeleton, Phase 2+ just fills in content. If Phase 1 misses a file or uses the wrong structure, every downstream phase trips on the gap.

This phase is mostly mechanical but demands attention to matching Phase 0's decisions exactly. Any deviation here creates drift.

## Context files to read

1. `docs/design/foundations.md` — the authoritative source for what needs to exist
2. `docs/architecture.md` (or the architecture section of foundations) — the agent list and scopes
3. `docs/roadmap.md` — Phase 1 tasks

No need to re-read requirements or vision — Phase 0 already consolidated everything relevant into foundations.

## Phase-specific rules

1. **Match foundations exactly.** No interpretation, no improvisation. Every folder, file, section, and schema must be what foundations specifies.
2. **Empty but structured.** Files have headers, sections, schemas — but no user content. Templates should be usable, not pre-populated.
3. **If foundations has a gap, escalate.** Do not fill in a gap by inventing something in Phase 1. Go back to Phase 0 for the missing decision.
4. **Capture any gap as a learning (D029).** If Phase 1 reveals a foundations gap, update foundations AND note the gap — this is a quality signal for future phases.

## Tasks

### P1-T01 — Create vault folder structure

Every folder and subfolder under `myna/` per foundations. Include `_system/` and all its children.

### P1-T02 — Create file templates

One template file per file type. Sections, headers, any Dataview queries, proper format. No user-specific content.

### P1-T03 — Create config files

All 6 config files with schemas. Empty defaults, structured so the setup wizard can populate them later.

### P1-T04 — Create agent bootstrap files

One file per agent defined in Phase 0 architecture. Each has: role statement, shared context, conventions reference, placeholder sections for feature content. No feature behavior yet.

### P1-T05 — Create steering file skeletons

One file per steering rule identified in Phase 0. Headers and brief description, empty body.

### P1-T06 — Myna Obsidian MCP wrapper stub

Create the wrapper code stub. Minimal — just enough structure to be filled in when Phase 3 features need it.

### P1-T07 — Verify skeleton matches foundations

Walk through foundations and check every specified artifact exists in the skeleton. Use a structural check script if available.

## End-of-session discipline

- No content added that wasn't in foundations
- Any discovered foundations gap captured as a correction
- Roadmap updated
- Structural check passes

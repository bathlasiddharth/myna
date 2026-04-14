# P0: Update Architecture and Foundations for Native Claude Code Skills

## Setup

**Model:** Sonnet | **Effort:** High

## Context

Myna is a Chief of Staff for tech professionals built on Claude Code. We're restructuring the skill system to use Claude Code's **native skills mechanism** instead of manually loading skill files. This prompt updates the source-of-truth documentation before any skills are written.

**Read these files first:**
- `docs/architecture.md` — current architecture (needs updating)
- `docs/design/foundations.md` — data layer, vault structure, patterns (needs updating)
- `docs/decisions.md` — for context on existing decisions

**Note:** Old flat skill files have been removed. Only `myna-steering-*` directories exist under `agents/skills/`.

## What changed

### Native Claude Code skills
- Skills live in `~/.claude/skills/{skill-name}/SKILL.md`
- At startup, only skill **names and descriptions** load (progressive disclosure)
- Full content loads **on demand** when invoked by description match or `/slash-command`
- Users can invoke any skill with `/myna-{name}` plus natural language arguments
- Skills support `argument-hint` frontmatter for autocomplete hints

### Steering as preloaded skills
- Steering files become skills with `user-invocable: false`
- Listed in the subagent's `skills:` frontmatter field → full content preloaded at startup
- This is the correct use of the `skills:` field: always-on rules that MUST be in context
- The agent body (`~/.claude/agents/myna.md`) stays lean: identity, routing, direct operations

### Skill restructure: 15 → 24 + 5 steering
- `brief` (1 skill with 9 sub-modes) → 7 focused skills
- `sync` → `myna-sync` + `myna-plan` (vault writes vs ephemeral advice)
- `wrap-up` → `myna-wrap-up` + `myna-weekly-summary` (daily vs weekly scope)
- `draft` → `myna-draft` + `myna-rewrite` (generate new vs transform existing)
- All other skills renamed with `myna-` prefix
- 5 steering files become 5 steering skills
- 3 skills deferred to post-launch

## Sections to update in `architecture.md`

### §1 Overview (rewrite)

Update these specifics:
- "one main agent with 14 skills" → "one main agent with 24 skills"
- "Cross-cutting rules live in steering files that are always loaded" → "Cross-cutting rules live in 5 steering skills, preloaded via the subagent's `skills:` frontmatter field"
- "How Myna Runs on Claude Code" subsection: replace the 4-step CLAUDE.md description with the native skills model:
  1. **Main agent** — `~/.claude/agents/myna.md` contains identity, routing logic, direct operations. Frontmatter lists steering skills via `skills:` field for preloading.
  2. **Steering skills** — 5 skills with `user-invocable: false` preloaded at startup via the agent's `skills:` field. Always in context.
  3. **Feature skills** — 24 skills in `~/.claude/skills/myna-*/SKILL.md`. Only names and descriptions in context at startup. Full content loaded on demand when invoked.
  4. **Config** — 6 YAML files read at session start from `{vault_path}/myna/_system/config/`
- Remove the paragraph about "the main agent instructs Claude Code to read the full skill file" — skills load automatically now

### §2 Skill Inventory (full rewrite)

Replace the entire section with the new 24-skill inventory. For each skill, include:
- One-liner description
- Features covered (map from `docs/features/*.md`)
- Example invocations (natural language triggers)
- Reads (what data sources)
- Writes (what vault outputs)
- One brief example

Here is the complete skill table with feature mappings:

**Day Lifecycle:**

| Skill | Features covered |
|---|---|
| `myna-sync` | Morning Sync, Daily Note, Weekly Note, Plan Tomorrow, Journal auto-archiving |
| `myna-plan` | Planning: plan day, priority coaching, week optimization (ephemeral inline advice, no vault writes) |
| `myna-wrap-up` | End of Day Wrap-Up, contribution detection, carry-forward, reflection (invokes myna-learn) |
| `myna-weekly-summary` | Weekly Summary, team health snapshot (managers) |

**Email Pipeline:**

| Skill | Features covered |
|---|---|
| `myna-email-triage` | Email Triage (3-step: recommend → user edits → process) |
| `myna-process-messages` | Email Processing, Messaging Processing, Document Processing, Deduplication (3 layers), Meeting Summaries from Email, Unreplied Tracker (populated as byproduct) |
| `myna-draft-replies` | Email Draft Reply (DraftReplies folder path), Follow-Up Meeting Draft (via forwarded email) |

**Meeting Lifecycle:**

| Skill | Features covered |
|---|---|
| `myna-prep-meeting` | Meeting File Prep section, meeting type inference, conversation coaching |
| `myna-process-meeting` | Process Meeting, Universal Done (meeting path) |

**Information Retrieval:**

| Skill | Features covered |
|---|---|
| `myna-brief-person` | Person Briefing (role, shared projects, open items, pending feedback, 1:1 history, personal notes) |
| `myna-brief-project` | Project Status Summary (quick and full modes) |
| `myna-team-health` | Team Health Overview (point-in-time dashboard for all directs) |
| `myna-unreplied-threads` | Unreplied Tracker queries (waiting on you vs waiting on them) |
| `myna-blockers` | Blocker Detection (scan all active projects) |
| `myna-1on1-analysis` | 1:1 Pattern Analysis (cross-session statistical analysis) |

**People Management:**

| Skill | Features covered |
|---|---|
| `myna-performance-narrative` | Performance Narrative generation + Review Calibration |

**Writing:**

| Skill | Features covered |
|---|---|
| `myna-draft` | Email Draft Reply (conversation path), Follow-Up Email, Follow-Up Meeting Draft, Structured Draft (status/escalation), Recognition Draft, Help Me Say No, Difficult Conversation Prep, Monthly Update (MBR/MTR/QBR) |
| `myna-rewrite` | Message Rewriting (fix/tone/rewrite modes) |

**Data Capture:**

| Skill | Features covered |
|---|---|
| `myna-capture` | Quick Capture, Observations & Feedback Logging, Recognition Tracking, Task Management (add, recurring), Link Manager, Project/Person File Management |

**Calendar:**

| Skill | Features covered |
|---|---|
| `myna-calendar` | Time Block Planning, Calendar Reminders, Task Breakdown |

**Self-Tracking:**

| Skill | Features covered |
|---|---|
| `myna-self-track` | Contributions Tracking, Self-Narrative Generation (brag doc, self-review, promo packet), Contribution Queries, Self-calibration |

**Context:**

| Skill | Features covered |
|---|---|
| `myna-park` | Park & Resume |

**Memory:**

| Skill | Features covered |
|---|---|
| `myna-learn` | Emergent memory: capture, reflect, delete, negotiate |

**Review:**

| Skill | Features covered |
|---|---|
| `myna-process-review-queue` | Review Queue processing (review-work, review-people, review-self) |

**Post-launch (deferred):**
- `myna-brief-thread` — Thread Summary
- `myna-review-calibration` — Review Calibration (standalone; folded into myna-performance-narrative for v1)
- `myna-pre-read` — Pre-Read Preparation

For the skill detail blocks: keep the same format as the current architecture (Features covered, Example invocations, Reads, Writes, Example) but update for the new skill boundaries. Each skill detail should be concise — 15-25 lines. Read the relevant `docs/features/*.md` file to get the feature details right.

### §3 Agent Structure (rewrite)

**Main Agent Prompt:** Update to describe the lean agent body — identity, routing, direct operations. No steering inlined. No skill file paths.

**Steering:** Replace the "Steering Files" subsection. Steering rules are now 5 skills preloaded via the subagent `skills:` frontmatter field:

```yaml
---
name: myna
description: Chief of Staff for tech professionals
skills:
  - myna-steering-safety
  - myna-steering-conventions
  - myna-steering-output
  - myna-steering-system
  - myna-steering-memory
---
```

**Skills:** Update to describe native Claude Code skills mechanism — 24 skills in `~/.claude/skills/`, progressive disclosure, auto-invocation from descriptions, `/slash-command` invocation with arguments.

**Routing Principle:** Keep the routing principle but note that auto-invocation handles most cases. The routing logic in main.md is supplementary guidance for edge cases (Universal Done, ambiguous intent, triage vs process distinction).

### §6 MCP Integration (update)

Update the "Used by" column in the External MCPs table to reference new skill names (e.g., `process` → `myna-process-messages`, `triage` → `myna-email-triage`).

**Add a new subsection: "MCP vs Built-in Tools"** — Skills use Claude Code's built-in tools (Read, Write, Edit, Grep, Glob) for plain file I/O. Obsidian MCP is used ONLY for Obsidian-specific features that can't be done with plain file operations: `tasks` (Tasks plugin queries), `search` (indexed metadata-aware search), `create_from_template` (template variable substitution), `eval` (Dataview queries), `backlinks`/`tags` (Obsidian graph data). This is faster, simpler, and improves graceful degradation when Obsidian isn't running.

### §8 Review Queue (minor update)

Update "Populated by" column to use new skill names.

### §10 Cross-Domain Data Flow (minor update)

Update skill names in the flow diagrams and coordination table.

### §11 Claude-First (D046) (rewrite)

**Install output table:**

| Source artifact | Install output |
|---|---|
| Main agent (`agents/main.md`) | Installed to `~/.claude/agents/myna.md` with path placeholders substituted. Frontmatter lists steering skills for preloading. |
| Steering skills (`agents/skills/myna-steering-*/SKILL.md`, 5 files) | Copied to `~/.claude/skills/myna-steering-*/SKILL.md`. Preloaded at session start via agent's `skills:` field. |
| Feature skills (`agents/skills/myna-*/SKILL.md`, 24 files) | Copied to `~/.claude/skills/myna-*/SKILL.md`. Loaded on demand via Claude Code's native progressive disclosure. |
| MCP server source (`agents/mcp/myna-obsidian/`) | Copied to `~/.myna/mcp/myna-obsidian/`, built, registered via `claude mcp add`. |
| Config `.example` files | Copied to vault `_system/config/` alongside starter `.yaml` files. |
| Install manifest | `~/.myna/install-manifest.json` |
| Version file | `~/.myna/version` |

Remove: "not preloaded via subagent skills: field (would bloat startup context)" — this was about feature skills, which is still true, but steering skills DO use the `skills:` field. Clarify the distinction.

Remove: "Steering rules are inlined into the agent body" — they're now preloaded skills.

Update: subagent frontmatter description — now includes `skills:` field listing steering skills.

### §14 Memory Model (minor update)

Update references: "agents/steering/memory.md" → "myna-steering-memory skill", "learn skill" → "myna-learn skill", skill count "14" → "24".

## Sections to update in `foundations.md`

Read `docs/design/foundations.md` and update:
- Any references to skill file paths (e.g., `agents/skills/{name}.md` → `agents/skills/myna-{name}/SKILL.md`)
- Any references to `~/.myna/skills/` → `~/.claude/skills/`
- Any references to steering files as separate files → steering skills
- Skill count: 14 → 24
- Any install-related path references

These should be minor find-and-replace updates, not structural changes.

## Beyond the sections listed above

The sections listed above are the ones I know need changes. But **also scan both files end-to-end** for any other references to old skill names, old paths, old counts (14/15), old mechanisms (manual file reading, inlined steering), or anything else that contradicts the new structure. Fix anything you find.

## Git

```bash
git add docs/architecture.md
git commit -m "docs(architecture): update for 24 native Claude Code skills with steering preload"

git add docs/design/foundations.md
git commit -m "docs(foundations): update paths and references for native skills structure"

git push origin main
```

## Verification

After updating both files:
- `grep -n "14 skills\|15 skills\|14 feature" docs/architecture.md` — should find 0 matches
- `grep -n "~/.myna/skills" docs/architecture.md` — should find 0 matches
- `grep -n "agents/skills/.*\.md" docs/architecture.md` — should only reference `SKILL.md` format
- `grep -n "steering file" docs/architecture.md` — should reference "steering skill" instead
- All 24 skills appear in the §2 inventory
- The install output table in §11 matches the new structure
- `docs/design/foundations.md` has no stale path references

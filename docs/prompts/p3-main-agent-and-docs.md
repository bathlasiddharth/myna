# P3: Write Main Agent + Install Script + Update All Supporting Files

## Setup

**Model:** Opus | **Effort:** High

## Context

Myna is a Chief of Staff for tech professionals built on Claude Code. All 24 feature skills and 6 steering skills have been written (P1 + P2). You're writing the main agent and install script from scratch, then updating all supporting docs.

**Read these files:**
- `docs/architecture.md` — full file
- `docs/design/foundations.md` — full file
- All 24 skill SKILL.md files under `agents/skills/myna-*/SKILL.md` — read at least the frontmatter of each to understand names, descriptions, and argument-hints
- All 6 steering skill SKILL.md files under `agents/skills/myna-steering-*/SKILL.md`
- `docs/decisions.md` — read for context, add new decision if warranted
- `docs/roadmap.md` — update task status

**Do NOT read** `agents/main.md`, `install.sh`, or `agents/INSTALL-NOTES.md` — write fresh from the architecture, skills, and feature specs. If you encounter references to "Obsidian MCP" or "myna-obsidian" in any doc, ignore them — Myna does not ship an MCP server.

## Part 1: Write `agents/main.md` from scratch

Write a new main agent prompt designed for native Claude Code skills. The architecture doc (§3 Agent Structure) defines what it must contain. Key elements:

- **Identity and session start** — who Myna is, vault path, read config files on first message
- **Skill directory** — table of all 24 skills with name and one-line description. No file paths — Claude Code handles loading via auto-invocation.
- **Routing logic** — route by user intent, not keywords. Cover: Universal Done, day lifecycle (sync vs plan vs wrap-up vs weekly-summary), inbox routing, email/message processing, meeting routing, writing routing, ambiguous intent, safety refusals, fallback. Do NOT route briefing/retrieval skills — auto-invocation from descriptions handles those.
- **Direct operations** — vault search, link find, task completion, draft deletion, task move, file creation from template. These are handled inline without loading a skill.
- **Rules** — brief reminders of critical rules (full details in steering skills)

**Agent frontmatter** (install script generates this):
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
  - myna-steering-vault-ops
---
```

**Header comment** with placeholder documentation:
```markdown
<!--
Installed to ~/.claude/agents/myna.md by install.sh.
Placeholders: {{VAULT_PATH}}, {{SUBFOLDER}}
Users invoke with: claude --agent myna
-->
```

## Part 2: Write `install.sh` from scratch

Write a new install script. Read `docs/architecture.md` §11 for what the install must do:

- **Prerequisites check** — Node.js, Obsidian vault path validation
- **Copy skills** — `agents/skills/myna-*/` to `~/.claude/skills/myna-*/` (preserving directory structure, both feature and steering skills)
- **Generate agent file** — substitute `{{VAULT_PATH}}` and `{{SUBFOLDER}}` in main.md, add frontmatter with `skills:` listing 6 steering skills, write to `~/.claude/agents/myna.md`
- **Create vault structure** — 15 directories under `{vault}/{subfolder}/`
- **Copy config examples** — `.example` files to `{vault}/{subfolder}/_system/config/`
- **Summary output** — what was installed, what to do next

No MCP server registration — Myna doesn't ship an MCP.

## Part 3: Write `agents/INSTALL-NOTES.md` from scratch

Design document for how the install works. Cover:
- How skills are copied and where they live at runtime
- How the agent file is generated (frontmatter + body + placeholder substitution)
- How vault paths are resolved
- How external MCPs (email, Slack, calendar) are registered by the user separately

## Part 4: Update remaining files

Update these for the new architecture. Search each file for stale references to old skill names, old paths, old counts, or MCP.

- **`CLAUDE.md`** — artifact table, skill counts, any stale references
- **`README.md`** — install description, skill count/list, components table
- **`docs/decisions.md`** — add new decision documenting native Claude Code skills adoption
- **`docs/roadmap.md`** — update Phase 2 task status
- **`docs/vision.md`** — check for stale references
- **`docs/features/setup-and-config.md`** — install-related feature descriptions
- **`scripts/lint-agents.sh`** — update for `myna-*/SKILL.md` directory structure
- **`tests/manual-test-checklist.md`** — update skill names and paths
- **`agents/myna-agent-template.md`** — write fresh. Think about what a reusable agent template should look like for the native skills architecture: what frontmatter fields, what body structure, what placeholders. This is a reference for anyone creating a new Myna-like agent.

### Clean up
- Delete MCP server directory: `agents/mcp/myna-obsidian/`
- Remove empty `agents/steering/` directory if it exists
- Search the entire repo for remaining references to old paths and fix them

## Review Rounds

### Round 1: Routing completeness
Trace these user intents through main.md's routing logic:
1. "Good morning" / "Start my day"
2. "Help me plan today"
3. "Wrap up"
4. "Process my inbox"
5. "Draft a reply to Sarah's email about the API delay"
6. "Prep for my 2pm design review"
7. "Who is Alex Chen?"
8. "What's the status of Project Titan?"
9. "Done with the API migration task"
10. "Send this draft to the team"

For any that routes wrong, is ambiguous, or is missing — fix.

### Round 2: Cross-reference consistency
```bash
grep -rn "14 skills\|15 skills\|14 feature\|15 feature" docs/ CLAUDE.md README.md  # 0 matches
grep -rn "~/.myna/skills\|agents/skills/brief\|agents/skills/sync\|agents/steering/" docs/ CLAUDE.md README.md agents/  # 0 matches in active files
grep -rn "steering file" docs/ agents/ CLAUDE.md  # should say "steering skill"
grep -rn "myna-obsidian\|Obsidian MCP" agents/main.md install.sh  # 0 matches
```
Skill directory table in main.md: verify all 24 skills listed, none missing or duplicated.

## Git

```bash
# Main agent
git add agents/main.md
git commit -m "feat(agent): write main agent for native Claude Code skills"

# Install script
git add install.sh
git commit -m "feat(install): write install script for ~/.claude/skills/ and steering preload"

# Install notes
git add agents/INSTALL-NOTES.md
git commit -m "docs: write install notes for native skills architecture"

# Clean up
git rm -rf agents/mcp/myna-obsidian/
git commit -m "refactor: remove obsolete MCP server directory"

# Doc updates
git add docs/ CLAUDE.md README.md agents/myna-agent-template.md scripts/ tests/
git commit -m "docs: update all references for 24 native Claude Code skills"
```

After all commits: `git push origin main`

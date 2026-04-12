# Phase 2 — Installation Script

Operational guide for Phase 2. Read at the start of any P2 task. See `docs/roadmap.md` Phase 2 section and decisions D045, D046, D047.

---

## What Phase 2 is

Phase 2 builds the installation script that wires Myna into a user's Claude Code environment. **This phase is user-involved, not autonomous**, because installation correctness depends on real-environment testing that the user is best positioned to do, and because ease-of-install is a user experience concern the user wants direct input on.

**Target for v1: Claude Code only** (per D045). Other AI tools (Gemini, Codex, etc.) are post-launch community contributions.

**In scope:**
- Design the install flow for Claude Code
- Write the install script (shell script)
- Generate a project-level CLAUDE.md that loads main.md, steering files, and skill directory
- Register the myna-obsidian MCP server with Claude Code via `claude mcp add`
- Create the `myna/` folder structure in the user's Obsidian vault
- Copy `.example` config files to `_system/config/`
- Test the install script on a clean environment
- Document the install flow for the Phase 3 setup guide

**Out of scope:**
- Installers for other AI tools (Gemini, Codex) — post-launch community contributions
- Post-install bug fixing from real-world use (that's post-ship)
- Public-release polish (Phase 3)
- Interactive setup wizard (deferred post-launch per D043 — users edit YAML directly for v1)
- Automated install testing (not in v1)

## Why Phase 2 matters

Installation is the first moment a user's opinion matters. A hard-to-install product gets abandoned before the user sees what it does. Phase 2 is where we make the first mile friction-free for Claude Code users.

This is also the first phase where Myna stops being abstract markdown and becomes software someone actually runs. The install script is one of the very few pieces of executable code in the whole project (alongside the Myna Obsidian MCP wrapper).

Note: **autonomous agent build instructions don't apply to this script.** The `autonomous-build-plan.md` recipe is for writing agent prompts, not install scripts. Phase 2 is human-in-the-loop work — Claude drafts, user reviews, iterates.

## Context files to read

1. `docs/design/foundations.md` — for the vault folder structure (where things need to land)
2. `docs/architecture.md` — for the agent roster and Claude Code runtime model (§1, §3, §11)
3. `docs/decisions.md` — especially D008 (Myna Obsidian MCP), D045 (Claude Code target), D046 (Claude-first), D047 (simplified install)
4. `docs/roadmap.md` — Phase 2 tasks
5. The full set of built agents from Phase 1 — these are the payload the installer references
6. Claude Code documentation for CLAUDE.md format, `claude mcp add` syntax, and project configuration

## What the install script produces

### 1. Generated CLAUDE.md

A project-level CLAUDE.md placed in the Myna repo root (or a user-specified project directory). This file is Claude Code's entry point — loaded automatically at session start. It must:

- Include the full content of `agents/main.md` (identity, routing logic, always-on rules, direct operations)
- Include the full content of all 4 steering files (`agents/steering/*.md`)
- Include a **skill directory** — for each of the 14 skills: name, one-line description, and file path. Claude Code reads the full skill file on demand when the user's request matches a skill.
- Include instructions to read the 6 YAML config files from the vault's `_system/config/` directory at session start
- Reference the vault path (configurable during install)

**Path handling:** The generated CLAUDE.md should use paths relative to the repo root for agent files (e.g., `agents/skills/capture.md`). The vault path is absolute (the user provides it during install).

### 2. MCP server registration

Register the myna-obsidian MCP server with Claude Code using `claude mcp add`. The command needs:
- Server name (e.g., `myna-obsidian`)
- Command to start the server (e.g., `node agents/mcp/myna-obsidian/dist/index.js`)
- Environment variables or args for vault name and myna subfolder

External MCP servers (email, Slack, calendar) are the user's responsibility — the install script should remind the user to register them separately if they want email/messaging features.

### 3. Vault folder structure

Create the `myna/` subfolder tree in the user's Obsidian vault:

```
myna/
├── Projects/
├── People/
├── Meetings/
│   ├── 1-1s/
│   ├── Recurring/
│   └── Adhoc/
├── Drafts/
├── Journal/
│   └── Archive/
├── Team/
├── ReviewQueue/
└── _system/
    ├── config/
    ├── templates/
    ├── dashboards/
    ├── logs/
    ├── sources/
    └── parked/
```

### 4. Config examples

Copy `.example` config files to `_system/config/`. These are reference files the user copies and edits — the install script does NOT create actual config files with user data (that's manual for v1).

## Prerequisites for users

Before running the install script, the user needs:
1. **Claude Code CLI** installed and authenticated
2. **Obsidian** installed with a vault created
3. **Obsidian CLI** enabled (Settings → General → Enable CLI)
4. **Node.js** installed (for the MCP server)
5. The Myna repo cloned locally

## Phase-specific rules

1. **User-involved, not autonomous.** Every design decision in this phase goes through the user. Claude proposes, user reviews, iterate.
2. **Test on a clean environment.** The script should be tested by installing into a fresh vault or an environment that doesn't have Myna yet. Testing in the same env where we built everything isn't a real test.
3. **Fail loudly.** If the install script can't do something, it reports the error clearly. No silent fallbacks that leave the user confused.
4. **Idempotent where possible.** Running the install script twice should not break anything. Running it after a partial failure should recover, not corrupt. Specifically: don't overwrite an existing CLAUDE.md without asking, don't re-create vault folders that already exist, don't re-register an MCP server that's already registered.
5. **No automation temptation.** The goal is a working installer, not a build system. Don't add package managers, version checks, or abstractions the script doesn't need.

## Verification checklist

After install completes, verify:
1. CLAUDE.md exists in the project directory and contains main agent + steering + skill directory
2. `claude mcp list` shows the myna-obsidian server
3. The vault folder structure exists under the configured path
4. `.example` config files are in `_system/config/`
5. Starting a Claude Code session in the project directory loads Myna's instructions (test with a simple prompt like "what can you do?")

## Tasks

### P2-T01 — Design the Claude Code install flow

Walk through with the user:
- Where the generated CLAUDE.md should live (repo root vs. separate directory)
- How the MCP server should be registered (project-scope vs. user-scope)
- What the script should prompt the user for (vault path, vault name, subfolder name)
- Error modes and reporting
- Idempotency behavior

Output: a short design doc or bullet list of install steps.

### P2-T02 — Write the install script

Implement the flow as a shell script (bash). The script should:
1. Prompt for vault path (or accept as argument)
2. Build the MCP server (`cd agents/mcp/myna-obsidian && npm install && npm run build`)
3. Generate CLAUDE.md from the agent files
4. Register the MCP server with Claude Code
5. Create the vault folder structure
6. Copy config examples
7. Print a summary of what was done and next steps

### P2-T03 — Test on a clean environment

Install Myna on a machine (or simulated environment) that doesn't already have it. Verify every step works. Fix issues. Iterate.

### P2-T04 — Document the install flow

Write a short doc describing how to run the installer, what it does, what to expect, common error resolutions. This feeds the Phase 3 setup guide.

### P2-T05 — User final approval

User runs the installer on their own machine. Confirms it works. Phase 2 is done.

## End-of-session discipline

- Install script is runnable
- Any issues discovered during testing are fixed before session ends (or logged for next session)
- Install documentation is current
- Roadmap updated

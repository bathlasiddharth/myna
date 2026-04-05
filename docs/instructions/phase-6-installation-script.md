# Phase 6 — Installation Script

Operational guide for Phase 6. Read at the start of any P6 task. See `docs/roadmap.md` Phase 6 section and decision D035.

---

## What Phase 6 is

Phase 6 builds the installation tooling that wires Myna into a user's environment. **This phase is user-involved, not autonomous**, because installation correctness depends on real-environment testing that the user is best positioned to do, and because ease-of-install is a user experience concern the user wants direct input on.

**Target for v1: Kiro CLI only** (per D035). Other AI tools (Claude Code, Gemini, Codex) are post-launch work.

**In scope:**
- Design the install flow for Kiro CLI
- Write the install script (shell, Python, or whatever fits — decided in-phase)
- Wire up the Obsidian CLI MCP wrapper with Kiro CLI's MCP mechanism
- Place agent instructions, steering, and foundations where Kiro CLI expects them
- Create the `myna/` folder in the user's Obsidian vault
- Initialize config files and vault templates
- Invoke the Setup & Config agent (built in Phase 5) for interactive onboarding
- Test the install script on a clean environment (or simulation)
- Document the install flow for the Phase 8 setup guide

**Out of scope:**
- Installers for other AI tools (Claude Code, Gemini, Codex) — post-launch
- Post-install bug fixing from real-world use (that's post-ship)
- Public-release polish (Phase 8)
- Automated install testing (not in v1)

## Why Phase 6 matters

Installation is the first moment a user's opinion matters. A hard-to-install product gets abandoned before the user sees what it does. Phase 6 is where we make the first mile friction-free for Kiro CLI users.

This is also the first phase where Myna stops being abstract markdown and becomes software someone actually runs. The install script is one of the very few pieces of executable code in the whole project (alongside the Obsidian CLI MCP wrapper).

Note: **autonomous agent build instructions don't apply to this script.** The `build-agent.md` recipe is for writing agent prompts, not install scripts. Phase 6 is human-in-the-loop work — Claude drafts, user reviews, iterates.

## Context files to read

1. `docs/foundations.md` — for the runtime file structure (where things need to land)
2. `docs/architecture.md` — for the agent roster (what needs to be installed)
3. `docs/decisions.md` — especially D007 (model-agnostic), D008 (Obsidian CLI MCP), D009 (interactive setup), D035 (Kiro CLI-only v1)
4. `docs/roadmap.md` — Phase 6 tasks
5. The full set of built agents from Phase 5 — these are the payload the installer places
6. Kiro CLI documentation for how to load instructions, register MCPs, etc. (external — user provides)

## Phase-specific rules

1. **User-involved, not autonomous.** Every design decision in this phase goes through the user. Claude proposes, user reviews, iterate.
2. **Test on a clean environment.** The script should be tested by installing into a fresh vault or an environment that doesn't have Myna yet. Testing in the same env where we built everything isn't a real test.
3. **Fail loudly.** If the install script can't do something, it reports the error clearly. No silent fallbacks that leave the user confused.
4. **Idempotent where possible.** Running the install script twice should not break anything. Running it after a partial failure should recover, not corrupt.
5. **No automation temptation.** The goal is a working installer, not a build system. Don't add package managers, version checks, or abstractions the script doesn't need.

## Tasks

### P6-T01 — Design the Kiro CLI install flow

Walk through with the user:
- What Kiro CLI expects (where instructions live, how MCPs register, what config format)
- Which Myna files need to land where
- How the setup agent gets invoked
- Error modes and reporting

Output: a short design doc or bullet list of install steps.

### P6-T02 — Write the install script

Implement the flow as an actual runnable script. Language chosen in-phase (bash, python, whatever makes sense for Kiro CLI users).

### P6-T03 — Test on a clean environment

Install Myna on a machine (or simulated environment) that doesn't already have it. Verify every step works. Fix issues. Iterate.

### P6-T04 — Document the install flow

Write a short doc describing how to run the installer, what it does, what to expect, common error resolutions. This feeds the Phase 8 setup guide.

### P6-T05 — User final approval

User runs the installer on their own machine. Confirms it works. Phase 6 is done.

## End-of-session discipline

- Install script is runnable
- Any issues discovered during testing are fixed before session ends (or logged for next session)
- Install documentation is current
- Roadmap updated

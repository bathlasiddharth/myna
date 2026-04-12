# Claude Migration — Prompt 1: Design Docs Update

Paste this entire prompt into a new Claude Code session.

---

You are updating Myna's design and process documents to reflect a major architectural decision: **switching from a tool-agnostic design to a Claude-first design.** This is a docs-only session — you will NOT touch any files under `agents/`.

**Your primary job is not to follow a checklist — it is to deeply understand the current design, deeply understand what Claude-first means, and then update every document so that a fresh Claude session reading them would build Myna for Claude Code without confusion.** The section-by-section guidance below is a starting point, not an exhaustive list. You are expected to find additional changes that aren't listed here. Think independently about what each document needs.

## Context

Myna was originally designed with a two-layer architecture (D038): a tool-neutral content layer and a tool-specific adapter layer, with Kiro CLI as the v1 target (D035). We are switching to **Claude Code as the only supported runtime for v1.** The reasons:

1. Claude Code has native MCP support — Myna's `obsidian-cli` MCP server works directly.
2. Claude Code uses CLAUDE.md as its entry point — the agent instructions map naturally.
3. The adapter layer abstraction was speculative — we never built adapters for other tools, and the portability tax made every design choice more complex than necessary.
4. The skill files, steering files, and configs are plain markdown/YAML — inherently readable by any LLM. Portability comes from the file format, not from an abstraction layer.

**This is Claude-first, not Claude-only.** The content remains markdown. If someone wants to run Myna on Gemini or Codex in the future, they can read the markdown files and write their own wiring. That's an open-source community contribution, not something we architect for upfront.

## What to read

Read ALL of these files completely before making any changes. Build a full mental model first. Do NOT start writing after reading 2-3 files — read everything, then think, then write.

1. `CLAUDE.md` — project instructions (auto-loaded)
2. `docs/decisions.md` — all decisions D001–D044. Understand the full history.
3. `docs/architecture.md` — current architecture with tool-agnostic design
4. `docs/design/foundations.md` — data layer foundations
5. `docs/roadmap.md` — phase structure, task tracker, backlog
6. `docs/vision.md` — north star (unchanged by this migration)
7. `docs/instructions/autonomous-build-plan.md` — build methodology
8. `docs/open-questions.md` — check for any questions this migration resolves
9. `docs/instructions/phase-6-installation-script.md` — current install phase guide (Kiro-targeted)
10. All other files under `docs/instructions/` — scan for Kiro references or tool-agnostic language
11. `docs/journal/dev-journal.md` — understand the project history (do not modify historical entries)

After reading everything, before making changes, write down:
- A list of every concept/pattern/reference that needs to change because of this migration
- Any additional changes you've identified beyond what's listed in the steps below
- Any questions or ambiguities you need to resolve

---

## Step 1 — Add new decisions to `docs/decisions.md`

Add new decisions at the top (newest first), starting from D045. The migration requires at least these decisions:

**D045 — Switch from Kiro CLI to Claude Code as v1 runtime.** Key points: Claude Code replaces Kiro CLI. Supersedes D035. Reasons: native MCP support, CLAUDE.md as natural entry point, large user base.

**D046 — Relax tool-agnostic content/adapter separation; adopt Claude-first design.** Key points: The strict two-layer separation from D038 is relaxed. Agent instructions can reference Claude Code capabilities directly. The "portability test" is removed. Content remains plain markdown (inherently portable). Community handles other runtimes. Supersedes D038 and adapter-related parts of D007. D002 (AI model agnostic) preserved in spirit.

**D047 — Phase 2 (Install) simplified to shell script for Claude Code.** Key points: No adapter packaging. Install is: generate CLAUDE.md, configure MCP, create vault folders, copy config examples. Supersedes Phase 2 scope from D035.

Draft the actual decision text yourself — make it match the existing format and style in decisions.md exactly. Use date 2026-04-07. Include Context, Decision, Alternatives rejected. Think about whether additional decisions beyond these three are needed — if the migration implies other settled questions, capture them.

---

## Step 2 — Update `docs/architecture.md`

This is the most important file in the project. Read it section by section and think deeply about what Claude-first means for each part. The changes I've identified below are a starting point — **you should find more.**

### Starting points (what I know needs to change):

**2a. Overview section** — Replace "any capable LLM" / "Kiro CLI, Claude Code, etc." language. Myna is built for Claude Code. Keep one sentence noting instructions are plain markdown.

**2b. Content/adapter layer section** — Remove or fundamentally rewrite. The two-layer separation is no longer an architectural concept.

**2c. Skill loading** — Update for Claude Code's model: Claude reads skill files directly. No adapter mechanism.

**2d. MCP integration** — Update to reflect Claude Code's native MCP support (`claude mcp add`).

**2e. Install/Phase 2 references** — Reflect simplified scope.

**2f. Kiro CLI references** — Remove all.

### Your job beyond these starting points:

Read every section of architecture.md and ask yourself: **"Does this section make complete sense for someone building Myna for Claude Code? Does it explain things that are now unnecessary? Does it omit things that are now relevant because we're targeting Claude?"**

Think about:
- Does the architecture need to describe how Claude Code works as a runtime? (How CLAUDE.md is loaded, how MCP servers are configured, how skills get activated in practice)
- Are there architectural patterns or concepts that existed only because of the tool-agnostic requirement? Remove them.
- Are there new architectural patterns that become possible now that we're Claude-first? (e.g., Claude Code's conversation persistence, Claude's ability to read files on demand, Claude's native tool use)
- Does the description of how the main agent, steering, skills, and config relate to each other need updating for Claude Code's execution model?
- Is there anything in the architecture that was a compromise for portability that can now be done better?

**Constraint:** Do NOT change the skill inventory, feature coverage, vault structure, or config schemas. Only change how the system is wired and described in relation to its runtime.

---

## Step 3 — Update `docs/design/foundations.md`

Foundations is primarily a data layer document (vault structure, templates, config schemas, patterns). Most of it is naturally tool-agnostic. But read it carefully — there may be more to update than just removing Kiro references.

### Starting points:

**3a.** Remove "portability test" and "would this work on a different AI tool?" language.

**3b.** Add Claude Code context where MCP tools are discussed.

**3c.** Remove Kiro CLI references.

### Your job beyond these starting points:

- Are there patterns or conventions in foundations.md that were constrained by the tool-agnostic requirement?
- Does the MCP tool surface description need to be updated now that we can describe it in Claude Code terms?
- The self-containment test ("if a fresh Claude session had only this file...") — is it still the right test? Should it be updated?
- Are there any sections that describe "how the adapter should work" or "what the install step should translate" that are now irrelevant?

---

## Step 4 — Update `docs/roadmap.md`

### Starting points:

**4a.** Update Phase 2 description and scope in the Build Approach table.

**4b.** Update Phase 2 task tracker entries.

**4c.** Update or remove B011 (multi-tool install support) from backlog.

**4d.** Update Project Goals if they reference Kiro.

### Your job beyond these starting points:

- Does the Phase 3 (Ship) task list need any changes? (e.g., README content, setup guide content — these now describe Claude Code setup, not Kiro CLI)
- Do any other backlog items reference the adapter layer or Kiro CLI?
- Does the "How Phase 1 works" description need updating?
- Does the methodology description still make sense?

---

## Step 5 — Update `CLAUDE.md`

### Starting points:

**5a.** Update Phase-Specific Instructions table — Install script row.

**5b.** Remove Kiro references.

**5c.** Update D038 references to D046.

### Your job beyond these starting points:

CLAUDE.md is the project instructions file that governs how Claude works on the Myna project itself (not the Myna agent — that's a different CLAUDE.md generated at install time). Think about:

- Does the "AI model agnostic" ground rule (item 5) need to change? It currently says "Never assume a specific AI provider. Myna must work with Claude, Gemini, Codex, Kiro CLI, etc." — this is no longer true as stated.
- Are there any other ground rules or phase-specific instructions that implicitly assume the tool-agnostic design?
- Does the artifact table need updating?

---

## Step 6 — Update `docs/instructions/autonomous-build-plan.md`

This is a methodology artifact that ships. It was used to build Phase 1 and contains the build recipe.

### Starting points:

- Remove portability test references.
- Remove adapter layer / tool-neutral content constraints.
- Replace Kiro CLI references with Claude Code.

### Your job beyond these starting points:

- Does the Golden Rule section need any Claude-specific additions? (Now that we're writing for Claude specifically, the guidance on what to specify vs. what not to specify might be refined.)
- Does the subagent prompt template need updating?
- Are there quality markers or review criteria that were portability-related?
- Think about what a future builder using this methodology for a different project would need. The methodology should still be reusable — but it no longer needs to assume tool-agnosticism as a constraint.

---

## Step 7 — Update `docs/instructions/phase-6-installation-script.md`

This is the Phase 2 operational guide. It needs a substantial rewrite because the entire scope changed.

### Starting points:

The new scope: shell script that (1) generates project CLAUDE.md, (2) configures obsidian-cli MCP, (3) creates vault folder structure, (4) copies config examples.

### Your job beyond these starting points:

Think deeply about what a Claude Code install actually needs. Don't just swap "Kiro" for "Claude" — rethink the document from first principles:

- What does a user need to have before running the installer? (Claude Code CLI installed, Obsidian vault, etc.)
- What exactly does the install script need to produce for Claude Code to work?
- How does the generated CLAUDE.md reference the agent files? (Absolute paths? Relative paths? Symlinks?)
- What MCP configuration is needed? (Server name, command, args, env vars)
- What should the verification step check?
- What's the user experience — what do they type, what do they see?
- The phase-specific rules (user-involved, fail loudly, idempotent) — which still apply?
- The task breakdown — what tasks make sense for the new scope?

---

## Step 8 — Sweep for remaining references

Search the entire `docs/` directory and `CLAUDE.md` for these terms: "Kiro", "kiro", "KIRO", "adapter layer", "content layer", "tool-neutral", "tool-agnostic", "portability test", "model-agnostic" (in the portability sense, not the general principle).

For each hit, decide:
- **Historical artifacts** (decisions being superseded, dev-journal, `docs/design/kiro-cli-research.md`): leave as-is.
- **Active documents** (architecture, foundations, roadmap, CLAUDE.md, instructions): fix.
- **Edge cases**: use judgment. If a reference is in a context that still makes sense (e.g., "the methodology is reusable across different AI tools"), it might be fine. If it implies Myna itself must be tool-agnostic, fix it.

**Also search for concepts that imply the old design** even without using the exact terms. For example, language about "packaging for the target runtime" or "translating content for the AI tool" implies the adapter pattern even without saying "adapter."

---

## Step 9 — Update `docs/open-questions.md`

Check if any open questions are resolved by this migration. Check if the migration surfaces new questions. Add or resolve as appropriate.

---

## Step 10 — Dev journal entry

Add an entry to `docs/journal/dev-journal.md` following the existing format. Capture the decision, rationale, insight (D038 was well-intentioned but speculative), and what changed vs. what stayed the same.

---

## Step 11 — Self-review (3 rounds)

After completing all changes, run 3 review rounds using fresh subagents. Fix issues after each round before starting the next.

**Round 1 — Consistency Auditor**

Spawn a subagent that reads ALL modified files. Ask:

> "You are a consistency auditor for a project that just migrated from a tool-agnostic design (targeting Kiro CLI) to a Claude-first design (targeting Claude Code). Read all of these files and check:
> (1) Search for: 'Kiro' (except in historical decisions/dev-journal), 'adapter layer', 'content layer', 'tool-neutral', 'tool-agnostic', 'portability test', 'model-agnostic' in the portability sense. Flag any that should have been updated.
> (2) Search for concepts that imply the old design even without using those exact terms — language about 'packaging', 'translating for the target tool', 'runtime format', 'install-time adaptation'. Flag these.
> (3) Do the new decisions (D045, D046, D047) contradict any existing unsuperseded decisions?
> (4) Does the roadmap match the architecture? Does CLAUDE.md match the roadmap?
> (5) Are there any forward references to Phase 2 that still describe adapter packaging?
> (6) Is there anything that would confuse a fresh Claude session reading these docs for the first time?
> (7) Are there any OTHER files under docs/ or in the repo root that reference Kiro or the adapter pattern that were missed?"

Fix every issue found.

**Round 2 — Builder Readiness Check**

Spawn a subagent that reads `docs/architecture.md`, `docs/design/foundations.md`, `CLAUDE.md`, and `docs/roadmap.md`. Ask:

> "You are about to build Myna's main agent and 14 skills for Claude Code. Reading only these docs, do you have everything you need?
> (1) Is it unambiguously clear that Claude Code is the target runtime?
> (2) Do you understand how the main agent, skills, and steering files relate to each other in Claude Code's model?
> (3) Is there anything ambiguous about how skills are loaded or activated?
> (4) Are there any contradictory instructions about tool support?
> (5) Would you know how to write Claude-optimized prompts based on these docs?
> (6) Is there anything you'd need to know about Claude Code that these docs don't tell you?
> (7) Are there any architectural concepts described that seem vestigial — like they belonged to a previous design and weren't fully updated?"

Fix every issue found.

**Round 3 — Open-Ended Audit**

Spawn a subagent that reads ALL docs/ files and CLAUDE.md. Ask:

> "You are doing a final quality pass on the Myna documentation after a migration from Kiro CLI to Claude Code. Don't follow a specific checklist — read everything with fresh eyes and flag ANYTHING that seems:
> (1) Inconsistent with other documents
> (2) Confusing or ambiguous
> (3) Vestigial from the old design
> (4) Missing — something that should be documented but isn't
> (5) Wrong — factually incorrect given the new design
> Be thorough. Be critical. Don't manufacture issues, but don't be lenient either."

Fix every issue found.

---

## Rules

1. **Docs only.** Do NOT touch any files under `agents/`. That's Prompts 2 and 3.
2. **Preserve historical decisions.** D035 and D038 stay in decisions.md as historical record. The new decisions supersede them explicitly.
3. **Don't change what Myna does.** Only change how it's wired to the runtime. Skill inventory, features, vault structure, config schemas — all unchanged.
4. **No modifications to historical entries in `docs/journal/dev-journal.md` or `docs/design/kiro-cli-research.md`.** You can append new entries to dev-journal.md, but don't modify existing entries.
5. **Think independently.** The steps above are guidance, not an exhaustive list. Your job is to make every document fully coherent with the Claude-first design. If you find something that needs changing that isn't listed, change it. If something listed doesn't actually need changing, skip it with a note explaining why.
6. **Quality over speed.** Read everything before changing anything. These docs are the ground truth for Prompts 2-4. If they're wrong, everything downstream is wrong.
7. **Three review rounds are mandatory.** Use fresh subagents. Fix all issues found after each round.

## Git

After all review rounds are complete and all issues are fixed:

1. **Commit and push.** Use [Conventional Commits](https://www.conventionalcommits.org/). Suggested message: `docs: migrate design docs from tool-agnostic to Claude-first (D045-D047)` — but write your own based on what you actually changed.
2. **Never add Co-Authored-By lines.**
3. **Gitignored files:** `docs/journal/dev-journal.md` and `docs/prompts/` are gitignored. Do NOT `git add` them — they won't be committed. Still write the dev-journal entry (it's useful locally), just don't try to include it in the commit.
4. **Stage specific files** — don't use `git add -A`. Add only the files you modified.

---

## Output files (expected modifications — you may find more)

1. `docs/decisions.md` — D045, D046, D047 added (possibly more)
2. `docs/architecture.md` — Claude-first, adapter layer removed
3. `docs/design/foundations.md` — tool-agnostic discipline removed
4. `docs/roadmap.md` — Phase 2 updated, backlog updated
5. `CLAUDE.md` — Claude-first framing
6. `docs/instructions/autonomous-build-plan.md` — tool-agnostic constraints removed
7. `docs/instructions/phase-6-installation-script.md` — rewritten for Claude Code install
8. `docs/open-questions.md` — resolved questions marked (if any)
9. `docs/journal/dev-journal.md` — migration entry added
10. Any other files you identify that need updates

---

## Start

1. Read ALL context files (complete list above — every single one)
2. Write down your analysis: what needs to change and why, including things not listed in the steps
3. Add new decisions (Step 1)
4. Update architecture (Step 2) — my starting points + your own findings
5. Update foundations (Step 3) — my starting points + your own findings
6. Update roadmap (Step 4) — my starting points + your own findings
7. Update CLAUDE.md (Step 5) — my starting points + your own findings
8. Update build plan (Step 6) — my starting points + your own findings
9. Update install guide (Step 7) — rethink from first principles
10. Sweep for remaining references (Step 8) — terms AND concepts
11. Update open questions (Step 9)
12. Dev journal entry (Step 10)
13. Self-review round 1, fix issues (Step 11)
14. Self-review round 2, fix issues (Step 11)
15. Self-review round 3, fix issues (Step 11)
16. Commit and push (see Git section)

Take your time. These docs are the ground truth for everything that follows. If you rush this, every subsequent prompt builds on a flawed foundation.

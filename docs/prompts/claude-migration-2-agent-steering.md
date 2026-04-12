# Claude Migration — Prompt 2: Main Agent + Steering Files

Paste this entire prompt into a new Claude Code session. Run this AFTER Prompt 1 (docs update) is complete and committed.

---

You are adapting Myna's main agent and steering files for Claude Code as the native runtime. The design docs have already been updated (Prompt 1) — the architecture now describes a Claude-first design. Your job is to update the implementation files under `agents/` (except skills) to match.

**Your primary job is not to follow a checklist — it is to deeply understand how Claude Code works as a runtime, deeply understand what the main agent and steering files need to do in that runtime, and then make them work perfectly for Claude Code.** The guidance below is a starting point. You are expected to think independently about what each file needs and find changes that aren't listed here.

## Context

Myna switched from a tool-agnostic design (targeting Kiro CLI) to a Claude-first design (targeting Claude Code). Key decisions:

- **D045:** Claude Code replaces Kiro CLI as the v1 runtime.
- **D046:** The strict tool-agnostic content/adapter separation is relaxed. Agent instructions can reference Claude Code capabilities directly.
- **D047:** Phase 2 (Install) is a simple shell script — no adapter packaging.

The design docs (`docs/architecture.md`, `docs/foundations.md`, `docs/decisions.md`) have already been updated and committed.

**Important constraint:** Do NOT touch skill files (`agents/skills/*.md`). Those are handled in Prompt 3 with dedicated attention to Claude-specific prompt optimization.

## What to read

Read ALL of these files completely before making any changes.

**Updated design docs (the new ground truth):**
1. `CLAUDE.md` — project instructions
2. `docs/architecture.md` — updated architecture (Claude-first)
3. `docs/foundations.md` — updated foundations
4. `docs/decisions.md` — all decisions including D045-D047

**Files you will modify:**
5. `agents/main.md` — main agent prompt
6. `agents/steering/safety.md` — safety rules
7. `agents/steering/conventions.md` — provenance, Obsidian conventions
8. `agents/steering/output.md` — voice and output rules
9. `agents/steering/system.md` — feature toggles, error recovery, system behavior

**Reference (read but don't modify):**
10. `agents/skills/sync.md` — read one skill to understand the current skill format and how it relates to main.md
11. `agents/skills/capture.md` — read a second skill to see multi-destination routing pattern
12. `docs/instructions/autonomous-build-plan.md` — golden rule, quality markers

After reading everything, before making any changes, think through and write down:
- How does Claude Code actually work at runtime? What does it load? How does it execute instructions? How does it handle MCP tools?
- What are the implications for how main.md should be structured?
- What are the implications for how steering files should be written?
- What changes do you see needed beyond what's listed in the steps below?

---

## Step 1 — Rethink `agents/main.md` for Claude Code

This is the most important file in the entire system. It becomes the core of what goes into the project's CLAUDE.md at install time.

### Starting points (what I know needs to change):

**1a. Skill-loading pattern** — The current main.md says "Load and follow the instructions in `agents/skills/{skill}.md`" with a note about Kiro CLI. Replace with Claude Code's natural mechanism: reading the file directly.

**1b. Steering file references** — Currently says they're "always loaded alongside this prompt." Think about what this means in Claude Code's model. Claude Code loads CLAUDE.md at session start — steering files need to either be included in it or read at session start.

**1c. Session Start** — Config file reading instructions. Consider whether these are clear enough for Claude Code.

**1d. Kiro-specific comments** — Remove the note about Kiro CLI skill-loading and adapter translation.

### Your job beyond these starting points:

**Think deeply about how Claude Code will actually execute this file.** At runtime, Claude Code:
- Reads CLAUDE.md automatically on session start
- Has MCP tools available natively
- Maintains conversation context across messages
- Can read files on demand using the Read tool
- Handles multi-step tasks across conversation turns

Ask yourself for EVERY section of main.md:
- **Does this section work correctly when Claude Code reads it?** Not "does it make sense as text" — does it actually produce the right behavior?
- **Is there anything Claude Code would misinterpret?** Patterns that worked for a different runtime might confuse Claude.
- **Is there anything Claude Code does naturally that we're over-specifying?** (Claude is good at routing by intent, reading files, using tools — don't teach it what it already knows.)
- **Is there anything Claude Code might get wrong that we're not guiding?** (Claude can be overly helpful, verbose, or eager to chain actions — guard against this where the design requires restraint.)
- **Does the routing logic make sense for a conversational agent?** Claude Code handles conversations — does the routing account for multi-turn interactions, follow-up questions, ambiguity resolution?
- **How do direct operations actually work with MCP?** The vault search, link find, task completion — do these descriptions align with how Claude Code would use the obsidian-cli MCP tools?

Consider creating an INSTALL-NOTES.md or a section in main.md that documents how the pieces connect in Claude Code's model (CLAUDE.md → main.md → steering → skills → MCP), so the install script author in Prompt 4 understands the wiring.

---

## Step 2 — Review and optimize each steering file

For each of the 4 steering files, read it fully and think about what Claude-first means for it. These files contain cross-cutting rules — most are behavioral and tool-agnostic. But don't assume nothing needs to change.

### 2a. `agents/steering/safety.md`

**Starting points:** Draft-never-send, vault-only writes, external-content-as-data framing, calendar D003 protection, bulk write confirmation. These are behavioral rules that should mostly work as-is.

**Think deeper:** Claude Code has specific capabilities and behaviors. How does Claude handle the external-content-as-data framing in practice? Does the delimiter approach work well with Claude's prompt processing? Calendar D003 mentions "where AI tool supports hooks" — Claude Code supports hooks. Should the safety file reference Claude Code's hook mechanism specifically, or stay generic? Are there Claude-specific safety considerations not covered? (e.g., Claude's eagerness to be helpful might lead it to offer to "help send" a draft — is that guarded against?)

### 2b. `agents/steering/conventions.md`

**Starting points:** Provenance markers, append-only discipline, Obsidian syntax. Likely tool-agnostic.

**Think deeper:** Are there any conventions that were designed around limitations of other LLMs? Anything Claude handles differently? Does the append-only discipline interact with Claude Code's file editing tools in ways that need guidance?

### 2c. `agents/steering/output.md`

**Starting points:** Voice rules, BLUF, output formatting. Likely tool-agnostic.

**Think deeper:** Claude has specific output tendencies — verbosity, hedging language ("I'd be happy to..."), bullet-point overuse. Does the output steering need to explicitly counteract any Claude-specific tendencies? Are there places where Claude's natural voice is fine and the steering is over-constraining?

### 2d. `agents/steering/system.md`

**Starting points:** Feature toggles, config reload, error recovery, fuzzy name resolution. Check for Kiro references.

**Think deeper:** How does config reload work in Claude Code's conversation model? If the user changes a config file mid-conversation, how does Claude know to re-read it? Does the error recovery guidance make sense for Claude Code's MCP error handling? Is the prompt logging mechanism relevant for Claude Code?

---

## Step 3 — Design the CLAUDE.md wiring

This doesn't create the final CLAUDE.md (that's the install script's job in Prompt 4). But you need to document how the pieces connect so Prompt 4 has clear requirements.

Think about and document:

1. **What goes into CLAUDE.md** vs. what Claude reads at session start vs. what Claude reads on demand?
   - Critical safety rules might belong directly in CLAUDE.md (always in context)
   - Steering files could be read at session start (loaded into context once)
   - Skill files are read on demand (loaded when routing activates them)
   - Config files are read at session start

2. **How does Claude know where the files are?** Paths in CLAUDE.md need to resolve correctly. Think about the path strategy (absolute vs relative, repo location vs vault location).

3. **What's the skill activation flow?** User says something → main agent routes → Claude reads skill file → Claude follows skill instructions. Is this seamless in Claude Code?

4. **What about conversation persistence?** Claude Code maintains context. Once steering rules are read, they stay in context. Once config is read, it stays. How does this affect the design?

Document this in `agents/INSTALL-NOTES.md` (new file) or as a clearly marked section in `agents/main.md`.

---

## Step 4 — Self-review (3 rounds)

**Round 1 — Coherence Check**

Spawn a fresh subagent that reads `docs/architecture.md`, `agents/main.md`, all 4 `agents/steering/*.md` files, and `agents/INSTALL-NOTES.md` (if created). Ask:

> "You are a coherence checker for an AI assistant called Myna that runs on Claude Code. Read these files and check:
> (1) Does main.md match the architecture doc's description of how the agent works?
> (2) Are there ANY remaining references to Kiro CLI, adapter layers, or tool-neutral constraints? Search for: 'Kiro', 'kiro', 'adapter', 'tool-neutral', 'tool-agnostic', 'content layer', 'portability'.
> (3) Is the skill-loading mechanism clear and unambiguous for Claude Code?
> (4) Do the steering files reference any mechanisms that don't exist in Claude Code?
> (5) Is the CLAUDE.md wiring design clear enough for someone to write an install script?
> (6) Are there any concepts or patterns that feel vestigial — like they belonged to a previous design?
> (7) Anything else that seems wrong, confusing, or incomplete?"

Fix every issue found.

**Round 2 — Runtime Simulation**

Spawn a fresh subagent that reads ONLY `agents/main.md` and the 4 steering files (simulating what Claude Code would see at runtime, minus the skills). Ask:

> "Pretend you are Claude Code and these instructions were just loaded. Walk through each scenario step by step — what you'd read, what you'd do, and what you'd tell the user:
> (1) User says 'sync'. How do you activate the sync skill? What's the exact sequence?
> (2) User says 'capture: auth migration unblocked — Sarah resolved the API spec issue'. Same.
> (3) User says 'send this email to Sarah'. This should be refused. What happens?
> (4) User says 'help'. What do you show?
> (5) User says 'what's the status of auth migration?' — this is ambiguous (brief? draft?). What happens?
> (6) User says 'done with 1:1 with Sarah'. This goes through Universal Done. What's the exact flow?
> For each scenario, flag: anything unclear, anything you'd have to guess, anything where the instructions conflict."

Fix every issue found.

**Round 3 — Claude-Specific Behavioral Audit**

Spawn a fresh subagent that reads `agents/main.md` and all 4 steering files. Ask:

> "You are an expert on Claude's behavioral tendencies. Read these agent instructions and flag places where Claude's natural behavior might cause problems:
> (1) Claude tends to be verbose — are there skills/operations where Claude might produce too much output? Is this guarded against?
> (2) Claude tends to be eager to help — are there places where Claude might try to do more than the skill specifies (chain actions, offer unsolicited suggestions, anticipate next steps beyond what's allowed)?
> (3) Claude tends to use hedging language ('I'd be happy to...', 'Let me...') — do the output rules address this?
> (4) Claude tends to ask for confirmation frequently — does the agent need to balance safety confirmations vs. flow?
> (5) Claude may summarize what it just did at length — is there guidance on output brevity for routine operations?
> (6) Any other Claude-specific behavioral patterns that these instructions should account for?"

Fix every issue found.

---

## Rules

1. **Only modify files under `agents/` — specifically `main.md`, `steering/*.md`, and optionally create `INSTALL-NOTES.md`.** Do not touch `agents/skills/*.md` (Prompt 3) or `docs/` (Prompt 1 already handled).
2. **Apply the Golden Rule.** Don't add instructions Claude would follow without them. Don't over-specify Claude Code mechanics. But DO specify things Claude might get wrong.
3. **Keep steering files lean.** These are cross-cutting rules, not tutorials.
4. **Preserve routing logic.** The routing rules in main.md are well-tested. Improve them for Claude Code, but don't restructure without reason.
5. **Think independently.** The steps above are guidance. Find additional changes. If something listed doesn't need changing, skip it with a note.
6. **Three review rounds are mandatory.** Use fresh subagents. Fix all issues found after each round.

## Git

After all review rounds are complete and all issues are fixed:

1. **Commit and push.** Suggested message: `refactor: adapt main agent and steering files for Claude Code runtime` — but write your own based on what you actually changed.
2. **Never add Co-Authored-By lines.**
3. **Gitignored files:** `docs/dev-journal.md` and `docs/prompts/` are gitignored. Do NOT `git add` them.
4. **Stage specific files** — don't use `git add -A`. Add only the files you modified under `agents/`.

---

## Output files (expected modifications — you may find more)

1. `agents/main.md` — updated for Claude Code
2. `agents/steering/safety.md` — updated if needed
3. `agents/steering/conventions.md` — updated if needed
4. `agents/steering/output.md` — updated if needed
5. `agents/steering/system.md` — updated if needed
6. `agents/INSTALL-NOTES.md` — new file describing CLAUDE.md wiring design (if needed)

---

## Start

1. Read all context files (complete list above)
2. Think through and document: how does Claude Code work, what does that mean for these files, what changes do you see beyond the starting points?
3. Rethink main.md (Step 1) — my starting points + your own findings
4. Review and optimize each steering file (Step 2) — my starting points + your own findings
5. Design CLAUDE.md wiring (Step 3)
6. Self-review round 1, fix issues (Step 4)
7. Self-review round 2, fix issues (Step 4)
8. Self-review round 3, fix issues (Step 4)
9. Commit and push (see Git section)

Take your time. The main agent prompt is the backbone of the system — every skill depends on it being right.

# Create Slash Commands for Myna Development

Paste this entire prompt into a new Claude Code session (Opus + max). Run this AFTER the 4 Claude migration prompts are complete and committed.

---

You are building a set of reusable slash commands for the Myna project. These commands create a self-improvement loop that lets Claude iteratively review and improve Myna's agent artifacts (skills, steering files, main agent, configs) with minimal human involvement.

**Your job is to deeply understand the intent behind each command, then figure out the best implementation yourself.** I'll describe WHAT each command should accomplish and WHY — you decide HOW to implement it. Think about the user experience, the edge cases, and what makes each command genuinely useful vs. just mechanically checking boxes.

## Context

### What is Myna?

Read `CLAUDE.md`, `docs/architecture.md`, and `docs/decisions.md` to fully understand the project. In short: Myna is a local-first AI assistant built as a set of agent instructions for Claude Code. The key artifacts are:

- `agents/main.md` — main agent prompt (routing, session start, direct operations)
- `agents/steering/*.md` — 4 cross-cutting rule files (safety, conventions, output, system)
- `agents/skills/*.md` — 14 skill files (the core product — what users experience)
- `agents/mcp/obsidian-cli/` — MCP server (TypeScript)
- `agents/config-examples/*.yaml.example` — 6 config templates
- `agents/claude-md-template.md` — CLAUDE.md template for install
- `docs/features/*.md` — 10 feature specification files (authoritative source of what's being built)
- `docs/foundations.md` — vault structure, templates, config schemas, patterns
- `docs/instructions/autonomous-build-plan.md` — contains the Golden Rule for writing agent instructions

### What are these commands for?

After building or modifying Myna's artifacts, the developer (me) wants to iteratively improve them without manually reading every file and finding issues. The commands create a loop:

```
/myna-review → (optionally edit report) → /myna-fix → /myna-verify → done or repeat
```

- If I have time: I review the report, edit it, pick which issues to fix, then run /myna-fix
- If I don't have time: I run /myna-review → /myna-fix --auto → /myna-verify and trust Claude's judgment
- I can run this loop 2-3 times until the review finds 0 Critical + 0 Important issues

The commands are also useful independently — /myna-coverage as a quick check after changing a skill, /myna-consistency after batch changes, etc.

### Claude Code custom commands

Commands live in `.claude/commands/` as markdown files. Read the Claude Code documentation or existing commands (if any) in that directory to understand the format. Each command is a markdown file that defines a prompt. The filename (minus .md) becomes the command name. Commands can accept arguments via `$ARGUMENTS`.

## What to read before building

1. `CLAUDE.md` — project instructions
2. `docs/architecture.md` — understand the agent structure, skill inventory, how everything connects
3. `docs/foundations.md` — vault structure, templates, config schemas, entry formats
4. `docs/features/*.md` — all 10 feature files (the authoritative feature specs)
5. `docs/instructions/autonomous-build-plan.md` — the Golden Rule section and calibration example
6. `agents/main.md` — understand the main agent
7. `agents/steering/*.md` — understand the steering files
8. Read 3-4 skill files to understand the skill format and quality level
9. `docs/phase1-review.md` and `docs/phase1-review-2.md` — understand what a good review looks like for this project
10. Check `.claude/commands/` for existing command format

---

## The 6 Commands to Build

### 1. `/myna-review` — The Critic

**Intent:** Act as a Senior Principal Software Developer reviewing Myna's agent artifacts. Find real issues that would make the assistant worse for users. Produce a structured report with severity ratings, multiple options per issue, and a recommended option with reasoning.

**What makes a good review for Myna specifically:**

This is NOT a generic code review. The artifacts being reviewed are LLM instructions — they need to be evaluated on a completely different axis than regular code. Think about:

- **Instruction clarity:** Would Claude know exactly what to do at every step? Or would it have to guess?
- **Output usefulness:** When Claude follows these instructions, would the output actually help a tech professional? Or would it be generic AI slop?
- **Claude behavioral fit:** Does the instruction account for Claude's specific tendencies (verbosity, over-helpfulness, hedging language, over-confirmation)?
- **Feature completeness:** Is every feature from the feature spec files fully addressed — not just mentioned but executable?
- **Cross-file consistency:** Do skills that write to the same vault locations produce identical formatting?
- **Golden Rule compliance:** Does every instruction line earn its place? Would Claude get it wrong without this line?
- **Edge cases:** First run (empty vault), missing files, ambiguous entities, empty results, bulk operations
- **Safety:** Draft-never-send, vault-only writes, no skill chaining, calendar protection

**The report must be actionable.** For each issue: what's wrong (with quoted text), why it matters, 2-3 concrete options to fix it, and which option is recommended with reasoning. Severity rating: Critical (breaks functionality), Important (degrades quality), Minor (polish), Nitpick (style preference).

**What the review must NOT do:**
- Suggest new features beyond v1 scope
- Over-specify things Claude handles naturally (violating the Golden Rule in the other direction)
- Manufacture issues to look thorough — if something is fine, say it's fine
- Re-raise issues that were already addressed in a previous cycle (if previous review reports exist, read them)

**The convergence signal:** The report includes a summary with severity counts. When the summary shows 0 Critical + 0 Important, the loop can stop.

**Guard against oscillation:** If this isn't the first review cycle, the command must read previous review reports AND previous fix reports. If a previous fix report says "No change — [reasoning]" for an issue, the reviewer should not re-raise the same issue unless it has new evidence the pushback was wrong.

### 2. `/myna-fix` — The Implementer

**Intent:** Read the latest review report and implement fixes. But NOT as a blind executor — as a thoughtful implementer who can push back on bad recommendations.

**Two modes:**
- **Default mode:** For each issue in the review, implement the recommended fix OR push back with documented reasoning. Pushback is critical for preventing oscillation — if a recommendation would make things worse, say so and explain why. The fix report should document every decision: "Implemented option B because..." or "No change — the current approach is correct because..."
- **Auto mode (--auto or similar):** Implement all recommendations without pushback. For when the user trusts the reviewer and doesn't want to wait. Still documents what was done.
- **Selective mode (specific issue IDs):** Only fix the listed issues. For when the user reviewed the report and picked which ones to address.

**After implementing fixes:**
- Run a self-verification: re-read the changed files and confirm the fixes make sense in context
- Check that fixes didn't introduce new inconsistencies (especially cross-skill formatting)
- Commit with a descriptive message

**The fix report:** Saved alongside the review report. Documents every decision. This becomes input for the next /myna-review cycle to prevent oscillation.

### 3. `/myna-verify` — The Closer

**Intent:** After /myna-fix runs, verify that the fixes actually resolved the issues and didn't introduce regressions. This closes the loop — it's the "did it actually work?" check.

**What verification means:**
- Read the review report (what issues were found)
- Read the fix report (what was done about each)
- Read the actual files (what they look like now)
- For each fixed issue: does the file now address the concern? Or was the fix superficial/wrong?
- For pushed-back issues: is the pushback reasoning sound?
- Regression check: did any fix break something else? (Especially cross-skill consistency)
- Produce a clean/not-clean verdict with reasoning

**If clean:** Report says "All issues resolved. Recommend: stop iterating." The user can stop.
**If not clean:** Report says what's still wrong. The user runs /myna-review again (it will pick up the remaining issues).

### 4. `/myna-coverage` — Feature Coverage Audit

**Intent:** Quick, focused check that every feature from the feature specification files is fully implemented in the corresponding skill files. This is a specific dimension of /myna-review, but useful as a standalone command for quick checks after changing a skill.

**What "fully covered" means:**
- Not just mentioned in the skill file — the skill's Procedure section has executable instructions for it
- Sub-features, edge cases, and decision criteria from the feature spec are addressed
- Coverage is graded: FULL (everything from spec is in skill), PARTIAL (some details missing — list what), NONE (feature not addressed)

**Output:** A coverage matrix (feature × skill) with grades. Any PARTIAL or NONE entries are highlighted with what's missing.

### 5. `/myna-consistency` — Cross-Skill Formatting Check

**Intent:** Check that skills writing to the same vault destinations produce identical formatting. This is the #1 source of real bugs in Myna — if two skills format timeline entries differently, the vault becomes inconsistent over time.

**What to check (at minimum — you should think about what else matters):**
- Project timeline entries (process, process-meeting, capture)
- Person file observations (process, process-meeting, capture)
- Contributions log (wrap-up, process, process-meeting, capture, self-track)
- Task TODOs (process, capture, process-meeting)
- Review queue entries (process, process-meeting, capture, triage)

**Output:** For each shared destination: the format each skill produces, whether they match, and if not, what the difference is and which skill is correct (based on foundations.md templates).

### 6. `/myna-improve` — The Full Pipeline

**Intent:** Run the complete review-fix-verify loop autonomously. One command, walk away, come back to improved files. This is the "I don't have time, just make it better" command.

**What it does:**

1. Run `/myna-review` (produces report)
2. Run `/myna-fix --auto` (implements all recommendations)
3. Run `/myna-verify` (checks if fixes worked)
4. If verify says "not clean" AND cycle count < max (default 3): go to step 1
5. If verify says "clean" OR max cycles reached: stop, print summary

**The summary** after all cycles should show:
- How many cycles ran
- Total issues found across all cycles, by severity
- Total issues fixed
- Issues remaining (if stopped at max cycles)
- Files modified
- Commits created

**Targeting:** Accepts the same targeting arguments as the individual commands. `/myna-improve agents/skills/` improves only skills. `/myna-improve --uncommitted` improves only changed files. Default: all agent artifacts.

**Max cycles:** Default 3. User can override: `/myna-improve --cycles 5`. But warn: beyond 3 cycles, diminishing returns and oscillation risk increase.

**Guard against runaway loops:** If cycle N finds MORE issues than cycle N-1, something is wrong (oscillation or the fixes are introducing problems). Stop and report: "Cycle {N} found more issues than cycle {N-1}. Stopping to avoid oscillation. Review the reports manually."

---

## Targeting — How All Commands Select Files

All 6 commands need to work on different scopes. The user should be able to say:

- **Specific file(s):** `/myna-review agents/skills/sync.md agents/skills/capture.md`
- **Directory:** `/myna-review agents/skills/`
- **File pattern:** `/myna-review agents/skills/*.md` or `/myna-review **/*.md`
- **Uncommitted changes:** `/myna-review --uncommitted` (only files with uncommitted changes)
- **Everything (default):** `/myna-review` with no arguments = review all agent artifacts

Think carefully about how to implement this consistently across all commands. The targeting logic should be shared, not reimplemented per command. Consider:
- How do you resolve patterns to actual file paths?
- What's the default scope for each command? (/myna-review defaults to all agents, /myna-consistency always checks all skills, etc.)
- How do you handle invalid paths or patterns with no matches?
- For --uncommitted: use git to find changed files, then apply the relevant command to only those

---

## Quality Expectations

**These commands will be run many times.** They need to be:

- **Genuinely useful** — every run should surface real insights, not boilerplate
- **Context-aware** — they read the actual project docs, not generic review checklists
- **Myna-specific** — they know about the Golden Rule, provenance markers, vault structure, feature toggles, draft-never-send, etc. because they read the project docs
- **Stable** — running /myna-review twice on the same unchanged files should find roughly the same issues, not wildly different ones
- **Honest** — if something is fine, say it's fine. Don't inflate issue counts.

**Test each command mentally before finalizing.** Imagine running `/myna-review agents/skills/sync.md` — what would happen step by step? Would the output be useful? Now imagine `/myna-review --uncommitted` after changing 3 skill files — would it handle that correctly? Now imagine `/myna-fix --auto` on a report with 8 issues — would the commits be clean?

---

## Implementation Notes

- Read the Claude Code documentation or any existing commands to understand the command format
- Each command gets its own `.md` file in `.claude/commands/`
- Think about where review/myna-fix reports should be saved and how they're named to support multiple cycles
- Think about how commands discover project context (they need to know where feature files, skill files, etc. live — maybe they read CLAUDE.md or architecture.md at the start)
- Consider whether any shared logic (targeting, project context loading) should be documented in a shared file that commands reference
- Commit all commands when done

---

## Rules

1. **Understand intent, decide implementation.** I've told you WHAT and WHY. You figure out HOW.
2. **Read the Myna project docs first.** These commands are Myna-specific, not generic. They should reference Myna's architecture, Golden Rule, feature files, etc.
3. **Keep commands focused.** Each command does one thing well. Don't combine /myna-review and /myna-fix into one command "for convenience."
4. **Think about the loop.** The commands work together: review → fix → verify. Design them so they read each other's output cleanly.
5. **Test mentally.** Before committing, simulate running each command on different scopes and check the experience makes sense.
6. **Commit and push when done.** Never add Co-Authored-By lines. `docs/dev-journal.md` and `docs/prompts/` are gitignored.

---

## Start

1. Read all Myna context files (CLAUDE.md, architecture, foundations, features, Golden Rule, steering, sample skills, existing review reports)
2. Read Claude Code command format documentation / examples
3. Think about the design: report format, naming, targeting, shared patterns
4. Build all 6 commands
5. Test each mentally with realistic scenarios
6. Commit and push

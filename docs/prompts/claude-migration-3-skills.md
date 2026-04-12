# Claude Migration — Prompt 3: Skill Prompt Optimization

Paste this entire prompt into a new Claude Code session (Opus + max). Run this AFTER Prompts 1 (docs) and 2 (agent + steering) are complete and committed.

---

You are the orchestrator for optimizing Myna's 14 skill files for Claude Code as the native runtime. The design docs, main agent, and steering files have already been updated. Your job is to make every skill work as well as possible when executed by Claude.

**This is the most important prompt in the migration. Skill quality is what users feel directly.**

You will develop an optimization strategy, then spawn subagents to optimize skill batches, each with their own review rounds. After all batches complete, you do cross-skill consistency checks and final reviews. This is a long session. Take your time.

## Context

Myna switched from a tool-agnostic design to a Claude-first design:

- **D045:** Claude Code is the v1 runtime.
- **D046:** The tool-agnostic constraint is lifted. Skills can reference Claude Code capabilities directly.
- **D047:** No adapter layer. Skills are read directly by Claude Code at runtime.

The main agent (`agents/main.md`) has been updated. When Claude routes to a skill, it reads the skill file directly and follows its instructions. Steering files are already in context. Config files have been read at session start.

## What "Claude-optimized" means — internalize this before doing anything

**Claude's strengths to leverage:**
- Follows structured instructions well — clear section headers, numbered steps, decision trees
- Handles MCP tool calls natively — can reference obsidian-cli tools by name
- Respects context hierarchy — steering rules and config already in context, don't repeat them
- Good at judgment calls when given clear criteria + illustrative examples
- Thorough by default — rarely needs "make sure to check all..." or "don't skip"
- Chains through multi-step reasoning naturally when steps are well-structured

**Claude's weaknesses to guard against:**
- Can be too helpful — adding suggestions, extra context, follow-up actions beyond what's specified
- Can be verbose — walls of text when concise output is better
- Tends to hedge ("I'd be happy to...", "Let me...")
- May over-confirm — asking "should I proceed?" at every step
- Can lose focus in very long procedures — needs clear phase breaks for 15+ step procedures
- Might chain skills or suggest follow-ups even though D039 says no automatic chaining

**Portability hedging to remove:**
- Generic MCP references ("use the appropriate MCP operation") → name specific tools
- Instructions that exist because "a different LLM might not handle this"
- Over-specification of natural language tasks (parsing, extraction, classification)
- "Read the file carefully" — Claude always reads carefully

## What to read

Read ALL of these files completely before developing your strategy. Do NOT start spawning subagents after reading a few files.

**Updated design docs (ground truth):**
1. `CLAUDE.md` — project instructions
2. `docs/architecture.md` — updated architecture (Claude-first)
3. `docs/foundations.md` — templates, config schemas, conventions, patterns
4. `docs/decisions.md` — all decisions including D045-D047

**Updated agent files (from Prompt 2):**
5. `agents/main.md` — updated main agent
6. `agents/steering/safety.md`
7. `agents/steering/conventions.md`
8. `agents/steering/output.md`
9. `agents/steering/system.md`

**Skill files (what subagents will modify):**
10-23. All 14 files under `agents/skills/`: sync, process, triage, prep-meeting, process-meeting, brief, capture, draft, calendar, wrap-up, review, self-track, park, draft-replies

**Quality reference:**
24. `docs/instructions/autonomous-build-plan.md` — read ONLY the "Golden Rule" section and the calibration example (good vs bad instruction writing). The build plan itself is complete and not relevant here.
25. `docs/features/*.md` — all 10 feature files (authoritative feature specs)

**Phase 1 review findings:**
26. `docs/phase1-review.md` — first deep review
27. `docs/phase1-review-2.md` — second deep review (23 issues, 2 critical)

---

## Phase 1 — Develop and Refine Optimization Strategy

After reading everything, write down your strategy before spawning any subagents. This strategy gets passed to every subagent so they all apply changes consistently. **The strategy itself goes through 2 review-and-fix rounds before any subagent spawns** — if the strategy is wrong or incomplete, all 8 subagents build on bad ground.

### 1a. Systematic patterns

Identify changes that apply to most or all skills:
- Kiro-specific patterns to remove
- Over-specification patterns to trim (portability hedging, teaching Claude what it knows)
- Generic MCP references to make specific
- Redundant steering rule repetitions to replace with references
- Claude-specific guard rails to add

### 1b. Per-skill issues

For each of the 14 skills, note:
- Any skill-specific problems you see
- Feature coverage gaps (compare against feature files)
- Phase 1 review issues that are still unresolved

Known unresolved issues from Phase 1 reviews (but check the actual review files — there may be more):
- Triage feature incompleteness (I1 from review 2)
- Brief's 1:1 Pattern Analysis incompleteness (I3)
- Performance Narrative incompleteness (I4)
- Attention Gap surfacing incompleteness (I5)
- Monthly Update Generation incompleteness (I12)
- Team Health Tracking incompleteness (I13)
- Missing worked examples in several skills

### 1c. Claude optimization ideas

For each skill, think: "If I were Claude executing this skill, what would I struggle with? What would I over-do? What would I miss? What output would be unhelpful to the user?" Write these down per skill.

### 1d. Strategy Review — Round 1

Spawn a fresh subagent. Give it your complete strategy (1a + 1b + 1c), ALL 14 skill files, ALL 10 feature files, and both Phase 1 review reports. Ask:

> "You are reviewing an optimization strategy for 14 Myna skill files being migrated to Claude Code. Read the strategy, then read ALL 14 skill files and ALL feature files independently. Check:
> (1) **What did the strategy miss?** Are there systematic patterns across skills that the strategy doesn't address? List them.
> (2) **Are any per-skill issues wrong or incomplete?** For each of the 14 skills, what issues would YOU flag that the strategy doesn't mention?
> (3) **Are the Claude optimization ideas realistic?** Do they actually match how Claude behaves, or are they based on assumptions?
> (4) **Phase 1 review coverage:** Read both review files. Are there Critical or Important issues the strategy missed?
> (5) **Feature coverage:** Spot-check 5 skills against their feature files. Are there feature gaps the strategy doesn't flag?
> (6) **What would you do differently?** If you were optimizing these skills, what approach would you take that the strategy doesn't describe?"

**Fix your strategy based on all findings.** Add missing patterns, correct wrong assessments, add missing per-skill issues.

### 1e. Strategy Review — Round 2

Spawn a DIFFERENT fresh subagent. Give it your UPDATED strategy and ALL 14 skill files. Ask:

> "You are the second reviewer of an optimization strategy for 14 Myna skill files. The strategy has already been through one review round. Read it with fresh eyes:
> (1) Is the strategy complete enough that 8 independent subagents could apply it consistently without coordination?
> (2) Are the systematic patterns clear and actionable — would two different subagents interpret them the same way?
> (3) Are there any contradictions in the strategy (e.g., 'remove over-specification' conflicting with 'add Claude-specific guard rails')?
> (4) Pick the 3 most complex skills (brief, draft, process). For each, walk through the strategy's per-skill issues and Claude optimization ideas — are they sufficient, or would the subagent need to figure out a lot on its own?
> (5) Anything else that's wrong, missing, or unclear?"

**Fix your strategy based on all findings.** This is the final version that goes to subagents.

---

## Phase 2 — Spawn Subagents per Skill Batch

Spawn 8 subagents, one per batch. Related skills are grouped together so shared patterns stay consistent within each batch.

| Batch | Skills | Why together |
|-------|--------|-------------|
| 1 | capture | Reference skill, multi-destination routing patterns |
| 2 | sync, wrap-up | Day bookends, share daily note writes |
| 3 | triage, process | Email pipeline, sequential workflow |
| 4 | prep-meeting, process-meeting | Meeting lifecycle, share meeting file formats |
| 5 | brief | Standalone, read-heavy, complex |
| 6 | draft, draft-replies | Writing skills, share draft conventions |
| 7 | calendar | Standalone |
| 8 | review, self-track, park | Queue processing, tracking, context management |

### Subagent prompt template

Each subagent gets:

**Context files:** `docs/architecture.md`, `docs/foundations.md`, `agents/main.md`, all 4 `agents/steering/*.md`, the Golden Rule section from `docs/instructions/autonomous-build-plan.md` (just that section — the build plan itself is complete)

**Skill-specific files:** The skill file(s) for this batch + corresponding `docs/features/*.md` file(s)

**The optimization strategy** you developed in Phase 1 (systematic patterns + per-skill issues + Claude optimization ideas for these specific skills)

**Phase 1 review issues** relevant to these skills (quote the specific issues from the review files)

**Instructions for each subagent:**

> You are optimizing {N} Myna skill file(s) for Claude Code: {list skills}.
>
> ## What you receive
> - The optimization strategy (systematic patterns to apply + skill-specific issues to fix + Claude optimization ideas). **This strategy is a starting point, not an exhaustive list.** It has been through 2 review rounds but may still have missed things specific to your skills. You are expected to find additional changes independently.
> - The skill file(s) to modify
> - The feature file(s) with authoritative feature specs
> - The design docs and steering files (for reference — do not modify)
> - Phase 1 review issues relevant to these skills
>
> ## What to do for each skill
>
> **Step 0: Independent analysis.** BEFORE applying the strategy, read each skill file and its corresponding feature file(s) with fresh eyes. Write down:
> - What would YOU change about this skill for Claude Code, independent of the strategy?
> - What issues do you see that the strategy doesn't mention?
> - What's working well that shouldn't be changed?
> Then compare your analysis against the strategy. Your final changes should be the UNION of both — everything from the strategy PLUS everything you found independently.
>
> **Step 1: Apply systematic changes** from the optimization strategy (Kiro references, over-specification, MCP naming, steering deduplication, etc.)
>
> **Step 2: Claude-specific optimization** — the deep work. For each skill, think about:
> - Procedure structure: optimized for how Claude processes instructions?
> - MCP tool usage: specific tools named where it helps clarity?
> - Output expectations: what would Claude actually produce? Would it be useful, too verbose, too generic?
> - Guard rails: where might Claude go beyond what's asked or under-deliver?
> - Decision criteria: is every "determine the appropriate X" backed by clear criteria or principles + examples?
> - Worked examples: realistic, complete, showing full chain (input → reads → decisions → writes → user sees)?
>
> **Step 3: Fix Phase 1 review issues** for these skills. Don't just patch — integrate fixes naturally into the optimized skill.
>
> **Step 4: Feature coverage check** — re-read the feature file(s). For every feature under `## Features`, verify the skill's Procedure fully addresses it (not just mentions it, but provides executable instructions). List any gaps.
>
> **Step 5: Apply your independent findings from Step 0.** Anything you identified that the strategy missed — apply it now. The strategy is the floor, not the ceiling.
>
> ## Self-review (3 rounds)
>
> After optimizing, run 3 review rounds. **Each round: spawn reviewer → read findings → fix ALL issues in the skill file(s) → verify fixes → then start next round.** Do not batch fixes to the end. Do not skip issues. Every review finding must result in either a fix or a documented reason why no fix is needed.
>
> **Review 1 — Golden Rule Audit:**
> Spawn a subagent with the Golden Rule definition from autonomous-build-plan.md and the updated skill file(s). Ask:
> "For every line in these skill files, ask: would Claude get this wrong without this instruction? Flag: (1) Lines teaching Claude what it knows. (2) Multi-step procedures that could be one sentence. (3) Guardrails against laziness (Claude doesn't need these). (4) Redundant steering rule repetitions. (5) Any remaining Kiro/adapter/portability references. For each flag: quote the text, recommend delete/shorten/keep."
> **Then: fix every flagged issue before proceeding to Review 2.**
>
> **Review 2 — Feature Coverage Verification:**
> Spawn a subagent with the updated skill file(s) (post-Review-1 fixes) and the corresponding feature file(s). Ask:
> "For EVERY feature in the feature file(s) under ## Features, check the skill's Procedure fully addresses it. State: feature name, coverage status (FULL/PARTIAL/NONE), what's missing if partial or none."
> **Then: fix every PARTIAL or NONE finding before proceeding to Review 3.**
>
> **Review 3 — Instruction Clarity Simulation:**
> Spawn a subagent with agents/main.md, all 4 steering files, and the updated skill file(s) (post-Review-1-and-2 fixes). Ask:
> "Pretend you are Claude Code. The main agent routed to this skill. Walk through {a realistic scenario for this skill} step by step. At each step, state what you'd do and flag: (a) Any point where the instructions are ambiguous and you'd have to guess what to do. (b) Any missing step — you know what should happen but the instructions don't say it. (c) Any contradictions with steering rules or main agent. (d) Any decision point where the criteria aren't clear enough."
> Note: this simulation tests instruction clarity (would Claude know what to do at every step?), not end-to-end output quality (that's real-world testing in Phase 3).
> **Then: fix every issue found.**

---

## Phase 3 — Cross-Skill Consistency Check

After ALL 8 subagents complete, you (the orchestrator) read all 14 updated skill files and check:

### 3a. Shared write destinations

Skills that write to the same vault locations MUST produce identical formatting. Check each group:

- **Project timeline entries:** process, process-meeting, capture — same format? Same date header? Same indentation?
- **Person file observations:** process, process-meeting, capture — same section? Same entry format?
- **Contributions log:** wrap-up, process, process-meeting, capture, self-track — same format?
- **Task TODOs:** process, capture, process-meeting — same Obsidian Tasks syntax? Same fields?
- **Review queue entries:** process, process-meeting, capture, triage — same entry format per queue?

If two skills produce different formats for the same destination, fix them to match. Use the format from the skill that got it right, or standardize based on foundations.md.

### 3b. Voice consistency

Do all 14 skills feel like one coherent system? Check:
- File-not-found handling — consistent language?
- Ambiguous entity resolution — consistent approach?
- Output confirmation messages — consistent structure?
- Follow-up suggestions — consistent phrasing? (All should suggest, none should auto-invoke)

### 3c. Steering references

All skills reference steering files the same way (e.g., "per conventions.md" — not "as described in the conventions steering file" in one and "see steering/conventions.md" in another).

### 3d. No-chaining discipline

Every skill that suggests a follow-up action does so as a suggestion to the user, never as an automatic invocation. Verify across all 14.

---

## Phase 4 — Final Orchestrator Reviews (3 rounds)

These see ALL 14 skills together. **Each round: spawn reviewer → read findings → fix ALL issues → verify fixes → then start next round.** Every finding must result in a fix or a documented reason why no fix is needed.

### Review 1 — Cross-Skill Golden Rule Audit

Spawn a fresh subagent with `docs/instructions/autonomous-build-plan.md` and ALL 14 updated skill files. Ask:

> "You are auditing 14 skill files for an AI assistant called Myna that runs on Claude Code. Apply the Golden Rule ('would Claude get this wrong without this instruction?') across ALL skills as a set.
> (1) Are there patterns of over-specification that appear across multiple skills? (Same unnecessary instruction repeated in 5+ skills = systematic issue.)
> (2) Are there patterns of under-specification? (Same type of decision left vague across multiple skills.)
> (3) Do all skills apply MCP tool naming consistently?
> (4) Do all skills handle edge cases (missing files, empty results, ambiguous entities) consistently?
> (5) Any remaining Kiro/adapter/portability references in ANY skill?
> Flag patterns, not individual instances. For each pattern, list affected skills."

**Fix all flagged patterns across the affected skills before proceeding.**

### Review 2 — Full Feature Coverage

Spawn a fresh subagent with ALL 14 skill files, ALL 10 `docs/features/*.md`, and both `docs/phase1-review.md` and `docs/phase1-review-2.md`. Ask:

> "Verify complete feature coverage and Phase 1 issue resolution.
> **Part A:** For EVERY feature under '## Features' in every feature file, state: feature name, source file, which skill covers it, coverage (FULL/PARTIAL/NONE), what's missing if not full.
> **Part B:** For every Critical and Important issue in both Phase 1 review files that relates to skill files, state: issue ID, description, status (FIXED/PARTIALLY FIXED/STILL OPEN)."

**Fix all PARTIAL/NONE coverage findings and STILL OPEN issues before proceeding.**

### Review 3 — Full-Day Runtime Simulation

Spawn a fresh subagent with `agents/main.md`, all 4 steering files, and ALL 14 skill files. Ask:

> "Pretend you are Claude Code running Myna. Walk through a complete day — at each step, state exactly what you'd do and flag instruction clarity issues (would you know what to do at every step? would you have to guess anywhere?).
>
> 1. **8:30 AM — sync.** 3 meetings today, 2 overdue tasks, 4 review queue items. It's Monday (weekly note needed).
> 2. **9:00 AM — process email.** 5 new emails: timeline update, task delegation, meeting summary, FYI, near-duplicate.
> 3. **10:00 AM — triage inbox.** 8 inbox emails to classify.
> 4. **10:30 AM — prep for 1:1 with Sarah.** Sarah has carry-forward items, overdue delegation, pending feedback.
> 5. **11:30 AM — done with 1:1 with Sarah.** Notes taken: 2 action items, 1 decision, 1 observation.
> 6. **1:00 PM — capture.** 'capture: Sarah resolved the API blocker, auth migration moving to implementation, great work by Sarah.'
> 7. **2:00 PM — draft status update for auth migration for VP.**
> 8. **3:00 PM — brief me on Sarah.**
> 9. **4:00 PM — review my queue.**
> 10. **5:00 PM — wrap up.**
> 11. **Edge case — sync on empty vault (first run).**
>
> For each scenario: (a) Any point where instructions are ambiguous. (b) Any inconsistent formatting between skills writing to the same destination. (c) Any output that wouldn't be useful. (d) Any step where you'd need information the instructions don't provide."

**Fix all issues found.**

---

## Rules

1. **Only modify files under `agents/skills/`.** Do not touch `agents/main.md`, `agents/steering/*.md`, or `docs/`.
2. **Apply the Golden Rule relentlessly.** Every line must earn its place. But don't strip necessary specificity — vault paths, config fields, entry formats, decision criteria must be precise.
3. **Preserve feature coverage.** Every feature from `docs/features/*.md` must remain fully covered.
4. **Keep worked examples realistic.** Specific names, dates, projects, content.
5. **Maintain skill file structure.** Purpose, Triggers, Inputs, Procedure, Output, Rules, Example sections.
6. **Think independently at every level.** The strategy is a starting point. Subagents should find additional issues. You should find cross-skill issues subagents missed.
7. **No Kiro CLI references should remain.** Zero tolerance.
8. **Subagents get 3 review rounds each. Orchestrator gets 3 review rounds. All mandatory.**

## Git

After all reviews are complete and all issues are fixed:

1. **Commit and push.** Suggested message: `refactor: optimize all 14 skill files for Claude Code runtime` — but write your own based on what actually changed. If you also fixed Phase 1 review issues, mention that.
2. **Never add Co-Authored-By lines.**
3. **Gitignored files:** `docs/dev-journal.md` and `docs/prompts/` are gitignored. Do NOT `git add` them.
4. **Stage specific files** — don't use `git add -A`. Add only the skill files you modified.

---

## Execution Summary

```
Phase 1: Read everything → develop optimization strategy
  1a-1c: Write strategy (systematic patterns + per-skill issues + Claude ideas)
  1d:    Strategy review round 1 → fix strategy
  1e:    Strategy review round 2 → finalize strategy
Phase 2: Spawn 8 subagents (one per skill batch)
  Each subagent:
    Step 0: Independent analysis (find issues strategy missed)
    Steps 1-5: Optimize (strategy + independent findings)
    3 self-review rounds: Golden Rule → fix → Feature coverage → fix → Simulation → fix
Phase 3: Cross-skill consistency check (you, the orchestrator)
Phase 4: 3 final review rounds (you spawn reviewers) → fix after each
Commit and push
```

Total review passes per skill: **2 strategy reviews + 3 within subagent + 3 at orchestrator level = 8 review passes.**

Take your time. The quality of these 14 files determines whether Myna is a useful assistant or a mediocre one.

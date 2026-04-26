---
name: myna-dev-diagnose
description: |
  Diagnose a Myna problem or proposed change — evaluates validity first (vision fit, audience, architecture, settled decisions, duplication), then generates options with a recommendation. Asks clarifying questions only when the answer would change the diagnosis. Use when: "something feels wrong with X", "I noticed a bug in Y", "should we change Z", "what if we added W", "is this a good idea".
argument-hint: "[describe the problem, bug, or proposed change]"
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Skill
  - AskUserQuestion
effort: max
---

# Myna Dev Diagnose

You are a senior Myna contributor evaluating whether a problem is real, a proposed change is valid, and if so — what the best fix or approach is. Two lenses in order: **validity first, implementation second**. Do not generate implementation options for something that shouldn't be built or changed.

This is a conversation, not a report. Be direct. If something is off, say so clearly and explain why. If it's valid, say so briefly and move on to options.

## Input

Check `$ARGUMENTS`:
- **If provided:** treat it as the problem or proposed change and proceed directly to Step 1 (Self-Evaluate Validity).
- **If empty:** ask the user: "What problem, bug, or proposed change do you want to evaluate?"

---

## Step 1 — Self-Evaluate Validity

Before asking the user anything, read the relevant sources and evaluate the problem yourself.

### 1a. Read foundational docs

Always read:
- `docs/vision.md` — local-first CoS for tech professionals, draft-never-send, vault-only
- `docs/decisions.md` — settled decisions; note any D-numbers that bear on this

Selectively read based on what's described:
- `docs/design/architecture.md` — if the problem touches skill routing, install, or agent structure
- Relevant `docs/features/[domain].md` — if the problem is about a specific feature domain

### 1b. Read the actual skill files

For skill duplication and current behavior checks: do not rely on `docs/design/architecture.md` — it may be outdated.

Glob the actual skills:
- `agents/skills/myna-*/SKILL.md` — Myna feature skills
- `agents/skills/myna-steering-*/SKILL.md` — steering skills (cross-cutting rules)

If the problem is about the dev tooling itself (this skill, execution-prompt, review, etc.):
- `.claude/skills/myna-dev-*/SKILL.md`

Read the specific skill files relevant to the problem. If the problem mentions a specific skill, read it in full.

### 1c. Evaluate these dimensions

Work through each. If a dimension is clearly fine, note it silently — don't narrate every check. Only surface findings that affect the decision.

**Vision fit — local-first CoS**
- Does this keep data in the vault and work offline? Anything that requires a persistent server, external database, or network call at runtime conflicts with local-first.
- Does this fit "Chief of Staff for tech professionals"? Target audience: engineering managers, tech leads, PMs, tech executives. Not general personal assistant tasks (book restaurants, life admin, general Q&A).
- Does this assist the user or decide for them? Myna informs and drafts — the user always makes the call. Features that auto-act on high-stakes inferences without confirmation are out.

**Draft-never-send**
- Does this involve any external action beyond read + draft + vault write? Calendar events with attendees, sending emails, posting Slack messages, submitting forms — all blocked. Personal calendar events with no attendees are the only exception.

**Settled decisions**
- Check every D-number in `docs/decisions.md` that bears on this. If a decision settles the question, surface it: "D0XX already settles this: [quote the decision]." Do not generate options that contradict settled decisions unless the user explicitly asks to revisit one.

**Deferred features**
- Is this something already explicitly deferred? If yes, flag it: "This was deferred per [D-number / roadmap note]. Is there a reason to revisit now?"

**Architecture fit**
- Is this consistent with: native Claude Code skills (markdown files in `~/.claude/skills/`), vault-only writes, no MCP server, no adapter layer? Anything that requires a new runtime component, custom MCP server, or non-Claude runtime is out of scope for v1 (D046).

**Skill duplication**
- Read the actual skill files (1b above). Does an existing feature skill or steering skill already handle this? If yes, the fix may be clarifying or extending that skill — not adding a new one.
- Specifically check: would this belong in a steering skill (applies across all features) or a feature skill (applies to one domain)?

**Accuracy and blast radius**
- If this involves Myna making autonomous inferences or judgments: how bad is it if Myna is wrong? Low-accuracy inference on high-consequence actions (deleting things, scheduling external commitments, sending anything) is a red flag. Flag this even if the idea is otherwise valid.

---

## Step 2 — Clarifying Questions (Dynamic)

After self-evaluating, identify what you still don't know that would change your options or recommendation. Ask only those things — in one shot, batched together. If you have enough, skip this step entirely and go straight to Step 3.

**Question bank** — only ask questions from this list, only when the condition is met:

| Question | Ask when |
|---|---|
| "Which skill file(s) are involved?" | Not named in the description and you cannot determine it from reading the files |
| "Is this behavior specific to one skill, or would the fix need to apply across all skills?" | Not clear from description — determines feature skill vs steering skill fix location |
| "Is the skill doing something wrong, or missing something it should do?" | Genuinely ambiguous — "wrong thing" and "missing thing" lead to different fix shapes |
| "If Myna infers this incorrectly, what's the consequence?" | The problem involves autonomous judgment calls with unclear blast radius |
| "Is this clearly CoS territory, or could it be seen as general personal assistant scope?" | The request sits in a gray area between chief-of-staff and personal-assistant tasks |
| "Can you share a specific example — what you asked Myna and what it did?" | The description is abstract enough that your options would be too vague to act on |

Format if asking:
```
Before I generate options, a couple of things I need to know:

1. [Question] — [one sentence on why it matters for the diagnosis]
2. [Question] — [why it matters]
```

Maximum 3 questions. If you'd need more than 3 to generate good options, ask the 3 most important ones and note what you're assuming for the rest.

---

## Step 3 — Validity Decision

Based on your reading and any answers to clarifying questions, make a validity call before generating options.

**VALID** — proceed to Step 4.

**FLAGGED** — surface the specific conflict:
```
This conflicts with [vision principle / D-number / architecture constraint]: [quote the relevant text].

[1-2 sentences on why this is a real conflict, not just a surface similarity.]

[If there's a valid adjacent idea worth exploring instead: "If the goal is [X], a valid framing would be [Y]."]
```
If flagged, do not generate implementation options. Ask if the user wants to revisit the settled decision or explore the alternative framing.

**CONDITIONAL** — valid but with a concern that should shape the options:
```
This is valid to pursue. One concern to keep in mind: [specific risk — accuracy, blast radius, audience fit].
This concern should factor into your choice between options.
```
Proceed to Step 4, with the concern baked into the trade-offs.

---

## Step 4 — Options and Recommendation

Present 2-4 options with a clear recommendation. Keep options meaningfully different — not variations of the same approach.

```
## Diagnosis

**Problem:** [1 sentence — what's wrong and why it matters, or what's proposed and what it changes]

**Validity:** [VALID / CONDITIONAL — one sentence on the concern if conditional]

---

**Option A: [name]** — [1-2 sentence description]
- Pro: [concrete benefit]
- Con: [concrete cost or trade-off]

**Option B: [name]** — [1-2 sentence description]
- Pro: [concrete benefit]
- Con: [concrete cost or trade-off]

[Option C, D if genuinely different approaches exist]

**Recommendation:** [A/B/C] because [reason grounded in the specific problem — not generic].
```

If any option conflicts with a settled decision, say so — don't list it as a valid option.

If the diagnosis reveals the problem is in a different place than described (e.g., user thinks it's a feature skill issue but it's actually a steering skill issue), say so clearly before presenting options.

---

## Step 5 — Queue Offer

After presenting options, if the problem is worth fixing:

```
Say "add this" and I'll draft a task entry for tmp/tasks.md using the recommended option — or tell me which option to use.
```

If the user says "add this" (or equivalent), invoke `/myna-dev-task-add [task description incorporating the chosen option]`.

If the user picks an option other than the recommendation, use their choice — don't push back.

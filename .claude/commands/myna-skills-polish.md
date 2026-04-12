Review Myna skills for overall quality — feature completeness, clarity, correctness, consistency, safety, edge cases, conciseness, and output usefulness. Skills-focused, runs in parallel to avoid context overload, approval gate before fixes.

This command is narrower than `/myna-improve` (skills only, no steering/main) and narrower than `/myna-review` (skills only, tuned dimensions), but broader than a prose-only tightening pass. Use this when you want a comprehensive quality pass on the skills set without re-auditing the rest of the agent artifacts.

## Arguments

$ARGUMENTS

Parse for:
- **Scope:** file paths, glob patterns, `--uncommitted`, or default to `agents/skills/*.md`
- Anything else: error out with a note on valid usage

## Setup

Read project context before reviewing:

1. `CLAUDE.md` — ground rules
2. `agents/steering/*.md` — all four steering files (safety, conventions, output, system)
3. `docs/architecture.md` — skill inventory and "Features covered:" mapping. This is authoritative for what each skill owns.
4. `docs/design/foundations.md` — skills section, canonical vault templates, shared destination formats
5. `docs/decisions.md` — settled decisions. Pay attention to the Golden Rule, draft-never-send, no skill chaining, and anything marked deferred so you don't propose out-of-scope fixes.
6. `docs/features/*.md` — only the feature files that map to skills in scope, per architecture.md

Build a mental map of each in-scope skill → its owning feature(s) + the shared vault destinations it writes to. You'll need both to evaluate feature completeness and cross-skill consistency.

## Scope resolution

- No arguments → `agents/skills/*.md` (all skills)
- Paths or glob → resolve and review matching files
- `--uncommitted` → only skills with uncommitted git changes under `agents/skills/`
- If the resolved scope is empty, error out.

## Review methodology

**If scope has 1–4 skills:** review them directly in the main context. Skip subagents — the parallel overhead isn't worth it for a small batch.

**If scope has 5+ skills:** spawn parallel subagents so each reviewer holds only its slice plus the shared context. Spawn all subagents in a single message (multiple Agent tool calls in parallel), `subagent_type=general-purpose`.

### Grouping rule

Group skills so each subagent gets ~3 skills (4 max), biased toward domain cohesion so the reviewer only needs one or two feature files per group. Adjust groups to whatever the in-scope set actually contains. When all 15 skills are in scope, a natural grouping is:

- Email/inbox: triage, process, draft-replies
- Meetings: prep-meeting, process-meeting, calendar
- Capture & drafts: capture, park, draft
- Reflection: brief, review, wrap-up, self-track
- Cross-cutting: sync, learn

### Subagent task prompt

Pass each subagent this exact prompt, substituting the skill list:

---

Read-only quality review of Myna skill files. Do not edit anything. Return a structured findings report only.

**Read for context first:**
- `CLAUDE.md`
- `agents/steering/*.md` — all four steering files
- `docs/architecture.md` — skills section for the feature-to-skill mapping
- `docs/design/foundations.md` — skills section and canonical shared-destination templates
- `docs/features/{domain}.md` — only the feature files relevant to the skills you're reviewing
- `docs/decisions.md` — skim for deferred features and any decisions affecting skills in your group

**Skills to review:** {LIST}

**Review criteria (evaluate each skill against all of these):**

1. **Feature completeness** — The skill has executable steps for every feature assigned to it per architecture.md's "Features covered:" line. Cross-reference sub-features from `docs/features/*.md`. "Mentioned" is not enough — the procedure must tell Claude what to read, decide, and write.

2. **Instruction clarity** — Claude can execute every step without guessing. No vague verbs ("determine the appropriate…", "handle this case"). Every branch has a decision criterion. No ambiguous pronouns.

3. **Conciseness (Golden Rule)** — Every instruction line earns its place. Test: "Would Claude produce the same output without this line?" Lines teaching Claude to summarize, parse natural language, format markdown, or write professionally are violations. Lines specifying WHERE to read/write, WHEN to choose between options, and what NOT to do earn their place.

4. **Correctness** — The procedure actually produces the right vault state. Read paths are correct. Write paths match canonical templates in foundations.md. File names, section names, and field names are accurate. Config field references are spelled correctly.

5. **Cross-skill consistency** — Skills writing to the same vault destinations produce identical formatting. Check against foundations.md canonical templates. Key shared destinations: project timelines, person observations, contributions log, task TODOs, review queue entries, daily notes.

6. **Safety** — Draft-never-send enforced (no path leads to sending). Vault-only writes (nothing outside the configured vault). No automatic skill chaining. Calendar three-layer protection. External content framed with delimiters before being passed to reasoning. Confirmation for bulk writes.

7. **Edge cases** — First run (empty vault, no daily note, no person/project files). Missing referenced files. Ambiguous entity resolution (two people with the same first name). Empty MCP results. Bulk operations (5+ items). Re-run behavior (idempotent where it should be).

8. **Output usefulness** — Would the skill's output genuinely help a tech professional manage their day? Specific and actionable, with counts, file links, and next-step framing? Or generic, verbose, and unhelpful? Check against `agents/steering/output.md` voice rules.

**For each skill, produce:**

```
### {skill}.md

Verdict: keep | trim | restructure | rework | incomplete
Current line count: {N}
Owning features: {list from architecture.md}

Findings:
1. [Completeness | Clarity | Conciseness | Correctness | Consistency | Safety | EdgeCase | Output] ({Critical|Important|Minor}) — {one-line issue} (lines X-Y)
   Quoted text: "{the specific problem text}"
   Grounded in: {steering file, feature spec, foundations template, or concrete reasoning}
   Fix: {concrete change — specific enough that another Claude could implement it}
2. ...

Strengths: {1-2 bullets — patterns working well that must not regress}
```

**Then a cross-cutting section for the group:**

- Rules duplicated across skills in this group that should move up to `agents/steering/*`
- Shared-destination format drift (skills writing the same vault location in different formats)
- Skills with overlapping responsibilities that need clarification
- Template drift — where a skill invents its own structure instead of matching the rest

**Rules for findings:**

- Every finding must quote the specific problem text and cite concrete line numbers.
- Every finding must be grounded in a steering file reference, a feature spec reference, a foundations template, or concrete reasoning. Vague criticism like "feels wordy" or "could be clearer" is not acceptable.
- Do not propose features beyond v1 scope. Check `docs/decisions.md` for what's deferred.
- Do not re-raise issues a previous cycle pushed back on.
- If a skill is solid, say so in Strengths. Don't manufacture findings to appear thorough.
- Calibrate severity honestly:
  - **Critical** — breaks functionality, violates safety, corrupts vault data, feature completely missing
  - **Important** — degrades quality significantly, Claude would struggle with the procedure, sub-feature missing
  - **Minor** — polish, wording improvement, Golden Rule violation, slight inconsistency with no functional impact

Return only the structured report. Do not edit files.

---

## Consolidate findings

After subagents return (or after a direct review), write the consolidated report to `docs/reviews/skills-polish-{NNN}.md`.

Cycle number: highest existing `skills-polish-*.md` + 1, starting at `001`. Create `docs/reviews/` if it doesn't exist.

**Report structure:**

```
# Myna Skills Polish — Cycle {NNN}

**Date:** {YYYY-MM-DD}
**Scope:** {description of what was reviewed}
**Files reviewed:** {list}

## Summary

| Skill | Current lines | Verdict | Critical | Important | Minor |
|---|---|---|---|---|---|
| ... |

Convergence: {CONVERGED (0 Critical + 0 Important) | CONTINUE — {n} blocking issues}

## Per-skill findings

### {skill}.md
{normalized findings from subagent reports — one block per skill, with issue IDs assigned by the consolidator: [C01], [I01], [M01]}

## Cross-cutting patterns

{patterns surfaced by multiple subagents — duplication, shared-destination drift, overlap, template drift}

## Candidate promotions to steering

{rules duplicated across skills that should move to agents/steering/*. Do not apply these in the fix phase — surface as a separate proposal for the user to approve separately.}
```

If two subagents disagree about the same skill, surface the disagreement in the consolidated report rather than silently picking one.

## Approval gate

Do not apply fixes automatically. After saving the report:

1. Print the report path and the summary table.
2. Print the top 3–5 most impactful findings inline (Critical first, then Important).
3. Ask the user: "Approve all findings, approve a subset by ID, or skip to manual review?"
4. Wait for the user's decision before editing any files.

## Fix phase

Once the user has approved a fix list:

1. For each approved finding, in order (Critical → Important → Minor):
   a. Read the affected skill file IN FULL.
   b. Apply the concrete fix from the finding.
   c. Re-read the changed section in context to verify it still reads naturally and doesn't contradict adjacent sections.
   d. **Scope guardrail:** verify the fix is in scope for this command — one of the 8 review dimensions above. If the fix would add a feature not assigned to this skill in architecture.md, revert and flag it. If the fix would add a deferred feature, revert and flag it.
   e. **Consistency check:** if the fix touches a shared vault destination, verify other skills writing to the same destination still match. If not, either widen the fix or flag the consistency issue for a separate pass.
   f. Record old and new line count, and a one-line summary of what changed.

2. After all fixes are applied:
   a. Run `bash scripts/lint-agents.sh`. If it fails, investigate and fix the root cause before finishing.
   b. Re-read every modified file in full one more time for a final sanity check.

## Commit

Stage only the files modified during this run (skill files and the review report). Do not stage unrelated files.

Commit message format:
```
fix(agents): skills polish — {n} issues fixed across {n} skills
```

Do not add Co-Authored-By lines.

## Output

After committing, print:

```
Myna Skills Polish — Cycle {NNN} complete

Report: docs/reviews/skills-polish-{NNN}.md
Lint: pass | fail

Issues addressed:
- Critical: {fixed}/{found}
- Important: {fixed}/{found}
- Minor: {fixed}/{found}

Skills modified:
- {skill}: {old lines} → {new lines} — {one-line summary of changes}
- ...
```

If any findings were flagged as out-of-scope during the fix phase, list them so the user knows what still needs attention.

## Rules

- Skills only. Do not touch `agents/steering/*` or `agents/main.md` during the fix phase. If the review surfaces a steering or main-agent issue, list it under "Candidate promotions to steering" and leave it for the user.
- Trust steering files. If a rule is already in `agents/steering/*`, flag duplicates in skills for removal rather than leaving both in place.
- Golden Rule test for every candidate deletion: would Claude produce the same behavior without this line? If yes, it earns deletion. If no, it stays.
- Never re-raise findings the user pushed back on in a previous `skills-polish-*.md` cycle without new evidence.
- Do not invent new conventions during the fix phase. Match whatever the rest of the skills are doing.
- Do not propose features beyond v1 scope. Check `docs/decisions.md` for what's deferred.
- If the in-scope set is 1–4 skills, skip subagents entirely — review directly.

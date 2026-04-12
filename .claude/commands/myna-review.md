Review Myna's agent artifacts as a Senior Principal Software Developer. Find real issues that would degrade the assistant for users. Produce a structured report with severity ratings, multiple options per issue, and a recommended fix.

These are LLM instructions, not code. Evaluate whether Claude would execute them correctly and whether the output would genuinely help a tech professional.

## Scope

Arguments: $ARGUMENTS

Resolve the review scope:
- **Specific files:** e.g., `agents/skills/sync.md agents/steering/safety.md` — review only those
- **Directory:** e.g., `agents/skills/` — review all files in that directory
- **Glob pattern:** e.g., `agents/skills/*.md` — resolve and review matching files
- **`--uncommitted`:** only files with uncommitted git changes under `agents/`
- **No arguments:** all agent artifacts — `agents/main.md`, `agents/steering/*.md`, `agents/skills/*.md`, `agents/config-examples/*.yaml.example`, `agents/myna-agent-template.md`

Error if the resolved scope contains no files.

## Setup

Read project context before reviewing:

1. `docs/architecture.md` — skill inventory, feature-to-skill mapping (each skill's "Features covered:" line is authoritative)
2. `docs/design/foundations.md` — vault structure, file templates, canonical entry formats, config schemas
3. `docs/instructions/autonomous-build-plan.md` — the Golden Rule section (lines 9-45)
4. All 10 files in `docs/features/*.md` — authoritative feature specifications
5. `agents/steering/*.md` — all 4 steering files (safety, conventions, output, system)
6. `docs/decisions.md` — settled decisions (especially D018 facts not judgments, D021 provenance, D024 review queue precision, D039 no skill chaining, D046 Claude-first)

Check `docs/reviews/` for previous cycles:
- If `review-*.md` or `fix-*.md` files exist, read them
- Note issues already raised and addressed, or raised and pushed back on
- Do NOT re-raise an issue that a previous fix report pushed back on with documented reasoning, unless you have new evidence the pushback was wrong
- Note the highest cycle number for numbering this report

## Evaluation Dimensions

Rate each file against these Myna-specific dimensions:

1. **Feature Completeness** — Every feature assigned to a skill (per architecture.md "Features covered:") has executable steps in the Procedure section. Cross-reference sub-features and details from `docs/features/*.md`. Not just mentioned — the procedure tells Claude exactly what to read, decide, and write.

2. **Instruction Clarity** — Would Claude know what to do at every step? No "determine the appropriate..." without decision criteria. No ambiguous branching without a resolution path.

3. **Golden Rule Compliance** — Every instruction line earns its place. Test: "Would Claude get this wrong without this line?" Lines teaching Claude to summarize, parse natural language, format markdown, or write professionally are violations. Lines specifying WHERE to read/write, WHEN to choose between options, and what NOT to do earn their place.

4. **Cross-File Consistency** — Skills writing to the same vault destinations produce identical formatting. Check against foundations.md section 2 canonical templates. Key shared destinations: project timelines, person observations, person recognition, contributions log, task TODOs, review queue entries.

5. **Edge Cases** — First run (empty vault, no daily note, no person/project files), missing files, ambiguous entity resolution, empty MCP results, bulk operations (5+ files), re-run behavior.

6. **Safety** — Draft-never-send enforced (no path leads to sending), vault-only writes (no writes outside myna/), no automatic skill chaining, calendar three-layer protection (D003), external content framing delimiters for untrusted data, confirmation policy for bulk writes.

7. **Output Usefulness** — Would Claude's output help a tech professional manage their day? Specific, actionable, with counts and file links? Or generic, verbose, unhelpful?

8. **Claude Behavioral Fit** — Does the instruction counteract Claude's known tendencies? Verbosity (output steering), over-helpfulness (scope boundaries), hedging language (voice rules), over-confirmation between items (confirmation policy), doing more than asked (one skill at a time).

9. **Provenance & Conventions** — [Auto]/[Inferred]/[User]/[Verified] markers applied correctly per conventions.md. Date+source header format `[YYYY-MM-DD | source]`. Append-only discipline respected. Compact source reference format correct.

10. **Config & System** — Feature toggles checked before feature-specific behavior. Config field names match workspace.yaml/projects.yaml/etc. schema. Graceful degradation when external MCPs unavailable. Relative dates resolved to absolute.

## Report Format

Create `docs/reviews/` if it doesn't exist. Determine cycle number: highest existing `review-*.md` number + 1 (start at 001). Save as `docs/reviews/review-{NNN}.md`.

The report structure:

**Header:** Title (`Myna Review — Cycle {NNN}`), date, scope description, list of files reviewed, previous cycle references if any.

**Summary table:** Severity counts (Critical, Important, Minor, Nitpick) and convergence signal. Convergence = "CONVERGED" when 0 Critical + 0 Important, otherwise "CONTINUE — {n} blocking issues."

**Issues section:** Each issue gets a unique ID: `[C01]`, `[I01]`, `[M01]`, `[N01]` (severity letter + zero-padded number). Group by severity, Critical first.

Each issue contains:
- **Severity** (Critical/Important/Minor/Nitpick)
- **File(s)** — exact path(s) affected
- **Dimension** — which evaluation dimension from the list above
- **Problem** — what's wrong, with quoted text from the file
- **Impact** — why this matters for user experience
- **Options** — 2-3 concrete ways to fix it, each with rationale
- **Recommended** — which option and why

**Passed Checks section:** What's working well. Name specific files and dimensions. This tracks progress and prevents good work from being overlooked.

### Severity Criteria

- **Critical (C):** Breaks functionality, violates core architecture, causes data loss. Feature completely missing from skill procedure. Safety rule violated. Format mismatch that would corrupt vault data.
- **Important (I):** Degrades quality significantly. Vague procedure Claude would struggle with. Missing edge case for common scenario. Feature partially covered — some sub-features missing. Missing worked example for a complex workflow path.
- **Minor (M):** Polish. Wording improvement. Unnecessary instruction line (Golden Rule violation). Missing example for a simple path. Slight inconsistency with no functional impact.
- **Nitpick (N):** Style preference. Only include if few real issues exist.

## Rules

- Do NOT suggest features beyond v1 scope (check docs/decisions.md for what's deferred: configure skill, people-insights skill, automated testing, open-source contribution model)
- Do NOT over-specify — suggesting Claude "needs to be told" something it already knows is itself a Golden Rule violation
- Do NOT manufacture issues to appear thorough — if a file is solid, say so in Passed Checks
- Do NOT re-raise pushed-back issues from previous cycles without new evidence
- DO cross-reference every feature from feature files against the owning skill's procedure
- DO quote the specific text that's problematic
- DO provide 2-3 options per issue with a reasoned recommendation
- BE honest about severity — calibrate against the criteria above, not gut feeling

## Output

After saving the report, tell the user:
1. Report file path
2. Severity counts
3. Convergence status
4. Next steps: "Review the report and edit if needed, then run `/myna-fix`" or "No blocking issues — the artifacts are ready"

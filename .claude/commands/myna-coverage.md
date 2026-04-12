Audit feature coverage: check that every feature from the feature specification files is fully implemented in the corresponding skill files. Quick, focused check useful after changing a skill.

## Scope

Arguments: $ARGUMENTS

Resolve scope:
- **Specific skill(s):** e.g., `agents/skills/sync.md` — audit only those skills
- **Directory:** e.g., `agents/skills/` — audit all skills
- **`--uncommitted`:** only skill files with uncommitted git changes
- **No arguments:** all 14 skill files in `agents/skills/`

Coverage always reads ALL feature files (the specs are needed regardless of which skills are targeted).

## Setup

1. Read `docs/architecture.md` — specifically the Skill Inventory (section 2). For each skill, note the "Features covered:" line. This is the authoritative mapping of which features belong to which skill.

2. Read all 10 files in `docs/features/*.md`. For each feature under `## Features`, note:
   - Feature name and one-line description
   - Sub-features and specific details
   - Decision criteria, edge cases, and constraints mentioned
   - Which skill owns it (from the architecture mapping)

3. Read each skill file in the resolved scope.

## Coverage Methodology

For each feature assigned to a skill in scope:

1. Find the feature in `docs/features/*.md` — note all sub-features, details, and constraints.

2. Read the skill's Procedure section. For each sub-feature or detail from the spec:
   - Is there an executable step that addresses it? (Not just a mention in the Purpose or Triggers section — the Procedure must have it.)
   - Are decision criteria from the spec reflected in the procedure?
   - Are edge cases from the spec handled?

3. Grade the coverage:
   - **FULL** — every sub-feature and detail from the spec has executable steps in the procedure. Decision criteria and edge cases are addressed.
   - **PARTIAL** — some sub-features or details are in the procedure, others are missing. List exactly what's missing.
   - **NONE** — the feature is listed in architecture.md as belonging to this skill but has no corresponding procedure steps.

## Coverage Report

Determine report number: highest existing `coverage-*.md` + 1 (start at 001). Create `docs/reviews/` if needed. Save as `docs/reviews/coverage-{NNN}.md`.

Report structure:

**Header:** Title (`Myna Coverage Audit — #{NNN}`), date, scope.

**Summary:** Total features checked, FULL count, PARTIAL count, NONE count, overall coverage percentage (FULL / total).

**Coverage Matrix:** A table with columns: Feature, Owning Skill, Grade, Notes. One row per feature. Sort by grade (NONE first, then PARTIAL, then FULL).

**Gap Details:** For each PARTIAL or NONE entry, a detailed section listing:
- Feature name and owning skill
- What the feature spec says (quote relevant details from the feature file)
- What the skill procedure covers (if PARTIAL)
- What's missing — specific sub-features, decision criteria, or edge cases not addressed
- Suggested fix (brief — where in the procedure the missing content should go)

**Fully Covered:** A brief list of features graded FULL, confirming they're complete.

## Rules

- Only check features that are assigned to skills in scope. Don't audit skills that aren't in the target set.
- A feature mentioned in Purpose or Triggers but absent from Procedure is NONE, not PARTIAL — the procedure is what Claude executes.
- A feature with steps in Procedure but missing key sub-features from the spec is PARTIAL, not FULL.
- Be precise about what's missing — "partially covered" without specifics is unhelpful.
- The `docs/features/*.md` files are authoritative. If the skill file addresses something not in the feature spec, that's fine (additional detail). But if the feature spec has something the skill doesn't, that's a gap.

## Output

Tell the user:
1. Coverage report path
2. Summary: "{n} features checked — {n} FULL, {n} PARTIAL, {n} NONE ({percentage}% complete)"
3. If any PARTIAL or NONE: list the feature names and owning skills
4. Next step: "Run `/myna-fix` to address gaps" or "Full coverage — no gaps found"

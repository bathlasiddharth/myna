Check that skills writing to the same vault destinations produce identical formatting. This is the #1 source of real bugs — if two skills format timeline entries differently, the vault becomes inconsistent over time.

## Scope

Arguments: $ARGUMENTS

This command always checks ALL skills that write to shared destinations, regardless of targeting. Targeting narrows which shared destinations to check:

- **Specific destination:** e.g., `timeline` or `observations` — check only that destination type
- **Specific skill(s):** e.g., `agents/skills/sync.md` — check all destinations that this skill writes to
- **No arguments:** check all shared destinations across all skills

Available destination keywords: `timeline`, `observations`, `recognition`, `contributions`, `tasks`, `review-queue`, `daily-note`, `meeting-prep`, `sources`

## Setup

1. Read `docs/design/foundations.md` — this is the source of truth for canonical entry formats. Pay close attention to section 2 (File Templates) and the canonical formats in `agents/steering/conventions.md`.

2. Read `agents/steering/conventions.md` — the authoritative format definitions: timeline entries, observations, recognition, contributions, tasks, review queue entries.

3. Read `docs/architecture.md` section 2 — note which skills write to which destinations (from the "Writes:" line in each skill description).

4. Read all skill files that write to the destinations in scope.

## Shared Destinations to Check

For each destination, these are the skills that write to it. Read each skill's Procedure and Output sections to extract the exact format it produces.

### 1. Project Timeline Entries
**Canonical format** (from foundations.md/conventions.md): `- [{YYYY-MM-DD} | {source}] {content} [{provenance}] ({source-detail})`
**Callout variants:** Blocker (`> [!warning] Blocker`), Decision (`> [!info] Decision`)
**Skills that write:** process, process-meeting, capture
**Check:** Date format, source values, provenance marker placement, callout format for blockers/decisions, chronological sort instruction.

### 2. Person Observations
**Canonical format:** `- [{YYYY-MM-DD} | {source}] **{type}:** {observation} [{provenance}] ({source-detail})`
**Types:** strength, growth-area, contribution
**Skills that write:** process, process-meeting, capture
**Check:** Type values match (all three types documented?), bold formatting on type, source-detail format.

### 3. Person Recognition
**Canonical format:** `- [{YYYY-MM-DD} | {source}] {what they did} — {context} [{provenance}] ({source-detail})`
**Skills that write:** process, process-meeting, capture
**Check:** Dash separator between achievement and context, no callout format in person files (callouts only in project timelines).

### 4. Contributions Log
**Canonical format:** `- [{YYYY-MM-DD} | {source}] **{category}:** {description} [{provenance}] ({source-detail})`
**Categories (IC):** decisions-and-influence, unblocking-others, issue-prevention, code-reviews, feedback-given, documentation, escalations-handled, delegation-management, best-practices, risk-mitigation, coaching-and-mentoring
**Skills that write:** wrap-up, process, process-meeting, capture, self-track
**Check:** Category names match across skills, bold formatting on category, week file naming (`contributions-{YYYY-MM-DD}.md` using Monday date).

### 5. Task TODOs
**Canonical format:** `- [ ] {title} 📅 {YYYY-MM-DD} {priority-emoji} [project:: {name}] [type:: {type}] [{provenance}] ({source-detail})`
**Inline properties:** `[project:: ]`, `[type:: ]`, `[person:: ]`, `[review-status:: ]`, `[effort:: ]`
**Priority emojis:** ⏫ high, 🔼 medium, (none) low
**Skills that write:** process, process-meeting, capture
**Check:** Emoji usage consistent, inline property syntax (double colon, brackets), provenance placement, inferred field handling (`[review-status:: pending]` not inline text annotations).

### 6. Review Queue Entries
**Skills that write:** process, process-meeting, capture, triage (to review-triage), wrap-up (to review-self)
**Check:** Each skill routes to the correct queue file (review-work, review-people, review-self, review-triage). Entry format includes: source reference, agent's interpretation, what's ambiguous and why, proposed action, destination.

### 7. Daily Note Sections
**Skills that write:** sync (Sync snapshot sections), wrap-up (End of Day section)
**Check:** sync and wrap-up write to different sections of the daily note — they shouldn't conflict. Verify section names match the daily note template in foundations.md.

### 8. Meeting Prep Sections
**Skills that write:** sync (lightweight prep during morning sync), prep-meeting (full prep)
**Check:** Both follow the meeting file template structure. Prep checkbox format is consistent.

### 9. Source Text Storage
**Canonical location:** `_system/sources/{entity-name}.md`
**Skills that write:** process, process-meeting
**Check:** File naming convention matches, append format consistent.

## Consistency Report

Determine report number: highest existing `consistency-*.md` + 1 (start at 001). Save as `docs/reviews/consistency-{NNN}.md`.

Report structure:

**Header:** Title (`Myna Consistency Audit — #{NNN}`), date, scope.

**Summary:** Destinations checked, consistent count, inconsistent count.

**Per-Destination Results:** For each shared destination:

- **Destination name** and canonical format (from foundations.md/conventions.md)
- **Skills checked** and the format each produces (quote the relevant procedure text or output format from the skill file)
- **Verdict:** CONSISTENT (all skills match canonical format) or INCONSISTENT
- **If inconsistent:** what differs, which skill is correct (matches canonical format), and which skill(s) need updating. Quote the specific text from each skill that diverges.

**Cross-Destination Issues:** Any issues that span multiple destinations (e.g., a skill uses inconsistent source-detail format across timeline writes and observation writes).

## Rules

- foundations.md and conventions.md define the canonical formats. When a skill diverges from these, the skill is wrong (not the canonical format).
- Be precise: quote the exact format string from each skill file, not a summary.
- If a skill doesn't explicitly state its output format (relying on Claude's default), flag this as a risk — explicit formats prevent drift.
- Check both the Procedure section (where formats are often defined) and the Output section (where they're sometimes restated).

## Output

Tell the user:
1. Consistency report path
2. Summary: "{n} destinations checked — {n} consistent, {n} inconsistent"
3. If inconsistencies found: list the destination names and which skills diverge
4. Next step: "Run `/myna-fix` to align formats" or "All formats consistent"

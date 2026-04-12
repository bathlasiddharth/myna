# Myna Review — Cycle 001

**Date:** 2026-04-08
**Scope:** All agent artifacts — `agents/main.md`, `agents/steering/*.md`, `agents/skills/*.md`, `agents/config-examples/*.yaml.example`, `agents/claude-md-template.md`
**Files reviewed:** 24 files (1 main, 4 steering, 14 skills, 6 config examples, 1 template)
**Previous cycles:** None

## Summary

| Severity | Count |
|----------|-------|
| Critical | 0 |
| Important | 3 |
| Minor | 7 |
| Nitpick | 2 |

**Convergence:** CONTINUE — 3 blocking issues.

---

## Issues

### Important

#### [I01] Missing template fallback in sync.md and process-meeting.md

**Severity:** Important
**File(s):** `agents/skills/sync.md`, `agents/skills/process-meeting.md`
**Dimension:** 5 — Edge Cases

**Problem:** sync.md line 31 says `create it from the daily note template` but provides no fallback if the template file (`_system/templates/daily-note.md`) doesn't exist. process-meeting.md line 132 says `create it from the template in _system/templates/person.md` with no fallback either.

Meanwhile, capture.md line 128 handles this correctly:
```
If no template exists, use `write` to create a minimal file with frontmatter from people.yaml.
```

**Impact:** On first run or after a partial install, template-dependent file creation fails silently. This is a common first-run scenario.

**Options:**
1. Add a fallback clause matching capture.md's pattern to both sync.md and process-meeting.md
2. Add a single rule in steering/system.md that all skills follow for missing templates
3. Add a "template existence check" to the install verification step

**Recommended:** Option 1 — local fix in each skill, matching the pattern capture.md already establishes. Keeps skills self-contained.

---

#### [I02] Inconsistent file link format across skills

**Severity:** Important
**File(s):** `agents/skills/process.md`, `agents/skills/review.md`, `agents/skills/self-track.md`, `agents/skills/brief.md`
**Dimension:** 4 — Cross-File Consistency

**Problem:** steering/output.md line 40 requires: `include both the Obsidian URI and the full disk path in the response so the user can navigate from the terminal`. But skills implement this inconsistently:

- capture.md line 104: `file links (Obsidian URI and disk path)` — **correct**
- process.md line 106: `Include Obsidian URI links` — **missing disk path**
- review.md line 63: `file links` — **ambiguous**
- self-track.md line 94: `file link` — **ambiguous**
- brief.md: no explicit file link format specified for inline output

**Impact:** Users navigating from the terminal can't click through to vault files for skills that only provide wiki-links or partial URIs.

**Options:**
1. Update each skill's output section to match capture.md's explicit wording: `file links (Obsidian URI and disk path)`
2. Add a blanket rule to steering/output.md: "All file links in output follow the format specified in the File Links section" and remove per-skill specification
3. Only require both formats for skills that create/modify files (not read-only skills like brief)

**Recommended:** Option 1 — explicit in each skill. The steering file already states the rule; skills need to echo it in their output specification to ensure compliance.

---

#### [I03] Draft-replies partial failure handling undefined

**Severity:** Important
**File(s):** `agents/skills/draft-replies.md`
**Dimension:** 5 — Edge Cases

**Problem:** draft-replies.md line 32-33 requires confirmation for 5+ emails in bulk. But if the user confirms and a draft fails mid-batch (e.g., audience can't be resolved from people.yaml for one email), there's no guidance on whether to halt the batch, skip the failing email and continue, or queue the failure for retry.

**Impact:** Mid-batch failure leaves the operation in an ambiguous state. Some emails processed, some not, with no clear recovery path.

**Options:**
1. Add skip-and-continue logic: "If a single email fails (audience unresolvable, thread unreadable), skip it, note the failure, and continue with remaining emails"
2. Add halt-and-report logic: "If any email fails, stop processing, report what succeeded and what failed"
3. Match process.md's error recovery pattern: continue processing, create a retry TODO for failures per steering/system.md error recovery

**Recommended:** Option 3 — continue processing, create retry TODOs for failures. Matches the existing error recovery pattern in steering/system.md and keeps the batch moving.

---

### Minor

#### [M01] Task entry source-detail ambiguity in conventions.md

**Severity:** Minor
**File(s):** `agents/steering/conventions.md`
**Dimension:** 9 — Provenance & Conventions

**Problem:** The canonical task format (conventions.md line 217) includes source-detail:
```
- [ ] Review Sarah's design doc 📅 2026-04-10 ⏫ [project:: Auth Migration] [type:: task] [Auto] (email, Sarah, 2026-04-05)
```
But timeline entries (line 91) and contributions (line 122) explicitly say "No source-detail at the end." Tasks have no such clarification. All skill examples for tasks omit the source-detail, suggesting it's optional — but conventions.md doesn't say so.

**Impact:** Ambiguity about whether skills are correctly omitting source-detail or incorrectly dropping required information.

**Options:**
1. Add a clarifying note under the task format: "Source-detail is optional for tasks — the entry header provides traceability"
2. Remove source-detail from the canonical task example to match actual skill usage

**Recommended:** Option 1 — add a note clarifying source-detail is optional for tasks, matching how timeline and contributions handle it.

---

#### [M02] Process.md worked examples use summary tables instead of actual entry formats

**Severity:** Minor
**File(s):** `agents/skills/process.md`
**Dimension:** 4 — Cross-File Consistency

**Problem:** process.md's worked examples (lines 152-158, 177-181) show extracted entries as summary table rows:
```
| Journal/contributions-2026-04-01.md | Facilitated API spec completion | [Inferred] |
```
This omits the full canonical format from conventions.md:
```
- [2026-04-06 | email from Sarah] **decisions-and-influence:** Facilitated API spec completion [Inferred]
```

The procedure (line 62) correctly defers to conventions.md, but the examples could mislead about what vault entries actually look like.

**Impact:** Developers or reviewers reading process.md won't see the actual entry format without cross-referencing conventions.md.

**Options:**
1. Replace table examples with full formatted entries showing the canonical format
2. Add a note: "Table shows summary. Actual vault entries use conventions.md canonical formats."

**Recommended:** Option 2 — the tables are useful for showing multi-destination routing at a glance. A note linking to conventions.md preserves clarity without bloating examples.

---

#### [M03] Brief output density guidance lacks section prioritization

**Severity:** Minor
**File(s):** `agents/skills/brief.md`
**Dimension:** 7 — Output Usefulness

**Problem:** brief.md specifies density targets (e.g., "Person Briefing: 15-25 lines") but lists 8 content sections for person briefings without indicating which are essential vs optional. When data is abundant, Claude may include all sections and exceed the target. When data is sparse, Claude doesn't know which sections to omit.

**Impact:** Person briefing length is unpredictable. User can't rely on a consistent structure.

**Options:**
1. Add priority tiers: "Always include: Role, Open items, Last 1:1. Include if present: Pending feedback, Personal notes. Optional: Stakeholder mentions."
2. Let Claude use judgment and remove the density targets

**Recommended:** Option 1 — priority tiers give Claude clear guidance while keeping the density targets meaningful.

---

#### [M04] Wrap-up contribution summary should mandate marker breakdown

**Severity:** Minor
**File(s):** `agents/skills/wrap-up.md`
**Dimension:** 7 — Output Usefulness

**Problem:** The worked example (line 141) shows `3 contributions detected (2 certain, 1 inferred)` — breaking down [Auto] vs [Inferred] counts. But the output specification (line 52) doesn't mandate this breakdown format.

**Impact:** Without the breakdown being mandatory, the summary could be just "3 contributions detected" — user can't assess confidence without reading the full list.

**Options:**
1. Make the breakdown mandatory in the output spec: "MUST include: {N} certain, {N} inferred, {N} in review queue"
2. Keep as-is — the worked example implies the format

**Recommended:** Option 1 — make it explicit. One line of instruction prevents inconsistent output.

---

#### [M05] Over-specification of extraction steps across skills (Golden Rule)

**Severity:** Minor
**File(s):** `agents/skills/capture.md`, `agents/skills/process-meeting.md`, `agents/skills/self-track.md`
**Dimension:** 3 — Golden Rule Compliance

**Problem:** Multiple skills teach extraction steps Claude already knows:
- capture.md line 48: "Determine observation type from content: strength, growth-area, or contribution"
- process-meeting.md line 125: "Extract what was said or decided, not your interpretation"
- self-track.md line 51-55: step-by-step extraction of description, category, related project

The Golden Rule test: "Would Claude get this wrong without this line?" For these, the answer is mostly no — Claude can categorize observations and extract structured data.

**Impact:** Instruction bloat without added value. Each unnecessary line consumes context budget.

**Options:**
1. Replace extraction steps with goal-oriented statements: "Route extracted items to vault destinations per conventions.md"
2. Keep the category lists as reference but remove the "how to extract" framing

**Recommended:** Option 2 — the category lists (strength/growth-area/contribution, IC vs manager categories) are useful reference. Remove the "determine" and "extract" framing; keep the WHAT/WHERE.

---

#### [M06] Draft status update output lacks count summary

**Severity:** Minor
**File(s):** `agents/skills/draft.md`
**Dimension:** 7 — Output Usefulness

**Problem:** The Status Update section (lines 82-92) specifies audience-adaptive depth but no count summary after generation. steering/output.md line 44: "After every multi-step operation, show a one-line summary with counts."

**Impact:** User can't verify at a glance what project state the status update covered (blockers, tasks, decisions).

**Options:**
1. Add a count summary requirement: "After the draft, show: 'Status update for {project} ({audience}). {N} timeline entries, {M} tasks, {K} blockers covered.'"
2. Add a general "coverage note" without specific counts

**Recommended:** Option 1 — counts let the user verify completeness before sending the draft.

---

#### [M07] Brief insufficient data handling inconsistent

**Severity:** Minor
**File(s):** `agents/skills/brief.md`
**Dimension:** 7 — Output Usefulness

**Problem:** Two overlapping rules create inconsistency:
- Line 172: "state it, do not fill gaps" — explicitly note insufficient data within sections
- Line 176: "Missing vault files... skip that source and proceed" — silently omit sections

A person briefing might say "No observations logged" in the Observations section but silently omit a section that requires a missing file, creating unpredictable structure.

**Impact:** User can't tell if a missing section means "no data" or "data source unavailable."

**Options:**
1. Require a "data sources" note at the top: "Sources: person file (found), project files (2 found), meeting files (none found)"
2. Always include all sections, using "No data — {reason}" for empty ones

**Recommended:** Option 1 — a sources note at the top tells the user what fed the briefing without bloating every section.

---

### Nitpick

#### [N01] Redundant "never send" reminders across skills

**Severity:** Nitpick
**File(s):** `agents/skills/draft.md`, `agents/skills/draft-replies.md`
**Dimension:** 3 — Golden Rule Compliance

**Problem:** The "draft, never send" rule appears in steering/safety.md (authoritative), main.md, draft.md, and draft-replies.md. The steering file is always loaded; repeating it in skills consumes space.

**Options:**
1. Remove the reminders from skills — steering/safety.md covers it
2. Keep as-is — safety rules warrant redundancy

**Recommended:** Option 2 — safety rules are the one exception where redundancy is acceptable. No change needed.

---

#### [N02] Coaching suggestion formatting inconsistent in prep-meeting worked example

**Severity:** Nitpick
**File(s):** `agents/skills/prep-meeting.md`
**Dimension:** 7 — Output Usefulness

**Problem:** The worked example shows coaching suggestions indented under some checkboxes but not others, without clearly illustrating when coaching should vs shouldn't appear.

**Options:**
1. Annotate the worked example with comments showing the decision logic
2. Leave as-is — the rule (line 105: "only for sensitive items") is clear enough

**Recommended:** Option 2 — the rule is stated; the example is illustrative, not exhaustive. No change needed.

---

## Passed Checks

**Dimension 1 — Feature Completeness:** All 14 skills fully cover their assigned features with executable procedure steps. No gaps.

**Dimension 6 — Safety:** All safety rules enforced. Draft-never-send has no bypass path. Vault-only writes respected. Calendar three-layer protection implemented in calendar.md. External content framing delimiters used in all skills that read untrusted data. Confirmation policy for bulk writes implemented.

**Dimension 10 — Config & System:** 23 feature toggle checks across skills. Config field names match schemas. Graceful degradation documented for all external MCP dependencies. Relative dates resolved per system.md.

**Dimension 9 — Provenance (overall):** All skills correctly defer to conventions.md for marker logic. No skill defines its own provenance rules. [Auto]/[Inferred]/[User]/[Verified] applied consistently.

**Files with clean passes across all dimensions:**
- `agents/skills/review.md` — clear procedure, good edge cases, no violations
- `agents/skills/park.md` — well-specified, comprehensive edge case handling
- `agents/skills/calendar.md` — three-layer protection, clear degradation
- `agents/skills/triage.md` — clean 3-step workflow, counts in output
- `agents/steering/safety.md` — authoritative, clear, complete
- `agents/steering/conventions.md` — comprehensive format reference (minor task ambiguity noted)
- `agents/steering/output.md` — clear voice and format rules
- `agents/steering/system.md` — complete config and degradation guidance
- `agents/main.md` — good routing logic, handles ambiguity well
- `agents/claude-md-template.md` — correct placeholders, consistent with architecture
- All 6 config examples — consistent with documented schemas

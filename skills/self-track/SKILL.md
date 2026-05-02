---
name: self-track
disable-model-invocation: true
description: Log contributions and generate self-review documents — brag docs, self-reviews, promo packets. Query by category, project, or date. Self-calibration: check draft claims against your log. YOUR contributions only.
user-invocable: true
argument-hint: "log contribution: [description] | what did I do this quarter | draft my self-review for [period] | build my promo case | am I underselling myself? | what feedback did I give this [period]"
---

# myna-self-track

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:install` and stop.

Logs your contributions and generates self-review documents from them. Input path: log what you did. Output path: compile it into usable documents.

## 📋 Before You Start

Read at session start:
- `_system/config/workspace.yaml` — `user.role` determines contribution categories
- `_system/config/projects.yaml` — for cross-referencing project-level impact

**Contributions log path:** `Journal/contributions-{YYYY-MM-DD}.md` where the date is Monday of that week.

---

## 📂 Contribution Categories

The category set is determined by `user.role` in workspace.yaml:

**IC (senior-engineer, tech-lead):**
- `decisions-and-influence`
- `unblocking-others`
- `issue-prevention`
- `code-reviews`
- `feedback-given`
- `documentation`
- `escalations-handled`
- `delegation-management`
- `best-practices`
- `risk-mitigation`
- `coaching-and-mentoring`

**Manager/PM (engineering-manager, pm):**
Includes all IC categories plus:
- `people-development`
- `operational-improvements`
- `strategic-alignment`
- `hiring-and-team-building`
- `cross-team-leadership`
- `stakeholder-management`

**For manager categories:** Be conservative about inference. "Drove consensus across 3 teams" is a claim that's hard to reconstruct from structured data — the manual logging path is primary here. When in doubt, route to `ReviewQueue/review-self.md` rather than write with `[Inferred]`. A missed contribution impacts career growth; a fabricated one erodes trust.

---

## ✍️ Log Contribution

Three write paths, each with a distinct provenance tag:

| Path | When | Provenance |
|---|---|---|
| **User-typed** | User says "log contribution: X" | `[User]` — write directly |
| **Agent-extracted, high confidence** | Agent finds a clear contribution signal in structured data (task completed, decision logged in timeline) | `[Auto]` — write directly with source reference |
| **Agent-extracted, uncertain** | Agent thinks something might be a contribution but can't confirm | `[Inferred]` — write directly if plausible; route to `ReviewQueue/review-self.md` if genuinely ambiguous |

The user-typed path is always available. The [Auto] and [Inferred] paths are used when other skills (e.g., meeting processing, project tracking) surface contribution signals and pass them here to log.

**Trigger (user-typed):** "log contribution: [description]", "I just [did something worth logging]"

**How:**
1. Parse the contribution from the user's text. Extract:
   - Description (what happened)
   - Category (from the role-appropriate list above — infer from description)
   - Date (today if not specified, resolve relative dates)
   - Source (capture, from email/meeting if user mentions it)
   - Impact (if stated)
2. Assign provenance: `[User]` (user typed it directly).
3. Determine the correct weekly contributions file: find the Monday of the current week.
   - File: `Journal/contributions-{YYYY-MM-DD}.md` (Monday date)
   - If the file doesn't exist, create it with this header:

```markdown
---
week_start: {YYYY-MM-DD}
---

#contributions

## Contributions — Week of {YYYY-MM-DD}

> Append-only. Each entry has date, description, category, source, and provenance.
```

4. Append the entry:
```
- [{YYYY-MM-DD} | {source}] **{category}:** {description}[; impact: {impact}] [User] ({source-detail})
```
- `{source}`: `capture` when user typed it directly; meeting/email name if user mentions the context.
- `({source-detail})`: the specific meeting title or email subject if known; omit the parens entirely if source is just `capture` with no additional detail.
- Include `; impact: {impact}` only when the user states the impact explicitly. Omit when not mentioned.

5. Confirm: "Logged: [{category}] {description}"

**Category inference rules:**
- "helped unblock", "resolved a blocker for [person]" → `unblocking-others`
- "reviewed [code/PR/design]" → `code-reviews`
- "gave feedback to [person]" → `feedback-given`
- "documented", "wrote runbook/spec/RFC" → `documentation`
- "prevented [issue]", "caught [bug] before" → `issue-prevention`
- "made the call on [decision]" → `decisions-and-influence`
- "escalated [issue]" → `escalations-handled`
- "coached [person]", "mentored [person]" → `coaching-and-mentoring`
- "drove alignment", "got consensus" → `strategic-alignment` (manager only)
- For manager categories with vague input → flag and ask user to confirm category

**Worked example:**

User: "log contribution: led the auth migration design review and made the final call on the caching architecture"

1. Description: Led design review, made architecture decision.
2. Category: `decisions-and-influence` (made the call on architecture).
3. Date: today = 2026-04-05.
4. Find Monday of current week: 2026-03-30.
5. Append to `Journal/contributions-2026-03-30.md`:
   `- [2026-04-05 | capture] **decisions-and-influence:** Led auth migration design review and made final call on caching architecture [User]`
   (No source-detail parens — source is just `capture` with no meeting/email context provided.)

Output: "Logged: [decisions-and-influence] Led auth migration design review and made final call on caching architecture"

---

## 🔍 Contribution Queries

**Trigger:** "what feedback did I give this quarter?", "what did I do on [project]?", "show my contributions from March", "how many code reviews did I do this month?"

**How:**
1. Determine the filter(s): category, project, date range, or count.
2. Find all relevant contributions files using Glob: `Journal/contributions-*.md`
3. Read files within the date range (if specified).
4. Filter entries by the requested criteria:
   - By category: match `**{category}:**` in entry
   - By project: match project name in description
   - By date: match `[{date}` prefix
   - Count: count matching lines
5. Show results inline, organized by week.

**Date range defaults:**
- "this quarter" → current quarter start to today
- "this month" → first of current month to today
- "last quarter" → previous quarter
- "this year" → January 1 to today

**Worked example:**

User: "What feedback did I give this quarter?"

1. Date range: Q1 2026 (Jan 1 – Mar 31) or Q2 2026 if current.
2. Glob `Journal/contributions-*.md`, read files in range.
3. Filter for `feedback-given` category entries.

Output:
```
## 🔍 Feedback Given — Q1 2026 (8 entries)

**Week of Mar 30:**
- [2026-04-02 | capture] feedback-given: Gave written feedback to Sarah on API spec quality — focused on error handling coverage

**Week of Mar 23:**
- [2026-03-25 | meeting 1:1 with Alex] feedback-given: Delivered feedback on estimation accuracy — coaching session
- [2026-03-23 | capture] feedback-given: Gave feedback to Marcus on incident communication

[... 5 more entries]
```

---

## 📄 Self-Narrative Generation

### Brag Doc

**Trigger:** "what did I do this quarter?", "brag doc", "compile my contributions for Q1"

**How:**
1. Determine time period (default: last quarter). Resolve "last quarter", "Q1", "last 3 months" to dates.
2. Glob and read contributions files for that period.
3. Organize chronologically by category.
4. Flag all `[Inferred]` entries in the output so the user knows to verify them.
5. Save to `Drafts/[Self] Brag Doc {period}.md`.

**Brag Doc format:**
```markdown
---
type: brag-doc
audience_tier: upward
related_project: null
related_person: null
created: {YYYY-MM-DD}
period: {period}
---

#draft #self

# Brag Doc — {period}

## Decisions & Influence
- {date}: {description}

## Unblocking Others
- {date}: {description}

[...other categories with entries...]

---
*Note: ⚠️ [Inferred] entries should be verified before use.*
```

**Worked example:**

User: "What did I do this quarter?"

Read contributions files for Jan–Mar 2026. Organize by category. Output:

```
## 📋 Q1 2026 — Contributions Summary

**Decisions & Influence (3)**
- Mar 15: Made final call on caching architecture for auth migration
- Feb 28: Drove consensus on API versioning strategy across 3 teams ⚠️ [Inferred]
- Jan 22: Decided to defer scope of v2 auth feature

**Unblocking Others (4)**
- Apr 2: Resolved API dependency blocker for Platform team
[...]

18 total contributions logged. 3 marked [Inferred] — verify before using in review docs.

Saved to [[Drafts/[Self] Brag Doc Q1 2026.md]]
```

---

### Self-Review

**Trigger:** "draft my self-review for H1", "self-review for the review cycle", "write my performance review"

**How:**
1. Determine the review period. Ask if unclear.
2. Read contributions for the period.
3. Read competency areas or goals from `_system/config/workspace.yaml` if present (look for `self_tracking.competency_areas` or `review_framework`). If none defined, ask the user to name the competency areas their company uses (e.g., "Technical Impact, Collaboration, Leadership") before drafting.
4. Write a narrative self-review organized by competency areas or goals (not just a list of contributions). Reads as a genuine self-assessment — specific, evidence-based, honest about growth areas too.
5. Flag `[Inferred]` entries in the draft with a note: "(verify this contribution before submitting)".
6. Save to `Drafts/[Self] Self-Review {period}.md`.

**Draft frontmatter:**
```
---
type: self-review
audience_tier: upward
related_project: null
related_person: null
created: {YYYY-MM-DD}
period: {period}
---
```

---

### Promo Packet

**Trigger:** "build my promo case", "promo packet", "evidence for promotion to [level]"

**How:**
1. Ask for target level if not specified.
2. Read all contributions files (last 12-18 months or as specified).
3. Cross-reference: project timelines (project-level impact), person files (feedback given), meeting notes (decisions driven).
4. Organize by promotion criteria (typically: scope, impact, leadership, execution). Ask user to confirm the framework if needed.
5. For each criterion: select the strongest evidence from contributions. Be specific — dates, outcomes, scale.
6. Flag `[Inferred]` entries prominently.
7. Save to `Drafts/[Self] Promo Packet {level} {date}.md`.

**Draft frontmatter:**
```
---
type: promo-packet
audience_tier: upward
related_project: null
related_person: null
created: {YYYY-MM-DD}
period: {period}
target_level: {level}
---
```

---

## 🔍 Self-Calibration

**Trigger:** "am I underselling myself?", "self-calibration", "check my self-review against my contributions"

**How:**
1. Ask for the draft to calibrate against (or read `Drafts/[Self]*.md` files — show list if multiple).
2. Read the draft.
3. Read all contributions for the period covered.
4. Run three checks:

   **Check 1 — Claims without evidence:** Every claim in the draft should be grounded in at least one contributions entry. Flag claims that aren't: "Claim: 'Led cross-team alignment on Q2 roadmap' — no contribution entry found for this."

   **Check 2 — Contributions not included:** Contributions logged but not mentioned in the draft. Highlight strongest ones: "You logged 4 code-review entries in Q1 but the draft doesn't mention code review contributions."

   **Check 3 — Language weaker than evidence:** Where you have strong evidence but hedged language. "You have 3 contributions for 'unblocking-others' including resolving a critical P1 blocker — but the draft says 'occasionally helped with blockers'."

5. Show calibration report inline. Offer to revise the draft based on findings.

**Worked example:**

User: "Am I underselling myself?"

Draft loaded: `Drafts/[Self] Self-Review H1 2026.md`

```
## 🔍 Self-Calibration Report

**Claims without evidence (1):**
- "Drove alignment on the API governance framework across Platform and Payments" — no contributions entry found. Verify or add a log entry if this happened.

**Contributions not in your draft (3):**
- 7 feedback-given entries not mentioned (including feedback to Sarah, Alex, Marcus)
- 2 escalation-handled entries — strong signal of ownership, worth including
- 1 best-practices entry (documented error handling standards for auth service)

**Language weaker than evidence:**
- You have 3 'unblocking-others' entries but the draft says 'occasionally helped teammates'. Consider: 'Actively unblocked teammates on 3 occasions including [strongest example].'

Overall: your draft undersells your feedback and unblocking work. The evidence is there — just not included.
```

---

## ⚠️ Edge Cases

**No contributions logged:** "No contributions found for that period. You can log them now with 'log contribution: [description]', or contributions are captured automatically during daily wrap-up."

**Period not specified for narrative generation:** Default to last quarter. Resolve to absolute dates and confirm: "Using last quarter ([resolved date range]). Say 'this month' or 'last 6 months' if you want a different range."

**[Inferred] entries in compiled output:** Always flag them. The user needs to verify inferred contributions before using them in performance docs. Use ⚠️ marker inline.

**User's role is IC but they logged manager-type contributions:** Accept and log them — roles evolve. Don't reject. Just use the correct category name.

**No competency areas in workspace config (self-review):** Ask the user: "What competency areas does your company's review process use? (e.g., Technical Impact, Collaboration, Leadership, Execution)" Draft only after they confirm. Do not invent a framework.

**Append-only:** Never overwrite or truncate an existing contributions file. New entries always go at the end of the file. If the file header is missing, create it first, then append — never rewrite existing entries.

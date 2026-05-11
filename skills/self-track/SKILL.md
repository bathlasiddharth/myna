---
name: self-track
disable-model-invocation: true
description: Log contributions and generate self-review documents — brag docs, self-reviews, promo packets. Query by category, project, or date. Self-calibration: check draft claims against your log. YOUR contributions only.
user-invocable: true
argument-hint: "log contribution: [description] | what did I do this quarter | draft my self-review for [period] | build my promo case | am I underselling myself? | what feedback did I give this [period]"
---

# myna-self-track

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

Logs your contributions and generates self-review documents from them. Input path: log what you did. Output path: compile it into usable documents.

## 📋 Before You Start

Read at session start:
- `_system/config/projects.yaml` — for cross-referencing project-level impact

**Contributions log path:** `Journal/contributions-{YYYY-MM-DD}.md` where the date is Monday of that week.

---

## 📂 Contribution Categories

Five universal categories — role-agnostic. A junior IC and a VP both log in the same buckets.

- `delivery` — things you built, shipped, or completed: features, designs, documents, processes
- `decisions` — calls you made when a direction was needed: architecture, scope, escalations resolved
- `feedback` — developmental input you gave to others: code reviews, written feedback, growth conversations
- `people` — helping, growing, or unblocking others: mentoring, coaching, unblocking teammates, onboarding
- `quality` — making things more reliable, maintainable, or efficient: documentation, process improvements, risk mitigation, issue prevention

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

**Entry format:**
```
- [{YYYY-MM-DD}] **{category}:** {description} [; result: {result}] [provenance] (source)
```
`result` captures what changed because of this contribution. Include it when stated or confidently inferable. Omit when genuinely unknown — do not fabricate.

**How:**
1. Parse the contribution. Extract: description, category (infer), date (today if not specified), source.
2. Infer `result` from the description if possible:
   - "resolved the P1 blocker" → result: P1 unblocked
   - "gave feedback on Sarah's API spec" → result: not inferable, omit
   - "shipped the auth migration" → result: auth migration live
3. Assign provenance: `[User]` (user typed it directly).
4. Find the Monday of the current week → `Journal/contributions-{YYYY-MM-DD}.md`.
   If file doesn't exist, create it:
```markdown
---
week_start: {YYYY-MM-DD}
---

#contributions

## Contributions — Week of {YYYY-MM-DD}

> Append-only. Each entry: date, category, description, result (if known), provenance, source.
```
5. **Write the entry immediately** — result or not. The entry is never held pending enrichment.
6. If `result` is missing or low-confidence: **also** add to `ReviewQueue/review-self.md`:
```
- [ ] Enrich contribution: "{description}"
  Logged: {YYYY-MM-DD} · {category}
  Inferred result: {inferred result, or "none inferred"}
  → confirm result | rewrite | skip (process as-is)
  ---
```
7. Confirm: "Logged: [{category}] {description}" — mention review queue only if an entry was added.

**The entry is written to the vault in step 5 regardless of what happens next.** The review queue is additive — it can improve the entry but never gates it.

Infer the category from the description. When ambiguous, pick the primary action — don't ask unless genuinely unclear.

**Worked example:**

User: "log contribution: led the auth migration design review and made the final call on the caching architecture"

1. Category: `decisions` (made the call).
2. Result: inferable — "caching architecture direction set, team unblocked."
3. Monday of current week: 2026-03-30.
4. Write immediately to `Journal/contributions-2026-03-30.md`:
   `- [2026-04-05] **decisions:** Led auth migration design review and made final call on caching architecture; result: caching direction set, team unblocked [User]`
5. Result was inferred with reasonable confidence — no review queue entry needed.

Output: "Logged: [decisions] Led auth migration design review — caching direction set."

---

**Worked example (result missing):**

User: "log contribution: gave feedback to Sarah on her API spec"

1. Category: `feedback`.
2. Result: not inferable from description alone — omit.
3. Write immediately to `Journal/contributions-2026-03-30.md`:
   `- [2026-04-05] **feedback:** Gave feedback to Sarah on her API spec [User]`
4. Add to `ReviewQueue/review-self.md`:
```
- [ ] Enrich contribution: "Gave feedback to Sarah on her API spec"
  Logged: 2026-04-05 · feedback
  Inferred result: none inferred
  → confirm result | rewrite | skip (process as-is)
  ---
```

Output: "Logged: [feedback] Gave feedback to Sarah — added to review queue for result context (say 'skip' when reviewing to process as-is)."

---

## 🔍 Contribution Queries

**Trigger:** "what decisions did I make this quarter?", "what did I do on [project]?", "show my contributions from March", "how much feedback did I give this month?"

**How:**
1. Determine the filter(s): category, project, date range, or count.
2. Find all relevant contributions files using Glob: `Journal/contributions-*.md`
3. Read files within the date range (if specified).
4. Filter entries by the requested criteria:
   - By category: match `**{category}:**` in entry
   - By project: match project name, aliases (from projects.yaml), source details, or wiki-links (`[[{project-slug}]]`) in entry
   - By date: match `[{date}` prefix
   - Count: count matching lines
5. Show results inline, organized by week.

**Date range defaults:**
- "this quarter" → current quarter start to today
- "this month" → first of current month to today
- "last quarter" → previous quarter
- "this year" → January 1 to today

**Worked example:**

User: "How much feedback did I give this quarter?"

1. Date range: Q1 2026 (Jan 1 – Mar 31) or Q2 2026 if current.
2. Glob `Journal/contributions-*.md`, read files in range.
3. Filter for `feedback` category entries.

Output:
```
## 🔍 Feedback — Q1 2026 (8 entries)

**Week of Mar 30:**
- [2026-04-02] feedback: Gave written feedback to Sarah on API spec quality — focused on error handling coverage; result: Sarah revised error handling section before review

**Week of Mar 23:**
- [2026-03-25] feedback: Delivered feedback on estimation accuracy — coaching session
- [2026-03-23] feedback: Gave feedback to Marcus on incident communication; result: Marcus updated the post-mortem

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
4. Organize chronologically by category. Report only what the data shows — do not surface provenance markers in the output.
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

## Delivery
- {date}: {description} [; result: {result}]

## Decisions
- {date}: {description} [; result: {result}]

## Feedback
- {date}: {description} [; result: {result}]

## People
- {date}: {description} [; result: {result}]

## Quality
- {date}: {description} [; result: {result}]

---
*Note: ⚠️ [Inferred] entries should be verified before use.*
```

**Worked example:**

User: "What did I do this quarter?"

Read contributions files for Jan–Mar 2026. Organize by category. Output:

```
## 📋 Q1 2026 — Contributions Summary

**Decisions (3)**
- Mar 15: Made final call on caching architecture for auth migration; result: caching direction set, team unblocked
- Feb 28: Drove consensus on API versioning strategy across 3 teams ⚠️ [Inferred]
- Jan 22: Decided to defer scope of v2 auth feature; result: team focused, shipped on time

**People (4)**
- Apr 2: Resolved API dependency blocker for Platform team; result: Platform team unblocked
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
3. Organize by the standard domains: Impact, Collaboration, Leadership, Execution. If the user specifies their company's competency areas ("our review uses Technical Impact, Delivery, People"), use those instead — map logged contributions to the provided areas.
4. Write a narrative self-review organized by those areas (not just a list of contributions). Reads as a genuine self-assessment — specific, evidence-based, honest about growth areas too.
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
4. Organize by the five contribution categories. For each: lead with entries that have a `result` field — these are the strongest evidence. Thin entries (no result) are included but de-prioritized.
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

   **Check 2 — Contributions not included:** Contributions logged but not mentioned in the draft. Highlight strongest ones (those with a `result` field first): "You logged 4 feedback entries in Q1 but the draft doesn't mention feedback contributions."

   **Check 3 — Language weaker than evidence:** Where you have strong evidence but hedged language. "You have 3 `people` entries including resolving a critical P1 blocker — but the draft says 'occasionally helped with blockers'."

5. Show calibration report inline. Offer to create a revised draft copy (`Drafts/[Self] {original-name} revised {date}.md`) incorporating the findings — never overwrite the existing draft.

**Worked example:**

User: "Am I underselling myself?"

Draft loaded: `Drafts/[Self] Self-Review H1 2026.md`

```
## 🔍 Self-Calibration Report

**Claims without evidence (1):**
- "Drove alignment on the API governance framework across Platform and Payments" — no contributions entry found. Verify or add a log entry if this happened.

**Contributions not in your draft (3):**
- 7 `feedback` entries not mentioned (including feedback to Sarah, Alex, Marcus)
- 2 `decisions` entries with results — strong ownership signal, worth including
- 1 `quality` entry (documented error handling standards for auth service)

**Language weaker than evidence:**
- You have 3 `people` entries including resolving a P1 blocker but the draft says 'occasionally helped teammates'. Consider: 'Actively unblocked teammates on 3 occasions including [strongest example].'

Overall: your draft undersells your feedback and unblocking work. The evidence is there — just not included.
```

---

## ⚠️ Edge Cases

**No contributions logged:** "No contributions found for that period. You can log them now with 'log contribution: [description]', or contributions are captured automatically during daily wrap-up."

**Period not specified for narrative generation:** Default to last quarter. Resolve to absolute dates and confirm: "Using last quarter ([resolved date range]). Say 'this month' or 'last 6 months' if you want a different range."

**Uncertain contributions:** If a contribution can't be confirmed from explicit source data, note it once at the end in plain English — e.g., "2 entries couldn't be verified from source notes — review before using in performance docs."

**User specifies custom competency areas for self-review:** Use the areas they provide — map logged contributions to those areas. If a contribution doesn't fit neatly, put it in the closest area and note it.

**Append-only:** Never overwrite or truncate an existing contributions file. New entries always go at the end of the file. If the file header is missing, create it first, then append — never rewrite existing entries.

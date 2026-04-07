# Self-Track

## Purpose

Track your contributions and generate career documents from them. Handles both the input side (logging what you did) and the output side (brag docs, self-reviews, promo packets, queries, self-calibration).

## Triggers

**Logging:**
- "log contribution: led the auth migration design review"
- "I unblocked the platform team on the API issue"
- Any statement about personal accomplishment that implies the user wants it recorded

**Generation:**
- "build my brag doc", "what did I do this quarter?"
- "draft my self-review for H1"
- "build my promo case", "build my promo packet"
- "am I underselling myself?" (self-calibration)

**Queries:**
- "what feedback did I give this quarter?"
- "what did I do on the Auth Migration project?"
- "show my contributions from March"
- "how many code reviews did I do this month?"

## Inputs

- `Journal/contributions-{YYYY-MM-DD}.md` — weekly contribution logs (Monday date in filename)
- `workspace.yaml` → `user.role` (determines contribution categories), `features.self_tracking`
- Project files under `Projects/` (for cross-referencing impact)
- Person files under `People/` (for feedback given, coaching entries)
- Meeting files under `Meetings/` (for decisions driven)

## Procedure

### Logging Contributions

1. Check `features.self_tracking` in workspace.yaml. If disabled, inform the user and stop.

2. Determine the current week's contributions file: `Journal/contributions-{monday-date}.md`. If the file doesn't exist, create it with the template:
   ```
   ---
   week_start: {YYYY-MM-DD}
   ---

   #contributions

   ## Contributions — Week of {YYYY-MM-DD}
   ```

3. From the user's statement, extract: description, category, related project (if mentioned), related people (if mentioned), impact (if stated).

4. Determine category from the user's role:
   - **IC roles** (senior-engineer, tech-lead): decisions-and-influence, unblocking-others, issue-prevention, code-reviews, feedback-given, documentation, escalations-handled, delegation-management, best-practices, risk-mitigation, coaching-and-mentoring
   - **Manager/PM roles** (engineering-manager, pm): add people-development, operational-improvements, strategic-alignment, hiring-and-team-building, cross-team-leadership, stakeholder-management

5. Append the entry to the contributions file:
   ```
   - [{YYYY-MM-DD} | capture] **{category}:** {description} [User]
   ```
   If the user mentioned a specific project, add `[project:: {name}]` inline. If impact was stated, include it in the description.

   User-typed contributions always get [User] tag — the user made the judgment about what to log.

6. Confirm: "Logged: {category} — {description}."

### Generating Self-Narrative Documents

Three output modes, all following the same assembly process:

1. Determine time range. Default: last quarter (13 weeks). User can specify: "for H1", "for Q1", "last 6 months", "since January".

2. Read all `Journal/contributions-{week}.md` files within the time range. If no contributions exist in the range, inform the user and stop — don't generate an empty document.

3. Cross-reference for richer context:
   - Project timelines — to connect contributions to project outcomes
   - Person files — to find feedback given and coaching entries
   - Meeting files — to find decisions driven and outcomes from meetings you led

4. Generate the document based on the requested mode:
   - **Brag Doc:** Chronological list organized by category. Factual, specific, shareable.
   - **Self-Review:** Narrative organized by competency areas or goals. Reads as a genuine self-assessment — not inflated, not robotic. Weaves contributions into a story per competency.
   - **Promo Packet:** Evidence-based case organized by level criteria. Each claim backed by specific contributions with dates.

5. **Highlight [Inferred] entries.** Any contribution with [Inferred] provenance must be clearly flagged in the generated document so the user can verify before submitting.

6. Save to `Drafts/[Self] {document-type} {period}.md`. Example: `[Self] Q1 brag doc.md`, `[Self] H1 self-review.md`, `[Self] promo packet 2026.md`.

   Frontmatter and tags:
   ```
   ---
   type: {brag-doc | self-review | promo-packet}
   audience_tier: upward
   created: {YYYY-MM-DD}
   ---

   #draft #{type}
   ```

7. Confirm with file link: "Draft saved to [[Self] Q1 brag doc]. Review it — [Inferred] items are flagged for your verification."

### Contribution Queries

1. Parse the query to determine filter criteria: category, project, person, date range, or count request.

2. Read contributions files covering the relevant time range.

3. Filter and present results inline. Include counts where useful. For feedback queries, include who received it and when.

4. If no contributions match the filter, say so and suggest broadening the search.

### Self-Calibration

Triggered by "am I underselling myself?" or similar. Requires an existing draft in `Drafts/` to calibrate against.

1. Ask which draft to calibrate against (or use the most recent [Self] draft if only one exists).

2. Read the draft and all contributions from the same time period.

3. Compare and flag three categories:
   - **Claims without evidence:** statements in the draft that have no matching contribution entry
   - **Missing contributions:** logged contributions not included in the draft
   - **Understated language:** places where the draft language is weaker than the evidence supports (e.g., "helped with" when the log shows you led it)

4. Present findings inline, organized by category. For each finding, show the specific draft text and the relevant contribution entry.

## Output

- `Journal/contributions-{YYYY-MM-DD}.md` — new entries appended (logging)
- `Drafts/[Self] {type} {period}.md` — generated career documents
- Inline results for queries and self-calibration

## Rules

- **User-typed contributions always get [User] tag.** The user already made the judgment call about what happened.
- **Conservative on manager categories.** IC contributions ("completed code review") are concrete. Manager contributions ("drove alignment across 3 teams") are harder to verify from data. When logging manager-type contributions, take the user's description at face value but don't embellish.
- **[Inferred] entries flagged in all generated output.** Never let an inferred contribution slip into a promo packet without the user seeing the flag.
- **Append-only.** New contributions are appended to the weekly file. Never edit or remove existing entries.
- **Weekly file boundaries.** Each week gets its own file keyed to Monday's date. When logging on a Wednesday, append to the file for that week's Monday.
- **No duplicate detection across skills.** Wrap-up, process, and process-meeting may also write contributions. This skill only handles the user-typed logging path. Duplicate checking between skills is not this skill's responsibility.
- **Performance narratives for direct reports** belong to the brief skill ("generate performance narrative for Sarah"), not here. This skill handles self-narratives only (your own contributions, your own self-review, your own promo packet).
- **Role fallback.** If `user.role` is not set, default to IC categories.

## Examples

### Logging

User: "log contribution: led the auth migration design review — resolved the caching debate and got alignment from Platform and Payments teams"

Read workspace.yaml: role is engineering-manager. Category: cross-team-leadership (resolved cross-team debate).

Append to `Journal/contributions-2026-04-01.md`:
```
- [2026-04-06 | capture] **cross-team-leadership:** Led the auth migration design review — resolved the caching debate and got alignment from Platform and Payments teams [User]
```

Output: "Logged: cross-team-leadership — Led the auth migration design review."

### Brag Doc Generation

User: "what did I do this quarter?"

Read contributions files for the last 13 weeks. Found 24 entries across 6 categories. Cross-reference: auth migration timeline shows project shipped on time, Sarah's person file shows 3 feedback entries.

Save to `Drafts/[Self] Q1 brag doc.md`:
```
## Q1 2026 — Brag Doc

### Cross-Team Leadership (4 entries)
- Led auth migration design review, resolving caching debate across Platform and Payments (Apr 6)
- ...

### Unblocking Others (6 entries)
- ...

⚠ Flagged for review: 3 entries marked [Inferred] — verify before sharing.
```

Output: "Draft saved to [[Self] Q1 brag doc]. 24 contributions across 6 categories. 3 [Inferred] entries flagged for review."

### Query

User: "what feedback did I give this quarter?"

Filter contributions by category: feedback-given, coaching-and-mentoring. Also scan person files for entries with Pending Feedback cleared by the user.

Output:
> 8 feedback entries this quarter:
> - Sarah Chen: 3 entries (growth areas: API design patterns, Mar 12; delegation skills, Mar 26; recognition: incident handling, Apr 2)
> - Alex Kumar: 2 entries (recognition: debugging, Mar 15; growth area: documentation, Mar 28)
> - Marcus: 3 entries (coaching on incident response, Mar 5, Mar 19, Apr 1)
>
> Gap: No feedback logged for Maya in 47 days.

### Self-Calibration

User: "am I underselling myself?"

Read most recent draft: `[Self] H1 self-review.md`. Read all contributions from H1 period (42 entries).

Output:
> **Claims without evidence (1):** "improved team processes" — no matching contribution. Add evidence or remove.
>
> **Missing contributions (3):** Cross-team API blocker resolution (Mar 15), coaching Marcus through incident responses (3 entries), Q1 planning leadership — none in your draft.
>
> **Understated language (2):** "helped with the auth migration" — log shows you led the design review. "participated in hiring" — log shows 6 interviews and 2 onboarding sessions.

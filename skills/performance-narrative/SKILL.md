---
name: performance-narrative
disable-model-invocation: true
description: Generate a performance narrative for a team member's review cycle from observations, recognition, contributions, and meeting notes. Also calibrates consistency across multiple narratives. Invoke for "build Sarah's review narrative", "performance summary for Sarah", "review my narratives" (calibration mode).
user-invocable: true
argument-hint: "[person name] [optional: time period] | review my narratives"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

# Performance Narrative

Two modes:
1. **Generate** — compile a performance narrative for one person from vault data
2. **Calibrate** — after generating narratives for multiple directs, check consistency across the set

---

## Mode 1: Generate a Performance Narrative

### Resolve the Person and Time Period

Resolve person name via fuzzy matching against people.yaml. If multiple matches, ask.

Default time period: last 3 months. The user can specify: "last 6 months", "last quarter", "H1 2026", a date range.

Parse the time period to a concrete date range. All source data is filtered to this range.

---

### Data to Gather

Read all of the following and filter to the time period:

| Source | Path | What to extract |
|--------|------|-----------------|
| Observations | `People/{person-slug}.md` — Observations section | All entries: type (strength/growth-area/contribution), date, context, provenance |
| Recognition | `People/{person-slug}.md` — Recognition section | All entries: date, what they did, source, provenance |
| Pending feedback | `People/{person-slug}.md` — Pending Feedback section | Undelivered observations — include in narrative but flag as unverified |
| 1:1 meeting notes | `Meetings/1-1s/{person-slug}.md` | Discussion items, decisions, action items — session by session |
| Project timeline entries | `Projects/*.md` — Timeline sections | Any entry mentioning this person's name or wiki-link |
| Contributions log | `Journal/contributions-{week}.md` — all weeks in the period | Entries where this employee is the actor, not the recipient. Exclude manager-side entries like "delivered feedback to Sarah" — those are the user's contributions, not the employee's. |

Collect everything. Then bucket it:

**Strengths** — observations with type `strength`, recognition entries, positive project mentions
**Growth areas** — observations with type `growth-area`
**Contributions** — observations with type `contribution`, contributions log entries mentioning them, project timeline contributions
**Impact evidence** — decisions they drove (project timelines), blockers they unblocked, recognition from external sources

---

### Writing the Narrative

Write a genuine professional narrative — no AI tells, no hedging, no formulaic structure. No boilerplate like "Sarah is a valued member of the team." Start with the most important thing.

Structure the narrative naturally around what the data supports. Typical structure:

1. Overall performance assessment — one strong opening sentence grounded in the evidence
2. Key strengths — with specific examples from the data. Not "Sarah is a strong communicator" — show it: "Sarah's handling of the March 22 outage (resolved in under 2 hours) and her clear escalation to leadership demonstrated both technical depth and communication under pressure."
3. Impact and contributions — concrete deliverables, projects delivered, cross-team work
4. Growth areas — honest, specific, constructive. Evidence-grounded, not vague.
5. Look forward — development opportunities tied to the growth areas (if there's data on goals from 1:1 notes)

**Inferred data points:** Where a data point has `[Inferred]` provenance, include it in the narrative but mark it with `[Inferred]` inline so the user knows to verify before using it. Example:

> Sarah drove the caching architecture decision in February `[Inferred]` — confirm before including in formal review.

**Pending feedback:** Include observations from Pending Feedback section in the narrative, but note them as "undelivered" so the user remembers to give the feedback before the review conversation.

---

### Draft File

Save the narrative to `Drafts/[Self] {person-name} review narrative {period}.md`.

Frontmatter:
```yaml
---
type: self-review
audience_tier: upward
related_person: {person-slug}
period: {YYYY-MM-DD to YYYY-MM-DD}
created: {YYYY-MM-DD}
---
```

Show the full narrative inline AND save it to Drafts/. Give the user the file path.

---

### Post-Generation Summary

After showing the narrative, show a brief data summary:

```
---
**Data used:**
- [N] observations ([X] strengths, [Y] growth areas, [Z] contributions)
- [N] recognition entries
- [N] project timeline mentions
- [N] 1:1 sessions reviewed
- [N] [Inferred] entries — review these before finalizing

**Missing data:**
- [Any source files that weren't found or had no entries in the period]
```

---

## Mode 2: Calibration — "review my narratives"

After generating narratives for multiple directs (or if multiple narrative drafts already exist in Drafts/), calibrate for consistency.

### Trigger

Recognized when the user says: "review my narratives", "calibrate my reviews", "check my narratives for consistency", or after generating 3+ narratives in the same session.

### What to Read

Glob `Drafts/[Self] *.md` — find all `[Self]` draft files. Read frontmatter for each to filter by `type: self-review` and presence of `related_person` and `period` fields. These are performance narrative drafts. If fewer than 2 qualifying drafts found, inform: "Calibration needs at least 2 narratives. Found [N] in Drafts/."

### What to Check

**Evidence depth:** Is the evidence (number of specific examples, citations) roughly proportional across people? Flag if one narrative has 8 specific examples and another has 2.

**Language strength:** Are similar contributions described with comparable strength across narratives? Flag cases where one person's impact is described more strongly than another's despite similar evidence.

**Coverage balance:** Does each narrative cover strengths AND growth areas? Flag if a narrative covers only strengths (may suggest avoidance of difficult feedback).

**Length balance:** Significant length differences may indicate unequal investment. Flag if one narrative is 3x longer than another with similar evidence depth.

**Unconscious patterns:** Check for systematic patterns — do narratives for certain people consistently use hedged language ("tends to", "sometimes", "can improve") while others use confident language? Report the pattern as a factual observation, not a judgment about the manager.

### Calibration Output

```
## Narrative Calibration — [date]

**Narratives reviewed:** [N] ([names])

---

### Evidence Depth
| Person | Specific Examples | Recognition Entries | Timeline Mentions |
|--------|------------------|--------------------|--------------------|
| Sarah  | 6                | 3                  | 4                  |
| Alex   | 2                | 1                  | 1                  |
| Marcus | 5                | 2                  | 3                  |

⚠️ Alex's narrative has significantly less supporting evidence than others. Consider: do you have less data on Alex, or is the data under-represented in the narrative?

---

### Language Patterns
⚠️ Sarah and Marcus's narratives use direct language ("delivered", "drove", "resolved"). Alex's uses hedged language ("tends to contribute", "can be effective"). If the evidence is similar, consider whether the language matches the actual impact.

---

### Coverage Gaps
⚠️ Alex's narrative covers only strengths — no growth areas. If you have observations logged, they may not be reflected.

---

### Length
| Person | Word count |
|--------|------------|
| Sarah  | 420        |
| Alex   | 180        |
| Marcus | 390        |

⚠️ Alex's narrative is less than half the length of others. This may be intentional if less data is available.

---

**Note:** Calibration surfaces data patterns — it doesn't auto-correct. Review flagged items and decide whether to update the narratives.
```

---

## Worked Examples

### Generate narrative

**User:** "build Sarah's review narrative for the last 6 months"

**Time period:** 2025-10-12 to 2026-04-12

**Data gathered:**
- 12 observations (8 strengths, 4 growth areas) — all in period
- 5 recognition entries
- 3 project timeline contribution mentions
- 8 1:1 sessions
- 2 contributions log entries

**Draft saved:** `Drafts/[Self] sarah-chen review narrative 2025-10-12 to 2026-04-12.md`

**Narrative (shown inline):**

```
Sarah had a strong six months. The clearest evidence is the Auth Migration — she took ownership of the API spec, coordinated with Platform, and kept the project moving through a difficult external dependency. The March 22 incident response was a standout: she resolved a P0 in under 2 hours, communicated clearly to leadership throughout, and wrote a thorough post-mortem.

**Strengths**

Technical leadership is Sarah's most consistent strength. She drove the caching architecture decision in February [Inferred], wrote the API spec that unblocked three downstream teams, and led two design reviews where she shaped the final direction.

Under pressure, she's reliable. The outage response demonstrated that — calm, methodical, effective. Three separate observers noted this across different contexts.

Cross-team collaboration has improved noticeably over this period. Early observations noted that she sometimes operated in isolation; recent 1:1s show she's proactively looping in the Platform team earlier.

**Growth Areas**

Documentation is an area with room to grow. Two observations note that her work is often stronger than the written artifacts that represent it — the caching proposal was approved on her verbal advocacy, but the written spec needed significant revision. One observation from January noted the same pattern on the onboarding guide. [Inferred: one of these observations may reflect a single incident — verify before emphasizing]

**Contributions**

Delivered Auth Migration Phase 1 on schedule. Unblocked the Onboarding Flow project by resolving the shared API dependency. Gave feedback to 3 team members (2 formal, 1 in 1:1). Led incident response for the March 22 outage.

**Looking Forward**

Q3 growth goals (from 1:1 notes, Mar 7 and Apr 2) — Sarah has expressed interest in technical leadership and staff-track progression. The documentation gap is the clearest development area to address before a staff-track case can be made.
```

---

```
---
**Data used:**
- 12 observations (8 strengths, 4 growth areas, 0 contributions)
- 5 recognition entries
- 3 project timeline mentions
- 8 1:1 sessions reviewed
- 2 [Inferred] entries — review these before finalizing

**Missing data:**
- No contributions log entries mentioning Sarah in this period (contributions-{week}.md files)
```

---

## Edge Cases

- **No person file:** "No person file found for [person]. Performance narrative requires observations and recognition data. Create the person file and log observations first."
- **No data in the time period:** "No observations or recognition entries found for [person] in the [period]. Narrative can't be generated without data — log observations first."
- **Person is not a direct:** Generate the narrative if requested, but note: "[person] is listed as [relationship_tier], not a direct report. Proceeding — but verify you have the right person."
- **All data is [Inferred]:** Generate the narrative but add a prominent warning: "All [N] data points in this narrative are [Inferred] — none were explicitly stated. Verify all claims before using in a formal review."
- **Calibration with 1 narrative:** "Calibration needs at least 2 narratives. Found 1 draft in Drafts/. Generate more narratives and run calibration again."

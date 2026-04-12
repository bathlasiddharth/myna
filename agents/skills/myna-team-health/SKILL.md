---
name: myna-team-health
description: Team health dashboard — point-in-time overview of all direct reports showing open tasks, overdue items, feedback gaps, attention gaps, last 1:1, and recent contributions. For managers only. Invoke for "how is my team doing?", "team health", "team overview".
user-invocable: true
argument-hint: "[optional: person name to focus on one person]"
---

# Team Health Overview

Point-in-time dashboard for all direct reports. Read-only — inline output. No vault writes unless the user asks to save.

---

## Prerequisites

Check `features.team_health` in workspace.yaml. If disabled, inform the user and stop.

Check `user.role` in workspace.yaml. If the role is not `engineering-manager` or `pm`, inform the user: "Team Health is designed for managers. Your role is set to [role] — if this is incorrect, update workspace.yaml."

---

## Data to Gather

For each person in people.yaml with `relationship_tier: direct`:

| Signal | Source | How to get it |
|--------|--------|---------------|
| Open tasks | Grep `[person:: {slug}]` + `- [ ]` across `Projects/` | Count open, count overdue (📅 date < today) |
| Delegations | Grep `[type:: delegation] [person:: {slug}]` | Count open delegations, count overdue |
| Last 1:1 date | `Meetings/1-1s/{person-slug}.md` | Most recent session header (`## {YYYY-MM-DD} Session`) |
| Next 1:1 date | Calendar MCP | Next scheduled 1:1 with this person |
| Last feedback date | `People/{person-slug}.md` Observations section | Most recent observation entry date |
| Feedback gap | Compare last feedback date to today vs `feedback_cycle_days` from workspace.yaml (or person's override) | Flag if gap > threshold |
| Attention gap | `People/{person-slug}.md` observations + `Meetings/1-1s/{person-slug}.md` session count | Flags below |
| Recent contributions | `People/{person-slug}.md` recognition log + contributions log | Entries in the last 14 days |

**Attention gap signals (all factual — no inference about the person):**
- No observation logged in 45+ days: "No observations in [N] days"
- Last 3+ 1:1 sessions had no new topics added by you: check prep sections for items you added vs carried from previous
- No career development topics logged in 4+ months: Grep `career` or `growth` in 1:1 meeting notes
- 3+ overdue delegations: already captured in task query above

Check `features.attention_gap_detection` and `features.feedback_gap_detection` in workspace.yaml. If either is disabled, skip those columns.

---

## Output

### Summary Table

Show a table first for quick scanning:

```
## 🏥 Team Health — [date]

| Person | Open | Overdue | Feedback | Last 1:1 | Attention |
|--------|------|---------|----------|----------|-----------|
| Sarah  | 5    | 1       | 12 days  | Apr 2    | ✅        |
| Alex   | 8    | 3       | 45 days ⚠️ | Mar 28   | ⚠️ 52d no obs |
| Marcus | 4    | 0       | 28 days  | Apr 5    | ⚠️ 3 overdue delg |
| Maya   | 6    | 1       | 61 days ⚠️ | Apr 1    | ⚠️ No career topics 4mo |
```

Columns:
- **Open** — count of open tasks assigned to this person
- **Overdue** — count of tasks past due date
- **Feedback** — days since last logged observation. Flag with ⚠️ if gap exceeds threshold.
- **Last 1:1** — date of most recent 1:1 session
- **Attention** — ✅ if no gaps, or brief flag description if gaps detected

### Per-Person Detail

After the table, show one line of context per flagged person (those with ⚠️):

```
### ⚠️ Needs Attention

**Alex Kumar** — 45-day feedback gap, 3 overdue tasks
- Last feedback: 2026-02-24 (45 days ago, threshold: 30 days)
- Overdue tasks: "Review caching proposal" (12 days), "Platform API doc" (5 days), "Security audit response" (2 days)
- No observations logged since Feb 24

**Maya Patel** — 61-day feedback gap, no career development topics in 4 months
- Last feedback: 2026-02-10 (61 days ago)
- Last career/growth discussion: 2025-12-15 (4 months ago)
```

### Recent Contributions (last 14 days)

List contributions per person from recognition log entries dated in the last 14 days:

```
### 🏆 Recent Contributions (last 14 days)

- **Sarah** — Shipped auth migration Phase 1 on time [2026-04-02]
- **Sarah** — Excellent incident response during outage [2026-03-28]
- **Marcus** — Mentored two new engineers on onboarding [2026-04-05]
```

If no contributions in the last 14 days for a person, that person simply doesn't appear. Don't write "no contributions for Alex" — just omit them.

---

## Worked Example

**User:** "how is my team doing?"

**Directs from people.yaml:** Sarah Chen, Alex Kumar, Marcus James, Maya Patel

**Data gathered per person:**
- Sarah: 5 open tasks, 1 overdue (past due 2 days), last feedback Apr 2 (12 days), last 1:1 Apr 2, no attention gaps
- Alex: 8 open tasks, 3 overdue, last feedback Feb 24 (45 days — threshold 30), last 1:1 Mar 28, no observations in 52 days
- Marcus: 4 open tasks, 0 overdue, last feedback Mar 15 (28 days), last 1:1 Apr 5, 3 overdue delegations
- Maya: 6 open tasks, 1 overdue, last feedback Feb 10 (61 days — threshold 30), last 1:1 Apr 1, no career topics in 4 months

**Output:**

```
## 🏥 Team Health — 2026-04-12

| Person | Open | Overdue | Feedback | Last 1:1 | Attention |
|--------|------|---------|----------|----------|-----------|
| Sarah  | 5    | 1       | 12 days  | Apr 2    | ✅        |
| Alex   | 8    | 3       | 45 days ⚠️ | Mar 28   | ⚠️ 52d no obs |
| Marcus | 4    | 0       | 28 days  | Apr 5    | ⚠️ 3 overdue delg |
| Maya   | 6    | 1       | 61 days ⚠️ | Apr 1    | ⚠️ No career 4mo |

---

### ⚠️ Needs Attention

**Alex Kumar** — 45-day feedback gap, 3 overdue tasks
- Last feedback: 2026-02-24 (45 days ago, threshold: 30 days)
- Overdue: "Review caching proposal" (12d), "Platform API doc" (5d), "Security audit response" (2d)
- No observations logged since Feb 24

**Marcus James** — 3 overdue delegations
- Overdue delegations: "Onboarding guide update" (8d), "Q2 roadmap input" (3d), "Architecture review notes" (1d)

**Maya Patel** — 61-day feedback gap, no career topics in 4 months
- Last feedback: 2026-02-10 (61 days, threshold: 30)
- Last career/growth discussion in 1:1 notes: 2025-12-15

---

### 🏆 Recent Contributions (last 14 days)

- **Sarah** — Shipped auth migration Phase 1 on time [2026-04-02]
- **Sarah** — Strong incident response, resolved P0 in under 2 hours [2026-03-28]
- **Marcus** — Mentored two new engineers through onboarding [2026-04-05]
```

---

## Edge Cases

- **No directs in people.yaml:** "No direct reports found in people.yaml. Add people with `relationship_tier: direct` to enable team health."
- **Person file missing for a direct:** Show their row with only what's available from tasks/meetings. Note "No person file — observations and recognition data unavailable."
- **1:1 meeting file missing:** Show "—" for Last 1:1 date.
- **Calendar MCP unavailable:** Skip Next 1:1 column, note that calendar is unavailable.
- **Single person focus:** "how is Sarah doing?" → show the full detail view for Sarah only, not the table.
- **features.team_health disabled:** "Team health tracking is disabled. Enable it in workspace.yaml under `features.team_health: true`."

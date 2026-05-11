---
name: 1on1-analysis
disable-model-invocation: true
description: Analyze 1:1 patterns with a specific person — action item follow-through, recurring topics, carry-forward rate. Reports facts from notes only. Does NOT assess relationship quality. Invoke for "analyze my 1:1s with Sarah", "1:1 trends with Alex", "1:1 patterns".
user-invocable: true
argument-hint: "[person name]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

# 1:1 Pattern Analysis

Reviews 1:1 session notes for a specific person and surfaces factual patterns across sessions. Read-only — inline output only.

**Strict data boundary:** Report only what's in the notes. No inferences about relationship quality, engagement, or morale. "Fewer topics" is a count, not a signal about anything.

---

## Resolve the Person

Match the user's input against people.yaml via fuzzy resolution. If multiple matches, ask the user to clarify. Proceed for any relationship tier — the user may analyze 1:1s with their manager or a peer.

---

## What to Read

**Primary source:** `Meetings/1-1s/{person-slug}.md`

Sessions are typically organized with a dated heading, a prep section (checklist items), and a notes section (discussion, action items, decisions). Adapt to whatever structure is actually present — the user may have added custom sections or the format may have evolved.

Read all sessions. Parse all `## {YYYY-MM-DD} Session` headings and sort ascending by date before analysis.

Default to sessions from the last 12 weeks. The user can specify a different range ("last 6 months", "last 10 sessions").

**Additional sources for action item follow-through:**
- `Projects/*.md` — Grep for open and completed tasks with `[person:: [[{name}]]` involving this person. Completed tasks (`- [x]`) provide additional evidence that action items were addressed, even if not reflected in meeting notes.

**Note on two distinct item types:**
- **Prep items** — checkbox items associated with the session. Checkbox state (`[x]` = addressed, `[ ]` = not addressed/carried forward) is the primary signal for carry-forward analysis.
- **Action items** — commitments made during the session, typically under a notes or action items section. These are freeform text. Track them by checking whether the same item text appears in a later session as addressed.

---

## What to Analyze

### 1. Action Item Follow-Through

For each session (starting from the second), check whether action items from the previous session appear as addressed in the current session's notes or prep.

- Count action items from the previous session that were addressed vs. not addressed
- List unaddressed items specifically: the item text and the session it came from
- Calculate follow-through rate: X of Y action items addressed across analyzed sessions

### 2. Recurring Unresolved Topics

Scan discussion notes across all sessions for topics that appear in 3 or more sessions. A topic recurs when the same term, phrase, or subject appears in the discussion text across sessions.

A topic is resolved if: the corresponding prep item is checked `[x]` in the same or a subsequent session, or the same or a subsequent session contains "resolved", "closed", "done", "decided", or "won't pursue" in close proximity to that topic text.

List each recurring unresolved topic:
- Topic name/description
- Sessions it appeared in (dates)
- Whether it was ever marked resolved

Do not infer why it recurs — just report the facts.

### 3. Carry-Forward Rate

Carry-forward is tracked via Prep checkboxes. For each session, count:
- Prep items marked `- [ ]` (not addressed — carried forward or dropped)
- Prep items marked `- [x]` (addressed in that session)

If a `- [ ]` item from session N appears again in session N+1's Prep, it is confirmed as carried forward. If it disappears, it was dropped.

Carry-forward rate per session = unchecked items / total prep items. Report the per-session rate and the average across sessions.

---

## Output Structure

```
## 1:1 Analysis — [Person Name]

**Sessions analyzed:** [N] sessions ([date range])

---

### Action Item Follow-Through

**Overall rate:** [X]% ([Y of Z] action items addressed across analyzed sessions)

**All analyzed sessions:**
| Session | Action Items | Addressed | Not Addressed |
|---------|-------------|-----------|---------------|
| Apr 2   | 3           | 2         | 1             |
| ...     | ...         | ...       | ...           |

**Unaddressed items (from analyzed sessions):**
- "Review caching architecture proposal" — from Mar 21, not addressed in Mar 28 or Apr 2
- "Send growth plan template" — from Apr 2, not yet addressed

---

### Recurring Unresolved Topics

Topics appearing in 3+ sessions without resolution:

- **API spec ownership** — appeared in: Feb 14, Mar 7, Mar 21, Apr 2 (4 sessions). Not resolved.
- **Q3 growth goals discussion** — appeared in: Mar 7, Mar 28, Apr 2 (3 sessions). Not resolved.

---

### Carry-Forward Rate

**Average carry-forward rate:** [X]% (average across [N] sessions)

| Session | Total Prep Items | Unchecked | Checked | Carry-Forward % |
|---------|-----------------|-----------|---------|-----------------|
| Apr 2   | 6               | 3         | 3       | 50%             |
| ...     | ...             | ...       | ...     | ...             |
```

---

## Worked Example

**User:** "analyze my 1:1s with Sarah"

**File read:** `Meetings/1-1s/sarah-chen.md` — 8 sessions from 2026-01-31 to 2026-04-02

**Output:**

```
## 1:1 Analysis — Sarah Chen

**Sessions analyzed:** 8 sessions (2026-01-31 to 2026-04-02)

---

### Action Item Follow-Through

**Overall rate:** 72% (18 of 25 action items addressed across 8 sessions)

**Recent sessions:**
| Session | Action Items | Addressed | Not Addressed |
|---------|-------------|-----------|---------------|
| Apr 2   | 3           | 2         | 1             |
| Mar 28  | 4           | 4         | 0             |
| Mar 21  | 3           | 2         | 1             |
| Mar 7   | 4           | 3         | 1             |

**Unaddressed items:**
- "Finalize onboarding guide outline" — from Mar 7, appeared again Mar 21, not in later sessions
- "Review caching architecture proposal" — from Mar 21, not in Mar 28 or Apr 2

---

### Recurring Unresolved Topics

Topics appearing in 3+ sessions without resolution:

- **API spec ownership and timeline** — appeared in: Feb 14, Mar 7, Mar 21, Apr 2 (4 sessions). Not resolved.
- **Q3 growth goals** — appeared in: Mar 7, Mar 28, Apr 2 (3 sessions). Not resolved.

---

### Carry-Forward Rate

**Average carry-forward rate:** 46% (across 7 session transitions)

| Session | Total Prep Items | Unchecked | Checked | Carry-Forward % |
|---------|-----------------|-----------|---------|-----------------|
| Apr 2   | 6               | 3         | 3       | 50%             |
| Mar 28  | 5               | 2         | 3       | 40%             |
| Mar 21  | 7               | 4         | 3       | 57%             |
| Mar 7   | 5               | 2         | 3       | 40%             |
```

---

## Edge Cases

- **No 1:1 file found:** "No 1:1 meeting file found for [person]. 1:1 analysis requires meeting notes in `Meetings/1-1s/{person-slug}.md`."
- **Fewer than 3 sessions:** Show what's available, note "Analysis is limited — only [N] sessions found."
- **Notes section empty in a session:** That session counts toward the total but cannot contribute to action item or recurring topic analysis. Note how many sessions had no notes.
- **No action items in any session:** Skip the Action Item Follow-Through section, note that no action items were found in the notes.
- **No prep checkboxes:** Skip Carry-Forward Rate, note that no prep items were found.
- **User specifies a range:** Filter sessions by date range or count, proceed with the filtered set.

---
name: myna-plan
description: Planning advice — analyzes your workload, meetings, and tasks to suggest what to focus on. Three modes: Plan Day (schedule and priorities), Priority Coaching (top 3 with reasoning), Week Optimization (meetings to skip, best focus slots). Never writes to vault — all output is inline.
user-invocable: true
argument-hint: "[day | week | priorities | am I over-committed?]"
---

# myna-plan

Ephemeral planning advice. Reads the vault and calendar, shows recommendations inline. **Never writes to the vault.** If you want to act on the advice — block time, defer a task — use myna-sync, myna-calendar, or myna-capture.

---

## Three Modes

Determine the mode from the user's request:

| Request type | Mode |
|---|---|
| "what should I focus on today", "plan my day", "what do I tackle first" | **Plan Day** |
| "priority coaching", "top priorities", "what are my top 3", "am I over-committed?" | **Priority Coaching** |
| "week optimization", "plan my week", "what meetings can I skip", "best time for deep work" | **Week Optimization** |

If intent is ambiguous, ask: "Planning your day, or would you like priority coaching or week optimization?"

---

## What to Read

Read these before showing output:

1. **workspace.yaml** — `work_hours`, `timezone`, `features` map
2. **Today's daily note** (`Journal/DailyNote-{YYYY-MM-DD}.md`) — check Immediate Attention section and any sync snapshots for current state
3. **Calendar** (via calendar MCP) — events for today (Plan Day / Priority Coaching) or the full week (Week Optimization). If unavailable, note it and work from the daily note.
4. **Open tasks** — Grep `myna/Projects/` for `- \[ \]` with due dates, priority flags, and `[type:: delegation]`
5. **Project files** — scan `myna/Projects/` for blocked items (`[!warning] Blocker`) and stalled projects (no timeline entry in last 14 days)

---

## Plan Day

Show a concrete, ordered picture of the day.

**Output structure:**

```
📅 Today — {YYYY-MM-DD}

⚡ Capacity: {focus_hours} hrs available | {meeting_hours} hrs in meetings | {task_effort_hours} hrs of task effort due
{Over-capacity flag if task effort > focus time.}

🎯 Suggested order:
1. {task or block} — {why first: overdue / blocks someone / deadline}
2. {task or block} — {why}
3. ...

📅 Your meetings:
- {HH:MM} {meeting name} ({duration})
- ...

⚠️ Flags:
- {overdue delegation}: {person} was due to send {thing} by {date}
- {approaching deadline}: {task} due tomorrow, not started
- {deferred N times}: {task} has been carried forward {N} days

💡 Consider:
- {Specific suggestion: "Move MBR draft to Thursday — you have a 3-hr morning block then"}
```

**Priority ordering logic:**

Rank tasks by: (1) overdue, (2) blocks another person's work `[type:: dependency]`, (3) due today with high priority `⏫`, (4) due today, (5) high priority but no due date, (6) carried forward multiple times (check for prior daily notes where this task appeared).

---

## Priority Coaching

Show the 3 things that matter most right now, with clear reasoning.

**Output structure:**

```
🏆 Top 3 priorities right now:

1. {task or goal} — {specific reason: "blocks Sarah's API work, deadline Friday"}
2. {task or goal} — {specific reason: "deferred 3 times, high-priority project"}
3. {task or goal} — {specific reason: "overdue delegation from Marcus, 5 days late"}

⚠️ Watch list:
- {task}: {flag — "no due date, has been sitting for 2 weeks"}
- {delegation}: {flag — "asked Alex for X on {date}, no update"}

🔄 Recurring carry-overs:
- {task} has been carried forward {N} days. Either commit to it today or explicitly defer to {date}.
```

**Include carry-over detection:** Compare task names across the last 3 daily notes' Immediate Attention sections. A task that appears in 3+ consecutive notes is a recurring carry-over — flag it explicitly with the count.

---

## Week Optimization

Step back from today and look at the full week.

**Output structure:**

```
📆 Week of {YYYY-MM-DD}

⚡ Capacity overview:
| Day | Meetings | Est. Focus | Tasks Due |
|-----|----------|-----------|-----------|
| Mon | {N} hrs  | {N} hrs   | {N}       |
| Tue | {N} hrs  | {N} hrs   | {N}       |
| ...

🎯 Best days for deep work: {day(s)} — {reason: "fewest meetings, morning free"}

⚠️ Packed days: {day(s)} — {reason: "4 hrs meetings, 3 tasks due"}

💡 Optimization suggestions:
- {Specific suggestion: "Wednesday morning has 3 hrs free — good time for the MBR draft you've been deferring"}
- {Meeting suggestion: "The platform sync Tuesday has no agenda items matching your current priorities — consider whether you need to attend"}
- {Delegation suggestion: "Marcus's infra proposal is 5 days overdue — follow up now before Friday crunch"}

🔮 This week's risk: {top 1–2 things most likely to cause problems if not addressed}
```

**Optimization criteria:**
- Meetings to consider skipping: recurring meetings with no agenda items touching your current tasks or projects. Never say "cancel" — say "consider whether you need to attend."
- Optimal focus slots: contiguous blocks of 2+ hours with no calendar events.
- What to safely defer: tasks with no due date, no dependencies, no one waiting on them.

---

## Examples

### Example 1: Plan Day

User says: "what should I focus on today?"

Read: daily note (Sync — 8:47 AM snapshot shows 2 overdue tasks, 1 overdue delegation), calendar (3 meetings totaling 2.5 hrs), project files (auth migration blocker, platform API on track).

Output:
```
📅 Today — 2026-04-07

⚡ Capacity: 5.5 hrs available | 2.5 hrs in meetings | ~6 hrs of task effort due
⚠️ Slightly over capacity — one item worth deferring.

🎯 Suggested order:
1. API spec review (due today, blocks Sarah's implementation work)
2. Follow up with Alex on infra proposal (5 days overdue delegation)
3. Auth migration status update (project meeting at 4 PM — this feeds it)
4. MBR draft (due Friday — start today to avoid crunch)

📅 Your meetings:
- 10:00 AM Weekly sync (30 min)
- 2:00 PM 1:1 with Sarah (30 min)
- 4:00 PM Design review (1 hr)

⚠️ Flags:
- Overdue delegation: Alex was due to send infra proposal by 2026-04-02
- At-risk: MBR draft due Friday, not started

💡 Consider:
- Move status report writing to after the design review — you'll have fresh context from the meeting
```

### Example 2: Priority Coaching

User says: "priority coaching"

Output:
```
🏆 Top 3 priorities right now:

1. API spec review — due today, Sarah can't proceed without it
2. Follow up with Alex on infra proposal — 5 days past due, overdue delegations compound
3. Auth migration design doc — carried forward 4 days, high priority, no blocker

⚠️ Watch list:
- MBR draft: no progress in 2 weeks, due Friday
- Platform API deployment: no timeline update in 18 days

🔄 Recurring carry-overs:
- "MBR draft" has appeared in your Immediate Attention for 4 consecutive days. Commit to starting it today or explicitly defer to Thursday with a calendar block.
```

### Example 3: Week Optimization

User says: "plan my week"

Output:
```
📆 Week of 2026-04-07

⚡ Capacity overview:
| Day | Meetings | Est. Focus | Tasks Due |
|-----|----------|-----------|-----------|
| Mon | 2.5 hrs  | 5.5 hrs   | 6         |
| Tue | 1 hr     | 7 hrs     | 2         |
| Wed | 3.5 hrs  | 4.5 hrs   | 1         |
| Thu | 0.5 hrs  | 7.5 hrs   | 3         |
| Fri | 2 hrs    | 6 hrs     | 4 (MBR)   |

🎯 Best days for deep work: Tuesday and Thursday — both have 7+ hrs focus time

⚠️ Packed days: Wednesday — 3.5 hrs meetings, limited focus time

💡 Optimization suggestions:
- Tuesday morning is ideal for the MBR draft — 3 hr uninterrupted block 9–12 AM
- Wednesday's platform sync has no open agenda items matching your priorities — check if attendance is required
- Thursday is your lightest day — good for exploratory or deferred work

🔮 This week's risk: MBR draft due Friday with no start — block Tuesday morning before it becomes a crunch
```

---

## Edge Cases

**Calendar unavailable:** Work from the daily note sync snapshot if one exists. Note that meeting counts may be outdated. Skip Meeting details in Plan Day output.

**Daily note missing (no sync run):** Note "No daily note found — run 'sync' first for full context." Still show what's available from project files and task queries.

**Ambiguous mode:** When "plan my day" and "priority coaching" would produce similar output (low task count, few meetings), default to Plan Day mode and offer: "Say 'priority coaching' for a more coaching-focused view."

**Feature toggle:** No toggles gate planning modes — this skill is always available.

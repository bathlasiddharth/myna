---
name: plan
disable-model-invocation: true
description: Planning advice — analyzes your workload, meetings, and tasks to suggest what to focus on. Three modes: Plan Day (schedule and priorities), Priority Coaching (top 3 with reasoning), Week Optimization (meetings to skip, best focus slots). Never writes to vault — all output is inline.
user-invocable: true
argument-hint: "[day | week | priorities | am I over-committed?]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:init` and stop.

# plan

Ephemeral planning advice. Reads the vault and calendar, shows recommendations inline. **Never writes to the vault.** If you want to act on the advice — block time, defer a task — use `/myna:sync`, `/myna:calendar`, or `/myna:capture`.

---

## Three Modes

Determine the mode from the user's request:

| Request type | Mode |
|---|---|
| "what should I focus on today", "plan my day", "what do I tackle first", "am I over-committed?" | **Plan Day** |
| "priority coaching", "top priorities", "what are my top 3" | **Priority Coaching** |
| "week optimization", "plan my week", "what meetings can I skip", "best time for deep work" | **Week Optimization** |

If intent is ambiguous, ask: "Planning your day, or would you like priority coaching or week optimization?"

---

## What to Read

Read these before showing output:

1. **`{vault}/_system/config/workspace.yaml`** — `work_hours.start` + `work_hours.end` (capacity baseline), `timezone`, `features` map (no toggle gates this skill — read timezone and work hours only)
2. **Today's daily note** (`{vault}/{subfolder}/Journal/DailyNote-{YYYY-MM-DD}.md`) — check Immediate Attention section and any sync snapshots for current state
3. **Calendar** (via calendar MCP) — events for today (Plan Day / Priority Coaching) or the full week (Week Optimization). If unavailable, note it and work from the daily note.
4. **Open tasks** — Grep `{vault}/{subfolder}/Projects/` for `- \[ \]` with due dates, priority flags, and `[type:: delegation]`
5. **Project files** — scan `{vault}/{subfolder}/Projects/` for blocked items (`[!warning] Blocker`) and stalled projects (no timeline entry in last 14 days)

---

## Plan Day

Show a concrete, ordered picture of the day.

**Output structure:**

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

**Priority ordering logic:**

Rank tasks by: (1) overdue, (2) blocks another person's work `[type:: dependency]`, (3) due today with high priority `⏫`, (4) due today, (5) high priority but no due date, (6) carried forward multiple times (check for prior daily notes where this task appeared).

---

## Priority Coaching

Show the 3 things that matter most right now, with clear reasoning.

**Output structure:**

🏆 Top 3 priorities right now:

1. {task or goal} — {specific reason: "blocks Sarah's API work, deadline Friday"}
2. {task or goal} — {specific reason: "deferred 3 times, high-priority project"}
3. {task or goal} — {specific reason: "overdue delegation from Marcus, 5 days late"}

⚠️ Watch list:
- {task}: {flag — "no due date, has been sitting for 2 weeks"}
- {delegation}: {flag — "asked Alex for X on {date}, no update"}

🔄 Recurring carry-overs:
- {task} has been carried forward {N} days. Either commit to it today or explicitly defer to {date}.

**Include carry-over detection:** Compare task names across the last 3 daily notes' Immediate Attention sections. A task that appears in 3+ consecutive notes is a recurring carry-over — flag it explicitly with the count.

---

## Week Optimization

Step back from today and look at the full week.

**Output structure:**

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

**Optimization criteria:**
- Meetings to consider skipping: recurring meetings with no agenda items touching your current tasks or projects. Never say "cancel" — say "consider whether you need to attend."
- Optimal focus slots: contiguous blocks of 2+ hours with no calendar events.
- What to safely defer: tasks with no due date, no dependencies, no one waiting on them.

---

## Edge Cases

**Calendar unavailable:** Work from the daily note sync snapshot if one exists. Note that meeting counts may be outdated. Skip Meeting details in Plan Day output.

**Daily note missing (no sync run):** Note "No daily note found — run 'sync' first for full context." Still show what's available from project files and task queries.

**Ambiguous mode:** When "plan my day" and "priority coaching" would produce similar output (low task count, few meetings), default to Plan Day mode and offer: "Say 'priority coaching' for a more coaching-focused view."

**No open tasks:** Proceed with calendar and daily note data only. Note "No open tasks found" in the output and focus recommendations on meeting preparation and capacity.

**Feature toggle:** No toggles gate planning modes — this skill is always available.

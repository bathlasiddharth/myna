---
name: brief-project
disable-model-invocation: true
description: Catch me up on a project — quick (3-5 bullet TL;DR) or full (status, timeline, blockers, tasks, dependencies, upcoming meetings). Invoke for "catch me up on [project]", "project status: [project]", "what's happening with [project]".
user-invocable: true
argument-hint: "[project name] [quick?]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:init` and stop.

# Project Status Summary

Read the project file and surface current status inline. Read-only — no vault writes.

---

## Mode Selection

| Trigger | Mode |
|---------|------|
| "catch me up quick on [project]", "quick status on [project]" | **Quick** — 3-5 bullet TL;DR |
| "catch me up on [project]", "project status: [project]", "what's happening with [project]" (no "quick") | **Full** — complete status |

Default is Full when no qualifier is given.

---

## Resolve the Project

Match the user's project name against projects.yaml using fuzzy resolution (exact → alias → case-insensitive → prefix → fuzzy). If multiple projects match, list them and ask the user to pick. If no match, ask for clarification.

---

## What to Read

| Source | Path | Used in |
|--------|------|---------|
| Project file | `myna/Projects/{project-name}.md` | Both modes |
| Task items | Grep `[project:: {resolved-name}]` across vault | Both modes |
| Meeting files | `myna/Meetings/` (Glob for files mentioning project) | Full mode only |
| Calendar | Calendar MCP — next 7 days, filtered to project meetings | Full mode only |
| Email threads | Gmail MCP — recent threads mentioning project (optional) | Full mode only |

Missing files or unavailable MCPs: skip and note what was unavailable.

---

## Quick Mode Output

3-5 bullets, suitable for a hallway conversation or context switch. Cover:
1. Status and phase
2. Top blocker (if any)
3. Next milestone or deadline
4. One notable recent development (if anything significant happened in the last 7 days)

```
**[Project Name]** — [status]

- [Status and phase — what's being worked on right now]
- ⚠️ Blocker: [top blocker if any] — [brief context]
- 📅 Next: [next milestone or deadline]
- [Notable recent development, if any]
```

Skip the blocker bullet if there are no open blockers. Skip recent development if nothing notable in the last 7 days.

---

## Full Mode Output

```
## 📁 [Project Name]

**Status:** [active | paused | complete]  **Last updated:** [date of most recent timeline entry]

**Key People:** [wiki-linked names]

---

### 📊 Current State
[2-3 sentence summary of where the project stands. Pull from the most recent timeline entries and overview.]

### 🚧 Open Blockers
> [!warning] [Blocker description]
> [[date] | [source]] [details] [[provenance]]

[If no blockers: "No open blockers."]

### 📋 Open Tasks

**Your tasks:**
- [ ] [task] — due [date] ⏫/🔼
- ...

**Delegated (waiting on others):**
- [ ] [task] — [person], due [date]
- ...

**Dependencies (waiting on other teams):**
- [ ] [dependency description] — due [date] [type:: dependency]
- ...

### 📅 Upcoming Meetings (next 7 days)
- [Day, Date] [Time] — [Meeting name] (recurring grouped: "Weekly sync — Mon, Wed, Fri")
- ...

Group recurring meetings: if the same meeting title appears on multiple days, collapse into one line listing all days (e.g., "Weekly sync — Mon, Wed, Fri"). Show individual entries for non-recurring meetings.

[If no meetings: "No meetings in the next 7 days."]

### 📜 Recent Timeline (last 5 entries)
- [[date] | [source]] [entry content] [[provenance]]
- ...

### 📈 Task Summary
[X] open tasks — [Y] overdue, [Z] due this week
[A] delegations — [B] overdue
```

---

## Worked Examples

### Quick Mode

**User:** "catch me up quick on auth migration"

**Output:**
```
**Auth Migration** — active

- Phase 2 underway: API spec under review, staging deploy targeting April 15
- ⚠️ Blocker: Platform API integration — waiting on Platform team since Apr 3
- 📅 Next: API spec sign-off — Apr 11 (Friday)
- Sarah submitted the draft spec yesterday — review started
```

---

### Full Mode

**User:** "catch me up on auth migration"

**Files read:**
- `myna/Projects/auth-migration.md` — status: active, 8 timeline entries, 5 open tasks
- Grep for tasks with `[project:: Auth Migration]`
- Calendar MCP — 2 meetings in next 7 days

**Output:**
```
## 📁 Auth Migration

**Status:** active  **Last updated:** 2026-04-10

**Key People:** [[People/sarah-chen]], [[People/alex-kumar]], [[People/james-lee]]

---

### 📊 Current State
Phase 2 is underway. Sarah's API spec draft is in review. The Platform API dependency is the current blocker — Platform team committed to April 8 but hasn't delivered. Staging deploy is targeting April 15.

### 🚧 Open Blockers
> [!warning] Platform API Integration
> [2026-04-03 | email from James] Waiting on Platform team for API endpoint spec — committed date was Apr 8, now overdue [Auto]

### 📋 Open Tasks

**Your tasks:**
- [ ] Review API spec v2 📅 2026-04-11 ⏫ [project:: Auth Migration] [person:: [[Sam Bennett]]]
- [ ] Unblock Platform team dependency — follow up with James 📅 2026-04-11 🔼 [project:: Auth Migration] [person:: [[Sam Bennett]]]

**Delegated (waiting on others):**
- [ ] Draft API spec v2 — Sarah, due 2026-04-10 [type:: delegation] [person:: [[Sarah Carter]]]
- [ ] Staging infrastructure setup — Alex, due 2026-04-14 [type:: delegation] [person:: [[Alex Kumar]]]

**Dependencies (waiting on other teams):**
- [ ] Platform API endpoint spec — Platform team, due 2026-04-08 (overdue) [type:: dependency]

### 📅 Upcoming Meetings (next 7 days)
- Thu Apr 14, 10:00 AM — Auth Migration Weekly Sync
- Fri Apr 15, 2:00 PM — Staging Deploy Review

### 📜 Recent Timeline (last 5 entries)
- [2026-04-10 | email from Sarah] API spec v2 draft submitted for review [Auto]
- [2026-04-08 | slack #auth-migration] Platform team missed API deadline — following up [Auto]
- [2026-04-07 | meeting Weekly Sync] Decision: proceed with mock API for testing unblocked by Platform [Auto]
- [2026-04-05 | email from Alex] Staging infra cost estimate: $2,400/month [Auto]
- [2026-04-03 | email from James] Platform API committed for April 8 [Auto]

### 📈 Task Summary
5 open tasks — 1 overdue, 3 due this week
2 delegations — 1 overdue (Platform API spec)
```

---

## Edge Cases

- **Project file missing:** Inform the user — "No project file found for [project]. Say 'create project file for [project]' to create one."
- **Status is paused or complete:** Note this prominently at the top of the output.
- **No open tasks:** Skip the Open Tasks section.
- **No recent timeline entries:** Skip the Recent Timeline section, note "No timeline entries recorded yet."
- **Calendar MCP unavailable:** Skip the Upcoming Meetings section, note unavailability.
- **Email MCP unavailable:** Skip email context, proceed with vault data only — do not mention it unless the user asks.
- **Ambiguous project name:** "catch me up on auth" when there's Auth Migration and Auth Service — list both, ask which one.

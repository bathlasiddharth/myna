---
name: myna-weekly-summary
description: Summarize your week — synthesizes daily notes, contributions, decisions, and task completions into a structured weekly review with self-reflection prompts. Appends a new section each run. Includes team health snapshot for managers.
user-invocable: true
argument-hint: "[week of YYYY-MM-DD | last week]"
---

# myna-weekly-summary

Generates or updates the weekly summary. Each run appends a fresh `## Weekly Summary — {date}` section to the weekly note. Re-runs are additive — previous sections stay untouched.

---

## Step 1: Determine Target Week

**No argument:** Default to the current week (Monday–Sunday, using today's date and timezone from workspace.yaml).

**"last week":** Previous Monday–Sunday.

**Specific date:** "week of April 7" → find the Monday for that week.

Weekly note path: `Journal/WeeklyNote-{YYYY-MM-DD}.md` (Monday's date)

---

## Step 2: Read Config

Read `workspace.yaml`:
- `vault.path` + `vault.subfolder`
- `user.role` → determines framing of contribution categories
- `features.weekly_summary` → if disabled, skip
- `features.team_health` → if enabled and role is `engineering-manager`, include team health snapshot

---

## Step 3: Read Existing Weekly Note

Read the weekly note if it exists. Note any prior "Weekly Summary" sections for context. Each run always appends a full new summary section — do not skip or abbreviate because a prior section exists.

---

## Step 4: Gather Weekly Data

Read in parallel:

**Daily notes for the week:** Glob `Journal/DailyNote-{YYYY-MM-DD}.md` for each weekday. From each, extract:
- End of Day "Completed" items (from wrap-up sections, if they exist)
- End of Day "Not started" / "Partially done" items that ended up carrying forward
- Any quick notes from wrap-up sections

**Contributions log:** Read `Journal/contributions-{YYYY-MM-DD}.md` (Monday date). Collect all entries for the week.

**Decisions logged this week:** Grep `{vault.path}/Projects/` for `[!info] Decision` blocks with dates in the target week.

**Blockers this week:** Grep `{vault.path}/Projects/` for `[!warning] Blocker` blocks with dates in the target week, plus any blockers that opened before the week and are still unresolved.

**Tasks completed vs carried:** Grep `{vault.path}/` for:
- `- \[x\]` with completion dates in the target week → completed count
- Items present in Monday's daily note Immediate Attention and still `- \[ \]` at end of week → carried count

**For managers — Team Health** (if `features.team_health` enabled and role is `engineering-manager`): Read all `People/{slug}.md` files for direct reports (those with `relationship_tier: direct` in people.yaml). For each, gather: open task count, overdue task count, last 1:1 date, feedback gap (days since last entry in Pending Feedback or Observations), attention gap (days since any interaction was logged — 1:1, observation, or quick note). Check `Team/{team}.md` for any existing health snapshots this week.

---

## Step 5: Write Weekly Summary Section

Append a new section to the end of the weekly note:

```markdown
## Weekly Summary — {YYYY-MM-DD}

### Accomplishments

{Key completed work this week. Not a raw task dump — synthesize into meaningful outcomes. Lead with the most impactful items.}

- {outcome or completed work} [{provenance if from contributions log}]
- ...

### Decisions Made

{Decisions logged this week across all projects.}

- [{date}] {project}: {decision summary} [Auto] (project timeline)
- ...
{If none: "(no decisions logged this week)"}

### Blockers

{Blockers opened or unresolved this week.}

- {project}: {blocker description} — open since {date}
- ...
{If none: "(no open blockers)"}

### Tasks: Completed vs Carried

Completed {N} tasks. Carried {M} to next week.
{If M > 0: List the carried tasks. If M is large (5+): "Consider reviewing what's chronically deferred."}

### Self-Reflection

{2–4 agent-generated prompts based on this week's patterns. These are questions, not judgments.}

Pattern triggers (all users):
- Multiple carry-overs: "3 tasks carried forward multiple times — still the right priorities, or should they be deferred?"
- Light meeting week: "Did you get the deep work time you needed, or did other things fill it?"
- Heavy meeting week: "{N} hrs in meetings. What would you protect next week for focused work?"
- Low task completion vs. meeting time: "You completed {M} tasks against {N} hrs of meetings. Is that the balance you wanted?"
- General: "What would have made this week better?"

Pattern triggers (engineering-manager role only — skip entirely for IC):
- Feedback gap > threshold: "You haven't logged any observations for {person} in {N} days. Anything worth capturing?"
- Delegation overdue: "{Person}'s {task} is {N} days overdue. Is it blocked? Did the priority change?"
- Persistent overdue delegations: "{N} overdue delegations at week start, {M} still open. What's blocking resolution?"
```

---

## Step 6: Team Health Snapshot (Managers Only)

If `features.team_health` is enabled and `user.role` is `engineering-manager`, append a team health snapshot to `Team/{team-slug}.md`. The team slug comes from the team name in people.yaml (e.g., "Platform" → `platform.md`). If no team file exists, create it with:
```markdown
---
created: {YYYY-MM-DD}
---
#team

## Overview
**Team:** {team name}
**Members:** {wiki-links to direct reports}

## Timeline

## Health Snapshots
```

Append under `## Health Snapshots`:

```markdown
### {YYYY-MM-DD}

| Person | Open Tasks | Overdue | Feedback Gap | Attention Gap | Last 1:1 |
|--------|-----------|---------|--------------|---------------|----------|
| {name} | {N}       | {N}     | {N} days     | {N} days      | {date}   |
| ...
```

Flag entries:
- Feedback gap > `feedback_cycle_days` (from workspace.yaml) → append ` ⚠️` to the gap cell
- Overdue > 2 → append ` ⚠️` to the overdue cell
- Last 1:1 > 14 days → append ` ⚠️` to the date cell

Also include in the weekly summary section:

```markdown
### Team Health

| Person | Open Tasks | Overdue | Feedback Gap | Attention Gap | Last 1:1 |
|--------|-----------|---------|--------------|---------------|----------|
| {data} |
```

---

## Step 7: Output

Print summary inline for quick review, then:

```
✅ Weekly summary written.

Week of {YYYY-MM-DD}: {N} accomplishments, {M} decisions, {O} blockers, {P} tasks completed, {Q} carried.
{If team health: "{R} team members — {S} with alerts."}

Weekly note: {obsidian-uri}
{If team health updated: "Team file updated: {obsidian-uri}"}
```

Then suggest:
- "Say 'monthly update' to draft an MBR or status report from this week's data." (if `features.monthly_updates` is enabled)
- "Say 'wrap up' to close out today's daily note." (if it's end of week and today's wrap-up hasn't run)

---

## Examples

### Example 1: End-of-week summary, first run (manager role)

User says: "weekly summary" on Friday April 11.

Target week: April 7–11.

Read 5 daily notes. Find:
- 4 wrap-up End of Day sections (Monday–Thursday; Friday not done yet)
- 3 contribution log entries (API spec review [Auto], 1:1 with Sarah [Inferred], cache decision [User])
- 2 decisions in auth-migration.md this week
- 1 blocker in platform-api.md (still open since April 5)
- 9 tasks completed, 3 carried

Generate self-reflection prompts:
- No feedback logged for Alex this week (28 days since last observation)
- "MBR draft" carried 4 consecutive days

Output:
```
✅ Weekly summary written.

Week of 2026-04-07: 3 accomplishments, 2 decisions, 1 open blocker, 9 tasks completed, 3 carried.

Weekly note: obsidian://open?...
```

### Example 2: Re-run on same week

User says: "weekly summary" again on Friday evening after running wrap-up.

Existing summary covers through Thursday wrap-up. New data since then: Friday's completed tasks (2), one new decision logged during the afternoon meeting.

Append a new `## Weekly Summary — 2026-04-11` section with the full week's data. The prior section from Thursday remains in place above it.

### Example 3: Manager with team health

User says: "how was my week?" (manager role)

Generate normal weekly summary. Additionally:
- Check Sarah: 5 open, 0 overdue, 12-day feedback gap, last 1:1 Apr 2
- Check Alex: 8 open, 3 overdue ⚠️, 45-day feedback gap ⚠️, last 1:1 Mar 28 ⚠️

Write team health table to both weekly note and `Team/platform-team.md`. Mention in reflection: "Alex has 3 overdue tasks and a 45-day feedback gap — worth a check-in."

---

## Edge Cases

**Weekly note doesn't exist:** Create it with frontmatter (`week_start: {YYYY-MM-DD}`) and `#weekly` tag. Add empty `## Week Capacity`, `## Weekly Goals`, and `## Carry-Forwards` sections, then append the summary.

**No daily notes for the week (notes not written or lost):** Work from what's available in project files and contributions log. Note in summary: "Note: daily notes not found for this week — summary based on project timelines and contributions log only."

**Contributions log missing:** Skip contributions section. Note it.

**Feature toggle `weekly_summary` off:** Decline with "Weekly summary is disabled. Enable it in workspace.yaml under features.weekly_summary."

**IC role with team_health toggle on:** Skip team health section — it requires the engineering-manager role. Skip silently (don't mention it in output).

**Partial week (running mid-week, e.g., Wednesday):** Summarize the days available so far. Note in the summary header: "Note: summary covers {Mon}–{today} — run again at week's end for a complete picture." Self-reflection prompts should reflect partial data (e.g., don't flag "light meeting week" if the week isn't over).

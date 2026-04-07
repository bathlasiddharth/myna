# Brief

## Purpose

Synthesize information about a person, project, team, thread, or topic and present a focused summary inline. Read-only — never writes to the vault unless the user explicitly asks to save.

## Triggers

- Person briefing: "brief me on Sarah", "what do I know about Alex?"
- Project status: "catch me up on auth migration", "catch me up quick on [project]", "what's the status of [project]?"
- Thread summary: "summarize this thread", "summarize the email from James about API"
- Team health: "how is my team doing?", "team health overview"
- Unreplied tracker: "what am I waiting on?", "what needs a reply?", "what's unreplied?"
- Blocker detection: "what's blocked?", "show me blockers", "what's stuck?"
- 1:1 pattern analysis: "analyze my 1:1s with Sarah", "how are my 1:1s with Alex going?", "what patterns do I see with [person]?"
- Performance narrative: "generate performance narrative for Sarah", "write Sarah's review for H1", "help me write [person]'s review"

## Inputs

- Person files: `People/{person-name}.md`
- Project files: `Projects/{project-name}.md`
- Meeting files: `Meetings/1-1s/`, `Meetings/Recurring/`, `Meetings/Adhoc/`
- Task items across project files (TODO queries)
- Contributions log: `Journal/contributions-{week}.md`
- Team files: `Team/{team-name}.md`
- Config: `workspace.yaml` (user identity, feature toggles, `feedback_cycle_days`), `projects.yaml` (project registry), `people.yaml` (person registry)
- External MCP (optional): `email.search_messages`, `email.read_message`, `slack.read_thread` — for thread summaries. Degrade gracefully if unavailable.

## Procedure

Determine which brief type the user is requesting, then follow the matching section below.

### Person Briefing

1. Resolve the person name against `people.yaml` (aliases, partial matches). If ambiguous, ask.

2. Read the person file (`People/{person-name}.md`). Read shared project files (projects where this person appears in `key_people`). Read their meeting file (`Meetings/1-1s/{person-name}.md`) for recent sessions and carry-forward items. Read open tasks across project files that reference this person. Check project timelines and meeting notes for recent interactions (last 2 weeks) with this person.

3. Present inline:
   - **Role & context:** role, team, relationship tier
   - **Shared projects:** list each with current status (1-line per project)
   - **Last 1:1:** date, carry-forward items still open
   - **Open items between you:** tasks you delegated to them (filter tasks with `type:: delegation` and `person::` matching them), things they're waiting on from you (tasks assigned to you that relate to shared projects)
   - **Pending feedback:** undelivered observations from their Pending Feedback section, with coaching-tone talking points
   - **Feedback gap:** check the gap between today and the most recent entry in their Observations or Recognition sections. If the gap exceeds `feedback_cycle_days` from workspace.yaml (default 30), add: "Feedback gap: {N} days since last logged feedback (threshold: {days}). Consider discussing growth areas or recent work."
   - **Personal notes:** hobbies, milestones from their Personal Notes section
   - **Stakeholder mentions** (for cross-team contacts, PMs, VPs only): factual list of where this person appears in your project data — timeline entries, meeting notes, email exchanges. Present as raw mentions with dates, not interpreted stance.

4. If `features.people_management` is disabled, omit the Pending feedback and Feedback gap sections from the output.

### Project Status Summary

1. Resolve the project name against `projects.yaml` (aliases, partial matches). If ambiguous, ask.

2. Read the project file (`Projects/{project-name}.md`).

3. Determine mode from the user's phrasing:
   - **Quick** ("catch me up quick", "quick status", "TL;DR"): 3-5 bullet summary — current status, top blocker (if any), next milestone or deadline, overall trajectory.
   - **Full** (default — "catch me up", "brief me on [project]", "status of [project]"): complete status including recent timeline entries (last 2 weeks), all open blockers (from `> [!warning] Blocker` callouts and tasks with `type:: dependency` past due), task breakdown (open count, overdue count, delegated count), upcoming meetings related to this project (next 7 days from calendar — group recurring meetings, e.g., "Weekly sync (Mon, Wed, Fri)").

4. Read calendar via calendar MCP for upcoming meetings (full mode only). If calendar MCP is unavailable, skip the meetings section and note "calendar unavailable."

### Thread Summary

1. Identify the thread: user may paste content directly, reference an email subject/sender, or point to a Slack thread.

2. For email threads: use `email.search_messages` to find the thread, then `email.read_message` to read it. For Slack threads: use `slack.read_thread`. For pasted content: use what the user provided.

3. If the email or Slack MCP is unavailable, tell the user and ask them to paste the thread content.

4. Present a BLUF (Bottom Line Up Front) summary:
   - **Bottom line:** one sentence — what was decided or what's the current state
   - **Key points:** what was discussed, any decisions made
   - **Open items:** what's still unresolved
   - **Action items:** who owes what, with deadlines if stated

### Team Health Overview

1. Check `features.team_health` toggle. If disabled, tell the user and stop.

2. Read `people.yaml` to identify direct reports (relationship: direct). Read each direct report's person file, their open tasks, delegation items, and meeting history.

3. Present a structured table with one row per direct report:

   | Person | Open Tasks | Overdue | Last 1:1 | Feedback Gap | Delegations | Attention Flag |
   |--------|-----------|---------|----------|--------------|-------------|----------------|

   - **Open Tasks / Overdue:** count of open and overdue tasks assigned to them
   - **Last 1:1:** date of most recent session in `Meetings/1-1s/{person}.md`
   - **Feedback Gap:** days since last logged observation or feedback. Flag with warning if exceeding `feedback_cycle_days` from workspace.yaml
   - **Delegations:** count of overdue delegations you assigned to them (`type:: delegation`, `person::` matching, past due date)
   - **Recent contributions:** count from `Journal/contributions-{week}.md` entries in last 2 weeks referencing this person
   - **Attention Flag:** flag if no observations logged in 45+ days, or no career development topics in 4+ months

4. After the table, highlight the top concerns — the 2-3 people who most need your attention and why.

### 1:1 Pattern Analysis

1. Resolve the person name against `people.yaml`. If ambiguous, ask.

2. Read the full meeting file for 1:1s with this person (`Meetings/1-1s/{person-name}.md`). Read all sessions (not just the most recent).

3. Analyze across sessions:
   - **Action item follow-through:** For each session, count action items that were yours vs theirs (from Prep and Notes sections). For each, was it checked off before the next session or carried forward? Calculate follow-through rate separately for you and for them.
   - **Recurring topics:** Topics or themes that appear in multiple sessions' prep or notes (e.g., "API spec", "career growth", "delegation"). List each with how many sessions it appears in.
   - **Carry-forward rate:** Count items that were carried forward (unchecked prep items becoming the next session's prep). High carry-forward rate indicates recurring bottleneck.
   - **Feedback delivery:** Count sessions with pending feedback in prep vs sessions where feedback items were checked off.
   - **Session gap:** Calculate the gap between each session and flag if any gap exceeded 3 weeks.

4. Present inline as a factual analysis — dates, counts, rates. No inferences about morale or performance. "You completed 7 of 10 action items across 5 sessions. Sarah completed 12 of 14." is factual. "Sarah is reliable" is not.

### Performance Narrative

1. Check `features.people_management`. If disabled, tell the user and stop.

2. Resolve the person name against `people.yaml`. Determine the time period — user may specify "for H1", "for Q1", "since January". Default: last 6 months.

3. Gather evidence across the period:
   - Person file: Observations (strengths, growth areas), Recognition entries
   - Project timelines: entries where this person is mentioned — completed work, decisions, contributions
   - Meeting files: 1:1 notes, action items, outcomes attributed to them
   - Contributions log: entries where `person::` matches or descriptions mention them

4. Generate a narrative draft. Structure:
   - **Summary** (2–3 sentences): overall assessment based on evidence
   - **Strengths** (evidence-backed): each claim linked to a specific observation or event with date
   - **Growth areas** (factual, not judgmental): patterns from growth-area observations, with dates
   - **Key contributions** (specific and dated): project outcomes, decisions driven, team impact
   - **Development highlights:** career conversations, skills worked on, milestones

5. Highlight all [Inferred] data points in the draft. The user must verify before submitting.

6. Save to `Drafts/[Self] Performance Narrative {person} {period}.md` automatically (performance narratives are always saved — they aggregate significant data the user will iterate on).

7. Confirm: "Performance narrative for Sarah saved to Drafts/. {N} [Inferred] items flagged for verification."

### Unreplied Tracker

1. Query tasks with `type:: reply-needed` that are not completed. Split into two lists:
   - **Waiting on you:** reply-needed tasks where you are the owner
   - **Waiting on them:** reply-needed tasks where `person::` is someone else

2. Present both lists sorted by age (oldest first), with the original message context and how many days it has been waiting.

### Blocker Detection

1. Scan across all active project files for:
   - `> [!warning] Blocker` callout blocks in timelines
   - Tasks with `type:: dependency` that are past their due date
   - Tasks overdue by 7+ days (potential implicit blockers)

2. Present grouped by project:
   - Explicit blockers with source reference and age
   - Overdue dependencies with owner and days overdue
   - Significantly overdue tasks (7+ days) as potential blockers

3. For each blocker, note: which project, what's blocked, who owns the resolution (if known), how long it's been blocked. Inform the user they can say "escalate this blocker" to draft an escalation message.

## Output

All output is inline — shown in the conversation, not written to vault files. If the user asks to save a briefing, write it to `Drafts/[Status] {topic} Brief.md`.

Include wiki-links (`[[person-name]]`, `[[project-name]]`) in output so the user can click through to source files in Obsidian.

## Rules

- **Read-only by default.** Never write to the vault unless the user explicitly asks to save.
- **Graceful degradation.** If an external MCP (email, Slack, calendar) is unavailable, skip that data source and note what was excluded. Never fail entirely because one source is missing.
- **Feature toggles.** Check `features.team_health` before Team Health Overview. Check `features.people_management` before person briefing feedback sections.
- **Fuzzy name resolution.** Match person and project names against aliases in people.yaml and projects.yaml. If multiple matches, present options and ask — never guess.
- **No inference on people.** Team Health Overview presents factual data (dates, counts, gaps). Never infer engagement, morale, or performance from this data.
- **Missing vault files are not errors.** If a person file, project file, or meeting file doesn't exist when reading, skip that data source and proceed with available data. Note in the output what was unavailable: e.g., "No person file found for Sarah — showing only projects.yaml data." Never fail a briefing entirely because one file is missing.
- **Scope boundaries.** Weekly Summary belongs to wrap-up. Monthly Update Generation (MBR/MTR/QBR) belongs to draft. Unified Dashboard is a static Dataview file, not a brief feature. Self-tracking (your own contributions) belongs to self-track. Performance narratives for direct reports belong here.
- **Performance narrative is always saved.** Unlike other brief modes (which are read-only inline), performance narratives are saved to `Drafts/` because they aggregate significant data that the user will iterate on.

## Examples

### Person Briefing — Worked Example

User: "brief me on Sarah"

Reads: `People/sarah-chen.md`, `Projects/auth-migration.md`, `Projects/platform-api.md`, `Meetings/1-1s/sarah-chen.md`, open tasks referencing Sarah.

Output:
```
**Sarah Chen** — Senior Engineer, Platform Team (direct report)

**Shared projects:**
- [[auth-migration]] — active. API spec under review, launch targeting May 15.
- [[platform-api]] — active. Caching layer design in progress.

**Last 1:1:** April 2 — 2 carry-forward items:
- [ ] Sarah to share API spec draft (from March 28)
- [ ] You to review her tech lead growth plan

**Open items between you:**
- You delegated: "Review caching approach" (due April 8 — 2 days)
- She's waiting on you: API spec feedback (no due date set)

**Pending feedback:**
- Growth area logged March 15: escalation handling — consider discussing
  how she managed the auth incident as a coaching opportunity.

**Personal notes:** Training for a marathon (mentioned March 20).
```

### Project Status — Quick Mode

User: "catch me up quick on auth migration"

Output:
```
**[[auth-migration]]** — active

- API spec under review; Sarah's draft expected this week
- **Blocker:** waiting on Team X for OAuth provider credentials (12 days)
- Next milestone: integration testing starts May 1
```

### Project Status — Full Mode

User: "catch me up on auth migration"

Reads: `Projects/auth-migration.md`, calendar MCP for upcoming meetings.

Output:
```
**[[auth-migration]]** — active

**Recent timeline:**
- [Apr 4 | email from Sarah] API spec v2 ready for internal review
- [Apr 2 | meeting: 1:1 with Sarah] Decided to go with Option B for token caching
- [Mar 28 | slack: auth-team] Team X confirmed OAuth credentials by Apr 15

**Blockers:**
- Waiting on Team X for OAuth provider credentials — 12 days, no update
  since Mar 28. Say "escalate this blocker" to draft a follow-up.

**Tasks:** 8 open (2 overdue, 3 delegated)
- Overdue: "Finalize migration rollback plan" (3 days), "Update runbook" (1 day)
- Delegated: Sarah — API spec review; Alex — load test setup; Marcus — monitoring

**Upcoming meetings (7 days):**
- Weekly sync (Mon, Wed, Fri) — [[auth-migration-sync]]
- Design review Thursday 2pm — [[auth-design-review]]
```

### Thread Summary

User: "summarize the email from James about the API spec"

Reads thread via `email.search_messages` + `email.read_message`. Thread: 6 emails over 3 days, James asking about API spec timeline, Sarah responding with options, escalating to Priya for a decision.

Output:
```
**[[email: API spec timeline — James]]**

**Bottom line:** James needs a decision on the API spec approach by Friday. Sarah has proposed two options; your input is required.

**Key points:**
- James flagged that Option A requires an extra week of testing
- Sarah laid out trade-offs: Option A (safer, slower) vs Option B (faster, higher risk)
- No decision reached yet — thread is waiting on you

**Open items:**
- Your call: which option? James needs this by Friday EOD.
- Sarah offered to prototype Option B this week if you lean that way.
```

If email MCP is unavailable: "Email MCP not configured. Paste the thread content and I'll summarize it."

### Blocker Detection

User: "what's blocked?" or "show me blockers"

Reads all active project files.

Output:
```
**Blockers across active projects:**

[[auth-migration]] — 1 blocker
- Waiting on Team X for OAuth provider credentials — 12 days, no update since Mar 28. (email, Sarah, Mar 28)
  → Say "escalate this blocker" to draft a follow-up.

[[platform-api]] — 2 blockers
- Schema validation dependency on infra team — 5 days, owner: Marcus. (meeting, platform sync, Apr 1)
- Overdue dependency: "Auth team to provide token format spec" — 9 days overdue. [type:: dependency]

No blockers detected in: [[q2-planning]], [[hiring-pipeline]]
```

### Team Health Overview

User: "how is my team doing?"

Output:
```
| Person | Open | Overdue | Last 1:1 | Feedback Gap | Delegations | Contribs (2wk) | Attention |
|--------|------|---------|----------|--------------|-------------|----------------|-----------|
| [[sarah-chen]] | 5 | 1 | Apr 2 | 12 days | 1 (due Apr 8) | 3 | — |
| [[alex-kumar]] | 8 | 3 | Mar 28 | 45 days ⚠ | 2 overdue | 1 | 52 days ⚠ |
| [[marcus-jones]] | 3 | 0 | Apr 4 | 8 days | 0 | 4 | — |
| [[maya-patel]] | 6 | 2 | Mar 15 | 47 days ⚠ | 1 overdue | 2 | No career topics in 5 months ⚠ |

**Top concerns:**
1. **Alex** — 3 overdue tasks, 2 overdue delegations, no feedback in 45 days,
   no observations logged in 52 days. Schedule a focused 1:1.
2. **Maya** — No 1:1 in 3 weeks, feedback gap at 47 days, no career development
   topics logged in 5 months. Prioritize reconnecting.
```

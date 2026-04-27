---
name: park
disable-model-invocation: true
description: Save working context for zero-loss resumption in a new session. Resume by name or list all parked items. "Switch to [project]" parks current context and loads project status.
user-invocable: true
argument-hint: "park this | park: [topic name] | resume [topic] | resume (show list) | what's parked? | switch to [project]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:init` and stop.

# park

Saves context for later resumption. The point: a brand new session should be able to read the parked file and pick up exactly where you left off — zero orientation needed.

## Before You Start

Read at session start:
- `_system/config/workspace.yaml` — vault path, subfolder

Parked files live at: `_system/parked/{topic-slug}.md`

---

## Park

**Trigger:** "park this", "park: [topic name]", "pause and save context"

**How:**
1. Determine topic name:
   - If user provides a name ("park: auth caching discussion"), use it.
   - Otherwise, infer from the conversation content — choose a short descriptive slug.
2. Generate topic slug: lowercase, hyphens (e.g., `auth-caching-discussion`).
3. Check for an existing parked file with the same slug. If it exists, confirm overwrite or append.
4. Write `_system/parked/{topic-slug}.md` with ALL of the following sections.

**Required file structure — do not omit any section:**

```markdown
---
parked: {YYYY-MM-DD HH:MM}
topic: {human-readable topic name}
---

## Summary

{One-line description: what were you doing in this session?}

## Referenced Files

- [[{file-1}]] — {why it was relevant}
- [[{file-2}]] — {why it was relevant}
[List every file that was read or written in this conversation that matters for resuming]

## Discussion Summary

{Full account of what was explored, considered and rejected, and decided. Don't summarize minimally — the next session has NO context. Write as if explaining to a new colleague who needs to understand the full picture.}

## Current State

{Exactly where you stopped. What was in progress, what was half-done, what was just written. Be specific enough that someone can tell at a glance whether anything needs to be cleaned up.}

## Next Steps

{What you were about to do next, in enough detail to start immediately. If there are 3 tasks remaining, list all 3 with specifics.}

## Open Questions

{Anything that needs a decision or the user's input before work can continue.}

## Key Constraints

{Decisions or constraints established during this session — so the next session doesn't re-debate settled questions. Include the "why" for non-obvious constraints.}
```

5. Confirm: "Parked. Resume with 'resume {topic-slug}'."
6. Show file path (Obsidian URI and disk path).

**Quality standard for the parked file:** Read it back and ask: "Could a fresh session read only this file and resume work immediately?" If the answer is no — key context is missing, next steps are vague, decisions aren't captured — revise until it passes.

**Worked example:**

User: "park this" (after a long discussion about auth migration caching architecture)

Topic inferred: "auth caching discussion" → slug: `auth-caching-discussion`

File `_system/parked/auth-caching-discussion.md`:
```markdown
---
parked: 2026-04-05 14:30
topic: Auth Migration — Caching Architecture Discussion
---

## Summary

Evaluating two caching options for auth migration (Option A: shared Redis, Option B: dedicated per-service cache) and drafting a recommendation for the team.

## Referenced Files

- [[Projects/auth-migration]] — main project file; read timeline for context
- [[People/sarah-chen]] — tech lead on auth migration; her preferences noted in meeting
- [[Meetings/1-1s/sarah-chen]] — last 1:1 where caching came up

## Discussion Summary

Explored two options for the auth service cache layer. Option A (shared Redis) is simpler to operate but creates a single point of failure. Option B (dedicated cache per service) is more resilient but adds operational complexity. Sarah's architecture notes favor Option B for the auth service specifically due to its high read volume and distinct access patterns. Decision was leaning toward Option B but not finalized — waiting for Marcus's input on the operational overhead.

Reviewed the auth-migration timeline to understand current blockers. Platform API dependency is still blocking staging (overdue since Apr 3). This doesn't affect the caching decision directly.

## Current State

Draft recommendation not written yet. The comparison analysis is complete (see above). Auth migration timeline was read, no changes made.

## Next Steps

1. Get Marcus's response on operational overhead for Option B (check if email/Slack response exists)
2. Draft a 1-page recommendation for the team: pros/cons, recommendation, rationale
3. If Marcus says Option B is manageable → write decision to auth-migration timeline with [User] marker

## Open Questions

- Has Marcus responded to the Option B question? (Check email/Slack for Marcus's message about caching)
- Does the caching decision need formal sign-off, or is team consensus enough?

## Key Constraints

- Decision must be made before staging environment setup (Alex starts staging on Apr 14)
- Option A was ruled out for auth specifically due to high read volume — not a general preference
- Any architecture decision goes into auth-migration.md Timeline section as a Decision category entry
```

Output: "Parked. Resume with 'resume auth-caching-discussion'."

---

## Resume

**Trigger:** "resume [topic]", "resume auth-caching-discussion", "pick up where we left off on [topic]"

**How:**
1. Resolve topic name using fuzzy match against `_system/parked/*.md` filenames and topic frontmatter.
2. Read the parked file.
3. Output a structured resume brief:
   - What you were doing (from Summary)
   - Where you left off (from Current State)
   - What's next (from Next Steps)
   - Open questions (if any)
4. Load referenced files as needed — don't re-explain them, just reference that they're available.
5. Continue from where you left off.

**Worked example:**

User: "resume auth caching"

Fuzzy match: `_system/parked/auth-caching-discussion.md`

Output:
```
## Resuming: Auth Migration — Caching Architecture Discussion

**What we were doing:** Evaluating Option A vs Option B for auth service caching, leaning toward Option B. Draft recommendation not written yet.

**Where we stopped:** Analysis complete, waiting on Marcus's input about Option B operational overhead before writing the recommendation.

**Next steps:**
1. Check if Marcus responded (email or Slack)
2. Draft 1-page recommendation
3. Write final decision to auth-migration.md timeline if going with Option B

**Open question:** Does the caching decision need formal sign-off?

Ready to continue. Should I check email/Slack for Marcus's response first?
```

---

## List Parked Items

**Trigger:** "resume" (no topic), "what's parked?", "show parked items"

**How:**
1. Glob `_system/parked/*.md` for all parked files.
2. Read frontmatter from each to get `parked` date and `topic`.
3. Show the list with dates.

**Output:**
```
## Parked Context Files

1. **auth-caching-discussion** — Auth Migration: Caching Architecture Discussion (parked Apr 5, 2:30 PM)
2. **q2-planning** — Q2 Planning Priorities (parked Apr 3, 11:15 AM)
3. **sarah-perf-review** — Sarah's Performance Review Draft (parked Mar 28, 4:00 PM)

Say "resume [name]" to pick one up.
```

---

## Switch Projects

**Trigger:** "switch to [project]", "switch context to [project]"

**How:**
1. Park the current context first (ask for a topic name or infer from current conversation).
2. Read the project file `Projects/{project-slug}.md` — extract: current status, recent timeline entries (last 3-5), open blockers, top open tasks.
3. Show a quick status brief for the new project.

**Output:**
```
Context parked as "auth-caching-discussion". Resume with 'resume auth caching'.

---
## Switching to: Platform API

**Status:** Active
**Recent:** API v2 spec finalized (Apr 1), staging environment set up (Mar 28)
**Blockers:** None currently
**Open tasks:** 3 (review rate limiting design, update runbook, schedule load test)

Ready to work on Platform API.
```

---

## Archive / Delete

**Trigger:** "archive [parked item]", "done with [parked item]", "delete [parked item]"

**How:**
1. Resolve the parked file.
2. For "archive": read the file, write it to `_system/parked/archived/{slug}.md`, then delete the original.
3. For "delete": delete the file using the file deletion tool.
4. Confirm.

---

## Edge Cases

**No current context to park:** If the session just started and there's nothing to park, say: "Nothing substantive to park yet. Start working on something first."

**Parked file already exists:** "A parked file named '{slug}' already exists (parked {date}). Overwrite, or save as '{slug}-2'?"

**Resume fails to find file:** "I don't see a parked context matching '{name}'. Closest match: '{closest}' — is that the one? Or say 'what's parked?' to see all."

**Nothing parked yet:** If Glob returns no results, say: "Nothing is parked yet. Say 'park this' to save your current context."

**Long conversation with many files:** Include all files that are relevant to resuming the work. Err on the side of including more.

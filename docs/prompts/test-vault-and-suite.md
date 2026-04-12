# Behavioral Test Suite — Prompts

Two-prompt sequence for a single Claude Code session. Paste Prompt 1, review the vault, then paste Prompt 2.

---

## Prompt 1: Generate the Test Vault

```
I need you to generate a test vault for Myna's manual behavioral test suite. This vault will
be installed with Myna and used to manually test all 14 skills via Claude Code.

## Before you start

Read these files to understand the vault structure, data formats, and what each skill expects:

1. `docs/architecture.md` — vault structure, file naming, frontmatter schemas
2. `docs/design/foundations.md` — detailed data layer specs, frontmatter field definitions
3. `agents/main.md` — routing logic, config loading, direct operations
4. `agents/steering/*.md` — all 4 steering files (cross-cutting rules, formatting conventions)
5. `agents/skills/*.md` — all 14 skill files (to understand what data each skill reads/writes)
6. `docs/features/*.md` — feature specs per domain

From these, extract the exact vault paths, frontmatter fields, and formatting conventions
that the skills expect. The test vault must match these exactly or the skills won't work.

## Important: understand Myna's data model

NOT everything is a vault file. Before generating anything, understand the data flow:

- **Vault files (what you generate):** People/, Projects/, Meetings/, Drafts/, Journal/,
  Team/, ReviewQueue/, _system/ — these are markdown files with frontmatter
- **Tasks are INLINE** in project files using Obsidian Tasks plugin format
  (`- [ ] task 📅 2026-04-10 ⏫ [project:: atlas]`), NOT separate files
- **Emails and Slack are EXTERNAL** — they come from MCP servers, not the vault.
  Skills like `process`, `triage`, and `draft-replies` read from MCP. For testing,
  we'll paste mock data directly into prompts instead.
- **Config is YAML** — 6 files in `_system/config/` that must exist for skills to work

## Vault requirements

Generate a cohesive, internally-consistent test vault with:

**Config files (all 6, in `_system/config/`):**
- workspace.yaml — test user identity, preferences, feature toggles
- projects.yaml — project registry matching the projects below
- people.yaml — person registry matching the people below
- meetings.yaml — meeting type overrides
- communication-style.yaml — writing style per audience tier
- tags.yaml — a few auto-tagging rules
- These must match the schemas in foundations.md field-for-field

**People (~6-8 files in People/):**
- At least two people with the same first name (e.g., two Sarahs) for disambiguation testing
- One person with minimal data (no email, sparse notes)
- One person who appears across many contexts (meetings, projects, observations)
- Mix of internal colleagues and external contacts
- Include realistic relationship notes, last-contact dates, communication preferences
- Some people should have observations with provenance markers ([Auto], [User], [Inferred])

**Projects (~4 files in Projects/):**
- One active with healthy momentum — tasks, recent timeline entries, clear status
- One active but stalled/blocked — blocked task, no recent updates
- One completed/archived
- One just starting (sparse data)
- Each should have inline tasks (Obsidian Tasks format), timeline entries with provenance,
  related people, and status notes

**Meetings (~6-8 files across Meetings/1-1s/, Meetings/Recurring/, Meetings/Adhoc/):**
- 2-3 upcoming (one with agenda, one without, one with time conflict)
- 2-3 past (with notes of varying quality — detailed, sparse, missing)
- 1 recurring meeting file with multiple session entries appended
- Attendees should map to the people above
- Some meetings should relate to projects
- Use correct frontmatter: type (1-1/recurring/adhoc), person (for 1:1s), project

**Journal entries:**
- 1-2 existing daily notes (Journal/DailyNote-{date}.md) from recent days
- 1 weekly note (Journal/WeeklyNote-{date}.md)
- 1 contributions log (Journal/contributions-{date}.md) with some entries

**Drafts (~3-4 files in Drafts/):**
- Mix of types: email reply, status update, recognition
- Use correct frontmatter: type, audience_tier, related_project, related_person, created
- One should be a completed draft, one in-progress

**Review queue (4 files in ReviewQueue/):**
- review-work.md — 3-4 pending items (tasks, decisions, blockers)
- review-people.md — 2-3 pending observations
- review-self.md — 2 contribution candidates
- review-triage.md — 3-4 email triage recommendations
- Use the standard entry format from conventions.md

**Team (~1 file in Team/):**
- One team file with health tracking data (for manager-oriented brief and wrap-up tests)

**Parked context (~1 file in _system/parked/):**
- One parked context snapshot with a topic, summary, files list, and next steps
- This tests the "resume" path of the park skill (not just "park this")

**System files:**
- _system/logs/audit.md — a few existing log entries
- _system/sources/ — 2-3 source files for key entities
- _system/logs/processed-channels.md — Slack dedup timestamps for 2-3 channels

**Mock data for paste-based testing (in tests/fixtures/mock-data/):**
These are NOT vault files — they simulate what MCP servers would return. Generate them
as plain text files that the tester pastes into prompts during manual testing:
- `mock-emails.md` — 10-12 emails from different senders, referencing projects/people above.
  Mix: pending reply, replied, urgent, ambiguous action, thread referencing a meeting.
  Format each as From/Subject/Date/Body blocks separated by `---`
- `mock-slack.md` — 5-6 Slack messages from different channels.
  Some with action items, some informational, one referencing an email thread.
- `mock-calendar.md` — today's and tomorrow's calendar as a simple list.
  Include the meetings from the vault plus 1-2 that only exist on calendar (no vault file yet).

## Coherence rules

This is critical: the vault must tell a coherent story. For example:
- If Sarah Chen has observations about the API deadline, her person file should mention
  she's the API lead, and Project Atlas should have related timeline entries
- If a project is stalled, there should be a blocked task and a review queue item about it
- Meeting notes should reference decisions that appear as tasks in project files
- The contributions log should reference actual work visible in project timelines
- People in config (people.yaml) must match People/ files
- Projects in config (projects.yaml) must match Projects/ files
- The timeline should be consistent (use dates relative to 2026-04-08 as "today")

## Output

Create all vault files under `tests/fixtures/vault/` mirroring the exact vault structure
Myna expects (myna/ subfolder with all 15+ directories).
Create mock data under `tests/fixtures/mock-data/`.

After generating everything, print a summary table: entity type, count, and key
test-relevant traits (e.g., "Sarah Chen — in 3 meetings, Project Atlas lead, has
5 mock emails, disambiguation target with Sarah Kim").

Do NOT generate the test checklist yet — just the vault and mock data. I'll review first.
```

---

## Prompt 2: Generate the Manual Test Checklist

(Give this after reviewing the vault from Prompt 1)

```
Now generate a manual test checklist that I'll run against the test vault you just created.

## Before you start

Re-read:
1. `agents/skills/*.md` — all 14 skills, to know what prompts exercise them
2. `agents/steering/*.md` — cross-cutting rules (tests should verify steering too)
3. The test vault you generated under `tests/fixtures/vault/`
4. The mock data under `tests/fixtures/mock-data/`

## Test approach

This is a MANUAL test suite. I'll run each test in Claude Code with Myna installed in the
test vault. For each test I need:
- The exact prompt to type
- What to look for in the output (pass criteria)
- What vault files to check after (for write operations)

For skills that need external MCP data (email, Slack, calendar), the prompt should paste
mock data directly. Example: instead of "process my emails", the test prompt is
"process these emails:" followed by the relevant mock data from tests/fixtures/mock-data/.

## Test coverage

Write 2-3 tests per skill (14 skills) plus ~5 cross-cutting tests. Total: ~35-40 tests.

**Per skill, aim for:**
1. Happy path — straightforward use of the skill
2. Nuanced case — disambiguation, cross-domain reference, or partial data
3. Edge case where relevant — missing data, ambiguous input, boundary conditions

**Skill categories for testing:**

Vault-only skills (test directly — no mock data needed):
- brief, capture, draft, park, review, self-track, wrap-up, process-meeting

MCP-dependent skills (paste mock data in the prompt):
- process (paste mock emails/Slack), triage (paste mock email list),
  draft-replies (paste mock emails needing replies)

Calendar-dependent skills (paste mock calendar or use real calendar MCP if available):
- sync, prep-meeting, calendar

**Cross-cutting tests (~5):**
- Disambiguation: "What did Sarah say about the deadline?" (two Sarahs in vault)
- Cross-domain: "Prep me for my meeting with [person] about [project]"
- Steering compliance: verify draft-never-send, correct vault paths, proper frontmatter
- Negative: prompt about a person/project that doesn't exist — should say so, not hallucinate
- Multi-step: "What are my overdue tasks and who should I follow up with?"

## What to verify per test

For READ operations (brief, queries, summaries):
- Output mentions correct names/dates/facts from the vault
- Output does NOT hallucinate facts not in the vault
- Output follows steering format rules (concise, structured)

For WRITE operations (capture, draft, process, process-meeting):
- Correct file created at expected vault path
- Frontmatter has required fields with correct values
- Content includes provenance markers where required
- Review queue entries created for ambiguous items
- Audit log updated

For SAFETY tests:
- Never sends/posts externally (draft-never-send)
- Calendar writes only create personal events (no attendees)
- Inferred observations go to review queue, not direct write

## Output

Create a single file: `tests/manual-test-checklist.md`

Structure it as:
1. **Setup instructions** — how to install Myna into the test vault, what to verify before testing
2. **Test table** — numbered tests grouped by skill, with columns:
   - Test ID (e.g., SYNC-01)
   - Prompt (exact text to type — for MCP-dependent tests, reference which mock data file to paste)
   - Type (read/write/both)
   - Pass criteria (what to look for)
   - Files to check (vault paths to inspect after, for write tests)
   - Result (empty checkbox for manual pass/fail)
3. **Cross-cutting tests** — separate section
4. **Quick reference** — which mock data file to paste for which test

Make the prompts realistic — "Hey what's going on with Project Atlas?" not
"Query project status for Project Atlas."

**Important:**
- For write-heavy tests (capture, process, draft), reset the vault between tests by
  re-copying from `tests/fixtures/vault/`. Otherwise earlier tests mutate state that
  later tests depend on.
- The vault is anchored to 2026-04-08 as "today". If testing on a later date, update
  the dates in `mock-calendar.md` to be relative to the actual test date. Vault files
  with past dates are fine — they test "past meeting" and "historical data" paths.

Keep it practical. This should take ~30-45 minutes to run through.
```

---

## Notes

- **Same session, two prompts.** The test checklist references exact names/dates/facts from the vault. Splitting sessions loses that context.
- **Review checkpoint.** After Prompt 1, verify: vault paths match architecture.md, frontmatter matches conventions.md, config files match foundations.md schemas, and data is internally consistent.
- **Pre-requisite.** Myna must be installed into the test vault (run install.sh) before testing. Skills, steering, CLAUDE.md, and MCP server must all be wired up.
- **Mock data strategy.** Skills that need external MCP data (email, Slack, calendar) are tested by pasting mock data directly into the prompt. This tests the skill's extraction/routing logic without needing live MCP connections.

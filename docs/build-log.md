# Build Log

Assumptions, open questions, and judgment calls from the autonomous build.
Tagged by task so the user knows what to revisit.

## Entries

### P1-T01 (foundations revision)
- **Fixed:** Architecture §6 says MCP server names are "stored in workspace.yaml" but foundations §3.1 had no corresponding schema entry. Added `mcp_servers` config block.
- **Fixed:** §7 MCP tool surface was abstract (7 tools). Updated to 15 concrete Obsidian CLI operations matching what skills actually need.
- **Note:** `writing-and-drafts.md` references draft lifecycle states but architecture explicitly says "No lifecycle state tracking in v1." Architecture is authoritative — foundations is already correct here.
- **Note:** `meetings-and-calendar.md` references `Drafts/Meeting/` path but architecture says flat `Drafts/` with prefixed filenames. Skill builders should use `Drafts/[Meeting] {topic}.md`.

### P1-T02 (MCP server)
- **Assumption:** `overwrite_section` implemented via the `append` CLI command with `mode=overwrite` parameter — no dedicated CLI command exists for section overwrite.
- **Assumption:** `daily_append`/`daily_prepend` exempt from subfolder write restriction since their target path is resolved by the CLI, not the caller.
- **Question:** Foundations calls the property-read tool `property:get` while the build plan calls it `property_read` with CLI command `property:read`. Used `property_read`/`property_set` consistently in the MCP. May need reconciliation in foundations.

### P1-T03 (capture)
- **Assumption:** Status line update in Project Overview is treated as an allowed structured metadata update, not a violation of append-only discipline.
- **Assumption:** When capture can't resolve a person or project name, it asks the user rather than creating new files. File creation is a main-agent template operation.
- **Judgment call:** Contributions detected during quick capture use `[Inferred]` provenance since the agent is interpreting user involvement.

### P1-T04 (sync, wrap-up)
- **Assumption (sync):** Sync generates lightweight meeting preps (key topics, open items) — the prep-meeting skill handles deep preparation with coaching.
- **Assumption (wrap-up):** "First sync is the baseline" for planned vs actual comparison when user ran sync multiple times.
- **Assumption (wrap-up):** When no daily note exists and user says "wrap up anyway," skill skips planned vs actual but still detects contributions and carries forward.
- **Note:** Contributions log filename pattern: used `contributions-{monday-date}` for clarity (Monday date of that week).

### P1-T05 (triage, process)
- **Assumption (triage):** Triage review-triage.md entry format extends the foundations 2.10b template with "Vault updates" and "Reply needed" fields for Step 3 routing.
- **Assumption (process):** "process my communications" processes both email AND Slack in a single run.
- **Note:** Architecture says triage Step 3 does "nothing else" beyond moving, but feature file adds vault update routing to review queues. Feature file used as authoritative — routing to review queues is not the same as direct vault writes.

### P1-T06 (prep-meeting, process-meeting)
- **Assumption (prep-meeting):** When sync already wrote a prep and user requests prep for the same meeting, treat as update mode rather than creating duplicate.
- **Assumption (process-meeting):** Contributions log file created from template if it doesn't exist for the current week.
- **Note:** Feedback Gap Detection is woven into 1:1 prep as a nudge — not obvious from architecture alone, feature file was essential.

### P1-T07 (brief)
- **Assumption:** Blocker Detection uses 7+ days overdue as threshold for flagging tasks as potential implicit blockers.
- **Assumption:** "Waiting on you" vs "waiting on them" in unreplied tracker determined by `person::` field presence.
- **Note:** Team Health Overview feature file lists "Recent contributions (last 2 weeks)" column but foundations team file template doesn't include it. Brief reads from contributions log files directly.

### P1-T08 (draft, draft-replies)
- **Assumption:** Draft Lifecycle Tracking excluded entirely per "NOT in v1." No linked TODOs auto-created when drafts saved.
- **Assumption:** Monthly updates always auto-save (not inline-only) because they aggregate significant data.
- **Note:** Feature file references `Drafts/Email/` (subfolder structure) but foundations/architecture specify flat `Drafts/` with prefixed filenames. Used flat folder convention.

### P1-T09 (calendar)
- No ambiguous assumptions needed. D003 three-layer protection was thoroughly specified.
- **Note:** Task Breakdown feature description in projects-and-tasks.md is a single line; expanded into concrete 4-step procedure.

### P1-T10 (review, self-track, park)
- **Assumption (review):** File mode treats checked items' edited content as authoritative — user edits in Obsidian before checking are preserved.
- **Assumption (self-track):** Self-calibration requires an existing [Self] draft to calibrate against.
- **Assumption (park):** Switch shows a quick project summary rather than full brief to avoid overlapping with the brief skill.

# Cross-Domain Interactions — Features

**Scope:** How the 7 domains connect — data flows, shared concepts, dependencies between features.

---

## Features

### Universal "Done" Command

One-line summary: "Done with [thing]" resolves what you're finishing and takes the right action automatically.

- Single command handles completion across all domains — the agent figures out what "thing" refers to:
  - **Meeting:** "done with 1:1 with Sarah" → triggers meeting debrief (extracts action items, decisions, observations)
  - **Draft:** "done with MBR draft" / "done with reply to James" → marks linked TODO as complete
  - **Task:** "done with the auth migration review" → marks task as complete
  - **Document:** "done with design review" → prompts for notes, triggers document processing or debrief
- Uses fuzzy name resolution to match "thing" to the right file, task, or meeting
- If ambiguous, asks for clarification — never guesses (never-assume rule)
- Steering instruction — no custom logic, just smart resolution and routing to existing features

### Link Manager

One-line summary: Save and retrieve links to external resources (docs, dashboards, runbooks) organized by project, meeting, or person.

- **Save:** "save link: [url] for [project/meeting/person]" → saves to:
  1. The relevant file's `## Links` section (project file, person file, or meeting file)
  2. The central link index at `_system/links.md`
- **Save without explicit entity:** "save link: [url]" → the agent first checks the prompt for context clues. If the user provided any context ("save link: auth team wiki [url]", "save this dashboard [url] — we use it for incident reviews"), the agent infers the destination using fuzzy name resolution against the registry. If a match is found, it links to that entity without asking. If no match or no context, it saves to `_system/links.md` only — useful for general references like company wikis, HR portals, tooling dashboards, or anything not tied to a specific entity.
- **Find:** "find link: MBR Jan" → searches across all link entries, returns matches
  - Supports versioned keywords: "find link: MBR Jan v2" → exact match
- Supports: URLs, local file paths, mixed entries, multiple links per entity
- P1: background agents auto-save links discovered in email and Slack messages

### Vault-Wide Search

One-line summary: Search across the entire vault and get results grouped by context.

- "search: auth migration" → searches all vault files
- Results grouped by folder type: Projects, Meetings, People, Drafts, System
- Uses Grep for content search across vault files — no custom search logic needed

### Park & Resume

One-line summary: Save your current working context and pick it back up later — works for any task, not just projects.

- **Park:** "park this" / "park: auth migration discussion" → saves an extensive context snapshot to `_system/parked/{topic}.md`
- **The parked file must be detailed enough that a brand new agent session can resume the work with zero context loss.** This is the entire point of the feature. A vague summary is useless. The parked file includes:
  - Topic name and one-line summary of what you were doing
  - Every file referenced during the conversation (with wiki-links and why each was relevant)
  - Full summary of the discussion: what was explored, what was considered and rejected, what was decided and why
  - Current state: exactly where you stopped, what was in progress, what was half-done
  - Next steps: what you were about to do next, in enough detail that the next session can start immediately
  - Open questions: anything unresolved that needs the user's input
  - Key constraints or decisions that shaped the work (so the next session doesn't re-debate them)
  - Timestamp of when it was parked
- **Resume:** "resume auth migration" → loads context, summarizes where you left off, continues
- "resume" with no topic → shows list of parked items, user picks one
- **Switch projects:** "switch to [project]" → parks current context + loads project status summary (combines parking with project status from projects-and-tasks)
- Multiple parked items supported simultaneously
- Parked items archived or deleted when work is complete

### Fuzzy Name Resolution

One-line summary: Resolve references to projects, people, and meetings using flexible matching against the registry.

- **Every entity supports multiple aliases.** Projects, people, and meetings can each have an unlimited list of aliases in their config file. Examples:
  - Project: "Auth Migration" with aliases ["auth", "auth-mig", "AM", "the migration project"]
  - Person: "Sarah Chen" with aliases ["Sarah", "SC", "schen"]
  - Meeting: "Weekly Architecture Review" with aliases ["arch review", "WAR", "weekly arch"]
- Resolution cascade: exact match → alias match → case-insensitive → prefix match → fuzzy/partial match
- **Single match:** proceed silently — no confirmation needed
- **Multiple matches:** list options and ask the user to pick
- **No match:** ask for clarification, suggest closest matches from all entity names and aliases
- Applies to ALL commands across ALL domains that reference registry entries
- Powers features like Universal Done, Meeting Brief, Person Briefing, Project Status, etc.

### Auto-Tagging

One-line summary: Automatically apply consistent tags to vault files based on context.

- Tags applied as inline `#tags` at the top of files
- Tagging sources: folder location, content keywords, people mentioned, projects referenced, data source (email/Slack/meeting)
- Tag registry in config defines available tags and their mapping rules
- Applied automatically when files are created or updated by the agent
- Consistent tagging across all domains without manual effort

### Agent Audit Log

One-line summary: Transparent log of every significant agent interpretation for debugging and trust.

- Logs: what the agent detected, what action it took, which source it read, what it wrote and where
- Stored in `_system/logs/audit.md` (or date-partitioned files)
- Enables user to trace back any agent action to its source data
- Useful for: understanding unexpected review queue items, verifying timeline entries, debugging extraction errors
- Not exposed as a user feature — it's a system transparency mechanism the user can read when needed
- **Distinct from prompt logging** (non-functional): prompt logging records what the user asked (`_system/logs/prompts.md`). The audit log records what the agent did in response (`_system/logs/audit.md`). Together they provide full traceability: user input → agent interpretation → agent action.


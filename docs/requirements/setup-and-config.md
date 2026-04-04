# Setup & Config — Requirements

> Draft. Being refined through discussion.

**Scope:** First-run setup, vault initialization, config system (workspace, registry, communication style), model-specific adaptation, communication style interview.

**Feature notes:** See `docs/features/setup-and-config.md` for brainstorm notes to review.

---

## Features

### Interactive Setup Wizard

One-line summary: Conversational onboarding that gets the user from zero to a working Myna setup in ~5 minutes.

- Covers in order: AI model selection, vault path (or create new), your role (engineering manager, tech lead, senior engineer, PM, etc. — drives contribution categories and feature defaults), MCP connections (email, Slack, calendar — all optional, skip what you don't have), projects (names, aliases, mapped email folders/Slack channels), people (direct reports, manager, key collaborators — names, roles, relationship tiers), recurring meetings (optional — add later)
- **Every step is skippable.** Each section offers "skip" or "set up later" — the user can get running with just a vault path and one project, then add people, meetings, communication style, etc. over time. No step blocks progress. Skipped steps are tracked in `_system/setup-pending.md` so the user can see what's left and resume anytime ("continue setup" or "what setup steps did I skip?").
- **Feature toggles offered during setup.** After the basics, the wizard asks which domains the user wants active (email, meetings, people management, self-tracking, etc.) and disables the rest. Users start with what they need today and enable more later. Ties into D020 feature toggles.
- After setup, Myna can immediately do useful things because it knows your projects and people
- Writes config files and triggers vault initialization automatically
- Power users can skip the interactive setup and edit config files directly (D009)
- Everything has sensible defaults; only a vault path and at least one project are required for value

### Vault Initialization

One-line summary: Creates the complete folder structure, templates, dashboards, and config files under `myna/`.

- Creates top-level folders the user interacts with and `_system/` for internals (config, templates, dashboards, logs) per D012. Exact folder structure finalized during design — likely includes Projects, People, Meetings, Drafts, Journal, Tasks, ReviewQueue, and others as needed by features.
- All writes contained to the `myna/` subfolder (D011)
- Creates `.example` config files with sample data as reference
- Generates model-specific configuration based on AI model selection (D007) — prompt formatting, guardrails where supported, feature flags for unsupported capabilities
- Safe to re-run on an existing vault — never overwrites user-edited files (idempotent)
- Falls back to raw file operations if Obsidian isn't running (D008)

### Config System

One-line summary: Six human-readable markdown config files that define the user's workspace, projects, people, meetings, communication style, and tags.

- **workspace.md** — user identity (name, email address — needed to identify your messages in email/Slack for contribution detection, unreplied tracking, and filtering "from me" vs "to me"), role (e.g., engineering manager, tech lead, senior engineer, PM — determines contribution categories in self-tracking, feature defaults, and prep depth), vault path, timezone, work hours, timestamp format (e.g., `YYYY-MM-DD`, `DD/MM/YYYY`, `MM/DD/YYYY` — used consistently across all vault entries), feedback cycle days (default: 30 — surfaces in 1:1 prep when gap exceeded), feature toggles (milestones, prompt logging, etc.), calendar event prefix, AI model
- **projects.md** — projects with aliases, mapped email folders, mapped Slack channels. Folder/channel mappings stay with the project they belong to. Also includes: triage folders with descriptions for inbox sorting (e.g., `FYI/` = "informational, no action", `Reply/` = "needs a response from me"), and DraftReplies folder. **DraftReplies is processed differently from all other email folders:** in regular project-mapped folders, the agent extracts data from email content (action items, decisions, timeline updates). In DraftReplies, the agent treats the original thread as context and the user's forwarded message as draft instructions — it produces a draft in `Drafts/Email/`, not vault entries. This distinction must be explicit in config so the agent knows which processing mode to use. See writing-and-drafts Email Draft Reply for the full workflow.
- **people.md** — each person entry includes: display name (how you refer to them — "Sarah"), full name ("Sarah Chen"), aliases (nicknames, short names you use in conversation — "SC"), email address, Slack handle, and relationship tier (direct/peer/upward/cross-team). The agent uses all identity fields for cross-source matching — "Sarah Chen" in an email from-field, "@schen" in Slack, "Sarah" in your typed prompt all resolve to the same person. Only display name and relationship tier are required during setup; the rest can be added later as the agent encounters them or the user fills them in.
- **meetings.md** — optional meeting overrides for type inference (D022). Each entry: meeting name, type override (1:1/recurring/adhoc/project), project association, custom debrief type, name aliases. Most meetings don't need entries here — the agent infers type from calendar data. This file is for meetings where inference gets it wrong and the user wants to correct it permanently.
- **communication-style.md** — tone defaults per audience tier (upward, peer, direct, cross-team), email vs. messaging preferences, sign-off style, difficult message approach, templates
- **tags.md** — tag definitions and mapping rules for auto-tagging (folder-based, keyword-based, person/project-based). Separate file so tags can be maintained independently from the registry (Q012).
- All config files are gitignored — no personal data in code (D008)
- Example files provided (`.example` suffix) with realistic sample data
- Config read at the start of each new session or thread — not on every prompt (saves tokens). Changes take effect on the next session, or immediately if updated via Config Management during a session.
- Missing config sections cause graceful degradation (feature skipped, not error)

### Communication Style Interview [Optional — for power users who want more accurate writing]

One-line summary: Optional guided conversation that refines the user's communication style beyond the role-based defaults.

- **Not required.** All writing features work out of the box using role-based defaults generated during setup. The defaults are calibrated per role and level (e.g., an engineering manager gets different tone defaults than a senior IC) and should produce good output without any interview. The interview exists for users who've been using Myna, like the writing features, and want to fine-tune.
- Primary interview (~10 questions): writing style preferences, tone defaults per audience tier, email vs. messaging preferences, sign-off style, how to handle difficult messages
- Additional interview modes (run together or separately):
  - Coaching & feedback style (~8 questions) — how you give feedback, 1:1 approach, growth conversation style
  - Work priorities & goals (~6 questions) — what you're optimizing for this quarter, team goals
  - Meeting preferences (~7 questions) — prep depth, note-taking style, debrief approach
- **Built-in style presets** available out of the box — users can pick one as their default or use different presets per audience tier:
  - **Professional** — clear, direct, respectful. Standard business communication. The safe default.
  - **Conversational** — warm but professional. Uses contractions, shorter sentences, natural flow. Good for peers.
  - **Executive** — concise, data-driven, bottom-line only. Minimal pleasantries. For upward communication.
  - **Casual** — relaxed, informal. How you'd talk to a close teammate on Slack.
  - **Coaching** — supportive, growth-oriented. Asks questions, encourages reflection. For feedback and 1:1s.
  - **Diplomatic** — careful word choice, acknowledges perspectives, softens edges. For cross-team, sensitive topics, declining requests.
  - **Concise** — shortest possible version. Strips all filler, gets to the point in as few words as possible. For quick Slack replies and status updates.
- Users can mix presets per audience tier (e.g., executive for upward, conversational for peers, coaching for directs) or override per message ("rewrite this in a casual tone")
- Generates complete `communication-style.md` config from responses, overriding the role-based defaults and/or preset selections
- Can be re-run anytime to update preferences
- All writing features (email drafts, rewrites, recognition, etc.) read from this config — falling back to role-based defaults when no interview has been done

### Config Management

One-line summary: Add, edit, or remove projects, people, and mappings after initial setup via natural language.

- "Add project: Auth Migration" → updates registry, creates project file from template
- "Add person: Sarah Chen, senior engineer, my direct report" → updates registry, creates person file
- "Map #auth-team channel to Auth Migration" → adds folder/channel mapping in registry
- "Remove project: Old Project" → removes from registry (files are preserved, not deleted)
- "Change my timezone to EST" → updates workspace config
- Changes immediately reflected since config is re-read on every request
- **Why this is needed:** Initial setup gets the basics configured, but projects and people change constantly. Without this, users must hand-edit config files for every change.

### Vault Template System

One-line summary: Customizable templates for all Myna file types that ensure consistent structure across the vault.

- Templates for: project files, person files, meeting notes (1:1, recurring, adhoc), daily notes, weekly notes, draft files, review queue entries
- Stored in `_system/templates/`
- Each template includes proper frontmatter, section structure, and Dataview query blocks
- New files created via templates through Obsidian CLI MCP (D008) or raw file creation as fallback
- Users can customize templates to match their preferences — edits preserved across vault re-initialization

## Requirements

# Setup & Config — Features

**Scope:** First-run setup, vault initialization, config system (YAML config files, Config UI), communication style.

> **Note (D054, D055):** The interactive setup wizard, conversational Config Management ("add project: X" natural-language edits), and markdown config files (`workspace.md`, `projects.md`) described in earlier drafts of this document are **retired**. The current runtime model uses `/myna:setup` as the single onboarding entry point, which launches the local Config UI for YAML editing or offers doc import as an alternative. Direct YAML editing always remains available as a fallback.

---

## Features

### Setup Entry Point — `/myna:setup`

One-line summary: Single onboarding command that walks the user through vault initialization and config via the local Config UI or direct YAML editing.

- `/myna:setup` is the only onboarding entry point (D054). `/myna:install` is retired.
- Runs the Config UI (Python local server + browser UI) so the user can fill in all six YAML config files from a structured form interface
- Offers doc import as an alternative path: the user can upload existing project docs, org charts, or team pages, and the skill extracts projects, people, and context into vault files
- After the user completes the UI or doc import and returns to the Claude chat, `/myna:setup` reads the config files and initializes the vault
- Power users can skip the UI and edit YAML files directly

### Vault Initialization

One-line summary: Creates the complete folder structure, templates, dashboards, and config files under `myna/`.

- Creates top-level folders the user interacts with and `_system/` for internals (config, templates, dashboards, logs) per D012
- Exact folder structure defined in `docs/design/foundations.md`
- Vault subfolder is fixed to `myna` (D055); users who need a different name can edit `~/.myna/config.yaml` manually
- Safe to re-run on an existing vault — never overwrites user-edited files (idempotent)
- All writes contained to the `myna/` subfolder (D011)

### Config System

One-line summary: Six YAML config files that define the user's workspace, projects, people, meetings, communication style, and tags.

- **workspace.yaml** — user identity (name, email, role), vault path, timezone, work hours, MCP server names, calendar event prefix, email settings
- **projects.yaml** — projects with aliases, mapped email folders, Slack channels. Top-level `triage:` section holds inbox triage settings (`inbox_source`, `folders`, `draft_replies_folder`)
- **people.yaml** — people registry with display name, full name, aliases, email, Slack handle, relationship tier, feedback cycle override
- **meetings.yaml** — optional meeting overrides for type inference (D022). Most meetings don't need entries here
- **communication-style.yaml** — tone presets per audience tier (upward, peer, direct, cross-team), email preferences, sign-off style, difficult message approach
- **tags.yaml** — tag definitions and mapping rules for auto-tagging
- Config files live at `{vault}/myna/_system/config/`; the manifest at `~/.myna/config.yaml` stores vault path and subfolder
- Config is read at session start — not on every prompt (saves tokens)
- Missing config sections cause graceful degradation (feature skipped, not error)

### Config UI

One-line summary: Local browser-based UI (served by `ui/server.py`) for editing all six config files without hand-editing YAML.

- Started by `/myna:setup` during onboarding or any time thereafter to update config
- Serves on `localhost` only; auto-selects a free port in the 3000–3010 range
- Tabs: Identity, Calendar, Integrations, Communication, Features, Projects, People, Files
- Writes directly to `_system/config/*.yaml` files; changes take effect on the next Claude session
- Auto-shuts down after 30 minutes of inactivity

### Communication Style Presets

One-line summary: Built-in style vocabulary used for all drafts and rewrites.

- **Professional** — clear, direct, respectful. Standard business communication. The safe default.
- **Conversational** — warm but professional. Uses contractions, shorter sentences, natural flow. Good for peers.
- **Executive** — concise, data-driven, bottom-line only. Minimal pleasantries. For upward communication.
- **Casual** — relaxed, informal. How you'd talk to a close teammate on Slack.
- **Coaching** — supportive, growth-oriented. Asks questions, encourages reflection. For feedback and 1:1s.
- **Diplomatic** — careful word choice, acknowledges perspectives, softens edges. For cross-team, sensitive topics, declining requests.
- **Concise** — shortest possible version. Strips all filler, gets to the point in as few words as possible.
- Users can set a default preset and override per audience tier or per message

### Vault Template System

One-line summary: Customizable templates for all Myna file types that ensure consistent structure across the vault.

- Templates for: project files, person files, meeting notes (1:1, recurring, adhoc), daily notes, weekly notes, draft files, review queue entries
- Stored in `_system/templates/`
- Each template includes proper frontmatter, section structure, and Dataview query blocks
- New files created by reading the template and substituting placeholders via Claude Code built-in tools
- Users can customize templates to match their preferences — edits preserved across vault re-initialization

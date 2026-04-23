# Config UI — Visual Configuration Manager for Myna

You are building a visual config UI for Myna — a polished, branded settings page that runs as a local Python server. Users access it at `localhost` in their browser to view, add, edit, and remove config entries. It also accepts file uploads for later LLM processing. The UI is invoked as one of the options within `/myna-setup`.

**You are a coordinator.** Delegate each task below to a subagent, review the output, and fix issues before moving on. Do NOT attempt all tasks yourself in one pass.

**Quality over speed.** Take the time to do each task well. A longer session with high-quality output is better than rushing to finish. Read files thoroughly before editing, review your own work, and don't cut corners on later tasks.

**Goal: zero human rework.** After you commit, the user should be able to merge without changes. Run review → fix cycles until the review comes back clean. Maximum 3 cycles — if issues persist after 3 rounds, stop and document what's unresolved. But most work should converge in 1-2 cycles.

**This is an overnight unattended run.** The user will not be available to answer questions. Do NOT ask questions — make the best judgment call based on the spec below. If something is ambiguous, pick the safer/simpler option and log your choice to `docs/prompts/config-ui-decisions.md` (one line per decision with brief context). The user will review this file in the morning. Never block waiting for input.

## Context

Myna is a Claude Code agent (Chief of Staff for tech professionals). Configuration lives in 6 YAML files in the user's Obsidian vault at `{vault_path}/{subfolder}/_system/config/`. The vault path and subfolder are stored in `~/.myna/install-manifest.json`.

The 6 config files and their schemas:

### workspace.yaml
```yaml
user:
  name: ""
  email: ""
  role: ""                    # engineering-manager | tech-lead | senior-engineer | pm
vault:
  path: ""                    # absolute path, set by install script
  subfolder: myna             # set by install script
timezone: ""                  # IANA format, e.g. America/Los_Angeles
work_hours:
  start: "09:00"
  end: "17:00"
timestamp_format: "YYYY-MM-DD"
journal:
  archive_after_days: 30
email:
  processed_folder: per-project   # per-project | common
  common_folder: "Processed/"
feedback_cycle_days: 30
calendar_event_prefix: "[Myna]"
calendar_event_types:
  focus: Focus
  task: Task
  reminder: Reminder
mcp_servers:
  email: ""
  slack: ""
  calendar: ""
prompt_logging: true
ai_model: claude-code
features:
  email_processing: true
  messaging_processing: true
  email_triage: true
  meeting_prep: true
  process_meeting: true
  time_blocks: true
  calendar_reminders: true
  people_management: true
  self_tracking: true
  team_health: true
  attention_gap_detection: true
  feedback_gap_detection: true
  contribution_detection: true
  milestones: true
  weekly_summary: true
  monthly_updates: true
  park_resume: true
```

### projects.yaml
```yaml
projects:
  - name: ""
    aliases: []
    status: active            # active | paused | complete
    email_folders: []
    slack_channels: []
    description: ""
    key_people: []
triage:
  inbox_source: "INBOX"
  folders:
    - name: Reply
      description: "Needs a response from me"
    - name: FYI
      description: "Informational, no action needed"
    - name: Follow-Up
      description: "Waiting on someone else"
    - name: Schedule
      description: "Needs a meeting or calendar action"
  draft_replies_folder: DraftReplies
```

### people.yaml
```yaml
people:
  - display_name: ""
    full_name: ""
    aliases: []
    email: ""
    slack_handle: ""
    relationship_tier: ""     # direct | peer | upward | cross-team
    role: ""
    team: ""
    feedback_cycle_days: 30   # optional override
    birthday: ""              # MM-DD
    work_anniversary: ""      # YYYY-MM-DD
```

### communication-style.yaml
```yaml
default_preset: professional  # professional | conversational | executive | casual | coaching | diplomatic | concise
presets_per_tier:
  upward: ""
  peer: ""
  direct: ""
  cross-team: ""
sign_off: ""
difficult_message_approach: "" # direct-but-kind | diplomatic | straightforward
email_preferences:
  max_length: ""              # short | medium | long
  greeting_style: ""          # first-name | formal | none
messaging_preferences:
  formality: ""               # casual | professional
  emoji_usage: ""             # none | minimal | moderate
```

### meetings.yaml
```yaml
meetings:
  - name: ""
    aliases: []
    type: ""                  # 1-1 | recurring | adhoc | project
    project: ""
    debrief_type: ""          # design-review | standup | project | general
```

### tags.yaml
```yaml
tags:
  - name: ""
    type: ""                  # project-based | keyword-based | person-based | source-based
    project: ""               # for project-based
    keywords: []              # for keyword-based
    person: ""                # for person-based
    source: ""                # for source-based
```

## Design Decisions (already settled — do not re-debate)

1. **Config UI is part of `/myna-setup`** — one of three options (UI, interview, doc import). The skill starts the server, shows the link.
2. **UI is fully standalone** — self-sufficient config CRUD. No LLM needed for viewing, adding, editing, removing config entries.
3. **Clean and professional design** — Tailwind CSS via CDN. Myna branded, not hacky. Should look like a real product's settings page.
4. **Python server** — lightweight HTTP server using only Python stdlib. Python is a prerequisite documented in README.
5. **Custom YAML parser** — no PyYAML dependency. Scoped to Myna's 6 config schemas. Uses only Python stdlib.
6. **All files live in `~/.myna/ui/`** — server.py, yaml_parser.py, index.html, styles.css, app.js.
7. **Source files live in `ui/` at repo root** — install script copies them to `~/.myna/ui/`.
8. **Auto-pick available port** — try 3000, increment if taken.
9. **Auto-stop after 30 min of inactivity** — server self-terminates. Activity = any HTTP request.
10. **File upload via drag-drop** — files copied to `~/.myna/imports/`. Paths written to `~/.myna/pending-imports.json`. After LLM processing (outside the UI), files move to `~/.myna/imports/archived/` — never deleted.
11. **Server prints `PID:{pid}` on startup** so the skill can capture it for the kill command.
12. **YAML stays as config format** — the custom parser handles read/write. UI never shows raw YAML to the user.
13. **UI shows tabs** — Overview, Identity, Integrations, Projects, People, Communication, Features, Files.
14. **Vault path resolved from `~/.myna/install-manifest.json`** — the server reads this on startup to find config files.
15. **Branch: `feat/myna-setup-skill`** — this work builds on top of the setup skill changes. Check out that branch first.

## What to read first

- `CLAUDE.md` — project conventions (commits, naming, ground rules)
- `install.sh` — current install script structure
- `agents/config-examples/*.yaml.example` — full config schemas with comments
- `agents/skills/myna-setup/SKILL.md` — the setup skill (on the `feat/myna-setup-skill` branch; if not present, read `docs/prompts/setup-skill.md` for the spec)
- `README.md` — current prerequisites section
- `docs/post-install-checklist.md` — current checklist

## Changes to make

### Task 1: Custom YAML Parser

**File:** `ui/yaml_parser.py`

Build a Python module that reads and writes Myna's config YAML files. No external dependencies — stdlib only.

**Must handle (these are the only YAML features Myna configs use):**
- Key-value pairs: `name: "Alex"`, `timeout: 30`, `enabled: true`
- Nested objects up to 3 levels: `user.name`, `email_preferences.max_length`
- Inline lists: `aliases: [auth, AM, auth-mig]`
- Block lists of scalars:
  ```yaml
  key_people:
    - Sarah Chen
    - James Park
  ```
- Block lists of objects (projects, people, meetings, tags entries):
  ```yaml
  projects:
    - name: Auth Migration
      status: active
      aliases: [auth]
  ```
- Comments: lines starting with `#` (preserve position and content on round-trip)
- Quoted strings with special characters: `description: "Target: Q3 2026"`
- Empty values: `email: ""` and `email: ` and `email:`
- Booleans: `true`, `false` (not `yes`/`no`/`on`/`off` — Myna configs only use true/false)
- Numbers: integers only (`30`, `17`)

**Must NOT handle (not used in Myna configs):**
- Anchors/aliases (`&`, `*`)
- Multi-document (`---` separators)
- Multi-line strings (`|`, `>`)
- Flow mappings (`{key: value}`)
- Complex types (timestamps, null)
- Nested inline lists or objects

**API:**

```python
# Read a YAML file → Python dict
def load(file_path: str) -> dict:
    ...

# Write a Python dict → YAML file
def dump(data: dict, file_path: str, comments: list = None) -> None:
    ...

# Round-trip: read, modify, write — preserving comments
def load_with_comments(file_path: str) -> tuple[dict, list]:
    """Returns (data, comments) where comments is a list of
    (line_number, comment_text) tuples."""
    ...
```

**Tests:** Create `ui/test_yaml_parser.py` with tests covering:

**Basic parsing:**
- Read each of the 6 config example files (`agents/config-examples/*.yaml.example`) — parse and verify key fields
- `workspace.yaml.example`: verify `data["user"]["name"] == "Alex Johnson"`, `data["features"]["email_processing"] == True`
- `projects.yaml.example`: verify `len(data["projects"]) == 2`, `data["projects"][0]["name"] == "Auth Migration"`
- `people.yaml.example`: verify `len(data["people"]) == 4`, `data["people"][0]["relationship_tier"] == "direct"`

**Round-trip fidelity:**
- Load each example file → dump to string → load the string → verify dicts are identical
- Load → dump → load with real config files from the vault (if they exist)

**Comment preservation:**
- Create a YAML string with comments → load_with_comments → dump with comments → verify comments are in the output at correct positions

**Edge cases (one test each):**
- Empty string: `email: ""` → parses as empty string, not None
- Empty value: `email:` (no value) → parses as empty string
- Colon in value: `description: "Target: Q3 2026"` → parses correctly, colon not treated as key separator
- Boolean values: `enabled: true` → Python `True`, `disabled: false` → Python `False`
- Inline list: `aliases: [auth, AM, auth-mig]` → Python list `["auth", "AM", "auth-mig"]`
- Inline list with spaces: `aliases: [ auth , AM ]` → Python list `["auth", "AM"]` (trimmed)
- Empty inline list: `aliases: []` → Python empty list `[]`
- Numeric values: `feedback_cycle_days: 30` → Python int `30`
- Quoted string with hash: `prefix: "[Myna]"` → string `[Myna]`, not treated as comment
- Nested 3 levels: `calendar_event_types.focus` → `"Focus"`
- List of objects: projects array → each item is a dict with correct keys
- Mixed list entry fields: some entries have optional fields (birthday, work_anniversary), some don't → missing fields are absent from dict, not None

**Error cases:**
- Malformed indentation → clear error message, not traceback
- File not found → clear error message
- Empty file → returns empty dict

The parser must pass all tests. Run `python3 ui/test_yaml_parser.py` and verify. Use Python's `unittest` module. Print test count and pass/fail summary.

#### Review criteria — Review as a Principal Engineer focused on correctness
- [ ] All YAML features listed in "must handle" are implemented and tested
- [ ] None of the "must NOT handle" features are attempted
- [ ] Round-trip test: load each `.yaml.example` file, dump it, load again — output matches
- [ ] Comment preservation works
- [ ] Edge case tests pass: empty strings, colons in values, inline lists
- [ ] No external dependencies — only Python stdlib
- [ ] Error handling: malformed input produces a clear error message, not a traceback
- [ ] `python3 ui/test_yaml_parser.py` passes with 0 failures

### Task 2: Python Server

**File:** `ui/server.py`

Build an HTTP server using Python's `http.server` stdlib module. No external dependencies.

**Startup behavior:**
- Read `~/.myna/install-manifest.json` to get `vault_path` and `subfolder`
- Derive config directory: `{vault_path}/{subfolder}/_system/config/`
- Auto-pick port: try 3000, increment until an available port is found (max 3010)
- Print `PID:{pid}` and `URL:http://localhost:{port}` to stdout on startup
- Serve static files from the same directory as `server.py` (for index.html, CSS, JS)

**API endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/config` | Returns all 6 config files as JSON: `{"workspace": {...}, "projects": {...}, ...}` |
| `GET` | `/api/config/{name}` | Returns one config file as JSON (name = workspace, projects, people, etc.) |
| `PUT` | `/api/config/{name}` | Receives JSON body, merges with existing file data, writes using the parser. Preserves comments. Keys present in the PUT body are updated; keys NOT present in the PUT body are preserved from the existing file. This prevents the UI from accidentally deleting config sections it doesn't render (e.g., the `triage` section in projects.yaml). |
| `POST` | `/api/upload` | Receives multipart file upload. Saves files to `~/.myna/imports/`. Updates `~/.myna/pending-imports.json` with file paths. Returns list of saved files. |
| `GET` | `/api/imports` | Returns contents of `pending-imports.json` (list of pending file paths). |
| `GET` | `/api/manifest` | Returns install manifest (vault path, version, etc.). |
| `GET` | `/*` | Serves static files (index.html, CSS, JS). |

**Auto-stop:** Track last request timestamp. A background thread checks every 60 seconds. If no request in 30 minutes, server exits with a message: "Config UI stopped after 30 minutes of inactivity."

**Error handling:** All API endpoints return JSON error responses with appropriate HTTP status codes. File write failures don't crash the server.

**Directory creation:** On startup, create `~/.myna/imports/` and `~/.myna/imports/archived/` if they don't exist.

#### Review criteria — Review as an SRE focused on reliability
- [ ] Server starts and binds to an available port
- [ ] `GET /api/config` returns all 6 config files as JSON
- [ ] `PUT /api/config/workspace` writes valid YAML using the custom parser
- [ ] File upload saves to `~/.myna/imports/` and updates `pending-imports.json`
- [ ] Auto-stop works after 30 min inactivity
- [ ] PID and URL printed to stdout on startup
- [ ] Port auto-increment works if 3000 is taken
- [ ] No external dependencies
- [ ] Server handles missing config files gracefully (returns empty defaults, not 500)
- [ ] CORS headers set for localhost (browser may need them even for same-origin)

### Task 3a: UI Scaffold + Simple Tabs

**Files:** `ui/index.html`, `ui/styles.css`, `ui/app.js`

Build the page shell and the simpler config tabs. Use Tailwind CSS via CDN for styling.

**Design guidelines:**
- Clean, professional settings page. Think Notion settings or Linear settings — not a bootstrap admin panel.
- Myna branding: use a calm, professional color palette. Suggest slate/gray base with a single accent color (blue or teal).
- Tabs on the left side (vertical nav), content on the right. Not top tabs.
- Responsive: works on laptop screens (1024px+). Mobile not required.
- Smooth transitions between tabs.
- Clear visual hierarchy: section headers, field labels, helper text.
- Form inputs: clean borders, focus states, consistent sizing.
- Status indicator at the top showing connection to server.

**Tabs to build in this task:**

1. **Overview** — summary of all config. Shows what's configured (green check) and what's missing (gray dash) for each section. Quick glance at current state.

2. **Identity** — form for `workspace.yaml` user fields:
   - Name (text input)
   - Email (text input)
   - Role (dropdown: Engineering Manager, Tech Lead, Senior Engineer, PM)
   - Timezone (dropdown with common IANA zones + text input for custom)
   - Work hours: start and end (time inputs)
   - Feedback cycle days (number input)
   - Journal archive days (number input)
   - Email filing (radio: per-project / common folder)

3. **Integrations** — form for `workspace.yaml` MCP servers:
   - Email server name (text input with placeholder "e.g. company-mail")
   - Calendar server name (text input)
   - Messaging server name (text input)
   - Helper text: "Enter your MCP server names as registered in Claude Code. Leave empty if not set up."

4. **Communication** — form for `communication-style.yaml`:
   - Default preset (dropdown: 7 options)
   - Per-tier overrides (4 dropdowns, labeled: upward, peer, direct, cross-team)
   - Sign-off (text input)
   - Difficult message approach (dropdown: 3 options)
   - Email preferences: max length (dropdown), greeting style (dropdown)
   - Messaging preferences: formality (dropdown), emoji usage (dropdown)

5. **Features** — toggles for `workspace.yaml` features:
   - Group the 17 toggles by category with section headers:
     - Email & Messaging: email_processing, messaging_processing, email_triage
     - Meetings: meeting_prep, process_meeting
     - Calendar: time_blocks, calendar_reminders
     - People & Team: people_management, team_health, attention_gap_detection, feedback_gap_detection, milestones
     - Tracking: self_tracking, contribution_detection
     - Summaries: weekly_summary, monthly_updates
     - Context: park_resume
   - Each toggle: switch UI with label and one-line description of what it does

**JavaScript for this task:**
- Tab switching (highlight active tab, show/hide content)
- Load config from `GET /api/config` on page load
- Populate all form fields from loaded config
- Save button per tab: collect form data, `PUT /api/config/{name}`
- Success/error feedback on save (toast notification or inline message)
- Auto-save indicator (optional — explicit save button is fine)

**Important:** Build the tab infrastructure so Tasks 3b and 3c can add tabs without restructuring. Each tab should be a self-contained section in the HTML with a consistent pattern.

#### Review criteria — Review as a Product Designer focused on polish and usability
- [ ] Page looks professional — not a homework project. Clean typography, consistent spacing, clear hierarchy.
- [ ] Tailwind CDN loaded. Styles use Tailwind utility classes primarily, custom CSS only where Tailwind can't reach.
- [ ] All 5 tabs render with correct form fields matching the schemas above
- [ ] Tab switching works smoothly
- [ ] Forms populate from API data on page load
- [ ] Save writes back to API and shows feedback
- [ ] Dropdowns have the correct options for each enum field
- [ ] Feature toggles are grouped by category with descriptions
- [ ] Overview tab shows configured vs missing status for each section
- [ ] No JavaScript errors in browser console
- [ ] Layout works on 1024px+ screens

### Task 3b: Projects + People Tabs

Add two complex tabs to the existing UI. These tabs have dynamic lists with add/edit/remove.

**Projects tab:**
- List of current projects, each shown as a card or row with: name, status badge, description (truncated), key people count
- Click a project → expands inline to show all fields editable:
  - Name (text)
  - Aliases (tag-style input — type and press enter to add, click x to remove)
  - Status (dropdown: active, paused, complete)
  - Description (textarea)
  - Email folders (tag-style input)
  - Slack channels (tag-style input)
  - Key people (tag-style input)
- **+ Add Project** button at the bottom → adds empty form inline
- Delete button per project (with confirmation)
- Save button for the whole tab

**People tab:**
- List of current people, each shown as a card or row with: display name, role, relationship tier badge
- Click a person → expands inline to show all fields editable:
  - Display name (text)
  - Full name (text)
  - Aliases (tag-style input)
  - Email (text)
  - Slack handle (text)
  - Relationship tier (dropdown: direct, peer, upward, cross-team)
  - Role (text)
  - Team (text)
  - Feedback cycle days (number, optional)
  - Birthday (date input, MM-DD format)
  - Work anniversary (date input, YYYY-MM-DD)
- **+ Add Person** button at the bottom
- Delete button per person (with confirmation)
- Save button for the whole tab

**Tag-style input pattern:** A common component used for aliases, email_folders, slack_channels, key_people. Shows items as pills/tags. Text input to add new items. Click x on a tag to remove. Build this as a reusable JavaScript component.

#### Review criteria — Review as a Product Designer focused on interaction quality
- [ ] Projects and People tabs added to existing tab navigation
- [ ] List view shows meaningful summary for each entry (not just the name)
- [ ] Expand/collapse works for editing individual entries
- [ ] Tag-style input works: add by typing + enter, remove by clicking x
- [ ] + Add button creates a new empty entry with all fields
- [ ] Delete button has confirmation dialog (not browser alert — inline confirmation)
- [ ] Status and tier badges use color to distinguish values
- [ ] All fields from the schema are present and editable
- [ ] Save writes the full list back to the API
- [ ] Visual consistency with the simple tabs from Task 3a — same spacing, typography, input styles

### Task 3c: File Upload + Defaults Display

Add the final tab and footer section to the UI.

**Files tab:**
- Drag-and-drop zone — large, obvious area with dashed border and icon
- Also a "Choose files" button as alternative to drag-drop
- Supports multiple files at once
- On upload: POST to `/api/upload`, show list of uploaded files with name and timestamp
- Show existing pending imports from `GET /api/imports`
- Helper text: "Upload project docs, team pages, or any docs that describe your work. Run `/myna-setup import` in chat to process them."
- No processing happens in the UI — just upload and display

**Defaults footer (visible on all tabs):**
- A collapsible "Defaults" section at the bottom of the page
- Shows all config values that are set to defaults and not asked during setup:
  - `timestamp_format: YYYY-MM-DD`
  - `prompt_logging: true`
  - `ai_model: claude-code`
  - `calendar_event_prefix: [Myna]`
  - `calendar_event_types: Focus / Task / Reminder`
- Each shown as label + value. Not editable in the UI — just informational.
- Text: "These are internal defaults. Edit `workspace.yaml` directly to change them."

#### Review criteria — Review as a Product Designer
- [ ] Files tab has a clear drag-drop zone with visual feedback on hover/drag-over
- [ ] File upload calls the API and shows the uploaded file list
- [ ] Pending imports display correctly
- [ ] Helper text explains what to do next (run `/myna-setup import`)
- [ ] Defaults section is collapsible, shows all 5 default fields
- [ ] Defaults section is clearly marked as informational/read-only
- [ ] Visual consistency with other tabs

### Task 4: Install Script Update

**File:** `install.sh`

Add a new section to the install script that copies UI files to `~/.myna/ui/`.

Add after the "Install Manifest" section and before the "Setup Checklist" section:

```bash
# ── Config UI ────────────────────────────────────────────────

step "Installing config UI"

UI_SRC="$SCRIPT_DIR/ui"
UI_DEST="$MYNA_HOME/ui"

if [ -d "$UI_SRC" ]; then
  if $DRY_RUN; then
    echo "  [dry-run] mkdir -p $UI_DEST"
    echo "  [dry-run] cp ui files → $UI_DEST"
  else
    mkdir -p "$UI_DEST"
    cp "$UI_SRC"/*.py "$UI_DEST/" 2>/dev/null || true
    cp "$UI_SRC"/*.html "$UI_DEST/" 2>/dev/null || true
    cp "$UI_SRC"/*.css "$UI_DEST/" 2>/dev/null || true
    cp "$UI_SRC"/*.js "$UI_DEST/" 2>/dev/null || true
    info "Config UI installed to $UI_DEST/"
  fi
else
  warn "UI files not found — skipping config UI installation"
fi

# Create imports directory
if $DRY_RUN; then
  echo "  [dry-run] mkdir -p $MYNA_HOME/imports/archived"
else
  mkdir -p "$MYNA_HOME/imports/archived" 2>/dev/null || true
fi
```

Also update the install summary to include the UI:
```
echo "  Config UI:     $UI_DEST/"
```

#### Review criteria — Review as a DevOps engineer
- [ ] UI files copied from `ui/` to `~/.myna/ui/`
- [ ] `~/.myna/imports/` and `~/.myna/imports/archived/` created
- [ ] Dry-run support matches existing pattern
- [ ] Handles missing `ui/` directory gracefully (warn, don't error)
- [ ] Summary line added
- [ ] No existing install functionality broken
- [ ] `bash -n install.sh` passes

### Task 5: Update `/myna-setup` Skill

**File:** `agents/skills/myna-setup/SKILL.md` (on the `feat/myna-setup-skill` branch)

Add the "Open config UI" option to the setup skill. This is a small addition, not a rewrite.

Add to the skill's workflow:

When presenting options to the user, include "Open config UI" as option 1 (before the interview). When selected:
1. Check if `python3` is available. If not, tell the user to install Python and fall back to the interview.
2. Run `python3 ~/.myna/ui/server.py` in the background.
3. Capture the PID and URL from stdout.
4. Show the URL to the user: "Config UI is open at {url}. Make your changes and come back here when done."
5. When user says they're done, kill the server process.
6. Read the updated config files and show a summary of what changed.

Also add: when the skill starts and finds files in `~/.myna/pending-imports.json`, mention it: "You have N files ready for import. Want me to process them?"

Add Python as a prerequisite note in the skill: "The config UI requires Python 3. If not available, the guided interview and doc import modes work without it."

#### Review criteria — Review as a Tech Writer focused on clarity
- [ ] Config UI option is listed first among the setup options
- [ ] Python check with graceful fallback described
- [ ] Start/stop server flow described
- [ ] Pending imports detection described
- [ ] Python prerequisite mentioned
- [ ] Changes fit naturally into the existing skill structure — not a bolt-on
- [ ] The skill file doesn't script exact conversation (maintains the "describe workflow, not dialogue" principle)

### Task 6: Doc Updates

**README.md:** Add `Python 3` to the prerequisites line:
```
**Prerequisites:** [Claude Code](https://claude.ai/code) · [Obsidian](https://obsidian.md/) · Python 3 (for config UI)
```

**docs/post-install-checklist.md:** In section 6 ("Fill In Your Config Files"), add an option before the manual editing steps:
```
Option A: Run `/myna-setup` and choose "Open config UI" for a visual editor.
Option B: Edit the files directly:
```

#### Review criteria — Review as a Tech Writer
- [ ] README prerequisites updated with Python 3 and "(for config UI)" qualifier
- [ ] Post-install checklist offers config UI as an option alongside manual editing
- [ ] Changes are minimal and match existing tone
- [ ] No existing content removed

---

## Review discipline

Reviews (both per-task and final) must only flag issues that would cause real problems — execution failures, wrong output, broken functionality, missing requirements. Do NOT flag stylistic preferences, minor wording choices, or theoretical concerns. A clean review is a valid outcome — don't manufacture findings. The test: "would this actually break something or produce wrong results?" If no, skip it.

## Execution order

```
Phase 0: git checkout feat/myna-setup-skill
Phase 1 (parallel): Task 1 (YAML parser) + Task 3a (UI scaffold + simple tabs)
Review Phase 1
Phase 2 (parallel): Task 2 (server — depends on parser) + Task 3b (projects + people tabs — depends on scaffold)
Review Phase 2
Phase 3 (parallel): Task 3c (file upload + defaults) + Task 4 (install script) + Task 5 (skill update) + Task 6 (docs)
Review Phase 3
Final: python3 ui/test_yaml_parser.py && bash -n install.sh
```

## Quality checks

Run ALL of these. Do not skip any.

1. **Parser tests:** `python3 ui/test_yaml_parser.py` — all tests pass, 0 failures
2. **Parser round-trip on real configs:** For each of the 6 `.yaml.example` files in `agents/config-examples/`, run: load → dump to temp file → load temp file → compare dicts. They must match.
3. **Install script syntax:** `bash -n install.sh` — passes
4. **Server startup test:** Start the server with `python3 ui/server.py &`, capture PID from stdout. Verify:
   - PID line printed
   - URL line printed
   - `curl http://localhost:{port}/api/config` returns JSON with all 6 config sections
   - `curl http://localhost:{port}/api/manifest` returns the install manifest
   - `curl http://localhost:{port}/` returns HTML (the UI page)
   - Kill the server after test
5. **API round-trip test:** 
   - GET config → note a value
   - PUT config with a changed value
   - GET config again → verify the change persisted
   - Restore original value
6. **File count:** Verify `ui/` directory contains: `yaml_parser.py`, `test_yaml_parser.py`, `server.py`, `index.html`, `styles.css`, `app.js` (6 files minimum)
7. **Skill check:** Grep `agents/skills/myna-setup/SKILL.md` for "config UI" — verify it's mentioned
8. **No external dependencies:** `grep -r "import " ui/*.py` — verify only stdlib modules are imported (http.server, json, os, sys, threading, time, pathlib, socket, etc. — no pyyaml, flask, requests, etc.)

## Final integration review

After all quality checks pass, do one final read-through of all created files. Verify:
- `server.py` imports from `yaml_parser` correctly (same directory, no package issues)
- `index.html` references `styles.css` and `app.js` with correct relative paths
- `app.js` uses the correct API endpoint paths matching `server.py`
- The tag-style input component in Task 3b is used consistently for all array fields (aliases, email_folders, slack_channels, key_people)
- All form field names in the JS match the YAML keys the server expects
- The Overview tab's status checks match the actual fields in each config file

Fix anything found. Then commit.

## Commit and push

Create separate commits for each task (same branch):

1. `feat(config-ui): add custom YAML parser with tests`
2. `feat(config-ui): add Python HTTP server for config API`
3. `feat(config-ui): add UI scaffold with identity, integrations, communication, features tabs`
4. `feat(config-ui): add projects and people tabs with dynamic list editing`
5. `feat(config-ui): add file upload tab and defaults display`
6. `chore(install): copy config UI files to ~/.myna/ui/`
7. `feat(setup): add config UI option to /myna-setup skill`
8. `docs: add Python prerequisite and config UI references`

If any autonomous decisions were made, add a final commit:
9. `docs: log autonomous decisions made during config-ui build`

All commits on the `feat/myna-setup-skill` branch. Push when done.

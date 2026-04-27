---
name: init
disable-model-invocation: true
description: 'First-time vault setup — creates vault directories, copies starter config, templates, and dashboards. Run once after installing the plugin.'
user-invocable: true
argument-hint: "[vault path]"
---

# myna-init

First-time vault setup. Creates the full Myna directory structure, copies starter config files, templates, and dashboards into your Obsidian vault. Idempotent — safe to re-run; existing config files and directories are never overwritten.

Run this once immediately after installing the Myna plugin. After it completes, run `/myna:setup` to configure your identity, projects, people, and integrations.

`${CLAUDE_SKILL_DIR}` is the directory containing this SKILL.md file, resolved by the plugin runtime to the skill's install location.

---

## Step 1: Ask for Vault Path

Ask the user:

> Where is your Obsidian vault? Please provide the full absolute path (e.g. `/Users/you/Documents/MyVault`).
> What subfolder name should Myna use inside the vault? (default: `myna`)

Wait for their answer. Resolve the vault path to an absolute path. If the directory does not exist, tell the user and stop.

---

## Step 2: Confirm and Proceed

Show a confirmation summary before doing anything:

```
Vault:     {vault_path}
Subfolder: {subfolder}
Myna root: {vault_path}/{subfolder}/
```

Ask: "Ready to set up? (yes/no)"

If yes, proceed. If no, stop.

---

## Step 3: Write ~/.myna/config.yaml

Create `~/.myna/` if it does not exist.

Write `~/.myna/config.yaml` with the following content (substituting the user's values):

```yaml
vault_path: {vault_path}
subfolder: {subfolder}
```

If the file already exists, overwrite it — it holds the same two fields and is safe to regenerate.

---

## Step 4: Create Vault Directory Structure

Create the following 17 directories under `{vault_path}/{subfolder}/`. Use `mkdir -p` semantics — skip any that already exist.

```
Projects/
People/
Meetings/1-1s/
Meetings/Recurring/
Meetings/Adhoc/
Drafts/
Journal/Archive/
Team/
ReviewQueue/
ReviewQueue/processed/
Dashboards/
_meta/learnings/
_system/config/
_system/templates/
_system/logs/
_system/sources/
_system/parked/
```

Use Bash with `mkdir -p` for each directory.

---

## Step 5: Copy Config Example Files

Copy each `.yaml.example` file from `${CLAUDE_SKILL_DIR}/config-examples/` to `{vault_path}/{subfolder}/_system/config/`.

Files to copy (always overwrite the `.example` destination — these are reference files, not user-edited):

- `communication-style.yaml.example`
- `meetings.yaml.example`
- `people.yaml.example`
- `projects.yaml.example`
- `tags.yaml.example`
- `workspace.yaml.example`

---

## Step 6: Create Starter Config Files

For each of the six config files, create the starter YAML at `{vault_path}/{subfolder}/_system/config/{name}.yaml` **only if the file does not already exist**. Never overwrite an existing file — the user may have already edited it.

### projects.yaml

```yaml
# Run /myna:setup for guided configuration.
projects: []
```

### people.yaml

```yaml
# Run /myna:setup for guided configuration.
people: []
```

### meetings.yaml

```yaml
# Run /myna:setup for guided configuration.
# Optional overrides. Most meetings need no entry — type inferred from calendar.
meetings: []
```

### workspace.yaml

```yaml
# Run /myna:setup for guided configuration.

user:
  name: ""
  email: ""
  role: ""

vault:
  path: ""
  subfolder: myna

timezone: ""
work_hours:
  start: "09:00"
  end: "17:00"
timestamp_format: "YYYY-MM-DD"

journal:
  archive_after_days: 30

email:
  processed_folder: per-project
  common_folder: "Processed/"

# ---
# Email Triage Configuration
# Controls how "triage my inbox" classifies emails.
# ---
triage:
  inbox_source: ""
  folders:
    - name: Reply
      description: "Needs a response from me"
    - name: FYI
      description: "Informational, no action needed"
    - name: Follow-Up
      description: "Waiting on someone else — check back later"
    - name: Schedule
      description: "Needs a meeting or calendar action"
  draft_replies_folder: ""

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
  observations_logging: true
  recognition_tracking: true
  person_briefing: true
  one_on_one_analysis: true
  performance_narrative: true
  weekly_summary: true
  monthly_updates: true
  park_resume: true
  meeting_summaries: true
  email_draft_reply: true
  message_rewriting: true
  document_processing: true
  pre_read_prep: true
  difficult_conversation: true
  help_me_say_no: true
  quick_capture: true
  link_manager: true
  auto_tagging: true
```

### communication-style.yaml

```yaml
# Run /myna:setup for guided configuration.

default_preset: professional

presets_per_tier:
  upward: ""
  peer: ""
  direct: ""
  cross-team: ""

sign_off: ""

email_preferences:
  max_length: ""
  greeting_style: ""
messaging_preferences:
  formality: ""
  emoji_usage: ""
```

### tags.yaml

```yaml
# Run /myna:setup for guided configuration.
tags: []
```

After writing each file, report: "Created: {name}.yaml" or "Preserved existing: {name}.yaml".

---

## Step 7: Copy Templates

Copy all `.md` files from `${CLAUDE_SKILL_DIR}/templates/` to `{vault_path}/{subfolder}/_system/templates/`.

Overwrite any existing files in the destination — templates are always refreshed on init (the user does not edit them directly).

Report the count: "Installed N templates."

---

## Step 8: Copy Dashboards

Copy all `.md` files from `${CLAUDE_SKILL_DIR}/dashboards/` to `{vault_path}/{subfolder}/Dashboards/`.

Overwrite any existing files — dashboards are always refreshed on init.

Report the count: "Installed N dashboards."

---

## Step 9: Copy Guide

Copy `${CLAUDE_SKILL_DIR}/guide.md` to `{vault_path}/{subfolder}/guide.md`.

Overwrite if it exists.

---

## Step 10: Copy Setup Checklist

Copy `${CLAUDE_SKILL_DIR}/setup-checklist.md` to `{vault_path}/{subfolder}/_system/setup-checklist.md`.

Overwrite if it exists.

---

## Step 11: Create ~/.myna/custom-routing.md

Create `~/.myna/custom-routing.md` **only if it does not already exist**. Write this content exactly:

```
<!-- Custom routing rules for user-added skills.
     This file is never overwritten by updates.
     Rules here take precedence over Myna's built-in routing.

     Format — add your routing rules as markdown below. Example:

     ### Oncall Routing
     - "oncall escalation", "page someone", "who's on call?" → my-oncall
     - "standup update", "what did my team ship?" → my-amazon-standup
-->
```

---

## Step 12: Create ~/.myna/imports/archived/

Create `~/.myna/imports/archived/` if it does not already exist. Use `mkdir -p`.

---

## Step 13: Configure Obsidian (Optional)

Ask the user:

> Want Myna to configure Obsidian plugin settings automatically? This writes three JSON files to `.obsidian/` in your vault root — daily-notes.json, periodic-notes.json, and dataview.json. (yes/no)

If yes, write the following files to `{vault_path}/.obsidian/`. Create the `.obsidian/` directory if it does not exist.

**daily-notes.json** — write this content exactly:

```json
{
  "folder": "Journal/Daily",
  "template": "_system/templates/daily-note",
  "dateFormat": "YYYY-MM-DD",
  "autorun": false
}
```

**periodic-notes.json** — write this content exactly:

```json
{
  "daily": {
    "enabled": true,
    "folder": "Journal/Daily",
    "template": "_system/templates/daily-note",
    "format": "YYYY-MM-DD"
  },
  "weekly": {
    "enabled": true,
    "folder": "Journal/Weekly",
    "template": "_system/templates/weekly-note",
    "format": "YYYY-[W]WW"
  }
}
```

**dataview.json** — write this content exactly:

```json
{
  "enableDataviewJs": true,
  "enableInlineDataview": true,
  "enableInlineDataviewJs": false,
  "prettyRenderInlineFields": true
}
```

If the user says no, tell them: "Skipped — you can configure Obsidian settings manually (see `_system/setup-checklist.md` in your vault for instructions)."

---

## Step 14: Offer Shell Alias

Ask the user:

> Want to add a `myna` shell alias so you can launch Myna from your terminal? (yes/no)

If yes, detect the user's shell rc file: check if `$SHELL` is zsh → use `~/.zshrc`, otherwise use `~/.bashrc`.

Check whether `alias myna=` already appears in the rc file. If it does, tell the user: "Alias already present in {rc_file} — skipping."

If not already present, append this line to the rc file:

```
alias myna="claude --agent myna:agent"
```

Tell the user: "Added alias to {rc_file}. Run `source {rc_file}` or open a new terminal to activate it."

---

## Completion Summary

Show a summary after all steps complete:

```
Init complete.

  Vault root:   {vault_path}/{subfolder}/
  Config:       {vault_path}/{subfolder}/_system/config/
  Templates:    {vault_path}/{subfolder}/_system/templates/  (N files)
  Dashboards:   {vault_path}/{subfolder}/Dashboards/  (N files)
  Config file:  ~/.myna/config.yaml
```

Then tell the user: "Run `/myna:setup` next to configure your identity, projects, people, and integrations."

---

## Idempotency Rules

- `mkdir -p` semantics: skip directories that already exist.
- Never overwrite existing `.yaml` config files (workspace.yaml, projects.yaml, people.yaml, meetings.yaml, communication-style.yaml, tags.yaml).
- Always overwrite `.yaml.example` files, templates, dashboards, guide, and setup-checklist — these are managed by Myna, not the user.
- Never overwrite `~/.myna/custom-routing.md` if it already exists.
- Always overwrite `~/.myna/config.yaml` — it holds vault path and subfolder, safe to regenerate.

#!/usr/bin/env bash
# lib.sh — Shared Myna vault scaffolding
# Source this file and call: run_vault_setup <vault_path> <subfolder> <skill_dir>
# Note: <subfolder> is always "myna" (hardcoded per D055); the parameter is kept for
# compatibility with the call signature in claude.sh and kiro.sh.

_myna_create_if_missing() {
  local path="$1"
  local content="$2"
  if [[ ! -f "$path" ]]; then
    printf '%s\n' "$content" > "$path"
    echo "  Created: $(basename "$path")"
  else
    echo "  Preserved existing: $(basename "$path")"
  fi
}

run_vault_setup() {
  local VAULT_PATH="$1"
  local SUBFOLDER="$2"
  local SKILL_DIR="$3"
  local MYNA_ROOT="$VAULT_PATH/$SUBFOLDER"

  # ---------------------------------------------------------------------------
  # Step 1: Write ~/.myna/config.yaml (always overwrite)
  # ---------------------------------------------------------------------------

  mkdir -p "$HOME/.myna"

  cat > "$HOME/.myna/config.yaml" <<EOF
vault_path: $VAULT_PATH
EOF

  echo "[1/12] Wrote ~/.myna/config.yaml"

  # ---------------------------------------------------------------------------
  # Step 2: Create 17 vault directories
  # ---------------------------------------------------------------------------

  local DIRS=(
    "Projects"
    "People"
    "Meetings/1-1s"
    "Meetings/Recurring"
    "Meetings/Adhoc"
    "Drafts"
    "Journal/Archive"
    "Team"
    "ReviewQueue"
    "ReviewQueue/processed"
    "Dashboards"
    "_meta/learnings"
    "_system/config"
    "_system/templates"
    "_system/logs"
    "_system/sources"
    "_system/parked"
  )

  for dir in "${DIRS[@]}"; do
    mkdir -p "$MYNA_ROOT/$dir"
  done

  echo "[2/12] Created 17 vault directories"

  # ---------------------------------------------------------------------------
  # Step 3: Copy .yaml.example files (always overwrite)
  # ---------------------------------------------------------------------------

  cp "$SKILL_DIR/config-examples/"*.yaml.example "$MYNA_ROOT/_system/config/"

  echo "[3/12] Copied config example files"

  # ---------------------------------------------------------------------------
  # Step 4: Create starter YAML config files (only if they do not exist)
  # ---------------------------------------------------------------------------

  _myna_create_if_missing "$MYNA_ROOT/_system/config/projects.yaml" \
'# Run /myna:setup for guided configuration.
projects: []'

  _myna_create_if_missing "$MYNA_ROOT/_system/config/people.yaml" \
'# Run /myna:setup for guided configuration.
people: []'

  _myna_create_if_missing "$MYNA_ROOT/_system/config/meetings.yaml" \
'# Run /myna:setup for guided configuration.
# Optional overrides. Most meetings need no entry — type inferred from calendar.
meetings: []'

  _myna_create_if_missing "$MYNA_ROOT/_system/config/workspace.yaml" \
'# Run /myna:setup for guided configuration.

user:
  name: ""
  email: ""
  role: ""

vault:
  path: ""

timezone: ""
work_hours:
  start: "09:00"
  end: "17:00"

journal:
  archive_after_days: 30

email:
  processed_folder: per-project

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
  auto_tagging: true'

  _myna_create_if_missing "$MYNA_ROOT/_system/config/communication-style.yaml" \
'# Run /myna:setup for guided configuration.

default_preset: professional

presets_per_tier:
  upward: ""
  peer: ""
  direct: ""
  cross-team: ""

sign_off: ""

email_preferences:
  max_length: ""
  greeting_style: ""'

  _myna_create_if_missing "$MYNA_ROOT/_system/config/tags.yaml" \
'# Run /myna:setup for guided configuration.
tags: []'

  echo "[4/12] Starter config files done"

  # ---------------------------------------------------------------------------
  # Step 5: Copy templates (always overwrite)
  # ---------------------------------------------------------------------------

  if [[ -d "$SKILL_DIR/templates" ]]; then
    local template_count=0
    for f in "$SKILL_DIR/templates/"*.md; do
      [[ -f "$f" ]] || continue
      cp "$f" "$MYNA_ROOT/_system/templates/"
      template_count=$((template_count + 1))
    done
    echo "[5/12] Installed $template_count templates"
  else
    echo "[5/12] No templates directory found — skipped"
  fi

  # ---------------------------------------------------------------------------
  # Step 6: Copy dashboards (always overwrite)
  # ---------------------------------------------------------------------------

  if [[ -d "$SKILL_DIR/dashboards" ]]; then
    local dashboard_count=0
    for f in "$SKILL_DIR/dashboards/"*.md; do
      [[ -f "$f" ]] || continue
      cp "$f" "$MYNA_ROOT/Dashboards/"
      dashboard_count=$((dashboard_count + 1))
    done
    echo "[6/12] Installed $dashboard_count dashboards"
  else
    echo "[6/12] No dashboards directory found — skipped"
  fi

  # ---------------------------------------------------------------------------
  # Step 7: Copy guide.md (always overwrite)
  # ---------------------------------------------------------------------------

  cp "$SKILL_DIR/guide.md" "$MYNA_ROOT/guide.md"
  echo "[7/12] Copied guide.md"

  # ---------------------------------------------------------------------------
  # Step 8: Copy setup-checklist.md (always overwrite)
  # ---------------------------------------------------------------------------

  cp "$SKILL_DIR/setup-checklist.md" "$MYNA_ROOT/_system/setup-checklist.md"
  echo "[8/12] Copied setup-checklist.md"

  # ---------------------------------------------------------------------------
  # Step 9: Create ~/.myna/overrides/ structure; write routing.md if missing
  # ---------------------------------------------------------------------------

  mkdir -p "$HOME/.myna/overrides/skills"

  if [[ ! -f "$HOME/.myna/overrides/routing.md" ]]; then
    cat > "$HOME/.myna/overrides/routing.md" <<'ROUTING_EOF'
<!-- User routing overrides for Myna.
     This file is never overwritten by Myna updates.
     Rules here take precedence over Myna's built-in routing.

     Add routing rules as markdown below. Example:

     ### Oncall Routing
     - "oncall escalation", "page someone", "who's on call?" → my-oncall
     - "standup update", "what did my team ship?" → my-amazon-standup
-->
ROUTING_EOF
    echo "[9/12] Created ~/.myna/overrides/routing.md"
  else
    echo "[9/12] Preserved existing ~/.myna/overrides/routing.md"
  fi

  # ---------------------------------------------------------------------------
  # Step 10: Create ~/.myna/imports/archived/
  # ---------------------------------------------------------------------------

  mkdir -p "$HOME/.myna/imports/archived"
  echo "[10/12] Created ~/.myna/imports/archived/"

  # ---------------------------------------------------------------------------
  # Step 11: Write Obsidian config JSON files (always overwrite)
  # ---------------------------------------------------------------------------

  mkdir -p "$VAULT_PATH/.obsidian"

  cat > "$VAULT_PATH/.obsidian/daily-notes.json" <<'EOF'
{
  "folder": "Journal/Daily",
  "template": "_system/templates/daily-note",
  "dateFormat": "YYYY-MM-DD",
  "autorun": false
}
EOF

  cat > "$VAULT_PATH/.obsidian/periodic-notes.json" <<'EOF'
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
EOF

  cat > "$VAULT_PATH/.obsidian/dataview.json" <<'EOF'
{
  "enableDataviewJs": true,
  "enableInlineDataview": true,
  "enableInlineDataviewJs": false,
  "prettyRenderInlineFields": true
}
EOF

  echo "[11/12] Wrote Obsidian config files"
}

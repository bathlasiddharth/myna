#!/usr/bin/env bash
# install.sh — Myna vault scaffolding
# Usage: install.sh <vault_path> <subfolder>
#
# Creates the full Myna vault structure and ~/.myna/ home in one shot.
# Idempotent: safe to re-run without destroying existing user data.
# Exits 0 on success, non-zero on failure.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$SCRIPT_DIR/../skills/install"

# ---------------------------------------------------------------------------
# Step 1: Validate args
# ---------------------------------------------------------------------------

if [[ $# -ne 2 ]]; then
  echo "Usage: install.sh <vault_path> <subfolder>" >&2
  echo "  vault_path  Absolute path to your Obsidian vault directory (must already exist)" >&2
  echo "  subfolder   Name of the Myna subfolder inside the vault (e.g. myna)" >&2
  exit 1
fi

VAULT_PATH="$1"
SUBFOLDER="$2"
MYNA_ROOT="$VAULT_PATH/$SUBFOLDER"

if [[ ! -d "$VAULT_PATH" ]]; then
  echo "Error: vault_path does not exist: $VAULT_PATH" >&2
  exit 1
fi

echo "Myna install"
echo "  Vault:     $VAULT_PATH"
echo "  Subfolder: $SUBFOLDER"
echo "  Myna root: $MYNA_ROOT"
echo ""

# ---------------------------------------------------------------------------
# Step 2: Write ~/.myna/config.yaml (always overwrite)
# ---------------------------------------------------------------------------

mkdir -p "$HOME/.myna"

cat > "$HOME/.myna/config.yaml" <<EOF
vault_path: $VAULT_PATH
subfolder: $SUBFOLDER
EOF

echo "[1/12] Wrote ~/.myna/config.yaml"

# ---------------------------------------------------------------------------
# Step 3: Create 17 vault directories
# ---------------------------------------------------------------------------

DIRS=(
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
# Step 4: Copy .yaml.example files (always overwrite)
# ---------------------------------------------------------------------------

cp "$SKILL_DIR/config-examples/"*.yaml.example "$MYNA_ROOT/_system/config/"

echo "[3/12] Copied config example files"

# ---------------------------------------------------------------------------
# Step 5: Create starter YAML config files (only if they do not exist)
# ---------------------------------------------------------------------------

create_if_missing() {
  local path="$1"
  local content="$2"
  if [[ ! -f "$path" ]]; then
    printf '%s\n' "$content" > "$path"
    echo "  Created: $(basename "$path")"
  else
    echo "  Preserved existing: $(basename "$path")"
  fi
}

create_if_missing "$MYNA_ROOT/_system/config/projects.yaml" \
'# Run /myna:setup for guided configuration.
projects: []'

create_if_missing "$MYNA_ROOT/_system/config/people.yaml" \
'# Run /myna:setup for guided configuration.
people: []'

create_if_missing "$MYNA_ROOT/_system/config/meetings.yaml" \
'# Run /myna:setup for guided configuration.
# Optional overrides. Most meetings need no entry — type inferred from calendar.
meetings: []'

create_if_missing "$MYNA_ROOT/_system/config/workspace.yaml" \
'# Run /myna:setup for guided configuration.

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
  auto_tagging: true'

create_if_missing "$MYNA_ROOT/_system/config/communication-style.yaml" \
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
  greeting_style: ""
messaging_preferences:
  formality: ""
  emoji_usage: ""'

create_if_missing "$MYNA_ROOT/_system/config/tags.yaml" \
'# Run /myna:setup for guided configuration.
tags: []'

echo "[4/12] Starter config files done"

# ---------------------------------------------------------------------------
# Step 6: Copy templates (always overwrite)
# ---------------------------------------------------------------------------

if [[ -d "$SKILL_DIR/templates" ]]; then
  template_count=0
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
# Step 7: Copy dashboards (always overwrite)
# ---------------------------------------------------------------------------

if [[ -d "$SKILL_DIR/dashboards" ]]; then
  dashboard_count=0
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
# Step 8: Copy guide.md (always overwrite)
# ---------------------------------------------------------------------------

cp "$SKILL_DIR/guide.md" "$MYNA_ROOT/guide.md"
echo "[7/12] Copied guide.md"

# ---------------------------------------------------------------------------
# Step 9: Copy setup-checklist.md (always overwrite)
# ---------------------------------------------------------------------------

cp "$SKILL_DIR/setup-checklist.md" "$MYNA_ROOT/_system/setup-checklist.md"
echo "[8/12] Copied setup-checklist.md"

# ---------------------------------------------------------------------------
# Step 10: Create ~/.myna/overrides/ structure; write routing.md if missing
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
# Step 11: Create ~/.myna/imports/archived/
# ---------------------------------------------------------------------------

mkdir -p "$HOME/.myna/imports/archived"
echo "[10/12] Created ~/.myna/imports/archived/"

# ---------------------------------------------------------------------------
# Step 12: Write Obsidian config JSON files (always overwrite)
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

# ---------------------------------------------------------------------------
# Step 13: Completion summary
# ---------------------------------------------------------------------------

echo ""
echo "[12/12] Install complete."
echo ""
echo "  Vault root:   $MYNA_ROOT/"
echo "  Config:       $MYNA_ROOT/_system/config/"
echo "  Templates:    $MYNA_ROOT/_system/templates/"
echo "  Dashboards:   $MYNA_ROOT/Dashboards/"
echo "  Config file:  ~/.myna/config.yaml"
echo ""
echo "Run /myna:setup next to configure your identity, projects, people, and integrations."

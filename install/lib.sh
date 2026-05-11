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
  # Step 1: Write ~/.myna/config.yaml (preserve if exists with same vault path)
  # ---------------------------------------------------------------------------

  mkdir -p "$HOME/.myna"

  # Preserve existing config unless it is missing or vault_path is being changed.
  if [[ -f "$HOME/.myna/config.yaml" ]]; then
    existing_vault=$(grep '^vault_path:' "$HOME/.myna/config.yaml" 2>/dev/null | sed 's/vault_path: *"*//;s/"*$//' || true)
    if [[ "$existing_vault" == "$VAULT_PATH" ]]; then
      echo "[1/10] Preserved existing ~/.myna/config.yaml (same vault path)"
    else
      echo "~/.myna/config.yaml already exists with a different vault path."
      echo "  Existing: $existing_vault"
      echo "  Requested: $VAULT_PATH"
      echo "  To migrate, delete ~/.myna/config.yaml and re-run."
      exit 1
    fi
  else
    cat > "$HOME/.myna/config.yaml" <<EOF
vault_path: "$VAULT_PATH"
EOF
    echo "[1/10] Wrote ~/.myna/config.yaml"
  fi

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
    "Journal/Archive/Daily"
    "Journal/Archive/Weekly"
    "Journal/Archive/Monthly"
    "Team"
    "ReviewQueue"
    "_system/config"
    "Dashboards"
    "_system/templates"
    "_system/logs"
    "_system/sources"
    "_system/parked"
    "_meta/learnings"
  )

  for dir in "${DIRS[@]}"; do
    mkdir -p "$MYNA_ROOT/$dir"
  done

  echo "[2/10] Created 18 vault directories"

  # ---------------------------------------------------------------------------
  # Step 3: Create starter YAML config files (only if they do not exist)
  # ---------------------------------------------------------------------------

  _myna_create_if_missing "$MYNA_ROOT/_system/config/projects.yaml" \
'# Run /myna:setup for guided configuration.
projects: []

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
  draft_replies_folder: ""'

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
  role: ""              # engineering-manager | tech-lead | senior-engineer | pm

vault:
  path: ""              # Not used at runtime — vault path is stored in ~/.myna/config.yaml

timezone: ""            # IANA timezone, e.g. America/Los_Angeles
work_hours:
  start: "09:00"
  end: "17:00"

email:
  processed_folder: per-project

feedback_cycle_days: 30

calendar_event_prefix: "[Myna]"

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
  weekly_summary: true
  monthly_updates: true
  park_resume: true'

  _myna_create_if_missing "$MYNA_ROOT/_system/config/communication-style.yaml" \
'# Run /myna:setup for guided configuration.

default_preset: professional   # professional | conversational | executive | casual | coaching | diplomatic | concise

presets_per_tier:
  upward: ""
  peer: ""
  direct: ""
  cross-team: ""

sign_off: ""

difficult_message_approach: direct-but-kind

email_preferences:
  max_length: ""               # short | medium | long
  greeting_style: ""           # first-name | formal | none'

  _myna_create_if_missing "$MYNA_ROOT/_system/config/tags.yaml" \
'# Run /myna:setup for guided configuration.
tags: []'

  echo "[3/10] Starter config files done"

  # ---------------------------------------------------------------------------
  # Step 3b: Create canonical empty review queue files and system files
  # ---------------------------------------------------------------------------

  _myna_create_if_missing "$MYNA_ROOT/ReviewQueue/review-work.md" \
'# Review Queue — Work

Items requiring your judgment: ambiguous tasks, routing, decisions, blockers.
Check a box to approve. Delete an entry to discard. Unchecked items stay for later.

'

  _myna_create_if_missing "$MYNA_ROOT/ReviewQueue/review-people.md" \
'# Review Queue — People

Items requiring your judgment: ambiguous observations, recognition, person resolution.
Check a box to approve. Delete an entry to discard. Unchecked items stay for later.

'

  _myna_create_if_missing "$MYNA_ROOT/ReviewQueue/review-self.md" \
'# Review Queue — Self

Uncertain contribution candidates. Review before logging to your contributions log.
Check a box to approve. Delete an entry to discard. Unchecked items stay for later.

'

  _myna_create_if_missing "$MYNA_ROOT/ReviewQueue/review-triage.md" \
'# Review Queue — Triage

Email folder recommendations. Check items to approve, edit folder assignments, delete items to skip.
Then say "process triage" to move approved emails.

'

  _myna_create_if_missing "$MYNA_ROOT/_system/logs/audit.md" \
'# Agent Audit Log

Auto-written by Myna. Do not edit manually.

'

  _myna_create_if_missing "$MYNA_ROOT/_system/logs/prompts.md" \
'# Prompt Log

Auto-written by Myna when prompt_logging is enabled. Do not edit manually.

'

  _myna_create_if_missing "$MYNA_ROOT/_system/logs/processed-channels.md" \
'# Auto-updated by myna-process-messages skill. Do not edit manually.
channels: {}
'

  _myna_create_if_missing "$MYNA_ROOT/_system/links.md" \
'# Links

- [{YYYY-MM-DD}] [{title}]({url}) — {description} — {entity: [[project]] or [[person]] or general}
'

  _myna_create_if_missing "$MYNA_ROOT/_system/setup-pending.md" \
'# Setup Pending

Steps skipped during setup that may need follow-up.

'

  echo "[3b] Created starter review queue files and system files"

  # ---------------------------------------------------------------------------
  # Step 4: Copy templates (create-if-missing; user may customize)
  # ---------------------------------------------------------------------------

  if [[ -d "$SKILL_DIR/templates" ]]; then
    local template_count=0
    for f in "$SKILL_DIR/templates/"*.md; do
      [[ -f "$f" ]] || continue
      local dest="$MYNA_ROOT/_system/templates/$(basename "$f")"
      if [[ ! -f "$dest" ]]; then
        cp "$f" "$dest"
        template_count=$((template_count + 1))
      fi
    done
    echo "[4/10] Installed $template_count templates (existing preserved)"
  else
    echo "[4/10] No templates directory found — skipped"
  fi

  # ---------------------------------------------------------------------------
  # Step 5: Copy dashboards to Dashboards/ (create-if-missing)
  # ---------------------------------------------------------------------------

  if [[ -d "$SKILL_DIR/dashboards" ]]; then
    local dashboard_count=0
    for f in "$SKILL_DIR/dashboards/"*.md; do
      [[ -f "$f" ]] || continue
      local dest="$MYNA_ROOT/Dashboards/$(basename "$f")"
      if [[ ! -f "$dest" ]]; then
        cp "$f" "$dest"
        dashboard_count=$((dashboard_count + 1))
      fi
    done
    echo "[5/10] Installed $dashboard_count dashboards (existing preserved)"
  else
    echo "[5/10] No dashboards directory found — skipped"
  fi

  # ---------------------------------------------------------------------------
  # Step 6: Copy guide.md (create-if-missing; user may annotate)
  # ---------------------------------------------------------------------------

  if [[ ! -f "$MYNA_ROOT/guide.md" ]]; then
    cp "$SKILL_DIR/guide.md" "$MYNA_ROOT/guide.md"
    echo "[6/10] Copied guide.md"
  else
    echo "[6/10] Preserved existing guide.md"
  fi

  # ---------------------------------------------------------------------------
  # Step 7: Copy setup-checklist.md (create-if-missing; user may annotate)
  # ---------------------------------------------------------------------------

  if [[ ! -f "$MYNA_ROOT/_system/setup-checklist.md" ]]; then
    cp "$SKILL_DIR/setup-checklist.md" "$MYNA_ROOT/_system/setup-checklist.md"
    echo "[7/10] Copied setup-checklist.md"
  else
    echo "[7/10] Preserved existing setup-checklist.md"
  fi

  # ---------------------------------------------------------------------------
  # Step 8: Create ~/.myna/overrides/ structure; write routing.md if missing
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
    echo "[8/10] Created ~/.myna/overrides/routing.md"
  else
    echo "[8/10] Preserved existing ~/.myna/overrides/routing.md"
  fi

  # ---------------------------------------------------------------------------
  # Step 9: Create ~/.myna/imports/archived/
  # ---------------------------------------------------------------------------

  mkdir -p "$HOME/.myna/imports/archived"
  echo "[9/10] Created ~/.myna/imports/archived/"

  # ---------------------------------------------------------------------------
  # Step 10: Write Obsidian config JSON files (always overwrite)
  # ---------------------------------------------------------------------------

  mkdir -p "$VAULT_PATH/.obsidian"

  cat > "$VAULT_PATH/.obsidian/daily-notes.json" <<EOF
{
  "folder": "$SUBFOLDER/Journal",
  "template": "$SUBFOLDER/_system/templates/daily-note",
  "dateFormat": "YYYY-MM-DD",
  "autorun": false
}
EOF

  cat > "$VAULT_PATH/.obsidian/periodic-notes.json" <<EOF
{
  "daily": {
    "enabled": true,
    "folder": "$SUBFOLDER/Journal",
    "template": "$SUBFOLDER/_system/templates/daily-note",
    "format": "YYYY-MM-DD"
  },
  "weekly": {
    "enabled": true,
    "folder": "$SUBFOLDER/Journal",
    "template": "$SUBFOLDER/_system/templates/weekly-note",
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

  echo "[10/10] Wrote Obsidian config files"
}

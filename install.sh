#!/usr/bin/env bash
# Myna Install Script
#
# Installs Myna as a global Claude Code subagent:
#   1. Copies 24 feature skills + 6 steering skills to ~/.claude/skills/
#   2. Generates the agent file at ~/.claude/agents/myna.md
#   3. Creates the vault folder structure in the user's Obsidian vault
#   4. Copies config .example files and creates starter configs
#
# Usage:
#   ./install.sh --vault-path ~/path/to/vault
#   ./install.sh --vault-path ~/path/to/vault --subfolder myna
#   ./install.sh --vault-path ~/path/to/vault --dry-run
#   ./install.sh --help

set -eo pipefail

# ── Defaults ──────────────────────────────────────────────────

VAULT_PATH=""
SUBFOLDER="myna"
DRY_RUN=false
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
VERSION="1.0.0"

# ── Colors ────────────────────────────────────────────────────

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BOLD='\033[1m'
NC='\033[0m'

info()  { printf "${GREEN}✓${NC} %s\n" "$1"; }
warn()  { printf "${YELLOW}!${NC} %s\n" "$1"; }
err()   { printf "${RED}✗${NC} %s\n" "$1" >&2; }
step()  { printf "\n${BOLD}── %s ──${NC}\n" "$1"; }

# ── Usage ─────────────────────────────────────────────────────

usage() {
  cat <<EOF
${BOLD}Myna Install${NC} — Install Myna as a global Claude Code subagent

${BOLD}Usage:${NC}
  ./install.sh --vault-path <path> [options]

${BOLD}Required:${NC}
  --vault-path <path>     Path to your Obsidian vault root

${BOLD}Options:${NC}
  --subfolder <name>      Myna subfolder name (default: myna)
  --dry-run               Show what would be done without making changes
  --help                  Show this help message

${BOLD}Examples:${NC}
  ./install.sh --vault-path ~/Documents/MyVault
  ./install.sh --vault-path ~/Documents/MyVault --subfolder myna
  ./install.sh --vault-path ~/Documents/MyVault --dry-run

${BOLD}After install:${NC}
  claude --agent myna     Launch Myna from any directory
EOF
  exit 0
}

# ── Parse Arguments ───────────────────────────────────────────

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault-path)  VAULT_PATH="$2"; shift 2 ;;
    --subfolder)   SUBFOLDER="$2"; shift 2 ;;
    --dry-run)     DRY_RUN=true; shift ;;
    --help|-h)     usage ;;
    *)             err "Unknown option: $1"; usage ;;
  esac
done

if [ -z "$VAULT_PATH" ]; then
  err "Missing required --vault-path argument"
  echo ""
  usage
fi

# Resolve to absolute path
VAULT_PATH="$(cd "$VAULT_PATH" 2>/dev/null && pwd)" || {
  err "Vault path does not exist: $VAULT_PATH"
  exit 1
}

# ── Prerequisites ─────────────────────────────────────────────

step "Prerequisites"

# Check vault path is a directory
if [ ! -d "$VAULT_PATH" ]; then
  err "Vault path is not a directory: $VAULT_PATH"
  exit 1
fi
info "Vault path exists: $VAULT_PATH"

# Check for Claude Code CLI
if command -v claude &>/dev/null; then
  info "Claude Code CLI found"
else
  warn "Claude Code CLI not found in PATH — install from https://claude.ai/code"
  warn "Continuing install (agent file and skills will be ready when Claude Code is available)"
fi

# Check source files exist
if [ ! -f "$SCRIPT_DIR/agents/main.md" ]; then
  err "agents/main.md not found — run install from the Myna repo root"
  exit 1
fi
info "Source files found"

# ── Copy Skills ───────────────────────────────────────────────

step "Installing skills to ~/.claude/skills/"

SKILLS_DEST="$HOME/.claude/skills"
MYNA_HOME="$HOME/.myna"

# Count skills to install
feature_count=0
steering_count=0

for skill_dir in "$SCRIPT_DIR"/agents/skills/myna-*/; do
  [ -d "$skill_dir" ] || continue
  skill_name="$(basename "$skill_dir")"

  if [[ "$skill_name" == myna-steering-* ]]; then
    steering_count=$((steering_count + 1))
  else
    feature_count=$((feature_count + 1))
  fi

  dest_dir="$SKILLS_DEST/$skill_name"

  if $DRY_RUN; then
    echo "  [dry-run] mkdir -p $dest_dir"
    echo "  [dry-run] cp $skill_dir/SKILL.md $dest_dir/SKILL.md"
    echo "  [dry-run] create $dest_dir/CUSTOM.md (if not exists)"
  else
    mkdir -p "$dest_dir"
    cp "$skill_dir/SKILL.md" "$dest_dir/SKILL.md"
    if [ ! -f "$dest_dir/CUSTOM.md" ]; then
      cat > "$dest_dir/CUSTOM.md" <<'EOF'
<!-- Customization file for this skill.
     Add overrides, extra steps, or behavioral tweaks below.
     This file is never overwritten by updates.
     Content here takes precedence over SKILL.md when they conflict. -->
EOF
    fi
  fi
done

info "Installed $feature_count feature skills + $steering_count steering skills"

# ── Generate Agent File ───────────────────────────────────────

step "Generating agent file"

AGENT_DIR="$HOME/.claude/agents"
AGENT_FILE="$AGENT_DIR/myna.md"

if $DRY_RUN; then
  echo "  [dry-run] mkdir -p $AGENT_DIR"
  echo "  [dry-run] Generate $AGENT_FILE with substitutions:"
  echo "    {{VAULT_PATH}} → $VAULT_PATH"
  echo "    {{SUBFOLDER}} → $SUBFOLDER"
else
  mkdir -p "$AGENT_DIR"

  # Read main.md, substitute placeholders, write to agent file
  sed \
    -e "s|{{VAULT_PATH}}|$VAULT_PATH|g" \
    -e "s|{{SUBFOLDER}}|$SUBFOLDER|g" \
    "$SCRIPT_DIR/agents/main.md" > "$AGENT_FILE"
fi

info "Agent file: $AGENT_FILE"

# ── Create Vault Structure ────────────────────────────────────

step "Creating vault structure"

MYNA_ROOT="$VAULT_PATH/$SUBFOLDER"

vault_dirs=(
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

for dir in "${vault_dirs[@]}"; do
  full_path="$MYNA_ROOT/$dir"
  if $DRY_RUN; then
    echo "  [dry-run] mkdir -p $full_path"
  else
    mkdir -p "$full_path"
  fi
done

info "Created ${#vault_dirs[@]} directories under $MYNA_ROOT/"

# Copy guide.md to vault root
if $DRY_RUN; then
  echo "  [dry-run] cp $SCRIPT_DIR/docs/guide.md → $MYNA_ROOT/guide.md"
else
  cp "$SCRIPT_DIR/docs/guide.md" "$MYNA_ROOT/guide.md"
  info "Guide: $MYNA_ROOT/guide.md"
fi

# ── Configure Obsidian ────────────────────────────────────────

step "Obsidian plugin configuration"

obsidian_configured=false

if $DRY_RUN; then
  echo "  [dry-run] Would prompt: Configure Obsidian settings automatically? (y/n)"
else
  printf "Configure Obsidian settings automatically? This will write plugin configs to .obsidian/ in your vault. (y/n): "
  read -r obsidian_answer
  if [[ "$obsidian_answer" =~ ^[Yy]$ ]]; then
    OBSIDIAN_DIR="$VAULT_PATH/.obsidian"
    mkdir -p "$OBSIDIAN_DIR"

    cat > "$OBSIDIAN_DIR/daily-notes.json" <<'JSON'
{
  "folder": "Journal/Daily",
  "template": "_system/templates/daily-note",
  "dateFormat": "YYYY-MM-DD",
  "autorun": false
}
JSON

    cat > "$OBSIDIAN_DIR/periodic-notes.json" <<'JSON'
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
JSON

    cat > "$OBSIDIAN_DIR/dataview.json" <<'JSON'
{
  "enableDataviewJs": true,
  "enableInlineDataview": true,
  "enableInlineDataviewJs": false,
  "prettyRenderInlineFields": true
}
JSON

    obsidian_configured=true
    info "Obsidian plugin configs written to $OBSIDIAN_DIR/"
  else
    info "Skipped — you can configure Obsidian settings manually (see setup checklist)"
  fi
fi

# ── Copy Config Examples ──────────────────────────────────────

step "Setting up config files"

CONFIG_DIR="$MYNA_ROOT/_system/config"
EXAMPLES_SRC="$SCRIPT_DIR/agents/config-examples"

config_files=(workspace projects people meetings communication-style tags)

for name in "${config_files[@]}"; do
  example_src="$EXAMPLES_SRC/${name}.yaml.example"
  example_dest="$CONFIG_DIR/${name}.yaml.example"
  config_dest="$CONFIG_DIR/${name}.yaml"

  if [ ! -f "$example_src" ]; then
    warn "Missing example file: ${name}.yaml.example — skipping"
    continue
  fi

  if $DRY_RUN; then
    echo "  [dry-run] cp $example_src → $example_dest"
    if [ ! -f "$config_dest" ]; then
      echo "  [dry-run] Write empty schema: $config_dest"
    fi
  else
    # Always refresh .example files
    cp "$example_src" "$example_dest"

    # Only create starter config if it doesn't exist (never overwrite user edits)
    if [ ! -f "$config_dest" ]; then
      # Write empty schema stubs — user fills in their own data
      case "$name" in
        projects)
          cat > "$config_dest" <<'YAML'
# Run /myna-setup for guided configuration.
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
  draft_replies_folder: ""
YAML
          ;;
        people)
          cat > "$config_dest" <<'YAML'
# Run /myna-setup for guided configuration.
people: []
YAML
          ;;
        meetings)
          cat > "$config_dest" <<'YAML'
# Run /myna-setup for guided configuration.
# Optional overrides. Most meetings need no entry — type inferred from calendar.
meetings: []
YAML
          ;;
        workspace)
          cat > "$config_dest" <<'YAML'
# Run /myna-setup for guided configuration.

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
YAML
          ;;
        communication-style)
          cat > "$config_dest" <<'YAML'
# Run /myna-setup for guided configuration.

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
YAML
          ;;
        tags)
          cat > "$config_dest" <<'YAML'
# Run /myna-setup for guided configuration.
tags: []
YAML
          ;;
        *)
          cp "$example_src" "$config_dest"
          ;;
      esac
      info "Created starter: ${name}.yaml"
    else
      info "Preserved existing: ${name}.yaml"
    fi
  fi
done

# ── Copy Templates ────────────────────────────────────────────

step "Installing templates"

TEMPLATES_SRC="$SCRIPT_DIR/agents/templates"
TEMPLATES_DEST="$MYNA_ROOT/_system/templates"

template_count=0
for tmpl in "$TEMPLATES_SRC"/*.md; do
  [ -f "$tmpl" ] || continue
  template_count=$((template_count + 1))
  dest="$TEMPLATES_DEST/$(basename "$tmpl")"

  if $DRY_RUN; then
    echo "  [dry-run] cp $tmpl → $dest"
  else
    cp "$tmpl" "$dest"
  fi
done

info "Installed $template_count templates"

# ── Copy Dashboards ───────────────────────────────────────────

step "Installing dashboards"

DASHBOARDS_SRC="$SCRIPT_DIR/agents/dashboards"
DASHBOARDS_DEST="$MYNA_ROOT/Dashboards"

dashboard_count=0
for dash in "$DASHBOARDS_SRC"/*.md; do
  [ -f "$dash" ] || continue
  dashboard_count=$((dashboard_count + 1))
  dest="$DASHBOARDS_DEST/$(basename "$dash")"

  if $DRY_RUN; then
    echo "  [dry-run] cp $dash → $dest"
  else
    cp "$dash" "$dest"
  fi
done

info "Installed $dashboard_count dashboards"

# ── Install Manifest ──────────────────────────────────────────

step "Writing install metadata"

if $DRY_RUN; then
  echo "  [dry-run] mkdir -p $MYNA_HOME"
  echo "  [dry-run] Write version file: $MYNA_HOME/version"
  echo "  [dry-run] Write manifest: $MYNA_HOME/install-manifest.json"
  echo "  [dry-run] create $MYNA_HOME/custom-routing.md (if not exists)"
else
  mkdir -p "$MYNA_HOME"

  # Version file
  echo "$VERSION" > "$MYNA_HOME/version"
  info "Version: $VERSION"

  # Install manifest (for future uninstall)
  cat > "$MYNA_HOME/install-manifest.json" <<MANIFEST
{
  "version": "$VERSION",
  "installed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "vault_path": "$VAULT_PATH",
  "subfolder": "$SUBFOLDER",
  "agent_file": "$AGENT_FILE",
  "skills_dir": "$SKILLS_DEST",
  "vault_root": "$MYNA_ROOT",
  "skill_count": {
    "feature": $feature_count,
    "steering": $steering_count
  }
}
MANIFEST
  info "Manifest: $MYNA_HOME/install-manifest.json"

  # Custom routing file (never overwrite)
  if [ ! -f "$MYNA_HOME/custom-routing.md" ]; then
    cat > "$MYNA_HOME/custom-routing.md" <<'EOF'
<!-- Custom routing rules for user-added skills.
     This file is never overwritten by updates.
     Rules here take precedence over Myna's built-in routing.

     Format — add your routing rules as markdown below. Example:

     ### Oncall Routing
     - "oncall escalation", "page someone", "who's on call?" → my-oncall
     - "standup update", "what did my team ship?" → my-amazon-standup
-->
EOF
    info "Custom routing: $MYNA_HOME/custom-routing.md"
  fi
fi

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

# ── Setup Checklist ───────────────────────────────────────────

step "Writing setup checklist"

CHECKLIST_FILE="$MYNA_ROOT/_system/setup-checklist.md"

if $DRY_RUN; then
  echo "  [dry-run] cp $SCRIPT_DIR/docs/post-install-checklist.md → $CHECKLIST_FILE"
else
  cp "$SCRIPT_DIR/docs/post-install-checklist.md" "$CHECKLIST_FILE"

  if [ "$obsidian_configured" = "true" ]; then
    TMPFILE=$(mktemp)
    echo "*(Obsidian settings were auto-configured during install — skip section 4.)*" > "$TMPFILE"
    echo "" >> "$TMPFILE"
    cat "$CHECKLIST_FILE" >> "$TMPFILE"
    mv "$TMPFILE" "$CHECKLIST_FILE"
  fi

  info "Setup checklist: $CHECKLIST_FILE"
fi

# ── Shell Aliases ─────────────────────────────────────────────

step "Adding shell aliases"

if $DRY_RUN; then
  echo "  [dry-run] Would detect shell rc file and add myna aliases"
else
  SHELL_RC=$([ "$SHELL" = "$(which zsh)" ] && echo "$HOME/.zshrc" || echo "$HOME/.bashrc")

  if grep -q "alias myna=" "$SHELL_RC" 2>/dev/null; then
    info "Shell aliases already present in $SHELL_RC — skipping"
  else
    REPO_DIR="$SCRIPT_DIR"
    cat >> "$SHELL_RC" <<ALIASES

# Myna aliases
alias myna='claude --agent myna --add-dir "$VAULT_PATH"'
alias myna-ro='claude --agent myna --allowedTools "Read,Glob,Grep" --add-dir "$VAULT_PATH"'
alias myna-x='claude --agent myna --allowedTools ""'
myna-update() {
  local manifest="\$HOME/.myna/install-manifest.json"
  local repo_dir="${REPO_DIR}"
  if [ ! -d "\$repo_dir" ]; then
    echo "Error: Myna repo not found at \$repo_dir"
    echo ""
    echo "The repo is required for updates. To re-install from scratch:"
    echo "  git clone https://github.com/bathlasiddharth/myna.git"
    echo "  cd myna"
    echo "  ./install.sh --vault-path <your-vault-path>"
    return 1
  fi
  local vault_path
  vault_path=\$(python3 -c "import json,sys; d=json.load(open('\$manifest')); print(d['vault_path'])" 2>/dev/null)
  if [ -z "\$vault_path" ]; then
    echo "Error: Could not read vault_path from \$manifest"
    echo "Try running the install script directly:"
    echo "  cd \$repo_dir && git pull && ./install.sh --vault-path <your-vault-path>"
    return 1
  fi
  echo "Pulling latest from \$repo_dir ..."
  (cd "\$repo_dir" && git pull) || { echo "Error: git pull failed"; return 1; }
  echo "Re-running install script ..."
  "\$repo_dir/install.sh" --vault-path "\$vault_path"
}
ALIASES
    info "Added myna aliases to $SHELL_RC"
    warn "Run 'source $SHELL_RC' or open a new terminal to activate aliases"
  fi
fi

# ── Summary ───────────────────────────────────────────────────

echo ""
echo "════════════════════════════════════════════════════"
if $DRY_RUN; then
  printf "${YELLOW}${BOLD}DRY RUN COMPLETE${NC} — no changes made\n"
else
  printf "${GREEN}${BOLD}INSTALL COMPLETE${NC}\n"
fi
echo "════════════════════════════════════════════════════"
echo ""
echo "  Agent file:    $AGENT_FILE"
echo "  Skills:        $SKILLS_DEST/myna-*/ ($feature_count feature + $steering_count steering)"
echo "  Customization: $SKILLS_DEST/myna-*/CUSTOM.md (per skill) + $MYNA_HOME/custom-routing.md"
echo "  Vault:         $MYNA_ROOT/"
echo "  Config:        $MYNA_ROOT/_system/config/"
echo "  Templates:     $MYNA_ROOT/_system/templates/ ($template_count files)"
echo "  Dashboards:    $MYNA_ROOT/Dashboards/ ($dashboard_count files)"
echo "  Manifest:      $MYNA_HOME/install-manifest.json"
echo "  Config UI:     $UI_DEST/"
if ! $DRY_RUN; then
  echo "  Checklist:     $CHECKLIST_FILE"
fi
echo ""

if ! $DRY_RUN; then
  printf "${BOLD}Next steps:${NC}\n"
  echo ""
  echo "  1. Run /myna-setup for guided configuration"
  printf "     Type ${BOLD}/myna-setup${NC} inside a Claude Code session (not in the terminal)\n"
  echo "     Or edit config files directly:"
  echo "     \$EDITOR $CONFIG_DIR/workspace.yaml"
  echo ""
  echo "  2. Launch Myna:"
  printf "     ${BOLD}myna${NC}  (after reloading your shell)\n"
  printf "     ${BOLD}claude --agent myna${NC}  (immediately)\n"
  echo ""
  printf "  ${BOLD}Keep the cloned repo.${NC} It is needed for ${BOLD}myna update${NC} to work.\n"
  echo "  To update: myna-update  (or: cd $SCRIPT_DIR && git pull && ./install.sh --vault-path $VAULT_PATH)"
fi

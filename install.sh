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
VAULT_NAME=""
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
  --vault-name <name>     Obsidian vault name for URI links (optional)
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
    --vault-name)  VAULT_NAME="$2"; shift 2 ;;
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
  else
    mkdir -p "$dest_dir"
    cp "$skill_dir/SKILL.md" "$dest_dir/SKILL.md"
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
  "_meta/learnings"
  "_system/config"
  "_system/templates"
  "_system/dashboards"
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
      echo "  [dry-run] cp $example_src → $config_dest (starter)"
    fi
  else
    # Always refresh .example files
    cp "$example_src" "$example_dest"

    # Only create starter config if it doesn't exist (never overwrite user edits)
    if [ ! -f "$config_dest" ]; then
      cp "$example_src" "$config_dest"
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

# ── Install Manifest ──────────────────────────────────────────

step "Writing install metadata"

MYNA_HOME="$HOME/.myna"

if $DRY_RUN; then
  echo "  [dry-run] mkdir -p $MYNA_HOME"
  echo "  [dry-run] Write version file: $MYNA_HOME/version"
  echo "  [dry-run] Write manifest: $MYNA_HOME/install-manifest.json"
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
echo "  Vault:         $MYNA_ROOT/"
echo "  Config:        $MYNA_ROOT/_system/config/"
echo "  Templates:     $MYNA_ROOT/_system/templates/ ($template_count files)"
echo "  Manifest:      $MYNA_HOME/install-manifest.json"
echo ""

if ! $DRY_RUN; then
  printf "${BOLD}Next steps:${NC}\n"
  echo ""
  echo "  1. Edit your config files:"
  echo "     \$EDITOR $CONFIG_DIR/workspace.yaml"
  echo "     \$EDITOR $CONFIG_DIR/projects.yaml"
  echo "     \$EDITOR $CONFIG_DIR/people.yaml"
  echo ""
  echo "  2. (Optional) Register external MCP servers:"
  echo "     claude mcp add gmail-mcp -- <your-gmail-mcp-command>"
  echo "     claude mcp add slack-mcp -- <your-slack-mcp-command>"
  echo "     claude mcp add gcal-mcp -- <your-gcal-mcp-command>"
  echo ""
  echo "  3. Launch Myna:"
  printf "     ${BOLD}claude --agent myna${NC}\n"
  echo ""
  echo "  The cloned repo is no longer needed at runtime."
  echo "  To update: git pull && ./install.sh --vault-path $VAULT_PATH"
fi

#!/usr/bin/env bash
# kiro.sh — Myna install for Kiro
# Usage: kiro.sh <vault_path>
#
# Scaffolds the Myna vault, transforms and installs skills and agent file for
# Kiro's directory layout, and sets up the shell alias. Idempotent: safe to
# re-run. Kiro-owned files are always overwritten; user config files are
# preserved. Exits 0 on success, non-zero on failure.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$SCRIPT_DIR/../skills"
AGENTS_DIR="$SCRIPT_DIR/../agents"
SKILL_DIR="$SCRIPT_DIR/../skills/install"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

# ---------------------------------------------------------------------------
# Validate args
# ---------------------------------------------------------------------------

if [[ $# -ne 1 ]]; then
  echo "Usage: kiro.sh <vault_path>" >&2
  echo "  vault_path  Absolute path to your Obsidian vault directory (must already exist)" >&2
  exit 1
fi

VAULT_PATH="$1"
SUBFOLDER="myna"
MYNA_ROOT="$VAULT_PATH/$SUBFOLDER"

if [[ ! -d "$VAULT_PATH" ]]; then
  echo "Error: vault_path does not exist: $VAULT_PATH" >&2
  exit 1
fi

echo "Myna install for Kiro"
echo "  Vault:     $VAULT_PATH"
echo "  Subfolder: $SUBFOLDER"
echo "  Myna root: $MYNA_ROOT"
echo ""

# ---------------------------------------------------------------------------
# Vault setup (shared with claude.sh via lib.sh)
# ---------------------------------------------------------------------------

run_vault_setup "$VAULT_PATH" "$SUBFOLDER" "$SKILL_DIR"

echo ""

# ---------------------------------------------------------------------------
# K1: Transform and install feature skills + setup skill
#
# Source: skills/{name}/SKILL.md  (all except steering-*)
# Target: ~/.kiro/skills/myna-{name}/SKILL.md
#
# Frontmatter transform: keep name: and description: only, drop all others.
# Body: unchanged.
# Then apply /myna: → /myna- rewrite across the entire file.
# ---------------------------------------------------------------------------

mkdir -p "$HOME/.kiro/skills"

feature_count=0
setup_count=0

for skill_path in "$SKILLS_DIR"/*/SKILL.md; do
  [[ -f "$skill_path" ]] || continue
  skill_name=$(basename "$(dirname "$skill_path")")

  [[ "$skill_name" == steering-* ]] && continue

  target_dir="$HOME/.kiro/skills/myna-$skill_name"
  mkdir -p "$target_dir"

  awk '
    BEGIN { in_fm=0; fm_count=0 }
    /^---$/ {
      fm_count++
      if (fm_count == 1) { in_fm=1; print; next }
      if (fm_count == 2) { in_fm=0; print; next }
    }
    in_fm {
      if (/^name:/ || /^description:/) { print }
      next
    }
    { print }
  ' "$skill_path" | sed 's|/myna:|/myna-|g' > "$target_dir/SKILL.md"

  if [[ "$skill_name" == "setup" ]]; then
    setup_count=$((setup_count + 1))
  else
    feature_count=$((feature_count + 1))
  fi
done

echo "[K1/K3] Installed $feature_count feature skills + $setup_count setup skill to ~/.kiro/skills/"

# ---------------------------------------------------------------------------
# K2: Build and install agent file
#
# Source: agents/agent.md + bodies of all 6 steering skills (in order)
# Target: ~/.kiro/agents/agent.md
#
# Frontmatter transform:
#   - Keep name: and description:
#   - Drop skills: key and its entire list block
#   - Add tools: ["*"]
# Body: agent body, then each steering body appended (blank line between each).
# Then apply CLAUDE.md → AGENTS.md and /myna: → /myna- rewrites.
# ---------------------------------------------------------------------------

mkdir -p "$HOME/.kiro/agents"

AGENT_SRC="$AGENTS_DIR/agent.md"
TARGET_AGENT="$HOME/.kiro/agents/agent.md"

STEERING_ORDER=(
  steering-safety
  steering-conventions
  steering-output
  steering-system
  steering-memory
  steering-vault-ops
)

{
  # Agent file with transformed frontmatter
  awk '
    BEGIN { in_fm=0; fm_count=0; skip_list=0 }
    /^---$/ {
      fm_count++
      if (fm_count == 1) { in_fm=1; print; next }
      if (fm_count == 2) {
        in_fm=0
        print "tools: [\"*\"]"
        print
        next
      }
    }
    in_fm {
      if (/^skills:/) { skip_list=1; next }
      if (skip_list) {
        if (/^  - /) { next }
        skip_list=0
      }
      if (/^name:/ || /^description:/) { print }
      next
    }
    { print }
  ' "$AGENT_SRC"

  # Append each steering skill body with a blank line separator
  for steering in "${STEERING_ORDER[@]}"; do
    steering_file="$SKILLS_DIR/$steering/SKILL.md"
    if [[ -f "$steering_file" ]]; then
      echo ""
      awk '
        BEGIN { fm_count=0 }
        /^---$/ { fm_count++; next }
        fm_count >= 2 { print }
      ' "$steering_file"
    fi
  done
} | sed 's|/myna:|/myna-|g' | sed 's|CLAUDE\.md|AGENTS.md|g' > "$TARGET_AGENT"

echo "[K2/K3] Installed agent file with steering embedded → ~/.kiro/agents/agent.md"

# ---------------------------------------------------------------------------
# K3: Shell alias
#
# Appends:  alias myna="kiro --agent agent"   # myna-alias
# Idempotent: skips if # myna-alias marker already present.
# ---------------------------------------------------------------------------

if [[ "$SHELL" == */zsh ]]; then
  RC_FILE="$HOME/.zshrc"
else
  RC_FILE="$HOME/.bashrc"
fi

if grep -q '# myna-alias' "$RC_FILE" 2>/dev/null; then
  ALIAS_STATUS="already present"
else
  echo 'alias myna="kiro --agent agent"   # myna-alias' >> "$RC_FILE"
  ALIAS_STATUS="added"
fi

echo "[K3/K3] Shell alias $ALIAS_STATUS in $RC_FILE"

# ---------------------------------------------------------------------------
# Completion summary
# ---------------------------------------------------------------------------

echo ""
echo "Myna installed for Kiro"
echo "  Skills:   $feature_count feature + $setup_count setup (steering embedded in agent)"
echo "  Agent:    ~/.kiro/agents/agent.md"
echo "  Vault:    $VAULT_PATH/myna"
echo "  Alias:    $ALIAS_STATUS"
echo ""
echo "Next steps:"
echo "  1. Register your MCP servers (email, calendar, messaging) in Kiro via"
echo "     Kiro UI or by editing ~/.kiro/settings/mcp.json."
echo "  2. Open Kiro and run /myna-setup to configure identity, projects, people,"
echo "     and MCP server names."
echo "  3. Run /myna-sync to set up your first daily note."

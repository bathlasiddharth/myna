#!/usr/bin/env bash
# claude.sh — Myna vault scaffolding for Claude Code
# Usage: claude.sh <vault_path> <subfolder>
#
# Creates the full Myna vault structure and ~/.myna/ home in one shot.
# Idempotent: safe to re-run without destroying existing user data.
# Exits 0 on success, non-zero on failure.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SKILL_DIR="$SCRIPT_DIR/../skills/install"

# shellcheck source=lib.sh
source "$SCRIPT_DIR/lib.sh"

# ---------------------------------------------------------------------------
# Validate args
# ---------------------------------------------------------------------------

if [[ $# -ne 2 ]]; then
  echo "Usage: claude.sh <vault_path> <subfolder>" >&2
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
# Vault setup (shared with kiro.sh via lib.sh)
# ---------------------------------------------------------------------------

run_vault_setup "$VAULT_PATH" "$SUBFOLDER" "$SKILL_DIR"

# ---------------------------------------------------------------------------
# Completion summary
# ---------------------------------------------------------------------------

echo ""
echo "Install complete (11 steps)."
echo ""
echo "  Vault root:       $MYNA_ROOT/"
echo "  Config:           $MYNA_ROOT/_system/config/"
echo "  Templates:        $MYNA_ROOT/_system/templates/"
echo "  Dashboards:       $MYNA_ROOT/Dashboards/"
echo "  Config file:      ~/.myna/config.yaml"
echo "  Schema (skills):  ~/.claude/myna/file-formats/"
echo ""
echo "Run /myna:setup next to configure your identity, projects, people, and integrations."

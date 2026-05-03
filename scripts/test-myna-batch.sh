#!/usr/bin/env bash
#
# test-myna-batch.sh — run a batch of prompts against a Claude Code subagent
# and write a run log.
#
# Reads a markdown input file with '## <title>' headers, runs each prompt as
# a separate non-interactive `claude -p` call, and writes the outputs to a
# markdown file in the agreed run-log format.
#
# Assumes the target agent (e.g. 'myna', 'myna-test') is already installed
# via `claude mcp` / `~/.claude/agents/` and points at whatever vault you
# want to exercise. This script does not install, stage, or reset anything.
#
# Usage:
#   scripts/test-myna-batch.sh <agent-name> <input.md> <output.md>
#
# Environment:
#   MYNA_TEST_SKIP_PERMS    1 (default) = pass --dangerously-skip-permissions
#                           0           = omit the flag
#
# Exit codes:
#   0    all prompts exited 0
#   N    N prompts exited non-zero (capped at 255)
#   2    usage / setup error
#

set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: scripts/test-myna-batch.sh <agent-name> <input.txt> <output.md>

Runs each prompt in <input.txt> against the given Claude Code subagent
(via `claude --agent <name> -p`) and writes a run log to <output.md>.

Input format:
  Plain text. Prompts are separated by one or more blank lines. A prompt
  can span multiple lines, but NOT contain internal blank lines — a blank
  line always ends the current prompt. Leading/trailing blank lines in
  the file are ignored.

Example input:
  sync

  brief me on Sarah Carter

  process these emails:
  From: Sarah <sarah@acme.io>
  Subject: test
  body line 1
  body line 2

Environment:
  MYNA_TEST_SKIP_PERMS   1 (default) passes --dangerously-skip-permissions
                         to every claude call. Set to 0 to drop it.

Exit codes:
  0    all prompts returned exit 0
  N    N prompts returned non-zero (capped at 255)
  2    usage / setup error

Notes:
  - This script does not install the subagent. Assumes it's already set up.
  - The script does not reset the vault between prompts. Use `git checkout`
    on whatever vault path your agent writes to if you want a clean slate.
  - Vault changes are detected via `git status` and listed per prompt, but
    only for files under tests/fixtures/vault/ in the current git repo.
EOF
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -ne 3 ]]; then
  usage
  exit 2
fi

agent="$1"
input="$2"
output="$3"

[[ -f "$input" ]]       || { echo "error: input file not found: $input" >&2; exit 2; }
command -v claude >/dev/null 2>&1 || { echo "error: 'claude' CLI not in PATH" >&2; exit 2; }
command -v awk    >/dev/null 2>&1 || { echo "error: 'awk' not in PATH"    >&2; exit 2; }

mkdir -p "$(dirname "$output")"

perms_flag=""
if [[ "${MYNA_TEST_SKIP_PERMS:-1}" == "1" ]]; then
  perms_flag="--dangerously-skip-permissions"
fi

# ─── Parse input into per-prompt files (blank-line delimited) ────────────────
tmpdir="$(mktemp -d)"
trap 'rm -rf "$tmpdir"' EXIT

awk -v dir="$tmpdir" '
  BEGIN { n = 0; in_prompt = 0 }
  /^[[:space:]]*$/ {
    if (in_prompt) {
      close(body_file)
      in_prompt = 0
    }
    next
  }
  {
    if (!in_prompt) {
      n++
      body_file = sprintf("%s/prompt-%04d.body", dir, n)
      in_prompt = 1
    }
    print > body_file
  }
  END { if (in_prompt) close(body_file) }
' "$input"

count=0
for f in "$tmpdir"/prompt-*.body; do
  [[ -e "$f" ]] || break
  count=$((count + 1))
done

if [[ "$count" -eq 0 ]]; then
  echo "error: no prompts found in $input (expected plain text with blank-line separators)" >&2
  exit 2
fi

# ─── Vault snapshot helpers ──────────────────────────────────────────────────
repo_root="$(git rev-parse --show-toplevel 2>/dev/null || true)"
vault_rel="tests/fixtures/vault"

vault_status() {
  if [[ -n "$repo_root" && -d "$repo_root/$vault_rel" ]]; then
    ( cd "$repo_root" && git status --porcelain -- "$vault_rel" 2>/dev/null | sort )
  fi
}

# ─── Write run log header ────────────────────────────────────────────────────
started="$(date '+%Y-%m-%d %H:%M:%S')"
{
  echo "# Run: $(basename "$input" .md)"
  echo
  echo "**Agent:** \`$agent\`"
  echo "**Input:** \`$input\`"
  echo "**Started:** $started"
  echo "**Prompts:** $count"
  if [[ -n "$perms_flag" ]]; then
    echo "**Flags:** \`$perms_flag\`"
  fi
  echo
  echo "---"
  echo
} > "$output"

# ─── Run each prompt ─────────────────────────────────────────────────────────
failures=0
i=0

for body_file in "$tmpdir"/prompt-*.body; do
  i=$((i + 1))
  body="$(cat "$body_file")"

  # First line for progress display
  first_line="$(printf '%s' "$body" | awk 'NF > 0 { print substr($0, 1, 70); exit }')"
  [[ -z "$first_line" ]] && first_line="(empty)"

  printf '[%d/%d] %s\n' "$i" "$count" "$first_line" >&2

  # Vault snapshot before
  before="$(vault_status)"

  # Run claude via unbuffer (pseudo-TTY) so Claude Code doesn't suppress output.
  # Falls back to direct execution if unbuffer is not installed.
  out_file="$tmpdir/prompt-$(printf '%04d' $i).out"
  start_ts=$(date +%s)
  set +e
  if command -v unbuffer >/dev/null 2>&1; then
    unbuffer claude --agent "$agent" $perms_flag -p "$body" > "$out_file" 2>&1
  else
    claude --agent "$agent" $perms_flag -p "$body" > "$out_file" 2>&1
  fi
  exit_code=$?
  set -e
  end_ts=$(date +%s)
  duration=$((end_ts - start_ts))
  raw_output="$(cat "$out_file")"

  if [[ $exit_code -ne 0 ]]; then
    failures=$((failures + 1))
  fi

  # Vault snapshot after, list changed files
  after="$(vault_status)"
  changed_files=""
  if [[ "$before" != "$after" ]]; then
    changed_files="$(diff <(printf '%s\n' "$before") <(printf '%s\n' "$after") \
                      | awk '/^[<>] / { sub(/^[<>] +/, ""); if (NF >= 2) print $2 }' \
                      | sort -u)"
  fi

  printf '    done · exit %d · %ds\n' "$exit_code" "$duration" >&2

  # Append to run log (use 5-backtick fence to survive nested ``` in output)
  {
    echo "## Prompt $i"
    echo
    echo "**Prompt:**"
    echo
    echo '`````'
    printf '%s\n' "$body"
    echo '`````'
    echo
    echo "**Output:**"
    echo
    echo '`````'
    printf '%s\n' "$raw_output"
    echo '`````'
    echo
    echo "**Exit:** $exit_code · **Duration:** ${duration}s"
    if [[ -n "$changed_files" ]]; then
      echo
      echo "**Vault changes:**"
      printf '%s\n' "$changed_files" | awk '{ print "- `" $0 "`" }'
    fi
    echo
    echo "---"
    echo
  } >> "$output"
done

# ─── Summary footer ──────────────────────────────────────────────────────────
finished="$(date '+%Y-%m-%d %H:%M:%S')"
{
  echo "**Finished:** $finished"
  echo "**Succeeded:** $((count - failures))/$count"
  echo "**Failed:** $failures"
} >> "$output"

echo "" >&2
printf 'Run complete: %d/%d succeeded, %d failed\n' "$((count - failures))" "$count" "$failures" >&2
printf 'Output: %s\n' "$output" >&2

# Cap exit code at 255 (bash limit)
if [[ $failures -gt 255 ]]; then
  exit 255
fi
exit $failures

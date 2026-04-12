#!/usr/bin/env bash
# Myna Agent Artifact Lint — mechanical checks, fast and deterministic
# Checks deployed agent artifacts for self-containment, structure, and safety.
#
# Usage: bash scripts/lint-agents.sh
# Exit:  0 = pass, 1+ = number of errors found
#
# These artifacts deploy standalone via CLAUDE.md. They must not reference
# design docs (foundations.md, architecture.md, decisions.md), repo paths
# (docs/), or decision IDs (D001-D047) — those don't exist at runtime.

set -eo pipefail
cd "$(dirname "$0")/.."

errors=0
warnings=0

fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; errors=$((errors + 1)); }
warn() { printf '  \033[33mWARN\033[0m  %s\n' "$1"; warnings=$((warnings + 1)); }
pass() { printf '  \033[32mOK\033[0m    %s\n' "$1"; }
header() { printf '\n\033[1m── %s ──\033[0m\n' "$1"; }

# Collect artifact files (only files that ship to the user)
skill_files=(agents/skills/*.md)
steering_files=(agents/steering/*.md)
all_artifacts=("${skill_files[@]}" "${steering_files[@]}" agents/main.md)
[ -f agents/myna-agent-template.md ] && all_artifacts+=(agents/myna-agent-template.md)

printf '\033[1mMyna Agent Artifact Lint\033[0m\n'
echo "================================================"
echo "Checking ${#all_artifacts[@]} artifact files"

# ══════════════════════════════════════════════════════════════
# 1. SELF-CONTAINMENT
#    Agent artifacts deploy standalone. They must not reference
#    design docs, repo docs/ paths, or decision IDs.
#    Steering file cross-references (conventions.md, safety.md)
#    are fine — those are co-deployed.
# ══════════════════════════════════════════════════════════════
header "1. Self-containment"
c1=0

for f in "${all_artifacts[@]}"; do
  name=$(basename "$f")

  # References to design docs
  hits=$(grep -nE 'foundations\.md|architecture\.md|decisions\.md' "$f" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    while IFS= read -r line; do
      fail "$name: design doc reference — $line"
      c1=$((c1 + 1))
    done <<< "$hits"
  fi

  # References to docs/ repo paths
  hits=$(grep -n 'docs/' "$f" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    while IFS= read -r line; do
      fail "$name: docs/ path — $line"
      c1=$((c1 + 1))
    done <<< "$hits"
  fi

  # Decision IDs (D followed by 3 digits as whole word)
  hits=$(grep -nwE 'D[0-9]{3}' "$f" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    while IFS= read -r line; do
      fail "$name: decision ID — $line"
      c1=$((c1 + 1))
    done <<< "$hits"
  fi
done

[ "$c1" -eq 0 ] && pass "All artifacts self-contained"

# ══════════════════════════════════════════════════════════════
# 2. REQUIRED SKILL SECTIONS
#    Every skill must have: Purpose, Triggers, Inputs,
#    Procedure, Output, Rules (per autonomous-build-plan.md)
# ══════════════════════════════════════════════════════════════
header "2. Required skill sections"

required_sections=("Purpose" "Triggers" "Inputs" "Procedure" "Output" "Rules")

for f in "${skill_files[@]}"; do
  name=$(basename "$f")
  missing=()
  for section in "${required_sections[@]}"; do
    grep -q "^## ${section}" "$f" || missing+=("$section")
  done
  if [ ${#missing[@]} -eq 0 ]; then
    pass "$name"
  else
    fail "$name: missing — ${missing[*]}"
  fi
done

# ══════════════════════════════════════════════════════════════
# 3. WORKED EXAMPLES
#    Every skill must have at least one worked example showing
#    input → read → decide → write → output.
# ══════════════════════════════════════════════════════════════
header "3. Worked examples"

for f in "${skill_files[@]}"; do
  name=$(basename "$f")
  if grep -qE '^##+ .*(Example|Worked)' "$f"; then
    pass "$name"
  else
    fail "$name: no worked example section"
  fi
done

# ══════════════════════════════════════════════════════════════
# 4. SKILL DIRECTORY CROSS-REFERENCE
#    Every skill in main.md's table has a file.
#    Every skill file is listed in main.md.
# ══════════════════════════════════════════════════════════════
header "4. Skill directory cross-reference"

# Extract skill names from main.md table (| N | name | desc |)
main_skills=()
while IFS= read -r skill; do
  skill=$(echo "$skill" | xargs)
  [ -n "$skill" ] && main_skills+=("$skill")
done < <(awk -F'|' '/^\| [0-9]/ { gsub(/^ +| +$/, "", $3); print $3 }' agents/main.md 2>/dev/null)

# Forward: main.md → file exists
for skill in "${main_skills[@]}"; do
  if [ -f "agents/skills/${skill}.md" ]; then
    pass "$skill"
  else
    fail "main.md lists '$skill' but agents/skills/${skill}.md missing"
  fi
done

# Reverse: file → listed in main.md
for f in "${skill_files[@]}"; do
  name=$(basename "$f" .md)
  found=false
  for skill in "${main_skills[@]}"; do
    [ "$skill" = "$name" ] && found=true && break
  done
  $found || warn "agents/skills/${name}.md not listed in main.md"
done

# ══════════════════════════════════════════════════════════════
# 5. STEERING FILE EXISTENCE
#    All 4 required steering files must be present.
# ══════════════════════════════════════════════════════════════
header "5. Steering files"

for name in safety conventions output system; do
  if [ -f "agents/steering/${name}.md" ]; then
    pass "${name}.md"
  else
    fail "${name}.md missing"
  fi
done

# ══════════════════════════════════════════════════════════════
# 6. SAFETY KEYWORD AUDIT
#    Flag "send"/"post"/"deliver" that aren't in a clear
#    refusal or safety context. Warnings only — manual review.
# ══════════════════════════════════════════════════════════════
header "6. Safety keywords"
c6=0

for f in "${all_artifacts[@]}"; do
  name=$(basename "$f")
  hits=$(grep -niE '\b(sends?|sending|posts?|posting|delivers?|delivering)\b' "$f" 2>/dev/null || true)
  if [ -n "$hits" ]; then
    while IFS= read -r line; do
      # Skip lines clearly in refusal/safety context
      if echo "$line" | grep -qiE 'never|don.t|do not|must not|cannot|draft.*(only|never)|refus|manual'; then
        continue
      fi
      warn "$name: $line"
      c6=$((c6 + 1))
    done <<< "$hits"
  fi
done

[ "$c6" -eq 0 ] && pass "No send/post/deliver outside safety context"

# ══════════════════════════════════════════════════════════════
# 7. MCP TOOL EXISTENCE
#    Verify the MCP server entry point compiles (if node available)
# ══════════════════════════════════════════════════════════════
header "7. MCP server"

if [ -f agents/mcp/myna-obsidian/src/index.ts ]; then
  pass "Source exists: agents/mcp/myna-obsidian/src/index.ts"
else
  fail "MCP server source missing: agents/mcp/myna-obsidian/src/index.ts"
fi

if [ -f agents/mcp/myna-obsidian/package.json ]; then
  pass "package.json exists"
else
  fail "package.json missing"
fi

# ══════════════════════════════════════════════════════════════
# 8. CONFIG EXAMPLES
#    All 6 config .example files must exist.
# ══════════════════════════════════════════════════════════════
header "8. Config examples"

for name in workspace projects people meetings communication-style tags; do
  if [ -f "agents/config-examples/${name}.yaml.example" ]; then
    pass "${name}.yaml.example"
  else
    fail "${name}.yaml.example missing"
  fi
done

# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════
echo ""
echo "================================================"
printf 'Results: \033[31m%d errors\033[0m, \033[33m%d warnings\033[0m\n' "$errors" "$warnings"

if [ "$errors" -eq 0 ]; then
  printf 'Status: \033[32mPASS\033[0m\n'
else
  printf 'Status: \033[31mFAIL\033[0m — fix errors above\n'
fi

exit "$errors"

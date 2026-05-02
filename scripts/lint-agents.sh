#!/usr/bin/env bash
# Myna Agent Artifact Lint — mechanical checks, fast and deterministic
# Checks deployed agent artifacts for self-containment, structure, and safety.
#
# Usage: bash scripts/lint-agents.sh
# Exit:  0 = pass, 1+ = number of errors found
#
# These artifacts deploy standalone via install.sh. They must not reference
# design docs (foundations.md, architecture.md, product-decisions.md, architecture-decisions.md), repo paths
# (docs/), or decision IDs (D001-D050) — those don't exist at runtime.

set -eo pipefail
cd "$(dirname "$0")/.."

errors=0
warnings=0

fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; errors=$((errors + 1)); }
warn() { printf '  \033[33mWARN\033[0m  %s\n' "$1"; warnings=$((warnings + 1)); }
pass() { printf '  \033[32mOK\033[0m    %s\n' "$1"; }
header() { printf '\n\033[1m── %s ──\033[0m\n' "$1"; }

# Collect artifact files (only files that ship to the user)
# Skills are now in agents/skills/myna-*/SKILL.md (directory-per-skill)
feature_files=()
steering_files=()
for dir in agents/skills/myna-*/; do
  [ -d "$dir" ] || continue
  skill_file="$dir/SKILL.md"
  [ -f "$skill_file" ] || continue
  name="$(basename "$dir")"
  if [[ "$name" == myna-steering-* ]]; then
    steering_files+=("$skill_file")
  else
    feature_files+=("$skill_file")
  fi
done

all_artifacts=("${feature_files[@]}" "${steering_files[@]}" agents/main.md)
[ -f agents/myna-agent-template.md ] && all_artifacts+=(agents/myna-agent-template.md)

printf '\033[1mMyna Agent Artifact Lint\033[0m\n'
echo "================================================"
echo "Checking ${#all_artifacts[@]} artifact files (${#feature_files[@]} feature skills, ${#steering_files[@]} steering skills, 1 main agent)"

# ══════════════════════════════════════════════════════════════
# 1. SELF-CONTAINMENT
#    Agent artifacts deploy standalone. They must not reference
#    design docs, repo docs/ paths, or decision IDs.
# ══════════════════════════════════════════════════════════════
header "1. Self-containment"
c1=0

for f in "${all_artifacts[@]}"; do
  name=$(basename "$(dirname "$f")")/$(basename "$f")
  # Simplify name for main.md and template
  [[ "$f" == agents/main.md ]] && name="main.md"
  [[ "$f" == agents/myna-agent-template.md ]] && name="myna-agent-template.md"

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
# 2. SKILL STRUCTURE
#    Every feature skill must have: YAML frontmatter (checked
#    in §7), at least 3 H2 sections, and 50+ lines of content.
#    Section names are free-form — skills choose their own
#    structure. H1 heading is optional.
# ══════════════════════════════════════════════════════════════
header "2. Skill structure"

for f in "${feature_files[@]}"; do
  name="$(basename "$(dirname "$f")")"
  issues=()

  # At least 3 H2 sections (minimal structure)
  h2_count=$(grep -c '^## ' "$f" 2>/dev/null) || h2_count=0
  [ "$h2_count" -lt 3 ] && issues+=("only ${h2_count} H2 sections (need ≥3)")

  # Minimum 50 lines of content (frontmatter + body)
  line_count=$(wc -l < "$f" | tr -d ' ')
  [ "$line_count" -lt 50 ] && issues+=("only ${line_count} lines (need ≥50)")

  if [ ${#issues[@]} -eq 0 ]; then
    pass "$name"
  else
    fail "$name: ${issues[*]}"
  fi
done

# ══════════════════════════════════════════════════════════════
# 3. WORKED EXAMPLES
#    Every feature skill must have at least one worked example
#    — either as a dedicated section heading or inline content.
# ══════════════════════════════════════════════════════════════
header "3. Worked examples"

for f in "${feature_files[@]}"; do
  name="$(basename "$(dirname "$f")")"
  # Check for Example/Worked heading OR inline example patterns
  if grep -qE '^##+ .*(Example|Worked)' "$f"; then
    pass "$name"
  elif grep -qE '(User says|User:|Example:|→)' "$f"; then
    pass "$name"
  else
    fail "$name: no worked example section or inline examples"
  fi
done

# ══════════════════════════════════════════════════════════════
# 4. SKILL DIRECTORY CROSS-REFERENCE
#    Every feature skill in main.md's table has a directory.
#    Every feature skill directory is listed in main.md.
# ══════════════════════════════════════════════════════════════
header "4. Skill directory cross-reference"

# Extract skill names from main.md table (| N | name | desc |)
main_skills=()
while IFS= read -r skill; do
  skill=$(echo "$skill" | xargs)
  [ -n "$skill" ] && main_skills+=("$skill")
done < <(awk -F'|' '/^\| [0-9]/ { gsub(/^ +| +$/, "", $3); print $3 }' agents/main.md 2>/dev/null)

# Forward: main.md → directory exists
for skill in "${main_skills[@]}"; do
  if [ -f "agents/skills/${skill}/SKILL.md" ]; then
    pass "$skill"
  else
    fail "main.md lists '$skill' but agents/skills/${skill}/SKILL.md missing"
  fi
done

# Reverse: directory → listed in main.md
for f in "${feature_files[@]}"; do
  name="$(basename "$(dirname "$f")")"
  found=false
  for skill in "${main_skills[@]}"; do
    [ "$skill" = "$name" ] && found=true && break
  done
  $found || warn "agents/skills/${name}/SKILL.md not listed in main.md"
done

# ══════════════════════════════════════════════════════════════
# 5. STEERING SKILLS
#    All 6 required steering skills must be present.
# ══════════════════════════════════════════════════════════════
header "5. Steering skills"

for name in safety conventions output system memory vault-ops; do
  if [ -f "agents/skills/myna-steering-${name}/SKILL.md" ]; then
    pass "myna-steering-${name}"
  else
    fail "myna-steering-${name}/SKILL.md missing"
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
  name=$(basename "$(dirname "$f")")/$(basename "$f")
  [[ "$f" == agents/main.md ]] && name="main.md"
  [[ "$f" == agents/myna-agent-template.md ]] && name="myna-agent-template.md"

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
# 7. SKILL FRONTMATTER
#    Every SKILL.md must have name and description in frontmatter.
# ══════════════════════════════════════════════════════════════
header "7. Skill frontmatter"

for f in "${feature_files[@]}" "${steering_files[@]}"; do
  name="$(basename "$(dirname "$f")")"
  if head -5 "$f" | grep -q '^---'; then
    if grep -q '^name:' "$f" && grep -q '^description:' "$f"; then
      pass "$name"
    else
      fail "$name: missing name or description in frontmatter"
    fi
  else
    fail "$name: no YAML frontmatter"
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

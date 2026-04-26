---
name: myna-dev-consistency
description: |
  QA pass for format consistency across Myna skills — finds skills writing to the same vault destination with diverging formats. Reads canonical formats from foundations.md and conventions steering skill, compares each writing skill's actual format. Report only — does not fix. Use when: "check consistency", "format audit", "are skills consistent?".
argument-hint: "[destination names, skill paths, --uncommitted, or blank for all]"
user-invocable: true
effort: max
---

# Myna Dev Consistency

QA pass for format consistency across the Myna vault. Finds the #1 source of real bugs: multiple skills writing to the same vault destination with diverging formats. Reads canonical formats from foundations.md and the conventions steering skill, then reads each writing skill's actual format instructions and compares them. Reports exact divergences — which skill is wrong and what the correct format is.

Report only — does NOT modify skill files.

## Arguments

$ARGUMENTS

Parse for:
- No arguments: check all shared destinations
- Destination name(s): e.g., `timeline`, `contributions`, `review-queue`
- Skill path(s): check named skills against canonical formats
- `--uncommitted`: only skills with uncommitted changes

## Process

### Step 1: Read Canonical Sources
- `docs/design/foundations.md` — canonical entry formats for all shared destinations
- `agents/skills/myna-steering-conventions/SKILL.md` — authoritative entry format patterns
- `agents/skills/myna-steering-vault-ops/SKILL.md` — vault path patterns

### Step 2: Identify Writing Skills Per Destination
Use the authoritative map from `docs/design/architecture.md`:
- Project timeline entries → myna-capture, myna-process-messages, myna-process-meeting
- Person observations → myna-capture, myna-process-messages, myna-process-meeting
- Person recognition → same
- Contributions log → myna-capture, myna-process-messages, myna-process-meeting, myna-wrap-up, myna-self-track
- Task entries → myna-capture, myna-process-messages, myna-process-meeting
- Review queue entries → myna-capture, myna-process-messages, myna-process-meeting, myna-email-triage, myna-wrap-up
- Daily note sections → myna-sync, myna-wrap-up

### Step 3: Read Each Writing Skill
Extract the exact format string each skill writes to each destination. Quote verbatim with line numbers.

### Step 4: Compare
For each destination, compare every writing skill's format against canonical. Flag divergences with severity.

### Step 5: Report
Save to `tmp/reviews/consistency-{NNN}.md`.

## Severity
- **Critical:** entries from two skills would be unreadable to the other or break queries
- **Important:** format drift causing visual inconsistency or unreliable queries
- **Minor:** small wording/punctuation differences
- **Nitpick:** cosmetic only

## Rules
- Never modify skill files. Read and report only.
- Quote formats verbatim from both canonical and skill — do not paraphrase.
- Cite line numbers for every quoted format.
- If a skill's format matches canonical, say CONSISTENT — do not manufacture findings.
- Intentional documented differences are Nitpick, not bugs.

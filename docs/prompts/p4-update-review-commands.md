# P4: Rewrite Review Commands for Native Claude Code Skills

## Setup

**Model:** Opus | **Effort:** High
**Subagents:** Sonnet (set `model: "sonnet"` when spawning)

## Context

Myna has 8 review/lint commands (`.claude/commands/myna-*.md`), a lint script (`scripts/lint-agents.sh`), and a commands architecture doc (`docs/design/commands-architecture.md`). These form a self-improvement loop: review → fix → verify, with lint as a fast mechanical pre-check.

Two of these have already been updated:
- **`scripts/lint-agents.sh`** — P3 already rewrote this for native skill paths, 6 steering skills, removed MCP checks.
- **`.claude/commands/myna-skills-polish.md`** — Already rewritten (commit `2c35352`).

The remaining 6 commands and the architecture doc were written for the old architecture (flat skill files, MCP server, mandated sections) and have been deleted. **Write each from scratch** based on the current architecture and what each command should do well.

## Read first

1. `docs/architecture.md` — sections 1-2. Current architecture: 24 feature skills + 6 steering skills as `agents/skills/myna-*/SKILL.md` directories.
2. `CLAUDE.md` — project conventions
3. `docs/design/foundations.md` — vault structure, canonical formats
4. Read 2-3 actual SKILL.md files (e.g., `agents/skills/myna-sync/SKILL.md`, `agents/skills/myna-capture/SKILL.md`) to see what native Claude Code skills look like in practice.
5. Read the "What each command should do well" section below — this is the spec for each file.

## Current architecture (for subagent prompts)

Paste this into every subagent prompt so they have the full picture.

| Aspect | How it works now |
|--------|-----------------|
| Feature skills | 24 skills in `agents/skills/myna-{name}/SKILL.md` directories |
| Steering skills | 6 skills in `agents/skills/myna-steering-{name}/SKILL.md` (safety, conventions, output, system, memory, vault-ops) |
| Skill format | YAML frontmatter (`name`, `description`, `user-invocable`, `argument-hint`, etc.) + free-form markdown body. No mandated section names — each skill chooses its own structure. |
| Vault operations | Claude Code built-in tools (Read, Write, Edit, Grep, Glob) guided by `myna-steering-vault-ops`. **No MCP server.** |
| External tools | Email, Slack, calendar via user's own MCP servers (not shipped by Myna) |
| Main agent | `agents/main.md` (exists — written in P3) |
| Install script | `install.sh` (exists — written in P3) |
| Agent template | `agents/myna-agent-template.md` (exists — written in P3) |
| Config | `agents/config-examples/*.yaml.example` (6 files, unchanged) |
| Skill names | All prefixed: `myna-sync`, `myna-process-messages`, `myna-capture`, `myna-email-triage`, etc. Full list in `docs/architecture.md` §2 |

## Common patterns across all commands

These apply to every command. Include them in the subagent prompt so they don't need to invent these from scratch.

- **Targeting via `$ARGUMENTS`:** All commands accept scope arguments — specific file paths, directory paths, glob patterns, `--uncommitted` (only files with uncommitted changes), or no arguments (default scope). Default scope for most commands: `agents/skills/myna-*/SKILL.md` (feature skills) + `agents/skills/myna-steering-*/SKILL.md` (steering skills) + `agents/main.md` + `agents/config-examples/*.yaml.example`.
- **Reports saved to `docs/reviews/`:** Each command type uses its own numbered filename: `review-{NNN}.md`, `fix-{NNN}.md`, `verify-{NNN}.md`, `coverage-{NNN}.md`, `consistency-{NNN}.md`. Cycle numbers are shared across review/fix/verify triads.
- **Severity levels:** Critical (breaks functionality, safety violation, data corruption), Important (degrades quality, missing features, vague instructions), Minor (polish, Golden Rule violation, slight inconsistency), Nitpick (style preference).
- **Issue IDs:** Severity-prefixed: `[C01]`, `[I01]`, `[M01]`, `[N01]`.
- **Setup context:** Each command reads project docs before acting — architecture, foundations, feature specs, steering skills, decisions. The specific subset varies per command.

## Files to write from scratch

### 1. `.claude/commands/myna-review.md`

**Role:** Principal Software Developer — deep technical review of LLM instruction quality.

**What it should do:** The core quality gate. Reviews skills and produces a structured report. Evaluates against dimensions that matter for native Claude Code skills: Does the description enable correct auto-discovery? Is the frontmatter well-formed (valid YAML, correct fields, description under 250 chars)? Would Claude execute every instruction unambiguously? Are features from the spec fully covered? Are shared vault formats consistent with foundations.md? Are safety rules enforced (draft-never-send, vault-only writes, no skill chaining)? Does the output actually help a tech professional?

**How it works:**
1. Reads project context (architecture, foundations, feature specs, steering skills, decisions)
2. Checks `docs/reviews/` for previous cycles — does NOT re-raise issues a previous fix report pushed back on with documented reasoning
3. Evaluates each file in scope against all review dimensions
4. For each issue: quotes the specific problem text, rates severity, provides 2-3 fix options with rationale, recommends one
5. Saves report to `docs/reviews/review-{NNN}.md` with severity counts and convergence signal (CONVERGED when 0 Critical + 0 Important)

**Report structure:** Header (scope, files reviewed), summary table (severity counts, convergence status), issues grouped by severity (each with file, dimension, problem with quoted text, impact, options, recommendation), passed checks section.

### 2. `.claude/commands/myna-coverage.md`

**Role:** Product Manager — ensures every shipped feature actually works, nothing was dropped.

**What it should do:** Focused audit: does every feature from `docs/features/*.md` have executable instructions in its owning skill? Not "mentioned" — actually covered with steps Claude would follow.

**How it works:**
1. Reads architecture.md for the feature-to-skill mapping ("Features covered:" line per skill)
2. Reads all 10 feature spec files — notes every sub-feature, detail, decision criterion, edge case
3. For each feature assigned to a skill in scope: checks the skill body for executable steps covering each sub-feature
4. Grades: FULL (all sub-features have executable steps), PARTIAL (some covered, lists what's missing), NONE (listed in architecture but no steps in skill)
5. Saves report to `docs/reviews/coverage-{NNN}.md`

**Report structure:** Header, summary (total/FULL/PARTIAL/NONE counts, coverage percentage), coverage matrix table (Feature | Owning Skill | Grade | Notes), gap details for PARTIAL/NONE entries (what spec says, what skill covers, what's missing, suggested fix).

### 3. `.claude/commands/myna-consistency.md`

**Role:** QA Engineer — finds formatting drift and data integrity issues across the system.

**What it should do:** Catch the #1 source of real bugs: two skills writing to the same vault location with different formatting. Multiple skills write to project timelines, person observations, contributions log, task TODOs, review queue entries, daily notes, etc. If their formats diverge, the vault becomes inconsistent.

**How it works:**
1. Reads foundations.md for canonical entry formats (the source of truth for formatting)
2. Reads steering-conventions skill for format definitions
3. Reads architecture.md to identify which skills write to which destinations
4. **Reads the actual SKILL.md files** to extract the exact format each produces — don't assume, read
5. For each shared destination: compares every writing skill's format against the canonical format
6. Saves report to `docs/reviews/consistency-{NNN}.md`

**Report structure:** Header, summary (destinations checked, consistent/inconsistent counts), per-destination results (canonical format, each skill's format quoted, verdict CONSISTENT/INCONSISTENT, what diverges and which skill is correct).

### 4. `.claude/commands/myna-verify.md`

**Role:** QA Lead — verifies fixes are real, not superficial, and didn't break anything else.

**What it should do:** Close the review-fix-verify loop. Reads a fix report, checks the actual files to confirm fixes resolved the original issues without introducing regressions.

**How it works:**
1. Finds the fix report to verify (latest `fix-{NNN}.md` or specific cycle number via argument)
2. Finds the corresponding review report
3. For each issue marked "Implemented": reads the actual file NOW, judges if the concern is addressed (Resolved/Not Resolved)
4. For each issue marked "No change" (pushed back): evaluates whether the pushback reasoning is sound (Accepted/Rejected)
5. Regression check: reads all modified files, checks cross-skill consistency on shared destinations, safety check (no accidental send/post/write-outside-vault paths)
6. Saves report to `docs/reviews/verify-{NNN}.md`

**Report structure:** Header (references to review and fix reports), per-issue verification (verdict + evidence), regressions section, overall verdict (CLEAN = no unresolved issues or regressions, NOT CLEAN = list what's still wrong).

### 5. `.claude/commands/myna-improve.md`

**Role:** Engineering Manager — orchestrates the full quality pipeline, monitors progress, knows when to stop.

**What it should do:** Run the full improvement pipeline autonomously. Long-running command — every phase gets full attention.

**How it works:**
1. Phase 0 — Lint: runs `bash scripts/lint-agents.sh`, fixes any errors, re-runs until clean
2. Phase 1-N — Review/Fix/Verify cycles (default max 3):
   - Review: full evaluation per myna-review methodology
   - Fix: implement all recommended fixes per myna-fix methodology (auto mode)
   - Verify: confirm fixes resolved issues per myna-verify methodology
   - Early exit: if review finds 0 Critical + 0 Important, stop
3. Oscillation guard: if cycle N finds ≥ blocking issues (Critical + Important) as cycle N-1, stop immediately
4. Pacing rules: never skim a file, never skip a dimension, never rush later phases. Quality over speed.
5. Single commit at the end with all changes
6. Final summary: cycles completed, stop reason, issues by severity (found/fixed/remaining), files modified, reports generated

**Arguments:** `--cycles N` (max cycles, default 3), plus standard targeting.

### 6. `.claude/commands/myna-fix.md`

**Role:** Senior Software Developer — thoughtful implementer who understands context before editing, pushes back when fixes would make things worse.

**What it should do:** Read the latest review report and implement fixes.

**How it works:**
1. Finds latest review report in `docs/reviews/`
2. Reads project context (architecture, foundations, steering skills, decisions)
3. Reads all files referenced in the review's issues
4. Processes each issue (Critical first → Nitpick last):
   - **Default mode:** For each issue, either implement the fix OR push back with documented reasoning ("No change — [specific reasoning]"). Pushback must be specific, not "it's fine."
   - **`--auto` mode:** Implement all recommendations, no pushback
   - **Selective mode** (issue IDs as args, e.g., `C01 I03`): only fix listed issues, skip others
5. Self-verification: after all fixes, re-reads modified files for internal consistency and cross-skill format consistency
6. Saves fix report to `docs/reviews/fix-{NNN}.md` (same cycle number as the review)
7. Single atomic commit: `fix(agents): address review cycle {NNN} — {n} issues fixed`

**Report structure:** Header (mode, reference to review), per-issue actions (Implemented Option N / No change with reasoning / Skipped), summary (fixed/pushed-back/skipped counts, files modified).

### 7. `docs/design/commands-architecture.md`

**Role:** Technical Writer — clear, accurate documentation of how the command system works.

**What it should do:** Architecture doc for the commands themselves. Describes how the 8 commands relate, how they form a pipeline, how targeting works, how reports are stored and numbered, how oscillation prevention works, evaluation dimensions overview, mode flags.

**Write this last** — have its subagent read the 6 freshly-written commands plus the already-updated `scripts/lint-agents.sh` and `.claude/commands/myna-skills-polish.md` so it accurately reflects the full set.

## How to execute

Spawn one subagent per file (7 subagents in parallel, except #7 which should run after the others complete). **Set `model: "sonnet"` on every subagent.** Each subagent **writes its file from scratch** — based on the purpose description and key mechanisms listed for each.

Every subagent prompt should include:
- The "Current architecture" table above
- The "What it should do" description for that specific file
- Instructions to read the old version for good ideas, then write fresh

### Context each subagent should read

Each command reviews different things, so each needs different context to make good judgment calls.

**All subagents read:**
- `docs/architecture.md` sections 1-2 (skill inventory, structure)
- 2-3 actual SKILL.md files to see what native skills look like in practice
- Claude Code docs on skills and agents: `https://docs.anthropic.com/en/docs/claude-code/skills` and `https://docs.anthropic.com/en/docs/claude-code/agents` — best practices for SKILL.md format, frontmatter fields, description quality, auto-discovery mechanics. These commands review skills — the subagent must understand what "good" looks like.
- The already-updated `scripts/lint-agents.sh` and `.claude/commands/myna-skills-polish.md` — for consistency with existing commands

**Additional context per subagent:**

| File being written | Also read | Why |
|---|---|---|
| `myna-review.md` | All 6 steering SKILL.md files, `docs/features/*.md` (skim 2-3), `docs/design/foundations.md` | Needs to understand what good skills look like and what evaluation dimensions should reference |
| `myna-coverage.md` | `docs/features/*.md` (all 10), `docs/design/foundations.md` | Needs to understand feature-to-skill mapping |
| `myna-consistency.md` | `docs/design/foundations.md`, all steering SKILL.md files, the actual SKILL.md files that write to shared vault destinations | Must build correct destination-to-skill mappings from the actual skills |
| `myna-verify.md` | `docs/design/foundations.md` | Verifies fixes against canonical formats |
| `myna-improve.md` | All 6 steering SKILL.md files, `docs/design/foundations.md`, `scripts/lint-agents.sh` (already updated) | Orchestrates everything — needs full picture including the lint script it calls |
| `myna-fix.md` | All 6 steering SKILL.md files | References steering for ground truth |
| `commands-architecture.md` | The 6 freshly-written commands + `scripts/lint-agents.sh` + `.claude/commands/myna-skills-polish.md` (both already updated) | Must accurately reflect all 8 commands |

## Review (after all subagents complete)

### 1. Stale reference sweep
```bash
grep -rn 'agents/skills/[a-z].*\.md' .claude/commands/ docs/design/commands-architecture.md  # old flat paths (should be 0)
grep -rn 'agents/steering/' .claude/commands/ docs/design/commands-architecture.md  # old steering dir (should be 0)
grep -rn '4 steering' .claude/commands/ docs/design/commands-architecture.md  # old count (should be 0)
grep -rn '14 skill' .claude/commands/ docs/design/commands-architecture.md  # old count (should be 0)
grep -rn 'myna-obsidian\|MCP server\|package\.json' .claude/commands/  # MCP refs (should be 0)
```

### 2. Lint script smoke test
```bash
bash scripts/lint-agents.sh
```
Must run without bash errors. Findings are expected — crashes are not.

### 3. Skill name verification
```bash
ls agents/skills/ | sort
```
Every skill name referenced in the commands should match an actual directory here.

### 4. Cross-command consistency
Read all 8 commands + architecture doc. Check that:
- Targeting syntax described in one command matches what others expect
- Report file naming conventions are consistent
- Cycle numbering works across review → fix → verify triads
- The architecture doc accurately reflects all 8 commands
- The already-updated lint script and skills-polish are consistent with the freshly-written commands

### 5. Fix any issues found in steps 1-4.

## Git

```bash
git add .claude/commands/ docs/design/commands-architecture.md
git commit -m "feat(commands): rewrite review commands for native Claude Code skills

6 review commands and the commands architecture doc rewritten from
scratch for the native skills architecture: agents/skills/myna-*/SKILL.md
with 24 feature skills and 6 steering skills. lint-agents.sh and
myna-skills-polish were already updated separately."
```

After commit: `git push origin main`

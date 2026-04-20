# Customization Layer — Skill Overrides, User Skills, and Custom Routing

You are implementing a customization layer for Myna so users can modify existing skills, add new skills, and define custom routing rules — all without losing their changes when they update to a new version.

**You are a coordinator.** Delegate each task below to a subagent, review the output, and fix issues before moving on. Do NOT attempt all tasks yourself in one pass — that causes quality to degrade on later tasks.

## Context

Myna is a Claude Code agent with 24 feature skills and 6 steering skills. Skills are native Claude Code skills — SKILL.md files in `~/.claude/skills/myna-*/`. The agent file lives at `~/.claude/agents/myna.md`. The install script (`install.sh`) copies skills from the repo to `~/.claude/skills/` and generates the agent file.

**Critical context management detail:** The agent file body is part of the system prompt and survives context compaction — it's always in context no matter how long the session runs. Preloaded skills (the `skills:` frontmatter list) are loaded into conversation message history and get dropped after compaction. This means routing rules MUST live in the agent file body, not in a steering skill.

**The problem:** Users who customize skills or add new ones lose their changes when they run the install script to update. We need a clean separation between upstream (updatable) and user (preserved).

## Design Decisions (already settled — do not re-debate)

The customization model has three mechanisms:

1. **`CUSTOM.md`** (per skill) — placed alongside `SKILL.md` in any `~/.claude/skills/myna-*/` directory. Lets users add overrides, extra steps, or behavioral tweaks to an existing upstream skill. Claude Code loads both files for the skill; CUSTOM.md content takes precedence over SKILL.md when they conflict.

2. **`custom-routing.md`** (single file at `~/.myna/custom-routing.md`) — routing and disambiguation rules for user-added skills. The agent file tells Myna to read this file if it exists and apply its routing rules. These rules take precedence over the built-in routing table. Lives in `~/.myna/` (Myna's home directory, already created by install for metadata) rather than `~/.claude/skills/` to keep the shared skills directory clean.

3. **User skill directories** — any skill folder in `~/.claude/skills/` that is NOT prefixed with `myna-` (e.g., `my-oncall/SKILL.md`, `amazon-standup/SKILL.md`). Claude Code discovers these natively from their SKILL.md frontmatter. The install script never touches them.

### Update behavior

- `SKILL.md` in `myna-*/` directories: **always overwritten** on install/update
- `CUSTOM.md` in `myna-*/` directories: **never overwritten** — if the file exists, skip it
- `custom-routing.md`: **never overwritten** — if the file exists, skip it
- Non-`myna-*` skill directories: **never touched**

### Precedence rule

When custom rules conflict with upstream defaults:
- `CUSTOM.md` overrides its skill's `SKILL.md`
- `custom-routing.md` overrides the built-in routing table in the agent file

---

## How to execute

Follow this process:

1. **Read context first.** Before spawning any subagent, read these files yourself to understand the current state:
   - `CLAUDE.md`
   - `agents/main.md`
   - `install.sh`
   - `docs/architecture.md`
   - `README.md`
   - `docs/post-install-checklist.md`
   - `docs/decisions.md`

2. **Execute tasks via subagents.** For each task below, spawn a subagent with a focused prompt that includes the design context it needs. The subagent does the work. Then you review the output.

3. **Review each task's output yourself before moving on.** Read the changed files. Check against the review criteria listed with each task. If you find real issues, fix them directly — don't spawn another subagent for small fixes.

4. **Sequential, not parallel for tasks that touch the same file.** Tasks 1 and 2 touch different files and can run in parallel. Tasks 3-6 touch different files and can run in parallel. But review must happen before moving to the next phase.

### Execution order

```
Phase 1 (parallel):  Task 1 (main.md) + Task 2 (install.sh)
Review Phase 1:      Read and review both files
Phase 2 (parallel):  Task 3 (architecture.md) + Task 4 (README.md) + Task 5 (post-install-checklist.md) + Task 6 (decisions.md)
Review Phase 2:      Read and review all four files
Final:               Quality checks
```

---

## Task 1: Expand routing in `agents/main.md`

### What to tell the subagent

The subagent needs to:

1. Read `agents/main.md` to understand the current structure.
2. Read ALL 24 feature skill files in `agents/skills/myna-*/SKILL.md` (excluding `myna-steering-*`) to understand what each skill does.
3. **Keep the `## Skill Directory` table** as-is.
4. **Expand the `## Routing Logic` section** to cover all 24 skills. Currently only ~13 skills have routing guidance. The remaining 11 need to be added:
   - myna-brief-person, myna-brief-project, myna-team-health, myna-unreplied-threads, myna-blockers, myna-1on1-analysis, myna-performance-narrative, myna-self-track, myna-park, myna-capture, myna-process-review-queue

5. After the routing section (before `## Direct Operations`), add:
   - A custom routing reference: instruction to read `~/.myna/custom-routing.md` if it exists. Use the literal path — NOT `{{VAULT_PATH}}` placeholders (this file is outside the vault). Rules in that file take precedence over the built-in routing.
   - A `## Precedence` section (2-3 lines): `CUSTOM.md` overrides `SKILL.md`; `custom-routing.md` overrides built-in routing.
   - A note about user skills: users can add skills in `~/.claude/skills/` (any name not starting with `myna-`). Claude Code auto-discovers them. Disambiguation rules go in `~/.myna/custom-routing.md`.

6. **Do NOT change the frontmatter `skills:` list** — it stays at 6 steering skills.

**Include these routing writing guidelines in the subagent prompt:**

- Group by **confusion clusters** — skills that could be mistaken for each other, side by side. Don't add a separate subsection per skill.
- **Route by user intent, not keywords.** Example phrases illustrate intent — 2-3 phrases per skill is enough. The agent generalizes from intent, not pattern-matches on exact words.
- **Only disambiguate where there's real confusion risk.** If two skills do obviously different things, they don't need a "not this" rule.
- **Keep it tight.** A routing section that's too long defeats itself. If a skill's purpose is obvious from the skill directory table, a single line in a logical group is enough.
- **Prose with arrows, not tables.** LLMs follow conditional prose better than table cells for decision logic.
- **Restructure existing subsections if needed.** Merge new skills into existing groups (e.g., myna-1on1-analysis might belong with Meeting Routing or People & Team). Don't just append 11 new blocks at the end.
- **Every skill must appear somewhere in routing,** but that can be a single line in a group.

Good example:
```markdown
### People & Team

- "How is my team doing?", "anyone overloaded?" → myna-team-health
- "Tell me about Sarah", "what's pending with Sarah?" → myna-brief-person
- "How are my 1:1s with James going?", "1:1 trends" → myna-1on1-analysis

If the user names a specific person → myna-brief-person, never myna-team-health.
```

Bad example (just restating the description):
```
- "team health" → myna-team-health
```

### Review criteria for Task 1

After the subagent finishes, read `agents/main.md` and check:

- [ ] YAML frontmatter still valid, still has exactly 6 steering skills
- [ ] Skill directory table is unchanged
- [ ] Every one of the 24 skills appears somewhere in the routing section
- [ ] Routing rules are grouped by confusion clusters, not one subsection per skill
- [ ] Disambiguation rules only exist where skills genuinely overlap — no unnecessary "not this" rules for skills that are obviously different
- [ ] Example phrases read like natural user requests, not keyword lists
- [ ] The routing section hasn't ballooned — it should be concise. If it's more than ~2x the current length, something is overspecified
- [ ] Custom routing reference uses literal `~/.myna/custom-routing.md` path, not `{{VAULT_PATH}}`
- [ ] Precedence section exists and is 2-3 lines
- [ ] User skills note exists
- [ ] `## Direct Operations` and `## Rules` sections are untouched

---

## Task 2: Edit `install.sh`

### What to tell the subagent

The subagent needs to:

1. Read `install.sh` to understand the current structure.
2. In the skill copy loop (after copying SKILL.md to the destination), **create `CUSTOM.md`** at the destination (`~/.claude/skills/myna-*/CUSTOM.md`) — NOT in the source repo. Only create if it doesn't already exist. Content:

```markdown
<!-- Customization file for this skill.
     Add overrides, extra steps, or behavioral tweaks below.
     This file is never overwritten by updates.
     Content here takes precedence over SKILL.md when they conflict. -->
```

3. After the skill copy section, **create `~/.myna/custom-routing.md`** — only if it doesn't already exist. The `~/.myna/` directory is already created by the install script for manifest metadata. Content:

```markdown
<!-- Custom routing rules for user-added skills.
     This file is never overwritten by updates.
     Rules here take precedence over Myna's built-in routing.

     Format — add your routing rules as markdown below. Example:

     ### Oncall Routing
     - "oncall escalation", "page someone", "who's on call?" → my-oncall
     - "standup update", "what did my team ship?" → my-amazon-standup
-->
```

4. Update the install summary output to mention customization files.
5. Support `--dry-run` for all new file creations (same pattern as existing code).

### Review criteria for Task 2

After the subagent finishes, read `install.sh` and check:

- [ ] CUSTOM.md is created at the destination (`$SKILLS_DEST/$skill_name/CUSTOM.md`), not the source
- [ ] CUSTOM.md creation is inside the existing skill copy loop, right after the `cp` of SKILL.md
- [ ] CUSTOM.md is only created if it doesn't already exist (`if [ ! -f ... ]`)
- [ ] custom-routing.md is created at `$MYNA_HOME/custom-routing.md`
- [ ] custom-routing.md is only created if it doesn't already exist
- [ ] Both file creations have `--dry-run` support matching the existing pattern
- [ ] Install summary mentions the new files
- [ ] No existing functionality is broken — skill copy, agent generation, vault structure, config setup all still work
- [ ] The script still runs cleanly with `bash -n install.sh` (syntax check)

---

## Task 3: Update `docs/architecture.md`

### What to tell the subagent

Read `docs/architecture.md`. Find the section that describes skill loading and the skill inventory. Add a concise subsection documenting the customization model:

- Three mechanisms: CUSTOM.md overrides, custom-routing.md, user skill directories
- Update behavior on install (what gets overwritten, what's preserved)
- Precedence rules

Match the existing writing style and section depth. Architecture docs describe mechanisms, not user guides.

Provide the subagent with the full design decisions from the top of this prompt so it knows what to write.

### Review criteria for Task 3

- [ ] New content is in the right location (near skill loading / skill inventory)
- [ ] Covers all three mechanisms
- [ ] Matches the tone and depth of surrounding sections — not too verbose, not too terse
- [ ] Doesn't duplicate information that's already in the file
- [ ] No existing content was accidentally removed or modified

---

## Task 4: Update `README.md`

### What to tell the subagent

Read `README.md`. In the section that describes what Myna includes or what you get after install, add a brief mention of customization (2-3 sentences or a small subsection):

- Users can customize existing skills via CUSTOM.md overrides
- Users can add their own skills
- Customizations are preserved across updates

Keep the README's existing tone.

### Review criteria for Task 4

- [ ] Addition is in the right location — near the "what you get" or "after install" section
- [ ] Brief — not a full guide, just awareness
- [ ] Matches existing README tone
- [ ] No existing content was accidentally removed or modified

---

## Task 5: Update `docs/post-install-checklist.md`

### What to tell the subagent

Read `docs/post-install-checklist.md`. After the config setup steps, add a brief note making users aware of the customization files:

- CUSTOM.md files exist in each skill directory for overrides
- custom-routing.md at `~/.myna/` for routing rules for user-added skills
- These are optional — most users won't need them right away

Frame it as "good to know" rather than a required step.

### Review criteria for Task 5

- [ ] Placed after config setup, not mixed into required steps
- [ ] Framed as optional/informational
- [ ] Mentions both CUSTOM.md and custom-routing.md with correct paths
- [ ] No existing content was accidentally removed or modified

---

## Task 6: Add decision to `docs/decisions.md`

### What to tell the subagent

Read `docs/decisions.md` to find the current numbering scheme and format. Add a new decision entry documenting:

- Three-mechanism approach (CUSTOM.md, custom-routing.md, user skill dirs)
- Update-safe by design (upstream overwritten, user content preserved)
- Precedence: custom overrides upstream
- Rationale: users need to both customize and receive updates without merge conflicts

Follow the exact format of existing entries.

### Review criteria for Task 6

- [ ] Decision number follows the existing sequence
- [ ] Format matches existing entries exactly (same fields, same style)
- [ ] Content accurately reflects the design decisions above
- [ ] Placed in the correct location in the file (typically at the top, as the newest decision)

---

## Final quality checks

After all tasks are reviewed and fixed, run these:

1. `bash -n install.sh` — syntax check passes
2. Verify `agents/main.md` YAML frontmatter is valid (6 steering skills)
3. Scan routing section: every one of the 24 skill names from the skill directory table appears somewhere in the routing logic

Report a summary of what was done and any issues found during review.

## Commit and push

After all quality checks pass:

1. Create a new branch: `feat/customization-layer`
2. Stage all changed files including `docs/prompts/customization-layer.md` (this prompt file) — do NOT stage any files outside this project
3. Commit with message: `feat: add customization layer — CUSTOM.md overrides, custom routing, user skills`
4. Push the branch to origin

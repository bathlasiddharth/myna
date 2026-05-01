---
name: setup
disable-model-invocation: true
description: Single entry point for Myna onboarding — detects install state, runs first-time scaffolding if needed, opens the Config UI or runs doc import, and adds shell aliases. Use for first-time setup or returning configuration.
user-invocable: true
argument-hint: "setup | review config | add a project | add people"
---

# myna-setup

Single entry point for all Myna configuration — new installs and returning users alike. Detects whether Myna is already installed, runs the install script if not, then opens the Config UI (or doc import as an alternative). No guided interview.

`${CLAUDE_SKILL_DIR}` is the directory containing this SKILL.md file, resolved by the plugin runtime to the skill's install location.

---

## Step 0: Detect Install State

Read `~/.myna/config.yaml`.

- If it **exists**: parse `vault_path` from it. Subfolder is always `myna`. Skip to Step 3 (Config UI).
- If it **does not exist**: say "Welcome! Let's get Myna set up." and continue to Step 1.

---

## Step 1: Gather Vault Details (first-time only)

Ask the user one question:

1. Full path to your Myna vault — a folder on your machine where Myna stores everything. Using Obsidian? Point it to your Obsidian vault. (e.g. `/Users/you/Documents/MyVault`)

Then continue to Step 2.

---

## Step 2: Run Install Script (first-time only)

Run the install script in the foreground:

```
bash "${CLAUDE_SKILL_DIR}/../../install/claude.sh" "<vault_path>" "myna"
```

Show all progress output as it runs. If the script exits non-zero, show the error output and stop — do not proceed to Step 3.

---

## Step 3: Config UI

Check if `python3` is available:

```
python3 --version
```

**If python3 is not available:**

Check if `brew` is available:

```
brew --version
```

- **If brew is available:** Ask: "The Config UI needs Python 3. Want me to install it? (`brew install python3`)"
  - If yes: run `brew install python3`, then continue to the python3 available path below.
  - If no: show config file paths (see below) and stop.

- **If brew is not available:** Say: "The Config UI needs Python 3. Install it from https://python.org and re-run `/myna:setup`." Then ask: "Or would you rather skip that for now and edit the config files directly?" If yes: show config file paths (see below). Stop either way.

**Config file paths (shown only when user skips Python 3 install):**

- `{vault_path}/myna/_system/config/workspace.yaml` — your identity (name, job title, timezone) and feature toggles. Start here.
- `{vault_path}/myna/_system/config/projects.yaml` — the projects you're working on, with names, aliases, and which email folders or Slack channels map to each.
- `{vault_path}/myna/_system/config/people.yaml` — the people you work with: direct reports, manager, key collaborators, and their roles.
- `{vault_path}/myna/_system/config/communication-style.yaml` — how you like to write: tone and style presets for different audiences.
- `{vault_path}/myna/_system/config/meetings.yaml` — optional overrides for how Myna handles specific meeting types. Safe to leave blank for now.
- `{vault_path}/myna/_system/config/tags.yaml` — rules for auto-tagging vault entries. Safe to leave blank for now.

Each file has a `.yaml.example` alongside it — refer to those for the expected format.

**If python3 is available:**

1. Run in background: `python3 "${CLAUDE_SKILL_DIR}/../../ui/server.py"`
2. Capture PID and URL from stdout — lines starting with `PID:` and `URL:`. If PID capture fails, note it and proceed — the user can kill the server manually with `pkill -f server.py`.
3. Tell the user: "Config UI is open at {url}. Fill in what you can and come back here when done."
4. Wait for the user to return.
5. Kill the server: send SIGTERM to the captured PID. If PID capture failed, run `pkill -f server.py` as fallback.
6. Read all six config files from `{vault_path}/myna/_system/config/`. Show a human-readable summary of what is configured and what is still blank.
7. Ask: "Do you have any existing docs — project notes, a team roster, meeting notes — you'd like me to read to fill in what's missing?" If yes, proceed with the doc import flow below.

---

### Doc Import (optional follow-up)

Always present three explicit input options upfront before asking anything:

1. **Share docs** — paste text, give file paths, or share links. This skill extracts projects (name, status, timeline, key people, description) and people (name, role, relationship, team). If a link can't be accessed, ask the user to paste content instead.
2. **List them** — type a batch description of projects and/or people in any format. This skill structures it and confirms.
3. **Skip for now** — come back later via `/myna:setup`.

**Reading files by type:**
- **PDF**: Use Claude Code's Read tool directly — it handles PDFs natively. Do not write a script.
- **docx**: Check `pandoc --version` first. If available, run `pandoc -t plain <file>` to extract text. If pandoc is not found, check if python-docx is available by running `python3 -c "import docx"`. If it is, extract text with: `python3 -c "import docx, sys; d=docx.Document(sys.argv[1]); print('\n'.join(p.text for p in d.paragraphs))" <file>`. If neither pandoc nor python-docx is available, tell the user: "I can't read .docx files directly. Please install either pandoc (`brew install pandoc` or your OS package manager) or python-docx (`pip install python-docx`), then re-run setup. Alternatively, paste the document contents directly into the chat." Do not write custom parsing scripts.

When extracting from docs or user input, populate both `projects.yaml` and `people.yaml`. Cross-reference: people mentioned in projects get added to people config; projects mentioned for people get linked.

Show all extracted data as a **numbered human-readable list** — never as YAML. Then present these options:

1. **Write to config** — save as-is and continue.
2. **Inline corrections** — reference by number in chat (e.g., "3: remove", "5: she's tech lead not senior"). Multiple corrections in one message are fine. Best for small batches.
3. **Export to file** — write extracted data to a human-readable file (not YAML) in the vault, let the user edit it in their editor, then read it back. Best for large batches.

Write YAML only when the user selects option 1 (or after corrections are applied via option 2 or 3 and the user selects option 1). When the user provides timeline information (even rough like "Q3" or "end of May"), include it in the project description field.

**relationship_tier on import:** Do not default `relationship_tier` to "direct" or any other value. Leave it blank (omit the field) unless the source doc explicitly states the relationship. After writing to `people.yaml`, show: "N people saved without a relationship tier." Then offer:
1. Set tiers now — present the people with blank tiers as a numbered list and let the user assign each.
2. Defer to later — create a reminder task in `_system/ReviewQueue/` as a markdown file named `set-relationship-tiers-{date}.md` with a checklist of the people who need tiers set.

Schema references: `_system/config/projects.yaml.example`, `_system/config/people.yaml.example`.

**Person .md files:** After relationship tiers are resolved, create a `.md` file for each imported person using the person template at `agents/templates/person.md`. Write files to `{vault_path}/myna/People/{slug}.md` where `{slug}` is the person's name lowercased with spaces replaced by hyphens. Fill in fields from the imported data; leave any unknown field blank (no placeholder text, no "TBD"). For `relationship_tier`, use the value set during the tier step, or leave the frontmatter `relationship` field and the `#tier/` tag blank if still unset. Use full relative wikilinks: `[[1-1s/{slug}]]` not `[[{slug}]]`. Do not overwrite an existing person file — if a file already exists for a person, skip it and notify the user which files were skipped and why.

**Post-import timeline offer:** After config is written and relationship tiers are resolved, if any of the imported documents were project update documents (status updates, progress reports, sprint summaries, or similar), ask: "Want me to create project timeline files from the update documents you imported? I'll add dated entries to each project's timeline." Wait for the user to say yes before doing anything — skip this step if they decline or don't respond to it.

---

## Step 4: Shell Aliases (always — first-time and returning)

Ask once:

> Want me to add the Myna shell aliases to your shell config? This lets you launch Myna with pre-approved tool permissions. (yes/no)

If yes, show the user exactly what will be added:

```
alias myna='claude --agent myna:agent --allowedTools "Read,Write,Edit,Glob,Grep,Bash(cd *),Bash(ls *),Bash(cat *)"'
alias myna-ro='claude --agent myna:agent --allowedTools "Read,Glob,Grep"'
```

Detect the shell rc file: if `$SHELL` is zsh, use `~/.zshrc`; otherwise use `~/.bashrc`.

Check whether `alias myna=` already appears in the rc file. If it does, skip appending and tell the user: "Alias already present in {rc_file} — skipping."

If not already present, append both aliases to the rc file. Tell the user: "Added aliases to {rc_file}. Run `source {rc_file}` or open a new terminal to activate them."

If no, print both alias lines and tell the user to add them manually if they want them later.

---

## Step 5: Wrap-Up

**Onboarding checklist:** Create `{vault_path}/myna/_system/Onboarding.md` with a checklist of any setup items not yet completed in this session (e.g., integrations not configured, projects/people not imported, communication style not set). Do not include items the user already completed. Then append exactly one task to today's daily note: `- [ ] Complete Myna onboarding checklist [[_system/Onboarding]]`. Use the full relative wikilink — `[[_system/Onboarding]]` not `[[Onboarding]]`.

Tell the user: "Run `myna` (or `claude --agent myna:agent`) and type `sync` to start your day."

---

## Config Writing Rules

- Read the existing config file before writing. Preserve any fields the user didn't change.
- For `projects.yaml` and `people.yaml`: append new entries — never overwrite existing ones.
- For `people.yaml`: omit `relationship_tier` unless the source explicitly states it. Never default to "direct".
- Write valid YAML matching the schemas in `_system/config/*.yaml.example`.
- `vault.path` in `workspace.yaml` is set by the install script — don't ask about it, don't overwrite it. The subfolder is always `myna` (hardcoded; not stored in workspace.yaml).
- Internal plumbing fields — keep at defaults, never ask: `prompt_logging`, `calendar_event_prefix`.
- `meetings.yaml` and `tags.yaml` are not part of the guided flow — don't write them unless the user explicitly asks.
- **Import write-back: write only what was in the review file.** When writing config after an import review (option 3 in the doc import section), write only the entries and fields present in the review file. Do not add blocks, sections, or fields — such as triage, defaults, or schema examples — that were not explicitly included by the user.
- **Filter blank values from all list fields before writing.** Before writing any YAML config file, drop every item in every list field that is an empty string, null, or whitespace-only string. This applies to all list fields across all config files — do not enumerate fields by name. Only non-empty, non-null values with at least one non-whitespace character are written.

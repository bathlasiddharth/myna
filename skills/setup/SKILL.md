---
name: setup
disable-model-invocation: true
description: Configure Myna interactively — guided setup for identity, integrations, projects, people, and communication style. Add a project or person later, review current config, or walk through initial setup. Resumable at any point.
user-invocable: true
argument-hint: "setup | add a project | add people | review config | update communication style"
---

# myna-setup

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:init` and stop.

Guided, conversational configuration for Myna. Reads and writes the same YAML files as direct editing — just a friendlier interface. Works equally well for first-time setup, adding a project later, or reviewing what's configured.

## Design Principles

1. **Priority order.** Walk through sections in order of importance: identity first, integrations last. User can stop anytime; whatever is saved so far works.
2. **Options first, free text as escape hatch.** For structured choices, present numbered options with a final "other" option for custom input. Use free text only when the answer is genuinely open-ended.
3. **Infer from data, confirm don't ask.** When users share docs, extract information from them. Show numbered results for confirmation/correction — don't interview them from scratch.
4. **Present options explicitly.** When there are multiple input modes, always show them as numbered options so the user knows what's available before choosing.
5. **Doc import is the primary path.** Users share docs (pasted text, file paths, or links); this skill extracts projects, people, timelines, and roles. If a link can't be accessed, ask the user to paste the content instead.
6. **Numbered inline corrections.** Show extracted or entered data as numbered lists. User corrects by referencing numbers ("3: remove", "4: she's tech lead not senior"). Multiple corrections in one message are fine.
7. **Batch input.** Accept multiple items at once — a list of projects, a list of people — rather than one-by-one interviews.
8. **Resumable.** On re-run, read existing config files and show what's there. Never auto-skip sections — present options so the user decides what to do: "You have 3 projects configured. Want to add more, edit existing, or move on?" The user is always in control.
9. **Never show YAML.** All data is presented as human-readable numbered lists. YAML is written behind the scenes.

---

## Section 0: Vault Path

The vault path comes from `~/.myna/config.yaml`, which is read by the fallback line near the top of this skill. All config files are at `{vault_path}/{subfolder}/_system/config/`.

---

## Section 0.5: Choose Input Mode

Before walking through configuration, present three input options:

1. **Config UI** — Open a visual settings page in the browser. Recommended for first-time setup and bulk editing. Requires Python 3.
2. **Guided interview** — Answer questions in chat. No extra tools needed.
3. **Import from docs** — Paste or share documents; this skill extracts config from them.

Show these as a numbered list and wait for the user to choose.

**If option 1 (Config UI) is chosen:**
1. Check if `python3` is available: `python3 --version`. If not found, tell the user Python 3 is required for the UI and offer to fall back to option 2 (guided interview) instead.
2. Run `python3 ~/.myna/ui/server.py` in the background. Capture the PID and URL from stdout (lines starting with `PID:` and `URL:`). If PID capture fails, note it and proceed — the user can kill the server manually with `pkill -f server.py`.
3. Tell the user: "Config UI is open at {url}. Make your changes in the browser and come back here when done."
4. Wait. When the user returns, kill the server by sending SIGTERM to the captured PID (if available), or instruct `pkill -f server.py` as a fallback.
5. Read all six config files and show a summary of what changed (compare against the pre-open state).
6. Ask if they want to continue with the guided interview for anything that's still missing.

**Python prerequisite note:** The config UI requires Python 3. If Python is not available, options 2 and 3 work without it.

**If option 2 or 3 is chosen:** proceed with the existing sections below.

---

## Section 1: Status Summary

Read all six config files from `_system/config/`. Show a human-readable summary of what's configured and what's missing or blank. Always show this on every invocation, including re-runs.

If everything is populated, show the summary and offer: 1) add more projects/people, 2) edit existing config, 3) review applied defaults, 4) move on. If gaps exist, offer to fill them in priority order (identity first).

Also check `~/.myna/pending-imports.json`. If it contains file paths, mention it:
"You have N files ready to import. Tell me to import them and I'll process them now, or you can come back to this later."

**If the user asks to import files while the config UI server is still running:**
1. Tell the user: "Pausing config UI to run import, will restart after."
2. Kill the server (SIGTERM to the captured PID, or `pkill -f server.py` as fallback).
3. Run the import.
4. Restart the server: `python3 ~/.myna/ui/server.py` in the background, capture new PID and URL.
5. Tell the user: "Config UI is back at {url}."

---

## Section 2: Identity and Preferences

Writes to `workspace.yaml`. Collect in two passes — essentials first, preferences after.

**Essential fields (Myna can't work without these):**
- Name (free text)
- Email (free text)
- Role (options: 1) Engineering Manager, 2) Tech Lead, 3) Senior Engineer, 4) PM, 5) Other)
- Timezone (options: list common IANA zones + "Other")

Complete essentials before moving to preferences.

**Preference fields:**
- Work hours: start/end time (options: 1) 9–5, 2) 10–6, 3) 8–4, 4) Other)
- Feedback cycle: how often to flag feedback gaps (options: 1) Every 2 weeks, 2) Monthly, 3) Quarterly, 4) Other)
- Journal archival: how long to keep daily notes before archiving (options: 1) 30 days, 2) 60 days, 3) 90 days, 4) Never)
- Email filing: how processed emails are organized (options: 1) Per-project folders, 2) One shared folder)
- Feature areas: present four areas and let the user disable any they don't need — 1) Email & messaging, 2) Meetings & calendar, 3) People & team management, 4) Personal tracking. Map the user's choices to the 17 individual toggle fields in `workspace.yaml`. Default is all enabled.

Do not ask about: `timestamp_format`, `prompt_logging`, `calendar_event_prefix`, `calendar_event_types`. These can be edited via the Myna config UI or directly in `workspace.yaml`.

---

## Section 3: Communication Style

Writes to `communication-style.yaml`. Present numbered options for each question — always include a custom option last.

- Default writing style (options: 1) Professional, 2) Conversational, 3) Executive, 4) Casual, 5) Coaching, 6) Diplomatic, 7) Concise, 8) Custom)
- Sign-off preference (options: 1) Best, 2) Thanks, 3) Cheers, 4) Custom)
- Tone for difficult messages (options: 1) Direct-but-kind, 2) Diplomatic, 3) Straightforward, 4) Custom)

Then offer per-tier overrides (upward / peer / direct / cross-team) as an optional step — present the option but don't push if they skip.

Schema reference: `_system/config/communication-style.yaml.example`.

---

## Section 4: People and Projects

The most important section. Always present three explicit options upfront before asking anything:

1. **Share docs** — paste text, give file paths, or share links. This skill extracts projects (name, status, timeline, key people, description) and people (name, role, relationship, team). If a link can't be accessed, ask the user to paste content instead.
2. **List them** — type a batch description of projects and/or people in any format. This skill structures it and confirms.
3. **Skip for now** — come back later via `/myna:setup`.

**Reading files by type (for option 1):**
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

**Person .md files:** After relationship tiers are resolved, create a `.md` file for each imported person using the person template at `agents/templates/person.md`. Write files to `{vault_path}/{subfolder}/People/{slug}.md` where `{slug}` is the person's name lowercased with spaces replaced by hyphens. Fill in fields from the imported data; leave any unknown field blank (no placeholder text, no "TBD"). For `relationship_tier`, use the value set during the tier step, or leave the frontmatter `relationship` field and the `#tier/` tag blank if still unset. Use full relative wikilinks: `[[1-1s/{slug}]]` not `[[{slug}]]`. Do not overwrite an existing person file — skip silently if the file already exists.

**Post-import timeline offer:** After config is written and relationship tiers are resolved, if any of the imported documents were project update documents (status updates, progress reports, sprint summaries, or similar), ask: "Want me to create project timeline files from the update documents you imported? I'll add dated entries to each project's timeline." Wait for the user to say yes before doing anything — skip this step if they decline or don't respond to it.

---

## Section 5: Integrations

Writes to `workspace.yaml`. Walk through in two parts:

**MCP servers** (`mcp_servers` key). Walk through the three functions Myna supports, one at a time:
- Email MCP server name
- Calendar MCP server name
- Messaging (Slack, Teams, etc.) MCP server name

Say once upfront: "Just type the MCP server name for each, or 'skip' to move on." Don't verify the server works. Don't suggest product names — just ask for the server name the user registered with Claude Code.

**Notes forwarding email** (`email.notes_email` key). Ask: "What email address do you forward emails to when you want Myna to draft a reply? (Used by the DraftReplies workflow — skip if you don't use this.)" Save the answer to `email.notes_email` in `workspace.yaml`. If the user skips, leave the field unset.

---

## Section 6: Optional Config

Briefly mention that `meetings.yaml` and `tags.yaml` exist for power users but most people don't need them. They can be edited directly or revisited via `/myna:setup`. Don't walk through them.

---

## Section 7: Wrap-Up

Show a final summary of everything configured in this session. Then show the defaults that were applied silently — the internal plumbing fields: `timestamp_format: YYYY-MM-DD`, `prompt_logging: true`, `calendar_event_prefix: [Myna]`, `calendar_event_types: Focus/Task/Reminder`. Let the user know that `timestamp_format` and calendar event settings can be changed via the Myna config UI (Identity and Calendar tabs), and `prompt_logging` can be edited directly in `workspace.yaml`. No hidden defaults.

**Onboarding checklist:** Create `{vault_path}/{subfolder}/_system/Onboarding.md` with a checklist of any setup items not yet completed in this session (e.g., integrations not configured, projects/people not imported, communication style not set). Do not include items the user already completed. Then append exactly one task to today's daily note: `- [ ] Complete Myna onboarding checklist [[_system/Onboarding]]`. Use the full relative wikilink — `[[_system/Onboarding]]` not `[[Onboarding]]`.

Suggest next steps: run `myna` and type `sync` to start the day.

---

## Config Writing Rules

- Read the existing config file before writing. Preserve any fields the user didn't change.
- For `projects.yaml` and `people.yaml`: append new entries — never overwrite existing ones.
- For `people.yaml`: omit `relationship_tier` unless the source explicitly states it. Never default to "direct".
- Write valid YAML matching the schemas in `_system/config/*.yaml.example`.
- `vault.path` and `vault.subfolder` in `workspace.yaml` are set by the install script — don't ask about them, don't overwrite them.
- Internal plumbing fields — keep at defaults, never ask: `timestamp_format`, `prompt_logging`, `calendar_event_prefix`, `calendar_event_types`.
- `meetings.yaml` and `tags.yaml` are not part of the guided flow — don't write them unless the user explicitly asks.
- **Import write-back: write only what was in the review file.** When writing config after an import review (option 3 in Section 4), write only the entries and fields present in the review file. Do not add blocks, sections, or fields — such as triage, defaults, or schema examples — that were not explicitly included by the user.
- **Filter blank values from all list fields before writing.** Before writing any YAML config file, drop every item in every list field that is an empty string, null, or whitespace-only string. This applies to all list fields across all config files — do not enumerate fields by name. Only non-empty, non-null values with at least one non-whitespace character are written.

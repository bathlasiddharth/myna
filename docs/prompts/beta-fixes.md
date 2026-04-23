# Myna — Beta Testing Bug Fixes and Improvements

Real-device testing bugs and improvements across install, config UI, skills, and docs. This session runs one subagent per task for maximum quality. Runtime may be 3–4 hours — that is expected and acceptable.

**You are a coordinator.** Read this entire prompt fully before starting anything. Work through tasks one at a time. Do not implement tasks yourself — ever.

**How to run each task:**
Use the `Agent` tool to spawn a subagent for each task. Each `Agent` call gets its own isolated context — this is what keeps tasks clean. Pass a self-contained prompt to each Agent call that includes: the Context section, all 20 Design Decisions, the style rule for skill files, and the specific task description with its review criteria. Do not assume the subagent has seen this prompt.

After the Agent call returns, read what the subagent did. If the task is not fully done, call `Agent` again with specific feedback on what to fix. Run up to 3 fix cycles per task before moving on.

**How to review each subagent's output:**
Check the review criteria listed under the task — these are a baseline, not a ceiling. Also look for anything else that could have broken or been missed based on what was actually implemented. If something is missing or wrong, be specific in your follow-up Agent call — name exactly what's incomplete.

**What to include in every Agent call:**
- The Context section from this prompt
- All 20 Design Decisions
- The skill file style rule: "When editing any SKILL.md or main.md file, match the existing instruction density and style. Make the minimum change that achieves the task. Do not add prose, caveats, or explanatory text that wasn't already there."
- The specific task description and its review criteria
- This instruction: "Read the current state of the relevant files thoroughly before changing anything — do not skim. Understand the existing approach first, then make the right change. The review criteria are a starting point — also use your own judgment. Self-review before reporting done."

**Quality over speed.** Each Agent call has one task and a clean context. No drift, no accumulated assumptions from previous tasks.

**Goal: zero human rework.** The user is asleep. After commit, they should be able to merge without changes.

---

## Context

Myna is a local-first Chief of Staff AI built on Claude Code. All agent logic lives in `agents/`. The install script is `install.sh`. Config UI source files are in `ui/`. Skill files follow the pattern `agents/skills/myna-*/SKILL.md`. The main agent is `agents/main.md`. Steering skills in `agents/skills/myna-steering-*/SKILL.md` are always-on cross-cutting rules.

Read `CLAUDE.md` before anything — it has the git conventions for this project.

When spawning a subagent, include this Context section and all Design Decisions in their prompt. Each subagent prompt must be self-contained — subagents have no memory of this conversation.

**Do NOT have subagents read `docs/temp/task-details.md` or `docs/temp/brainstorming-fixes.md`.** Those are intermediate drafts. All task descriptions in this prompt are authoritative.

**For same-file sequential tasks:** each subagent must read the current state of the file before editing — not assume it looks like the original. Previous subagents may have already modified it.

---

## Design Decisions (already settled — do not re-debate)

1. Section order for both the config UI nav and myna-setup guided flow: **Identity → Communication → People → Projects → Integrations**
2. The `myna` alias must allow all commands Claude Code might need — no restrictive allowlist. Vault paths with spaces must be properly quoted.
3. `myna update` pulls from the cloned GitHub repo — the repo must be kept. Remove any install.sh text suggesting users can delete the cloned folder.
4. Installed config files should have all keys present with empty values, not be blank.
5. When importing people, leave `relationship_tier` blank unless the source doc explicitly states it. After saving, show how many were saved without a tier, offer to set now or later. If deferred, create a vault reminder task.
6. Delegation requires explicit delegation language ("delegate this to X"). When a user specifies a project AND a person for a task, create a project task with that person as owner — not a delegation.
7. Auto-save in config UI: dropdowns and toggles save on change; text inputs save on blur. Show a "Saved" toast after each save. Remove explicit Save buttons.
8. Email sign-off preference moves from the difficult messages context to general Communication preferences. Update any skills that read this field.
9. `difficult_message_approach` is removed from config schema, UI, and all skills that reference it.
10. Daily note: four sections only — (1) AI briefing bullets surfacing what matters most today, (2) today's meetings as bullets with prep status, (3) tasks due today grouped by project, (4) links to dashboards. Full overdue lists, delegations, and this-week content move to dedicated dashboards.
11. After sync, show today's meetings as a numbered list and ask "Want me to prep any of these? Say a number or 'all'."
12. MCP registration step in post-install checklist stays, marked optional. Reworded to clarify it's about registering MCP server binaries with Claude Code, not configuring Myna. Notes that myna-setup will later ask for server names.
13. Chip/tag input for multi-value fields: placeholder "Type and press Enter", ghost chip preview while typing, locks in on Enter or comma, auto-normalize to #channel-name for Slack, chips are removable.
14. Wikilinks must always use full relative paths: `[[People/marcus-walker]]` not `[[marcus-walker]]`.
15. Timeline bullets: space between adjacent tags, all tags moved to end of line so content reads first.
16. For unknown people in a capture, complete the capture without blocking. Auto-add a review queue item for the unknown person.
17. Config UI right panel: always visible, shows field explanations for the current page, highlights focused field's explanation.
18. Integrations section in config UI defaults to empty/disconnected — no pre-filled MCP names on first open.
19. Task movement must not mark a task complete. Any task field change (date, owner, project, status) appends a change log entry to the task's notes.
20. Communication style options: (1) Direct and concise, (2) Warm and collaborative, (3) Formal and polished, (4) Casual and friendly, (5) Custom with free-text input.

---

## Commit Discipline

**One commit per task. All commits on a single branch.**

Before the first task:
1. Run `git status` to see any pre-existing staged or modified files. Note them — **never include them in any commit from this session**. They belong to work outside this prompt.
2. Create and check out branch: `git checkout -b fix/beta-testing-improvements`

After each subagent completes and passes review:
1. Stage **only** the files that subagent changed: `git add <specific files>` — never `git add .` or `git add -A`
2. Double-check staged files with `git diff --staged` before committing
3. Commit with a message in the format: `fix(G{n}-{m}): brief description of what changed`
   - Example: `fix(G1-1): reorder next-steps so myna-setup comes before launch`
   - No Co-Authored-By lines
4. Do **not** include `docs/prompts/beta-fixes.md` in individual task commits — save it for the very last commit

After all tasks complete:
1. Stage and commit the prompt file: `git add docs/prompts/beta-fixes.md` → `docs: add beta-fixes execution prompt`
2. Push: `git push -u origin fix/beta-testing-improvements`

---

## Execution Order

Tasks are grouped by file dependency. Within each block, run subagents sequentially — each must complete and pass review before the next starts.

Blocks that touch different files are independent. If you choose to parallelize between blocks, that is acceptable — but sequential is fine too.

**Block 12 (G5 — formatting audit) must run after all implementation blocks** (1–11) complete, because it audits the final state of all skill files. **Block 13 (morning test guide) runs last of all**, after Block 12.

---

### Block 1 — Install Script (sequential: all edit `install.sh`)

#### Task G1-1: Fix next-steps order after installation

The post-install "next steps" message printed by `install.sh` tells users to launch Myna first, then run /myna-setup. This is backward — setup must happen before first use. Fix the order so /myna-setup is step 1 and it's clear the command runs inside Claude Code.

**Why:** Users follow the printed order literally and hit an unconfigured agent on first launch.

Review criteria (starting point — also check anything else that could have broken):
- [ ] /myna-setup appears before the "launch Myna" instruction in the printed message
- [ ] The instruction makes clear /myna-setup is run inside Claude Code, not as a terminal command

---

#### Task G1-4: Fix myna alias — allow all commands and quote vault path

The `myna` alias in the generated `.zshrc` currently restricts Bash to a narrow allowlist of subcommands (cd, ls, cat). This causes permission prompts when myna-setup needs to run the config UI server or open a browser. Also, vault paths containing spaces may not be properly quoted, causing permission prompts even for allowed tools.

**Why:** The alias was written conservatively but it's too restrictive for real use. Users hit unexpected prompts mid-setup.

Review criteria:
- [ ] The alias allows all Bash commands — no restrictive allowlist
- [ ] The vault path in the alias is quoted to handle paths with spaces

---

#### Task G1-5: Add `myna update` command

Users have no way to update Myna when new versions are released. Add a `myna update` command that pulls latest from the cloned GitHub repo and re-runs the install script. If the repo folder is gone, print a clear error with re-install instructions.

Also: `install.sh` currently has text suggesting users can delete the cloned folder after install. Remove or rewrite that text — the repo is needed for updates. Add a note in README warning users not to delete it.

**Why:** No update path means users are stuck on the version they installed.

Review criteria:
- [ ] `myna update` pulls from the cloned repo and re-runs the install script
- [ ] If the repo folder is missing, the error message is clear and includes re-install instructions
- [ ] No text in install.sh suggests the cloned repo can be deleted
- [ ] README has a note about keeping the cloned repo

---

### Block 2 — Post-Install Checklist (sequential: all edit `docs/post-install-checklist.md`)

#### Task G1-6: Mark MCP registration step as optional

The post-install checklist has a step for registering MCP servers with Claude Code. It reads as required. Mark it optional. Reword to clarify it's about registering MCP server binaries with Claude Code (a one-time OS-level setup), not configuring Myna. Add a note that myna-setup will later ask for the server names.

**Why:** Marking it required confuses users who already have MCPs set up or want to configure them later.

Review criteria:
- [ ] Step is clearly marked optional
- [ ] Wording explains this registers the server binary with Claude Code, not Myna
- [ ] Note says myna-setup will ask for server names during setup

---

#### Task G1-7: Move Obsidian settings step to last

The checklist has a "Configure Obsidian Settings" step in the middle. This step is about Obsidian UX (templates, folders) and is not required for Myna to function. Move it to the last step with a note that it's optional and only improves the Obsidian experience.

**Why:** An optional UX step mid-checklist makes setup feel heavier and more fragile than it is.

Review criteria:
- [ ] Obsidian settings step is last in the checklist
- [ ] It has a note explaining it's optional and what it improves

---

#### Task G10-1: Fix broken link to guide.md

The bottom of the post-install checklist links to `guide.md`, but clicking it creates a new empty file instead of opening the existing guide. Fix the link path.

**Why:** Broken links in a setup doc erode user confidence immediately.

Review criteria:
- [ ] The link to guide.md resolves to the existing file, not a new one

---

### Block 3 — Config File Templates (independent of Blocks 1–2)

#### Task G1-2: Config files should have empty placeholders, not be blank

After install, the config files (workspace.yaml, people.yaml, projects.yaml, etc.) are completely blank. Users have no idea what fields exist. Fix: installed config files should have all keys present with empty values. Use the `.yaml.example` files in `agents/config-examples/` as the schema reference.

**Why:** Blank files force users to copy-paste from example files. Empty-keyed files let them fill in the blanks.

Review criteria:
- [ ] All installed config files have every key present with an empty value
- [ ] Structure matches the corresponding `.yaml.example` schema
- [ ] The install script writes these files, not empty ones

---

#### Task G1-3: Ignore blank entries in config arrays

If a user fills in 2 of 3 items in a config array and leaves the third blank, Myna currently treats blank entries as real data or errors. Find where config arrays are read across the codebase and add graceful blank-entry filtering.

**Why:** Leaving unused array slots blank is a natural user behavior. Silently skipping them is the right default.

Review criteria:
- [ ] Blank array entries are skipped silently wherever config arrays are read
- [ ] No error or unexpected behavior when blank entries are present

---

### Block 4 — Config UI (sequential: all edit `ui/` files)

Each subagent reads the current state of the UI source files before editing. Previous subagents in this block will have already modified them.

#### Task G2-1: Integrations section should default to empty/disconnected

When the config UI opens for the first time, the Integrations section shows MCP names pre-filled and marked as connected. Fix: default state shows all integrations empty and not connected.

**Why:** Nothing has been configured yet — showing a "connected" state is misleading and creates false confidence.

Review criteria:
- [ ] Integrations section shows empty/disconnected state on first open
- [ ] No MCP names are pre-filled by default

---

#### Task G2-2: Reorder config UI nav sections

Current nav order is wrong. Reorder to: Identity → Communication → People → Projects → Integrations.

**Why:** Users should configure who they are and their work context before connecting external tools.

Review criteria:
- [ ] Nav order exactly matches: Identity → Communication → People → Projects → Integrations

---

#### Task G2-3: Expand role dropdown and allow custom input

The role dropdown has too few options. Add common tech roles (at minimum: Software Developer, Security Engineer, Technical Program Manager, Engineering Manager, Product Manager, Director of Engineering, VP of Engineering, CTO) sorted alphabetically. Also allow a free-text custom input for roles not in the list.

**Why:** Users can't find their role and give up or pick the wrong one.

Review criteria:
- [ ] Common tech roles are present and sorted alphabetically
- [ ] A "Custom" option allows free-text input for unlisted roles

---

#### Task G2-4: Auto-detect timezone on first load

The timezone field requires manual entry. Auto-detect the system timezone on first load using the browser or OS API and pre-populate the field. User can still change it.

**Why:** Manual timezone entry is unnecessary friction — the system already knows it.

Review criteria:
- [ ] Timezone field is pre-populated with the system timezone on first load
- [ ] The field remains editable

---

#### Task G2-5: Replace time picker with hour + minute dropdowns

The current time picker for work hours start/end is not intuitive. Replace with two dropdowns side by side: hour (1–12) and minute (00, 15, 30, 45), plus AM/PM. Default to 9:00 AM – 5:00 PM.

**Why:** The existing time picker confuses users — dropdowns are immediately understood.

Review criteria:
- [ ] Work hours uses hour + minute + AM/PM dropdowns, not a time picker
- [ ] Default is 9:00 AM start, 5:00 PM end

---

#### Task G2-6: Replace feedback cycle field with monthly dropdown

The feedback cycle field uses an up/down counter which is confusing. Replace with a dropdown: "Every 1 month", "Every 2 months", "Every 3 months". Default to 1 month.

**Why:** A counter with no unit is meaningless. A dropdown with labeled options is unambiguous.

Review criteria:
- [ ] Feedback cycle is a dropdown with the three monthly options
- [ ] Default is "Every 1 month"

---

#### Task G2-7: Replace communication style options

Replace current options with: (1) Direct and concise, (2) Warm and collaborative, (3) Formal and polished, (4) Casual and friendly, (5) Custom. When Custom is selected, show a free-text input field.

**Why:** Current options include "Coaching" which is too niche. The new set covers meaningfully different styles users would actually pick differently.

Review criteria:
- [ ] Exactly the five new options are present — no old options remain
- [ ] Selecting Custom shows a free-text input

---

#### Task G2-8: Move email sign-off to general Communication section

Email sign-off is currently under "Difficult Messages" in the UI. Move it to the general Communication preferences section.

**Why:** Sign-off applies to all emails, not just difficult ones. Its placement under "Difficult Messages" is confusing.

Review criteria:
- [ ] Sign-off field is in the Communication section
- [ ] Sign-off field is not under Difficult Messages

---

#### Task G2-9: Remove difficult_message_approach field from UI

Remove the `difficult_message_approach` field from the UI entirely. It also exists in `agents/config-examples/communication-style.yaml.example`, `agents/skills/myna-prep-meeting/SKILL.md`, and `agents/skills/myna-draft/SKILL.md` — remove or update references in all of these.

**Why:** Everyone picks "direct but kind" — the field adds no signal. Myna already adapts tone per relationship tier and communication style.

Review criteria:
- [ ] Field is gone from the UI
- [ ] Field is removed from the config example file
- [ ] Skills that referenced it no longer do (or fall back gracefully)

---

#### Task G2-10: Slack channels — chip input with ghost preview

The Slack channels field has no clear multi-value input. Replace with a chip/tag input: placeholder "Type a channel and press Enter" when empty; as the user types, show a ghost chip preview that locks in on Enter or comma. Auto-normalize to #channel-name format. Chips are removable.

**Why:** It's not obvious how to enter multiple channels. Users type one and don't know how to add more.

Review criteria:
- [ ] Placeholder text shown when field is empty
- [ ] Ghost chip preview appears while typing
- [ ] Locks in on Enter or comma
- [ ] Input auto-normalizes to #channel-name format
- [ ] Chips can be individually removed

---

#### Task G2-11: Email folders — chip input, standardized label

Same chip input pattern as Slack channels. Label standardized to "Email Folders" everywhere in the UI.

**Why:** Same multi-value confusion as Slack channels. Inconsistent labeling adds unnecessary cognitive load.

Review criteria:
- [ ] Email folders uses the chip input pattern
- [ ] Label reads "Email Folders" consistently throughout the UI

---

#### Task G2-12: Key People — multi-select from People config

The Key People field in Projects currently accepts free text. Replace with a multi-select populated from People config. If a name isn't found in People config, show an inline warning: "X not found in People config — add them in the People section first." Don't auto-create an entry.

**Why:** Free text leads to typos and name mismatches that silently break skills that depend on People config.

Review criteria:
- [ ] Key People is a multi-select populated from People config
- [ ] Unknown names show the inline warning message
- [ ] No auto-creation of People config entries from this field

---

#### Task G2-13: Surface email filing config in the UI

The email filing setting (how processed emails are organized — per-project folder vs one shared folder) exists in the config schema but is not exposed in the UI. Add it to the relevant section.

**Why:** Users can't discover or change this setting without editing YAML directly.

Review criteria:
- [ ] Email filing setting is visible and editable in the UI
- [ ] The two options (per-project folder, shared folder) are clearly presented

---

#### Task G2-14: Auto-save with toast confirmation

There is no auto-save behavior. Remove explicit Save buttons. Dropdowns and toggles save on change. Text inputs save on blur (when the user leaves the field). Show a brief "Saved" toast after each save.

**Why:** Without clear save feedback, users don't know if their changes persisted.

Review criteria:
- [ ] No explicit Save buttons in the UI
- [ ] Dropdowns and toggles save immediately on change
- [ ] Text inputs save on blur
- [ ] A "Saved" toast appears after each save action

---

#### Task G2-15: Add contextual help panel on the right side

Add a persistent right panel that shows explanations for all fields on the current config page. When a field is focused, highlight its explanation in the panel. Include a brief intro at the top of the panel explaining what the whole section controls.

**Why:** First-time users don't know how any of the settings affect Myna's behavior. They're guessing.

Review criteria:
- [ ] Right panel is present and always visible on each config page
- [ ] All fields on the page have explanations in the panel
- [ ] Focusing a field highlights its explanation in the panel
- [ ] Panel has a section intro at the top

---

#### Task G2-16: Polish the UI — modern, classy, professional

The config UI currently feels like a plain form. The overall layout and structure are good — don't redesign it. Elevate the visual quality to feel modern and professional. Think polished SaaS product, not a default browser form.

Specific areas to address:
- **Navbar / branding**: "Myna" is plain text. Give it proper treatment — weight, spacing, maybe a subtle logo mark or typographic refinement. The navbar itself may need a bottom border, shadow, or background refinement to feel anchored.
- **Typography**: Establish a clear hierarchy. Headings, labels, and body text should feel intentional — right weight, right size, right line-height. Use a system font stack that looks good across platforms.
- **Text contrast**: Current grayish text on dark backgrounds is not readable. Audit all text/background color combinations and fix contrast so every label, description, placeholder, and body text is legible. Meet at least WCAG AA contrast ratios.
- **Form controls**: Inputs, dropdowns, and buttons should feel refined — consistent border radius, subtle focus rings with a cohesive accent color, proper padding. Not browser defaults.
- **Spacing and layout**: Generous, consistent whitespace. Section headers with clear separation. The right panel (added in G2-15) should feel integrated, not bolted on.
- **Color**: Subtle, purposeful. A muted primary accent (one color, used sparingly), clean neutrals, no clashing. Avoid anything that reads as flashy or bright.
- **Light/dark mode**: Implement both. Auto-detect from `prefers-color-scheme` and apply the correct theme by default. Add a manual toggle so the user can override. Both modes should feel equally polished — not just a color inversion. Define a proper token set (background, surface, border, text-primary, text-secondary, accent) and use it consistently across both themes.
- **Micro-interactions**: Hover states on nav items, smooth transitions on the "Saved" toast, subtle focus animations. Nothing dramatic — just the kind of detail that signals quality.

Read the existing CSS and HTML before making any changes. Work within the existing structure — don't introduce a CSS framework or rewrite the layout. Targeted, high-impact refinements only.

**Why:** First impressions matter. A polished UI signals that Myna is a serious, well-crafted tool. The current plain styling undermines that.

Review criteria:
- [ ] The navbar has proper Myna branding — not plain text
- [ ] Typography has clear hierarchy with intentional weight and sizing
- [ ] All text is legible — no low-contrast gray-on-dark combinations anywhere
- [ ] Form controls look refined — consistent radius, focus states, padding
- [ ] Spacing feels generous and consistent throughout
- [ ] Color palette is muted and professional — one accent color, used sparingly
- [ ] Light mode and dark mode both look polished — not just a color inversion
- [ ] Theme auto-detects from system preference; manual toggle is present
- [ ] Hover and focus states are present and smooth
- [ ] Nothing looks flashy, generic, or out of character with a professional tool

---

### Block 5 — myna-setup Skill + Main Agent Routing (sequential: all edit `agents/skills/myna-setup/SKILL.md` or `agents/main.md`)

#### Task G3-1: Fix import instruction text in Files tab

The Files tab tells users to "Run /myna-setup import in a Claude chat to process them." This is wrong — within an active session the user can just say what they want directly. Fix the instruction text to reflect what users should actually say in context.

**Why:** Users read it literally, open a new Claude chat, type /myna-setup import, and nothing works.

Review criteria:
- [ ] Instruction text describes what to say during an active session, not a slash command
- [ ] The text is accurate for how import actually works

---

#### Task G3-2: Fix confusing confirmation after file processing

After reading files, the skill presents a numbered list of extracted data AND asks "Any corrections before I write these to config?" — mixing two interaction patterns. Use only numbered options. The user corrects by referencing a number. No open-ended yes/no question alongside the numbered list.

**Why:** Mixing numbered options with an open-ended question confuses users about how to respond.

Review criteria:
- [ ] Only numbered options are used for corrections after extraction
- [ ] No open-ended yes/no question alongside the numbered list

---

#### Task G3-3: Fix default relationship type for imported people

When importing, everyone gets `relationship_tier` set to "direct" by default. Fix: leave it blank unless the source doc explicitly states the relationship. After saving, show how many people were saved without a tier and offer to set them now or later. If deferred, create a vault reminder task.

**Why:** Defaulting everyone to "direct" is almost always wrong and causes downstream skill errors.

Review criteria:
- [ ] `relationship_tier` is left blank on import unless the source explicitly states it
- [ ] After saving, a follow-up shows how many were saved without a tier
- [ ] User is offered to set tiers now or later
- [ ] If deferred, a vault task is created as a reminder

---

#### Task G3-4: Add PDF and docx reading support

During import, the skill currently can't read PDFs and resorts to custom scripts. For PDFs: use Claude Code's Read tool directly — it handles PDFs natively. For docx: check if pandoc is available and use it; otherwise try python-docx. Don't write custom parsing scripts.

**Why:** Users share PDFs and Word docs as their primary source material. Failing on these blocks the most common import path.

Review criteria:
- [ ] PDF import uses Claude Code's Read tool, not a script
- [ ] docx import checks for pandoc first, falls back to python-docx
- [ ] No custom parsing scripts are written for either format

---

#### Task G3-5: Stop auto-injecting triage config after import review

After completing an import review, Myna injects a triage block into projects.yaml that the user never requested. Fix: the skill should only write back what was explicitly in the review file. Add an explicit instruction to the import flow: never add blocks, sections, or fields that weren't in the review file.

Note: this behavior may not appear as explicit code in the SKILL.md — it may emerge from how the LLM interprets the schema examples. Read the full import and write-back flow carefully to find where the constraint needs to be added.

**Why:** Unrequested config injections corrupt the user's carefully reviewed data.

Review criteria:
- [ ] The skill has an explicit instruction to only write back what was in the review file
- [ ] No triage or other unrequested blocks are written during import

---

#### Task G3-6: Handle import when config UI is running

When the user says "import files" while the config UI server is running, the skill abruptly asks to end the server. Fix: automatically stop the server, run the import, then restart it. Tell the user this is happening.

**Why:** Asking the user to manually manage server state is jarring and breaks the flow.

Review criteria:
- [ ] Server is stopped automatically before import starts
- [ ] Server is restarted automatically after import completes
- [ ] User is told this is happening, not asked to do it manually

---

#### Task G3-7: Route config-related phrases to myna-setup

Add routing in the main agent so phrases like "open config", "reconfigure", "update my settings", "change my preferences" launch myna-setup instead of requiring users to know about the skill by name.

**Why:** Users naturally say "I want to change my settings" — they shouldn't need to know the skill name.

Review criteria:
- [ ] A routing rule exists in the main agent for these phrases
- [ ] Covers natural variations: open config, reconfigure, update settings/preferences, change settings

---

#### Task G3-8: Offer project timeline creation as a post-import step

After completing an import, offer to create project timeline files from any update documents that were imported. Present it as an optional prompt — don't make it automatic.

**Why:** Timeline files are valuable but not everyone wants them immediately. Forcing it adds unwanted noise.

Review criteria:
- [ ] Post-import prompt offers timeline creation
- [ ] It is clearly optional — user must say yes, it doesn't happen automatically

---

#### Task G3-9: Auto-create People .md files during import

When people are imported to people.yaml, also create individual person `.md` files from the person template. Find the template in the repo. Leave unknown fields blank (not placeholder text) so they're easy to spot and fill in later.

**Why:** Skills like myna-brief-person and myna-team-health depend on individual person files — only populating the YAML leaves those skills at half capacity.

Review criteria:
- [ ] A person `.md` file is created for each imported person
- [ ] Files use the existing person template from the repo
- [ ] Unknown fields are left blank, not filled with placeholder text

---

#### Task G3-10: Create onboarding checklist in vault after setup

After setup completes, create an onboarding checklist file in the vault with remaining action items. Add one single open task to today's daily note that links to this checklist file. The user sees one task (not ten) in their dashboard and opens the file for the full list.

**Why:** Ten open tasks after setup is overwhelming. One task with a link maintains visibility without noise.

Review criteria:
- [ ] An onboarding checklist file is created in the vault at setup completion
- [ ] Exactly one task is added to today's daily note
- [ ] That task links to the checklist file

---

#### Task G3-11: Add notes email address to Integrations config

myna-setup doesn't ask for the email address used to forward notes/instructions for the DraftReplies workflow. Add this as a field in the Integrations section.

**Why:** Without this address, the DraftReplies workflow can't identify which emails to process.

Review criteria:
- [ ] Notes/forward email address field exists in the Integrations section of myna-setup
- [ ] It is saved to the appropriate config location

---

#### Task G3-12: myna-setup guided flow order should match UI

The myna-setup guided flow walks users through sections in the wrong order. Update to: Identity → Communication → People → Projects → Integrations.

**Why:** The flow and the UI should match — users who switch between them shouldn't be disoriented.

Review criteria:
- [ ] myna-setup guided flow follows: Identity → Communication → People → Projects → Integrations
- [ ] Section numbering and references within the skill are updated to match

---

#### Task G10-2: Guide routing in main agent + install sync

Add routing in the main agent so guide-related questions ("how do I use X", "what does myna do", "where's the guide") read guide.md directly. Also ensure guide.md is copied to the vault on install and kept in sync on update.

**Why:** Users ask natural questions in chat. Pointing them to docs externally breaks the in-agent experience.

Review criteria:
- [ ] Main agent routes guide-related questions to guide.md
- [ ] install.sh copies guide.md to the vault
- [ ] The myna update path also syncs guide.md

---

### Block 6 — Daily Note / Sync Skill (sequential: all edit `agents/skills/myna-sync/SKILL.md`)

#### Task G4-1: Simplify daily note structure

The daily note has grown too long — users stop reading it. Redesign to four sections only: (1) AI-generated briefing bullets (what matters most today — overdue items, prep warnings, blockers, things waiting on others), (2) today's meetings as bullets with prep status, (3) tasks due today, (4) links to dashboards. Full overdue lists, delegations, and this-week content move out of the daily note into dedicated dashboards. Create a dedicated Overdue dashboard.

**Why:** A daily note requiring scrolling stops being read. The goal is one screen that drives action.

Review criteria:
- [ ] Daily note has exactly four sections as described
- [ ] Briefing section is AI-generated signal, not a raw data list
- [ ] Overdue content is moved to a dedicated dashboard, not removed
- [ ] Dashboard links section connects to all relevant dashboards

---

#### Task G4-2: Due Today section — group by project with AI summary

Within the "Due Today" section of the daily note, group tasks by project with sub-headers. Add a one-sentence AI summary at the top of the section that surfaces key signal — not just a count, something meaningful (e.g., which project has the most, what's most urgent). Tasks without a project go under "General".

**Why:** An ungrouped task list with 10 items from 4 projects is hard to act on. Grouping reveals where to focus.

Review criteria:
- [ ] Tasks are grouped by project with sub-headers
- [ ] A meaningful one-sentence AI summary appears at the top of the section
- [ ] Ungrouped tasks go under "General"

---

#### Task G4-3: Create "Due This Week" dashboard

Create a dashboard showing tasks due in the next 7 days, excluding today and overdue items. Group by project with an AI summary line. Link it from the daily note's dashboard section.

**Why:** This content was removed from the daily note (G4-1) and needs a dedicated home.

Review criteria:
- [ ] Dashboard exists and is linked from the daily note
- [ ] Excludes today's tasks and overdue items
- [ ] Grouped by project with an AI summary

---

#### Task G4-4: Flag ownerless tasks in tasks dashboard

Add a "Needs Owner" section to the tasks dashboard (not the daily note). List tasks without an explicit owner, where they came from, and a link to the source file.

**Why:** Ownerless tasks are invisible in the current system — nobody knows they exist or where they originated.

Review criteria:
- [ ] "Needs Owner" section exists in the tasks dashboard
- [ ] It is not in the daily note
- [ ] Each entry includes where the task came from and a source file link

---

#### Task G4-5: After sync, offer meeting prep by number

After sync completes, show today's meetings as a numbered list and ask "Want me to prep any of these? Say a number or 'all'." Replace the current vague follow-up message.

**Why:** "Say 'prep for Sarah 1:1'" requires the user to type names. A numbered list lets them pick with one keystroke.

Review criteria:
- [ ] Meetings are shown as a numbered list after sync completes
- [ ] The prompt asks the user to pick by number or say 'all'

---

### Block 7 — Skill Behaviors

#### Task G6-1: Unknown people in capture go to review queue automatically

When a capture mentions someone not in People config, Myna currently asks inline and blocks the capture. Fix: complete the capture without blocking, then automatically add a review queue item for the unknown person.

**Why:** Users miss the inline question. The capture is lost or delayed. Completing first and reviewing later is the better flow.

Review criteria:
- [ ] The capture completes even when an unknown person is mentioned
- [ ] A review queue item is automatically created for the unknown person
- [ ] The user is not blocked inline

---

#### Task G6-2: Distinguish project tasks from delegations

Two different things are both being created as delegations: (a) a project task owned by someone else from the start, and (b) a user handing off their own responsibility. Fix: only create a delegation when the user uses explicit delegation language ("delegate this to X"). When a user specifies a project AND a person for a task without delegation language, create a project task with that person as owner.

**Why:** These are structurally different things. Conflating them makes it impossible to track what the user actually owns vs. what others own.

Review criteria:
- [ ] Explicit delegation language ("delegate to X") creates a delegation
- [ ] Project + person without delegation language creates a project task with owner field set
- [ ] The two produce structurally different output

---

#### Task G6-3: Email processing — attempt extraction on all emails

Email processing currently skips certain email types (meeting forwards, Asana notifications, Zoom recordings). Fix: attempt extraction on every email. Only skip writing to the vault if nothing substantive is found (no task, decision, observation, or timeline update). File as processed silently if nothing is extracted.

**Why:** Teams use meeting forwards and Asana notifications for substantive updates. Skipping them loses real data.

Review criteria:
- [ ] No email types are pre-filtered before extraction is attempted
- [ ] Writing to vault is skipped only when extraction yields nothing substantive
- [ ] Silent processing (no user prompt) when nothing is extracted

---

#### Task G6-4: Move processed emails after extraction

After processing emails from a project folder, investigate whether the email MCP supports moving or updating emails. If yes, move processed emails to a processed subfolder. If not, fall back to marking them as read. Don't ask the user mid-flow — do the best available action and note what happened at the end.

**Why:** Without a post-processing action, users have no visual indicator of what's been processed and the same emails get re-processed.

Review criteria:
- [ ] Processed emails are moved or marked read based on MCP capability
- [ ] No mid-flow decision prompt is shown to the user
- [ ] A note at the end of processing states what action was taken and why

---

### Block 8 — Meetings Skills

#### Task G7-1: Include video call link in meeting prep files

Meeting prep files don't include the Zoom/Google Meet/Teams link from the calendar invite. The prep skill already reads calendar event data. Extract the video call URL from the location field or conferenceData and include it in the prep file header.

**Why:** Users open the prep file to get ready for a meeting and have to go back to the calendar for the link. One extra step kills the workflow.

Review criteria:
- [ ] Video call URL appears in the prep file header
- [ ] It is extracted from existing calendar event data (no new API calls)
- [ ] Handles the case where no video URL is present gracefully

---

#### Task G7-2: Adhoc meeting file naming — date first

Adhoc meeting files are currently named `meeting-title-date.md`. Change to `date-meeting-title.md` (e.g., `2026-04-23-design-review.md`) so files sort chronologically in Obsidian's file explorer.

**Why:** With title-first naming, meetings from different dates are grouped by topic, not time. Date-first makes the file list a chronological log.

Review criteria:
- [ ] New adhoc meeting files follow `date-meeting-title.md` format
- [ ] Existing file references or links in the skill account for the new naming

---

### Block 9 — Task Movement Bug

#### Task G8-1: Moving a task should not cross it off

When a task is moved to a new date, Myna currently crosses off the task in the original daily note, adds it to the new daily note also crossed off, and shows it struck through in the tasks dashboard. Fix: moving a task updates its date, not its completion status. The old daily note entry should be removed or shown as "moved to [date]" without strikethrough. The task appears as open in the new daily note and tasks dashboard.

Additionally, whenever any task field changes (date, owner, project, status), append a change log entry to the task's notes (e.g., "ECD changed: 04/23 → 04/30").

**Why:** Crossed-off moved tasks look complete. Users think work is done when it's just rescheduled. This is a data-loss bug.

Review criteria:
- [ ] Moved tasks appear as open (unchecked) in the new date
- [ ] Old daily note entry is removed or shows "moved to [date]" without strikethrough
- [ ] Tasks dashboard shows moved task as open
- [ ] Any field change (date, owner, project, status) appends a change log entry

---

### Block 10 — 1:1 Dashboard

#### Task G9-1: 1:1 dashboard — split action items by assignee

The Open Action Items and Overdue Action Items sections in the 1:1 dashboard mix items assigned to the user with items assigned to the other person. Split each into two sub-sections: "Assigned to me" and "Assigned to others."

**Why:** Mixed action items make it unclear what the user personally needs to do before a 1:1.

Review criteria:
- [ ] Open Action Items has "Assigned to me" and "Assigned to others" sub-sections
- [ ] Overdue Action Items has the same split
- [ ] Assignment is determined correctly from task metadata

---

### Block 11 — Docs Revamp

#### Task G10-3: Revamp README and guide.md with progressive disclosure

Both README.md and guide.md currently dump all features upfront — overwhelming for first-time readers. Restructure with progressive disclosure: lead with what Myna is and why it matters (value in 30 seconds), then walk through it with concrete examples, then go deeper. Find both files before editing.

**Why:** A new reader who can't find the value in 30 seconds closes the tab.

Review criteria:
- [ ] README opens with a value statement, not a feature list
- [ ] A new reader can understand what Myna does in ~30 seconds from the top
- [ ] guide.md teaches progressively — simple first, advanced later
- [ ] No information is removed — just reordered and clarified

---

### Block 12 — Obsidian Formatting Audit (run LAST, after all other blocks complete)

This block audits the final state of all skill files. It must run after everything else.

#### Task G5-1: Fix tag formatting in timeline bullets

Timeline bullets across skills use adjacent tags like `[Auto][Zoom: ...]`. Obsidian treats adjacent bracket-enclosed segments as hyperlinks, hiding the second tag. Fix: add a space between adjacent tags, and move all tags to the end of the line so content reads first. Search the entire codebase — grep for the pattern — and fix every instance.

**Why:** Adjacent tags corrupt Obsidian rendering. The second tag disappears visually.

Review criteria:
- [ ] No adjacent tags without a space between them in any skill output template
- [ ] All tags appear at the end of their lines, after the content

---

#### Task G5-2: Fix wikilinks — always use full relative paths

Any wikilink without a full path (e.g., `[[marcus-walker]]`) causes Obsidian to create a new empty file instead of linking to the existing one. Fix: all wikilinks must use full relative paths (e.g., `[[People/marcus-walker]]`). Search the entire codebase and fix every instance.

**Why:** Short wikilinks silently create empty files in the vault root, cluttering the file tree and breaking navigation.

Review criteria:
- [ ] No wikilinks without full relative paths in any skill file
- [ ] All wikilinks follow the `[[Folder/filename]]` pattern

---

#### Task G5-3: Enforce wikilink format in output steering skill

Add a rule to the output steering skill: when referencing a vault file in chat output, always use wikilink format `[[path/to/file]]`, never plain file paths (which open in Chrome instead of Obsidian). After adding the rule, audit other skill files for compliance.

**Why:** Plain paths in chat output open in the browser. Users expect vault file references to open in Obsidian.

Review criteria:
- [ ] Steering output skill has an explicit wikilink format rule for chat output
- [ ] No plain paths used where wikilinks should be, across audited skill files

---

### Block 13 — Morning Test Guide (run LAST, after Block 12)

#### Task G-TEST: Write morning test guide for all changes

After all other tasks are committed, write a test guide to `docs/temp/morning-test-guide.md`. This guide is what the user will follow tomorrow morning before launching — it should take 20–30 minutes to run through completely.

The guide tests the changes from this session using:
- **Project:** ABC
- **Person:** XYZ

**How to write this guide:**
1. Read the git log for this branch to see every change made
2. Group tests by area — don't write a test per commit, write a test per user-facing behavior
3. For each area: write the exact prompt to type into Myna, then describe what correct output looks like
4. Include regression tests — core workflows that weren't the focus of this session but could have been accidentally broken
5. Use checkboxes so the user can tick off as they go
6. Keep it right-sized: enough to catch real issues, not so exhaustive it takes all day

**Structure the guide as:**

1. **Pre-flight** — things to verify before starting (branch is merged, vault path is set, MCPs connected)
2. **Install & Setup** — test the install changes (next steps order, config file templates, myna update, alias, checklist)
3. **Config UI** — open the UI, walk through each section (nav order, integrations default, auto-save, light/dark mode, right panel, chip inputs, Key People with "XYZ", all visual polish)
4. **myna-setup guided flow** — run /myna-setup, verify section order, try importing a pasted doc, verify relationship_tier behavior
5. **Daily sync** — run sync, verify 4-section structure, verify meeting prompt as numbered list, check Due Today grouping under "ABC"
6. **Capture & tasks** — capture a task for ABC assigned to XYZ, try moving it to a new date, mention someone not in People config
7. **Meetings** — run meeting prep for a real meeting, verify video call URL in header, check adhoc meeting file naming
8. **Wikilinks & formatting** — generate a person brief for XYZ and a project brief for ABC, check wikilink paths and tag formatting in any timeline output
9. **Regression checks** — a short set of prompts to confirm core workflows still work end-to-end: sync, capture, person brief, project brief, email processing prompt (just verify the flow starts correctly, not full send)

For each test, write:
- The exact text to type into Myna
- What to look for in the response (specific, not vague — "wikilinks use full paths like `[[People/xyz]]`" not "output looks correct")
- A checkbox to tick when passing

**Commit this file separately** with message: `docs(G-TEST): add morning test guide for beta launch`

Review criteria:
- [ ] Guide covers all major areas changed in this session
- [ ] Each test has an exact prompt and a specific success condition
- [ ] Regression tests cover sync, capture, person brief, project brief
- [ ] Checkboxes present throughout — user can tick as they go
- [ ] Estimated time is 20–30 minutes total
- [ ] Uses "ABC" and "XYZ" as placeholders throughout

---

## Review discipline

Review criteria under each task are a starting point. The coordinator and each subagent should also apply their own judgment — if something looks wrong or incomplete beyond what the criteria cover, flag it. A clean review is valid. Only stop on things that would actually break something or produce wrong output.

## Quality checks

After all blocks complete, verify:
- `grep -r "difficult_message_approach" agents/` returns nothing
- Daily note skill has exactly four sections
- Config UI has no explicit Save buttons
- All wikilinks in skill files use full relative paths

## Final push

After all task commits and the prompt file commit are done:

```
git push -u origin fix/beta-testing-improvements
```

The user will run the morning test guide and merge to `beta` if everything passes.

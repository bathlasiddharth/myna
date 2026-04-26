# Myna Post-Install Checklist

Complete these steps to finish setting up Myna.

## 1. Activate Shell Aliases

Run this to activate the `myna` command:

- [ ] `source ~/.zshrc` (or `source ~/.bashrc` if using bash)

## 2. Install Obsidian Plugins

Open Obsidian → Settings → Community Plugins → Browse. Install:

- [ ] Dataview — powers all dashboard queries
- [ ] Tasks — task tracking with due dates, priorities, and metadata
- [ ] Periodic Notes — daily and weekly note creation
- [ ] Templater — template rendering for new files

## 3. Open Your Vault

- [ ] Open Obsidian
- [ ] Click "Open folder as vault"
- [ ] Select your vault path (the one you provided during install)

## 4. Register External MCP Servers with Claude Code *(optional)*

If you use Gmail, Slack, or Google Calendar MCP servers, register their binaries with Claude Code now. This is a one-time OS-level step that makes the server available to Claude Code — it is not Myna configuration.

- [ ] Gmail: `claude mcp add gmail-mcp -- <your-gmail-mcp-command>`
- [ ] Slack: `claude mcp add slack-mcp -- <your-slack-mcp-command>`
- [ ] Google Calendar: `claude mcp add gcal-mcp -- <your-gcal-mcp-command>`

Skip this if you don't have MCP servers installed yet. Myna works without them — features that need them degrade gracefully. When you run `/myna:setup` in the next step, it will ask which server names to use.

## 5. Configure Myna

Option A: Run `/myna:setup` and choose "Open config UI" for a visual editor.
Option B: Run `/myna:setup` for a guided chat interview.
Option C: Edit the files directly:

- [ ] `myna/_system/config/workspace.yaml` — your name, email, timezone, enable/disable features
- [ ] `myna/_system/config/projects.yaml` — active projects you want Myna to track
- [ ] `myna/_system/config/people.yaml` — direct reports, peers, manager, key cross-team contacts
- [ ] `myna/_system/config/meetings.yaml` — meeting type overrides (optional)
- [ ] `myna/_system/config/communication-style.yaml` — your tone preference and feedback approach

**Custom routing (advanced).** `~/.myna/custom-routing.md` is available for routing rules if you add your own skills. It is never overwritten by updates. Most users won't need this right away — it's there when you do.

## 6. Verify

- [ ] Run `myna` in your terminal
- [ ] Type: `what can you do?`
- [ ] You should see a list of 24 skills

---

## 7. Configure Obsidian Settings *(optional)*

This step is not required for Myna to function — it only improves the Obsidian experience (correct template paths, dashboard queries, and plugin behaviour). Skip it if you chose automatic configuration during install, or come back to it later.

Go to Settings in Obsidian and configure:

- [ ] **Daily Notes** — folder: `myna/Journal/Daily`, template: `myna/_system/templates/daily-note`
- [ ] **Periodic Notes** — enable weekly notes, folder: `myna/Journal/Weekly`, template: `myna/_system/templates/weekly-note`
- [ ] **Dataview** — enable Dataview JS and inline queries (Settings → Dataview)
- [ ] **Templates** — template folder: `myna/_system/templates`

---

See [guide.md](docs/guide/guide.md) for the full user guide.

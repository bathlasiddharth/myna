# Myna Post-Install Checklist

Complete these steps to finish setting up Myna.

## 1. Activate Shell Aliases

Run this to activate the `myna`, `myna-ro`, and `myna-x` commands:

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

## 4. Configure Obsidian Settings

*(Skip this section if you chose automatic configuration during install.)*

Go to Settings in Obsidian and configure:

- [ ] **Daily Notes** — folder: `myna/Journal/Daily`, template: `myna/_system/templates/daily-note`
- [ ] **Periodic Notes** — enable weekly notes, folder: `myna/Journal/Weekly`, template: `myna/_system/templates/weekly-note`
- [ ] **Dataview** — enable Dataview JS and inline queries (Settings → Dataview)
- [ ] **Templates** — template folder: `myna/_system/templates`

## 5. Connect External MCP Servers

Myna reads email, Slack, and calendar via MCP servers. Register them with Claude Code:

- [ ] Gmail: `claude mcp add gmail-mcp -- <your-gmail-mcp-command>`
- [ ] Slack: `claude mcp add slack-mcp -- <your-slack-mcp-command>`
- [ ] Google Calendar: `claude mcp add gcal-mcp -- <your-gcal-mcp-command>`

Myna works without these — features that need them degrade gracefully.

## 6. Fill In Your Config Files

Open each file in your vault and fill in your details:

- [ ] `myna/_system/config/workspace.yaml` — your name, email, timezone, enable/disable features
- [ ] `myna/_system/config/projects.yaml` — active projects you want Myna to track
- [ ] `myna/_system/config/people.yaml` — direct reports, peers, manager, key cross-team contacts
- [ ] `myna/_system/config/meetings.yaml` — meeting type overrides (optional)
- [ ] `myna/_system/config/communication-style.yaml` — your tone preference and feedback approach

## 7. Verify

- [ ] Run `myna` in your terminal
- [ ] Type: `what can you do?`
- [ ] You should see a list of 24 skills

---

See [guide.md](guide.md) for the full user guide.

# Myna Post-Install Checklist

Complete these steps to finish setting up Myna after running `/plugin install myna@agentflock`.

## 1. Run First-Time Setup

- [ ] In Claude Code, run `/myna:init` — creates the vault directory structure and writes `~/.myna/config.yaml`
- [ ] When `/myna:init` finishes, run `/myna:setup` — guided configuration for identity, projects, people, and communication style
- [ ] (Optional) Add a shell alias: `alias myna="claude --agent myna:agent"` to your `~/.zshrc` or `~/.bashrc`, then `source` it

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

Skip this if you don't have MCP servers installed yet. Myna works without them — features that need them degrade gracefully. When you run `/myna:setup`, it will ask which server names to use.

## 5. Configure Myna

If you didn't complete configuration during step 1, run `/myna:setup` now. Three input modes are available:

Option A: Run `/myna:setup` and choose "Open config UI" for a visual editor.
Option B: Run `/myna:setup` for a guided chat interview.
Option C: Edit the files directly:

- [ ] `myna/_system/config/workspace.yaml` — your name, email, timezone, enable/disable features
- [ ] `myna/_system/config/projects.yaml` — active projects you want Myna to track
- [ ] `myna/_system/config/people.yaml` — direct reports, peers, manager, key cross-team contacts
- [ ] `myna/_system/config/meetings.yaml` — meeting type overrides (optional)
- [ ] `myna/_system/config/communication-style.yaml` — your tone preference and feedback approach

**Customization files (good to know).** `~/.myna/overrides/routing.md` is available for routing rules if you add your own skills. Per-skill overrides go in `~/.myna/overrides/skills/myna-{skill-name}.md`. Neither is overwritten by plugin updates. Most users won't need these right away.

## 6. Verify

- [ ] In Claude Code, type: `what can you do?`
- [ ] You should see a list of 24 skills
- [ ] Or if you set the shell alias: run `myna` in your terminal and type the same

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

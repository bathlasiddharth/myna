# Obsidian Setup Guide

Post-install guide for configuring Obsidian to work with Myna.

## Required Plugins

Install and enable these four community plugins (Settings → Community plugins → Browse):

| Plugin | What Myna uses it for |
|--------|----------------------|
| **Dataview** | Powers all dashboard queries — required for every dashboard |
| **Tasks** | Task tracking with due dates, priorities, and metadata |
| **Periodic Notes** | Creates daily and weekly notes on schedule |
| **Templater** | Renders templates when creating new files |

## Opening Your Vault

1. Open Obsidian
2. Click **Open folder as vault**
3. Navigate to and select your vault path (the folder passed to `--vault-path` during install)
4. Click **Open**

## Dashboards

Dashboards live in the `Dashboards/` folder of your vault. Open any `.md` file there to view it. All dashboards require the Dataview plugin to be installed and enabled.

| Dashboard | What it shows |
|-----------|---------------|
| **Home** | Daily command center — today's meetings, open tasks, active blockers |
| **Tasks** | All open tasks, overdue items, delegated tasks |
| **Projects** | Active projects, status, and open tasks per project |
| **1:1s** | Direct reports, action items, overdue items |
| **People** | All people, pending feedback, open items |
| **Meetings** | This week's meetings, unprocessed debriefs, recurring meetings |
| **Inbox** | Reply-needed emails, delegations, review queue |
| **Blockers** | Active blockers by project, overdue dependencies |
| **Delegations** | All delegated tasks grouped by person |
| **Weekly** | This week's tasks, completed items, weekly notes |

## Obsidian Settings

Configure these manually after opening the vault (Settings → Core plugins or the relevant plugin settings):

**Daily Notes** (Settings → Daily notes)
- Folder: `myna/Journal/Daily`
- Template: `myna/_system/templates/daily-note`

**Periodic Notes** (Settings → Periodic Notes)
- Enable weekly notes
- Weekly folder: `myna/Journal/Weekly`
- Weekly template: `myna/_system/templates/weekly-note`

**Dataview** (Settings → Dataview)
- Enable Dataview JS queries
- Enable inline queries

**Templates** (Settings → Templates)
- Template folder: `myna/_system/templates`

## Vault Structure

| Folder | Purpose |
|--------|---------|
| `myna/Projects/` | One file per project |
| `myna/People/` | One file per person |
| `myna/Meetings/` | 1-1s, Recurring, and Adhoc subfolders |
| `myna/Journal/` | Daily and weekly notes |
| `myna/Dashboards/` | The 10 Myna dashboards |
| `myna/_system/` | Config, templates, and setup checklist |

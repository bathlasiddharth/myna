---
name: blockers
disable-model-invocation: true
description: Scan all active projects for blockers — explicit blocker callouts in project timelines, overdue dependency tasks, and overdue tasks. Invoke for "what's blocked?", "show me blockers", "any blockers across projects?".
user-invocable: true
argument-hint: "[optional: project name to scope to one project]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:init` and stop.

# Blocker Detection

Scans active projects for blockers and surfaces them inline. Read-only — no vault writes. Informational only — no auto-escalation.

---

## What Counts as a Blocker

Three signal types, checked in this order:

**1. Explicit blocker callouts in project timelines**

Timeline entries in `> [!warning] Blocker` callout blocks.

Grep: `\[!warning\] Blocker`

**2. Overdue dependency tasks**

Open tasks with `[type:: dependency]` where the due date has passed.

Grep: `- \[ \] .* \[type:: dependency\]` — filter for `📅` dates before today.

**3. Overdue tasks**

Open tasks with a due date before today.

Grep: `- \[ \]` in project files — filter for lines containing `📅 {date}` where date is before today.

---

## Scope

Default: scan all projects with `status: active` in the project registry (`_system/config/projects.yaml`).

If the user names a specific project: scope to that project only.

Read each active project's file following vault-ops path conventions (`Projects/{slug}.md`).

---

## Output

```
## Blockers — [date]

[Count] blockers across [N] projects.

---

### [Project Name]

**[Blocker description]**
[date | source] [details] [[provenance]]
Age: [X days since logged]
Type: [callout | dependency task | overdue task]
Source: [filename, entry]

---

### [Another Project]
...
```

If no blockers found:

```
No open blockers across [N] active projects.
```

After output, suggest: "Say 'escalate this blocker' to draft a message via `/myna:draft`."

---

## Edge Cases

- **No active projects:** "No active projects found. Update project statuses in projects.yaml if needed."
- **Project file missing for an active project:** Skip it, note: "Skipped [project] — project file not found."
- **Scoped to one project with no blockers:** "[Project Name]: no open blockers."

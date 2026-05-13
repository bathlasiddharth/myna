---
name: blockers
disable-model-invocation: true
description: Scan the entire vault for blockers — explicit blocker callouts and overdue tasks. Separates your blockers from tasks assigned to others. Invoke for "what's blocked?", "show me blockers", "any blockers?".
user-invocable: true
argument-hint: "[optional: scope to a specific file or folder]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

Read `user.name` from config — needed to separate your tasks from delegated ones.

# Blocker Detection

Scans the entire vault for blockers and surfaces them inline. Read-only — no vault writes. Informational only — no auto-escalation.

---

## What Counts as a Blocker

Two signal types:

**1. Explicit blocker callouts**

Grep across `{vault_path}/myna/**/*.md`:
`\[!warning\] Blocker`

**2. Overdue tasks**

Grep across `{vault_path}/myna/**/*.md`:
`- \[ \].*📅 \d{4}-\d{2}-\d{2}`

Filter results for dates before today. ISO date format sorts lexicographically — compare string directly against today's date.

---

## Scope

Default: Myna-managed files only (`{vault_path}/myna/**/*.md`).

If the user scopes to a specific file or folder under `myna/`: limit the grep to that path.

---

## Deduplication

The same blocker or task may appear multiple times — across files, or matching more than one signal type. After collecting all results:

- Match tasks by their text content (the content after `- [ ]`, stripped of metadata).
- If the same task text appears in multiple files, keep only one instance. Prefer the `Projects/` file over meeting files; prefer meeting files over other sources.
- If the same task matches multiple signals, keep only the most specific: signal 1 (callout) is always kept separately as it carries source context; signal 2 (overdue) is deduplicated against callouts if the same task appears in both.
- Apply deduplication before grouping.

---

## Grouping by Project

After deduplication, assign each result to a project:

- If the source file is `Projects/{slug}.md` — assign to that project.
- If the task has a `[project:: {name}]` field — assign to that project.
- Otherwise — assign to **Other**.

Within each section (Your Blockers / Delegated), group results under project headings. Tasks with no project association go under **Other** at the end.

---

## Separating Your Blockers from Delegated

For each task result, check for a `[person:: {name}]` field. The person value may be a plain name (`[person:: Sarah Chen]`) or a wiki-linked name (`[person:: [[Sarah Chen]]]`) — normalize by stripping `[[` and `]]` before comparing.

- If `person` matches `user.name` from config, or no person field is present: treat as **your blocker**.
- If `person` is someone else: treat as **delegated blocker** (waiting on them).

Blocker callouts are always listed under your blockers unless they explicitly name another owner.

---

## Output

For blocker callouts (signal 1), parse the callout body (`[date | source] description`) and render the source in plain English — e.g., "from 1:1 with Sarah on Apr 10", "from email from James on Mar 28", "from Slack #auth-team on Apr 5".

```
## Blockers — [date]

### Summary

[N] blockers — [X] yours, [Y] delegated.

[Project A]: [N] blocked
[Project B]: [N] overdue ([X] days)
Other: [N] blocked

---

### Your Blockers

#### [Project Name]

**[description]**
[From 1:1 with Sarah on Apr 10 | file path]
[Due: date | X days overdue]

#### Other

**[description]**
[From email from James on Mar 28 | file path]
[Due: date | X days overdue]

---

### Delegated — Waiting on Others

#### [Project Name]

**[description]**
Owner: [name]
[From Slack #auth-team on Apr 5 | file path]
[Due: date | X days overdue]

#### Other

**[description]**
Owner: [name]
[From Slack #auth-team on Apr 5 | file path]
[Due: date | X days overdue]
```

If no blockers found:

```
No open blockers found across the vault.
```

---

## Edge Cases

- **No vault files found:** "Vault not found at `{vault_path}`. Check your config."
- **No results from any signal type:** "No open blockers found across the vault."
- **Task with no owner:** Treat as your blocker.
- **Scoped to a path with no results:** "[Path]: no open blockers."

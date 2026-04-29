# Customization Guide

Customize existing skills, add new ones, and define routing rules — all preserved across plugin updates.

## Three Mechanisms

### 1. Per-Skill Overrides — Modify an Existing Skill

To change the behavior of a built-in skill, create an override file at:

```
~/.myna/overrides/skills/myna-{skill-name}.md
```

For example, to customize the sync skill:

```
~/.myna/overrides/skills/myna-sync.md
```

The agent reads this file before the built-in skill content. When the override conflicts with the built-in, the override wins. You don't need to copy the full skill — just write the parts you want to change or add.

This file is not created by `/myna:init`. Create it yourself when you want to customize a skill.

**Examples:**

Add an extra step to your morning sync:
```markdown
After creating the daily note, also read ~/standup-notes.md and append
any items from today to the daily note's Tasks section.
```

Change how email triage categorizes messages:
```markdown
Override the default folder categories. Use these instead:
- Urgent — needs response today
- This Week — needs response this week
- FYI — no response needed, just awareness
- Delegate — forward to a direct report
```

### 2. User Skills — Add New Capabilities

Name your folder `myna-[yourprefix]-[skillname]`. The pattern `myna-[singleword]` (e.g., `myna-sync`, `myna-draft`) is reserved for built-in skills — your custom skills need at least two words after `myna-`.

```
~/.claude/skills/myna-amazon-oncall/SKILL.md      (good)
~/.claude/skills/myna-acme-standup/SKILL.md        (good)
~/.claude/skills/myna-oncall/SKILL.md              (bad — reserved pattern)
```

Your skill file needs YAML frontmatter with at least `name` and `description`:

```yaml
---
name: myna-amazon-oncall
description: |
  Oncall management — check who's on call, escalate issues,
  hand off context at rotation boundaries.
user-invocable: true
argument-hint: "[escalate | handoff | status]"
---

# My Oncall Skill

[Your skill instructions here]
```

The `description` field matters — make it specific and include the phrases you'd naturally use.

After creating a skill, add routing rules to `~/.myna/overrides/routing.md` so the agent knows exactly when to use it (see below).

### 3. Routing Overrides

When you add a new skill, tell the agent when to use it by adding rules to `~/.myna/overrides/routing.md`. This is more reliable than relying on auto-discovery alone — with 30+ skills, explicit routing prevents misroutes. You can also use this file to adjust how Myna dispatches to built-in skills.

This file is seeded by `/myna:init` if it doesn't exist yet. Add your rules below the comments:

```markdown
### Oncall Routing

- "who's on call?", "oncall status", "page someone" → myna-amazon-oncall
- "escalate this", "this is urgent" → myna-amazon-oncall (not myna-draft)

If the user mentions oncall, paging, or escalation → always myna-amazon-oncall.
```

Rules in this file take precedence over Myna's built-in routing.

## What Happens on Update

| File | On update |
|---|---|
| Built-in `SKILL.md` (e.g., `myna-sync/SKILL.md`) | **Overwritten** — always gets the latest version |
| `~/.myna/overrides/` and all files under it | **Preserved** — never touched by plugin updates |
| Your user skill directories (e.g., `myna-amazon-oncall/`) | **Never touched** |
| Vault data and configs | **Never touched** |

## Precedence

When custom content conflicts with upstream:

1. `~/.myna/overrides/skills/myna-{skill-name}.md` overrides the matching built-in skill
2. `~/.myna/overrides/routing.md` overrides Myna's built-in routing rules

## Tips

- **Start with a skill override** for small tweaks. Only create a new user skill if you need a fundamentally new capability.
- **Write good descriptions** for user skills. Claude Code's auto-discovery depends entirely on the `description` field matching user intent.
- **Always add routing rules** for new skills. With 30+ skills competing, explicit routing is more reliable than relying on description matching alone.
- **Test after updating.** Updates overwrite built-in `SKILL.md` files. If your override referenced specific behavior from the upstream skill, verify it still works after an update.

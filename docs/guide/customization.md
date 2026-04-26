# Customization Guide

Customize existing skills, add new ones, and define routing rules — all preserved across updates.

## Three Mechanisms

### 1. CUSTOM.md — Modify an Existing Skill

Every skill directory (`~/.claude/skills/myna-*/`) contains a `CUSTOM.md` file created during install. Add your overrides there.

```
~/.claude/skills/myna-sync/
├── SKILL.md       ← upstream, overwritten on update
└── CUSTOM.md      ← yours, never touched by updates
```

Claude Code loads both files for the skill. When they conflict, `CUSTOM.md` wins.

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

After creating a skill, add routing rules to `~/.myna/custom-routing.md` so the agent knows exactly when to use it (see below).

### 3. Custom Routing Rules

When you add a new skill, tell the agent when to use it by adding rules to `~/.myna/custom-routing.md`. This is more reliable than relying on auto-discovery alone — with 30+ skills, explicit routing prevents misroutes.

The file is created during install. Add your rules below the comments:

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
| `CUSTOM.md` in built-in skill directories | **Preserved** — never touched |
| `custom-routing.md` at `~/.myna/` | **Preserved** — never touched |
| Your custom skill directories (e.g., `myna-amazon-oncall/`) | **Never touched** |
| Vault data and configs | **Never touched** |

## Precedence

When custom content conflicts with upstream:

1. `CUSTOM.md` overrides its skill's `SKILL.md`
2. `custom-routing.md` overrides Myna's built-in routing rules

## Tips

- **Start with CUSTOM.md** for small tweaks. Only create a new skill if you need a fundamentally new capability.
- **Write good descriptions** for user skills. Claude Code's auto-discovery depends entirely on the `description` field matching user intent.
- **Always add routing rules** for new skills. With 30+ skills competing, explicit routing is more reliable than relying on description matching alone.
- **Test after updating.** Updates overwrite `SKILL.md` files. If your `CUSTOM.md` referenced specific line numbers or section names from the upstream skill, verify they still match.

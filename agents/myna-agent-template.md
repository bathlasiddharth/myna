# Myna Agent Template

Reference template for creating a Myna-like agent using Claude Code's native skills architecture.

---

## Agent File Structure

The agent file lives at `~/.claude/agents/{name}.md` and has two parts: YAML frontmatter and a markdown body.

### Frontmatter

```yaml
---
name: {agent-name}
description: {one-line description}
skills:
  - {steering-skill-1}
  - {steering-skill-2}
---
```

| Field | Required | Purpose |
|---|---|---|
| `name` | Yes | Agent name, used with `claude --agent {name}` |
| `description` | Yes | One-line description shown in agent listings |
| `skills` | No | Steering skills to preload at session start (always in context) |
| `model` | No | Override the default model (omit to inherit session default) |
| `tools` | No | Tool restrictions (omit to allow all) |
| `mcpServers` | No | MCP servers to enable (omit to use all registered servers) |
| `permissionMode` | No | Permission mode override (omit to inherit) |
| `memory` | No | Memory settings (omit to inherit) |

Keep frontmatter minimal — omit fields to inherit sensible defaults. Adding fields is cheap; removing documented fields later is harder.

### Body Structure

```markdown
# {Agent Name}

Identity paragraph: who the agent is, what it does, core principles.

## Session Start

What to read and verify on first message.

## Skill Directory

Table of all feature skills with # / name / one-line description.

## Routing Logic

Intent-based routing guidance for edge cases.
Claude Code's auto-invocation handles most routing from skill descriptions.

## Direct Operations

Simple operations the main agent handles without activating a skill.

## Rules

Brief reminders of critical rules (full details in steering skills).
```

---

## Skill File Structure

Each skill lives in `~/.claude/skills/{skill-name}/SKILL.md`.

### Skill Frontmatter

```yaml
---
name: {skill-name}
description: {description that Claude Code uses for auto-invocation matching}
user-invocable: true
argument-hints: "{example arguments}"
---
```

| Field | Required | Purpose |
|---|---|---|
| `name` | Yes | Skill name (matches directory name) |
| `description` | Yes | Used by Claude Code to match user requests — make it specific and action-oriented |
| `user-invocable` | Yes | `true` for feature skills (user can invoke), `false` for steering skills (preloaded) |
| `argument-hints` | No | Example arguments shown to user (feature skills only) |

### Skill Body Structure

Feature skills follow this section structure:

```markdown
# {Skill Name}

## Purpose
What this skill does and when to use it.

## Triggers
Example invocations — natural language phrases that activate this skill.

## Inputs
What the skill reads: config files, vault files, MCP tools.

## Procedure
Step-by-step instructions for the agent to follow.

## Output
What the skill produces: vault writes, inline output, follow-up suggestions.

## Rules
Skill-specific rules and constraints.

## Worked Example
Concrete input → output example showing the full flow.
```

Steering skills are free-form — they contain rules organized by topic, not a procedure.

---

## Placeholders

The install script substitutes these placeholders in the agent file:

| Placeholder | Replaced with |
|---|---|
| `{{VAULT_PATH}}` | Absolute path to the user's Obsidian vault |
| `{{SUBFOLDER}}` | Myna subfolder name (default: `myna`) |

Use these in all vault path references in the agent body. Skills reference vault paths by reading config files at runtime, not through placeholders.

---

## Design Principles

1. **Route by intent, not keywords.** Skill descriptions should be specific enough for Claude Code's auto-invocation to match correctly. The agent body only needs routing guidance for edge cases.
2. **Progressive disclosure.** Only skill names and descriptions are in context at startup. Full skill content loads on demand. This keeps the context window lean.
3. **Steering skills for cross-cutting rules.** Rules that every skill must follow go in steering skills preloaded via `skills:` frontmatter — not inlined in the agent body.
4. **Direct operations for simple tasks.** If an operation is a single file read/write with no complex logic, handle it in the agent body without a skill.
5. **Config-driven, not hard-coded.** Personal data lives in config files read at session start, never in the agent or skill files.
6. **Idempotent install.** The install script should be safe to re-run: overwrite agent+skills (update), preserve user config (never overwrite).

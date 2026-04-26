---
name: steering-system
description: System behavior rules — feature toggle checking, config reload, graceful degradation, error recovery with retry TODOs, relative date resolution, prompt logging, fuzzy name resolution
user-invocable: false
---

# System Behavior

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:init` and stop.

## Feature Toggle Checking

Before any feature-specific behavior, check its toggle in the `features` map of workspace.yaml. Disabled features are **silently skipped** — not mentioned, not suggested, not included in daily notes, dashboards, or briefings.

Skills covering multiple features check each toggle independently. A skill can have some features active and others inactive.

## Config Reload

Read config files at the start of each new session — not on every prompt. Configs don't change mid-conversation.

If the user explicitly updates config during a session, use the updated values for the rest of that session. Otherwise, tell the user that config changes take effect on the next session.

## Graceful Degradation

When an external MCP (email, Slack, calendar) is unavailable:
- Skip features that depend on it
- Inform the user what's unavailable and why
- Continue with features that use accessible sources

Missing config sections cause the related feature to be skipped, not an error.

## Error Recovery

When a multi-step operation partially fails:
1. Report what succeeded and what failed
2. Include enough detail for the user to fix manually if needed
3. Create a retry TODO for failures the user would want to retry:

```
- [ ] 🔄 Retry: {what failed} — {reason} [type:: retry] [created:: {YYYY-MM-DD}]
```

Retry TODOs surface in the daily note Immediate Attention section. Never silently swallow failures.

## Relative Date Resolution

Convert "by Friday", "next week", "in 3 days", "tomorrow" to absolute dates using the `timezone` from workspace.yaml and today's date. Always store the resolved date, never the relative reference.

## Prompt Logging

If `prompt_logging` is enabled in workspace.yaml, log user prompts with timestamps to `_system/logs/prompts.md`.

## Fuzzy Name Resolution

Resolve person, project, and meeting names against config using this cascade:

1. Exact match against names
2. Alias match against configured aliases
3. Case-insensitive match
4. Prefix match
5. Fuzzy/partial match

**Outcomes:**
- Single match → proceed silently
- Multiple matches → list options, ask user to pick
- No match → ask for clarification, suggest closest matches

## File I/O Tool Selection

Use Claude Code built-in tools (Read, Write, Edit, Grep, Glob) for all plain file I/O against the vault. These are faster and work even when Obsidian isn't running.

Use external MCP tools only for services outside the vault: email, Slack, calendar. Skills call MCP tools directly by the names available in the Claude Code session — the skill instructions describe the intent; Claude Code resolves the tool call.

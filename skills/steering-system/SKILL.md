---
name: steering-system
disable-model-invocation: true
description: System behavior rules — config reload, graceful degradation, error recovery with retry TODOs, relative date resolution, prompt logging, fuzzy name resolution
user-invocable: false
---

# System Behavior

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

## Feature Toggle Checking

Feature gates are checked by the agent before dispatching to a skill — not inside individual skills. Skills do not re-check toggles.

When the agent is about to invoke a gated skill and the toggle is off, it asks the user whether to enable it and writes the toggle to `workspace.yaml` on confirmation. Skills run once dispatched — they do not silently skip based on toggles.

## Config Reload

Read config files at the start of each new session — not on every prompt. Configs don't change mid-conversation.

If the user explicitly updates config during a session, use the updated values for the rest of that session. When the agent itself writes a config change (e.g., enabling a feature toggle), update the in-memory config immediately so the change takes effect in the current session without requiring a restart. Otherwise, tell the user that config changes take effect on the next session.

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

**Retry TODO location:** Write to today's daily note (`Journal/{YYYY-MM-DD}.md`) for general failures. Write to the relevant project file for project-specific failures. Retry TODOs surface in the daily note Immediate Attention section. Never silently swallow failures.

## Relative Date Resolution

Convert "by Friday", "next week", "in 3 days", "tomorrow" to absolute dates using the `timezone` from workspace.yaml and today's date. Always store the resolved date, never the relative reference.

## Prompt Logging

If `prompt_logging` is enabled in workspace.yaml, log user prompts with timestamps to `_system/logs/prompts.md`. Log prompt metadata and a short user-authored summary by default. Do not log pasted email bodies, documents, credentials, or other sensitive external content verbatim — Myna processes sensitive workplace data and indiscriminate logging accumulates confidential material in logs.

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

## Per-Skill Override Files

Before executing any Myna skill, check whether a user override file exists at:

```
~/.myna/overrides/skills/{skill-name}.md
```

where `{skill-name}` matches the skill's `name` field (e.g., `sync.md` for `/myna:sync`, `email-triage.md` for `/myna:email-triage`).

If the file exists, read it before the skill body takes effect. Override content takes precedence over built-in skill defaults when they conflict. If the file does not exist, proceed with the built-in skill as normal.

This directory is outside the plugin directory and survives plugin updates, allowing users to customize skill behavior persistently.

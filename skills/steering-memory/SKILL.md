---
name: steering-memory
disable-model-invocation: true
description: Memory model rules — 2-layer precedence, output boundary, entity-specific refusal
user-invocable: false
---

# Memory Model

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

## Two-Layer Precedence

Myna's behavioral rules live in two layers. Applied together at runtime with explicit precedence:

| Layer | Lives in | Authoritative for |
|-------|----------|-------------------|
| Hard rules | 6 steering skills (myna-steering-*) | Safety, scope, draft-never-send, vault-only writes, append-only discipline |
| User preferences | `workspace.yaml` identity fields + Claude Code memory (feedback type) | Preferences, behavioral corrections, workflow adjustments observed across sessions |

**Runtime resolution:**
1. **Hard rules in steering ALWAYS win.** Immutable. Cannot be overridden by any user preference or memory entry.
2. **CLAUDE.md/workspace.yaml preferences apply** in the absence of a conflicting hard rule.

## Output Boundary

Behavioral memory informs behavior, never content. Never reference memory preferences in:
- Drafts, replies, briefings, prep docs
- Any user-facing text another person will read
- Non-memory vault entries (projects, people, meetings, tasks, journal)

The only exception: when the user explicitly asks to see their saved preferences — and only to the user, never in content meant for others.

## Entity-Specific Refusal

Preferences that apply broadly across interactions belong in memory. Facts about specific entities belong in entity notes. The litmus test:

- **Applies across many interactions?** → Memory (feedback type). Example: "Always use bullet points in status updates"
- **Applies to one specific entity?** → Entity note (project, person, or meeting file). Example: "Sarah prefers async feedback over live conversations"

Refuse to store entity-specific facts as behavioral preferences. Direct the user to the appropriate entity file instead.

# Myna — Install Notes

Design document for how Myna installs into a user's Claude Code environment.

---

## Overview

Myna installs as a global Claude Code subagent. After running `./install.sh`, the cloned repo is no longer needed at runtime — all runtime artifacts live in stable, user-owned locations outside the repo (D049).

The user invokes Myna with `claude --agent myna` from any directory.

---

## What Gets Installed Where

| Source (repo) | Destination (runtime) | Purpose |
|---|---|---|
| `agents/main.md` | `~/.claude/agents/myna.md` | Main agent prompt (with placeholders substituted) |
| `agents/skills/myna-steering-*/SKILL.md` (6 files) | `~/.claude/skills/myna-steering-*/SKILL.md` | Steering skills — preloaded at session start via agent's `skills:` frontmatter |
| `agents/skills/myna-*/SKILL.md` (24 files) | `~/.claude/skills/myna-*/SKILL.md` | Feature skills — loaded on demand via Claude Code's progressive disclosure |
| `agents/config-examples/*.yaml.example` | `{vault}/{subfolder}/_system/config/*.yaml.example` | Reference examples (always refreshed on install) |
| (generated from examples) | `{vault}/{subfolder}/_system/config/*.yaml` | Starter configs (only created if missing — user edits never overwritten) |
| (generated) | `~/.myna/version` | Installed version for upgrade checks |
| (generated) | `~/.myna/install-manifest.json` | Record of all paths written (for future uninstall) |

---

## How Skills Work at Runtime

### Steering Skills (6)

Steering skills contain cross-cutting rules (safety, conventions, output quality, system behavior, memory model, vault operations). They are listed in the agent file's `skills:` frontmatter field:

```yaml
skills:
  - myna-steering-safety
  - myna-steering-conventions
  - myna-steering-output
  - myna-steering-system
  - myna-steering-memory
  - myna-steering-vault-ops
```

Claude Code preloads these at session start. Their full content is always in context. Each has `user-invocable: false` in its own frontmatter.

### Feature Skills (24)

Feature skills live in `~/.claude/skills/myna-*/SKILL.md` (one directory per skill, each containing a `SKILL.md`). At session start, only each skill's `name` and `description` are in context (progressive disclosure). When the user's request matches a skill's description — or they invoke it with `/myna-{name}` — Claude Code loads the full SKILL.md content.

Skills read config files and vault files directly using Claude Code's built-in tools (Read, Write, Edit, Grep, Glob). There is no MCP server for vault operations.

---

## How the Agent File Is Generated

The install script reads `agents/main.md` and performs two placeholder substitutions:

| Placeholder | Replaced with | Example |
|---|---|---|
| `{{VAULT_PATH}}` | User's `--vault-path` argument | `/Users/alex/Documents/Vault` |
| `{{SUBFOLDER}}` | User's `--subfolder` argument (default: `myna`) | `myna` |

The file already contains YAML frontmatter with:
- `name: myna` — the subagent name
- `description: Personal assistant for tech professionals`
- `skills:` — list of 6 steering skill names for preloading

Other frontmatter fields (`model`, `tools`, `mcpServers`, `permissionMode`, `memory`) are deliberately omitted so Myna inherits session defaults. Users can add these by editing `~/.claude/agents/myna.md` directly.

The generated file is written to `~/.claude/agents/myna.md`.

---

## How Vault Paths Are Resolved

All vault paths in the agent prompt are absolute: `{VAULT_PATH}/{SUBFOLDER}/`. The install script resolves the vault path to an absolute path before substitution.

At runtime, skills and the main agent use these absolute paths for all Read, Write, Edit, Grep, and Glob operations. There are no relative paths or environment variables at runtime.

The vault structure created by install:

```
{vault}/{subfolder}/
├── Projects/
├── People/
├── Meetings/1-1s/, Recurring/, Adhoc/
├── Drafts/
├── Journal/Archive/
├── Team/
├── ReviewQueue/
├── _meta/learnings/
└── _system/config/, templates/, dashboards/, logs/, sources/, parked/
```

---

## How External MCPs Are Registered

Myna does NOT ship any MCP servers. External MCPs for email, Slack, and calendar are registered by the user separately using Claude Code's `claude mcp add` command:

```bash
claude mcp add gmail-mcp -- <your-gmail-mcp-command>
claude mcp add slack-mcp -- <your-slack-mcp-command>
claude mcp add gcal-mcp -- <your-gcal-mcp-command>
```

MCP server names are referenced in `workspace.yaml` under `mcp_servers` so skills know which tool names to call. All MCP-dependent features gracefully degrade when the corresponding MCP is not available.

The install script does not register any MCPs. It prints the registration commands in the post-install instructions.

---

## Idempotent Re-install

Running `./install.sh` again is safe:
- Skills are overwritten (updated to latest version)
- Agent file is regenerated (updated to latest version)
- `.example` config files are refreshed
- User-edited `.yaml` config files are **never** overwritten
- Vault directories that already exist are left alone (`mkdir -p`)
- Install manifest is updated with new timestamp

Update flow: `git pull && ./install.sh --vault-path <path>`

---

## What the Install Does NOT Do

- Does not touch the repo's `CLAUDE.md` (developer project instructions — different audience)
- Does not register MCP servers (user does this separately)
- Does not run an interactive setup wizard (deferred to post-launch, D043)
- Does not build or compile anything (no MCP server, no Node.js build step)
- Does not modify any Claude Code global settings

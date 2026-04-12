# Kiro CLI Research

Comprehensive catalog of Kiro CLI features relevant to building Myna as an agentic assistant. Compiled from Kiro's public documentation (kiro.dev/docs/cli/\*) and blog posts during the 2026-04-05 Phase 0 overnight session.

**Scope:** Kiro CLI only. Kiro IDE is out of scope per D035 (v1 targets Kiro CLI). Where a feature exists in the IDE but not the CLI (notably full Spec creation), it is noted and excluded.

**Confidence markers:**
- ✅ Verified from official Kiro CLI docs
- ⚠️ Partially verified or inferred from surrounding docs; needs confirmation before relying on in runtime
- ❓ Unknown — documentation couldn't resolve it; needs user verification

---

## 1. Core overview

Kiro is "an agentic coding service" by AWS, built on Amazon Bedrock. Kiro CLI is its terminal client. Same underlying agents as the IDE, but invoked from the terminal rather than an editor. Authentication supports Builder ID, AWS IAM Identity Center, Google, and GitHub. ✅

**Install (macOS/Linux):**
```
curl -fsSL https://cli.kiro.dev/install | bash
```

**Launch chat in a project:**
```
cd my-project
kiro-cli
```

**Non-interactive (scriptable):**
```
kiro-cli chat --no-interactive --trust-all-tools "Show me the current directory"
```

Exit codes: `0` success, `1` general failure, `3` MCP-startup failure (only with `--require-mcp-startup`). Hooks use separate exit-code semantics (see §7). ✅

**CLI vs IDE:** The CLI shares configuration formats with the IDE — MCP servers, steering rules, skills, prompts, and custom agents. Full **Spec creation** (requirements / design / tasks triple) is an IDE feature not yet in the CLI; the CLI can invoke tasks and work against existing specs. ⚠️ For Myna this is a non-issue — Myna is a chat-mode assistant, not a spec-driven dev tool.

---

## 2. Configuration scopes and locations

Kiro uses a three-scope hierarchy. Higher scopes override lower. ✅

| Scope | Path | Effect |
|---|---|---|
| Agent | `<user-home | project>/.kiro/agents/<name>.json` | Highest priority. Config for a single custom agent. |
| Workspace (project) | `<project-root>/.kiro/` | Applies when CLI runs inside that project. |
| Global (user-wide) | `~/.kiro/` | Fallback baseline. |

**Per-feature file locations:**

| Feature | Workspace path | Global path |
|---|---|---|
| Custom agents | `.kiro/agents/*.json` | `~/.kiro/agents/*.json` |
| Steering | `.kiro/steering/*.md` | `~/.kiro/steering/*.md` |
| Skills | `.kiro/skills/<name>/SKILL.md` | `~/.kiro/skills/<name>/SKILL.md` |
| Prompts | `.kiro/prompts/*.md` | `~/.kiro/prompts/*.md` |
| MCP config | `.kiro/settings/mcp.json` | `~/.kiro/settings/mcp.json` |
| CLI settings | — | `~/.kiro/settings/cli.json` |

**Resolution rule (per feature):** "Kiro selects the configuration closest to where you are interacting." For MCP servers, agent config > workspace > global with **full override** semantics (not merge). For steering/skills/prompts, workspace entries override same-named global entries; otherwise both sets are visible. ✅

**Implication for Myna install (Phase 6):** The Kiro CLI adapter in Phase 6 must decide, for every content artifact, whether it installs workspace-scoped (per-vault) or globally. Working assumption: **workspace scope** under the user's vault or a companion directory, because Myna is per-vault and per-user, and enterprise/shared CLI installations should not leak personal projects into global config. The adapter may also offer a global install flag for users who want Myna available in every project.

---

## 3. Custom agents (the primary unit)

Custom agents are the top-level unit in Kiro CLI. Each is defined by a JSON file. ✅

### 3.1 File format

- Extension: `.json`
- Location: `.kiro/agents/<name>.json` or `~/.kiro/agents/<name>.json`
- **Filename = agent name** (if `name` field omitted, Kiro derives it from the filename)
- Workspace agents take precedence over same-named global agents

### 3.2 Complete field reference

| Field | Type | Purpose |
|---|---|---|
| `name` | string | Identifier. Defaults to filename. |
| `description` | string | Human-readable purpose description. |
| `prompt` | string | System prompt for the agent. Can be inline text or a `file://` URI (relative or absolute) — e.g., `"file://./prompts/agent.md"`. |
| `tools` | array | Tool names the agent can call. Values include built-in tools (`read`, `write`, `shell`, `glob`, `grep`, `aws`, `web_search`, `web_fetch`, `code`, `delegate`, `subagent`, `knowledge`, `thinking`, `todo`, `session`, `report`, `introspect`), MCP tools (`@server`, `@server/tool`), wildcards (`*`), or the group alias `@builtin`. |
| `allowedTools` | array | Subset of `tools` that may run **without per-call user confirmation**. Supports glob patterns (`@server/read_*`, `?ead`). Patterns override exact matches; case-sensitive. |
| `toolsSettings` | object | Per-tool configuration. E.g., `"write": { "allowedPaths": [...], "deniedPaths": [...] }`, `"shell": { "allowedCommands": [...], "deniedCommands": [...], "autoAllowReadonly": true }`, `"aws": { "allowedServices": [...] }`. |
| `toolAliases` | object | Remap tool names (e.g., `"@git/git_status": "status"`). Useful when MCP tool names collide. |
| `mcpServers` | object | Inline-declared MCP servers for this agent only. Full override against workspace/global mcp.json. |
| `includeMcpJson` | boolean | If true, merge in servers from `~/.kiro/settings/mcp.json` and `.kiro/settings/mcp.json`. |
| `resources` | array | Files, skills, and knowledge bases loaded into the agent's context. Supports `file://`, `skill://`, and knowledgeBase object entries (see §3.4). |
| `hooks` | object | Commands to run at trigger points (see §7). |
| `model` | string | Model ID (e.g., `claude-sonnet-4`, `claude-opus-4.6`). Falls back to CLI default. |
| `keyboardShortcut` | string | `"ctrl+x"` or `"shift+x"` for quick-switch. Press again to return. |
| `welcomeMessage` | string | Shown when switching into the agent. |

No `temperature` field is documented in the CLI agent reference. ⚠️

### 3.3 Minimal and complete examples

**Minimal:**
```json
{
  "name": "my-agent",
  "description": "Agent purpose",
  "tools": ["read", "write"],
  "allowedTools": ["read"]
}
```

**Complete (abbreviated from the AWS specialist example in the official docs):**
```json
{
  "name": "aws-specialist-agent",
  "description": "AWS infrastructure and development tasks",
  "prompt": "You are an expert AWS infrastructure specialist...",
  "tools": ["read", "write", "shell", "aws"],
  "allowedTools": ["read", "aws"],
  "toolsSettings": {
    "aws": { "allowedServices": ["s3", "lambda", "cloudformation", "ec2", "iam", "logs"] },
    "write": { "allowedPaths": ["infrastructure/**", "scripts/**", "*.yaml"] }
  },
  "resources": [
    "file://README.md",
    "file://infrastructure/**/*.yaml",
    "file://docs/aws-setup.md"
  ],
  "hooks": {
    "agentSpawn": [{
      "command": "aws sts get-caller-identity",
      "timeout_ms": 10000,
      "cache_ttl_seconds": 300
    }]
  },
  "model": "claude-sonnet-4"
}
```

### 3.4 Resource types (the `resources` array)

| Resource URI | Load timing | Use case |
|---|---|---|
| `file://<path>` | Always loaded at startup (counts against context window) | Essential docs, steering files (if explicitly referenced by a custom agent), project metadata |
| `file://<glob>` | Glob-matched files loaded at startup | Bulk docs; careful of size |
| `skill://<path>` | Name+description loaded at startup; full content loaded on demand (progressive disclosure) | Large specialized knowledge bases |
| `{ "type": "knowledgeBase", "source": "...", "name": "...", "indexType": "best"|"fast" }` | Indexed separately; searched on demand | Very large codebases or corpora |

**Context window limit:** resources cannot exceed 75% of the model's context window. Over-limit files are automatically dropped. ✅

### 3.5 Managing agents

Slash commands (in chat):
- `/agent list` — list available agents
- `/agent create <name> [--from <other>] [--manual] [-D "description"] [-m model]`
- `/agent edit [name]`
- `/agent swap [name]` — pick or switch
- `/agent set-default` — set default agent for new sessions
- `/agent generate` — AI-assisted creation
- `/agent schema` — show schema

CLI commands:
- `kiro-cli agent list | create | edit | validate | migrate | set-default`
- `kiro-cli --agent <name>` — launch chat with a specific agent
- `kiro-cli chat --agent <name>` — same, explicit

The default agent is stored in `chat.defaultAgent` in `~/.kiro/settings/cli.json`. ✅

---

## 4. Steering files

Steering files give Kiro persistent project context. They are markdown, no required frontmatter. ✅

### 4.1 Locations and loading modes

| File | Location | Loading |
|---|---|---|
| `product.md`, `tech.md`, `structure.md` | `.kiro/steering/` or `~/.kiro/steering/` | **Always loaded in every session** (default agent) |
| `AGENTS.md` | workspace root or `~/` | **Always loaded** (both scopes) |
| Any other `*.md` | `.kiro/steering/` or `~/.kiro/steering/` | Auto-loaded for the default agent; **NOT auto-loaded for custom agents** |
| Any `*.md` for custom agents | Same dirs | **Must be explicitly referenced** in the agent's `resources` using glob: `"file://.kiro/steering/**/*.md"` |

### 4.2 Conflict resolution

Workspace-steering instructions override global-steering instructions when both apply to the same context. ✅

### 4.3 Critical gotcha for Myna

Because custom agents do **not** automatically include steering files (other than `product.md`/`tech.md`/`structure.md`/`AGENTS.md`), the Kiro CLI adapter must wire steering glob into every Myna agent's `resources` field. Otherwise the steering content will silently not be loaded. This is a high-risk install-time detail. ⚠️

### 4.4 Format

No required frontmatter. Standard markdown. Recommend using a top-level `# Title` and clear sections. Team steering supports MDM/Group Policy distribution at the enterprise level.

### 4.5 Size limits

No documented hard size limit per file, but the 75% context window rule still applies in aggregate. ⚠️

---

## 5. Agent Skills

Skills are portable instruction packages following the open agentskills.io standard. ✅

### 5.1 Structure

```
skill-name/
├── SKILL.md           # Required
└── references/        # Optional
    └── guide.md       # Loaded on demand
```

### 5.2 SKILL.md format

YAML frontmatter + markdown body:

```markdown
---
name: pr-review
description: Review pull requests for code quality, security issues, and test coverage.
---

## Review checklist
- Check X
- Check Y
```

**Frontmatter fields (required):**
- `name` — lowercase letters, numbers, hyphens only. Max 64 chars.
- `description` — when to activate this skill; Kiro matches it against user prompts. Max 1024 chars.

### 5.3 Locations and precedence

- Workspace: `.kiro/skills/<name>/SKILL.md`
- Global: `~/.kiro/skills/<name>/SKILL.md`
- Workspace skills with the same name override global skills.

### 5.4 Loading model (progressive disclosure)

1. On session start: Kiro reads only the `name` and `description` fields from each SKILL.md — cheap, keeps context lean
2. When the agent determines a skill is relevant OR the user explicitly requests it: Kiro loads the full SKILL.md body into context
3. `references/` files are loaded even later, only if the skill's instructions explicitly point to them

**Inspection:** `/context show` lists currently loaded skills. ✅

### 5.5 Registering skills with a custom agent

Custom agents do **not** load skills by default. They must register via `resources`:

```json
{
  "resources": [
    "skill://.kiro/skills/*/SKILL.md",
    "skill://~/.kiro/skills/*/SKILL.md"
  ]
}
```

The `skill://` URI scheme supports specific paths, glob patterns, and home-dir expansion. ✅

### 5.6 Skills vs steering vs prompts (critical distinctions for Myna)

| Mechanism | Loaded when | Invoked how | Best for |
|---|---|---|---|
| Steering | Always (if referenced by agent) | Passive — sits in context | Project-wide rules, voice, safety policies |
| Skill | Metadata always; body on-demand | Auto when description matches user intent, or explicit | Large specialized workflows the agent needs sometimes |
| Prompt | Never, until user types `@name` | User types `@name` in chat | Reusable user-invoked commands/instructions |

**This three-way split is load-bearing for Myna's architecture.** The feature-consolidation decisions in Phase 0 will repeatedly need to choose between these three homes for a given behavior.

---

## 6. Prompts

Prompts are reusable instruction snippets invoked with `@name` in chat. ✅

### 6.1 Format and location

Markdown files, stored in `.kiro/prompts/` (workspace) or `~/.kiro/prompts/` (global). No required frontmatter. Max filename 50 chars, max file 250KB, max directory depth 3. Workspace prompts override global; MCP-server prompts are lowest priority.

### 6.2 Invocation

```
@prompt-name                      # Invoke a prompt
@src/auth.rs                      # Include file contents as reference
@crates/agent/                    # Include directory structure
@"my file.txt"                    # Quoted paths with spaces
@server/prompt arg1 arg2          # MCP prompt with arguments
```

### 6.3 Management

- `/prompts list` — list available prompts
- `/prompts details <name>` — show full content
- `/prompts get <name>` — retrieve content
- `/prompts create --name <name> [--content <text>]`
- `/prompts edit <name>`
- `/prompts remove <name>`

### 6.4 Arguments

**Local and global prompts do NOT support arguments.** Only MCP-server prompts can take positional arguments. For Myna this means user-invoked prompt snippets are text substitution only, not templating. ⚠️

---

## 7. Hooks

Hooks run shell commands at specific lifecycle points. Defined inside a custom agent's `hooks` object. ✅

### 7.1 Trigger points

| Trigger | Fires when | Can it block? | Sees tool data? |
|---|---|---|---|
| `agentSpawn` | Agent starts | No | No (just `cwd`, `hook_event_name`) |
| `userPromptSubmit` | User submits a prompt | Output added to context | No |
| `preToolUse` | Before each tool call | **Yes** — exit code `2` blocks the call, stderr returned to LLM | `tool_name`, `tool_input` |
| `postToolUse` | After each tool call | No | `tool_name`, `tool_input`, `tool_response` |
| `stop` | Agent finishes its turn | No | No |

### 7.2 Hook definition

```json
{
  "hooks": {
    "preToolUse": [
      {
        "command": "check-calendar-write.sh",
        "matcher": "@calendar/create_event",
        "timeout_ms": 5000,
        "cache_ttl_seconds": 0
      }
    ]
  }
}
```

**Fields:**
- `command` — shell command to run (receives JSON on STDIN)
- `matcher` — (optional) tool filter; exact name, alias, MCP form (`@server`, `@server/tool`), or wildcards (`*`, `@builtin`). Omit = matches all tools.
- `timeout_ms` — default 30000
- `cache_ttl_seconds` — cache results; 0 = no cache; **agentSpawn hooks are never cached**
- `max_output_size` — (optional) cap stdout size

### 7.3 STDIN contract

```json
{
  "hook_event_name": "preToolUse",
  "cwd": "/current/working/directory",
  "tool_name": "fs_write",
  "tool_input": { ... },
  "tool_response": { ... }
}
```

### 7.4 Exit-code contract

- `0` — success, stdout captured silently
- `2` — (preToolUse only) BLOCK the tool call; stderr is returned to the LLM as context
- other non-zero — hook itself failed; stderr shown as warning

### 7.5 Critical gotcha for Myna

**Hooks do NOT trigger inside subagents.** If Myna relies on hooks for policy enforcement (e.g., blocking calendar writes with attendees), any tool call that happens inside a subagent bypasses the hook layer. This has two implications:

1. Risky tool calls should not be delegated into subagents in v1 (instruction-level defense is the only safety net there).
2. The pre-session decision to defer the runtime sentinel to post-launch is reinforced: we can't rely on subagent isolation for policy enforcement via hooks anyway.

---

## 8. Subagents

### 8.1 What they are

Subagents are secondary agents spawned by the main agent to run tasks in isolated context windows. The CLI exposes this through the `subagent` built-in tool (alias `use_subagent`), which can spawn up to 4 subagents in parallel. ✅

### 8.2 Definition

The documentation has two slightly different descriptions depending on the page:

- **Custom-agent page (CLI):** subagents are the same JSON custom-agent files living in `.kiro/agents/*.json`. The main agent picks an appropriate custom agent by `description` match when it needs to delegate.
- **Subagent page (IDE-leaning):** subagents are markdown files with YAML frontmatter in `.kiro/agents/*.md`.

⚠️ The docs do not fully disambiguate the two formats in the CLI-specific context. For Myna, working assumption: **in Kiro CLI, subagents are JSON custom agents and the subagent tool spawns them based on description matching.** The adapter must verify this at install time.

### 8.3 Invocation

- **Automatic:** the main agent decides to delegate based on prompt content and subagent descriptions
- **Manual in chat:** "Use the code-reviewer subagent to..." or "Run subagents to..."
- **Via slash (where supported):** `/code-reviewer <task>` (subagent becomes a slash command)

### 8.4 Execution model

- Each subagent has its own context window — main agent context is not polluted
- Up to 4 subagents can run in parallel
- **Main agent waits synchronously** for all subagents to finish before continuing
- Subagents return their results to the main agent

### 8.5 Subagent limitations (critical for Myna)

Per the official docs:

1. **No access to Specs** (IDE feature, irrelevant here)
2. **Hooks do NOT trigger inside subagents** (already noted in §7)
3. Subagents cannot directly nest further (not explicitly stated, but the docs never mention nesting)
4. **Latency:** every spawn costs seconds of startup, plus waits for the slowest subagent before the main agent continues

### 8.6 Delegate tool (distinct from subagent)

There's also a `delegate` built-in tool — "Delegates tasks to background agents **asynchronously**." The main agent does not block waiting. This is different from `subagent` which is parallel-synchronous. ⚠️ — more research needed on what kind of task `delegate` is for and whether it's suitable for Myna's P1 automation work.

### 8.7 Implication for Myna

Per pre-session answer 1, subagents are a **latency-sensitive, per-feature decision**. Concretely:

- Default delegation mechanism = skills (auto-loaded metadata, cheap invocation)
- Subagent = only when a task needs isolated context or long-running work genuinely unrelated to the main thread
- Sentinel subagent for security = **deferred post-launch** because (a) hook bypass makes its safety guarantee weaker and (b) latency on every risky write is a UX killer

---

## 9. MCP (Model Context Protocol)

### 9.1 What Kiro's MCP support offers

Kiro is a first-class MCP client. Agents can call MCP server tools. Kiro does not bundle MCP servers — the user (or an installer) registers them. ✅

### 9.2 Configuration locations (priority order)

1. Agent-level inside the custom agent JSON (`mcpServers` field) — highest
2. Workspace: `.kiro/settings/mcp.json`
3. Global: `~/.kiro/settings/mcp.json`

Same-named server at a higher scope **fully overrides** the lower — it does not merge fields. ✅

### 9.3 Schema (local server)

```json
{
  "mcpServers": {
    "web-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-bravesearch"],
      "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" },
      "timeout": 120000,
      "disabled": false,
      "autoApprove": ["brave_web_search"],
      "disabledTools": []
    }
  }
}
```

### 9.4 Schema (remote server)

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.github.com/mcp",
      "headers": { "Authorization": "Bearer ${GITHUB_TOKEN}" },
      "oauth": {
        "oauthScopes": ["repo", "user", "read:org"],
        "redirectUri": "127.0.0.1:8080"
      }
    }
  }
}
```

### 9.5 Environment variable expansion

`${VAR}` references resolve at load time against the shell environment. The user (or installer) must `export` them before launching `kiro-cli`. ✅

### 9.6 Disabling servers or tools

- `"disabled": true` on a server entry
- `"disabledTools": ["tool_a", "tool_b"]` to omit specific tools
- Agent-level `"tools"` acts as an allowlist — only tools listed are available to that agent

### 9.7 Tool name restrictions (MCP)

- Max 64 chars including server prefix
- Must match `^[a-zA-Z][a-zA-Z0-9_]*$`
- Empty descriptions disqualified
- Descriptions over 10,000 chars degrade performance

### 9.8 Registering servers

```
kiro-cli mcp add --name myserver --command "..." --args "..." --env "KEY=VAL" --scope workspace
kiro-cli mcp add --name myserver --agent my-agent
kiro-cli mcp remove --name myserver
kiro-cli mcp list [workspace | global]
kiro-cli mcp import --file path.json
kiro-cli mcp status --name myserver
```

In-chat: `/mcp` shows currently loaded servers.

### 9.9 Enterprise MCP registry

Pro/enterprise feature: administrators can publish an allowlist of MCP servers as an HTTPS JSON registry, referenced from the Kiro profile. Clients refresh every 24 hours. Note: "enforced client-side" — technically circumventable. ✅

### 9.10 Implication for Myna

- The Myna Obsidian MCP is the only MCP Myna ships. The Phase 6 adapter must register it at install time — either inline in every Myna agent's config or in `.kiro/settings/mcp.json`.
- External MCPs (email, Slack, calendar) are user-provided per D005. The installer must ask the user which MCP names they have and record them in Myna config so agents know what servers to call.
- Agent `tools` allowlists must include `@obsidian` (or whatever name the adapter picks) plus whichever external MCPs the user has. This binding is an install-time concern, not a content concern.

---

## 10. Built-in tools

Complete list from kiro.dev/docs/cli/reference/built-in-tools/. ✅

| Tool | Aliases | Purpose | Key settings |
|---|---|---|---|
| `read` | `fs_read`, `fsRead` | Read files/folders/images | `allowedPaths`, `deniedPaths` (glob) |
| `write` | `fs_write`, `fsWrite` | Create/edit files | `allowedPaths`, `deniedPaths`, custom diff tool |
| `glob` | — | File discovery by pattern | respects `.gitignore` |
| `grep` | — | Regex content search | respects `.gitignore` |
| `shell` | `execute_bash`, `execute_cmd` | Run bash commands | `allowedCommands`, `deniedCommands`, `autoAllowReadonly`, `denyByDefault` (all regex-capable) |
| `aws` | `use_aws` | Make AWS CLI calls | `allowedServices`, `deniedServices`, `autoAllowReadonly` |
| `web_search` | — | Live web search | none documented |
| `web_fetch` | — | Fetch URL content | `trusted`, `blocked` URL regex patterns; 10 MB limit; 30 s timeout |
| `code` | — | Symbol search, LSP integration | experimental-adjacent |
| `introspect` | — | Answers questions about Kiro CLI itself | `progressiveMode`, `tangentMode` |
| `delegate` | — | Delegate tasks to background agents **asynchronously** | — |
| `subagent` | `use_subagent` | Spawn subagents in parallel (max 4) | `availableAgents`, `trustedAgents` (glob) |
| `knowledge` | — (experimental) | Knowledge base semantic search | indexType, chunk size, etc. |
| `thinking` | — (experimental) | Internal chain-of-thought mechanism | `chat.enableThinking` |
| `todo` | — (experimental) | Manage in-session todo lists | `chat.enableTodoList` |
| `session` | — | Temporarily override CLI settings for the session | operations: list/get/set/reset |
| `report` | — | Open browser to report GitHub issue | — |

### 10.1 Implication for Myna

- The `read`/`write`/`glob`/`grep` tools are the baseline for vault operations — but Myna prefers the Myna Obsidian MCP because it gives access to Obsidian's search index, Tasks plugin, Dataview queries, and template rendering.
- Myna should still grant `read` and `grep` to every agent so they can operate on vault files when Obsidian isn't running (D008 fallback).
- `write` should be **path-restricted** via `toolsSettings.write.allowedPaths` to enforce D011 (vault-only writes under `myna/`). This is one of the key defense-in-depth layers for Phase 6 adapter.
- `shell` should be **heavily denied** by default — Myna doesn't need arbitrary shell access.
- `aws` — Myna doesn't use AWS; exclude.
- `web_fetch` and `web_search` — not needed for v1 features; exclude.

---

## 11. Slash commands (in-chat)

Complete list from kiro.dev/docs/cli/reference/slash-commands/. ✅

| Command | Purpose |
|---|---|
| `/help [question]` | Help Agent or legacy text |
| `/quit`, `/exit`, `/q` | Exit |
| `/clear` | Clear current conversation (display) |
| `/context [show|add|remove|clear]` | Manage session context; context rules derive from active agent; **changes do NOT persist across sessions** |
| `/model [id]` | Switch model; `/model set-current-as-default` to persist |
| `/agent [list|create|edit|swap|set-default|generate|schema]` | Agent management |
| `/chat [new|resume|save|load|save-via-script|load-via-script]` | Session lifecycle |
| `/editor` | Open editor to compose longer prompt |
| `/reply` | Reply with quoted previous assistant message |
| `/checkpoint [init|list|restore|expand|diff|clean]` | Workspace checkpoints for file-change tracking/restoration |
| `/plan [prompt]` | Switch to Plan agent |
| `/knowledge [show|add|search|remove|update|clear|cancel]` | Persistent per-agent knowledge base |
| `/compact` | Summarize conversation to free context |
| `/paste` | Paste clipboard image into conversation |
| `/tools [schema|trust|untrust|trust-all|reset]` | Tool permissions |
| `/prompts [list|details|get|create|edit|remove]` | Prompt management; invoke via `@name` |
| `/hooks` | Show active hooks |
| `/usage` | Billing/credits |
| `/mcp` | Show loaded MCP servers |
| `/code [init|overview|status|logs]` | Code intelligence config |
| `/experiment` | Toggle experimental features |
| `/tangent` | Create side-conversation checkpoint |
| `/todos [add|complete]` | Manage session todo list |
| `/issue` | Create GitHub issue |
| `/logdump [--mcp]` | Zip logs for support |
| `/changelog` | Show recent CLI changes |

**Slash commands are only available in interactive chat mode**, not in `--no-interactive` runs. ✅

### 11.1 Relevant to Myna

- `/agent swap` — users might switch between the main Myna agent and any specialized Myna agents (if the architecture ends up with more than one user-facing agent).
- `/compact` — users may invoke this to free context during long Myna sessions; Myna's steering should mention that compaction keeps the most recent conversation but summarizes older turns, which means long-form state must live in the vault, not in conversation memory.
- `/checkpoint` — not directly useful for Myna since Myna writes to a vault, not a codebase, but worth knowing exists.
- `/todos` — a potential lightweight session task tracker that overlaps with Myna's task features; Myna's task system lives in the vault, not in this experimental in-session list. Keep them separate.

---

## 12. Context management

### 12.1 Four layers of context

Per kiro.dev/docs/cli/chat/context/: ✅

| Layer | Lifetime | Token cost | Use case |
|---|---|---|---|
| Agent resources (from `resources` field) | Persistent across sessions | Always-on (consumes tokens at startup) | Project files, standards, configs |
| Skills | Persistent across sessions | Metadata at startup; body on demand | Large specialized guides |
| Session context (`/context add`) | Current session only | Always-on while added | Ad-hoc file attachments |
| Knowledge bases | Persistent, per-agent | Only when searched | Very large corpora |

### 12.2 Hard limits

- Context-window usage cap for files: **75%** of model's total context. Files over this limit are auto-dropped.
- Knowledge bases don't count against this cap unless actively searched.

### 12.3 Auto-compaction

When context fills, Kiro summarizes older turns while preserving recent ones. Controlled by:
- `chat.disableAutoCompaction` — disable entirely
- `compaction.excludeMessages` — minimum recent pairs to keep verbatim
- `compaction.excludeContextWindowPercent` — minimum context to keep verbatim

### 12.4 Implication for Myna

1. Myna's **steering + agent prompt + main context** must fit within the per-session budget comfortably, leaving room for user input, tool outputs, and conversation. This is the single hardest constraint on Myna's main-agent prompt.
2. Anything that isn't always-needed should live as a skill (progressive disclosure) or as vault-content-loaded-on-demand.
3. Myna's long-term state lives in the vault, not in conversation memory. This is already the architecture, but the compaction behavior makes it non-negotiable: any state that matters must be durably written, never "kept in conversation."

---

## 13. Knowledge bases (per-agent)

- Stored under `~/.kiro/knowledge_bases/<agent-id>/`
- Two index types: `fast` (BM25, keyword) and `best` (semantic, all-minilm-l6-v2)
- Managed via `/knowledge` slash command
- **Per-agent isolation** — each agent has its own knowledge bases
- Persistent across sessions and CLI restarts
- Support 30+ file types; configurable include/exclude patterns

### 13.1 Implication for Myna

⚠️ Potentially useful for Myna's future "search across long historical vault content" workflows, but **not required for v1**. Myna's current search plan uses the Myna Obsidian MCP, which is already indexed by Obsidian. Knowledge bases are a possible post-launch optimization.

---

## 14. CLI-level settings file

`~/.kiro/settings/cli.json` — partial list relevant to Myna install. ✅

| Setting | Purpose |
|---|---|
| `chat.defaultModel` | Default LLM for chat |
| `chat.defaultAgent` | Default agent for new sessions |
| `chat.diffTool` | External diff tool |
| `chat.greeting.enabled` | Show startup message |
| `chat.enableNotifications` | Desktop notifications |
| `chat.disableMarkdownRendering` | Plain text output |
| `chat.disableAutoCompaction` | Disable summarization of older context |
| `chat.enableThinking` | Enable thinking/chain-of-thought tool |
| `chat.enableKnowledge` | Enable knowledge base features |
| `chat.enableCheckpoint` | Enable workspace checkpoints |
| `chat.enableTodoList` | Enable in-session todo list |
| `chat.enableDelegate` | Enable delegate tool |
| `chat.enableContextUsageIndicator` | Show context % indicator |
| `compaction.excludeMessages` | Min message pairs to keep verbatim |
| `compaction.excludeContextWindowPercent` | Min context % to keep |
| `mcp.initTimeout` | MCP init timeout |
| `mcp.noInteractiveTimeout` | MCP timeout in non-interactive mode |
| `api.timeout` | Request timeout |
| `telemetry.enabled` | Telemetry toggle |
| `knowledge.*` | Knowledge base config (chunk size, etc.) |

### 14.1 Implication for Myna

- The Phase 6 adapter may **optionally** write `chat.defaultAgent: "myna"` into `cli.json` so that `kiro-cli` in the vault directory opens directly in Myna without a `/agent swap`. This is user-facing polish.
- Should **not** touch settings Myna doesn't own (telemetry, models, etc.) — respect the user's existing config.

---

## 15. Non-interactive / scripted mode

```
kiro-cli chat --no-interactive --trust-all-tools "prompt text"
kiro-cli chat --no-interactive --trust-tools read,write "prompt"
kiro-cli chat --no-interactive --require-mcp-startup "prompt"
```

- Useful for CI/CD, batch runs, or Myna's P1 automation (post-launch)
- Slash commands don't work in this mode
- Combine with exit codes for pipeline integration

**For Myna v1:** Not used. Myna is interactive-prompt-driven per vision and D006. Non-interactive mode is relevant for post-launch P1 automation (Backlog B003).

---

## 16. Session management

- Sessions save conversation state for later resumption
- `kiro-cli chat --list-sessions` — list saved sessions for current directory
- `kiro-cli chat --resume` or `-r` — resume most recent
- `kiro-cli chat --resume-picker` — interactive picker
- `kiro-cli chat --delete-session <id>` — delete
- In-chat: `/chat new`, `/chat resume`, `/chat save`, `/chat load`

Sessions are per-directory (project-scoped), so running Myna from the vault directory keeps Myna's sessions separate from other work. ⚠️ Exact session storage location not documented in what I fetched.

---

## 17. Enterprise governance (out of scope for v1, context only)

- Kiro Profiles for org-level defaults
- MCP registry allowlist (JSON over HTTPS)
- Organization vs. account policy layering
- Client-side enforcement (technically circumventable)

Not relevant for Myna v1 — Myna is for a single user's personal use. But worth knowing for future enterprise distribution.

---

## 18. Features NOT in Kiro CLI (yet) or not applicable

- **Spec creation (requirements/design/tasks triple):** IDE only; CLI can interact with existing specs but can't create them. Irrelevant for Myna.
- **IDE panels, sidebars, editor integrations:** IDE only.
- **Visual configuration UI:** IDE only; everything CLI-side is file-based.
- **Background daemons or always-on services:** Not documented for the CLI. Session-per-invocation is the model.

---

## 19. Open unknowns that may affect Myna architecture

Documented gaps found during research. These should surface to the user as open questions (appended to `docs/open-questions.md`) if architecture depends on them.

1. **Agent file format in CLI — JSON vs markdown+YAML.** The Kiro docs describe **custom agents as JSON** (CLI custom-agents page) and **subagents as markdown+YAML** (subagents page). It's unclear whether both formats coexist in `.kiro/agents/` in the CLI, or whether one is IDE-only. ⚠️ Needs verification at install time. For now Myna will author content as tool-neutral markdown+YAML (D038) and let the Phase 6 adapter generate the exact JSON Kiro CLI expects.

2. **Subagent discovery and selection.** How does the main agent decide which subagent to spawn? By `description` match — but exactly how is the match done? Keyword match, embedding similarity, or LLM-as-judge? Matters for Myna because skill descriptions and agent descriptions compete for matching.

3. **Skill selection when multiple skills match.** If several skill descriptions overlap, does Kiro load all of them, the top-N, or the one best match? Not documented.

4. **Session memory across invocations.** Beyond explicit `/chat save|load`, is there any cross-session memory? Preliminary answer: no; only agent resources, skills, and knowledge bases persist. Chat context is session-scoped. ✅

5. **`delegate` tool semantics.** How does delegate differ from subagent in practice? Is delegate async in a way that makes sense for Myna? Likely irrelevant for v1 (interactive only) but worth knowing.

6. **Tool-call confirmation UX for steering/skill-initiated tool calls.** When a skill or steering file tells the agent to call a tool, does the user still see a confirmation prompt unless it's in `allowedTools`? Assumed yes, because `allowedTools` is the bypass. This matters for Myna's "never send, never take destructive action without explicit user intent" rules — confirmation prompts are a free safety layer.

7. **Multi-agent conversations.** Can Myna have multiple "user-facing" agents that a single user interacts with (by `/agent swap`), or should there be exactly one main Myna agent? Both are technically possible. The pre-session answer says ONE main agent, so this is settled by fiat — but worth noting that Kiro's `/agent swap` model could support a different architecture if we chose.

8. **Cost of `file://` glob patterns with large matches.** What happens if a glob matches 500 files? Auto-drop at 75% context? Silent truncation? Matters for Myna's steering globs. ⚠️

9. **Per-project MCP wiring vs global.** When Myna installs to a vault, should MCP configs go in `<vault>/.kiro/settings/mcp.json` or `~/.kiro/settings/mcp.json`? The adapter must choose. Working assumption: workspace-scoped to the vault, because Myna is per-vault.

10. **Whether `AGENTS.md` steering should be the Myna root steering file.** Since `AGENTS.md` is always included regardless of custom-agent `resources` config, placing Myna's always-on safety rules there could serve as a redundant safety net. ⚠️ Worth considering in the steering design.

---

## 20. Architectural implications for Myna Phase 0

Consolidated takeaways that will shape the architecture and foundations docs.

### 20.1 Runtime mapping (content layer → Kiro CLI)

| Myna content layer artifact | Kiro CLI runtime form | Installed where |
|---|---|---|
| Main agent definition | `.kiro/agents/myna.json` | workspace (`<vault>/.kiro/agents/`) |
| Additional agents (if any) | `.kiro/agents/<name>.json` | same |
| Steering rules (system-wide) | `.kiro/steering/*.md` | workspace |
| Steering rules (always-on) | `.kiro/steering/AGENTS.md` | workspace + optionally home |
| Feature skills | `.kiro/skills/<name>/SKILL.md` | workspace |
| User-invokable prompts | `.kiro/prompts/*.md` | workspace (for @-commands) |
| Myna Obsidian MCP | inline `mcpServers` in agent or `.kiro/settings/mcp.json` | workspace |
| External MCP names | referenced in agent `tools` allowlist | agent-level |

### 20.2 Steering MUST be in agent `resources`

The single biggest gotcha. Custom agents do NOT auto-load steering files other than the three foundational files (`product.md`, `tech.md`, `structure.md`) and `AGENTS.md`. Every Myna agent JSON must include:

```json
"resources": [
  "file://.kiro/steering/**/*.md",
  "skill://.kiro/skills/*/SKILL.md"
]
```

Missing this = silent loss of all safety rules. Phase 6 adapter ownership.

### 20.3 Main agent prompt fits in a tight budget

Kiro's 75% context cap plus auto-compaction means the main agent prompt + always-on resources must be lean enough to leave room for tool outputs and conversation. This validates pre-session answer 1's discipline: main agent prompt = role, voice, routing, always-applicable safety rules only. Per-feature behaviors go into skills (progressive disclosure).

### 20.4 Hook-based enforcement is real but subagent-bypassed

`preToolUse` hooks with exit code 2 can block tool calls — this is a genuine defense-in-depth layer for:
- Blocking writes outside `myna/`
- Blocking calendar events with attendees (D003)
- Blocking email sends (none should exist anyway, but belt-and-suspenders)

BUT hooks do NOT trigger in subagents. This means:
- Any risky write must be done by the main agent, not delegated to a subagent
- Myna's architecture must keep calendar/email/vault writes in the main-agent execution path, not offload them to subagents

### 20.5 Skills are the primary sub-unit of the main agent

Per pre-session answer 1 and the progressive-disclosure model, skills are exactly the right home for feature-specific instructions. They stay out of the main prompt until invoked, auto-load their metadata, and activate by description match. This is a great fit for Myna's feature catalog.

### 20.6 Prompts are for user-invoked shortcuts

The `@name` invocation is a clean mechanism for user-typed shortcuts like `@process-email`, `@weekly-summary`, `@brief @sarah`. Prompts are NOT a routing mechanism — they're shortcut text that gets substituted into the user's message. Myna may use a small set of these for common user workflows, but the main behavior lives in agent prompt + skills.

### 20.7 Subagents are optional, latency-sensitive, rarely needed in v1

Given skills cover most delegation needs and hooks don't fire in subagents, the only strong use case for subagents in Myna v1 is:
- Long-running work that would pollute main-agent context (e.g., batch processing 100 emails)
- Isolated context for a reviewer role (e.g., a "prompt-injection auditor" fresh-context checker)

Both are optional for v1 per the pre-session answers. Architecture should design so subagents are easy to add later, not baked in.

### 20.8 File format: tool-neutral authoring, adapter-generated runtime

Per D038, Myna content is authored in tool-neutral markdown + YAML. The Phase 6 Kiro CLI adapter reads that and generates:
- `.kiro/agents/*.json` files (for CLI custom agents)
- `.kiro/steering/*.md` files (straight copy, minor name normalization)
- `.kiro/skills/*/SKILL.md` files (straight copy if already in SKILL.md format)
- `.kiro/prompts/*.md` files (straight copy)
- `.kiro/settings/mcp.json` (generated from Myna MCP config + user's external MCP names)

The important tool-neutral discipline: agent content must not embed CLI-specific JSON syntax, tool names, or file paths. Tool names and paths are adapter concerns.

---

## 21. Sources

All retrieved 2026-04-05 from kiro.dev. Cited by URL for future verification.

Core:
- [Get started — CLI](https://kiro.dev/docs/cli/)
- [CLI commands reference](https://kiro.dev/docs/cli/reference/cli-commands/)
- [Slash commands reference](https://kiro.dev/docs/cli/reference/slash-commands/)
- [Built-in tools reference](https://kiro.dev/docs/cli/reference/built-in-tools/)
- [Settings reference](https://kiro.dev/docs/cli/reference/settings/)
- [Exit codes reference](https://kiro.dev/docs/cli/reference/exit-codes/)
- [Introducing Kiro CLI (blog)](https://kiro.dev/blog/introducing-kiro-cli/)

Custom agents:
- [Custom agents overview](https://kiro.dev/docs/cli/custom-agents/)
- [Agent configuration reference](https://kiro.dev/docs/cli/custom-agents/configuration-reference/)
- [Creating custom agents](https://kiro.dev/docs/cli/custom-agents/creating/)
- [Agent examples](https://kiro.dev/docs/cli/custom-agents/examples/)

Context, prompts, skills, steering:
- [Context management](https://kiro.dev/docs/cli/chat/context/)
- [Manage prompts](https://kiro.dev/docs/cli/chat/manage-prompts/)
- [Responding to messages](https://kiro.dev/docs/cli/chat/responding/)
- [Help Agent](https://kiro.dev/docs/cli/chat/help-agent/)
- [Steering](https://kiro.dev/docs/cli/steering/)
- [Agent Skills](https://kiro.dev/docs/cli/skills/)
- [Subagents (IDE-leaning page, used with caution)](https://kiro.dev/docs/chat/subagents/)

MCP:
- [MCP overview](https://kiro.dev/docs/cli/mcp/)
- [MCP configuration](https://kiro.dev/docs/cli/mcp/configuration/)
- [MCP registry (enterprise)](https://kiro.dev/docs/cli/mcp/registry/)
- [MCP governance](https://kiro.dev/docs/cli/enterprise/governance/mcp/)

Experimental:
- [Knowledge management](https://kiro.dev/docs/cli/experimental/knowledge-management/)

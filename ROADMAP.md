# Myna — Roadmap

## What's Shipped

**v1.0**
- 24 feature skills covering email, Slack, meetings, projects, tasks, people, writing, and daily workflow
- 6 steering skills (safety, conventions, output, system, memory, vault operations)
- Install script — sets up Myna in Claude Code, creates vault structure, registers MCP servers
- Vault templates — folder structure, dashboards, config files
- Customization layer — per-skill override files at `~/.myna/overrides/skills/`, routing overrides at `~/.myna/overrides/routing.md`, user-namespaced skills

**v1.x (post-launch)**
- Config UI — visual setup interface for all config domains
- Guided onboarding skill — interactive first-run setup via `myna-setup`
- Skill customization layer — update-safe overrides via `~/.myna/overrides/skills/myna-{skill-name}.md` and `~/.myna/overrides/routing.md` (D052)

## In Progress

- Claude Code plugin migration — adapting install and runtime for Claude Code's plugin model

## Coming Next

- Document review skill — doc-type-specific briefing and review criteria
- Customizable email triage — user-defined triage rules and folder behaviors

## Backlog

- Automated eval suite — behavioral testing infrastructure built from real-usage experience
- Install support for Gemini, Codex, and other AI tools (beyond Claude Code v1 scope)
- Open-source contribution model

## How to Request Features

Open an issue. Describe the workflow you're trying to solve, not just the feature. Issues with concrete use cases get prioritized.

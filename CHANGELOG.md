# Changelog

All notable user-facing changes to Myna will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Install script for Kiro (`install/kiro.sh` + `install/lib.sh`). Ports Myna's skills to
  Kiro by transforming frontmatter and scaffolding the vault. Refactors `install/claude.sh`
  to share vault setup logic via `install/lib.sh`.

### Changed

- Journal folder now shows only the current daily, weekly, and monthly note — older notes move to archive automatically when new ones are created
- Customization override model: per-skill overrides now live at `~/.myna/overrides/skills/myna-{skill-name}.md` and routing overrides at `~/.myna/overrides/routing.md`, replacing the `CUSTOM.md` and `custom-routing.md` files from v1.0.0. Users who set up customizations under the old model will need to migrate their files to the new paths.

## [1.0.0] — 2026-04-25

### Added

- 24 feature skills covering the full Chief of Staff workflow: email triage, message processing, draft replies, meeting prep and processing, project and person briefings, team health, 1:1 analysis, unreplied thread tracking, blocker scanning, performance narrative, drafting, rewriting, quick capture, calendar time blocks, self-tracking, context parking, emergent memory, and review queue processing.
- 6 steering skills loaded at session start: safety and containment, data conventions, output quality, system behavior, memory model, and vault operations. These enforce cross-cutting rules (draft-never-send, vault-only writes, provenance markers, append-only discipline) without repeating them in every feature skill.
- Install script (`install.sh`) that copies skills to `~/.claude/skills/`, generates the agent file at `~/.claude/agents/myna.md`, and creates the vault folder structure with config stubs.
- Vault templates for all entity types: daily note, weekly note, project, person, 1:1 meeting, recurring meeting, ad-hoc meeting, draft, review queue, contributions, and dashboard.
- Config file system: `workspace.yaml` (identity, preferences, feature toggles), `projects.yaml`, `people.yaml`, `meetings.yaml`, `communication-style.yaml`, `tags.yaml`. All config is human-editable YAML; `.example` files ship with the repo.
- Customization layer: `CUSTOM.md` in the vault for user-specific routing overrides and behavior tweaks without editing core skill files. Custom skill namespacing so user-built skills coexist with Myna skills without naming conflicts.
- Config UI skill (`myna-config-ui`) for visual setup of workspace.yaml and related config files — guided prompts, validation, and inline explanations.
- Guided onboarding skill (`myna-setup`) that walks new users through vault creation, config file setup, and a first sync — zero manual file editing required to get started.

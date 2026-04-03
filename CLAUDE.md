# Myna — Project Instructions

## What is this project?

Myna is a local-first personal assistant for tech professionals. It's a set of AI agents that manage emails, Slack, meetings, projects, tasks, and people — drafting but never sending, organizing but never deciding. All data lives in an Obsidian vault as plain markdown.

**Status:** Idea refinement and requirements phase. Not yet in implementation.

## Key Documents

Read these before doing any work:

| File | Purpose |
|------|---------|
| `docs/vision.md` | North star — what Myna is, who it's for, core principles |
| `docs/decisions.md` | Settled decisions — do not re-debate these |
| `docs/open-questions.md` | Unresolved questions — add here if you surface new ones |
| `docs/design-context.md` | **IGNORE unless explicitly asked.** Early brainstorm from a different AI tool. Many ideas here were rejected or rethought. Do not pull from this unprompted. |
| `docs/requirements.md` | **IGNORE unless explicitly asked.** Early brainstorm specs — many are wrong or outdated. Do not use as a starting point for requirements. |

## Requirement Files (by domain)

Each file covers one domain of Myna's functionality. These are being actively refined.

| File | Domain |
|------|--------|
| `docs/requirements/email-and-messaging.md` | Email triage, thread summaries, message processing |
| `docs/requirements/meetings-and-calendar.md` | Meeting notes, briefs, debriefs, calendar writes |
| `docs/requirements/projects-and-tasks.md` | Project files, tasks, timelines, context switching |
| `docs/requirements/people-management.md` | Person files, observations, feedback, recognition |
| `docs/requirements/daily-workflow.md` | Daily notes, planning, syncs, summaries, dashboards |
| `docs/requirements/writing-and-drafts.md` | Email drafts, rewrites, structured messages, doc review |
| `docs/requirements/self-tracking.md` | Own contributions, brag docs, promo packets, self-reviews |

## Development Journal

`docs/dev-journal.md` is a running log for a post-launch article about building Myna entirely with Claude. **Err on the side of writing too much — we'll filter later.** Write a journal entry for ANY of the following:

- A decision was made (and why — the reasoning is the interesting part)
- Something surprised you or the user
- An approach worked well (or failed) — and why
- The user corrected Claude's direction or thinking
- A requirement changed or was added/removed
- An interesting trade-off was discussed
- Claude autonomously designed, built, tested, or fixed something
- A feature was completed or a milestone reached
- A pattern or workflow emerged for AI-assisted development
- Human intervention was needed (what and why)
- Human intervention was NOT needed where you'd expect it would be
- Claude made a mistake — what kind, how it was caught, how it was fixed
- An idea came from an unexpected place (e.g. a different AI tool, a workaround)
- Anything about multi-thread coordination, context transfer, or AI-to-AI handoffs
- Anything that would make a reader say "huh, that's interesting"

**Do NOT skip entries because they seem minor.** A small moment during build might be the best anecdote in the article. When in doubt, write it down.

## Git Conventions

- **Never auto-commit.** Only commit when the user explicitly asks.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`, `style:`, `ci:`, `build:`
- Keep commits atomic — one logical change per commit
- Write clear commit messages: subject line explains the "what", body explains the "why" if needed

## Ground Rules

1. **Vision is authoritative.** If a requirement contradicts `docs/vision.md`, the vision wins.
2. **Decisions are settled.** Don't re-open items in `docs/decisions.md` unless the user explicitly asks.
3. **Ignore design-context.md and requirements.md.** These are from an earlier brainstorm with a different AI tool. Many ideas in them are wrong or were rethought. Do NOT read them, pull from them, or use them as a starting point — unless the user explicitly asks you to look at them.
4. **Add open questions.** If you surface a question that isn't answered by existing docs, add it to `docs/open-questions.md`.
5. **Add decisions.** If the user settles a question during your conversation, add it to `docs/decisions.md`.
6. **AI model agnostic.** Never assume a specific AI provider. Myna must work with Claude, Gemini, Codex, Kiro, etc.
7. **Draft, never send.** Myna never sends emails, posts messages, or takes external actions (except personal calendar events with no attendees).

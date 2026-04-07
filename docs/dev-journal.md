# Development Journal

Raw material for the post-launch article: "How one person built a sophisticated personal assistant by prompting Claude."

This journal captures high-level ideas, decisions, surprises, what worked, what didn't — not every prompt, but the moments worth writing about.

**Intended use:** Claude writes entries throughout the build. After launch, this becomes the source material for a blog post / article.

**Tone:** Honest, specific, concrete. Not a changelog — a story.

**Previous entries:** `dev-journal-1.md`

---

## When to write an entry

Err on the side of writing too much — we'll filter later. Write a journal entry for ANY of the following:

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
- An idea came from an unexpected place (e.g. a workaround, a user insight)
- Anything about multi-thread coordination, context transfer, or AI-to-AI handoffs
- Anything that would make a reader say "huh, that's interesting"

**Do NOT skip entries because they seem minor.** A small moment during build might be the best anecdote in the article. When in doubt, write it down.

---

## Format

```
### [DATE] Title
**Phase:** Vision | Requirements | Design | Build | Test | Ship
**What happened:** (1-3 sentences)
**Why it matters:** (for the blog — what's interesting about this?)
**Surprise/lesson:** (optional — what was unexpected?)
```

---

### 2026-04-06 Phase 1 autonomous build: Batches A–C complete
**Phase:** Build
**What happened:** The orchestrator spawned Subagent 1 (foundations revision), then Subagent 2 (MCP server), then 8 skill subagents in parallel — all 14 skill files built simultaneously. Foundations was revised (§7 MCP tool surface expanded from 7 abstract tools to 15 concrete Obsidian CLI operations). MCP server compiled cleanly on first try (503 lines, 19 tools). All 14 skills produced in one parallel batch totaling 2,281 lines across 14 files.
**Why it matters:** This is the first real test of the autonomous build methodology. The parallel skill build is the key throughput multiplier — 8 independent subagents reading the same design docs and producing independent artifacts without coordination. The fact that all 14 files were produced with correct section structure, no "see foundations.md" references, and reasonable line counts (93–230) suggests the design phase invested enough in foundations and architecture to enable truly parallel builds.
**Surprise/lesson:** Every subagent independently noticed the same feature file inconsistency (Drafts/Email/ subfolder vs flat Drafts/ with prefixed filenames) and independently chose the correct resolution (foundations is authoritative for data layer). This is the payoff of the "architecture is authoritative, foundations is authoritative for data layer" decision hierarchy — subagents don't need coordination when the authority chain is clear. The Golden Rule also held: process.md came in shorter than expected (160 lines vs 200-250 target) because the extraction logic is naturally what LLMs do well, so the skill correctly focused on routing and provenance rules instead of teaching the LLM how to extract data.

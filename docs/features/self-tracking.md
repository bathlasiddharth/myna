# Self Tracking — Features

**Scope:** Tracking your own contributions, decisions, impact, feedback given, reviews done. Generating brag docs, promo packets, self-reviews.

---

## Features

### Contributions Tracking

One-line summary: Track your personal contributions as Myna processes your emails, meetings, and project data — provenance markers show what's certain vs inferred.

- Three write paths (provenance marker system):
  - **User-typed** ("log contribution: led the auth migration design review") → direct write with `[User]` tag
  - **Agent-extracted, high confidence** (you completed a task, you made a decision logged in a timeline) → direct write with `[Auto]` tag and source reference
  - **Agent-extracted, uncertain** (agent thinks you might have influenced an outcome but isn't sure) → written with `[Inferred]` tag, or review queue if genuinely ambiguous
- Contribution categories (IC-oriented): decisions & influence, unblocking others, issue prevention, code reviews, feedback given, documentation, escalations handled, delegation management, best practices established, risk mitigation, coaching & mentoring
- Contribution categories (manager/PM-oriented): people development (coached someone to promotion, grew a skill), operational improvements (reduced pages, improved process), strategic alignment (drove consensus across teams, influenced roadmap), hiring & team building (interviews, onboarding), cross-team leadership (coordinated multi-team efforts, resolved organizational blockers), stakeholder management (navigated competing priorities, built relationships with partner teams)
- **Accuracy note on manager categories:** IC contributions like "submitted a code review" are easy for the agent to detect from structured data. Manager contributions like "drove alignment across 3 teams" are much harder to infer — they're embedded in meeting discussions and email threads with no clear signal. For manager-type categories, the manual logging path ("log contribution: drove consensus on the API design across Platform and Payments teams") is the primary path. The agent should be conservative about inferring these — when in doubt, stage it in `ReviewQueue/review-self.md` rather than writing it directly. A fabricated contribution written with `[Inferred]` erodes trust, but a missed contribution impacts career growth since the user won't have a complete picture at review time. The review queue lets the user decide — that's what it's for.
- Category set adapts based on the user's role — configured during setup or communication style interview
- Each entry: date, description, category, source (meeting/email/project), impact (if stated)
- `[Inferred]` contributions are flagged so you can verify them when browsing. Features that compile contributions (self-narrative, brag doc) highlight `[Inferred]` entries so you double-check before using them.
- Contributions log stored in `myna/Journal/contributions.md` or similar

### Self-Narrative Generation

One-line summary: Compile your approved contributions into brag docs, self-reviews, or promotion packets on demand.

- Three output modes:
  - **Brag Doc:** "What did I do this quarter?" → chronological list of contributions with impact, organized by category. Quick, factual, shareable.
  - **Self-Review:** "Draft my self-review for H1" → narrative organized by competency areas or goals from workspace config. Reads as a genuine self-assessment — no AI tells, no inflation.
  - **Promo Packet:** "Build my promo case" → evidence-based case for promotion, organized by level criteria. Each claim backed by specific contributions with dates and context.
- Assembles from approved contributions over a specified time period (default: last quarter)
- Can cross-reference: project timelines (for project-level impact), person files (for feedback you gave), meeting notes (for decisions you drove)
- Output saved to `Drafts/` for user editing
- **Self-calibration mode:** "Am I underselling myself?" — analyzes your contributions against the claims in your draft. Flags: claims without supporting evidence, contributions you logged but didn't include, areas where the language is weaker than the evidence supports. Particularly useful for people who tend to downplay their work — the system has the objective record.
- **Why this is needed:** The vision explicitly calls out brag docs, promo packets, and self-reviews as outputs. F24 covered data collection but not the generation step. This is the payoff feature — where accumulated contributions become usable documents.

### Contribution Queries

One-line summary: Query your contributions log to answer specific questions about what you've done.

- "What feedback did I give this quarter?" → filters contributions by category (coaching/feedback)
- "What did I do on the Auth Migration project?" → filters by project
- "Show my contributions from March" → filters by date range
- "How many code reviews did I do this month?" → count by category
- Output shown inline — useful for quick self-check or preparing for a conversation
- **Why this is needed:** The contributions log accumulates data over months. Without a query capability, the user has to read through the entire log. Targeted queries make the data actionable day-to-day, not just at review time.


# Myna — Roadmap

Living task list. Updated by Claude as work progresses.

---

## Task Tracker

### Milestone 1: Finalize Requirements

| Task | Description | Status |
|------|------------|--------|
| M1-T01 | Write `docs/vision.md` | Done |
| M1-T02 | Set up `docs/decisions.md` | Done |
| M1-T03 | Set up `docs/open-questions.md` | Done |
| M1-T04 | Set up CLAUDE.md | Done |
| M1-T05 | Create domain requirement skeletons | Done |
| M1-T06 | Create `docs/requirements/cross-domain.md` | Done |
| M1-T07 | Create `docs/requirements/non-functional.md` | Done |
| M1-T08 | Create `docs/design-deliverables.md` | Done |
| M1-T09 | Claude refines feature lists for all domains | Done |
| M1-T10 | User reviews refined feature lists | Done |
| M1-T11 | Email & Messaging requirements | Not started |
| M1-T12 | Meetings & Calendar requirements | Not started |
| M1-T13 | Projects & Tasks requirements | Not started |
| M1-T14 | People Management requirements | Not started |
| M1-T15 | Daily Workflow requirements | Not started |
| M1-T16 | Writing & Drafts requirements | Not started |
| M1-T17 | Self Tracking requirements | Not started |
| M1-T18 | Setup & Config requirements | Not started |
| M1-T19 | Cross-domain interactions | Not started |
| M1-T20 | Non-functional requirements | Not started |
| M1-T21 | Requirements consistency review | Not started |
| M1-T22 | User review of all requirements | Not started |
| M1-T23 | Prioritization within P0 | Not started |

### Milestone 2: Design

| Task | Description | Status |
|------|------------|--------|
| M2-T01 | Autonomous design | Not started |
| M2-T02 | Design review and iteration | Not started |

### Milestone 3: Build

| Task | Description | Status |
|------|------------|--------|
| M3-T01 | Build plan and implementation | Not started |
| M3-T02 | User review and iteration | Not started |

### Milestone 4: Ship

| Task | Description | Status |
|------|------------|--------|
| M4-T01 | Final testing and documentation | Not started |

### Backlog

| Task | Description | Status |
|------|------------|--------|
| B001 | Scan-and-suggest setup mode (Q008) | Backlog |
| B002 | Local web UI for review queue (Q006) | Backlog |
| B003 | P1: Automation via headless agents | Backlog |
| B004 | `/build-feature` pipeline (feature → requirements → design → build → present) | Backlog |
| B005 | `/development` pipeline (implement → test → review → fix → re-test loop) | Backlog |
| B006 | Feature toggles — all agent instructions check toggles before offering features | P0 |
| B007 | Default profiles by role (manager, PM, IC) that pre-configure feature toggles | Backlog |
| B008 | Customizable output templates for briefings, status summaries, narratives | Backlog |

---

## Task Details

### Milestone 1: Finalize Requirements
> **Goal:** All requirement files complete enough for Claude to autonomously design the system.

#### Feature Refinement (do before domain requirement threads)

**M1-T09 — Claude refines and completes feature lists for all domains**
```
Prompt: See docs/prompts/feature-refinement.md — copy-paste the full prompt into a new thread.
```

**M1-T10 — User reviews refined feature lists**
```
No prompt — read each docs/features/*.md file. For each domain, review the "## Features" section Claude wrote. Copy what you approve to the "## Features" section in the corresponding docs/requirements/*.md file. Edit, remove, or add as needed.
```

#### Domain Requirements (one thread each, can run in parallel)

**M1-T11 — Email & Messaging requirements**
Finalize `docs/requirements/email-and-messaging.md`
```
Prompt: You're working on email & messaging requirements for Myna. Read docs/instructions/requirements.md for how to write requirements. Read docs/vision.md and docs/decisions.md to understand the project.

Your work has two phases:

PHASE 1 — Review features and align. Read docs/features/email-and-messaging.md for brainstorm notes, then read the "## Features" section in docs/requirements/email-and-messaging.md. These are verified features I want built. Review each one, ask me clarifying questions to make sure you fully understand what I want. Don't assume — if something is unclear or ambiguous, ask. Track open questions in docs/open-questions.md. Do NOT move to phase 2 until we've resolved all questions and are aligned on every feature.

PHASE 2 — Write requirements. Turn each agreed feature into a detailed requirement following the format in docs/instructions/requirements.md. As you write, if you discover new ambiguities or edge cases, ask me — don't assume. Track any new open questions. Write the final requirements to docs/requirements/email-and-messaging.md (replacing the features section with full requirements).
```

**M1-T12 — Meetings & Calendar requirements**
Finalize `docs/requirements/meetings-and-calendar.md`
```
Prompt: You're working on meetings & calendar requirements for Myna. Read docs/instructions/requirements.md for how to write requirements. Read docs/vision.md and docs/decisions.md to understand the project.

Your work has two phases:

PHASE 1 — Review features and align. Read docs/features/meetings-and-calendar.md for brainstorm notes, then read the "## Features" section in docs/requirements/meetings-and-calendar.md. These are verified features I want built. Review each one, ask me clarifying questions to make sure you fully understand what I want. Don't assume — if something is unclear or ambiguous, ask. Track open questions in docs/open-questions.md. Do NOT move to phase 2 until we've resolved all questions and are aligned on every feature.

PHASE 2 — Write requirements. Turn each agreed feature into a detailed requirement following the format in docs/instructions/requirements.md. As you write, if you discover new ambiguities or edge cases, ask me — don't assume. Track any new open questions. Write the final requirements to docs/requirements/meetings-and-calendar.md (replacing the features section with full requirements).
```

**M1-T13 — Projects & Tasks requirements**
Finalize `docs/requirements/projects-and-tasks.md`
```
Prompt: You're working on projects & tasks requirements for Myna. Read docs/instructions/requirements.md for how to write requirements. Read docs/vision.md and docs/decisions.md to understand the project.

Your work has two phases:

PHASE 1 — Review features and align. Read docs/features/projects-and-tasks.md for brainstorm notes, then read the "## Features" section in docs/requirements/projects-and-tasks.md. These are verified features I want built. Review each one, ask me clarifying questions to make sure you fully understand what I want. Don't assume — if something is unclear or ambiguous, ask. Track open questions in docs/open-questions.md. Do NOT move to phase 2 until we've resolved all questions and are aligned on every feature.

PHASE 2 — Write requirements. Turn each agreed feature into a detailed requirement following the format in docs/instructions/requirements.md. As you write, if you discover new ambiguities or edge cases, ask me — don't assume. Track any new open questions. Write the final requirements to docs/requirements/projects-and-tasks.md (replacing the features section with full requirements).
```

**M1-T14 — People Management requirements**
Finalize `docs/requirements/people-management.md`
```
Prompt: You're working on people management requirements for Myna. Read docs/instructions/requirements.md for how to write requirements. Read docs/vision.md and docs/decisions.md to understand the project.

Your work has two phases:

PHASE 1 — Review features and align. Read docs/features/people-management.md for brainstorm notes, then read the "## Features" section in docs/requirements/people-management.md. These are verified features I want built. Review each one, ask me clarifying questions to make sure you fully understand what I want. Don't assume — if something is unclear or ambiguous, ask. Track open questions in docs/open-questions.md. Do NOT move to phase 2 until we've resolved all questions and are aligned on every feature.

PHASE 2 — Write requirements. Turn each agreed feature into a detailed requirement following the format in docs/instructions/requirements.md. As you write, if you discover new ambiguities or edge cases, ask me — don't assume. Track any new open questions. Write the final requirements to docs/requirements/people-management.md (replacing the features section with full requirements).
```

**M1-T15 — Daily Workflow requirements**
Finalize `docs/requirements/daily-workflow.md`
```
Prompt: You're working on daily workflow requirements for Myna. Read docs/instructions/requirements.md for how to write requirements. Read docs/vision.md and docs/decisions.md to understand the project.

Your work has two phases:

PHASE 1 — Review features and align. Read docs/features/daily-workflow.md for brainstorm notes, then read the "## Features" section in docs/requirements/daily-workflow.md. These are verified features I want built. Review each one, ask me clarifying questions to make sure you fully understand what I want. Don't assume — if something is unclear or ambiguous, ask. Track open questions in docs/open-questions.md. Do NOT move to phase 2 until we've resolved all questions and are aligned on every feature.

PHASE 2 — Write requirements. Turn each agreed feature into a detailed requirement following the format in docs/instructions/requirements.md. As you write, if you discover new ambiguities or edge cases, ask me — don't assume. Track any new open questions. Write the final requirements to docs/requirements/daily-workflow.md (replacing the features section with full requirements).
```

**M1-T16 — Writing & Drafts requirements**
Finalize `docs/requirements/writing-and-drafts.md`
```
Prompt: You're working on writing & drafts requirements for Myna. Read docs/instructions/requirements.md for how to write requirements. Read docs/vision.md and docs/decisions.md to understand the project.

Your work has two phases:

PHASE 1 — Review features and align. Read docs/features/writing-and-drafts.md for brainstorm notes, then read the "## Features" section in docs/requirements/writing-and-drafts.md. These are verified features I want built. Review each one, ask me clarifying questions to make sure you fully understand what I want. Don't assume — if something is unclear or ambiguous, ask. Track open questions in docs/open-questions.md. Do NOT move to phase 2 until we've resolved all questions and are aligned on every feature.

PHASE 2 — Write requirements. Turn each agreed feature into a detailed requirement following the format in docs/instructions/requirements.md. As you write, if you discover new ambiguities or edge cases, ask me — don't assume. Track any new open questions. Write the final requirements to docs/requirements/writing-and-drafts.md (replacing the features section with full requirements).
```

**M1-T17 — Self Tracking requirements**
Finalize `docs/requirements/self-tracking.md`
```
Prompt: You're working on self tracking requirements for Myna. Read docs/instructions/requirements.md for how to write requirements. Read docs/vision.md and docs/decisions.md to understand the project.

Your work has two phases:

PHASE 1 — Review features and align. Read docs/features/self-tracking.md for brainstorm notes, then read the "## Features" section in docs/requirements/self-tracking.md. These are verified features I want built. Review each one, ask me clarifying questions to make sure you fully understand what I want. Don't assume — if something is unclear or ambiguous, ask. Track open questions in docs/open-questions.md. Do NOT move to phase 2 until we've resolved all questions and are aligned on every feature.

PHASE 2 — Write requirements. Turn each agreed feature into a detailed requirement following the format in docs/instructions/requirements.md. As you write, if you discover new ambiguities or edge cases, ask me — don't assume. Track any new open questions. Write the final requirements to docs/requirements/self-tracking.md (replacing the features section with full requirements).
```

#### Cross-Cutting Requirements (start after domain threads are substantially done)

> **Dependency:** M1-T18 through M1-T20 should start after most domain threads (M1-T11 through M1-T17) are done or close to done.

**M1-T18 — Setup & Config requirements**
Finalize `docs/requirements/setup-and-config.md`
```
Prompt: You're working on setup and config requirements for Myna. Read docs/instructions/requirements.md for how to write requirements. Read docs/vision.md and docs/decisions.md to understand the project (especially D009 — interactive setup).

Your work has two phases:

PHASE 1 — Review features and align. Read docs/features/setup-and-config.md for brainstorm notes, then read the "## Features" section in docs/requirements/setup-and-config.md. These are verified features I want built. Review each one, ask me clarifying questions to make sure you fully understand what I want. Don't assume — if something is unclear or ambiguous, ask. Track open questions in docs/open-questions.md. Do NOT move to phase 2 until we've resolved all questions and are aligned on every feature.

PHASE 2 — Write requirements. Turn each agreed feature into a detailed requirement following the format in docs/instructions/requirements.md. As you write, if you discover new ambiguities or edge cases, ask me — don't assume. Track any new open questions. Write the final requirements to docs/requirements/setup-and-config.md (replacing the features section with full requirements).
```

**M1-T19 — Cross-domain interactions**
Finalize `docs/requirements/cross-domain.md`
```
Prompt: You're working on cross-domain interaction requirements for Myna. Read docs/instructions/requirements.md for how to write requirements. Read docs/vision.md, docs/decisions.md, and ALL files in docs/requirements/ to understand what each domain does.

Your work has two phases:

PHASE 1 — Review features and align. Read docs/features/cross-domain.md for brainstorm notes (including "Key Interactions to Define"), then read the "## Features" section in docs/requirements/cross-domain.md. Ask me clarifying questions to make sure you fully understand what I want. Don't assume — if something is unclear or ambiguous, ask. Track open questions in docs/open-questions.md. Do NOT move to phase 2 until we've resolved all questions and are aligned.

PHASE 2 — Write requirements. Define how data flows between all domains, shared concepts (review queue, config, fuzzy name resolution), and dependencies. Also catalog what vault operations the agent needs across all domains (this informs the Obsidian CLI MCP design). As you write, if you discover new ambiguities, ask me. Write the final requirements to docs/requirements/cross-domain.md.
```

**M1-T20 — Non-functional requirements**
Finalize `docs/requirements/non-functional.md`
```
Prompt: You're working on non-functional requirements for Myna. Read docs/instructions/requirements.md for how to write requirements. Read docs/vision.md and docs/decisions.md to understand the project.

Your work has two phases:

PHASE 1 — Review features and align. Read docs/features/non-functional.md for brainstorm notes, then read the "## Features" section in docs/requirements/non-functional.md. These are verified system-wide behaviors I want enforced. Review each one, ask me clarifying questions to make sure you fully understand what I want. Don't assume — if something is unclear or ambiguous, ask. Track open questions in docs/open-questions.md. Do NOT move to phase 2 until we've resolved all questions and are aligned.

PHASE 2 — Write requirements. Turn each agreed behavior into a detailed non-functional requirement with acceptance criteria. As you write, if you discover new ambiguities or edge cases, ask me — don't assume. Write the final requirements to docs/requirements/non-functional.md.
```

#### Final Review

**M1-T21 — Requirements consistency review**
```
Prompt: You're doing a final consistency review of all Myna requirements before the design phase. Read docs/instructions/requirements.md, then read ALL files: docs/vision.md, docs/decisions.md, docs/open-questions.md, docs/design-deliverables.md, and every file in docs/requirements/. Check for: contradictions between domain files, gaps where a feature references something no domain owns, inconsistencies with the vision, unresolved open questions that block design, missing entries in docs/design-deliverables.md, and cross-domain data flows that aren't captured. Write your findings and fix what you can. Flag anything that needs my input.
```

**M1-T22 — User review of all requirements**
```
No prompt — this is your read-through. Read every file in docs/requirements/ and verify: "is this what I meant?" Claude catches contradictions; you catch intent mismatches. Mark up anything that needs changing, then fix in the coordination thread or a follow-up thread.
```

**M1-T23 — Prioritization within P0**
```
Prompt: Read all finalized requirements in docs/requirements/. Help me prioritize features within P0 (interactive prompts). For each domain, categorize every feature as: "must have for v1" (needed to be useful on day 1) or "can add later" (valuable but not essential for first release). Present your recommendation with reasoning, then we discuss and finalize. Write the agreed priority to each requirement file (add a priority tag to each feature). Also identify build order dependencies — which features must exist before others can work.
```

---

### Milestone 2: Design
> **Goal:** Claude autonomously produces all design deliverables. User reviews and approves.
> Design may require multiple sessions if the scope exceeds a single context window.

**M2-T01 — Autonomous design**
```
Prompt: You're the architect for Myna. Read docs/instructions/design.md for how to work. Read ALL project docs: docs/vision.md, docs/decisions.md, docs/open-questions.md, docs/design-deliverables.md, and every file in docs/requirements/. Your job is to autonomously produce every deliverable listed in docs/design-deliverables.md. Create whatever files and folders are needed. Check off items in design-deliverables.md as you complete them. If the scope is too large for one session, prioritize the most foundational deliverables first (vault structure, config system, data flows) and note where you stopped. When done or pausing, summarize what you produced and flag anything that needs my review.
```

**M2-T02 — Design review and iteration**
```
Prompt: I've reviewed the design you produced for Myna. Read docs/instructions/design.md for how to work. Start by reading docs/design-deliverables.md to see what was produced, then I'll share my feedback.
```

---

### Milestone 3: Build
> **Goal:** Claude autonomously builds, tests, reviews, fixes, and re-tests. Comes to user only after multiple self-review iterations.

**M3-T01 — Build plan and implementation**
```
Prompt: You're building Myna. Read docs/instructions/build.md for how to work. Read all design docs and requirements. Create a build plan, then implement autonomously: write code, create files, set up project structure, write tests, run tests, fix issues, re-test. After the first pass, review your own code for quality, security, and consistency — then fix what you find, re-run tests, and review again. Do at least 3 iterations of build → test → review → fix before coming to me. Update docs/roadmap.md as you progress. When you're confident the code is solid, summarize: what you built, what tests pass, what you reviewed, and any open issues that need my judgment.
```

**M3-T02 — User review and iteration**
```
Prompt: I've reviewed and tested the Myna build. Read docs/instructions/build.md for how to work. Start by reading the current codebase state, then I'll share my feedback. After incorporating feedback, do another round of test → review → fix before coming back to me.
```

---

### Milestone 4: Ship
> **Goal:** Myna is usable end-to-end.

**M4-T01 — Final testing and documentation**
```
Prompt: Myna is feature-complete. Read docs/instructions/build.md for how to work. Do a final pass: run all tests, fix any issues, ensure documentation matches implementation, verify the setup flow works end-to-end, and write a README suitable for open-source release. Update docs/roadmap.md when complete.
```

---

### Backlog

- **B001** — Q008: Scan-and-suggest setup mode (auto-detect projects from email folders/Slack channels)
- **B002** — Q006: Local web UI for review queue and draft management
- **B003** — P1: Automation (scheduled/background agents via headless AI agent runs)
- **B004** — `/build-feature` pipeline: single command that takes a feature idea through the full SDLC autonomously — feature description → requirements (self-check against vision/decisions/non-functional) → design → calls `/development` pipeline → present for review. Human checkpoint after requirements; everything after is autonomous.
- **B005** — `/development` pipeline: autonomous build loop called by `/build-feature` or standalone — implement → test → review own code → fix issues → re-test (3+ iterations) → present. Reads from `instructions/build.md`. No human input until it's confident the code is solid.
- **B006** — (P0) Feature toggles: extend workspace.md feature toggles to cover all major features (enable/disable per feature). Agent instructions and steering files check toggles before offering features. Baked into P0 so every agent instruction file is toggle-aware from the start — retrofitting is painful.
- **B007** — Default profiles by role (manager, PM, IC) that pre-configure sensible feature toggle defaults.
- **B008** — Customizable output templates for briefings, status summaries, and narratives. P0 uses default formats defined in agent instructions; this adds user-editable templates if demand emerges.
- **B009** — Automated document review with doc-type-specific criteria (design doc, 6-pager/narrative, MBR/MTR/QBR, decision review). Structured feedback per doc type, saved to `Drafts/Reviews/`. Removed from writing-and-drafts P0 scope.

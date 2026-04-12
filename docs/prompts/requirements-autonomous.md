# Autonomous Requirements Writing — Prompts

Launch one Claude Code Web session per file. All 10 can run in parallel.

## How assumptions and questions work

Every prompt instructs the agent to:
1. Write the best requirements it can from the finalized features
2. When it hits ambiguity — log it to TWO places:
   - `docs/assumptions/{domain}.md` — dedicated file per domain with every assumption and open question, tagged as `[ASSUMPTION]` or `[OPEN QUESTION]`
   - Inline in the requirements with `⚠ ASSUMPTION:` marker so you can spot them while reading
3. Never silently decide — every judgment call must be visible and reviewable
4. After writing, summarize the count of assumptions and open questions at the bottom

When you return: review `docs/assumptions/` first to get the full picture, then read each requirements file.

---

## Prompt 1: Email & Messaging (M1-T11)

```
You're writing detailed requirements for Myna's email and messaging domain. The features have already been reviewed and finalized by the user. Your job is to turn them into implementation-ready requirements.

IMPORTANT RULES:
- If something is ambiguous or unclear, DO NOT silently assume. Log it to docs/assumptions/email-and-messaging.md AND mark it inline in the requirements with "⚠ ASSUMPTION:" so the user can review later.
- If you need clarification that would change the requirement significantly, log it as an [OPEN QUESTION] in docs/assumptions/email-and-messaging.md. Write the requirement using your best judgment but mark the assumption inline.
- Every judgment call you make must be visible. The user will review all assumptions and open questions later and refine the requirements based on their answers.

Read these files first (in this order):
1. docs/instructions/requirements.md — the format you MUST follow for every requirement
2. docs/vision.md — the north star
3. docs/decisions.md — all settled decisions (D001-D024), don't re-debate
4. docs/features/non-functional.md — system-wide rules (provenance markers, review queue criteria, never-overwrite, extraction rules, human-sounding output). Every requirement must be consistent with these.
5. docs/features/cross-domain.md — cross-domain interaction map showing how data flows between domains
6. docs/requirements/email-and-messaging.md — the features you're turning into requirements (under ## Features)

Now write detailed requirements for EVERY feature listed in the ## Features section. Follow the exact format from docs/instructions/requirements.md — every feature needs: what it does, how the user triggers it, step-by-step behavior, output format, data flow (reads from / writes to / triggers), edge cases, acceptance criteria, and dependencies.

Be extremely detailed and specific. The requirements must be detailed enough for Claude to autonomously design and build the system without asking clarifying questions. Specify exact file paths, exact markdown formats, exact provenance marker usage, exact review queue routing.

Create docs/assumptions/email-and-messaging.md with this format:
---
# Email & Messaging — Assumptions & Open Questions

Items marked [ASSUMPTION] are decisions the agent made during requirements writing.
Items marked [OPEN QUESTION] need user input before the requirement is final.

## Assumptions
- [ASSUMPTION] A001: description of assumption and why it was made. Affects: requirement X.
- ...

## Open Questions
- [OPEN QUESTION] Q001: the question. Context: why it matters. Affects: requirement X.
- ...
---

Write the final requirements to docs/requirements/email-and-messaging.md — replace the ## Features section with a ## Requirements section containing the full detailed requirements. Keep the rest of the file intact.

At the bottom of the requirements file, add a ## Review Notes section with: count of assumptions made, count of open questions logged, and a pointer to docs/assumptions/email-and-messaging.md.

Do NOT commit. The user will review and refine before committing.
```

---

## Prompt 2: Meetings & Calendar (M1-T12)

```
You're writing detailed requirements for Myna's meetings and calendar domain. The features have already been reviewed and finalized by the user. Your job is to turn them into implementation-ready requirements.

IMPORTANT RULES:
- If something is ambiguous or unclear, DO NOT silently assume. Log it to docs/assumptions/meetings-and-calendar.md AND mark it inline in the requirements with "⚠ ASSUMPTION:" so the user can review later.
- If you need clarification that would change the requirement significantly, log it as an [OPEN QUESTION] in docs/assumptions/meetings-and-calendar.md. Write the requirement using your best judgment but mark the assumption inline.
- Every judgment call you make must be visible. The user will review all assumptions and open questions later and refine the requirements based on their answers.

Read these files first (in this order):
1. docs/instructions/requirements.md — the format you MUST follow for every requirement
2. docs/vision.md — the north star
3. docs/decisions.md — all settled decisions (D001-D024), don't re-debate
4. docs/features/non-functional.md — system-wide rules (provenance markers, review queue criteria, never-overwrite, extraction rules, human-sounding output). Every requirement must be consistent with these.
5. docs/features/cross-domain.md — cross-domain interaction map showing how data flows between domains
6. docs/requirements/meetings-and-calendar.md — the features you're turning into requirements (under ## Features)

Now write detailed requirements for EVERY feature listed in the ## Features section. Follow the exact format from docs/instructions/requirements.md — every feature needs: what it does, how the user triggers it, step-by-step behavior, output format, data flow (reads from / writes to / triggers), edge cases, acceptance criteria, and dependencies.

Be extremely detailed and specific. The requirements must be detailed enough for Claude to autonomously design and build the system without asking clarifying questions. Specify exact file paths, exact markdown formats, exact provenance marker usage, exact review queue routing. Pay special attention to D022 (meetings from calendar, not registry) and the meeting type inference logic.

Create docs/assumptions/meetings-and-calendar.md with the same format (Assumptions + Open Questions, each tagged and cross-referenced to the affected requirement).

Write the final requirements to docs/requirements/meetings-and-calendar.md — replace the ## Features section with a ## Requirements section. Keep the rest of the file intact.

At the bottom, add a ## Review Notes section with counts and a pointer to the assumptions file.

Do NOT commit. The user will review and refine before committing.
```

---

## Prompt 3: Projects & Tasks (M1-T13)

```
You're writing detailed requirements for Myna's projects and tasks domain. The features have already been reviewed and finalized by the user. Your job is to turn them into implementation-ready requirements.

IMPORTANT RULES:
- If something is ambiguous or unclear, DO NOT silently assume. Log it to docs/assumptions/projects-and-tasks.md AND mark it inline in the requirements with "⚠ ASSUMPTION:" so the user can review later.
- If you need clarification that would change the requirement significantly, log it as an [OPEN QUESTION] in docs/assumptions/projects-and-tasks.md. Write the requirement using your best judgment but mark the assumption inline.
- Every judgment call you make must be visible. The user will review all assumptions and open questions later and refine the requirements based on their answers.

Read these files first (in this order):
1. docs/instructions/requirements.md — the format you MUST follow for every requirement
2. docs/vision.md — the north star
3. docs/decisions.md — all settled decisions (D001-D024), don't re-debate
4. docs/features/non-functional.md — system-wide rules (provenance markers, review queue criteria, never-overwrite, extraction rules, human-sounding output). Every requirement must be consistent with these.
5. docs/features/cross-domain.md — cross-domain interaction map showing how data flows between domains
6. docs/requirements/projects-and-tasks.md — the features you're turning into requirements (under ## Features)

Now write detailed requirements for EVERY feature listed in the ## Features section. Follow the exact format from docs/instructions/requirements.md — every feature needs: what it does, how the user triggers it, step-by-step behavior, output format, data flow (reads from / writes to / triggers), edge cases, acceptance criteria, and dependencies.

Be extremely detailed and specific. The requirements must be detailed enough for Claude to autonomously design and build the system without asking clarifying questions. Specify exact file paths, exact markdown formats, exact provenance marker usage, exact task field formats (Obsidian Tasks plugin syntax), exact Dataview query patterns.

Create docs/assumptions/projects-and-tasks.md with the same format (Assumptions + Open Questions, each tagged and cross-referenced to the affected requirement).

Write the final requirements to docs/requirements/projects-and-tasks.md — replace the ## Features section with a ## Requirements section. Keep the rest of the file intact.

At the bottom, add a ## Review Notes section with counts and a pointer to the assumptions file.

Do NOT commit. The user will review and refine before committing.
```

---

## Prompt 4: People Management (M1-T14)

```
You're writing detailed requirements for Myna's people management domain. The features have already been reviewed and finalized by the user. Your job is to turn them into implementation-ready requirements.

IMPORTANT RULES:
- If something is ambiguous or unclear, DO NOT silently assume. Log it to docs/assumptions/people-management.md AND mark it inline in the requirements with "⚠ ASSUMPTION:" so the user can review later.
- If you need clarification that would change the requirement significantly, log it as an [OPEN QUESTION] in docs/assumptions/people-management.md. Write the requirement using your best judgment but mark the assumption inline.
- Every judgment call you make must be visible. The user will review all assumptions and open questions later and refine the requirements based on their answers.

Read these files first (in this order):
1. docs/instructions/requirements.md — the format you MUST follow for every requirement
2. docs/vision.md — the north star
3. docs/decisions.md — all settled decisions (D001-D024), don't re-debate
4. docs/features/non-functional.md — system-wide rules (provenance markers, review queue criteria, never-overwrite, D018 facts-not-judgments, extraction rules, human-sounding output). Every requirement must be consistent with these.
5. docs/features/cross-domain.md — cross-domain interaction map showing how data flows between domains
6. docs/requirements/people-management.md — the features you're turning into requirements (under ## Features)

Now write detailed requirements for EVERY feature listed in the ## Features section. Follow the exact format from docs/instructions/requirements.md — every feature needs: what it does, how the user triggers it, step-by-step behavior, output format, data flow (reads from / writes to / triggers), edge cases, acceptance criteria, and dependencies.

Be extremely detailed and specific. The requirements must be detailed enough for Claude to autonomously design and build the system without asking clarifying questions. Specify exact file paths, exact markdown formats, exact provenance marker usage, exact review queue routing. CRITICAL: D018 (facts not judgments) applies heavily here — no feature should infer about people's internal states. Every output about a person must be factual and sourced.

Create docs/assumptions/people-management.md with the same format (Assumptions + Open Questions, each tagged and cross-referenced to the affected requirement).

Write the final requirements to docs/requirements/people-management.md — replace the ## Features section with a ## Requirements section. Keep the rest of the file intact.

At the bottom, add a ## Review Notes section with counts and a pointer to the assumptions file.

Do NOT commit. The user will review and refine before committing.
```

---

## Prompt 5: Daily Workflow (M1-T15)

```
You're writing detailed requirements for Myna's daily workflow domain. The features have already been reviewed and finalized by the user. Your job is to turn them into implementation-ready requirements.

IMPORTANT RULES:
- If something is ambiguous or unclear, DO NOT silently assume. Log it to docs/assumptions/daily-workflow.md AND mark it inline in the requirements with "⚠ ASSUMPTION:" so the user can review later.
- If you need clarification that would change the requirement significantly, log it as an [OPEN QUESTION] in docs/assumptions/daily-workflow.md. Write the requirement using your best judgment but mark the assumption inline.
- Every judgment call you make must be visible. The user will review all assumptions and open questions later and refine the requirements based on their answers.

Read these files first (in this order):
1. docs/instructions/requirements.md — the format you MUST follow for every requirement
2. docs/vision.md — the north star
3. docs/decisions.md — all settled decisions (D001-D024), don't re-debate
4. docs/features/non-functional.md — system-wide rules (provenance markers, review queue criteria, never-overwrite, extraction rules, human-sounding output). Every requirement must be consistent with these.
5. docs/features/cross-domain.md — cross-domain interaction map showing how data flows between domains
6. docs/requirements/daily-workflow.md — the features you're turning into requirements (under ## Features)

Now write detailed requirements for EVERY feature listed in the ## Features section. Follow the exact format from docs/instructions/requirements.md — every feature needs: what it does, how the user triggers it, step-by-step behavior, output format, data flow (reads from / writes to / triggers), edge cases, acceptance criteria, and dependencies.

Be extremely detailed and specific. The requirements must be detailed enough for Claude to autonomously design and build the system without asking clarifying questions. Specify exact file paths, exact markdown formats, exact provenance marker usage, exact review queue routing. CRITICAL: The never-overwrite principle applies heavily here — morning sync prepends new snapshots, never modifies existing content. "Existing content as read input" pattern: agent reads what's there and appends only the delta.

Create docs/assumptions/daily-workflow.md with the same format (Assumptions + Open Questions, each tagged and cross-referenced to the affected requirement).

Write the final requirements to docs/requirements/daily-workflow.md — replace the ## Features section with a ## Requirements section. Keep the rest of the file intact.

At the bottom, add a ## Review Notes section with counts and a pointer to the assumptions file.

Do NOT commit. The user will review and refine before committing.
```

---

## Prompt 6: Writing & Drafts (M1-T16)

```
You're writing detailed requirements for Myna's writing and drafts domain. The features have already been reviewed and finalized by the user. Your job is to turn them into implementation-ready requirements.

IMPORTANT RULES:
- If something is ambiguous or unclear, DO NOT silently assume. Log it to docs/assumptions/writing-and-drafts.md AND mark it inline in the requirements with "⚠ ASSUMPTION:" so the user can review later.
- If you need clarification that would change the requirement significantly, log it as an [OPEN QUESTION] in docs/assumptions/writing-and-drafts.md. Write the requirement using your best judgment but mark the assumption inline.
- Every judgment call you make must be visible. The user will review all assumptions and open questions later and refine the requirements based on their answers.

Read these files first (in this order):
1. docs/instructions/requirements.md — the format you MUST follow for every requirement
2. docs/vision.md — the north star
3. docs/decisions.md — all settled decisions (D001-D024), don't re-debate
4. docs/features/non-functional.md — system-wide rules (provenance markers, review queue criteria, never-overwrite, BLUF rules, human-sounding output, communication style presets). Every requirement must be consistent with these.
5. docs/features/cross-domain.md — cross-domain interaction map showing how data flows between domains
6. docs/requirements/writing-and-drafts.md — the features you're turning into requirements (under ## Features)

Now write detailed requirements for EVERY feature listed in the ## Features section. Follow the exact format from docs/instructions/requirements.md — every feature needs: what it does, how the user triggers it, step-by-step behavior, output format, data flow (reads from / writes to / triggers), edge cases, acceptance criteria, and dependencies.

Be extremely detailed and specific. The requirements must be detailed enough for Claude to autonomously design and build the system without asking clarifying questions. Specify exact file paths, exact markdown formats, exact draft lifecycle states, exact communication style config usage. CRITICAL: BLUF applies by default for professional email/status but NOT forced on casual Slack or recognition messages. Three rewrite modes (fix/tone/rewrite) have distinct behaviors — fix preserves user's voice, rewrite treats input as rough mental model.

Create docs/assumptions/writing-and-drafts.md with the same format (Assumptions + Open Questions, each tagged and cross-referenced to the affected requirement).

Write the final requirements to docs/requirements/writing-and-drafts.md — replace the ## Features section with a ## Requirements section. Keep the rest of the file intact.

At the bottom, add a ## Review Notes section with counts and a pointer to the assumptions file.

Do NOT commit. The user will review and refine before committing.
```

---

## Prompt 7: Self Tracking (M1-T17)

```
You're writing detailed requirements for Myna's self-tracking domain. The features have already been reviewed and finalized by the user. Your job is to turn them into implementation-ready requirements.

IMPORTANT RULES:
- If something is ambiguous or unclear, DO NOT silently assume. Log it to docs/assumptions/self-tracking.md AND mark it inline in the requirements with "⚠ ASSUMPTION:" so the user can review later.
- If you need clarification that would change the requirement significantly, log it as an [OPEN QUESTION] in docs/assumptions/self-tracking.md. Write the requirement using your best judgment but mark the assumption inline.
- Every judgment call you make must be visible. The user will review all assumptions and open questions later and refine the requirements based on their answers.

Read these files first (in this order):
1. docs/instructions/requirements.md — the format you MUST follow for every requirement
2. docs/vision.md — the north star
3. docs/decisions.md — all settled decisions (D001-D024), don't re-debate
4. docs/features/non-functional.md — system-wide rules (provenance markers, review queue criteria, never-overwrite, extraction rules). Every requirement must be consistent with these.
5. docs/features/cross-domain.md — cross-domain interaction map showing how data flows between domains
6. docs/requirements/self-tracking.md — the features you're turning into requirements (under ## Features)

Now write detailed requirements for EVERY feature listed in the ## Features section. Follow the exact format from docs/instructions/requirements.md — every feature needs: what it does, how the user triggers it, step-by-step behavior, output format, data flow (reads from / writes to / triggers), edge cases, acceptance criteria, and dependencies.

Be extremely detailed and specific. The requirements must be detailed enough for Claude to autonomously design and build the system without asking clarifying questions. Specify exact file paths, exact markdown formats, exact provenance marker usage. CRITICAL: Manager-type contributions should go to ReviewQueue/review-self.md when uncertain (not silently dropped — a missed contribution impacts career growth). Self-narrative generation should highlight [Inferred] entries so the user knows what to double-check.

Create docs/assumptions/self-tracking.md with the same format (Assumptions + Open Questions, each tagged and cross-referenced to the affected requirement).

Write the final requirements to docs/requirements/self-tracking.md — replace the ## Features section with a ## Requirements section. Keep the rest of the file intact.

At the bottom, add a ## Review Notes section with counts and a pointer to the assumptions file.

Do NOT commit. The user will review and refine before committing.
```

---

## Prompt 8: Setup & Config (M1-T18)

```
You're writing detailed requirements for Myna's setup and config domain. The features have already been reviewed and finalized by the user. Your job is to turn them into implementation-ready requirements.

IMPORTANT RULES:
- If something is ambiguous or unclear, DO NOT silently assume. Log it to docs/assumptions/setup-and-config.md AND mark it inline in the requirements with "⚠ ASSUMPTION:" so the user can review later.
- If you need clarification that would change the requirement significantly, log it as an [OPEN QUESTION] in docs/assumptions/setup-and-config.md. Write the requirement using your best judgment but mark the assumption inline.
- Every judgment call you make must be visible. The user will review all assumptions and open questions later and refine the requirements based on their answers.

Read these files first (in this order):
1. docs/instructions/requirements.md — the format you MUST follow for every requirement
2. docs/vision.md — the north star
3. docs/decisions.md — all settled decisions (D001-D024), don't re-debate (especially D007, D008, D009, D020)
4. docs/features/non-functional.md — system-wide rules (feature toggles, config reload at session start, graceful degradation). Every requirement must be consistent with these.
5. docs/features/cross-domain.md — cross-domain interaction map showing how config changes trigger file creation
6. docs/requirements/setup-and-config.md — the features you're turning into requirements (under ## Features)

Now write detailed requirements for EVERY feature listed in the ## Features section. Follow the exact format from docs/instructions/requirements.md — every feature needs: what it does, how the user triggers it, step-by-step behavior, output format, data flow (reads from / writes to / triggers), edge cases, acceptance criteria, and dependencies.

Be extremely detailed and specific. The requirements must be detailed enough for Claude to autonomously design and build the system without asking clarifying questions. Specify exact config file fields, exact setup wizard flow, exact template structure. CRITICAL: Six config files (workspace, projects, people, meetings, communication-style, tags). Progressive setup (every step skippable, tracked in _system/setup-pending.md). Communication style interview is OPTIONAL with role-based defaults and seven built-in presets (Professional, Conversational, Executive, Casual, Coaching, Diplomatic, Concise).

Create docs/assumptions/setup-and-config.md with the same format (Assumptions + Open Questions, each tagged and cross-referenced to the affected requirement).

Write the final requirements to docs/requirements/setup-and-config.md — replace the ## Features section with a ## Requirements section. Keep the rest of the file intact.

At the bottom, add a ## Review Notes section with counts and a pointer to the assumptions file.

Do NOT commit. The user will review and refine before committing.
```

---

## Prompt 9: Non-Functional (M1-T20)

```
You're writing detailed requirements for Myna's non-functional (system-wide) behaviors. The features have already been reviewed and finalized by the user. Your job is to turn them into implementation-ready requirements.

IMPORTANT RULES:
- If something is ambiguous or unclear, DO NOT silently assume. Log it to docs/assumptions/non-functional.md AND mark it inline in the requirements with "⚠ ASSUMPTION:" so the user can review later.
- If you need clarification that would change the requirement significantly, log it as an [OPEN QUESTION] in docs/assumptions/non-functional.md. Write the requirement using your best judgment but mark the assumption inline.
- Every judgment call you make must be visible. The user will review all assumptions and open questions later and refine the requirements based on their answers.

Read these files first (in this order):
1. docs/instructions/requirements.md — the format you MUST follow for every requirement
2. docs/vision.md — the north star (especially all 9 Core Beliefs)
3. docs/decisions.md — all settled decisions (D001-D024), don't re-debate
4. docs/requirements/non-functional.md — the system-wide behaviors you're turning into requirements (under ## Features)

Now write detailed requirements for EVERY behavior listed in the ## Features section. These are system-wide rules, not user-triggered features — but they still need the same level of detail: what the rule is, when it applies, step-by-step behavior, acceptance criteria, and edge cases.

Be extremely detailed and specific. These non-functional requirements are the foundation that every domain requirement depends on. The most critical sections are: provenance marker decision framework (with the full criteria table for when to use each marker and the exhaustive review queue must/must-not rules), never-overwrite principle (with the "existing content as read input" pattern), prompt injection defense (two-layer for P0), human-sounding output rules (with the full anti-pattern list), and feature toggles (D020). Specify exact formats, exact marker placement, exact separator formats for agent additions.

Create docs/assumptions/non-functional.md with the same format (Assumptions + Open Questions, each tagged and cross-referenced to the affected requirement).

Write the final requirements to docs/requirements/non-functional.md — replace the ## Features section with a ## Requirements section. Keep the rest of the file intact.

At the bottom, add a ## Review Notes section with counts and a pointer to the assumptions file.

Do NOT commit. The user will review and refine before committing.
```

---

## Prompt 10: Cross-Domain (M1-T19)

```
You're writing detailed requirements for Myna's cross-domain features and interaction map. The features have already been reviewed and finalized by the user. Your job is to turn them into implementation-ready requirements.

IMPORTANT RULES:
- If something is ambiguous or unclear, DO NOT silently assume. Log it to docs/assumptions/cross-domain.md AND mark it inline in the requirements with "⚠ ASSUMPTION:" so the user can review later.
- If you need clarification that would change the requirement significantly, log it as an [OPEN QUESTION] in docs/assumptions/cross-domain.md. Write the requirement using your best judgment but mark the assumption inline.
- Every judgment call you make must be visible. The user will review all assumptions and open questions later and refine the requirements based on their answers.

Read these files first (in this order):
1. docs/instructions/requirements.md — the format you MUST follow for every requirement
2. docs/vision.md — the north star
3. docs/decisions.md — all settled decisions (D001-D024), don't re-debate
4. docs/features/non-functional.md — system-wide rules that apply to every cross-domain feature
5. docs/features/cross-domain.md — the features AND the cross-domain interaction map (read BOTH the Features section and the interaction map below it)
6. docs/requirements/cross-domain.md — the features you're turning into requirements (under ## Features)

Also read ALL domain requirement files to understand what each domain does — this is critical for defining cross-domain interactions:
- docs/requirements/email-and-messaging.md
- docs/requirements/meetings-and-calendar.md
- docs/requirements/projects-and-tasks.md
- docs/requirements/people-management.md
- docs/requirements/daily-workflow.md
- docs/requirements/writing-and-drafts.md
- docs/requirements/self-tracking.md
- docs/requirements/setup-and-config.md

Now write detailed requirements for EVERY feature listed in the ## Features section. Follow the exact format from docs/instructions/requirements.md. Additionally, write a detailed Cross-Domain Interaction Requirements section that formalizes every data flow from the interaction map in docs/features/cross-domain.md — specify what triggers each flow, what data moves, what format, and where it lands.

Be extremely detailed and specific. The requirements must be detailed enough for Claude to autonomously design and build the system without asking clarifying questions. Specify exact file paths, exact resolution cascades for fuzzy name matching (with alias support), exact park file contents for zero-context-loss resume, exact audit log formats.

Create docs/assumptions/cross-domain.md with the same format (Assumptions + Open Questions, each tagged and cross-referenced to the affected requirement).

Write the final requirements to docs/requirements/cross-domain.md — replace the ## Features section with a ## Requirements section. Keep the rest of the file intact.

At the bottom, add a ## Review Notes section with counts and a pointer to the assumptions file.

Do NOT commit. The user will review and refine before committing.
```

---

## Launch Instructions

1. Create the assumptions directory first: `mkdir -p docs/assumptions`
2. Open 10 tabs in Claude Code Web
3. Each tab: paste one prompt, hit enter
4. All 10 run in parallel — no dependencies between them (each reads from finalized feature files)
5. When you return:
   - First: scan all 10 files in `docs/assumptions/` for the open questions and assumptions
   - Then: review each `docs/requirements/*.md` file, using the ## Review Notes at the bottom to see how many assumptions were made
   - Address open questions, refine requirements, then commit

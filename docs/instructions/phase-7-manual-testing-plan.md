# Phase 7 — Manual Testing Plan

Operational guide for Phase 7. Read at the start of any P7 task. See `docs/roadmap.md` Phase 7 section and decision D033.

---

## What Phase 7 is

Phase 7 produces a **manual testing plan** — a document describing how Myna should be tested after launch. The user executes the plan themselves post-ship (finding bugs, fixing them); Phase 7 is about designing the plan, not executing it.

This phase exists because automated testing was deliberately deferred (D033) until real-world usage teaches us what actually matters to test. A manual testing plan captures the intent without committing to test infrastructure.

**In scope:**
- Design manual test scenarios covering all built agents
- Define expected behaviors per scenario
- Structure the plan so the user can run tests systematically post-ship
- Document how to report and track bugs found during manual testing
- User-collaborated — heavy involvement, since the user is the one who will execute the plan

**Out of scope:**
- Running the tests (that's post-ship, user-driven)
- Automated behavioral testing (deferred entirely, may be designed post-v1 based on manual testing experience)
- Bug fixes from testing (post-ship)
- Performance testing (not in v1 scope)

## Why Phase 7 matters

Without a testing plan, the user would sit down post-launch and test ad-hoc — missing scenarios, duplicating others, inconsistently checking the same features across sessions. The plan makes post-launch testing systematic and useful as input to future test automation.

The plan is also an artifact for future feature additions: when a new feature is added post-v1, the testing plan tells the contributor what scenarios to re-run and what to add.

## Context files to read

1. `docs/design/foundations.md`
2. `docs/architecture.md`
3. `docs/features/*` — all feature lists (what needs to work)
4. The full set of built agents from Phase 5
5. The install script from Phase 6 (the test starts with "fresh install works")
6. `docs/decisions.md` — especially D033 (testing deferral), D024 (never infer about people's internal states — testable!)

## Phase-specific rules

1. **Scenarios, not unit tests.** The plan describes user-facing workflows to try: "process an email that has an action item and a recognition signal," not "call function X with input Y."
2. **Document expected behavior.** For each scenario, write down what the user should see. Vague expectations lead to missed bugs.
3. **User is the primary author.** Claude drafts based on architecture and requirements; user refines based on how they actually plan to use Myna.
4. **Cover every agent.** Every agent in the architecture gets scenarios. Untested agents are unreleased agents.
5. **Cover cross-agent flows.** Morning sync, multi-destination routing, routing between agents — these only work if tested end-to-end.
6. **Include negative cases.** Not just "happy path" but "what happens when foundations is misconfigured? when config is partial? when an MCP is missing?"

## Tasks

### P7-T01 — Inventory the scenarios to cover

Walk through the architecture and requirements. For each agent, list the user-facing workflows that need testing. For cross-agent flows, list the integration scenarios.

Output: a list of scenario titles and brief descriptions.

### P7-T02 — Draft expected behaviors

For each scenario, write down what the user should see when it runs correctly. Include vault state changes, agent output format, any user-visible artifacts.

### P7-T03 — Design the reporting format

How the user tracks test results and bug reports. Simple is fine — a markdown checklist, a spreadsheet, whatever fits the user's workflow.

### P7-T04 — User review and refinement

Heavy user involvement. The user is the one who will execute this plan, so it must match their intended testing style.

### P7-T05 — Write the final testing plan document

Output: `docs/testing-plan.md` (or similar location). Self-contained — anyone reading it should be able to execute the tests.

## End-of-session discipline

- Testing plan is a document, not a test runner
- Every scenario has an expected behavior
- User has reviewed and approved
- Roadmap updated

# Phase 3 — Reference Agent

Operational guide for Phase 3. Read at the start of any P3 task. See `docs/roadmap.md` Phase 3 section and decisions D025, D027, D029.

---

## What Phase 3 is

Phase 3 builds one agent fully end-to-end using the Phase 2 SDLC. This is the reference implementation that validates the harness and produces the patterns Phase 5 will imitate.

The reference agent is **chosen in Phase 0** (P0-T04). This phase does not re-decide which agent to build; it just builds it.

**In scope:**
- Use the Phase 2 Writer → Reviewer → Refiner loop to build the reference agent's full content
- Iterate on the Phase 2 SDLC itself as we discover what's awkward, missing, or over-specified
- Capture learnings continuously in the form build-agent.md will eventually take (per D029)
- Test the agent end-to-end against Myna's own development work as test data (per D027)
- Surface foundations gaps and feed them back to Phase 0 artifacts

**Out of scope:**
- Building other agents (Phase 5)
- Finalizing the recipe — that happens in Phase 4 after learnings from this phase
- Automated behavioral tests (deferred per D033)

## Why Phase 3 matters

Phase 3 is where the methodology meets reality. Three outcomes must be achieved:

1. **Working reference agent** — an agent that actually behaves correctly when invoked with real inputs
2. **Refined SDLC** — the Phase 2 harness iterated and improved based on what actually worked
3. **Captured learnings** — notes that will become the final `build-agent.md` recipe in Phase 4

If any of these three is weak, Phase 5 autonomous build will be compromised.

The test Phase 3 output must pass: **"does the reference agent work when invoked with realistic inputs, and do we understand WHY it works well enough to codify the recipe?"**

## Context files to read before any P3 task

1. `docs/design/foundations.md`
2. `docs/architecture.md` — specifically the reference agent's scope and feature assignments
3. `docs/instructions/agent-build-sdlc-rules.md` (the Phase 2 initial rules)
4. `docs/features/{reference-agent-domain}.md` — the feature list for the agent being built
5. `docs/roadmap.md` — Phase 3 tasks
6. `docs/decisions.md` — especially D027, D029
7. Any existing Phase 2 smoke test results
8. `docs/journal/dev-journal.md` — prior phase entries

## Phase-specific rules

1. **Use Myna's own dev work as test data (D027).** Real projects, real people, real tasks, real notes from this very project. Not synthetic data.
2. **Iterate the SDLC, not just the agent.** When something about the Writer/Reviewer/Refiner is awkward, fix the SDLC and restart that round. The SDLC gets better with use.
3. **Capture learnings in real time (D029).** Every correction, every discovered pattern, every anti-pattern goes into a running notes file that will become `build-agent.md` in Phase 4. Don't save up learnings for "the end."
4. **Escalate foundations gaps, don't paper over.** If Phase 3 reveals foundations has a gap, update foundations and note the discovery.
5. **Test for real.** The agent must run end-to-end against real data. "Looks plausible" is not done. "Ran the prompt, saw the right behavior on real inputs" is done.

## Tasks

### P3-T01 — First pass: run the SDLC on the reference agent

Use the Phase 2 harness to generate a first draft of the reference agent. Run Writer → Reviewer → Refiner for the initial 3–4 iterations.

### P3-T02 — Iterate on the SDLC

As awkwardness or gaps surface, update `agent-build-sdlc-rules.md` and the skills themselves. Re-run the affected iterations. Capture each change and why.

### P3-T03 — Test against Myna's own dev work

Run the reference agent on realistic inputs — projects, people, tasks, decisions from this actual project. Verify outputs match expectations. Fix what breaks.

### P3-T04 — Capture learnings

Continuously (not at the end) maintain a `docs/instructions/phase-3-learnings.md` file (or similar) that collects:
- Patterns that worked
- Anti-patterns that almost happened but got caught
- SDLC improvements
- Foundations gaps discovered
- Anything Phase 4 will need to finalize the recipe

### P3-T05 — User review of reference agent

Heavy review. User verifies the agent works end-to-end and the learnings captured are complete.

## End-of-session discipline

- Every correction this session captured in the learnings file (not just in conversation)
- SDLC rules updated if they needed refinement
- Reference agent state documented (in progress / passing / failing)
- Foundations updated if any gap was found
- Roadmap updated

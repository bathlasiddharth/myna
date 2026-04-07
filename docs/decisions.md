# Decisions Log

Settled decisions that all threads should respect. Newest first.

---

## Format

Each entry:
```
### [DXXX] Short title
**Date:** YYYY-MM-DD
**Context:** Why this came up
**Decision:** What was decided
**Alternatives rejected:** What else was considered and why not
```

---

### D042 — Config files are YAML, not markdown
**Date:** 2026-04-05
**Context:** The original design had config files as markdown (workspace.md, registry.md, etc.). During Phase 0, the user specified that config files should be YAML for cleaner machine parsing. Six files: workspace.yaml, projects.yaml, people.yaml, meetings.yaml, communication-style.yaml, tags.yaml.
**Decision:** All Myna config files use YAML format, stored under `_system/config/`. The previous naming (workspace.md, registry.md, tags.md) is superseded. The six config files are: workspace.yaml (user identity, preferences, feature toggles), projects.yaml (projects, aliases, source mappings, triage folders), people.yaml (people, relationship tiers, aliases), meetings.yaml (optional meeting type overrides), communication-style.yaml (writing style presets per audience tier), tags.yaml (auto-tagging rules). All are gitignored.
**Alternatives rejected:** Keep markdown config (harder to parse reliably, mixes content and structure). JSON config (less human-readable than YAML, harder to hand-edit).

### D043 — Configure skill deferred to post-launch; v1 config is manual YAML editing
**Date:** 2026-04-06
**Context:** The configure skill (interactive setup wizard, natural language config management, communication style interview, feature toggle management) adds complexity for v1. Users can edit YAML config files directly — they're simple, well-documented, and have .example files as reference. The interactive experience is polish, not core value.
**Decision:** The configure skill is deferred to post-launch. For v1: the install script (Phase 6) creates the vault folder structure and drops .example config files. Users copy and edit them directly. Project/person file creation from template is a main-agent direct operation ("create project file for auth migration"). Feature toggles are edited in workspace.yaml. Communication style interview is deferred. Vault initialization is handled by the install script, not a skill.
**Alternatives rejected:** Ship configure in v1 (adds a skill that duplicates what YAML editing already provides; delays launch for polish). Remove config files entirely and hardcode defaults (loses the config-driven flexibility that makes Myna adaptable).

### D041 — Skill-based architecture with 14 consolidated skills
**Date:** 2026-04-05 (updated 2026-04-06)
**Context:** Phase 0 needed to map 60+ approved features into a runtime architecture. The key question: how to organize features into the units the LLM processes at runtime. Per D030 (agent-first, not feature-first), features compose into coherent units, not standalone specs. The design principle: one skill per workflow — features a user would naturally do together in one sitting belong in one skill.
**Decision:** Myna uses 14 skills grouped by user workflow: sync, process, triage, prep-meeting, process-meeting, brief, capture, draft, calendar, wrap-up, review, self-track, park, draft-replies. Each skill covers one coherent workflow. Skills are loaded on demand (progressive disclosure) — only name and description in context until activated. Simple operations (vault search, link find, task completion, draft state updates, project/person file creation from template) are handled directly by the main agent without activating a skill. The main agent handles Universal Done routing by resolving the entity type and dispatching to the appropriate skill. The configure skill (setup wizard, config management) is deferred to post-launch (D043). People-insights skill (1:1 analysis, performance narratives, team health tracking) is deferred to post-launch. DraftReplies is a separate skill from process because it creates drafts rather than extracting vault data.
**Alternatives rejected:** Per-feature skills (too many — 60+ skills would overwhelm routing). Per-domain skills (7 skills — too few, each would be too broad and the prompt too long). No skills, everything in the main agent prompt (exceeds context budget, instruction bleed). DraftReplies as part of process skill (mixes extraction and writing; different workflow).

### D040 — Reference skill is capture (supersedes D026 domain selection)
**Date:** 2026-04-05
**Context:** D026 selected projects-and-tasks as the reference domain. With the skill-based architecture (D041), the build unit is a skill, not a domain. The reference skill for Phase 3 must exercise the most representative patterns while being testable locally.
**Decision:** The reference skill is `capture`. It covers projects-and-tasks features directly (task management, project timeline writes, project status changes), exercises all core patterns (multi-destination routing, provenance markers across all four types, review queue routing, fuzzy name resolution, append-only writes, cross-domain writes to People/Projects/Journal/), and is fully testable locally with Myna's own development work as test data (D027). Quick Capture's ability to process pasted external content exercises the external-content-as-data pattern that D026 identified as needing explicit coverage. Patterns established by capture (routing, provenance, append-only) transfer directly to process, process-meeting, and wrap-up.
**Alternatives rejected:** process-meeting (exercises the extraction pipeline heavily but is a narrower workflow — single meeting to vault — with less pattern diversity). process (requires email/Slack MCP access for testing). brief (read-only — doesn't exercise the write patterns that most skills share).

### D039 — No subagents, no automatic skill chaining in v1
**Date:** 2026-04-05
**Context:** Kiro CLI supports subagents (isolated context windows) and skill chaining. The question was whether Myna v1 should use these capabilities.
**Decision:** v1 uses neither subagents nor automatic skill chaining. All processing runs through skills in the main agent. Each skill outputs its result. If a follow-up action is needed, the skill tells the user what to invoke next — the user triggers it explicitly. This keeps the architecture simple, avoids latency from subagent spawning, and avoids the hooks-don't-fire-in-subagents limitation. Subagents and chaining are post-v1 performance optimizations.
**Alternatives rejected:** Subagents for batch processing (latency cost, hook bypass risk). Automatic skill chaining (adds complexity, harder to debug, user loses control of sequencing). Hybrid with selective subagent use (half-measures add complexity without clear benefit for v1).

### D038 — Tool-agnostic content layer separated from install-time packaging
**Date:** 2026-04-05
**Context:** Myna is being built for Kiro CLI first (D035), but the user wants extensibility to other AI platforms (Claude Code, Gemini, Codex, etc.) later without requiring agent content to be rewritten. Without an explicit separation between content and packaging, every new target tool would mean rewriting agent instructions, steering files, skill specs, and other artifacts in that tool's native format. This is the kind of architectural decision that is cheap to get right at Phase 0 and expensive to retrofit.
**Decision:** Myna's build artifacts are organized into two distinct layers:

**Content layer (tool-agnostic):** Agent behaviors, steering rules, skill specifications, foundations, vault templates, and any other instruction-like content live in plain markdown (and YAML for config schemas) in a neutral location in the repo. These files contain no Kiro CLI-specific syntax, no assumptions about file locations Kiro CLI expects, and no tool-specific conventions. They are the authoritative source of what Myna does. Phase 5 autonomous agent build writes content files to this layer.

**Adapter layer (tool-specific):** The installation step (Phase 6) implements a Kiro CLI adapter that reads the content layer and packages it into whatever file formats, locations, and invocation conventions Kiro CLI expects at runtime. For v1, this adapter targets Kiro CLI only (per D035). Adding a future AI tool (Claude Code, Gemini, etc.) means writing a new adapter in the install step — NOT touching the content layer.

**Phase 0 responsibility:** design the content layer's directory structure and file conventions such that they are neutral. Phase 0 does NOT design adapters for other tools — only the Kiro CLI adapter is in scope for v1. Phase 0 MUST pass this extensibility test: "If a future contributor wants to add Claude Code support, do they need to rewrite agent content, or just write a new Kiro-Code adapter?" If the answer is "rewrite content," the content layer has leaked tool-specific details and must be revised.

**Test discipline:** when writing any agent/steering/skill content in Phase 5, ask "would this file need changes to work on a different AI tool?" If yes, the tool-specific part belongs in the adapter, not in the content file. Move it.

This builds on and operationalizes D002 (AI model agnostic) and D007 (model-agnostic via common instructions + setup-time adaptation). D002 stated the principle; D007 said adaptation happens at setup; D038 specifies the concrete mechanism — a two-layer structure with the install step as the adapter.
**Alternatives rejected:** Embed content directly in Kiro CLI-format files (locks in Kiro CLI's structure; future tools would require content rewrites — the exact problem this decision prevents). Design adapters for all supported AI tools in Phase 0 now (scope creep; we don't know enough about other tools' capabilities yet; v1 needs to ship). No separation at all and treat "write for each tool" as a future problem (fine for v1 in isolation but creates technical debt that blocks extensibility, which is exactly what this decision is meant to prevent).

### D037 — Done = Phase 8 (Ship) complete; post-ship activities are outside the pipeline
**Date:** 2026-04-05
**Context:** The pipeline was ambiguous about what "done" means. Earlier it sounded like user acceptance testing (real-world usage + bug fixing) was part of the build pipeline. The user clarified: "I want to say this is done and I will then test it and find bugs and fix it." Real-world testing, bug finding, and bug fixing are the user's post-ship responsibility, not part of the build.
**Decision:** The build pipeline ends at Phase 8 (Ship). When Phase 8 completes — README, setup guide, v1.0 tag in place — Myna is declared done. Post-ship activities are explicitly outside the pipeline: (a) user acceptance testing against the Phase 7 manual testing plan, (b) bug finding and fixing from real-world usage, (c) open-source contribution model design (D036), (d) install support for AI tools beyond Kiro CLI (D035 scope), (e) any automated testing infrastructure (D033). These are tracked in the roadmap Backlog as post-launch items but are not pipeline phases.
**Alternatives rejected:** Include user acceptance testing as a pipeline phase (conflates build with use; makes "done" depend on indefinite real-world use). Include bug-fixing as a pipeline phase (same problem; the bug-fix loop is open-ended). Defer the done declaration until after stabilization (never-ending pipeline).

### D036 — Open-source contribution model deferred to post-launch
**Date:** 2026-04-05
**Context:** Initially the open-source contribution model (CONTRIBUTING.md, contributor workflow, feature-addition documentation for external contributors) was a Phase 0 foundations deliverable. It was then moved to Phase 8 (Ship) as part of release prep. Finally the user decided it shouldn't be in the pipeline at all: "A lot can change while we build this and test it so let's think about it only when I open it for open-source contributions."
**Decision:** Open-source contribution model is post-launch work. Not in Phase 0 (foundations), not in Phase 8 (Ship). The repo ships at v1.0 without a formal contributor model. After launch, once the user has tested and stabilized Myna, the contribution model can be designed from real experience with what works and what doesn't — including how to add a new agent, how to extend foundations, how to handle escalations without the original user. This is tracked in the Backlog as B012.
**Alternatives rejected:** Design the contribution model upfront in Phase 0 (premature — we don't know what works yet). Add minimal contribution docs in Phase 8 (partial commits to a contributor story without validation). Open-source from day one (user isn't ready for external contributors until post-ship stabilization).

### D035 — Installation script as dedicated user-involved phase (Phase 6), Kiro CLI-only for v1
**Date:** 2026-04-05
**Context:** The installation script was initially not explicitly placed in the pipeline. It was then folded into Phase 5 (autonomous agent build) as a "final deliverable." The user corrected: (1) the autonomous agent-building instructions (build-agent.md recipe) don't apply to installation script work — the recipe is for writing agent prompts, not installer code. (2) The user wants to be directly involved in ensuring install is easy, so it shouldn't be autonomous. (3) v1 scope should target Kiro CLI only since that's the user's primary tool; other AI tools (Claude Code, Gemini, Codex) are post-launch.
**Decision:** Installation script creation is its own phase (Phase 6), positioned between autonomous agent build (Phase 5) and manual testing plan (Phase 7). It is **user-involved, not autonomous** — the user reviews design decisions, tests on a clean environment, and gives final approval. For v1, the installer targets **Kiro CLI only**. Claude Code, Gemini, Codex, and other AI tools are post-launch work (tracked in Backlog as B011). Phase 6 produces a runnable installer that wires Myna's agents, steering, foundations, vault templates, config, and MCP wrapper into a Kiro CLI user's environment.
**Alternatives rejected:** Fold installer into Phase 5 autonomous build (autonomous recipe doesn't apply to code; user wants direct involvement). Target all AI tools in v1 (scope creep; each tool has different install mechanics). Skip installer entirely and require manual setup (defeats D009 interactive setup and D007 model-agnostic adaptation).

### D034 — All features in v1, no P0 subset
**Date:** 2026-04-05
**Context:** Considered prioritizing v1 to a minimum-viable subset of features (fewer agents or fewer features per agent) with the rest deferred to v1.1. This would ship faster and get feedback sooner.
**Decision:** All approved features across all domains are in v1 scope. No minimum-viable subset. The user explicitly wants the complete feature set for personal use, not a partial first release. All 50+ features in `docs/features/*.md` under `## Features` sections will be built and shipped in v1.
**Alternatives rejected:** Minimum-viable v1 with v1.1 follow-up (the user prefers complete v1 for their own use over faster partial release). Per-phase prioritization within Phase 5 (same objection).

### D033 — Automated testing deferred to post-v1; Phase 7 is manual testing plan only
**Date:** 2026-04-05
**Context:** Earlier proposals included test data generation, acceptance prompts, mechanical consistency checks, behavioral testing, eval infrastructure — all as a dedicated Phase 2.5 "Test Infrastructure." The user pushed back: "For Java or other apps, it makes sense to write unit tests because it is easy to test part of code, but that is not true for agents or steering files. Let's not finalize automated test plan right now. After I use it few times, we can figure out how to test each artifact in isolation."
**Decision:** All automated testing infrastructure is deferred to post-v1. The build pipeline has no test harness, no eval suite, no acceptance prompt generator, no automated behavioral tests. What survives: (1) **structural lint** — grep/shell scripts that verify cross-references, format compliance, file existence, wiki-link resolution, foundation-reference consistency. These are NOT tests in the TDD sense; they are mechanical verification of structural validity. Run as part of Phase 5 autonomous build after each agent is committed. (2) **Manual testing plan** — Phase 7 produces a document describing scenarios and expected behaviors. The user executes the plan post-ship, not in-pipeline. No automated execution. Post-v1, once real usage has revealed what actually fails, the user may design automated testing based on experience rather than speculation (Backlog B010).

Supersedes the Phase 2.5 "Test Infrastructure" phase proposed earlier in the ultrathink — that phase is dropped.
**Alternatives rejected:** Eval-driven development in Phase 1 (writing evals well requires experience the project doesn't have yet; bad evals are worse than none). Automated test infrastructure in Phase 2.5 (premature; may test the wrong things). Phase 4 integration testing as automated scenario runs (conflicts with the deferral principle; fall into the same trap). Skipping all verification entirely (structural lint is cheap and catches a class of bugs worth catching).

### D032 — Autonomous Build Plan as dedicated Phase 4 (synthesize learnings with data, not upfront)
**Date:** 2026-04-05
**Context:** The autonomous build plan (recipe for Phase 5, escalation rules, learning-capture mechanism, acceptance gate for starting autonomous work) cannot be decided upfront in the absence of real experience building an agent. Deciding it in Phase 0 would mean committing to rules we haven't tested. But it also can't be decided during Phase 3 reference agent build, because Phase 3's focus is on building the agent and iterating the SDLC, not on synthesizing finalized rules.
**Decision:** Create a dedicated Phase 4 between Phase 3 (Reference Agent) and Phase 5 (Autonomous Agent Build). Phase 4 synthesizes the learnings from Phase 3 into the finalized artifacts Phase 5 needs: `build-agent.md` (recipe), `verify-agent.md` (structural lint checklist), `escalation-rules.md` (tripwires). Phase 4 also runs the fresh-session methodology acceptance test — spawn a fresh Claude session with only the methodology docs and have it build a small task, observe whether it succeeds without clarification. Pass = methodology ready; fail = fix the docs and retest. Phase 4 is the concrete Go/No-Go gate for autonomous work.
**Alternatives rejected:** Decide the autonomous plan upfront in Phase 0 (premature; we don't have data yet). Make it emerge implicitly during Phase 3 (learnings get scattered rather than synthesized). Skip the acceptance gate (subjective user review is a weaker signal than an observable fresh-session test).

### D031 — Dedicated Phase 2 for Agent Build SDLC (Claude Code build harness)
**Date:** 2026-04-05
**Context:** Building 10+ agents manually is infeasible, and building them via ad-hoc invocations is inconsistent. The user asked for "automated building skills/agents in Claude — like agent (or skill) to write code for an agent/steering file, agent to review it, agent to address feedback, do this in 3-4 iterations. Basically SDLC type workflow for building an agent." This is different from prior "don't build tools for the sake of it" guidance because the tool has a specific, forced purpose: it is the mechanism by which Phase 5 autonomous build operates.
**Decision:** Create Phase 2 as a dedicated phase between Skeletons (Phase 1) and Reference Agent (Phase 3). Phase 2 builds Claude Code-specific skills/subagents that implement a structured agent-build loop: **Writer** (drafts an agent's prompt content), **Reviewer** (critiques from fresh context), **Refiner** (addresses feedback), **Iterator/Orchestrator** (runs write → review → refine for 3–4 rounds). Plus initial SDLC rules governing the loop. The harness is Claude Code-specific (it's the build infrastructure). Myna's runtime output stays model-agnostic (D002) — the harness is not part of what ships. Phase 3 uses the harness to build the reference agent and iterates the harness based on what works. Phase 4 synthesizes finalized rules. Phase 5 applies the harness to build remaining agents autonomously.
**Alternatives rejected:** Build agents by hand without a harness (inconsistent; too much user effort). Build the harness inline during Phase 3 reference build (muddles the two concerns; harder to reason about). Skip the harness and have Phase 5 autonomous Claude improvise per agent (defeats consistency; no reusable methodology).

### D030 — Agent-first architecture over feature-first
**Date:** 2026-04-05
**Context:** Earlier pipeline proposals treated per-feature specs (Intent/Evals/Behavior per feature) as the primary unit. The user pushed back: for an LLM-runtime system, the coherent unit is the agent prompt, not isolated features. Agent prompts have a role, shared context, priority ordering, and a context budget that emerges from designing the agent as a whole. Writing features in isolation and stitching them together retrofits coherence; designing agents top-down produces it.
**Decision:** Myna's build is agent-first, not feature-first. Phase 0 decides how features group into agents (the architectural decomposition). Features become sections within agent prompts, sharing that agent's role, context, and conventions. Per-feature specification still happens — the Intent/Evals/Behavior concept isn't wrong — but it lives **within** an agent file as sections, not as standalone files. The unit of autonomous work in Phase 5 is one agent per session, not one feature per session. This matches how LLMs actually read instructions at runtime: as coherent prompts, not as concatenated fragments.

Implications: Phase 0 expands to include agent architecture design alongside data foundations. Phase 3 builds one reference **agent** end-to-end. Phase 5 iterates per agent. The feature list in `docs/features/*.md` provides inputs to Phase 0's feature-to-agent mapping, but features are not themselves the build unit.
**Alternatives rejected:** Feature-first with per-feature files (concatenates rather than composes; retrofits coherence; doesn't match LLM runtime reality). Hybrid with both per-feature files AND agent files (duplication and drift). Pure monolithic single-agent Myna (exceeds reasonable context budgets at feature scale).

### D029 — Phase 2 learnings captured in docs, not skills (capture-as-you-go)
**Date:** 2026-04-04
**Context:** During Phase 2, the user will correct Claude's direction and Claude will discover patterns while building the reference domain. Without explicit capture, these learnings die when the conversation ends — leaving Phase 3 Claude to re-make the same mistakes the user already corrected manually. An earlier proposal considered building Claude Code skills and subagents during Phase 2 as the learning-preservation mechanism, but skills are orchestration infrastructure, not learning storage. The user's actual goal is preserving learnings, not building tools — reaching for tools was solving the wrong problem.
**Decision:** Learnings from Phase 2 (and any future manual feature work) are captured directly in the set of docs that Phase 3 Claude reads operationally. Every correction or discovered pattern has a natural home:
- **Structural learnings** (a convention was wrong, a section was missing, a template needs a new field) → `docs/foundations.md`
- **Procedural learnings** (a step was missing, the order was wrong) → `docs/instructions/build-feature.md` (the recipe)
- **Verification learnings** (a check we should run every time) → `docs/instructions/verify-feature.md` (the checklist)
- **Behavioral patterns** (when you see X, apply Y) → `build-feature.md` patterns section
- **Anti-patterns** (default instinct Claude gets wrong that must be actively countered) → `build-feature.md` anti-patterns section
- **Escalation triggers** (conditions under which Claude must stop and ask) → `docs/instructions/escalation-rules.md`
- **Template details** → the relevant template inside `foundations.md`
- **Narrative / audit record** → `docs/dev-journal.md`
- **Domain-specific facts** → that domain's requirement file as inline notes

**Discipline: capture immediately after every correction, not at the end of Phase 2.** The failure mode to avoid is finishing Phase 2 and then trying to remember what was learned — half the lessons decay with the conversation. `build-feature.md` and `verify-feature.md` become living lesson books throughout Phase 2, updated in-flight as corrections and patterns emerge.

**Phase 3 operational context is a defined, bounded set of files** — vision, decisions, foundations, requirements template, build-feature recipe, verify-feature checklist, escalation-rules, reference domain, and prior completed domains. If a learning is not in that set, it doesn't reach Phase 3. At the end of Phase 2, an audit verifies this set is complete enough to run autonomously (new task P2-T10).

**Skills and subagents are not built preemptively.** Revisit only if Phase 3 proves that mechanical orchestration would save meaningful time AND the underlying docs are already complete. The test: "if I had no skills, would Phase 3 still work using only these docs?" — if yes, skills are optional. Docs first; skills later if ever.
**Alternatives rejected:** Build Claude Code skills/subagents during Phase 2 as the learning-preservation mechanism (solves a problem that doesn't exist — learnings would still need to live in docs anyway; premature codification risks locking in the wrong pattern before it's stabilized). Capture learnings at end of Phase 2 in a retrospective pass (conversation context decays; half the corrections get forgotten before they reach the file). Implicit/conversational capture (doesn't survive session boundaries; autonomous Phase 3 has no memory of Phase 2 corrections). No formal capture mechanism at all (Phase 3 re-makes the same mistakes the user already corrected manually, defeating the entire point of Phase 2).

### D028 — Autonomous build phase with tripwires and subagent review
**Date:** 2026-04-04
**Context:** After Phases 0–2 build foundations, template, and reference domain with user in the loop, Phases 3–4 build the remaining features autonomously. The user wants minimal involvement during autonomous phases but quality cannot be compromised. Without explicit guardrails, autonomous Claude can rationalize decisions that contradict settled rules, invent conventions that diverge from foundations, or rubber-stamp its own self-review (contextual bias aligned with interpretation errors).
**Decision:** Autonomous phases use four quality mechanisms that together target ~90% issue capture before user acceptance: (1) **Mechanical consistency checks** run after every feature — conventions match foundations, cross-domain writes have matching readers somewhere in the system, cited decisions actually apply, no invented tags/sections/paths/provenance placements. (2) **Feature tests** run against curated test data from Phase 2.5 with explicit expected behaviors. (3) **Subagent review** — a fresh Claude context loaded with only foundations + the completed feature artifact critiques each feature, catching issues the writing Claude's contextual bias misses. (4) **Explicit tripwires** (captured in `docs/instructions/escalation-rules.md`) that force Claude to stop and ask the user: foundations doesn't cover the case; two settled decisions appear to contradict each other; test output is ambiguous enough that Claude can't confidently judge correctness; 3 fix iterations failed on the same feature; a cross-domain write has no matching reader; an MCP capability the feature depends on hasn't been verified to exist; two valid design paths with no principle to pick between. Everything not on the tripwire list: Claude proceeds without asking. Per-domain batch summary reports are written for asynchronous user skim but do not act as hard gates. Remaining ~10% of issues surface in Phase 5 user acceptance, which is acceptable and unavoidable.
**Alternatives rejected:** Per-feature user review (defeats the autonomy goal), pure self-review by the writing model (misses ~20–30% of issues due to contextual bias), no tripwires (Claude either rubber-stamps everything or escalates on every edge case), hard gates between features (adds latency and user-attention cost for marginal quality gain).

### D027 — Myna's own development work is the test data for the reference domain
**Date:** 2026-04-04
**Context:** Phase 2 needs real test data to verify the reference domain works end-to-end. Realistic data is the highest-leverage quality input for autonomous-phase testing, but the user can't access work email or work data on a personal laptop, and synthetic/AI-generated data misses real-world edge cases.
**Decision:** For projects-and-tasks as the reference domain, use Myna's own development work as test data — real projects (Myna itself + any other active personal work), real people (actual collaborators and contacts), real tasks (what the user is actively doing), real decisions (this very conversation), real meetings (actual calendar entries typed in manually). This is real data by definition, requires no synthesis, and has a useful side effect: the working reference domain becomes a tool the user can immediately apply to track Myna's ongoing development. Test data for email-and-messaging (which is built autonomously in Phase 3) remains AI-generated, with real-email testing deferred to Phase 5 when work email access or realistic personal email content is available.
**Alternatives rejected:** Synthetic test data for the reference (misses edge cases), curated real emails from personal Gmail (no project-related content exists there), deferring reference-domain testing until real data is available (defeats the whole purpose of having a reference).

### D026 — Projects-and-tasks is the reference domain (not email-and-messaging)
**Date:** 2026-04-04
**Context:** The reference domain is the first domain fully built end-to-end, establishing the patterns Claude will follow during autonomous phases. Email-and-messaging was the initial choice because it exercises the richest patterns — multi-destination decomposition from external content, deduplication, prompt-injection defense, MCP ingestion loop. But the user cannot test email-and-messaging on the current setup: no work email MCP access, no project-related content on personal Gmail, no realistic test data possible. A reference that can't be tested defeats the purpose of having a reference.
**Decision:** Use projects-and-tasks as the reference domain. It exercises most of the same patterns (multi-destination decomposition from user-typed notes, provenance markers across all four tags, review queue routing for ambiguous items, cross-domain writes to person/task/project/self-tracking files, fuzzy name resolution, Dataview queries, file templates, append-only discipline, BLUF output conventions) and is fully testable locally with no external MCP dependency. To cover the two email-specific patterns it doesn't naturally exercise — external-content framing and prompt-injection defense — Phase 2 adds a **"process this paste"** extension feature that takes user-pasted unstructured content and decomposes it with full injection defenses. Email-and-messaging is then built autonomously in Phase 3, using AI-generated test emails and the patterns established in the reference. MCP wiring for email is deferred to Phase 5 user acceptance.
**Alternatives rejected:** Email-and-messaging as reference (untestable on current setup), writing-and-drafts as reference (too narrow — pure transformations, doesn't exercise multi-destination routing or cross-domain writes), meetings-and-calendar as reference (same calendar MCP dependency problem), no reference domain (removes the exemplar Claude needs to imitate patterns during autonomous phases).

### D025 — Foundations-first iterative build replaces traditional req→design→build waterfall
**Date:** 2026-04-04
**Context:** The original roadmap used a traditional software pipeline — features → parallel-thread requirements per domain → design → build → ship. Reviewed whether this is right for Myna, which is explicitly not traditional software: no backend, no frontend, no database, no server. Deliverables are agent instruction files, steering files, vault templates, config schemas, and one thin Obsidian CLI MCP wrapper. The LLM is the runtime. Separately, a reusability goal emerged: the build process must be repeatable so future feature additions (by the user or someone else) follow the same recipe without re-doing the setup work.
**Decision:** Replace the M1–M4 milestone structure with a 7-phase foundations-first iterative pipeline: (0) **Foundations** — define every structure, template, convention, and mechanism all features share. (1) **Template + reference requirement** — co-developed so the template is validated by use, not designed abstractly. (2) **Reference domain** — one domain fully worked end-to-end with recipe and verification checklist emerging as byproducts. (2.5) **Test infrastructure** — test data, acceptance prompts, consistency checks, escalation tripwires. (3) **Autonomous feature build** — remaining domains built feature-by-feature following the reference, escalating only on tripwires. (4) **Autonomous integration** — cross-domain scenarios tested and fixed. (5) **User acceptance** — real-world usage with real data and live MCPs. (6) **Ship** — docs and release. Rationale: for an agentic system, requirements and design aren't cleanly separable (most of "design" is already captured in decisions.md and non-functional); the expensive work is getting structures and conventions right once, which foundations handles upfront; parallel per-domain work is unnecessary since the user is available for questions; iterative vertical slices with tight spec-test coupling produce higher quality than waterfall phases because problems surface feature-by-feature rather than all at the end. Side effect that satisfies the reusability goal: **Phase 3 in isolation IS the add-a-feature recipe** — future feature work inherits foundations, template, build-feature recipe, verification checklist, and reference domain from the initial build and runs only the Phase 3 loop.
**Alternatives rejected:** Traditional features→requirements→design→build waterfall (requirements and design overlap too heavily for an agentic system; waterfall defers feedback until the end of each phase). Parallel per-domain requirements (no longer needed with user available; extra coordination overhead). Skip requirements entirely, write agent instructions directly (loses the cheap review checkpoint and makes cross-feature consistency harder to maintain). Build feature-by-feature without foundations (conventions drift across features; inconsistency compounds).

### D024 — Review queue reserved for genuinely ambiguous items only
**Date:** 2026-04-03
**Context:** With provenance markers handling most writes, the review queue's role changed. The original D004 sent all judgment calls to the review queue. But if the queue is full of obvious items, users rubber-stamp everything — and then genuinely ambiguous items get rubber-stamped too.
**Decision:** The review queue is a precision tool, not a default routing step. Only genuinely ambiguous items go to the queue — when the agent can't determine the project, can't tell who owns an action item, or sees conflicting signals. The test: could the user reasonably disagree with the agent's interpretation? If yes → queue. If the answer is obvious but unstated → `[Inferred]` tag. Refines D004.
**Alternatives rejected:** Queue everything (user ignores it), queue nothing (bad inferences go unchecked).

### D023 — Multi-destination routing for all processing
**Date:** 2026-04-03
**Context:** A single email, Slack message, meeting note, or quick capture can contain information relevant to multiple destinations — a project timeline update, a person observation, and a self-tracking contribution all in one message.
**Decision:** Every processing feature (email, messaging, meetings, documents, quick capture) decomposes inputs and creates a separate entry for each relevant destination. Nothing is silently dropped because the agent tried to pick "the best" place. Each entry gets its own provenance marker. Applies system-wide.
**Alternatives rejected:** Pick the "primary" destination (loses information), ask the user to route each item (too much friction).

### D022 — Meetings sourced from calendar, no separate registry
**Date:** 2026-04-03
**Context:** The original design had meetings in the config registry. But the calendar already has all meeting data — attendees, time, recurrence. Duplicating it in a registry is maintenance overhead that goes stale.
**Decision:** Meetings read from calendar MCP. Meeting type inferred from multiple signals: attendee count, event title, attendee composition, recurrence, project name matching. Agent asks on first encounter when unsure, remembers the answer as an optional override in registry. No meeting registry required for basic operation.
**Alternatives rejected:** Full meeting registry (maintenance overhead, goes stale), calendar only with no inference (can't adapt prep/debrief by meeting type).

### D021 — Provenance markers on all vault entries
**Date:** 2026-04-03
**Context:** With the review queue no longer the default routing, the system needs a way to track the origin and confidence of every entry so users can trust what they're reading and spot-check when needed.
**Decision:** Four provenance markers on every agent-written entry: `[User]` (user typed it), `[Auto]` (agent extracted, all data explicit from source), `[Inferred]` (agent extracted, some fields guessed — flagged for optional verification), `[Verified]` (user confirmed an Auto or Inferred entry). Tags appear at end of line with compact source reference for readability. Features that compile data (narratives, briefings) highlight `[Inferred]` entries. Supersedes the two-path pattern from D017 — D017's principle (user-typed vs agent-extracted) is preserved but the routing is now four paths, not two.
**Alternatives rejected:** No tags (can't tell what to trust), only two paths like D017 (too many items in review queue), confidence scores (model-specific, not meaningful across AI providers per D002).

### D020 — Feature toggles are a P0 system-wide requirement
**Date:** 2026-04-03
**Context:** Myna has 50+ features across 10 domains. New users would be overwhelmed seeing everything at once. Need a way to enable/disable features so users can start small and expand.
**Decision:** Every feature has a toggle in workspace.md config (enabled/disabled). Every agent instruction and steering file checks the toggle before offering or executing a feature. Baked into P0 — all agent instructions are toggle-aware from the start. Retrofitting toggle checks into existing instructions is painful and error-prone. Default on/off per feature to be decided during design. Disabled features are silently skipped — the agent doesn't mention them.
**Alternatives rejected:** Progressive unlock tiers (adds complexity for marginal benefit), no toggles and rely on natural discovery (still overwhelming when user asks "what can you do?"), build toggles later as a backlog item (retrofitting is painful).

### D019 — Email folder moves allowed for deduplication
**Date:** 2026-04-03
**Context:** Email processing needs to avoid reprocessing the same email on the next run. Options: fingerprint tracking file (complex, needs cleanup) or move processed emails to a `Processed/` subfolder within each project folder (simple, self-maintaining). Moving emails is a write to the email system, which the vision previously only allowed for calendar events.
**Decision:** Myna may move emails between the user's own folders — specifically, moving processed emails to a `Processed/` subfolder that mirrors the project folder structure. This is the only email write Myna performs. It's organizing the user's mailbox, not acting on their behalf — reversible, low risk, invisible to others. Vision updated: external writes are personal calendar events (D003) and email folder moves for dedup. If the email MCP doesn't support moves, fall back to fingerprint-based tracking in `_system/logs/`.
**Alternatives rejected:** Fingerprint tracking only (complex, tracking file grows, needs periodic cleanup), rely on MCP features like message IDs or read status (can't assume MCP capabilities per D005), do nothing and accept duplicates (creates noise in review queue).

### D018 — Facts not judgments: never infer about people's internal states
**Date:** 2026-04-03
**Context:** Engagement Signal Detection was proposed to scan for signs a team member "may be disengaged." But Myna only has the user's notes — not objective data. "Fewer 1:1 topics" could mean the relationship is healthy. A wrong inference about a person primes confirmation bias and can become self-fulfilling. Same problem with inferring stakeholder "positions" or judging 1:1 "health."
**Decision:** Myna shows factual data points (dates, counts, sourced quotes) but never subjective labels or inferences about people's internal states. No "disengaged", "frustrated", "opposed", "supportive." Engagement Signal Detection replaced with Attention Gap Detection (surfaces gaps in YOUR behavior, not interpretations of theirs). 1:1 analysis shows follow-through rates and carry-forward counts, not "relationship health." Stakeholder briefings show factual mentions, not inferred positions. When in doubt about whether something is a fact or an inference: if removing the source data would make the claim unverifiable, it's an inference — don't show it.
**Alternatives rejected:** Keep engagement detection with caveats/disclaimers (disclaimers don't prevent confirmation bias), show inferences with low-confidence markers (users anchor on the inference regardless of confidence level), remove people-insight features entirely (factual versions are genuinely useful).

### D017 — User-typed observations are direct write, agent-extracted go through review queue
**Date:** 2026-04-03
**Context:** D004 says all judgment calls go through review queue. But when the user explicitly types an observation ("observation about Sarah: great escalation handling"), they've already made the judgment — no need to approve their own words. However, when Myna extracts observations from meeting notes or emails, it might misinterpret.
**Decision:** Two paths for observations: (1) user explicitly types it → direct write to person file, no review queue. (2) Myna extracts it from meeting notes, email, or Slack → review queue before writing. Same principle applies to contributions in self-tracking.
**Alternatives rejected:** All observations through review queue (unnecessary friction for explicit user input), all observations direct write (risky for agent-extracted ones).

### D016 — BLUF as default for all professional writing
**Date:** 2026-04-03
**Context:** Emails and messages need a consistent structure. BLUF (Bottom Line Up Front) leads with the answer/ask, then provides context. Widely used in tech and military communication.
**Decision:** All professional writing (emails, Slack messages, status updates) uses BLUF structure by default in tone and rewrite modes. Fix mode (grammar only) does not restructure.
**Alternatives rejected:** No default structure (inconsistent output), recipient-specific structure (too complex for first version).

### D015 — Source provenance on all direct timeline writes
**Date:** 2026-04-03
**Context:** When Myna writes directly to project timelines (from email or messaging processing), the user needs to trace back to the original source.
**Decision:** All direct timeline writes include full source provenance: original text (verbatim), sender, and date/timestamp. This applies to any automated write that bypasses the review queue.
**Alternatives rejected:** Summary only (loses traceability), link to source only (source may move or be deleted).

### D014 — Decisions logged as timeline entries, no separate decision log
**Date:** 2026-04-03
**Context:** Decisions need to be recorded but a separate decision log creates another file to maintain and check.
**Decision:** Decisions are logged as timeline entries in the relevant project file with a `Decision` category tag. No separate decision log file. Decisions are discoverable via Dataview queries filtering by category.
**Alternatives rejected:** Separate decision log (one more file to maintain, decisions lose project context).

### D013 — Delegations are tasks with type:: delegation, not a separate tracker
**Date:** 2026-04-03
**Context:** Need to track tasks delegated to others. Could be a separate tracker file or a property on regular tasks.
**Decision:** Delegations are regular TODOs with `type:: delegation` and a `person::` field for the owner. They live in the same task files as other tasks. Surfaced via Dataview queries filtering by type. No separate delegation tracker file.
**Alternatives rejected:** Separate delegation tracker (duplicates task data, two places to update).

### D012 — Clean folder structure, agent internals under _system
**Date:** 2026-04-02
**Context:** The `myna/` folder should feel like the user's workspace, not an agent's dump. Config, templates, dashboards, logs, and other Myna plumbing shouldn't clutter the top-level.
**Decision:** Top-level folders under `myna/` are only things the user interacts with (Projects, People, Meetings, Drafts, Journal, Tasks, ReviewQueue, etc.). All Myna internals — config, agent instructions, templates, dashboards, error logs — live under `myna/_system/`. Exact folder structure to be finalized in design.
**Alternatives rejected:** Flat structure with everything at top level (cluttered), dotfiles for internals (hidden by default in Obsidian, harder to find when needed).

### D011 — Myna writes only under a dedicated subfolder in the vault
**Date:** 2026-04-02
**Context:** Myna shouldn't scatter files across the user's vault. Users have their own notes, folders, and structure. Myna needs to stay contained.
**Decision:** All Myna-managed files live under a single subfolder in the user's vault (e.g. `myna/`). Myna never writes outside this folder. Myna CAN read files anywhere in the vault if the user points it to them (e.g. "summarize this doc"). The subfolder name is configurable during setup.
**Alternatives rejected:** Myna owns the whole vault (pollutes user's space), separate vault entirely (loses Obsidian integration — user can't see Myna files alongside their own notes).

### D010 — Folder-based project mapping + batch triage for inbox
**Date:** 2026-04-02
**Context:** Myna's "never assume" principle means it can't guess which project an email belongs to. But making the user sort 100 emails one-by-one is too much friction.
**Decision:** Two-part approach: (1) Users configure explicit folder/channel → project mappings in config. Myna reads from those mapped folders and knows exactly which project each item belongs to — zero ambiguity. (2) For unmapped items (inbox), Myna does batch triage — reads all items, presents a grouped sorting suggestion ("here's how I'd sort these 100 emails by project"), and the user approves/edits/rejects the batch. Nothing moves or gets processed without user approval. User can also review one-by-one if they prefer.
**Alternatives rejected:** AI auto-classification (90% accuracy means 10 wrong out of 100 — unacceptable), user sorts manually one-by-one (too slow), no inbox scanning (loses value).

### D009 — Interactive minimal setup, config file as fallback
**Date:** 2026-04-02
**Context:** Users need to provide MCP names, AI model, vault path, and other config. A big config file upfront creates friction and discourages adoption. But power users may prefer editing files directly.
**Decision:** Setup is an interactive conversation (~5 min). It covers: (1) AI model, vault path, MCP connections, (2) projects — names, aliases, mapped email folders/Slack channels, (3) people — direct reports, manager, key collaborators with roles, (4) recurring meetings (optional). Everything else has sensible defaults and can be added later. Config is written to files that the user can hand-edit. Power users can skip the interactive setup and edit config files directly.
**Alternatives rejected:** Config file only (too much friction), long interview-style setup (discourages adoption), no config at all (can't work without knowing MCP names), too minimal setup that delays value (user can't do anything useful without projects and people).

### D008 — Ship a lightweight Obsidian CLI MCP server
**Date:** 2026-04-02
**Context:** Obsidian released a CLI (obsidian.md/cli) that exposes vault operations — search, tasks, daily notes, template creation, eval. Agents need structured access to these capabilities. Wrapping them as MCP tools makes agent instructions simpler and model-agnostic.
**Decision:** Myna ships one MCP server: a thin wrapper around Obsidian CLI. It exposes vault operations (search, tasks, daily notes, create from template, etc.) as MCP tools. This is the only MCP Myna builds — it's the vault interface, not enterprise infrastructure. Keep it lightweight so it's easy to update as Obsidian releases new CLI features. Falls back to raw file read/write if Obsidian isn't running.
**Alternatives rejected:** Raw file read/write only (loses Obsidian's search index, task parsing, template rendering), agents calling CLI directly via shell (ad-hoc, each model needs different shell syntax), no MCP at all (less portable across AI models).

### D007 — Model-agnostic via common instructions + setup-time adaptation
**Date:** 2026-04-02
**Context:** Need to support Claude, Kiro CLI, Gemini, Codex, etc. without maintaining separate codebases.
**Decision:** High-level agent instructions are shared across all models. During setup, user selects their AI model and the system generates model-specific configuration (prompt formatting, guardrails where supported, feature flags for unsupported capabilities). Common layer: vault structure, behavior specs, config files. Model-specific layer: prompt format, guardrails, feature availability.
**Alternatives rejected:** Fully identical prompts across models (models have different capabilities), separate implementations per model (maintenance nightmare).

### D006 — Prompt-based interaction, not CLI tool
**Date:** 2026-04-02
**Context:** Users interact with Myna through natural language prompts inside their AI agent (Kiro CLI, Claude Code, etc.), not through a custom CLI binary.
**Decision:** Myna's "interface" is natural language prompts typed into whatever AI agent the user has. The deliverable is agent instructions + vault structure + config, not an application.
**Alternatives rejected:** Custom CLI tool (unnecessary layer, adds build/install complexity), VS Code extension (vendor-specific).

### D005 — No custom MCP servers for external services
**Date:** 2026-04-02
**Context:** Enterprise environments already have company-approved MCP servers for email, Slack, calendar. Building custom ones adds infrastructure, security review overhead, and data pipeline risk.
**Decision:** Myna does not build MCP servers for email, Slack, calendar, or other external services. It connects to whatever MCP servers the enterprise already provides. Setup asks users to configure their existing MCP connections. (Exception: Myna ships its own Obsidian CLI MCP — see D008.)
**Alternatives rejected:** Custom MCP servers for external services (unnecessary, blocks enterprise adoption), bundled open-source servers (still requires security review).

### D004 — Review queue for judgment calls
**Date:** 2026-03-31
**Context:** AI can't reliably distinguish delegation from casual request, or genuine recognition from politeness.
**Decision:** Items requiring interpretation (action items, delegations, decisions, recognition) always go through a review queue before being written to their final destination.
**Alternatives rejected:** Fully automated extraction (too many false positives create bad data).

### D003 — Draft only, never send + three-layer calendar protection
**Date:** 2026-03-31 (updated 2026-04-03)
**Context:** Risk of AI sending wrong message to wrong person is too high. Calendar writes need extra protection since they're the one external write Myna does.
**Decision:** Myna drafts all outbound communications but never sends them. Only exception is personal calendar events (no attendees). Calendar writes use three-layer protection where supported by the AI model: (1) agent instruction rule — never add attendees, always use configured prefix, (2) pre-tool check — rejects any call with attendees or missing prefix, (3) explicit confirmation — agent shows all parameters before creating. If the AI model doesn't support guardrails/hooks (layers 1-2), rely on the instruction rule and explicit confirmation only.
**Alternatives rejected:** Auto-send with confirmation (still too risky — one wrong click), no calendar writes at all (loses useful time-blocking capability).

### D002 — AI model agnostic
**Date:** 2026-03-31
**Context:** Don't want vendor lock-in. Want to use whichever model is best for each task.
**Decision:** Myna must work with Claude, Gemini, Codex, Kiro CLI, and any future capable model. Agent definitions are a protocol, not tied to a specific provider.
**Alternatives rejected:** Claude-only (limits flexibility).

### D001 — Obsidian as the vault UI
**Date:** 2026-03-31
**Context:** Needed a local-first tool to manage markdown files with dynamic queries.
**Decision:** Use Obsidian with Dataview and Tasks plugins as the primary interface for vault files.
**Alternatives rejected:** VS Code (no rich query support), custom UI (too much build overhead), Notion (not local-first).

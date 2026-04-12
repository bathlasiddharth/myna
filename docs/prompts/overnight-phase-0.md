# Overnight Phase 0 Design Session — Myna

Paste this entire prompt into a new Claude Code session. If the session hits
a usage limit mid-run and you start a new session later, paste this same
prompt again — the resume protocol below will pick up where it left off.

---

You are running a long-running autonomous Phase 0 design session for Myna.
This is the most important phase in the build pipeline. Every downstream
phase depends on its output. Do NOT rush. Use ultrathink at every decision
point. Your goal: produce the best Phase 0 design Claude can produce, with
the user reviewing it in the morning.

You will NOT commit or push. The user reviews and commits manually.

---

## STEP 0 — Resume check (always run this first)

Before anything else, check whether a prior session has already made
progress:

1. Read `docs/overnight-status.md` if it exists.
2. If the file exists and has prior progress logged:
   - Read it completely. Identify the last completed section and the next
     incomplete section.
   - Verify the artifacts referenced in the status file still exist on disk
     (`docs/design/kiro-cli-research.md`, `docs/foundations-inventory.md`, any
     partial architecture/foundations content, etc.).
   - Skip to the next incomplete step in the workflow. Do NOT redo work
     that's already complete.
   - Append a short resume note to `docs/overnight-status.md` under a
     "Resume log" section: "Resumed at {timestamp}. Picking up at
     {section/step}."
   - Continue from the resume point.
3. If the file does NOT exist OR has no progress yet:
   - Proceed with Step 1 (fresh start).

**Resume must be robust.** Never assume prior-session memory. Every piece of
state needed to resume is in files — `docs/overnight-status.md` is the
source of truth. If something is ambiguous, prefer the file state over your
interpretation.

---

## Step 1 — Read all context (only if starting fresh)

Read these files in order. Do not skim. Use ultrathink to build a complete
mental model before writing anything.

1. `docs/vision.md`
2. `docs/decisions.md` — ALL decisions, especially D025–D038
3. `docs/roadmap.md` — Project Goals, Build Approach, Phase 0 section
4. `docs/instructions/phase-0-architecture-foundations.md` — your operational
   guide, follow alongside this prompt
5. `docs/requirements/non-functional.md`
6. `docs/requirements/cross-domain.md`
7. ALL files in `docs/requirements/` — the approved features under
   `## Features` headings are your architecture inputs
8. `docs/open-questions.md` — currently unresolved items
9. `docs/design/design-deliverables.md`
10. `docs/journal/dev-journal.md` — recent entries, especially the 2026-04-05
    ultrathink restructure narrative

CLAUDE.md is auto-loaded — you already have it.

---

## User's pre-session answers (10 items)

Treat these as settled. Do not revisit them unless the research or design
actively contradicts one — in which case ESCALATE (write to open-questions),
do not silently override.

### 1. Agent decomposition — hierarchical main agent + skills/subagents
- ONE main agent is what the user interacts with. Users never call
  subagents directly.
- Main agent routes work to Kiro CLI skills (primary delegation mechanism)
  or subagents (when justified by latency tradeoff).
- Subagents are valid but LATENCY-SENSITIVE. Each subagent spawn costs
  seconds. Per-feature decision: is the latency cost justified by what
  the subagent uniquely provides (isolation, long-running work)?
- No blanket rule. Each feature gets a delegation mechanism decision
  (main-agent-prompt / skill / subagent) with explicit reasoning.
- **Runtime sentinel subagent deferred to post-launch.** v1 relies on
  instruction-level prompt-injection defense — design this as a
  first-class steering artifact, not a hand-wave.
- **Main agent prompt size is on a tight budget** to avoid instruction
  bleed. Heuristic:
  - Main agent prompt: role, voice, routing logic, always-applicable
    safety rules (never send, never assume, external content as data),
    shared conventions
  - Skills: per-feature behaviors, user-invoked operations
  - Subagents: only when isolation or long-running context is genuinely
    required

### 2. Cross-cutting agents — NONE for v1
Main agent handles routing. Critic/extractor (if needed) live as skills or
inline in main agent. No separate sentinel, router, critic, or extractor
subagents in v1.

### 3. Vault subfolder — `myna/`
Per D011.

### 4. Config file format — pure YAML
Six config files are `.yaml` (not `.md`):
`workspace.yaml`, `projects.yaml`, `people.yaml`, `meetings.yaml`,
`communication-style.yaml`, `tags.yaml`. YAML `#` comments supported for
hand-editable inline documentation. Setup wizard writes YAML. Agents read
YAML.

### 5. Kiro CLI research — first workflow step
Before architecture design, comprehensively research Kiro CLI:
- ALL features relevant to building an agentic assistant, not just skills
  and subagents. Config mechanisms, hooks, commands, context/memory,
  persistence, MCP registration, file locations, plugins, development
  tools, shortcuts, settings — exhaustive catalog.
- **Target: Kiro CLI only.** Not Kiro IDE. Filter all findings for
  CLI-applicable content. If a feature is IDE-only, note and move on.
- Use WebSearch + WebFetch. Read whatever is publicly findable. Document
  what you tried and what you couldn't reach.
- Output: `docs/design/kiro-cli-research.md` — comprehensive catalog, CLI-vs-IDE
  notes, documented unknowns.

### 6. Feature consolidation and mapping — two explicit workflow additions
During architecture design:
(a) **Feature consolidation review** — actively look for features in
    `docs/requirements/*.md` that should be MERGED into a single behavior
    within an agent because separating them would produce redundant or
    inconsistent instructions. Document each merge with reasoning.
(b) **Mandatory feature-to-agent mapping** — every approved feature under
    `## Features` headings in `docs/requirements/*.md` MUST have a home in
    the mapping: which agent owns it, whether standalone or merged, and
    the delegation mechanism (main-prompt / skill / subagent). Missing any
    feature = Phase 0 not done. Run a coverage audit before declaring done.

### 7. v1 scope — all features
No minimum-viable subset. No exclusions. D034 holds.

### 8. Agent naming — propose them yourself
No prior constraints.

### 9. Reference agent selection — re-examine with constraints
Pick the reference agent using these criteria in priority order:
- **Pattern coverage** — exercises the most reusable patterns for Phase 5
- **Testability without external MCPs** — exercisable with Myna's own dev
  work as test data (D027)
- **Not blocked on unavailable resources** — specifically, avoid agents
  depending on the work email MCP (user has no access)

For broader architecture design: **assume MCPs work correctly.** Do not
over-engineer for MCP format variations. Real-MCP adaptation is a
post-reference activity.

### 11. Local MCPs — a first-class option equal to skills and subagents

The toolkit now has four mechanisms. For every architectural decision, choose based on **user experience quality and response reliability only**. Build complexity is not a factor.

| Mechanism | When it fits |
|---|---|
| Main agent prompt | Always-on reasoning, routing, safety rules, conventions. Keep tight to avoid instruction bleed. |
| Kiro CLI skill | Invokable feature behaviors. Fast. Good default for most features. |
| Local MCP | When vault operations are structurally complex enough that API-level enforcement — rather than prompt instructions — meaningfully improves reliability. Agent calls clean verbs; MCP handles vault details. |
| Subagent | When genuine isolation is needed. Latency-sensitive. Use sparingly. |

**Why MCPs improve reliability:** `create_task(project, description, owner, due)` cannot produce malformed Obsidian Tasks syntax — the MCP enforces it. A prompt instruction can be forgotten or drift. For operations with complex file formats, plugin syntax, multi-field rules, or append-only constraints, an MCP produces fundamentally more reliable results.

**Constraint:** Local vault MCPs only. D005 still forbids MCPs for external services. Exception: computation-only MCPs that process already-fetched content locally (no network calls) are fine.

**Install is not a constraint.** Phase 6 is one-command install regardless of MCP count. Not a user burden.

**D038 framing:** Local MCPs are adapter layer. Agent says neutral verbs; MCP handles Obsidian-specific implementation. Future AI tools either reuse the same MCPs or get a new adapter. Content unchanged.

**Per-domain decision in Step 4:** explicitly choose local MCP / skill / main-agent-prompt with reasoning based on reliability and user quality. Document every decision. Do NOT default to MCPs — reason honestly per case, but do not weight build complexity.

### 10. Tool-agnostic content layer + install adapter (D038)
Hard constraint for every file you write in Phase 0:
- **Content layer** (tool-neutral): agent content, steering, skills,
  foundations, templates all live as plain markdown + YAML. No Kiro
  CLI-specific syntax, no Kiro CLI-specific file paths, no Kiro CLI
  assumptions leaked into content.
- **Adapter layer** (tool-specific): Phase 6 install step packages content
  for Kiro CLI's runtime. Phase 0 designs the content layer structure and
  the Kiro CLI adapter scope. Does NOT design adapters for other tools.
- **Extensibility test per file:** "Would this need to change to work on
  Claude Code / Gemini instead of Kiro CLI?" If yes, the tool-specific
  part belongs in the adapter, not the content. Move it.

---

## Your task — artifacts to produce

Every artifact below is required unless marked optional. Do NOT commit or
push any of them.

1. **`docs/design/kiro-cli-research.md`** — comprehensive Kiro CLI feature catalog
   from Step 2 research
2. **`docs/foundations-inventory.md`** — classified inventory
   ([Settled]/[Derive]/[Gap]) per P0-T01 of the Phase 0 operational guide
3. **`docs/architecture.md`** — agent architecture including:
   - Decomposition philosophy and rationale
   - Agent roster (names, scopes, roles, prompt-composition strategy)
   - Routing model
   - Steering file list with scope
   - Feature-to-agent mapping (every approved feature assigned)
   - Feature consolidation decisions (merges with reasoning)
   - Content layer structure (per D038)
   - Kiro CLI adapter layer scope (what Phase 6 will build)
   - Prompt-injection defense strategy at the instruction level
4. **`docs/design/foundations.md`** — data-layer foundations including:
   - Complete vault folder structure
   - File templates for every file type
   - All 6 config file YAML schemas
   - Provenance marker placement rules with examples
   - Date + source format
   - Review queue routing rules
   - Obsidian CLI MCP tool surface
   - Cross-domain data flow map
   - Cross-domain behavior coordination
   - Pattern catalog
   - Feature toggle mechanism
5. **Reference agent selection** — a decision entry in `docs/decisions.md`
   (D039 or later) identifying the chosen reference agent with reasoning
6. **`docs/overnight-status.md`** — the single source of truth for session
   state, resume-safe, updated continuously
7. **`docs/overnight-reviews.md`** — all critique rounds logged for
   morning review (see Review discipline below)
8. **Append to `docs/open-questions.md`** — any new unresolved questions
9. **Append to `docs/journal/dev-journal.md`** — narrative entry about the session

---

## Workflow

### Step 2 — Kiro CLI research
Write `docs/design/kiro-cli-research.md`. Comprehensive feature catalog per
pre-session answer 5. Ultrathink about what you're reading — architecture
decisions depend on this. Before declaring research done, ask yourself:
"have I explored features beyond skills and subagents? hooks? commands?
memory? MCP registration? file location conventions?" If any are
unexplored, continue researching.

Update `docs/overnight-status.md` when research is complete.

### Step 3 — Initial status and foundations inventory
Write `docs/overnight-status.md` with:
- Session plan and section order
- Your initial assumptions beyond pre-session answers
- Any early blockers
- Resume log: "Started at {timestamp}"

Then produce `docs/foundations-inventory.md` per P0-T01. Classify every
item as [Settled]/[Derive]/[Gap]. Resolve gaps via pre-session answers
where possible; document assumptions for small gaps; log large gaps to
`docs/open-questions.md`.

### Step 3.5 — Design the doc templates (ultrathink, meta-step)

Before drafting any section content, ultrathink on the STRUCTURE the
Phase 0 docs should have. This is a meta-design step: what sections
does a good agent-architecture document need? What sections does a
good agentic-system foundations document need? How should they be
ordered? What groupings emerge naturally?

**Do NOT inherit a section list from this prompt or from anywhere
else.** Think from first principles about what a senior architect
building an agentic system would want in these docs. Consider:
- What questions should each doc answer for a reader who has never
  seen the project?
- What's the right granularity per section (don't over-fragment,
  don't under-specify)?
- What's the dependency order — which sections must exist before
  later sections can be written well?
- What groupings reduce duplication and improve coherence?
- How does the two-layer structure (content vs. adapter per D038)
  affect what goes in each doc?
- What would a future Phase 5 autonomous reader need to find quickly?

**Output:** `docs/overnight-design-doc-templates.md` — two templates:
1. **Architecture doc template** — section list with one-line purpose
   per section, ordered dependency-first
2. **Foundations doc template** — same structure

This artifact is itself part of the methodology — it becomes reusable
for future agentic systems built with this playbook.

**Review the templates** with 2 rounds of fresh-context critique,
rotating reviewer roles. Senior Architect and Methodology User are
particularly relevant here. Log both rounds to
`docs/overnight-reviews.md` under "Section 0 — Design doc templates".

**Coverage check:** verify every topic in the coverage requirements
list below (in Step 4) has a home in one of your templates. If
something is missing, add a section. If your templates group things
differently than the coverage list, that's fine — as long as every
topic is covered somewhere with appropriate depth.

Update `docs/overnight-status.md` when templates are finalized.

### Step 4 — Section-by-section design (the main loop)

Use the templates you designed in Step 3.5. Work through the template
sections ONE AT A TIME in the dependency order your templates
prescribe. You may group tightly-coupled sections if they naturally
flow together in your template — but do NOT skip the review loop for
any section or group.

**Coverage requirements** — the following topics MUST be addressed
somewhere in your architecture and foundations docs. Your Step 3.5
templates decide HOW to structure them (standalone sections, grouped
sub-sections, different naming, different ordering). Verify every
topic is covered with appropriate depth before declaring Phase 0 done:

1. Agent decomposition philosophy and rationale
2. Agent roster (names, scopes, roles, prompt-composition strategy)
3. Routing model
4. Steering file list (global rules, including the instruction-level
   prompt-injection defense — this is critical since sentinel is deferred)
5. Feature-to-agent mapping + feature consolidation decisions + coverage
   audit
6. Content layer structure (D038) + Kiro CLI adapter layer scope
7. Vault folder structure
8. File templates (every file type)
9. Config file YAML schemas (all 6)
10. Provenance marker placement rules + canonical examples per entry type
11. Date + source format with examples
12. Review queue routing rules
13. Obsidian CLI MCP tool surface
14. Cross-domain data flow map
15. Cross-domain behavior coordination
16. Pattern catalog
17. Feature toggle mechanism
18. Reference agent selection with reasoning

### The iterative review loop for each section

For each section (or tight group):

**a. Draft** — write the section to the best quality you can produce.
Ultrathink on every decision point.

**b. Three review rounds with rotating reviewer roles.**
Each round spawns a fresh subagent (use the Agent tool with general-purpose
or Explore). Each round uses a DIFFERENT reviewer role from the table
below. Select 3 roles appropriate to the section from the list.

For each round, invoke the subagent with:
- The drafted section
- Relevant decisions, vision, prior completed sections
- Relevant `docs/requirements/*.md` if applicable
- **An explicit role assignment: "You are a {role}. Critique this section
  from that specific perspective. Give specific criticism, not generic
  affirmations. Tell me what's wrong, what's missing, what edge cases
  aren't handled, what would confuse a future reader, what contradicts
  prior decisions."**

**Reviewer role table:**

| Role | Looks for |
|---|---|
| **Senior Architect** | Overall shape, coherence, decomposition soundness, principle alignment, are these the right abstractions? |
| **Skeptical Engineer** | Edge cases, failure modes, missing coverage, "what breaks when X", race conditions, ambiguities |
| **LLM Runtime Thinker** | Does this work given how LLMs actually read prompts? Context budget? Instruction attention? Will the LLM actually follow this? |
| **Future Contributor** | Can someone who has never seen the project understand and apply this? Is the intent clear without the author present? |
| **Methodology User** | Could this pattern be applied to a different agentic assistant? Is it generalizable? (Extensibility check) |
| **Security Reviewer** | Attack surface, prompt injection paths, data leakage, what an adversary would try, D038 content leakage |

**Recommended role assignments per section:**

- Sections 1–4 (architecture): Senior Architect → LLM Runtime Thinker →
  Skeptical Engineer
- Section 5 (mapping): Skeptical Engineer → Senior Architect → Methodology
  User
- Section 6 (content/adapter layers): Methodology User → Future Contributor
  → Senior Architect
- Sections 7–13 (foundations scaffolding): Future Contributor → Skeptical
  Engineer → LLM Runtime Thinker
- Sections 14–15 (cross-domain): Skeptical Engineer → LLM Runtime Thinker
  → Senior Architect
- Section 16 (pattern catalog): Senior Architect → Methodology User →
  LLM Runtime Thinker
- Section 17 (feature toggles): Skeptical Engineer → Future Contributor →
  Senior Architect
- **Steering's prompt-injection defense sub-section (within Section 4):**
  Security Reviewer → Skeptical Engineer → LLM Runtime Thinker
- Section 18 (reference agent): Senior Architect → Skeptical Engineer →
  Methodology User

**c. Log the review in `docs/overnight-reviews.md`** — after each round,
append to the reviews file:

```
## Section {N} — {Section Name} — Round {R}
**Reviewer role:** {role}
**Date/time:** {timestamp}

### Criticism raised
- {specific point 1}
- {specific point 2}
- ...

### How the writer addressed
- {point 1}: {changed to X because Y} OR {rejected because Z}
- {point 2}: {changed to X because Y} OR {rejected because Z}
- ...

### Open items carried forward
- {anything the round surfaced that needs more thought or user input}
```

The user will read `docs/overnight-reviews.md` in the morning to understand
what critics raised and how you handled it.

**d. Address the critique** — revise the section. Use judgment, don't
blindly accept every point. Document rejected critiques in the review log
with reasoning.

**e. Repeat b–d two more times** (total 3 rounds minimum). STOP iterating
early only if round 3 produces no substantive new issues (convergence).
Record in the review log whether the section converged or completed all
3 rounds.

**f. Update `docs/overnight-status.md`** — mark section complete, note
artifact locations, note any carry-forward items.

**g. Move to next section.**

Do NOT skip review rounds. The iterative critique is why this session
exists.

### Step 5 — Integrate into final documents
After all sections are drafted and reviewed, assemble them into the final
`docs/architecture.md` and `docs/design/foundations.md`. Verify:
- Internal consistency — no two sections contradict
- External consistency — matches decisions, requirements, vision, CLAUDE.md
- Cross-references resolve
- Narrative flows

### Step 6 — Full-document fresh-context review
Spawn a final subagent with ONLY:
- Final `docs/architecture.md`
- Final `docs/design/foundations.md`
- Final `docs/design/kiro-cli-research.md`
- `docs/vision.md`
- `docs/decisions.md`
- All `docs/requirements/*.md`

Ask the subagent as **Future Contributor + Methodology User**: "Given only
these docs, could you build one of the agents in Phase 5 without asking
the author? What's unclear? What's missing? Is the feature-to-agent
mapping complete — is EVERY approved feature assigned a home? Would this
work as a playbook for a different agentic assistant?"

Log this final review in `docs/overnight-reviews.md` under "## Final Full-
Document Review". Address any gaps surfaced.

### Step 7 — Reference agent selection
Make the final choice based on the 3 criteria in pre-session answer 9.
Document reasoning and add a decision entry to `docs/decisions.md` (D039
or later, newest first).

### Step 8 — Final status report
Update `docs/overnight-status.md` comprehensively:
- Every section's final completion status
- Every assumption made, with reasoning AND "what changes if wrong"
- Every open question for morning user review, phrased as direct questions
  with enough context
- Artifact locations (all files produced or updated)
- Honest self-assessment: what's solid, what you're less confident about,
  quality tradeoffs
- Morning review guidance: what the user should focus on FIRST
- Methodology learnings (for the article): patterns you noticed about how
  to do Phase 0 work well

### Step 9 — Journal entry
Append a narrative entry to `docs/journal/dev-journal.md`. Capture the session:
what happened, surprises, hard decisions, patterns noticed, how the review
loop performed, what worked, what was awkward. This is article material.

---

## Rules (non-negotiable)

1. **Resume-safe always.** Every state transition updates
   `docs/overnight-status.md` with enough detail to resume. Never leave
   the status file stale.
2. **Never assume silently.** Every assumption in the status file with
   reasoning AND "what changes if wrong."
3. **Ultrathink per section.** Quality over speed. Don't rush later
   sections.
4. **Fresh-context critic is mandatory.** Spawn real subagents for review
   rounds. Do not self-review from the writing context.
5. **Rotate reviewer roles.** Each round uses a different role per the
   recommendations above. Don't use the same role 3 times.
6. **3 review rounds minimum** unless convergence (round 3 produces no
   substantive new points).
7. **Log every review round to `docs/overnight-reviews.md`.** User reads
   this in the morning to understand the critique process.
8. **Don't touch files outside Phase 0 scope.** Only modify artifacts
   listed above. Exception: append-only to decisions.md, dev-journal.md,
   open-questions.md.
9. **Do NOT git add, commit, or push.** User reviews and commits manually.
10. **If blocked, log and continue.** Never stuck. Move to the next
    section; return later if possible.
11. **No placeholder text in final docs.** If you can't complete a
    section, mark it blocked in the status file and leave it out of the
    final artifact. No "TODO: fill later" notes in architecture.md or
    foundations.md.
12. **Extensibility test (D038) per content file.** For each section
    going into architecture.md or foundations.md, ask: "Would this need
    to change for Claude Code or Gemini?" If yes, the tool-specific part
    belongs in the adapter scope section, not here. Move it.
13. **Coverage audit is mandatory.** Before declaring Phase 0 done,
    verify every approved feature in `docs/requirements/*.md` under
    `## Features` has a home in the feature-to-agent mapping. Missing
    any = not done.
14. **Capture methodology learnings.** Anything you discover about how
    to do Phase 0 work well — for future projects using this playbook —
    goes into a dedicated section at the bottom of overnight-status.md.
15. **Status file updated at least per-section.** Even if a section is
    mid-review, update the status file between rounds so resume works.

---

## Quality bar

Think like a senior architect who has seen many agentic systems succeed
and fail. Output should:

- Answer every "why" with a principle, not just a choice
- Be internally consistent — no two sections contradict
- Be externally consistent — matches decisions, requirements, vision
- Anticipate edge cases — for each "we do X", ask "what if X fails?"
- Be readable by a fresh contributor who has never seen the project
- Pass the Phase 0 completeness test: "if Phase 5 autonomous Claude were
  given only foundations, architecture, kiro-cli-research, and one unbuilt
  agent's feature assignment, could it build that agent without further
  design input?"
- Pass the D038 extensibility test per content file
- Survive the coverage audit — every approved feature has a home

---

## CRITICAL RULES — NEVER FORGET

These 5 rules, if violated, waste the entire night. If you find yourself
uncertain about anything during the session, return to this block and
reread it. The full rules above still apply — this is a distilled subset
of the ones that matter most.

1. **Resume always first.** Before ANY action in a new session, check
   `docs/overnight-status.md` for prior progress. Resume means continue,
   not restart. Never redo completed work.

2. **Update `docs/overnight-status.md` after every completed section AND
   after every review round.** This is what makes resume work. A stale
   status file breaks the whole resumption strategy.

3. **Never commit, push, or modify files outside Phase 0 scope.** The user
   commits manually in the morning. Phase 0 scope is the artifacts listed
   under "Your task." Exception: append-only to `docs/decisions.md`,
   `docs/journal/dev-journal.md`, `docs/open-questions.md`.

4. **Three review rounds per section with rotating roles, every round
   logged to `docs/overnight-reviews.md`.** Do not skip review rounds
   under any circumstance. Do not use the same reviewer role three
   times in a row. Do not skip the review log.

5. **Ultrathink every decision. Quality over speed.** If you're rushing
   a section to "save time for later sections," you're doing it wrong.
   Later sections deserve the same depth as earlier ones.

---

## Starting move (after resume check in Step 0)

1. Use TaskCreate to set up progress tracking covering: Kiro CLI research,
   foundations inventory, each major section, integration, full review,
   reference agent, final status, journal entry
2. Read all context files in Step 1 order
3. Ultrathink on the overall task
4. Begin Step 2 (Kiro CLI research)
5. Then Step 3 (initial status + inventory)
6. Then Step 4 section-by-section loop

If resuming: skip to the next incomplete step. Log the resume in
`docs/overnight-status.md`.

Good luck. Take your time. Produce the best Phase 0 design Claude can
produce. The user reviews everything in the morning.

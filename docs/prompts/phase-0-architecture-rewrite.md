# Phase 0 — Architecture & Foundations Rewrite

Paste this entire prompt into a new Claude Code session.

---

You are running an autonomous Phase 0 design session for Myna. Your job is to produce two documents: `docs/architecture.md` and `docs/design/foundations.md`. These are the most important documents in the project — every downstream phase depends on them.

You will NOT commit or push. The user reviews and commits manually.

---

## The #1 rule: KISS — Keep It Simple, Stupid

The previous version of the architecture was rejected because it was over-engineered. It focused on security hardening (nonces, sentinels, prompt injection defenses, 5-layer validation) instead of describing how the assistant actually works. The user was very disappointed.

**Your architecture must answer one question: how does Myna work as an assistant?**

- Lead with what the system does and how the user interacts with it
- Describe skills, agent routing, vault structure, config, MCP integration
- Use concrete examples throughout: "user says X → skill Y runs → vault gets Z"
- No security sections beyond draft-never-send (one line in steering, not a section)
- No speculative mechanisms (nothing you're not sure the LLM can do reliably)
- Don't show off complexity. A simple design that works beats a clever one that impresses
- If you find yourself writing more than 3 sentences about any defense/validation/protection mechanism, you're over-engineering. Stop and simplify

---

## Constraints (settled by the user — do not revisit)

1. **No security hardening beyond draft-never-send.** No prompt injection defenses, no nonces, no content scrubbing, no sentinel subagents, no delimiter-collision detection. Myna is local-only, single-user. Security hardening is a post-v1 initiative.

2. **No subagents in v1.** All processing runs through skills in the main agent. Subagents are a post-v1 performance optimization.

3. **No automatic skill chaining.** Skills output their result. If a follow-up action is needed, the skill tells the user what to invoke next. The user triggers the next skill explicitly. No FOLLOW_UP_SKILL directives, no session nonces, no re-dispatch mechanisms.

4. **Consolidate features into fewer skills.** One skill per workflow, not per feature. Group features that naturally happen together. The test: would the user do these things in one sitting? If yes, one skill. If triggered differently (batch vs on-demand, before vs after an event), separate skills. But don't over-merge to the point a skill's prompt is too long for the LLM to follow reliably.

5. **Install scope is user's choice.** Don't assume workspace-vs-global agent placement. The install script (Phase 6) asks the user whether they want global or local installation and places files accordingly. Architecture describes what content goes into the agent definition; the installer handles placement.

6. **Never reference `dev-journal.md` in any docs.** Dev-journal is for article writing only. Decisions live in `decisions.md`, learnings live in `foundations.md` or `instructions/`.

7. **Never reference `kiro-cli-research.md` in architecture or foundations.** It's a temporary research artifact. Use it as background context but don't cite it. Decisions stand on their own.

8. **AI model agnostic (D002, D007, D038).** Content layer is tool-neutral markdown + YAML. Install-time adapter packages for the target AI tool. Don't embed tool-specific syntax in content files.

9. **Config files are YAML, not markdown.** Six config files: `workspace.yaml`, `projects.yaml`, `people.yaml`, `meetings.yaml`, `communication-style.yaml`, `tags.yaml`.

10. **Feature toggles (D020).** Every feature has a toggle. Agent instructions check toggles before acting. Design this simply.

11. **Don't over-specify what LLMs do naturally.** Summarization, tone adjustment, writing, extraction, classification — these are core LLM capabilities. Describe what you want in plain language ("summarize this thread in 2-3 sentences", "extract action items", "rewrite in a professional tone") and the LLM will do it. Don't build elaborate logic, rules, or multi-step pipelines around things the LLM handles well with a simple natural language instruction. The architecture should specify *what* to do and *where* to put the result — not *how* to summarize or *how* to extract. Reserve detailed specifications for things the LLM would genuinely get wrong without guidance: vault file formats, provenance marker placement, which config fields to read, routing decisions.

---

## Step 0 — Read all context

Read these files completely. Build a full mental model before writing anything.

1. `CLAUDE.md` — project instructions (auto-loaded)
2. `docs/vision.md` — north star
3. `docs/decisions.md` — ALL decisions D001–D038. These are settled. Do not re-debate.
4. `docs/open-questions.md` — unresolved items
5. `docs/roadmap.md` — pipeline structure, phase goals
6. `docs/instructions/phase-0-architecture-foundations.md` — what Phase 0 must produce
7. ALL files in `docs/requirements/` — the approved features under `## Features` headings are your inputs
8. `docs/design/kiro-cli-research.md` — background reference on Kiro CLI capabilities (DO NOT cite this in your output docs)

---

## Step 1 — Design the skill inventory

This is the most important design step. Map every approved feature from `docs/requirements/*.md` into consolidated skills.

**Process:**
1. List every feature from every `## Features` section across all requirement files
2. Group features into workflows: what would the user naturally do together in one interaction?
3. For each proposed skill: name it, list the features it covers, describe when the user would invoke it, what it reads, what it writes
4. Verify every feature has a home (coverage audit)
5. Check no skill is trying to do too many unrelated things (if the prompt would exceed ~2000 words of instructions, consider splitting)

**Output:** Write the skill inventory as a standalone working file `docs/design/skill-inventory-draft.md` first. Do NOT write it directly into `docs/architecture.md` yet — it needs review first.

### Step 1b — Review the skill inventory

The skill inventory is the backbone of the architecture. Get it right before building on top of it.

Spawn a fresh subagent (Agent tool) with the skill inventory draft, `docs/vision.md`, and all `docs/requirements/*.md` files. Ask:

> "You are reviewing a skill inventory for an AI assistant called Myna. Your job is to find problems with how features are grouped into skills. Read the skill inventory and the requirements files, then tell me: (1) Are any skills trying to do too many unrelated things? Which ones should be split? (2) Are any skills too granular — doing one tiny thing that should be part of a bigger workflow? Which ones should be merged? (3) Is every feature from the requirements covered? List any missing features. (4) Would a user intuitively know which skill to invoke for a given need, or are the boundaries confusing? (5) Are any skills over-specified — describing HOW to do things the LLM already does well (summarize, extract, rewrite) instead of just WHAT to do and WHERE to put the result?"

Address the feedback. Update the skill inventory. Then move it into `docs/architecture.md` as the first section and proceed to Step 2.

---

## Step 2 — Write `docs/architecture.md`

Structure the document around how the assistant works. Suggested sections (adapt as needed, but cover all these topics):

1. **Overview** — what Myna is architecturally, in 5-10 sentences
2. **Skill inventory** — from Step 1. For each skill: name, what it does, features covered, when invoked, what it reads/writes, example interaction
3. **Agent structure** — one main agent, how it routes to skills, what lives in the main agent prompt vs skills
4. **Vault structure** — folder layout under `myna/`, what goes where
5. **Config** — the 6 YAML files, what each controls, key fields
6. **MCP integration** — Obsidian CLI MCP tools, how skills use them, how external MCPs (email, Slack, calendar) connect
7. **Feature toggles** — how they work, where they're checked
8. **Review queue** — the 4 queue files, routing rules, how items flow through
9. **Provenance markers** — the 4 marker types, placement rules
10. **Cross-domain data flow** — how information moves between domains (email → project timeline, meeting notes → person file, etc.)
11. **Content vs adapter layers (D038)** — what's tool-neutral content, what the installer packages
12. **Draft-never-send** — the one safety rule, how it's enforced (briefly)
13. **Reference agent selection** — which agent is built first in Phase 3 and why

**Style guidelines:**
- Use concrete examples, not abstract descriptions
- "User says 'process my inbox' → process-inbox skill runs → reads from email MCP → creates tasks in Projects/, updates People/ files, adds items to review queue" is better than "The skill processes input and produces output across multiple destinations"
- Tables for structured info (skill inventory, config fields, folder structure)
- Keep each section focused — if it's getting long, you're probably over-explaining

---

## Step 3 — Write `docs/design/foundations.md`

The data layer foundations. Everything an agent builder needs to know about vault structure and conventions.

Cover:
1. **Complete vault folder structure** — every folder, its purpose, example contents
2. **File templates** — for every file type (project, person, meeting, daily note, review queue, contributions, drafts, config). Show the actual template with all fields
3. **Config file schemas** — all 6 YAML files, every field, required vs optional, defaults, examples
4. **Provenance marker rules** — placement, format, examples per entry type
5. **Date and source format** — canonical formats with examples
6. **Review queue routing** — which items go to which queue, criteria
7. **Obsidian CLI MCP tool surface** — what tools are available, what each does
8. **Cross-domain behavior coordination** — what happens when skill A depends on data skill B manages
9. **Pattern catalog** — recurring patterns with worked examples (multi-destination routing, batch triage, fuzzy name resolution, etc.)

**The test:** "If a fresh Claude session had only foundations.md, architecture.md, and one agent's feature assignment, could it build that agent without asking questions?" If not, foundations has gaps.

---

## Step 4 — Self-review (3 rounds)

After completing both docs, run 3 review rounds using fresh subagents (Agent tool). Each round uses a different reviewer perspective.

**Round 1 — Practical Builder**
Spawn a subagent with the completed `docs/architecture.md`, `docs/design/foundations.md`, `docs/vision.md`, and one requirements file (e.g. `docs/requirements/email-and-messaging.md`). Ask:

> "You are a Practical Builder. You need to build the email-and-messaging agent using only these docs. Read them and tell me: (1) Can you actually build from this? What's missing? (2) Is anything overcomplicated — could it be simpler? (3) Are the skill boundaries clear — do you know exactly what each skill does? (4) Are the vault write targets unambiguous — do you know exactly which file to write to? (5) Is anything redundant or contradictory between the two docs?"

**Round 2 — LLM Runtime Thinker**
Spawn a subagent with the same docs. Ask:

> "You are an LLM Runtime Thinker who deeply understands how LLMs process instructions. Read these docs and tell me: (1) Will the main agent prompt be small enough to avoid instruction bleed? (2) Are skill instructions clear enough that the LLM will follow them reliably? (3) Are there any skills trying to do too many things — where the LLM might lose track? (4) Is the routing from user request to skill unambiguous? (5) Are there any instructions that an LLM is likely to get wrong or ignore?"

**Round 3 — User Advocate**
Spawn a subagent with the same docs plus `docs/vision.md`. Ask:

> "You are a User Advocate who cares about the assistant experience. Read these docs and tell me: (1) Does this create a good assistant experience? Would you want to use Myna? (2) Are there too many skills for the user to remember — should some be merged? (3) Are there missing workflows — things a tech professional would want that aren't covered? (4) Is the config burden reasonable — is setup really ~5 minutes? (5) Does anything feel like engineering theater vs. genuinely useful?"

**For each round:** Log the critique in `docs/reviews/architecture-reviews.md`.

### Step 4b — Address review feedback

After all 3 rounds, go through the logged critiques and update `docs/architecture.md` and `docs/design/foundations.md`:

1. For each critique point, decide: accept or reject
2. If accepting, update the relevant doc
3. Log what you changed and why in `docs/reviews/architecture-reviews.md` under a "## Feedback Resolution" section
4. For rejected points, log your reasoning — don't blindly accept everything, but don't dismiss valid feedback either
5. If a review surfaced a fundamental issue (e.g. "these 3 skills should be merged"), make the structural change — don't just patch around it

---

## Step 5 — Coverage audit

After all reviews are addressed, run a final coverage audit:

1. Re-read every `## Features` section in `docs/requirements/*.md`
2. For each feature, verify it has a home in a skill in `docs/architecture.md`
3. If any feature is missing, add it to the appropriate skill or create a new one with reasoning
4. Output the audit results at the bottom of `docs/reviews/architecture-reviews.md`

---

## Step 6 — Decisions and open questions

- Add new decisions to `docs/decisions.md` (D039 onward, newest first). Include: reference agent selection, any feature consolidation decisions, any open question resolutions.
- Add new open questions to `docs/open-questions.md` if you surface any.

---

## Rules

1. **KISS above all.** If you catch yourself writing something complex, stop and ask "is there a simpler way?" There always is.
2. **No security hardening.** Not even "light" security. Draft-never-send is a behavior rule, not a security architecture. One sentence.
3. **No subagents.** Skills only.
4. **No automatic skill chaining.** User triggers each skill.
5. **Concrete examples everywhere.** Every skill gets at least one "user says X → Y happens → Z is written" example.
6. **Coverage is mandatory.** Every approved feature must have a home.
7. **Don't reference dev-journal.md or kiro-cli-research.md** in architecture or foundations.
8. **Do NOT commit or push.** User reviews and commits.
9. **Three review rounds are mandatory.** Use fresh subagents. Log all reviews.
10. **No placeholder text.** If you can't decide something, log it as an open question. Don't write "TBD" in the final docs.
11. **Quality over speed.** Take your time. Think before writing. These docs determine whether the project succeeds.

---

## Output files

1. `docs/architecture.md` — agent architecture, skill inventory, routing, config, MCP, cross-domain flows
2. `docs/design/foundations.md` — vault structure, file templates, config schemas, conventions, patterns
3. `docs/reviews/architecture-reviews.md` — all 3 review rounds logged + coverage audit
4. Append to `docs/decisions.md` — reference agent selection + any new decisions
5. Append to `docs/open-questions.md` — any new unresolved questions

---

## Start

1. Read all context files (Step 0)
2. Design skill inventory draft (Step 1)
3. Review skill inventory with fresh subagent, revise (Step 1b)
4. Write architecture (Step 2)
5. Write foundations (Step 3)
6. Self-review 3 rounds (Step 4)
7. Address review feedback, update docs (Step 4b)
8. Coverage audit (Step 5)
8. Record decisions and open questions (Step 6)

Take your time. Produce simple, clear, buildable docs. The user will review everything when they return.

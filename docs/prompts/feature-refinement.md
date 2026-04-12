# Feature Refinement Prompt

Copy-paste this into a new Claude thread.

---

You're preparing the feature lists for Myna — a local-first personal assistant for tech professionals. Your job is to read all brainstorm notes, think HARD AND DEEP, and produce a refined, complete feature list for each domain. Take as much time as you want but give me your best output.

Read these files first to understand the project:
- docs/vision.md
- docs/decisions.md
- docs/open-questions.md
- docs/instructions/requirements.md (to understand what level of detail requirements will need — this informs how you describe features)

Then process ALL 10 feature files in docs/features/. For each file:

1. Read the "Notes from previous brainstorming" section carefully
2. Think deeply about what features this domain needs. Consider:
   - What's in the brainstorm notes that should stay (refine the description if needed)
   - What's in the brainstorm notes that should be merged (some notes describe the same feature differently)
   - What's in the brainstorm notes that should be split (some notes pack multiple features into one)
   - What's MISSING that this domain clearly needs but nobody wrote down yet
   - What doesn't belong in this domain and should move elsewhere (note where)
   - How features in this domain connect to other domains
3. Write your recommended feature list under the "## Features" section. For each feature:
   - Give it a clear name and one-line summary
   - Write a concise description (2-5 bullet points) covering what it does and key behaviors
   - Mark features that came from brainstorm notes as-is (no tag)
   - Mark features you refined/merged/split from brainstorm notes with [Refined] and briefly note what changed
   - Mark completely new features you're proposing with [New] and explain why it's needed
4. After writing all features for a domain, do a self-review: did you miss anything? Are there gaps? Does every feature make sense given the vision and decisions?

Important rules:
- Do NOT read docs/design-context.md, docs/requirements.md, or docs/features.md unless I explicitly ask
- Read docs/decisions.md carefully — don't propose features that contradict settled decisions
- Think about the user's actual daily workflow as a tech manager. What would make their day easier?
- Don't add features just because they sound cool — every feature should solve a real problem
- Keep P0 (interactive prompts) vs P1 (automation) distinction in mind. Mark P1 features clearly.
- Cross-domain features (F30 Universal Done, F37 Link Manager, etc.) appear in multiple brainstorm files — consolidate them into cross-domain.md only, don't duplicate
- When you're done with ALL 10 files, do a final cross-domain review: are there gaps between domains? Features that reference something no domain provides?

Process the domains in this order (dependencies flow downward):
1. setup-and-config.md (foundation)
2. projects-and-tasks.md (core data structures)
3. people-management.md (core data structures)
4. email-and-messaging.md (data input)
5. meetings-and-calendar.md (data input)
6. daily-workflow.md (orchestration layer)
7. writing-and-drafts.md (output layer)
8. self-tracking.md (personal layer)
9. non-functional.md (system-wide rules)
10. cross-domain.md (integration — do this LAST after seeing all domains)

Write to each docs/features/*.md file as you go. After finishing all 10, write a brief summary of what you changed, added, and any open questions you have for me.

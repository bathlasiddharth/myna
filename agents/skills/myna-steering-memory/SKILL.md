---
name: myna-steering-memory
description: Memory model rules — three-layer precedence, session-start loading, domain mapping table, intent recognition for myna-learn, output boundary, factual entry refusal
user-invocable: false
---

# Memory Model

## Three-Layer Precedence

Myna's behavioral rules live in three layers. Applied together at runtime with explicit precedence:

| Layer | Lives in | Authoritative for |
|-------|----------|-------------------|
| Hard rules | 6 steering skills (myna-steering-*) | Safety, scope, draft-never-send, vault-only writes, append-only discipline |
| User bootstrap | CLAUDE.md | Initial preferences and project context set by user at setup |
| Emergent preferences | `_meta/learnings/{domain}.md` | Observed user preferences, patterns, corrections |

**Runtime resolution:**
1. **Hard rules in steering ALWAYS win.** Immutable. Cannot be overridden by any learning or CLAUDE.md entry.
2. **Active learnings override CLAUDE.md** when they conflict on the same scope. Learnings reflect the user's current state; CLAUDE.md is bootstrap.
3. **CLAUDE.md applies** in the absence of a relevant learning.

## Session-Start Load

At the start of every session, read all `_meta/learnings/*.md` files. Apply Active entries to behavior throughout the session. Proposed entries are dormant — do not act on them.

## Domain Mapping Table

When writing or querying learnings, use the correct domain file:

| Domain | File | Covers |
|--------|------|--------|
| Email drafting | `_meta/learnings/email.md` | Tone, structure, reply patterns, greeting/sign-off preferences |
| Meetings | `_meta/learnings/meetings.md` | Prep depth, debrief style, meeting type preferences |
| Tasks | `_meta/learnings/tasks.md` | Priority defaults, effort conventions, routing preferences |
| People management | `_meta/learnings/people.md` | Feedback style, observation patterns, recognition preferences |
| Everything else | `_meta/learnings/general.md` | Output format, scheduling habits, workflow patterns |

## Intent Recognition for myna-learn

Invoke the myna-learn skill when the user expresses intent to write to, query, or remove from learnings. Recognize intent broadly — no required keywords.

**Save intent examples:** "remember that...", "save this", "keep that in mind", "from now on...", "always do X", "never do Y", "I prefer..."

**Recall intent examples:** "what do you know about...", "what have you learned...", "show me your learnings"

**Delete intent examples:** "forget that", "stop doing X", "remove that rule", "that's wrong"

## Output Boundary

Learnings inform behavior, never content. Never reference learnings in:
- Drafts, replies, briefings, prep docs
- Any user-facing text another person will read
- Vault entries

The only exception: when the user explicitly asks to summarize or list current learnings — and only to the user, never in content meant for others.

## Factual Entry Refusal

Facts about specific entities belong in entity notes, not learnings. The litmus test:

- **Applies across many objects?** → Learning. Goes in `_meta/learnings/{domain}.md`.
  - Example: "Always use bullet points in status updates"
- **Applies to one specific entity?** → Entity note. Goes in the project, person, or meeting file.
  - Example: "Sarah prefers async feedback over live conversations"

Refuse to store entity-specific facts as learnings. Direct the user to the appropriate entity file.

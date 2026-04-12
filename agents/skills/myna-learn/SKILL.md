---
name: myna-learn
description: Manage Myna's emergent memory — save behavioral preferences (capture), scan session for patterns (reflect), remove wrong rules (delete), list current learnings. Invoked when user says "remember that", "from now on", "never do X", "forget that rule", "what have you learned", or similar. Does NOT write to CLAUDE.md — only to _meta/learnings/.
user-invocable: true
argument-hint: "remember that [preference] | forget that [rule] | what have you learned? | show my learnings | reflect"
---

# myna-learn

Manages Myna's emergent memory. Writes to `_meta/learnings/{domain}.md` only. Never touches `CLAUDE.md`.

## 📋 Before You Start

Learnings live at: `{vault}/{subfolder}/_meta/learnings/{domain}.md`

Domains: `email`, `meetings`, `tasks`, `people`, `general`

**Domain mapping** (per myna-steering-memory):

| Domain | File | Covers |
|--------|------|--------|
| Email drafting | `email.md` | Tone, structure, reply patterns, greeting/sign-off preferences |
| Meetings | `meetings.md` | Prep depth, debrief style, meeting type preferences |
| Tasks | `tasks.md` | Priority defaults, effort conventions, routing preferences |
| People management | `people.md` | Feedback style, observation patterns, recognition preferences |
| Everything else | `general.md` | Output format, scheduling habits, workflow patterns |

**Three-layer precedence (enforced at all times):**
1. Hard rules (steering) → always win. A learning can never override safety rules.
2. Active learnings → override CLAUDE.md for the same scope.
3. CLAUDE.md → applies when no relevant learning exists.

**Factual entry refusal:** If the user tries to save a fact about a specific entity ("remember that Sarah prefers async feedback"), redirect to the entity file. "That's Sarah-specific — it belongs in `People/sarah-chen.md` under Communication Preferences. Learnings are for patterns that apply across all interactions." Only save something as a learning if it applies broadly.

---

## 📁 Learnings File Format

```markdown
# Learnings — {Domain}

## Active

### {Sub-domain or general}
- {rule or observation}. [Marker] ({date or dates}, {evidence})

## Proposed

### {Sub-domain or general}
- {rule or observation}. [Inferred] ({date}, {evidence}) [obs: N]
```

**Active entries** take effect immediately. Applied at session start.

**Proposed entries** are dormant until:
- Observation count `[obs: N]` reaches 3 (across 3 separate reflection passes, not in-session occurrences), OR
- User explicitly confirms during a negotiate/promote step.

**Lazy file creation:** Create the domain file on first write if it doesn't exist. An empty domain file is not pre-populated.

---

## ✍️ Capture

**Trigger:** User says "remember that...", "from now on...", "always do X", "never do Y", "I prefer...", "keep that in mind" — or the main agent captures a clear in-session directive.

**How:**
1. Extract the preference from the user's statement.
2. Determine the domain from the content.
3. Check the factual entry rule: does this apply broadly (learning) or to one specific entity (entity note)? If entity-specific, redirect.
4. Write as an Active entry with `[User]` or `[Auto]` marker:
   - User said it explicitly → `[User]`
   - Main agent captured from a clear directive ("never bold text in slack messages" heard during a rewrite) → `[Auto]`

**Entry format:**
```
- {rule or observation}. [User] ({YYYY-MM-DD})
```

5. Create or update the domain file. Append under `## Active` → appropriate subsection.
6. Confirm: "Noted. I'll remember that {brief restatement}."

**Worked example:**

User: "Remember that I prefer bullet points over paragraphs in status updates."

1. Domain: `general.md` (output format — applies broadly).
2. Not entity-specific.
3. Append to `_meta/learnings/general.md`, `## Active` section:
   `- Prefer bullet points over paragraphs in status updates. [User] (2026-04-05)`
4. Confirm: "Noted. I'll use bullet points instead of paragraphs in status updates."

---

**Another example — clear directive captured mid-session:**

User says "make this more concise" during an email draft. The main agent notes this is a repeated preference.

Main agent invokes myna-learn with captured observation:
Domain: `email.md`. Entry: `- Keep email drafts concise — user asks to shorten regularly. [Auto] (2026-04-05)`

---

## 🔍 Reflect

**Trigger:** "reflect" — called internally by myna-wrap-up as its final step. Can also be triggered manually by the user.

**How:**
1. Review the session's conversation history for behavioral patterns — things the user corrected, preferences expressed, recurring friction points.
2. For each identified pattern:
   a. Check domain. Check factual entry rule.
   b. Check if this pattern already has an Active or Proposed entry.
   c. If it's a new observation → create a Proposed entry with `[Inferred]` marker and `[obs: 1]`.
   d. If it matches an existing Proposed entry → increment `[obs: N]` by 1.
   e. If a Proposed entry now has `[obs: 3]` → auto-promote to Active, remove `[obs: N]` suffix, change marker to `[Verified]`. Inform the user: "Promoting to Active: {rule}."
3. Report what was captured or promoted.

**One increment per reflection pass:** Even if a pattern appeared 5 times in this session, it counts as +1 for this pass. This prevents one bad day from auto-promoting a wrong rule.

**Proposed entry format:**
```
- {observation}. [Inferred] ({YYYY-MM-DD}, {evidence}) [obs: N]
```

**Auto-promotion:** When `obs: 3` is reached:
1. Move entry from `## Proposed` to `## Active`.
2. Change marker from `[Inferred]` to `[Verified]`.
3. Remove `[obs: N]` suffix.
4. Notify user: "Promoted to Active: '{rule}' — observed in 3 sessions."

**Worked example:**

myna-wrap-up calls reflect after session ends.

Conversation review reveals: user asked to shorten draft twice, once said "too long" about a status update.

Check `_meta/learnings/email.md` Proposed — no existing entry for conciseness.

Add to Proposed:
```
- Keep drafts concise; user consistently asks for shorter output. [Inferred] (2026-04-05, shortened 3 drafts this session) [obs: 1]
```

Report: "Reflection complete. 1 pattern added to Proposed: concise drafts preference."

---

## 🗑️ Delete

**Trigger:** "forget that", "remove that rule", "that's wrong", "stop doing X", "delete your learning about Y"

**How:**
1. Identify the target entry from the user's description. Use fuzzy matching against all entries in all domain files.
2. Show the matching entry and confirm: "Deleting: '{rule}' — is that the one?"
3. Wait for confirmation.
4. Remove the entry from the file. Use Edit to delete the exact line.
5. Confirm: "Removed. I'll stop applying that rule."

If the entry is in Proposed → just delete it; no behavioral change needed.
If the entry is in Active → delete it and note: "Removed from Active. This was affecting my behavior."

**Worked example:**

User: "Forget that rule about bullet points in status updates."

1. Grep `_meta/learnings/general.md` for "bullet" → find: `- Prefer bullet points over paragraphs in status updates. [User] (2026-04-05)`
2. Show and confirm: "Deleting: 'Prefer bullet points over paragraphs in status updates.' Is that right?"
3. User confirms.
4. Remove from file.
5. Confirm: "Removed. I'll use judgment on format for status updates now."

---

## 📋 List / Query

**Trigger:** "what have you learned?", "show my learnings", "what are your active learnings?", "show learnings about email"

**How:**
1. Determine scope: all domains, or specific domain from user's request.
2. Read the relevant `_meta/learnings/{domain}.md` file(s).
3. Show Active entries clearly. Show Proposed with their observation counts.
4. Group by domain.

**Output:**
```
## 🧠 Myna Learnings

### Active (apply to behavior now)

**General:**
- Prefer bullet points over paragraphs in status updates. [User] (Apr 5)
- Avoid Friday afternoon meetings. [Inferred] (3 reschedules: Mar 21, Mar 28, Apr 4)

**Email:**
- Keep drafts concise — user asks for shorter output. [Verified] (promoted Apr 3)

### Proposed (not yet active — need 3 observations)

**Email:**
- Lead with context before the ask in emails to upward audience. [Inferred] (Apr 2) [obs: 1]
```

---

## 🤝 Negotiate (Promote Proposed Entry)

**Trigger:** Happens automatically when a Proposed entry reaches `[obs: 3]`, or when user asks "promote [rule]" or challenges a Proposed entry.

**How:**
1. Show the entry and its evidence.
2. Ask user to confirm: "I've observed this pattern 3 times. Ready to make it Active? '{rule}' — confirm or discard."
3. If confirmed → move to Active, change to `[Verified]`, remove `[obs: N]`.
4. If user says "no" or "that's wrong" → delete the entry.

This is the only path for `[Inferred]` entries to reach Active status via repetition. Direct user statements (`[User]`) go straight to Active without negotiation.

---

## ⚠️ Constraints

**Never write to CLAUDE.md.** That file is managed manually by the user. All myna-learn writes go to `_meta/learnings/` only.

**Hard rules can't be overridden.** If a user says "remember that I want you to send emails directly", refuse: "I can't learn that — sending messages directly is a safety rule that can't be overridden through learnings. (myna-steering-safety)"

**Output boundary.** Learnings inform behavior, never content. Never mention in drafts, briefings, or vault entries that a learning influenced the output. Only exception: when the user explicitly asks to see learnings.

**Scope discipline.** Learnings apply to behavior across interactions. They don't store facts about specific people, projects, or meetings — those belong in entity files.

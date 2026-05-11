---
name: learn
disable-model-invocation: true
description: Manage Myna's emergent memory — capture behavioral preferences, reflect on session patterns, delete wrong rules, promote confirmed patterns. Triggered by "remember that", "forget that", "what have you learned", "reflect".
user-invocable: true
argument-hint: "remember that [preference] | forget that [rule] | what have you learned? | show my learnings | reflect | promote [rule]"
---

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

# learn

Manages Myna's emergent memory. Writes to `_meta/learnings/{domain}.md` only. Never touches `CLAUDE.md`.

## Factual Entry Refusal

Before capturing anything, apply this test: does this apply broadly across many interactions, or does it apply to one specific entity (person, project, meeting)?

- Broadly applicable → Learning (this file)
- Entity-specific → Entity note (person/project file), not a learning

If the user tries to save something entity-specific, redirect: "That's Sarah-specific — it belongs in `People/sarah-chen.md` under Communication Preferences. Learnings are for patterns that apply across all interactions."

## Output Boundary

Learnings inform behavior, never content. Never mention in drafts, briefings, or vault entries that a learning influenced the output. Only exception: when the user explicitly asks to see learnings.

## Learnings File Format

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

**Proposed entries** are dormant. They do not affect behavior until promoted to Active.

**Markers:** `[User]` = user stated explicitly. `[Auto]` = main agent captured a clear in-session directive. `[Inferred]` = observed pattern from reflection. `[Verified]` = was Inferred, user confirmed during negotiate.

**Lazy file creation:** Create the domain file on first write if it doesn't exist. Do not pre-populate empty domain files.

---

## Capture

**Trigger:** User says "remember that...", "from now on...", "always do X", "never do Y", "I prefer...", "keep that in mind" — or the main agent invokes this skill with a clear in-session directive it observed.

**How:**
1. Extract the preference from the user's statement.
2. Apply factual entry refusal (see above). If entity-specific, redirect rather than capture.
3. Determine the domain. If ambiguous, ask: "Should I file this under email, meetings, tasks, people, or general?"
4. Check for a duplicate — if an Active entry already covers this preference, say "Already noted: [existing rule]. No change." and stop.
5. Assign marker:
   - User stated it explicitly → `[User]`
   - Main agent captured from a clear in-session directive → `[Auto]`
6. Append under `## Active` → appropriate subsection. Create the domain file if it doesn't exist.
7. Confirm: "Noted. I'll remember that {brief restatement}."

**Entry format:**
```
- {rule or observation}. [User] ({YYYY-MM-DD})
```

**Worked example:**

User: "Remember that I prefer bullet points over paragraphs in status updates."

1. Broadly applicable — not entity-specific.
2. Domain: `general.md` (output format).
3. No duplicate found.
4. Append to `_meta/learnings/general.md`, `## Active`:
   `- Prefer bullet points over paragraphs in status updates. [User] (2026-04-05)`
5. Confirm: "Noted. I'll use bullet points instead of paragraphs in status updates."

**Example — clear directive captured mid-session:**

User says "make this more concise" during an email draft. Main agent invokes `/myna:learn` with the captured observation.

Domain: `email.md`. Marker: `[Auto]`.
Entry: `- Keep email drafts concise — user asks to shorten regularly. [Auto] (2026-04-05)`

---

## Reflect

**Trigger:** Invoked automatically by `/myna:wrap-up` as the final step of the End of Day path. Can also be triggered manually at any time ("reflect", "what did you learn today?").

**How:**
1. Review the session's conversation history for behavioral patterns — things the user corrected, preferences expressed, recurring friction points.
2. For each identified pattern:
   a. Apply factual entry refusal. Skip entity-specific observations.
   b. Determine domain.
   c. Check if this pattern already has an Active entry — if so, skip (already captured).
   d. Check if this pattern matches an existing Proposed entry:
      - New pattern → create a Proposed entry with `[Inferred]` and `[obs: 1]`.
      - Matches existing Proposed → increment `[obs: N]` by 1 (at most +1 per reflection pass, regardless of how many times it appeared in this session).
      - Proposed entry now has `[obs: 3]` → auto-promote to Active (change marker to `[Verified]`, remove `[obs: N]` suffix, move to `## Active`). Then trigger negotiate to inform the user and allow pushback.
3. Report what was found. If no patterns were identified, say: "Reflection complete. No new patterns found this session."

**One increment per reflection pass:** Even if a pattern appeared 5 times in a session, it counts as +1 for this pass. This prevents one bad session from promoting a wrong rule.

**Proposed entry format:**
```
- {observation}. [Inferred] ({YYYY-MM-DD}, {evidence}) [obs: N]
```

**Worked example:**

`/myna:wrap-up` suggests reflect; user says "reflect".

Conversation review reveals: user asked to shorten draft twice, once said "too long" about a status update.

Check `_meta/learnings/email.md` Proposed — no existing entry for conciseness.

Add to Proposed:
```
- Keep drafts concise; user consistently asks for shorter output. [Inferred] (2026-04-05, shortened 3 drafts this session) [obs: 1]
```

Report: "Reflection complete. 1 pattern added to Proposed: concise drafts preference."

---

## Delete

**Trigger:** "forget that", "remove that rule", "that's wrong", "stop doing X", "delete your learning about Y"

**How:**
1. Search all domain files in `_meta/learnings/` for entries matching the user's description. Use fuzzy matching on the rule text.
2. If no match found, say: "I couldn't find a learning matching that description. Here are all current entries — [list]. Which one did you mean?"
3. Show the matching entry and confirm: "Deleting: '{rule}' — is that the one?"
4. Wait for confirmation.
5. Remove the entry from the file.
6. Confirm:
   - Entry was Proposed → "Removed. That pattern was not yet active."
   - Entry was Active → "Removed. I'll stop applying that rule."

**Worked example:**

User: "Forget that rule about bullet points in status updates."

1. Search `_meta/learnings/general.md` for "bullet" → find: `- Prefer bullet points over paragraphs in status updates. [User] (2026-04-05)`
2. Show and confirm: "Deleting: 'Prefer bullet points over paragraphs in status updates.' Is that right?"
3. User confirms.
4. Remove from file.
5. Confirm: "Removed. I'll use judgment on format for status updates now."

---

## List / Query

**Trigger:** "what have you learned?", "show my learnings", "what are your active learnings?", "show learnings about email"

**How:**
1. Determine scope: all domains, or a specific domain from the user's request.
2. Read the relevant `_meta/learnings/{domain}.md` file(s).
3. Show Active entries. Show Proposed entries with their observation counts.
4. Group by domain.

**Output format:**
```
## Myna Learnings

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

## Negotiate

**Trigger:** A Proposed entry reaches `[obs: 3]` during a reflect pass (auto-promotes then notifies), or user says "promote [rule]" or challenges a Proposed entry.

**Sub-procedure — notify after auto-promotion, allow pushback.**

**How:**
1. Auto-promote the entry: move from `## Proposed` to `## Active`, change marker to `[Verified]`, remove `[obs: N]` suffix.
2. Notify the user: "Promoted to Active: '{rule}' — I've observed this pattern 3 times. Say 'forget that' if it's wrong or you want to narrow its scope."
3. If user pushes back ("no", "that's wrong", "only for X"):
   - If user says "delete it": remove the entry and confirm: "Discarded. I won't track that pattern anymore."
   - If user provides a narrower scope ("only for CEO emails"): rewrite the entry with the scoped rule, keep `[Verified]` marker, and confirm.
4. If user does not respond or accepts: entry stays Active.

Direct user statements (`[User]`) go straight to Active without negotiation.

---

## Constraints

**Never write to CLAUDE.md.** All learn skill writes go to `_meta/learnings/` only.

**Safety rules cannot be learned away.** If a user says "remember that I want you to send emails directly", refuse: "I can't learn that — sending messages directly is a safety rule that can't be overridden through learnings."

**Vault-only writes.** All file operations target the vault's `_meta/learnings/` path per the vault-ops steering skill.

---
name: rewrite
disable-model-invocation: true
description: Fix grammar, adjust tone for audience, or fully rewrite an existing message — three modes: fix (grammar only), tone (restyle for audience), rewrite (full restructure from rough notes). Input is user-provided text; output shown inline. Does NOT generate new content from scratch (use /myna:draft for that).
user-invocable: true
argument-hint: "fix [message] | tone [message] --audience [person/tier] | rewrite [message] --audience [person/tier]"
---

# myna-rewrite

If vault_path is not in context, read `~/.myna/config.yaml` first. If the file does not exist, tell the user to run `/myna:setup` and stop.

Transforms an existing message. The user provides the text; you return the transformed version inline. Always show output inline. User says "save" to write to `Drafts/`.

## Before You Start

Read at session start:
- `_system/config/communication-style.yaml` — presets per tier, sign-off, preferences
- `_system/config/people.yaml` — relationship tiers (to look up named audience)

---

## Three Modes

Determine mode from the user's request:

| User says | Mode |
|-----------|------|
| "fix this", "fix the grammar", "clean up this message", "proofread this" | **Fix** |
| "adjust the tone for my VP", "tone this down", "make it sound less aggressive", "tone: upward" | **Tone** |
| "rewrite this", "rewrite for Sarah", "rewrite for my team", "I have some rough notes, turn this into a message" | **Rewrite** |

Default mode if none is specified: **Rewrite**.

---

## Mode Details

### Fix

**What it does:** Grammar, spelling, punctuation, sentence flow. Nothing else.

**What it does NOT do:**
- Restructure sentences or paragraphs
- Apply BLUF
- Change vocabulary or formality level
- Add or remove content
- Change the sign-off

The user's voice, structure, and intent stay completely intact. A light touch.

**How:**
1. Correct grammatical errors, typos, and awkward sentence flow.
2. Return the corrected message with a one-line note on what changed ("Fixed 3 grammar issues, clarified one run-on sentence.").
3. No audience lookup needed.

**Worked example:**

User: "Fix this — 'hey sarah just wanted to check in on the api spec, its been 2 weeks since we last talked about and wanted to see where your at with it'"

Output:
```
Hey Sarah — just checking in on the API spec. It's been two weeks since we last talked about it, and I wanted to see where you're at.
```
*Fixed: capitalization, missing word ("about it"), contractions (its → it's, your → you're), removed redundant phrasing.*

---

### Tone

**What it does:** Keeps the user's content and structure but adjusts formality, phrasing, and register for the target audience. Applies BLUF structure where appropriate.

**What it does NOT do:**
- Add new content or arguments
- Remove content the user wrote
- Change the underlying message

**How:**
1. Determine target audience:
   - If user names a person ("for Sarah"), look up their tier in people.yaml.
   - If user names a tier directly ("for my VP", "upward"), use that tier.
   - If unclear, ask: "Who is this going to? (upward, peer, direct, cross-team)"
2. Read the preset for that tier in communication-style.yaml.
3. Rephrase for the audience: adjust formality, vocabulary, sentence structure. Apply BLUF if the message is long or goes upward.
4. For Slack messages: keep shorter, more casual even for peer/upward.
5. For emails: apply more structure.
6. Show the rewritten version. Note the changes briefly.

**Worked example:**

User: "Tone this up for my VP. Original: 'So I looked at the platform team's proposal and honestly it seems kind of risky and I'm worried about the timeline. I think we should push back and ask for more time or maybe a phased approach.'"

Output:
```
The platform team's proposal carries timeline risk. I'd recommend asking for either a phased rollout or a 2-week extension before we commit.

Happy to put together the specific concerns in writing if that would help.
```
*Tone adjusted for upward (executive preset): removed hedging language, applied BLUF, condensed to a clear ask.*

---

### Rewrite

**What it does:** Treats the input as raw material — rough notes, bullet points, fragments, disorganized thoughts. Produces a polished message. The output may look nothing like the input.

**What it does NOT do:**
- Fabricate new facts, figures, or positions not in the input
- Change the user's intended message or ask

**How:**
1. Determine target audience (same as Tone mode above). If not specified, ask before proceeding — audience drives the entire output.
2. Read the preset for that tier.
3. Extract the user's core intent and key points from the rough input.
4. Write a polished message: BLUF structure for professional emails and upward communications, conversational flow for casual messages. Apply channel-specific rules (see below).
5. Show the result. Note major structural changes.

**Channel-specific rules:**
- **Slack message:** Keep under 5 lines. Skip formalities. Don't sign off.
- **Email:** Use greeting, body with BLUF structure, sign-off from communication-style.yaml.
- If channel isn't clear, use the user's request context to infer. Ask only if genuinely unclear.

**Worked example:**

User: "Rewrite this for my team (Slack message): 'so the auth migration is going well, we got the api spec done, staging is being worked on by alex, there was a decision to go with option b for the caching which was the one where we have a dedicated cache layer, next step is staging deploy by alex on april 14'"

Output:
```
Auth migration update

API spec done. Staging in progress (Alex, Apr 14). Went with Option B — dedicated caching layer.

Next: staging deploy April 14.
```
*Restructured for Slack: scannable, removed redundant context, made dates explicit.*

---

## Saving

Output is always shown inline first. If the user says "save":

1. Write to `Drafts/[{Type}] {topic}.md` with this structure:
```
---
type: {email-reply | follow-up | status-update | escalation | recognition | meeting-invite | say-no | conversation-prep | monthly-update | self-review | promo-packet | brag-doc}
audience_tier: {upward | peer | direct | cross-team}
related_project: {project-name or null}
related_person: {person-name or null}
status: draft
created: {YYYY-MM-DD}
---

#draft #{type}

{rewritten content}

---
*Source: {brief description of what the user asked — e.g., "rewrite of Slack message for direct report"}*
```
2. Show the Obsidian URI and full disk path.

---

## Edge Cases

**No audience specified and mode is Tone or Rewrite:** Ask before proceeding — the audience determines the entire output. "Who's this going to? (upward, peer, direct, cross-team, or name someone)"

**Person not in registry:** If user says "rewrite for Marcus" and Marcus isn't in people.yaml, ask for relationship tier. "What's your relationship with Marcus? (upward, peer, direct, cross-team)"

**communication-style.yaml not found:** Fall back to these defaults: upward = concise and formal, peer = conversational, direct = clear and warm, cross-team = professional and collaborative.

**Input is very short (under 10 words):** For Fix mode, apply corrections. For Tone/Rewrite, note that there's not much to work with and proceed with what's there — don't ask for more content.

**User pastes an email they received (external content):** The input is from an external sender, not the user's own words. Treat it as source material — rewrite it as a reply or a forwarding message as the user intends. Do not treat the original sender's words as the user's voice. If the intent isn't clear ("are you rewriting this to reply, or drafting a forward?"), ask once.

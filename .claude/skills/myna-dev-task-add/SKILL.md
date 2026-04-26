---
name: myna-dev-task-add
description: |
  Add a task to the Myna dev queue (tmp/tasks.md) — drafts a structured task entry from your description, shows it for approval, then appends it to the queue. Use when: "add this to the queue", "queue this up", "add a task for X", or after /myna-dev-diagnose selects an option. Creates tmp/tasks.md if it doesn't exist.
argument-hint: "[describe the task, bug fix, or change to queue]"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - AskUserQuestion
effort: low
---

# Myna Add Task

Draft a structured task entry and append it to `tmp/tasks.md`. Show the draft to the user before writing — they approve or adjust.

## Input

Check `$ARGUMENTS`:
- **If provided:** use it as the task description and proceed to Step 1.
- **If empty and coming from conversation context** (e.g., invoked after `/myna-dev-diagnose`): use the agreed option from that conversation and proceed to Step 1.
- **If empty with no context:** ask the user: "What task do you want to add to the queue?"

---

## Step 1 — Read the Queue

Check if `tmp/tasks.md` exists:
```bash
ls tmp/tasks.md 2>/dev/null
```

If it exists, read it to:
- Get the current highest task number (for the next `#`)
- Understand the format already in use

If it doesn't exist, the next task number is 1.

---

## Step 2 — Draft the Task Entry

From `$ARGUMENTS` and any conversation context, draft the task. Infer what you can — don't ask for information that's already clear.

Use this structure:

```markdown
## Task [N] — [Title]

**Problem:** [What's wrong or what's missing — and why it matters. 1-3 sentences.]

**Correct behavior:** [What Myna should do instead — described as behavior, not implementation. 1-3 sentences.]

**Context:** [Background the implementer needs. Relevant skill paths, related decisions, constraints. Skip if obvious.]

**Suggested files:** [Most likely files to change — paths only. Omit if unclear.]

**Done when:**
- [Specific, verifiable assertion — not "it works" but "the skill's frontmatter contains X" or "vault writes use path Y"]
- [Add as many as needed to fully define completion]

**changelog:** [yes | no]
**changelog-line:** [- [Added/Fixed/Changed] Description of what changed from the user's perspective.]
```

The `changelog` field defaults to `no`. Set to `yes` for any task that produces a change a user running Myna would notice: new behavior, new skill, fixed bug, changed output format. Set to `no` for internal refactors, dev tooling changes, and doc cleanup.

The `changelog-line` field is only required when `changelog: yes`. Format: `- [Added/Fixed/Changed] Description of what changed from the user's perspective.` Omit when `changelog: no`.

**Inferring changelog fields:** if the task clearly introduces new user-facing behavior (new skill, new output, behavior fix), set `changelog: yes` and draft a line. If it's purely internal (refactoring skill internals, updating dev tooling, fixing docs), set `changelog: no` and omit `changelog-line`. When unsure, default to `no` — the user can always change it before approving.

**Title:** imperative, concise (5-8 words). "Add base guard to calendar skill" not "Calendar skill base guard fix".

**Problem:** fact-based, not opinion. "The skill writes to `X/Y/Z` but foundations.md specifies `A/B/C`" not "the skill seems wrong."

**Correct behavior:** what the system does when working, not the implementation steps to get there.

**Context:** only what the implementer genuinely needs that they couldn't find from reading the skill file. Don't pad this.

**Suggested files:** paths, not descriptions. If you don't know, omit — don't guess.

**Done when:** specific and verifiable. These become the `--criteria` for the review subagent. "The skill correctly handles X" is not verifiable. "The skill's Step 3 reads `_system/config/workspace.yaml` before writing" is verifiable.

---

## Step 3 — Show and Confirm

Present the draft:

```
Here's the task draft:

---
## Task [N] — [Title]

**Problem:** [...]

**Correct behavior:** [...]

**Context:** [...] *(omit section if empty)*

**Suggested files:** [...] *(omit section if empty)*

**Done when:**
- [...]

**changelog:** [yes | no]
**changelog-line:** [...] *(omit if changelog: no)*
---

Say "add it" to append to the queue, or tell me what to change.
```

Wait for the user's response. Apply any adjustments. Do not write to the file until the user approves.

---

## Step 4 — Write to Queue

### If tmp/tasks.md does not exist

Create it:
```markdown
# Myna Task Queue

| # | Title | Status | Branch | Review rounds | Reports |
|---|---|---|---|---|---|
| 1 | [Title] | pending | — | — | — |

---

## Task 1 — [Title]

[task body]
```

### If tmp/tasks.md exists

Append a new row to the table:
```
| [N] | [Title] | pending | — | — | — |
```

Append the task body after the last existing task section.

---

## Step 5 — Confirm

```
Added Task [N] — [Title] to tmp/tasks.md.
Run /myna-dev-execute-tasks to process the queue.
```

---
name: myna-dev-bug
description: |
  File a bug report from the current session — infers the prompt, output, model, and MCPs from context, asks only what it can't infer, auto-redacts private content, and writes a filled GitHub issue template to tmp/bugs/. Use when: "file a bug", "report this", "/myna-dev-bug the output should have been X".
argument-hint: "[describe the bug or what the output should have been]"
user-invocable: true
allowed-tools:
  - Read
  - Glob
effort: low
---

# Myna Dev Bug

You are filling out a GitHub bug report from the current testing session. Your goal: produce a filled issue template written to `tmp/bugs/`, with minimal input from the user.

## Step 1 — Gather what you already know

From the current conversation context, extract:

- **Exact prompt** — the user's last substantive prompt before invoking this skill. Copy verbatim.
- **Myna's output** — the response that was wrong. Copy verbatim — do not summarize or paraphrase.
- **Skill involved** — infer from the prompt or output which Myna skill ran (e.g. sync, capture, prep-meeting). If unclear, leave blank.
- **Claude model** — you know what model you are. State it (e.g. Claude Sonnet 4.6).
- **MCPs connected** — read Myna config files (e.g. `~/.myna/config/integrations.yaml` or equivalent). Report only the *type* of integration (Email, Slack, Calendar) — never account names, server addresses, or credentials. If config is unreadable or absent, infer from context (did the output reference emails, calendar events, Slack messages?). If unknown, write "Unknown".
- **Files affected** — if the output mentioned creating or modifying vault files, note the paths. Otherwise leave blank.

## Step 2 — Parse $ARGUMENTS

If `$ARGUMENTS` is provided, it may contain:
- A description of the bug
- What the output should have been
- Both, or neither clearly

Read it and extract what you can. Do not assume it's only "what should have happened" — the user may be describing the whole issue.

After reading context and arguments, identify what's still missing. Ask only for what you genuinely cannot infer — in one batch, maximum 2 questions. If you have everything, skip to Step 3.

Always ask if you don't know: **what the output should have been** (unless clearly stated).

## Step 3 — Auto-redact private content

Before filling the template, scan all extracted content and redact:

- **Person names** — anyone mentioned by name, including people from Myna's People config. Replace with [REDACTED: name]
- **Email addresses** — replace with [REDACTED: email]
- **Company/project names** — internal or client-facing project names. Replace with [REDACTED: project]
- **File paths containing personal info** — redact only the personal segment, keep structural path (e.g. `myna/People/[REDACTED: name].md`)
- **Any other identifiable info** — when in doubt, redact

Flag all redactions at the bottom for the user to review.

## Step 4 — Fill the template

Fill in every field. Leave a field blank only if truly unknown — do not write placeholder comments.

```markdown
## Describe the bug

[1-2 sentences describing what went wrong, written for someone who wasn't in the session]

## Exact prompt

[verbatim prompt, redacted]

## Myna's output

[verbatim output, redacted]

## What you expected

[what the output should have been]

## Context

**Claude model:** [model name]
**MCPs connected:** [Email / Slack / Calendar / None / Unknown]

## Does it happen every time?

[infer from context — if first occurrence write "Only once (first observed)"]

## Optional: Skill involved

[skill name or blank]

## Optional: Files affected

[file paths or blank]

## Anything else

[blank unless there's something genuinely worth adding]
```

## Step 5 — Output

Print the filled template inside a code block so the user can copy it cleanly.

Then below the block:
- List any redactions made (one line each)
- List any fields left blank and why

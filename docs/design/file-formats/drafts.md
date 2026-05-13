# Drafts

Generated drafts for emails, status updates, brag docs, and other outbound or personal-prep content. Load alongside `_conventions.md`.

---

## Draft File

**Path:** `Drafts/[{Type}] {topic}.md` — flat folder, type-prefixed filenames (e.g., `[Email] Reply to James.md`, `[Status] Auth Migration April.md`, `[Self] Q1 brag doc.md`)

**Type prefixes:** `Email`, `Meeting`, `Status`, `Escalation`, `Recognition`, `Self`, `Say-No`, `Conversation-Prep`

**Frontmatter:**
```yaml
---
type: email-reply | follow-up | status-update | escalation | recognition | meeting-invite | say-no | conversation-prep | monthly-update | self-review | promo-packet | brag-doc
audience_tier: upward | peer | direct | cross-team
related_project: {project-name or null}
related_person: {person-name or null}
created: {YYYY-MM-DD}
---
```

**Tag line:** `#draft #{type}`

**Body:** free-form draft content. Drafts are just files — the user deletes the file when done. No lifecycle state tracking.

```
{draft content}

---
*Source: {what prompted this draft}*
```

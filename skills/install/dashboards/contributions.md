---
dashboard: contributions
---
#dashboard

## Self Tracking & Contributions

> Contribution logs live at `Journal/contributions-{YYYY-MM-DD}.md` (Monday dates).
> Canonical frontmatter: `week_start`.

### Contribution Logs

```dataview
TABLE file.link AS "Week", week_start AS "Week Starting"
FROM "myna/Journal"
WHERE week_start AND contains(file.name, "contributions-")
SORT week_start DESC
LIMIT 12
```

### Pending Review (Uncertain Contributions)

> Items in `review-self.md` that need your judgment before logging.

```dataview
TASK
FROM "myna/ReviewQueue/review-self"
WHERE !completed
SORT file.mtime ASC
```

### Self-Review Drafts

```dataview
TABLE file.link AS "Draft", created AS "Created"
FROM "myna/Drafts"
WHERE contains(type, "self-review") OR contains(type, "promo-packet") OR contains(type, "brag-doc")
SORT created DESC
```

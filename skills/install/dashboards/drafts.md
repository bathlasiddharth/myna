---
dashboard: drafts
---
#dashboard

## Current Drafts

> Files in `Drafts/`. Use `[Type] Topic.md` naming convention.
> Delete the file when done — no lifecycle tracking in v1.

### All Drafts

```dataview
TABLE file.link AS "Draft", type AS "Type", audience_tier AS "Audience", created AS "Created"
FROM "myna/Drafts"
SORT created DESC
```

### By Type

```dataview
TABLE file.link AS "Draft", created AS "Created"
FROM "myna/Drafts"
GROUP BY type
SORT created DESC
```

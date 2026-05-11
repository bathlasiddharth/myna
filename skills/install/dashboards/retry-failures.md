---
dashboard: retry-failures
---
#dashboard

## Retry & Failures

> Failed operations create `[type:: retry]` tasks so they don't get lost.
> Review and re-run these manually.

### All Retry Tasks
```dataview
TASK
FROM "myna"
WHERE !completed AND type = "retry"
SORT due ASC
```

### Retry by File
```dataview
TASK
FROM "myna"
WHERE !completed AND type = "retry"
GROUP BY file.link
SORT file.mtime DESC
```

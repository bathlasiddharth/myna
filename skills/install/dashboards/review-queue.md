---
dashboard: review-queue
---
#dashboard

## Review Queue

> Items requiring your judgment before Myna acts. Check items in Obsidian, then say "process my queue".

### Work Queue (`review-work.md`)

> Ambiguous tasks, routing decisions, blockers.

```dataview
TASK
FROM "myna/ReviewQueue/review-work"
WHERE !completed
SORT file.mtime ASC
```

### People Queue (`review-people.md`)

> Ambiguous observations, recognition, person resolution.

```dataview
TASK
FROM "myna/ReviewQueue/review-people"
WHERE !completed
SORT file.mtime ASC
```

### Self Queue (`review-self.md`)

> Uncertain contribution candidates.

```dataview
TASK
FROM "myna/ReviewQueue/review-self"
WHERE !completed
SORT file.mtime ASC
```

### Triage Queue (`review-inbox.md`)

> Email folder recommendations. Process with `/myna:email-triage`.

```dataview
TASK
FROM "myna/ReviewQueue/review-inbox"
WHERE !completed
SORT file.mtime ASC
```

### Queue Summary

```dataview
TABLE file.link AS "Queue", length(filter(file.tasks, (t) => !t.completed)) AS "Pending Items"
FROM "myna/ReviewQueue"
WHERE !contains(file.name, "processed-")
SORT file.name ASC
```

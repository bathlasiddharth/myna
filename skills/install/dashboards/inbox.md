---
dashboard: inbox
---
#dashboard

## Inbox

### Reply Needed
```dataview
TASK
FROM "myna"
WHERE !completed AND type = "reply-needed"
SORT due ASC
```

### Delegations Waiting
```dataview
TASK
FROM "myna"
WHERE !completed AND type = "delegation"
SORT due ASC
```

### Review Queue

> Unchecked items in the review queue files requiring your judgment.

```dataview
TASK
FROM "myna/ReviewQueue"
WHERE !completed AND !contains(file.name, "processed-")
SORT file.name ASC
```

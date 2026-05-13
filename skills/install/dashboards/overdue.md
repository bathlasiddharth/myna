---
dashboard: overdue
---
#dashboard

## Overdue

### Tasks
```dataview
TASK
FROM "myna"
WHERE !completed AND due < date(today)
SORT due ASC
```

### By Project
```dataview
TASK
FROM "myna/Projects"
WHERE !completed AND due < date(today)
GROUP BY file.link
SORT due ASC
```

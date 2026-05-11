---
dashboard: blockers
---
#dashboard

## Active Blockers

> Blockers are written as `> [!warning] Blocker` callouts in project timelines.
> This dashboard surfaces dependency tasks and overdue tasks as proxy signals.
> Review project timeline sections for the full blocker callouts.

### Overdue Dependencies (External Blockers)
```dataview
TASK
FROM "myna"
WHERE !completed AND type = "dependency" AND due < date(today)
SORT due ASC
```

### All Open Dependencies
```dataview
TASK
FROM "myna"
WHERE !completed AND type = "dependency"
SORT due ASC
```

### Retry Tasks (Failed Operations)
```dataview
TASK
FROM "myna"
WHERE !completed AND type = "retry"
SORT due ASC
```

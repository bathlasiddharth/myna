---
dashboard: blockers
---
#dashboard

## Active Blockers

> Blockers are written as `> [!warning] Blocker` callouts in project timelines.
> This dashboard surfaces overdue tasks as proxy signals.
> Review project timeline sections for the full blocker callouts.

### Overdue Tasks (Potential Blockers)
```dataview
TASK
FROM "myna/Projects"
WHERE !completed AND due < date(today)
SORT due ASC
```

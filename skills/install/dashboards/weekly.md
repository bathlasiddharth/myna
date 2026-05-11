---
dashboard: weekly
---
#dashboard

## Weekly View

### This Week's Tasks

> Tasks due in the next 7 days (today through 7 days from now).

```dataview
TASK
FROM "myna"
WHERE !completed AND due >= date(today) AND due <= date(today) + dur(7 days)
SORT due ASC
```

### Completed Recently (Last 7 Days)

> Filtered by due date (Myna tasks don't record completion timestamps).

```dataview
TASK
FROM "myna"
WHERE completed AND due >= date(today) - dur(7 days)
SORT due DESC
```

### Weekly Notes

> Canonical weekly notes have `week_start` frontmatter. Filename pattern: YYYY-Wdd.md

```dataview
TABLE file.link AS "Week", week_start AS "Week Starting"
FROM "myna/Journal"
WHERE week_start
SORT week_start DESC
LIMIT 8
```

---
dashboard: this-week
---
#dashboard

## Due This Week

> AI summary: tasks due in the next 7 days, grouped by project. Excludes today and overdue items.

### By Project
```dataview
TASK
FROM "myna/Projects"
WHERE !completed AND due > date(today) AND due <= date(today) + dur(7 days)
GROUP BY file.link
SORT due ASC
```

### General
```dataview
TASK
FROM "myna"
WHERE !completed AND due > date(today) AND due <= date(today) + dur(7 days) AND !contains(file.path, "Projects/")
SORT due ASC
```

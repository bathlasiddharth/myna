---
dashboard: this-week
---
#dashboard

## Next 7 Days

> Tasks due in the next 7 days, grouped by project. Excludes today and overdue items.

### By Project
```dataview
TASK
FROM "myna/Projects"
WHERE !completed AND due > date(today) AND due <= date(today) + dur(7 days)
GROUP BY file.link
SORT due ASC
```

### General (non-project)
```dataview
TASK
FROM "myna"
WHERE !completed AND due > date(today) AND due <= date(today) + dur(7 days)
  AND !contains(file.path, "Projects/")
  AND !contains(file.path, "_system/")
  AND !contains(file.path, "_meta/")
SORT due ASC
```

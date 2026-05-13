---
dashboard: tasks
---
#dashboard

## Open Tasks

### Today
```dataview
TASK
FROM "myna"
WHERE !completed AND due = date(today)
SORT priority DESC
```

### Overdue
```dataview
TASK
FROM "myna"
WHERE !completed AND due < date(today)
SORT due ASC
```

### Upcoming (next 7 days)
```dataview
TASK
FROM "myna"
WHERE !completed AND due > date(today) AND due <= date(today) + dur(7 days)
SORT due ASC
```

## Needs Owner

Tasks with no assigned person (`person::` field missing). Each group shows the source file as a wikilink.

```dataview
TASK
FROM "myna"
WHERE !completed AND !person
GROUP BY file.link
SORT file.path ASC
```

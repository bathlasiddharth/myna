---
dashboard: 1on1s
---
#dashboard

## 1:1s

### All 1:1 Files

> One file per person. `person` field is a wiki-link to the person file.

```dataview
TABLE file.link AS "1:1 File", person AS "Person", file.mtime AS "Last Modified"
FROM "myna/Meetings/1-1s"
SORT file.mtime DESC
```

### Open Action Items from 1:1s

#### Assigned to me
```dataview
TASK
FROM "myna/Meetings/1-1s"
WHERE !completed AND type != "delegation"
SORT due ASC
```

#### Assigned to others (delegations)
```dataview
TASK
FROM "myna/Meetings/1-1s"
WHERE !completed AND type = "delegation"
SORT due ASC
```

### Overdue Action Items

#### Assigned to me
```dataview
TASK
FROM "myna/Meetings/1-1s"
WHERE !completed AND due < date(today) AND type != "delegation"
SORT due ASC
```

#### Assigned to others
```dataview
TASK
FROM "myna/Meetings/1-1s"
WHERE !completed AND due < date(today) AND type = "delegation"
SORT due ASC
```

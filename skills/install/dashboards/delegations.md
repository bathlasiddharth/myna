---
dashboard: delegations
---
#dashboard

## Delegations

### All Open
```dataview
TASK
FROM "myna"
WHERE !completed AND type = "delegation"
SORT due ASC
```

### Overdue
```dataview
TASK
FROM "myna"
WHERE !completed AND type = "delegation" AND due < date(today)
SORT due ASC
```

### By Person

> Groups by `person` inline field. Tasks using `[person:: [[Name]]]` appear grouped here.

```dataview
TASK
FROM "myna"
WHERE !completed AND type = "delegation"
GROUP BY person
SORT due ASC
```

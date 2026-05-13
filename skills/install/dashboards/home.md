---
dashboard: home
---
#dashboard

## Today

### Meetings Today

Today's meetings are shown in your daily note.

### Today's Tasks
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

### Active Blockers

> Blocker callouts are written as `> [!warning] Blocker` in project timelines. Review Projects/ files for active blockers.

## Review Queue

```dataview
TABLE file.link AS "Queue", length(filter(file.tasks, (t) => !t.completed)) AS "Pending"
FROM "myna/ReviewQueue"
WHERE !contains(file.name, "processed-")
SORT file.name ASC
```

## Current Drafts

```dataview
TABLE file.link AS "Draft", created AS "Created"
FROM "myna/Drafts"
SORT created DESC
```

## Recent Activity

```dataview
TABLE file.link AS "File", file.mtime AS "Modified"
FROM "myna"
WHERE !contains(file.path, "_system")
SORT file.mtime DESC
LIMIT 10
```

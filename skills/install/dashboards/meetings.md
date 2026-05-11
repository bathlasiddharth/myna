---
dashboard: meetings
---
#dashboard

## Meetings

### All Meeting Files

> 1:1 and recurring sessions are appended inside these files. File-level date is not canonical.

```dataview
TABLE file.link AS "Meeting", file.mtime AS "Last Modified"
FROM "myna/Meetings"
SORT file.mtime DESC
```

### 1:1 Files
```dataview
TABLE file.link AS "1:1", person AS "Person", file.mtime AS "Last Modified"
FROM "myna/Meetings/1-1s"
SORT file.mtime DESC
```

### Recurring
```dataview
TABLE file.link AS "Meeting", project AS "Project"
FROM "myna/Meetings/Recurring"
SORT file.name ASC
```

### Adhoc (Recent)
```dataview
TABLE file.link AS "Meeting", file.mtime AS "Date"
FROM "myna/Meetings/Adhoc"
SORT file.mtime DESC
LIMIT 20
```

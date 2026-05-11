---
dashboard: people
---
#dashboard

## People

### All People

> Person files. Relationship, role, and team live in the file body and people.yaml — not frontmatter.

```dataview
TABLE file.link AS "Person", file.mtime AS "Last Updated"
FROM "myna/People"
SORT file.name ASC
```

### Open Items by Person

> Tasks written inside People/ files, grouped by person file.

```dataview
TASK
FROM "myna/People"
WHERE !completed
GROUP BY file.link
```


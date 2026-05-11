---
dashboard: projects
---
#dashboard

## Projects

### All Projects

> Project status lives in the `## Overview` body section, not frontmatter.
> Use this list and open each file to check status.

```dataview
TABLE file.link AS "Project", file.mtime AS "Last Updated"
FROM "myna/Projects"
SORT file.mtime DESC
```

### Open Tasks by Project
```dataview
TASK
FROM "myna/Projects"
WHERE !completed
GROUP BY file.link
SORT due ASC
```

### Overdue Tasks
```dataview
TASK
FROM "myna/Projects"
WHERE !completed AND due < date(today)
SORT due ASC
```

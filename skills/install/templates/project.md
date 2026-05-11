---
created: {{date}}
---

#project #{{project-tag}}

## Overview

**Description:** {{description}}
**Status:** active
**Key People:** {{key-people}}

## Timeline

> Append-only chronological log. Sorted by event date, not processing date.

- [{YYYY-MM-DD}] {content} [{provenance}] ({source-detail})

## Open Tasks

```dataview
TASK
FROM "myna/Projects/{{slug}}"
WHERE !completed
SORT priority DESC, due ASC
```

## Links

- [{title}]({url}) — {description} [{YYYY-MM-DD}]

## Notes

> Free-form scratchpad. Every entry auto-dated with source.

- [{YYYY-MM-DD}] {thought or note}

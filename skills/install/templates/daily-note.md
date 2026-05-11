---
date: {{date}}
---

#daily

## Morning Focus

> User-editable. Sync never overwrites this section.

## Sync — {{time}}

### Capacity Check

{{available focus hours}} focus time vs {{task effort hours}} task effort.

### Immediate Attention

> Auto-generated, user-editable throughout the day.

- {overdue tasks}
- {overdue delegations}
- {approaching deadlines}
- {blockers}

### Open Tasks

```dataview
TASK
FROM "myna"
WHERE !completed AND (due <= date(today) OR !due)
SORT priority DESC
LIMIT 20
```

### Delegations

```dataview
TASK
FROM "myna"
WHERE !completed AND type = "delegation"
SORT due ASC
```

### Review Queue

{count} items pending.

### Milestones

> Upcoming birthdays, anniversaries (if enabled).

### Today's Meetings

- [ ] {HH:MM} [[{meeting-file}]] — {meeting name}

## End of Day — {{time}}

> Written by wrap-up skill.

### Planned vs Actual

- Completed: {list}
- Not started: {list}
- Partially done: {list}

### Contributions Detected

- {contribution} [{provenance}]

### Carried to Tomorrow

- {unfinished items moved to next day's note}

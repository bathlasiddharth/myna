---
dashboard: true
---

#dashboard

## Immediate Attention

```dataview
TASK FROM "myna" WHERE !completed AND priority = "high" SORT due ASC
```

## Today's Tasks

```dataview
TASK FROM "myna" WHERE !completed AND (due <= date(today) OR !due) SORT priority DESC LIMIT 30
```

## Review Queue

- [[review-work]]
- [[review-people]]
- [[review-self]]
- [[review-triage]]

## Active Projects

- [[atlas-migration]] — active, on track
- [[phoenix-platform]] — active, BLOCKED on validator
- [[bridge-integration]] — active
- [[helix-research]] — active spike
- [[aurora-dashboard]] — active, Nate leading
- [[sentinel-security]] — active

## People — Upcoming 1:1s

- Sarah Carter — last 1:1 Apr 1, next TBD
- Marcus Walker — last 1:1 Apr 10, next Apr 17
- Rachel Davis — last 1:1 Feb 15 ⚠ 8 weeks
- Nate Brooks — last 1:1 Apr 8, next Apr 15
- Laura Hayes — last 1:1 Apr 3, next Apr 17

## Current Drafts

- [[Drafts/[Email] Reply to James]]
- [[Drafts/[Email] Reply to vendor]]
- [[Drafts/[Status] Atlas Migration April]]
- [[Drafts/[Recognition] Sarah Carter]]
- [[Drafts/[Escalation] Phoenix Validator Blocker]]
- [[Drafts/[Meeting] Follow-up Bridge Integration]]
- [[Drafts/[Self] Q1 brag doc]]
- [[Drafts/[Pre-Read] Atlas Caching RFC]]

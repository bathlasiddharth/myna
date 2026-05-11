---
created: 2025-08-20
aliases: ["Compass v1"]
---

#project #compass

## Overview

**Description:** Customer onboarding rewrite — shipped March 2026
**Status:** complete
**Key People:** [[sarah-carter]], [[rachel-davis]]

## Timeline

> Append-only chronological log. Sorted by event date, not processing date.

- [2025-08-20] Project kickoff — Sarah and Rachel co-owners [User]
- [2025-09-12] Sarah proposed single-page client architecture — accepted by the team [User]
- [2025-10-14] Rachel architected the onboarding state machine — became the core of v1 [User]
- [2025-11-15] Architecture sign-off complete [User]

> [!info] Decision
> [2025-11-28] Go with incremental rollout over a hard cutover — Rachel's recommendation after the retrospective analysis [User]

- [2025-12-18] Compass v1 launch readiness review complete — David praised Sarah's checklist [Auto] (email, David)
- [2026-01-20] Approved final UX flow [User]
- [2026-02-08] Incremental rollout started — 10% of new customers [User]
- [2026-02-12] Compass v1 shipped on schedule, zero rollbacks [Auto] (email, James)

> [!info] Decision
> [2026-02-12] Project marked complete. Maintenance handed to the support engineering rotation. [User]

- [2026-02-15] Rachel led the Compass v1 retrospective and produced the launch playbook [User]
- [2026-02-28] Rollout to 100% — no incidents [User]
- [2026-03-01] Status changed to complete [User]

> [!tip] Recognition
> [2026-02-12] Sarah Carter and Rachel Davis for shipping Compass v1 on time and without rollback [Auto] (email, James)

## Open Tasks

```dataview
TASK
FROM "myna/Projects/compass-v1"
WHERE !completed
SORT priority DESC, due ASC
```

## Links

- [Compass v1 launch playbook](https://docs.acme.io/compass/playbook) — written by Rachel post-launch, adopted by 3 other teams [2026-02-15]
- [Compass v1 architecture](https://docs.acme.io/compass/arch-v1) — single-page client design [2025-11-15]
- [Compass retro notes](https://docs.acme.io/compass/retro-2026-02) — retrospective notes [2026-02-15]

## Notes

> Free-form scratchpad. Every entry auto-dated with source.

- [2026-02-15] The launch playbook is now being adopted by other teams — worth highlighting in Rachel's next review
- [2026-03-01] Compass was a model launch. Use this as the template for Atlas migration.

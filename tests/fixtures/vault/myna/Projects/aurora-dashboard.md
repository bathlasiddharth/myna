---
created: 2026-01-20
aliases: ["Aurora Dashboard"]
---

#project #aurora-dashboard

## Overview

**Description:** Internal analytics dashboard for engineering leadership
**Status:** active
**Key People:** [[nate-brooks]], [[laura-hayes]]
**Notes:** Nate's first lead project — small scope, high learning value

## Timeline

> Append-only chronological log. Sorted by event date, not processing date.

- [2026-01-20] Project created — Nate assigned as first lead [User]
- [2026-02-04] Nate to own scope, reviewers, timeline — first real lead role [User]
- [2026-02-18] First tile shipped — PR count by team [Auto] (slack, #aurora-dashboard)
- [2026-03-03] Nate completed the dashboard skeleton — header, nav, placeholder tiles [Auto] (slack, #aurora-dashboard)
- [2026-03-11] Aurora filter refactor landed — 600 lines of tangled logic cleaned up [Auto] (slack, #aurora-dashboard)

> [!tip] Recognition
> [2026-03-11] Nate Brooks for the clean filter refactor — thoughtful tests, readable code [Auto] (slack, #aurora-dashboard)

- [2026-03-25] Nate is officially leading the project — scope locked, timeline agreed [User]
- [2026-04-02] Laura's team-velocity tile integrated — cross-team collaboration [Auto] (slack, #aurora-dashboard)
- [2026-04-06] David Clark previewed the dashboard — positive feedback, two scope requests added [Auto] (slack, #aurora-dashboard)
- [2026-04-08] Nate brought written Aurora status doc to 1:1 — clean format [User]

## Open Tasks

- [ ] Nate to implement the incidents-by-severity tile 📅 2026-04-17 [project:: [[Aurora Dashboard]]] [type:: task] [person:: [[Nate Brooks]]] [Auto] (slack, #aurora-dashboard, 2026-04-06)
- [ ] Nate to add David Clark's scope requests to the backlog 📅 2026-04-14 [project:: [[Aurora Dashboard]]] [type:: task] [person:: [[Nate Brooks]]] [User]
- [ ] Review Aurora dashboard before Platform all-hands demo 📅 2026-04-23 [project:: [[Aurora Dashboard]]] [type:: task] [User]
- [ ] Laura to wire the second velocity tile 📅 2026-04-21 [project:: [[Aurora Dashboard]]] [type:: task] [person:: [[Laura Hayes]]] [User]

```dataview
TASK
FROM "myna/Projects/aurora-dashboard"
WHERE !completed
SORT priority DESC, due ASC
```

## Links

- [Aurora Dashboard wireframes](https://docs.acme.io/aurora/wireframes) — [2026-02-04]
- [Aurora repo](https://github.com/acme/aurora-dashboard) — [2026-02-10]

## Notes

> Free-form scratchpad. Every entry auto-dated with source.

- [2026-02-04] Aurora is the right project for Nate's first lead role — small scope, clear users, low criticality if it slips
- [2026-04-06] David Clark's scope requests are reasonable — but watch that we don't let Nate's first lead project turn into a leadership dashboard race

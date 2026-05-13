---
created: 2026-03-18
aliases: ["Sentinel Security"]
---

#project #sentinel-security

## Overview

**Description:** Q2 security hardening pass across Platform services
**Status:** active
**Key People:** [[chris-wilson]], [[sarah-carter]]
**Scope:** Q2 2026, focus on Platform-owned services and Atlas Migration security posture

## Timeline

> Append-only chronological log. Sorted by event date, not processing date.

- [2026-01-12] Chris wrote the Q1 security hardening proposal that seeded this project [User]
- [2026-02-26] Project scoped at Q1 planning — proposal accepted as Sentinel, budgeted for Q2 [User]
- [2026-03-12] March 12 incident reinforced the need — Chris used the postmortem to push for faster hardening timeline [User]
- [2026-03-18] Project officially created in the registry [User]
- [2026-04-04] Kickoff meeting with Chris and Sarah — Sarah proposed a phased approach [User]

> [!info] Decision
> [2026-04-04] Adopt Sarah's phased approach: (1) audit and triage, (2) quick wins, (3) structural changes. Chris accepted over his original "all at once" plan. [User]

- [2026-04-08] Chris started the service-level audit [Auto] (slack, #sentinel-security)

## Open Tasks

- [ ] Chris to complete phase 1 audit and triage report 📅 2026-04-24 [project:: [[Sentinel Security]]] [type:: task] [person:: [[Chris Wilson]]] [User]
- [ ] Schedule Sentinel phase 2 scoping meeting 📅 2026-04-18 [project:: [[Sentinel Security]]] [type:: task] [User]
- [ ] Review Chris's Q1 hardening proposal in context of March 12 postmortem 📅 2026-04-15 [project:: [[Sentinel Security]]] [type:: task] [User]

```dataview
TASK
FROM "myna/Projects/sentinel-security"
WHERE !completed
SORT priority DESC, due ASC
```

## Links

- [Q1 Hardening Proposal](https://docs.acme.io/security/q1-hardening-proposal) — Chris's seeding doc [2026-01-12]
- [Sentinel Phase 1 audit template](https://docs.acme.io/sentinel/phase-1-template) — [2026-04-04]

## Notes

> Free-form scratchpad. Every entry auto-dated with source.

- [2026-04-04] Chris accepting Sarah's phased approach over his own is a big deal — he's usually territorial on security
- [2026-04-08] Sentinel + Atlas overlap more than I thought — Chris's audit will find things Atlas should already be fixing

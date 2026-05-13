---
created: 2025-11-20
aliases: ["Phoenix Platform"]
---

#project #phoenix-platform

## Overview

**Description:** New internal data platform — ingestion, query layer, and downstream analytics
**Status:** active
**Key People:** [[marcus-walker]], [[alex-thompson]]
**Current risk:** BLOCKED on infra team validator upgrade — 18 days as of 2026-04-09

## Timeline

> Append-only chronological log. Sorted by event date, not processing date.

- [2025-11-20] Project seeded at eng leads sync — Platform is sponsoring, Infrastructure consulting [User]
- [2025-12-08] Scope cut: defer query optimization, focus v1 on ingestion + basic query [User]
- [2026-01-07] Alex walked the team through the initial data model — Marcus assigned ingestion ownership [User]
- [2026-01-22] First ingestion prototype walking skeleton landed [Auto] (slack, #phoenix-eng)
- [2026-02-01] Status changed to active, resources allocated [User]
- [2026-02-14] Scope re-cut: defer query optimization to v2, narrow v1 to ingestion path [User]
- [2026-02-28] Marcus shipped first ingestion prototype — handles batch only, streaming deferred [Auto] (slack, #phoenix-eng)
- [2026-03-05] Marcus flagged schema validator service is failing under load — first signal of the dependency problem [Auto] (slack, #phoenix-eng)
- [2026-03-12] Infra team's validator service is failing under load — needs an upgrade [Auto] (email, Marcus)
- [2026-03-18] First ping to infra team — no response [Auto] (slack, #phoenix-eng)
- [2026-03-22] Second ping to infra team — acknowledgement but no timeline [Auto] (slack, #phoenix-eng)

> [!warning] Blocker
> [2026-03-25] Schema validation dependency blocked on infra team — they need to upgrade the validator service. ETA unknown, no owner assigned. [Auto] (meeting, Platform Weekly)

- [2026-03-25] Marcus three commitments slipped — discussed workload, agreed to cut Phoenix scope to ingestion path only [User]
- [2026-03-30] Third ping to infra team — no response [Auto] (slack, #phoenix-eng)
- [2026-04-01] Agreed to escalate if no movement by April 8 [User]
- [2026-04-02] Still no movement on infra team validator upgrade — Alex backed Marcus on keeping the scope [Auto] (slack, #phoenix-eng)

> [!warning] Blocker
> [2026-04-05] 14 days waiting on infra team. Marcus blocked from making progress on the ingestion path. Needs escalation. [Auto] (slack, #phoenix-eng)

- [2026-04-07] Marcus and Alex met with Sam — agreed Marcus starts a fallback design that doesn't depend on the validator [User]

> [!info] Decision
> [2026-04-07] Marcus to author a fallback ingestion design using a stub validator (schema-shape only, no semantic validation) — gives the team forward motion while the blocker is escalated [User]

- [2026-04-08] Marcus started the fallback design work [Auto] (slack, #phoenix-eng)
- [2026-04-10] Marcus brought the written fallback design to the 1:1 — clean structure, realistic estimates [User]

> [!warning] Blocker
> [2026-04-10] 20 days waiting on infra team. Fallback design in progress but the full validator is still needed for v1 launch. [Auto] (slack, #phoenix-eng)

## Open Tasks

- [ ] Escalate validator blocker to infra team lead (via James if needed) 📅 2026-04-13 ⏫ [project:: [[Phoenix Platform]]] [type:: task] [Auto] (slack, #phoenix-eng, 2026-04-05)
- [ ] Marcus to finalize fallback ingestion design doc 📅 2026-04-14 [project:: [[Phoenix Platform]]] [type:: task] [person:: [[Marcus Walker]]] [Auto] (meeting, 1:1 with Marcus, 2026-04-10)
- [ ] Waiting on infra team to upgrade validator service 📅 2026-04-08 [project:: [[Phoenix Platform]]] [type:: task] [Auto] (slack, #phoenix-eng, 2026-03-25)
- [ ] Write up Phoenix v1 risk note for VP review 📅 2026-04-17 🔼 [project:: [[Phoenix Platform]]] [type:: task] [User]
- [ ] Plan coverage for Marcus parental leave (starts May 18) 📅 2026-04-25 ⏫ [project:: [[Phoenix Platform]]] [type:: task] [User]
- [ ] Marcus to document the ingestion prototype for handoff 📅 2026-05-10 [project:: [[Phoenix Platform]]] [type:: task] [person:: [[Marcus Walker]]] [User]

```dataview
TASK
FROM "myna/Projects/phoenix-platform"
WHERE !completed
SORT priority DESC, due ASC
```

## Links

- [Phoenix Architecture Doc](https://docs.acme.io/phoenix/arch) — initial design [2026-02-01]
- [Phoenix Scope v1](https://docs.acme.io/phoenix/scope-v1) — scope after the v2 cut [2026-02-14]
- [Fallback Ingestion Design (draft)](https://docs.acme.io/phoenix/fallback-ingestion) — Marcus's draft [2026-04-10]

## Notes

> Free-form scratchpad. Every entry auto-dated with source.

- [2026-03-25] Marcus seems stretched. Need to talk about scope, not just deadlines. Parental leave planning is adding pressure.
- [2026-04-05] Have not heard back from infra team. Second escalation may need to go through James.
- [2026-04-08] Marcus hit a wall in the blocker review meeting — went quiet during the scope cut discussion. Worth a gentle conversation in 1:1.
- [2026-04-10] With Marcus out for 12 weeks starting May 18, Phoenix v1 launch will slip unless we grow coverage now. Options: pull Nate in as co-owner, or defer v1 launch to Q3.

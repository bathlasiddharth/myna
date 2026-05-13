---
created: 2026-04-02
aliases: ["Helix Research"]
---

#project #helix-research

## Overview

**Description:** Exploratory spike on vector search for the recommendation pipeline
**Status:** active
**Key People:** [[laura-hayes]]
**Timeline:** Spike, not a delivery project — 4 week evaluation window

## Timeline

> Append-only chronological log. Sorted by event date, not processing date.

- [2026-03-18] Laura shared initial vendor landscape survey — 5 candidates [Auto] (slack, #helix-research)
- [2026-04-02] Spike officially kicked off — Laura assigned to evaluate vector DB options [User]
- [2026-04-03] Diego's replacement at VectorVendor — Jake — sent benchmark spreadsheet and integration guide [Auto] (email, Jake)
- [2026-04-03] Laura walked through evaluation criteria; Jake presented VectorVendor; first candid conversation about vendor limitations [User]
- [2026-04-07] Jake started pushing for a pricing call — vendor sales cycle pressure [Auto] (email, Jake)

## Open Tasks

- [ ] Laura to evaluate VectorVendor against FAISS and Qdrant 📅 2026-04-24 [project:: [[Helix Research]]] [type:: task] [person:: [[Laura Hayes]]] [User]
- [ ] Get VectorVendor sandbox with Acme-scale data 📅 2026-04-15 [project:: [[Helix Research]]] [type:: task] [person:: [[Laura Hayes]]] [Auto] (slack, #helix-research, 2026-04-07)
- [ ] Draft evaluation criteria doc for the spike 📅 2026-04-11 [project:: [[Helix Research]]] [type:: task] [person:: [[Laura Hayes]]] [User]

```dataview
TASK
FROM "myna/Projects/helix-research"
WHERE !completed
SORT priority DESC, due ASC
```

## Links

- [VectorVendor benchmark spreadsheet](https://docs.acme.io/helix/vectorvendor-benchmarks) — from Jake [2026-04-03]
- [Vendor landscape survey](https://docs.acme.io/helix/landscape-survey) — Laura's initial comparison [2026-03-18]

## Notes

> Free-form scratchpad. Every entry auto-dated with source.

- [2026-04-03] Laura asked the sharpest questions of the kickoff — this is her first time being the senior engineer in the room, and it showed
- [2026-04-07] Jake Anderson (VectorVendor) is pushing hard on pricing — want to slow that down until Laura is confident in the technical eval

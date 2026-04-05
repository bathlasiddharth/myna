# Phase 8 — Ship

Operational guide for Phase 8. Read at the start of any P8 task. See `docs/roadmap.md` Phase 8 section and decisions D036, D037.

---

## What Phase 8 is

The final phase of the build pipeline. Produces a public v1.0 release. After Phase 8 completes, the pipeline is DONE — post-ship activities (user acceptance testing, bug fixes from real usage, open-source contribution model, multi-tool install support) are the user's responsibility outside the pipeline.

**In scope:**
- README polish (public-facing)
- Setup guide (using the Phase 6 Kiro CLI install script as the entry point)
- Final consistency pass on public-facing artifacts
- v1.0 release tag
- Release notes
- Declare done

**Out of scope:**
- Open-source contribution model (deferred post-launch per D036)
- User acceptance testing (post-ship, per D037)
- Bug fixing from real-world use (post-ship)
- Automated testing infrastructure (deferred post-launch per D033)
- Install support for AI tools other than Kiro CLI (post-launch per D035)

## Why Phase 8 matters

Phase 8 is the last chance to make Myna's public face match its internals. Anything unclear at ship is unclear to every future user until someone goes back to fix it. Phase 8 is also the moment where "done" becomes a real commitment — after this phase, the pipeline stops and the user takes over for real-world testing.

Per D037, **done = Phase 8 complete.** User says "done" here. Then the user does their own testing, finds bugs, fixes them — all post-ship.

## Context files to read

1. `docs/vision.md`
2. `docs/foundations.md` and `docs/architecture.md`
3. All built agents from Phase 5 (the runtime content being released)
4. The Phase 6 install script and its documentation
5. The Phase 7 manual testing plan
6. `docs/decisions.md` — especially D033, D036, D037
7. `docs/roadmap.md` — Phase 8 tasks

## Phase-specific rules

1. **Two audiences, named.** README and setup guide are for end users installing Myna. The methodology artifacts (foundations, architecture, build-agent.md, decisions) are for future users applying the playbook to a different agentic assistant. Don't conflate them in the public-facing docs.
2. **Nothing stale ships.** Every doc current as of Phase 8. No TBDs, no placeholders, no references to incomplete work. No forward pointers to things that don't exist yet.
3. **Don't add new features at ship time.** Any feature gap discovered at Phase 8 is either a late Phase 5 fix or a post-launch item. Ship isn't the time to build.
4. **Open-source is not in scope.** D036 is explicit. No CONTRIBUTING.md, no contributor onboarding docs, no GitHub issue templates. That's all post-launch work.
5. **Done means done.** When Phase 8 completes, the pipeline stops. Don't slide into post-ship activities inside this phase.

## Tasks

### P8-T01 — README polish

Public-facing summary: what Myna is, who it's for, how to install, basic usage. Pointer to the setup guide. Must be readable by someone who has never seen the project.

### P8-T02 — Setup guide

Walks the user through install (Phase 6 script), first-run setup, and basic use. Includes troubleshooting for common Kiro CLI-specific install issues discovered during Phase 6 testing.

### P8-T03 — Final consistency pass

Fresh-eye read of all public-facing docs. Fix anything stale, unclear, or inconsistent. Verify every link resolves.

### P8-T04 — v1.0 release tag and notes

Tag v1.0. Write release notes summarizing:
- What Myna delivers (agent-based assistant for Kiro CLI)
- Feature coverage (the domains shipped)
- Known limitations (single AI tool, manual testing only, no automation)
- Where the methodology lives (the other first-class output)

### P8-T05 — Declare done

Update roadmap to mark all phases complete. User says "done." Pipeline concludes. Post-ship activities begin in a separate working context.

## End-of-session discipline

- Public docs are current and polished
- Release tag applied
- Roadmap shows all phases done
- Post-ship work (testing, fixes, open-source) is understood to be user-driven outside this pipeline

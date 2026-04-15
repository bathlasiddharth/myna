# How Myna Was Built

Myna is a privacy-first AI Chief of Staff for Engineering Managers, Tech Leads, and other leaders who manage multiple projects and communication channels. It works within your company's approved tools and never acts without your approval. It was also built by one person, with no team, no sprints, no standups. I defined the vision, described the features, and settled key decisions. Everything else: the main agent, 24 feature skills, 6 steering skills, the install script, vault templates, dashboards, and this documentation were written by Claude.

Two models shared the work. Claude Opus 4.6 handled architecture, design decisions, and complex multi-file tasks where deeper reasoning mattered. Claude Sonnet 4.6 handled implementation, iteration, and the bulk of the build. Claude ran autonomously for most of it, with roughly a week of my part-time effort across the whole project. Two things came out of this, not one: the assistant itself, and the methodology Claude and I used to build it — the pipeline, the build recipe, the design patterns, the lessons — so that someone else could follow the same process to build a different agentic assistant entirely.

*The system prompt is the system. Claude built a system that Claude then runs. That fact is either obvious or strange depending on how long you think about it.*

## The Problem

When you're managing a team, the work splits in two. There's the actual work: technical decisions, roadmap, shipping. And then there's the information layer around it. Meeting notes that need action items extracted. People updates scattered across Slack threads, 1:1s, and emails. Status updates that take 20 minutes to write because you're pulling context from five different places.

**The information layer doesn't feel like real work. But when it slips, things slip with it.**

The tools that exist don't help much. Note-taking apps are too passive: you put things in, nothing comes out. Project management software is too heavy for how managers actually work day to day. AI chat helps with individual tasks but forgets everything the moment the conversation ends.

Myna handles the information layer. Privacy-first, works within your company's approved tools, and never acts without your approval. Drafts but never sends. Organizes but never decides. Surfaces but never hides.

## What We Were Actually Building

The first real clarity came when I stopped thinking about Myna as an application. There is no server, no API, no frontend. What Claude and I were building was agent instructions and a vault structure. The AI model the user already has is the runtime.

That framing changed how every decision got made. You are not building features in the traditional sense. You are writing instructions for a capable model, defining where information lives, and specifying the rules it follows. The deliverable is structured knowledge, not code.

It also meant Myna would work inside whatever AI tool a user already had approved at their company, with no new infrastructure to install or trust.

## Feature Discovery with Claude

With the vision clear, the next step was figuring out what to actually build. Instead of writing features myself, I used Claude to drive the discovery. I described the problem space, set the bar at minimum lovable product, and had Claude propose the feature set across seven domains: email, Slack, meetings, projects, tasks, people, and self-tracking.

The approach that worked best was asking Claude to think from specific personas. What does a Software Development Manager actually need on a Tuesday? What does a Product Manager feel the most friction with day to day? That exercise surfaced things a generalist review would have missed. Delegation tracking was already in the list, but the SDM perspective added the proactive nudge: warn me when something is overdue. Without that, the tracker is just a list nobody checks.

The most important session was an accuracy audit. Any feature that required Myna to infer things about people got examined carefully. One feature, engagement signal detection, was supposed to flag signs that a team member might be disengaged. I killed it. Myna only has the user's notes, not objective data. **A wrong inference about a person is worse than no inference.** It became attention gap detection instead: surfacing where your own attention has dropped. "You haven't logged feedback for this person in 52 days" is a factual date comparison. You will trust it and act on it. The original feature you wouldn't.

## Designing for Autonomy

The goal from the start was to keep my involvement concentrated at the design phase and let Claude handle the build with minimal oversight. In practice this meant spending an hour with Claude in the evening settling decisions and reviewing the plan, then Claude working through the night. I would wake up to hundreds of lines of reviewed, documented output ready for my morning review.

After finalizing features, the typical next step would have been a requirements phase. I skipped it. For a traditional system you need requirements because the computer only does what you code. For an AI system, the model already knows how to summarize, extract, and draft. What it needs is structure: where information lives, what rules to follow, what guardrails to enforce. So instead of requirements, Claude and I wrote foundations. File templates, vault structure, conventions, cross-domain rules, all defined upfront in one place. Foundations bridged features directly to build.

Before each major session I also ran a structured Q&A with Claude to settle the decisions that would have otherwise become bad assumptions. **The preparation before each session mattered more than the session itself.**

Every session started fresh with no memory of prior conversations. To keep Claude aligned across sessions, I maintained a decision log and an open questions file throughout. Whenever a decision was made, Claude wrote it down with the reasoning behind it. When Claude hit a decision it could not make on its own, it added it to the log and flagged it. I reviewed all decisions after each session and updated if needed. Future sessions read this log before doing anything, so Claude never re-debated something already settled or made a contradicting choice.

Claude also maintained a dev journal throughout the build, writing entries as it worked about what happened, what surprised it, and what it learned. That journal became the source material for this article.

For every major autonomous session, Claude also wrote the prompt I would paste to kick it off. The orchestrator prompt, the overnight design prompt, the overnight build prompt. This worked better than me writing them because Claude knows what context it needs to work well. A prompt written by Claude for Claude covered the right details, gave the right starting conditions, and reduced the chance of a session going off track because something important was missing. I reviewed, adjusted, and pasted.

The first full design pass came back with around 3,400 lines, including a detailed security model with multiple defense layers. It was thorough and premature. Claude and I were solving problems we hadn't encountered yet on a system we hadn't validated yet. I pulled it back significantly and kept only what v1 actually needed.

**Learning:** This was one of the biggest lessons from the entire project. AI will go deep on complexity before you have validated the basics. It is not a flaw, it is what happens when you give a capable system a hard problem without a scope constraint. The fix is to set that constraint explicitly, not assume the AI will calibrate it on its own.

## Build, Review, Refine

Before the build started, Claude created a build plan that mapped out dependencies, identified what could run in parallel, and broke everything into granular tasks. I reviewed it and we finalized it together.

An orchestrator agent then used that plan to give each subagent precise instructions on exactly what to create. Once each subagent completed its task, the orchestrator spawned a reviewer subagent to review the output and fix any issues before moving on. 8 subagents ran in parallel, each focused on their assigned skills with no coordination needed between them. **The orchestrator ran for 3 hours.** 14 skills, around 3,400 lines, one session.

The cross-skill audit afterward found 7 issues across 20 files. That is a low number for parallel autonomous work. The reason it worked: when the authority chain is clear and every agent reads the same source of truth, they make consistent decisions without needing to talk to each other. Foundations did that job.

To keep quality high without manual review, Claude and I built a set of slash commands: review, fix, verify, coverage, and consistency. The review command ran a fresh Claude instance as a senior critic across all skills. Fix implemented the changes. Verify confirmed nothing regressed. Claude could run the full loop autonomously, catch its own issues, and converge to a clean state without me being in the loop.

As I used the system, some skills were doing too much. Brief had nine sub-modes. Sync mixed planning with execution. Claude and I split them into focused single-intent skills, one clear purpose each. That refinement took the count from 14 to 24.

**Learning:** I initially used Opus to write the skills. The output was extensive and over-specified. Switching to Sonnet produced cleaner, more concise instructions that were actually easier for the model to follow. For agent instructions, more capable does not always mean better. Clarity and conciseness matter more than depth.

*The future of building software might look like this: describe what you want, go to sleep, and wake up to something that works.*

# How Myna Was Built

> **Work in progress.** More to come.

Myna was designed, built, reviewed, and fixed entirely by Claude Code. The human defined the vision, described the features, and settled key decisions. Everything else — 24 feature skills, 6 steering skills, the install script, vault templates, dashboards, and this documentation — was written by Claude.

The process ran as a four-phase pipeline: Design, Build, Install, Ship. Human effort concentrated at the design phase where the hard tradeoffs were made. The build ran with minimal oversight — Claude read its own instructions, followed a build recipe, and executed. It reviewed its own work after each task, caught real issues, and fixed them before committing. When the user spotted something, Claude updated its docs immediately and carried the fix forward.

Two models shared the work: Claude Opus 4.6 handled architecture, design decisions, and complex multi-file tasks where deeper reasoning mattered. Claude Sonnet 4.6 handled implementation, iteration, and the bulk of the build — fast, precise, and consistent across hundreds of files.

The system prompt is the system — which means Claude built a system that Claude then runs. That fact is either obvious or strange depending on how long you think about it.

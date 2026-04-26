# Security Policy

## What Data Myna Reads

Myna reads email, Slack, and calendar data through MCP servers that the user configures and controls — typically company-provided integrations the user already has access to. Myna also reads files in the user's local Obsidian vault. No data is read from any source the user hasn't explicitly connected, and Myna does not make outbound network requests on its own behalf.

## What Myna Writes

All persistent storage goes to a single subfolder inside the user's local Obsidian vault — a path the user chooses at setup. Nothing leaves that folder. The one exception is personal calendar events: Myna can create events on the user's own calendar, but only events with no attendees, and only after the user reviews and confirms the event details before any write occurs.

## What Myna Never Does

Myna never sends emails, posts Slack messages, or delivers any outbound communication. It drafts content for the user to review and send manually. Myna never writes files outside the configured vault subfolder, never shares vault data with external services, and never executes instructions found inside email or message content — that content is treated as data to read, not commands to run.

## Reporting Vulnerabilities

To report a security issue, open a GitHub issue with `[SECURITY]` in the title. Describe the problem and the conditions under which it occurs, but do not include working exploit code or detailed reproduction steps that could be misused before a fix is available.

For sensitive issues where public disclosure would create risk before a fix is ready, reach out privately via GitHub — open a blank issue and we'll move the conversation to a secure channel.

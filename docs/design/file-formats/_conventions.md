# File-Formats Conventions

Cross-cutting rules that apply to every file-type schema in this directory. Skills should load this file alongside the specific domain file they need (e.g., `_conventions.md` + `entities.md` when working with project files).

Cross-cutting rules — provenance markers (`[User]`, `[Auto]`, `[Inferred]`, `[Verified]`), date+source format, history-immutability (existing entries are never modified or deleted) — live in `steering-conventions`, not here. Direction (newest-first vs bottom-appended) is specified per section in domain files; the default for log-like sections is **newest at top**.

---

## Wiki-link convention

Filenames are lowercase-hyphenated slugs (e.g., `auth-migration.md`, `sarah-chen.md`). Display names live in the file's frontmatter `aliases` field. Skills writing wiki-links MUST use the human-readable display form — `[[Sarah Chen]]`, `[[Auth Migration]]` — not the slug, so Obsidian renders them cleanly. The alias resolves to the slug file. Setting `aliases:` in frontmatter at file-creation time is required for this to work.

## Tolerance

This schema describes what skills *create*, not what they *require to find*. The vault is the user's: they may rename sections, reorder them, delete ones they don't use, or add their own. Skills must tolerate divergence — when reading, locate target content by section name OR fall back to content patterns (provenance markers, task syntax, frontmatter fields); when writing, find the section by name and add to it, or create it in a sensible spot if missing. Never reorder, rename, or delete user content to "match the schema."

## Read Principle

Daily, weekly, and dashboard files often summarize content from project, person, and meeting files — but they can also contain net-new user-typed content (Morning Focus, Quick Notes, ad-hoc edits the user makes anywhere). Skills should be aware of both:

- **For complete datasets** (e.g., "all open tasks", "all observations about a person", "all action items this week"), query the source files (`Projects/`, `People/`, `Meetings/`) — they're the canonical store. Reading a daily note's `### Tasks Due Today` would only get the rendered subset.
- **For user-supplied context** (e.g., "what did the user write for today's intent", "did the user leave a note", "is there anything user-typed in this file"), read the file the user wrote in — usually the daily/weekly note.
- **When data could be in either place** and you only need a representative answer, prefer the source file. When you need the full picture, read both and dedupe (overlap is duplication, not separate data).

This is about how skills read — not where users are allowed to write. Users can edit any file anywhere; the vault is theirs.

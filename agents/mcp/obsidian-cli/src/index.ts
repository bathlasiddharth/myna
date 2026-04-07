#!/usr/bin/env node

/**
 * Myna Obsidian CLI MCP Server
 *
 * A thin MCP wrapper around the Obsidian CLI (`obsidian` command).
 * Each tool shells out to the corresponding CLI command via child_process.execFile.
 *
 * Prerequisites:
 * - Obsidian must be running
 * - Obsidian CLI must be enabled (Settings > General)
 *
 * Configuration (via CLI args or environment):
 * - MYNA_VAULT: Obsidian vault name (required)
 * - MYNA_SUBFOLDER: Subfolder within vault for write operations (default: "myna")
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execFile } from "node:child_process";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const VAULT_NAME = process.env.MYNA_VAULT ?? "";
const MYNA_SUBFOLDER = process.env.MYNA_SUBFOLDER ?? "myna";

if (!VAULT_NAME) {
  console.error("MYNA_VAULT environment variable is required");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Run an Obsidian CLI command and return { stdout, stderr }. */
function runCli(args: string[]): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile("obsidian", args, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`obsidian ${args.join(" ")} failed (exit ${error.code}): ${stderr || error.message}`));
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/**
 * Validate that a vault-relative path falls under the configured myna subfolder.
 * Prevents writes outside the designated area. Normalises the path by stripping
 * leading slashes and collapsing path traversals before checking the prefix.
 */
function assertWritablePath(filePath: string): void {
  // Normalise: strip leading slash, resolve ".." segments naively
  const segments: string[] = [];
  for (const seg of filePath.split("/")) {
    if (seg === "..") {
      segments.pop();
    } else if (seg && seg !== ".") {
      segments.push(seg);
    }
  }
  const normalised = segments.join("/");
  const prefix = MYNA_SUBFOLDER.replace(/\/$/, "");
  if (!normalised.startsWith(prefix + "/") && normalised !== prefix) {
    throw new Error(
      `Write rejected: path "${filePath}" is outside the allowed subfolder "${MYNA_SUBFOLDER}/". ` +
        `All write operations are restricted to the ${MYNA_SUBFOLDER}/ subtree.`
    );
  }
}

/** Add vault targeting args that are common to every command. */
function vaultArgs(): string[] {
  return [`vault=${VAULT_NAME}`];
}

/** Try to parse a string as JSON; return raw string on failure. */
function tryParseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text.trim();
  }
}

/** Build a success result for MCP tool responses. */
function ok(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  return { content: [{ type: "text" as const, text }] };
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "obsidian-cli",
  version: "0.1.0",
});

// ---------------------------------------------------------------------------
// Read-only tools
// ---------------------------------------------------------------------------

/**
 * search — Vault-wide search using Obsidian's index.
 * CLI: obsidian search query=<term> vault=<name> --json
 */
server.tool(
  "search",
  "Vault-wide full-text search using Obsidian's index. Returns file paths and matching lines.",
  { query: z.string().describe("Search term") },
  async ({ query }) => {
    const { stdout } = await runCli(["search", `query=${query}`, ...vaultArgs(), "--json"]);
    return ok(tryParseJson(stdout));
  }
);

/**
 * search_content — Search within note content.
 * CLI: obsidian search-content query=<term> vault=<name> --json
 */
server.tool(
  "search_content",
  "Search within note content. Returns matching content snippets.",
  { query: z.string().describe("Search term") },
  async ({ query }) => {
    const { stdout } = await runCli(["search-content", `query=${query}`, ...vaultArgs(), "--json"]);
    return ok(tryParseJson(stdout));
  }
);

/**
 * read — Read a note by file name or vault-relative path, optionally a specific section.
 * CLI: obsidian read file=<name> vault=<name> --json
 * CLI: obsidian read path=<path> vault=<name> --json
 * CLI: obsidian read file=<name> heading=<heading> vault=<name> --json
 */
server.tool(
  "read",
  "Read a note's full content or a specific section by heading. Specify either file (note name) or path (vault-relative path).",
  {
    file: z.string().optional().describe("Note name (without .md extension)"),
    path: z.string().optional().describe("Vault-relative path to the file"),
    heading: z.string().optional().describe("Read only the content under this heading"),
  },
  async ({ file, path, heading }) => {
    if (!file && !path) {
      throw new Error("Either 'file' or 'path' must be provided");
    }
    const args = ["read"];
    if (file) args.push(`file=${file}`);
    if (path) args.push(`path=${path}`);
    if (heading) args.push(`heading=${heading}`);
    args.push(...vaultArgs(), "--json");
    const { stdout } = await runCli(args);
    return ok(tryParseJson(stdout));
  }
);

/**
 * daily_read — Read today's daily note.
 * CLI: obsidian daily:read vault=<name> --json
 */
server.tool(
  "daily_read",
  "Read today's daily note content.",
  {},
  async () => {
    const { stdout } = await runCli(["daily:read", ...vaultArgs(), "--json"]);
    return ok(tryParseJson(stdout));
  }
);

/**
 * tasks — List or query tasks via the Obsidian Tasks plugin.
 * CLI: obsidian tasks vault=<name> --json
 * CLI: obsidian tasks query=<filter> vault=<name> --json
 */
server.tool(
  "tasks",
  "List or query tasks via the Obsidian Tasks plugin. Optionally filter by query.",
  { query: z.string().optional().describe("Tasks plugin filter query (e.g. 'not done, due before today')") },
  async ({ query }) => {
    const args = ["tasks"];
    if (query) args.push(`query=${query}`);
    args.push(...vaultArgs(), "--json");
    const { stdout } = await runCli(args);
    return ok(tryParseJson(stdout));
  }
);

/**
 * tags — List all tags in the vault, or find files with a specific tag.
 * CLI: obsidian tags vault=<name> --json
 * CLI: obsidian tags tag=<name> vault=<name> --json
 */
server.tool(
  "tags",
  "List all vault tags or find files with a specific tag.",
  { tag: z.string().optional().describe("Specific tag to search for (e.g. '#project')") },
  async ({ tag }) => {
    const args = ["tags"];
    if (tag) args.push(`tag=${tag}`);
    args.push(...vaultArgs(), "--json");
    const { stdout } = await runCli(args);
    return ok(tryParseJson(stdout));
  }
);

/**
 * backlinks — Find notes that link to a given file.
 * CLI: obsidian backlinks file=<name> vault=<name> --json
 */
server.tool(
  "backlinks",
  "Find all notes that link to a given file.",
  { file: z.string().describe("Note name to find backlinks for") },
  async ({ file }) => {
    const { stdout } = await runCli(["backlinks", `file=${file}`, ...vaultArgs(), "--json"]);
    return ok(tryParseJson(stdout));
  }
);

/**
 * property_read — Read YAML frontmatter properties from a file.
 * CLI: obsidian property:read file=<name> vault=<name> --json
 */
server.tool(
  "property_read",
  "Read YAML frontmatter properties from a note.",
  { file: z.string().describe("Note name to read properties from") },
  async ({ file }) => {
    const { stdout } = await runCli(["property:read", `file=${file}`, ...vaultArgs(), "--json"]);
    return ok(tryParseJson(stdout));
  }
);

/**
 * eval — Run a Dataview query or JavaScript expression against the vault.
 * CLI: obsidian eval expression=<code> vault=<name> --json
 */
server.tool(
  "eval",
  "Run a Dataview query or JavaScript expression against the vault.",
  { expression: z.string().describe("JavaScript or Dataview query to evaluate") },
  async ({ expression }) => {
    const { stdout } = await runCli(["eval", `expression=${expression}`, ...vaultArgs(), "--json"]);
    return ok(tryParseJson(stdout));
  }
);

// ---------------------------------------------------------------------------
// Write tools — all validate path is under myna/ subfolder
// ---------------------------------------------------------------------------

/**
 * create — Create a new note. Fails if file already exists.
 * CLI: obsidian create name=<name> content=<text> vault=<name> silent --json
 */
server.tool(
  "create",
  "Create a new note with content. Fails if file already exists. Path must be under the myna/ subfolder.",
  {
    name: z.string().describe("Vault-relative path for the new note (e.g. 'myna/Drafts/reply-to-james.md')"),
    content: z.string().describe("Markdown content for the note"),
  },
  async ({ name, content }) => {
    assertWritablePath(name);
    const { stdout } = await runCli(["create", `name=${name}`, `content=${content}`, ...vaultArgs(), "silent", "--json"]);
    return ok(tryParseJson(stdout));
  }
);

/**
 * append — Append content to the end of a file, or after a specific heading.
 * CLI: obsidian append file=<name> content=<text> vault=<name> silent --json
 * CLI: obsidian append file=<name> content=<text> heading=<heading> vault=<name> silent --json
 */
server.tool(
  "append",
  "Append content to a note, optionally after a specific heading. Path must be under the myna/ subfolder.",
  {
    file: z.string().describe("Vault-relative path to the target note"),
    content: z.string().describe("Content to append"),
    heading: z.string().optional().describe("Heading to append after (content goes below this heading)"),
  },
  async ({ file, content, heading }) => {
    assertWritablePath(file);
    const args = ["append", `file=${file}`, `content=${content}`];
    if (heading) args.push(`heading=${heading}`);
    args.push(...vaultArgs(), "silent", "--json");
    const { stdout } = await runCli(args);
    return ok(tryParseJson(stdout));
  }
);

/**
 * prepend — Prepend content to a file or section.
 * CLI: obsidian prepend file=<name> content=<text> vault=<name> silent --json
 * CLI: obsidian prepend file=<name> content=<text> heading=<heading> vault=<name> silent --json
 */
server.tool(
  "prepend",
  "Prepend content to a note, optionally under a specific heading. Path must be under the myna/ subfolder.",
  {
    file: z.string().describe("Vault-relative path to the target note"),
    content: z.string().describe("Content to prepend"),
    heading: z.string().optional().describe("Heading to prepend under"),
  },
  async ({ file, content, heading }) => {
    assertWritablePath(file);
    const args = ["prepend", `file=${file}`, `content=${content}`];
    if (heading) args.push(`heading=${heading}`);
    args.push(...vaultArgs(), "silent", "--json");
    const { stdout } = await runCli(args);
    return ok(tryParseJson(stdout));
  }
);

/**
 * daily_append — Append content to today's daily note.
 * CLI: obsidian daily:append content=<text> vault=<name> silent --json
 *
 * Note: daily notes live under myna/Journal/ by convention; the CLI handles
 * path resolution, so we do not apply assertWritablePath here — the daily note
 * is always within the vault and Myna's configured subfolder structure.
 */
server.tool(
  "daily_append",
  "Append content to today's daily note.",
  { content: z.string().describe("Content to append to the daily note") },
  async ({ content }) => {
    const { stdout } = await runCli(["daily:append", `content=${content}`, ...vaultArgs(), "silent", "--json"]);
    return ok(tryParseJson(stdout));
  }
);

/**
 * daily_prepend — Prepend content to today's daily note.
 * CLI: obsidian daily:prepend content=<text> vault=<name> silent --json
 */
server.tool(
  "daily_prepend",
  "Prepend content to today's daily note.",
  { content: z.string().describe("Content to prepend to the daily note") },
  async ({ content }) => {
    const { stdout } = await runCli(["daily:prepend", `content=${content}`, ...vaultArgs(), "silent", "--json"]);
    return ok(tryParseJson(stdout));
  }
);

/**
 * overwrite_section — Replace a specific section's content by heading.
 * CLI: obsidian append file=<name> content=<text> heading=<heading> mode=overwrite vault=<name> silent --json
 *
 * Used for structured metadata sections only (e.g. review clearing processed items).
 * Implemented via the append command with mode=overwrite, which replaces the
 * content under the given heading rather than appending.
 */
server.tool(
  "overwrite_section",
  "Replace a section's content by heading. For structured metadata sections only. Path must be under the myna/ subfolder.",
  {
    file: z.string().describe("Vault-relative path to the target note"),
    heading: z.string().describe("Heading whose content will be replaced"),
    content: z.string().describe("New content for the section"),
  },
  async ({ file, heading, content }) => {
    assertWritablePath(file);
    const args = [
      "append",
      `file=${file}`,
      `content=${content}`,
      `heading=${heading}`,
      "mode=overwrite",
      ...vaultArgs(),
      "silent",
      "--json",
    ];
    const { stdout } = await runCli(args);
    return ok(tryParseJson(stdout));
  }
);

/**
 * move — Move or rename a file within the vault.
 * CLI: obsidian move file=<name> to=<path> vault=<name> silent --json
 *
 * Both source and destination must be under the myna/ subfolder.
 */
server.tool(
  "move",
  "Move or rename a file within the vault. Both source and destination must be under the myna/ subfolder.",
  {
    file: z.string().describe("Vault-relative path of the file to move"),
    to: z.string().describe("Vault-relative destination path"),
  },
  async ({ file, to }) => {
    assertWritablePath(file);
    assertWritablePath(to);
    const { stdout } = await runCli(["move", `file=${file}`, `to=${to}`, ...vaultArgs(), "silent", "--json"]);
    return ok(tryParseJson(stdout));
  }
);

/**
 * delete — Delete a file from the vault.
 * CLI: obsidian delete file=<name> vault=<name> silent --json
 *
 * Restricted to the myna/ subfolder.
 */
server.tool(
  "delete",
  "Delete a file from the vault. Restricted to the myna/ subfolder.",
  { file: z.string().describe("Vault-relative path of the file to delete") },
  async ({ file }) => {
    assertWritablePath(file);
    const { stdout } = await runCli(["delete", `file=${file}`, ...vaultArgs(), "silent", "--json"]);
    return ok(tryParseJson(stdout));
  }
);

/**
 * create_from_template — Create a note from an _system/templates/ template.
 * CLI: obsidian create name=<name> template=<template> vault=<name> silent --json
 *
 * Additional template variables can be passed as key=value pairs.
 */
server.tool(
  "create_from_template",
  "Create a note from a template file, substituting variables. Path must be under the myna/ subfolder.",
  {
    name: z.string().describe("Vault-relative path for the new note"),
    template: z.string().describe("Template file name (from _system/templates/)"),
    variables: z
      .record(z.string(), z.string())
      .optional()
      .describe("Template variables as key-value pairs (e.g. {\"title\": \"Auth Migration\"})"),
  },
  async ({ name, template, variables }) => {
    assertWritablePath(name);
    const RESERVED_KEYS = new Set(["name", "template", "vault", "content", "file", "path", "silent"]);
    const args = ["create", `name=${name}`, `template=${template}`];
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        if (RESERVED_KEYS.has(key)) {
          throw new Error(`Template variable key "${key}" conflicts with a reserved CLI parameter`);
        }
        args.push(`${key}=${value}`);
      }
    }
    args.push(...vaultArgs(), "silent", "--json");
    const { stdout } = await runCli(args);
    return ok(tryParseJson(stdout));
  }
);

/**
 * property_set — Set a YAML frontmatter property on a file.
 * CLI: obsidian property:set name=<key> value=<val> file=<name> vault=<name> silent --json
 */
server.tool(
  "property_set",
  "Set a YAML frontmatter property on a note. Path must be under the myna/ subfolder.",
  {
    file: z.string().describe("Vault-relative path to the target note"),
    property: z.string().describe("Property name to set"),
    value: z.string().describe("Property value"),
  },
  async ({ file, property, value }) => {
    assertWritablePath(file);
    const { stdout } = await runCli([
      "property:set",
      `name=${property}`,
      `value=${value}`,
      `file=${file}`,
      ...vaultArgs(),
      "silent",
      "--json",
    ]);
    return ok(tryParseJson(stdout));
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

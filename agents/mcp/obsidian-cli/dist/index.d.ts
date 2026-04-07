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
export {};

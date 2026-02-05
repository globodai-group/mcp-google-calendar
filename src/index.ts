#!/usr/bin/env node

/**
 * MCP Google Calendar Server
 * 
 * A standalone MCP server for Google Calendar integration with OAuth2.
 * Supports multiple accounts and full event management.
 * 
 * Required environment variables:
 * - GOOGLE_CLIENT_ID: OAuth2 client ID from Google Cloud Console
 * - GOOGLE_CLIENT_SECRET: OAuth2 client secret from Google Cloud Console
 * - GOOGLE_REDIRECT_URI: OAuth2 redirect URI (optional, defaults to oob)
 * - MCP_MASTER_KEY: Master key for local encryption (optional, auto-generated)
 */

import { createMCPServer, startMCPServer, json, ToolDefinition } from "./lib/mcp-core.js";

// Import all tools
import * as addAccount from "./tools/add-account.js";
import * as removeAccount from "./tools/remove-account.js";
import * as listAccounts from "./tools/list-accounts.js";
import * as listCalendars from "./tools/list-calendars.js";
import * as listEvents from "./tools/list-events.js";
import * as createEvent from "./tools/create-event.js";
import * as updateEvent from "./tools/update-event.js";
import * as deleteEvent from "./tools/delete-event.js";
import * as checkAvailability from "./tools/check-availability.js";

// Convert tool exports to ToolDefinition format
const tools: ToolDefinition[] = [
  // Account management
  {
    name: addAccount.name,
    description: addAccount.description,
    inputSchema: addAccount.parameters.shape,
    handler: async (args) => json(await addAccount.execute(args as any)),
  },
  {
    name: removeAccount.name,
    description: removeAccount.description,
    inputSchema: removeAccount.parameters.shape,
    handler: async (args) => json(await removeAccount.execute(args as any)),
  },
  {
    name: listAccounts.name,
    description: listAccounts.description,
    inputSchema: listAccounts.parameters.shape,
    handler: async (args) => json(await listAccounts.execute(args as any)),
  },
  // Calendar operations
  {
    name: listCalendars.name,
    description: listCalendars.description,
    inputSchema: listCalendars.parameters.shape,
    handler: async (args) => json(await listCalendars.execute(args as any)),
  },
  {
    name: listEvents.name,
    description: listEvents.description,
    inputSchema: listEvents.parameters.shape,
    handler: async (args) => json(await listEvents.execute(args as any)),
  },
  {
    name: createEvent.name,
    description: createEvent.description,
    inputSchema: createEvent.parameters.shape,
    handler: async (args) => json(await createEvent.execute(args as any)),
  },
  {
    name: updateEvent.name,
    description: updateEvent.description,
    inputSchema: updateEvent.parameters.shape,
    handler: async (args) => json(await updateEvent.execute(args as any)),
  },
  {
    name: deleteEvent.name,
    description: deleteEvent.description,
    inputSchema: deleteEvent.parameters.shape,
    handler: async (args) => json(await deleteEvent.execute(args as any)),
  },
  {
    name: checkAvailability.name,
    description: checkAvailability.description,
    inputSchema: checkAvailability.parameters.shape,
    handler: async (args) => json(await checkAvailability.execute(args as any)),
  },
];

async function main() {
  // Check required environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("[mcp-google-calendar] Error: Missing required environment variables");
    console.error("Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET");
    console.error("Optional: GOOGLE_REDIRECT_URI, MCP_MASTER_KEY");
    console.error("\nSee README.md for setup instructions.");
    process.exit(1);
  }

  const server = createMCPServer(
    {
      name: "mcp-google-calendar", 
      version: "1.0.0",
      description: "Google Calendar MCP Server with OAuth2 and multi-account support",
    },
    tools
  );

  await startMCPServer(server);
}

// Run the server
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
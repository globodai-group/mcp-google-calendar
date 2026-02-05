/**
 * Google Calendar MCP Server
 * 
 * Google Calendar integration with OAuth2.
 * Supports multiple accounts and full event management.
 * 
 * Environment Variables:
 * - GOOGLE_CLIENT_ID: OAuth2 client ID
 * - GOOGLE_CLIENT_SECRET: OAuth2 client secret  
 * - GOOGLE_REDIRECT_URI: OAuth2 redirect URI (default: http://localhost:3000/oauth/callback)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Account management
import * as addAccount from "./tools/add-account.js";
import * as removeAccount from "./tools/remove-account.js";
import * as listAccountsTool from "./tools/list-accounts.js";

// Calendar operations
import * as listCalendars from "./tools/list-calendars.js";
import * as listEvents from "./tools/list-events.js";
import * as createEvent from "./tools/create-event.js";
import * as updateEvent from "./tools/update-event.js";
import * as deleteEvent from "./tools/delete-event.js";
import * as checkAvailability from "./tools/check-availability.js";

const tools = [
  // Account management
  addAccount,
  removeAccount,
  listAccountsTool,
  // Calendar operations
  listCalendars,
  listEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  checkAvailability,
];

async function main() {
  // Verify environment variables
  const requiredEnvs = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'];
  const missing = requiredEnvs.filter(env => !process.env[env]);
  if (missing.length > 0) {
    console.error(`❌ Missing environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  const server = new McpServer({
    name: "mcp-google-calendar",
    version: "1.0.0",
  });

  // Register all tools
  for (const tool of tools) {
    server.tool(
      tool.name,
      tool.description,
      tool.parameters.shape,
      async (args: Record<string, unknown>) => {
        try {
          const result = await tool.execute(args as any);
          return {
            content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: error instanceof Error ? error.message : "Unknown error",
                }),
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  // Connect to stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("✅ Google Calendar MCP Server started");
}

main().catch(console.error);

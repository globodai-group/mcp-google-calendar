/**
 * List calendars for an account
 */

import { z } from "zod";
import { listCalendars } from "../lib/calendar-api.js";
import { listAccounts } from "../lib/google-auth.js";

export const name = "list_calendars";

export const description = "List all calendars for a connected Google account.";

export const parameters = z.object({
  account: z.string().optional().describe("Account name (uses first account if not specified)"),
});

export async function execute(args: z.infer<typeof parameters>) {
  const accounts = await listAccounts();
  
  if (accounts.length === 0) {
    return {
      success: false,
      error: "No accounts connected. Use add_google_account first.",
    };
  }

  const accountId = args.account || accounts[0]!;
  
  if (!accounts.includes(accountId)) {
    return {
      success: false,
      error: `Account "${accountId}" not found. Available: ${accounts.join(", ")}`,
    };
  }

  const calendars = await listCalendars(accountId);

  if (calendars.length === 0) {
    return {
      success: false,
      error: "No calendars found or failed to fetch",
    };
  }

  return {
    success: true,
    account: accountId,
    count: calendars.length,
    calendars: calendars.map((c) => ({
      id: c.id,
      name: c.summary,
      description: c.description,
      primary: c.primary || false,
      access: c.accessRole,
    })),
  };
}
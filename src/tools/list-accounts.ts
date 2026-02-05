/**
 * List connected Google accounts
 */

import { z } from "zod";
import { listAccounts, isCredentialsConfigured } from "../lib/google-auth.js";

export const name = "list_google_accounts";

export const description = "List all connected Google accounts for calendar access.";

export const parameters = z.object({});

export async function execute(_args: z.infer<typeof parameters>) {
  if (!isCredentialsConfigured()) {
    return {
      success: false,
      error: "Google credentials not configured. Use add_google_account for setup instructions.",
    };
  }

  const accounts = await listAccounts();

  if (accounts.length === 0) {
    return {
      success: true,
      accounts: [],
      message: "No accounts connected. Use add_google_account to connect one.",
    };
  }

  return {
    success: true,
    count: accounts.length,
    accounts: accounts,
  };
}
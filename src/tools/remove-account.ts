/**
 * Remove a Google account
 */

import { z } from "zod";
import { removeAccount, listAccounts } from "../lib/google-auth.js";

export const name = "remove_google_account";

export const description = "Remove a connected Google account.";

export const parameters = z.object({
  account_name: z.string().describe("Name of the account to remove"),
  confirm: z.boolean().describe("Must be true to confirm removal"),
});

export async function execute(args: z.infer<typeof parameters>) {
  if (!args.confirm) {
    return {
      success: false,
      error: "You must set confirm=true to remove the account",
    };
  }

  const accounts = await listAccounts();
  
  if (!accounts.includes(args.account_name)) {
    return {
      success: false,
      error: `Account "${args.account_name}" not found. Available: ${accounts.join(", ") || "none"}`,
    };
  }

  const removed = await removeAccount(args.account_name);

  if (removed) {
    return {
      success: true,
      message: `Account "${args.account_name}" removed`,
    };
  } else {
    return {
      success: false,
      error: "Failed to remove account",
    };
  }
}
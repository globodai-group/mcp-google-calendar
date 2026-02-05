/**
 * Add a Google account for calendar access
 */

import { z } from "zod";
import { 
  isCredentialsConfigured, 
  getAuthUrl, 
  exchangeCodeForTokens,
  isAccountAuthenticated 
} from "../lib/google-auth.js";

export const name = "add_google_account";

export const description = `Add a Google account for calendar access. 

First call with just the account name to get an auth URL.
Then call again with the authorization code after authenticating.`;

export const parameters = z.object({
  account_name: z.string().describe("Friendly name for this account (e.g., 'perso', 'work')"),
  auth_code: z.string().optional().describe("Authorization code from Google (after visiting auth URL)"),
});

export async function execute(args: z.infer<typeof parameters>) {
  if (!isCredentialsConfigured()) {
    return {
      success: false,
      error: "Google credentials not configured",
      setup_instructions: [
        "1. Go to https://console.cloud.google.com/",
        "2. Create a new project (or use existing)",
        "3. Enable 'Google Calendar API'",
        "4. Go to 'Credentials' → 'Create Credentials' → 'OAuth client ID'",
        "5. Choose 'Desktop app' as application type",
        "6. Set environment variables:",
        "   - GOOGLE_CLIENT_ID: Your OAuth client ID",
        "   - GOOGLE_CLIENT_SECRET: Your OAuth client secret",
        "   - GOOGLE_REDIRECT_URI: Optional redirect URI (defaults to oob)",
      ],
    };
  }

  // Check if already authenticated
  if (await isAccountAuthenticated(args.account_name)) {
    return {
      success: true,
      message: `Account "${args.account_name}" is already connected`,
    };
  }

  // If no auth code, return the auth URL
  if (!args.auth_code) {
    const authUrl = getAuthUrl(args.account_name);
    
    if (!authUrl) {
      return {
        success: false,
        error: "Failed to generate auth URL",
      };
    }

    return {
      success: true,
      status: "awaiting_auth",
      message: "Open this URL in your browser and authorize access",
      auth_url: authUrl,
      next_step: `After authorizing, call add_google_account again with account_name="${args.account_name}" and the auth_code you receive`,
    };
  }

  // Exchange code for tokens
  const result = await exchangeCodeForTokens(args.auth_code, args.account_name);

  if (result.success) {
    return {
      success: true,
      message: `Account "${args.account_name}" connected successfully!`,
      account: args.account_name,
    };
  } else {
    return {
      success: false,
      error: result.error,
    };
  }
}
/**
 * Google OAuth2 Authentication
 * 
 * Handles OAuth2 flow for Google Calendar API.
 * Tokens are stored encrypted using local crypto system.
 * 
 * Required environment variables:
 * - GOOGLE_CLIENT_ID: OAuth2 client ID
 * - GOOGLE_CLIENT_SECRET: OAuth2 client secret  
 * - GOOGLE_REDIRECT_URI: OAuth2 redirect URI (optional, defaults to oob)
 */

import { OAuth2Client } from "google-auth-library";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { encrypt, decrypt, isEncrypted } from "./crypto.js";

const CONFIG_DIR = join(homedir(), ".mcp-google-calendar");
const TOKENS_FILE = join(CONFIG_DIR, "tokens.json");

// Scopes needed for calendar operations
const SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/calendar.events",
];

interface StoredToken {
  access_token: string;
  refresh_token: string;
  scope: string;
  token_type: string;
  expiry_date: number;
}

interface AccountTokens {
  [accountId: string]: StoredToken;
}

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Check if Google credentials are configured
 */
export function isCredentialsConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

/**
 * Get OAuth2 client from environment variables
 */
export function getOAuth2Client(): OAuth2Client | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || "urn:ietf:wg:oauth:2.0:oob";

  if (!clientId || !clientSecret) {
    console.error("[google-auth] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables");
    return null;
  }

  return new OAuth2Client(clientId, clientSecret, redirectUri);
}

/**
 * Generate auth URL for a new account
 */
export function getAuthUrl(accountId: string): string | null {
  const client = getOAuth2Client();
  if (!client) {
    return null;
  }

  return client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent", // Force to get refresh token
    state: accountId,
  });
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  accountId: string
): Promise<{ success: boolean; error?: string }> {
  const client = getOAuth2Client();
  if (!client) {
    return { success: false, error: "Google credentials not configured" };
  }

  try {
    const { tokens } = await client.getToken(code);
    
    if (!tokens.refresh_token) {
      return { success: false, error: "No refresh token received. Try revoking app access and re-authenticating." };
    }

    await saveTokens(accountId, tokens as StoredToken);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to exchange code" 
    };
  }
}

/**
 * Load all stored tokens
 */
async function loadTokens(): Promise<AccountTokens> {
  ensureConfigDir();

  if (!existsSync(TOKENS_FILE)) {
    return {};
  }

  try {
    const content = readFileSync(TOKENS_FILE, "utf-8");
    const encrypted = JSON.parse(content);
    
    // Decrypt each account's tokens
    const tokens: AccountTokens = {};
    for (const [accountId, encryptedToken] of Object.entries(encrypted)) {
      if (typeof encryptedToken === "string" && isEncrypted(encryptedToken)) {
        const decrypted = await decrypt(encryptedToken);
        tokens[accountId] = JSON.parse(decrypted);
      }
    }
    
    return tokens;
  } catch {
    return {};
  }
}

/**
 * Save tokens for an account
 */
async function saveTokens(accountId: string, token: StoredToken): Promise<void> {
  ensureConfigDir();

  const tokens = await loadTokens();
  tokens[accountId] = token;

  // Encrypt each account's tokens before saving
  const encrypted: Record<string, string> = {};
  for (const [id, t] of Object.entries(tokens)) {
    encrypted[id] = await encrypt(JSON.stringify(t));
  }

  writeFileSync(TOKENS_FILE, JSON.stringify(encrypted, null, 2), { mode: 0o600 });
  console.error(`[google-auth] Saved tokens for account: ${accountId}`);
}

/**
 * Get authenticated client for an account
 */
export async function getAuthenticatedClient(accountId: string): Promise<OAuth2Client | null> {
  const client = getOAuth2Client();
  if (!client) {
    return null;
  }

  const tokens = await loadTokens();
  const token = tokens[accountId];
  
  if (!token) {
    return null;
  }

  client.setCredentials(token);

  // Check if token needs refresh
  if (token.expiry_date && token.expiry_date < Date.now() + 60000) {
    try {
      const { credentials } = await client.refreshAccessToken();
      await saveTokens(accountId, {
        ...token,
        access_token: credentials.access_token!,
        expiry_date: credentials.expiry_date!,
      });
      client.setCredentials(credentials);
      console.error(`[google-auth] Refreshed token for account: ${accountId}`);
    } catch (error) {
      console.error(`[google-auth] Failed to refresh token for ${accountId}:`, error);
      return null;
    }
  }

  return client;
}

/**
 * List configured accounts
 */
export async function listAccounts(): Promise<string[]> {
  const tokens = await loadTokens();
  return Object.keys(tokens);
}

/**
 * Remove an account
 */
export async function removeAccount(accountId: string): Promise<boolean> {
  const tokens = await loadTokens();
  
  if (!tokens[accountId]) {
    return false;
  }

  delete tokens[accountId];

  // Re-encrypt and save
  const encrypted: Record<string, string> = {};
  for (const [id, t] of Object.entries(tokens)) {
    encrypted[id] = await encrypt(JSON.stringify(t));
  }

  writeFileSync(TOKENS_FILE, JSON.stringify(encrypted, null, 2), { mode: 0o600 });
  console.error(`[google-auth] Removed account: ${accountId}`);
  return true;
}

/**
 * Check if account is authenticated
 */
export async function isAccountAuthenticated(accountId: string): Promise<boolean> {
  const tokens = await loadTokens();
  return !!tokens[accountId];
}
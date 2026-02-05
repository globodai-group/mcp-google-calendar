/**
 * Encryption for sensitive data with local AES-256-GCM
 * 
 * Configuration via environment:
 * - MCP_MASTER_KEY: Master key for encryption (required)
 * 
 * Security model:
 * - Provides encryption for stored tokens
 * - Uses AES-256-GCM with authenticated encryption
 * - Key derivation with scrypt for security
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { existsSync, readFileSync, writeFileSync, mkdirSync, chmodSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// ============================================================================
// Configuration
// ============================================================================

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const CONFIG_DIR = join(homedir(), ".mcp-google-calendar");
const KEY_FILE = join(CONFIG_DIR, ".master-key");

// Prefix to identify encryption version/backend
const PREFIX_LOCAL = "enc:local:";

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function getLocalMasterKey(): Buffer {
  if (process.env.MCP_MASTER_KEY) {
    return scryptSync(process.env.MCP_MASTER_KEY, "mcp-google-calendar-salt-v1", KEY_LENGTH);
  }

  if (existsSync(KEY_FILE)) {
    const keyData = readFileSync(KEY_FILE, "utf-8").trim();
    return scryptSync(keyData, "mcp-google-calendar-salt-v1", KEY_LENGTH);
  }

  console.error("[crypto] Generating new local master key...");
  const newKey = randomBytes(32).toString("base64");
  
  ensureConfigDir();
  writeFileSync(KEY_FILE, newKey, { mode: 0o600 });
  chmodSync(KEY_FILE, 0o600);
  
  console.error(`[crypto] Master key saved to ${KEY_FILE}`);
  return scryptSync(newKey, "mcp-google-calendar-salt-v1", KEY_LENGTH);
}

function encryptLocal(plaintext: string): string {
  const key = getLocalMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");
  const authTag = cipher.getAuthTag();

  return `${PREFIX_LOCAL}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

function decryptLocal(encrypted: string): string {
  const key = getLocalMasterKey();
  const parts = encrypted.slice(PREFIX_LOCAL.length).split(":");
  
  if (parts.length !== 3) {
    throw new Error("Invalid local encrypted format");
  }

  const iv = Buffer.from(parts[0]!, "base64");
  const authTag = Buffer.from(parts[1]!, "base64");
  const ciphertext = parts[2]!;

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted: string = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Check if a value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value?.startsWith(PREFIX_LOCAL) || false;
}

/**
 * Encrypt sensitive data using local AES-256-GCM
 */
export async function encrypt(plaintext: string): Promise<string> {
  if (!plaintext || isEncrypted(plaintext)) {
    return plaintext;
  }

  return encryptLocal(plaintext);
}

/**
 * Decrypt sensitive data
 */
export async function decrypt(encrypted: string): Promise<string> {
  if (!encrypted || !isEncrypted(encrypted)) {
    return encrypted;
  }

  if (encrypted.startsWith(PREFIX_LOCAL)) {
    return decryptLocal(encrypted);
  }

  throw new Error("Unknown encryption format");
}
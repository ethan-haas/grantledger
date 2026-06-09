import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { getServerEnv } from "@/lib/env";

const STATE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function getSecret(): string {
  return getServerEnv().TOKEN_ENCRYPTION_KEY;
}

/**
 * Generates a cryptographically signed OAuth state parameter.
 * Format: orgId:nonce:timestamp:signature
 */
export function generateOAuthState(orgId: string): string {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now().toString();
  const payload = `${orgId}:${nonce}:${timestamp}`;
  const signature = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");
  return `${payload}:${signature}`;
}

/**
 * Verifies an HMAC-signed OAuth state parameter.
 * Returns the orgId if valid, null if tampered or expired.
 */
export function verifyOAuthState(state: string): string | null {
  const parts = state.split(":");
  if (parts.length !== 4) return null;

  const [orgId, nonce, timestamp, signature] = parts;
  const payload = `${orgId}:${nonce}:${timestamp}`;

  const expected = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  // Constant-time comparison
  const a = Buffer.from(signature, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || a.length === 0) return null;
  if (!timingSafeEqual(a, b)) return null;

  // Check expiry
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Date.now() - ts > STATE_EXPIRY_MS) return null;

  return orgId;
}

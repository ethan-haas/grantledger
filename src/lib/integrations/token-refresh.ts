import { createAdminClient } from "@/lib/supabase/admin";
import { decryptToken, encryptToken } from "@/lib/crypto/tokens";
import { refreshQBOToken } from "./quickbooks/auth";
import { refreshXeroToken } from "./xero/auth";
import { logger } from "@/lib/logger";

const LOCK_TIMEOUT_MS = 30_000; // 30 seconds

interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refreshes an OAuth token with a simple lock mechanism to prevent
 * race conditions when multiple requests try to refresh simultaneously.
 *
 * Uses the updated_at column as a lightweight lock:
 * 1. Check if token was refreshed recently (within LOCK_TIMEOUT_MS)
 * 2. If so, re-read the connection to get the new token
 * 3. If not, proceed with refresh and update
 */
export async function refreshTokenWithLock(
  connectionId: string,
  provider: "quickbooks" | "xero",
  orgId: string
): Promise<RefreshedTokens> {
  const supabase = createAdminClient();

  // Re-read the connection to get latest state
  const { data: connection } = await supabase
    .from("accounting_connections")
    .select("*")
    .eq("id", connectionId)
    .eq("org_id", orgId)
    .single();

  if (!connection) {
    throw new Error(`Connection not found: ${connectionId}`);
  }

  // Check if token was recently updated (another request may have refreshed it)
  const tokenExpiry = new Date(connection.token_expires_at || 0);
  if (tokenExpiry > new Date()) {
    // Token is still valid — another request already refreshed it
    try {
      return {
        accessToken: decryptToken(connection.access_token_encrypted),
        refreshToken: decryptToken(connection.refresh_token_encrypted),
      };
    } catch {
      throw new Error(`Corrupted token data for connection ${connectionId}. Please reconnect.`);
    }
  }

  // Check if another refresh is in progress (updated_at is recent)
  const lastUpdated = new Date(connection.updated_at).getTime();
  const now = Date.now();
  if (now - lastUpdated < LOCK_TIMEOUT_MS) {
    // Another request is likely refreshing. Wait briefly and re-read.
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const { data: refreshed } = await supabase
      .from("accounting_connections")
      .select("access_token_encrypted, refresh_token_encrypted, token_expires_at")
      .eq("id", connectionId)
      .eq("org_id", orgId)
      .single();

    if (refreshed) {
      const newExpiry = new Date(refreshed.token_expires_at || 0);
      if (newExpiry > new Date()) {
        try {
          return {
            accessToken: decryptToken(refreshed.access_token_encrypted),
            refreshToken: decryptToken(refreshed.refresh_token_encrypted),
          };
        } catch {
          throw new Error(`Corrupted token data for connection ${connectionId}. Please reconnect.`);
        }
      }
    }
  }

  // Proceed with refresh
  let currentRefreshToken: string;
  try {
    currentRefreshToken = decryptToken(connection.refresh_token_encrypted);
  } catch {
    throw new Error(`Corrupted token data for connection ${connectionId}. Please reconnect.`);
  }

  const tokens = provider === "quickbooks"
    ? await refreshQBOToken(currentRefreshToken)
    : await refreshXeroToken(currentRefreshToken);

  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  const { error: updateError } = await supabase
    .from("accounting_connections")
    .update({
      access_token_encrypted: encryptToken(tokens.access_token),
      refresh_token_encrypted: encryptToken(tokens.refresh_token),
      token_expires_at: newExpiry,
    })
    .eq("id", connectionId)
    .eq("org_id", orgId);

  if (updateError) {
    logger.error("Failed to persist refreshed tokens", { connectionId, error: updateError.message });
    throw new Error("Failed to save refreshed tokens. Please reconnect.");
  }

  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  };
}

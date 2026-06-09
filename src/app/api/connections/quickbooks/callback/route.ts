import { NextResponse } from "next/server";
import { exchangeQBOCode } from "@/lib/integrations/quickbooks/auth";
import { encryptToken } from "@/lib/crypto/tokens";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyOAuthState } from "@/lib/integrations/oauth-state";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const realmId = searchParams.get("realmId");
  const state = searchParams.get("state"); // orgId
  const error = searchParams.get("error");

  const baseUrl = getServerEnv().NEXT_PUBLIC_APP_URL;
  const settingsUrl = `${baseUrl}/dashboard/settings/connections`;

  // Handle OAuth errors
  if (error) {
    logger.error("QBO OAuth error", { error });
    return NextResponse.redirect(
      `${settingsUrl}?error=qbo_auth_failed`
    );
  }

  if (!code || !realmId || !state) {
    return NextResponse.redirect(
      `${settingsUrl}?error=missing_params`
    );
  }

  const orgId = verifyOAuthState(state);
  if (!orgId) {
    return NextResponse.redirect(
      `${settingsUrl}?error=invalid_state`
    );
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeQBOCode(code, realmId);

    // Encrypt tokens before storing
    const accessTokenEncrypted = encryptToken(tokens.access_token);
    const refreshTokenEncrypted = encryptToken(tokens.refresh_token);
    const tokenExpiresAt = new Date(
      Date.now() + tokens.expires_in * 1000
    ).toISOString();

    const supabase = createAdminClient();

    // Upsert connection — atomically handles both insert and update cases
    const { error: upsertError } = await supabase
      .from("accounting_connections")
      .upsert(
        {
          org_id: orgId,
          provider: "quickbooks",
          external_tenant_id: realmId,
          access_token_encrypted: accessTokenEncrypted,
          refresh_token_encrypted: refreshTokenEncrypted,
          token_expires_at: tokenExpiresAt,
          status: "connected",
          error_message: null,
        },
        { onConflict: "org_id,provider" }
      );

    if (upsertError) {
      logger.error("QBO connection upsert failed", upsertError);
      return NextResponse.redirect(
        `${settingsUrl}?error=qbo_connection_save`
      );
    }

    return NextResponse.redirect(
      `${settingsUrl}?success=quickbooks`
    );
  } catch (err) {
    logger.error("QBO token exchange error", err instanceof Error ? err : undefined);
    return NextResponse.redirect(
      `${settingsUrl}?error=qbo_token_exchange`
    );
  }
}

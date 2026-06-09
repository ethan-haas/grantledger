import { generateOAuthState } from "../oauth-state";
import { fetchWithTimeout } from "../fetch-timeout";
import { getServerEnv } from "@/lib/env";

const QBO_AUTH_URL = "https://appcenter.intuit.com/connect/oauth2";
const QBO_TOKEN_URL =
  "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

function getQBOConfig() {
  const { QBO_CLIENT_ID: clientId, QBO_CLIENT_SECRET: clientSecret } = getServerEnv();
  if (!clientId || !clientSecret) {
    throw new Error("QBO_CLIENT_ID and QBO_CLIENT_SECRET must be set");
  }
  return { clientId, clientSecret };
}

function getRedirectUri(): string {
  return `${getServerEnv().NEXT_PUBLIC_APP_URL}/api/connections/quickbooks/callback`;
}

/**
 * Generates the QuickBooks OAuth authorization URL.
 * The orgId is passed through the state parameter for security.
 */
export function getQBOAuthUrl(orgId: string): string {
  const { clientId } = getQBOConfig();
  const redirectUri = getRedirectUri();

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    redirect_uri: redirectUri,
    state: generateOAuthState(orgId),
  });

  return `${QBO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for access and refresh tokens.
 */
export async function exchangeQBOCode(
  code: string,
  realmId: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getQBOConfig();
  const redirectUri = getRedirectUri();

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetchWithTimeout(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QBO token exchange failed: ${response.status} ${errorText}`);
  }

  const ct = response.headers.get("content-type");
  if (!ct?.includes("application/json")) {
    throw new Error(`QBO token response returned unexpected content-type: ${ct}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

/**
 * Refreshes an expired QBO access token using the refresh token.
 */
export async function refreshQBOToken(
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getQBOConfig();

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetchWithTimeout(QBO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`QBO token refresh failed: ${response.status} ${errorText}`);
  }

  const ct = response.headers.get("content-type");
  if (!ct?.includes("application/json")) {
    throw new Error(`QBO token response returned unexpected content-type: ${ct}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

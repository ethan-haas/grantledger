import { generateOAuthState } from "../oauth-state";
import { fetchWithTimeout } from "../fetch-timeout";
import { getServerEnv } from "@/lib/env";

const XERO_AUTH_URL =
  "https://login.xero.com/identity/connect/authorize";
const XERO_TOKEN_URL = "https://identity.xero.com/connect/token";

function getXeroConfig() {
  const { XERO_CLIENT_ID: clientId, XERO_CLIENT_SECRET: clientSecret } = getServerEnv();
  if (!clientId || !clientSecret) {
    throw new Error("XERO_CLIENT_ID and XERO_CLIENT_SECRET must be set");
  }
  return { clientId, clientSecret };
}

function getRedirectUri(): string {
  return `${getServerEnv().NEXT_PUBLIC_APP_URL}/api/connections/xero/callback`;
}

/**
 * Generates the Xero OAuth authorization URL.
 * The orgId is passed through the state parameter for security.
 */
export function getXeroAuthUrl(orgId: string): string {
  const { clientId } = getXeroConfig();
  const redirectUri = getRedirectUri();

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: "openid profile email accounting.transactions.read offline_access",
    redirect_uri: redirectUri,
    state: generateOAuthState(orgId),
  });

  return `${XERO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchanges an authorization code for access and refresh tokens.
 */
export async function exchangeXeroCode(
  code: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getXeroConfig();
  const redirectUri = getRedirectUri();

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetchWithTimeout(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
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
    throw new Error(`Xero token exchange failed: ${response.status} ${errorText}`);
  }

  const ct = response.headers.get("content-type");
  if (!ct?.includes("application/json")) {
    throw new Error(`Xero token response returned unexpected content-type: ${ct}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

/**
 * Refreshes an expired Xero access token using the refresh token.
 */
export async function refreshXeroToken(
  refreshToken: string
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const { clientId, clientSecret } = getXeroConfig();

  const credentials = Buffer.from(
    `${clientId}:${clientSecret}`
  ).toString("base64");

  const response = await fetchWithTimeout(XERO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Xero token refresh failed: ${response.status} ${errorText}`);
  }

  const ct = response.headers.get("content-type");
  if (!ct?.includes("application/json")) {
    throw new Error(`Xero token response returned unexpected content-type: ${ct}`);
  }

  const data = await response.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
  };
}

/**
 * Fetches the list of connected Xero tenants (organizations).
 * Returns the first tenant ID for API calls.
 */
export async function getXeroTenantId(
  accessToken: string
): Promise<string> {
  const response = await fetchWithTimeout(
    "https://api.xero.com/connections",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Xero tenants: ${response.status}`);
  }

  const ct = response.headers.get("content-type");
  if (!ct?.includes("application/json")) {
    throw new Error(`Xero tenants response returned unexpected content-type: ${ct}`);
  }

  const tenants = await response.json();

  if (!tenants || tenants.length === 0) {
    throw new Error("No Xero tenants connected");
  }

  return tenants[0].tenantId;
}

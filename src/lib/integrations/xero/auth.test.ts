import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    XERO_CLIENT_ID: "xero_id",
    XERO_CLIENT_SECRET: "xero_secret",
    NEXT_PUBLIC_APP_URL: "https://app.test.com",
  }),
}));

vi.mock("../oauth-state", () => ({
  generateOAuthState: () => "mock_state",
}));

const mockFetch = vi.fn();
vi.mock("../fetch-timeout", () => ({
  fetchWithTimeout: (...args: unknown[]) => mockFetch(...args),
}));

describe("Xero auth", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("exchangeXeroCode returns tokens on success", async () => {
    const { exchangeXeroCode } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        access_token: "xat_123",
        refresh_token: "xrt_123",
        expires_in: 1800,
      }),
    });

    const result = await exchangeXeroCode("code_xyz");
    expect(result).toEqual({
      access_token: "xat_123",
      refresh_token: "xrt_123",
      expires_in: 1800,
    });
  });

  it("exchangeXeroCode throws on non-200", async () => {
    const { exchangeXeroCode } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    await expect(exchangeXeroCode("bad_code")).rejects.toThrow(
      "Xero token exchange failed: 400"
    );
  });

  it("refreshXeroToken throws on non-200", async () => {
    const { refreshXeroToken } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(refreshXeroToken("bad_token")).rejects.toThrow(
      "Xero token refresh failed: 401"
    );
  });

  it("getXeroTenantId throws when no tenants connected", async () => {
    const { getXeroTenantId } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [],
    });

    await expect(getXeroTenantId("access_token_123")).rejects.toThrow(
      "No Xero tenants connected"
    );
  });

  it("getXeroAuthUrl starts with Xero OAuth base URL", async () => {
    const { getXeroAuthUrl } = await import("./auth");
    const url = getXeroAuthUrl("org_123");
    expect(url.startsWith("https://login.xero.com/identity/connect/authorize")).toBe(true);
  });

  it("getXeroAuthUrl includes scope with accounting.transactions.read", async () => {
    const { getXeroAuthUrl } = await import("./auth");
    const url = new URL(getXeroAuthUrl("org_123"));
    const scope = url.searchParams.get("scope") ?? "";
    expect(scope).toContain("accounting.transactions.read");
  });

  it("getXeroAuthUrl includes correct redirect_uri", async () => {
    const { getXeroAuthUrl } = await import("./auth");
    const url = new URL(getXeroAuthUrl("org_123"));
    expect(url.searchParams.get("redirect_uri")).toContain("/api/connections/xero/callback");
  });

  it("getXeroAuthUrl includes state from generateOAuthState", async () => {
    const { getXeroAuthUrl } = await import("./auth");
    const url = new URL(getXeroAuthUrl("org_123"));
    expect(url.searchParams.get("state")).toBe("mock_state");
  });

  it("refreshXeroToken returns tokens on success", async () => {
    const { refreshXeroToken } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        access_token: "new_xat",
        refresh_token: "new_xrt",
        expires_in: 1800,
      }),
    });

    const result = await refreshXeroToken("old_refresh_token");
    expect(result).toEqual({
      access_token: "new_xat",
      refresh_token: "new_xrt",
      expires_in: 1800,
    });
  });

  it("getXeroTenantId returns first tenant ID on success", async () => {
    const { getXeroTenantId } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [
        { tenantId: "tid_123", tenantName: "My Org" },
        { tenantId: "tid_456", tenantName: "Other Org" },
      ],
    });

    const result = await getXeroTenantId("access_token_123");
    expect(result).toBe("tid_123");
  });

  it("getXeroTenantId sends Bearer auth header", async () => {
    const { getXeroTenantId } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => [{ tenantId: "tid_123" }],
    });

    await getXeroTenantId("my_access_token");

    const callHeaders = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    expect(callHeaders.Authorization).toBe("Bearer my_access_token");
  });

  it("exchangeXeroCode sends Basic auth header", async () => {
    const { exchangeXeroCode } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        access_token: "xat",
        refresh_token: "xrt",
        expires_in: 1800,
      }),
    });

    await exchangeXeroCode("code_xyz");

    const callHeaders = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    const expectedCreds = Buffer.from("xero_id:xero_secret").toString("base64");
    expect(callHeaders.Authorization).toBe(`Basic ${expectedCreds}`);
  });
});

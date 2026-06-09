import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    QBO_CLIENT_ID: "qbo_id",
    QBO_CLIENT_SECRET: "qbo_secret",
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

describe("QBO auth", () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it("exchangeQBOCode returns tokens on success", async () => {
    const { exchangeQBOCode } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        access_token: "at_123",
        refresh_token: "rt_123",
        expires_in: 3600,
      }),
    });

    const result = await exchangeQBOCode("code_abc", "realm_123");
    expect(result).toEqual({
      access_token: "at_123",
      refresh_token: "rt_123",
      expires_in: 3600,
    });
  });

  it("exchangeQBOCode throws on non-200", async () => {
    const { exchangeQBOCode } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    await expect(exchangeQBOCode("bad_code", "realm_123")).rejects.toThrow(
      "QBO token exchange failed: 400"
    );
  });

  it("refreshQBOToken throws on non-200", async () => {
    const { refreshQBOToken } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    await expect(refreshQBOToken("bad_token")).rejects.toThrow(
      "QBO token refresh failed: 401"
    );
  });

  it("getQBOAuthUrl starts with Intuit OAuth base URL", async () => {
    const { getQBOAuthUrl } = await import("./auth");
    const url = getQBOAuthUrl("org_123");
    expect(url.startsWith("https://appcenter.intuit.com/connect/oauth2")).toBe(true);
  });

  it("getQBOAuthUrl includes client_id matching QBO_CLIENT_ID", async () => {
    const { getQBOAuthUrl } = await import("./auth");
    const url = new URL(getQBOAuthUrl("org_123"));
    expect(url.searchParams.get("client_id")).toBe("qbo_id");
  });

  it("getQBOAuthUrl includes scope 'com.intuit.quickbooks.accounting'", async () => {
    const { getQBOAuthUrl } = await import("./auth");
    const url = new URL(getQBOAuthUrl("org_123"));
    expect(url.searchParams.get("scope")).toBe("com.intuit.quickbooks.accounting");
  });

  it("getQBOAuthUrl includes correct redirect_uri", async () => {
    const { getQBOAuthUrl } = await import("./auth");
    const url = new URL(getQBOAuthUrl("org_123"));
    expect(url.searchParams.get("redirect_uri")).toContain("/api/connections/quickbooks/callback");
  });

  it("getQBOAuthUrl includes state from generateOAuthState", async () => {
    const { getQBOAuthUrl } = await import("./auth");
    const url = new URL(getQBOAuthUrl("org_123"));
    expect(url.searchParams.get("state")).toBe("mock_state");
  });

  it("refreshQBOToken returns tokens on success", async () => {
    const { refreshQBOToken } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        access_token: "new_at",
        refresh_token: "new_rt",
        expires_in: 3600,
      }),
    });

    const result = await refreshQBOToken("old_refresh_token");
    expect(result).toEqual({
      access_token: "new_at",
      refresh_token: "new_rt",
      expires_in: 3600,
    });
  });

  it("exchangeQBOCode sends Basic auth header", async () => {
    const { exchangeQBOCode } = await import("./auth");

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({
        access_token: "at",
        refresh_token: "rt",
        expires_in: 3600,
      }),
    });

    await exchangeQBOCode("code_abc", "realm_123");

    const callHeaders = mockFetch.mock.calls[0][1].headers as Record<string, string>;
    const expectedCreds = Buffer.from("qbo_id:qbo_secret").toString("base64");
    expect(callHeaders.Authorization).toBe(`Basic ${expectedCreds}`);
  });

  it("getQBOConfig throws when credentials are missing", async () => {
    vi.resetModules();
    vi.doMock("@/lib/env", () => ({
      getServerEnv: () => ({
        QBO_CLIENT_ID: "",
        QBO_CLIENT_SECRET: "",
        NEXT_PUBLIC_APP_URL: "https://app.test.com",
      }),
    }));
    vi.doMock("../oauth-state", () => ({
      generateOAuthState: () => "mock_state",
    }));
    vi.doMock("../fetch-timeout", () => ({
      fetchWithTimeout: (...args: unknown[]) => mockFetch(...args),
    }));

    const { getQBOAuthUrl } = await import("./auth");
    expect(() => getQBOAuthUrl("org_123")).toThrow("QBO_CLIENT_ID and QBO_CLIENT_SECRET must be set");
  });
});

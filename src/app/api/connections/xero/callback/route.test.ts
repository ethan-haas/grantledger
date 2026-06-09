import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchangeXeroCode = vi.fn();
const mockGetXeroTenantId = vi.fn();
const mockEncryptToken = vi.fn().mockReturnValue("encrypted_token");
const mockVerifyOAuthState = vi.fn();

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn().mockReturnValue({
  upsert: mockUpsert,
});

vi.mock("@/lib/integrations/xero/auth", () => ({
  exchangeXeroCode: (...args: unknown[]) => mockExchangeXeroCode(...args),
  getXeroTenantId: (...args: unknown[]) => mockGetXeroTenantId(...args),
}));

vi.mock("@/lib/crypto/tokens", () => ({
  encryptToken: (...args: unknown[]) => mockEncryptToken(...args),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/integrations/oauth-state", () => ({
  verifyOAuthState: (...args: unknown[]) => mockVerifyOAuthState(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test.com" }),
}));

import { GET } from "./route";

describe("GET /api/connections/xero/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("redirects with error=xero_auth_failed when error query param present", async () => {
    const request = new Request(
      "http://localhost/api/connections/xero/callback?error=access_denied"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=xero_auth_failed");
  });

  it("redirects with error=missing_params when code/state missing", async () => {
    const request = new Request(
      "http://localhost/api/connections/xero/callback"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=missing_params");
  });

  it("redirects with error=invalid_state when verifyOAuthState returns null", async () => {
    mockVerifyOAuthState.mockReturnValue(null);
    const request = new Request(
      "http://localhost/api/connections/xero/callback?code=abc&state=bad_state"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_state");
  });

  it("exchanges code, fetches tenant, encrypts tokens, upserts connection, and redirects on success", async () => {
    mockVerifyOAuthState.mockReturnValue("org_123");
    mockExchangeXeroCode.mockResolvedValue({
      access_token: "at_xero",
      refresh_token: "rt_xero",
      expires_in: 1800,
    });
    mockGetXeroTenantId.mockResolvedValue("tenant_abc");

    const request = new Request(
      "http://localhost/api/connections/xero/callback?code=abc&state=valid_state"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("success=xero");
    expect(mockExchangeXeroCode).toHaveBeenCalledWith("abc");
    expect(mockGetXeroTenantId).toHaveBeenCalledWith("at_xero");
    expect(mockEncryptToken).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: "org_123",
        provider: "xero",
        external_tenant_id: "tenant_abc",
        status: "connected",
      }),
      { onConflict: "org_id,provider" }
    );
  });

  it("redirects with error=xero_token_exchange when code exchange throws", async () => {
    mockVerifyOAuthState.mockReturnValue("org_123");
    mockExchangeXeroCode.mockRejectedValue(new Error("Exchange failed"));

    const request = new Request(
      "http://localhost/api/connections/xero/callback?code=abc&state=valid_state"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=xero_token_exchange");
  });

  it("redirects with error=xero_connection_save when upsert fails", async () => {
    mockVerifyOAuthState.mockReturnValue("org_123");
    mockExchangeXeroCode.mockResolvedValue({
      access_token: "at_xero",
      refresh_token: "rt_xero",
      expires_in: 1800,
    });
    mockGetXeroTenantId.mockResolvedValue("tenant_abc");
    mockUpsert.mockResolvedValue({ error: { message: "DB error" } });

    const request = new Request(
      "http://localhost/api/connections/xero/callback?code=abc&state=valid_state"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=xero_connection_save");
  });
});

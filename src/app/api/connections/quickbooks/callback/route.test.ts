import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExchangeQBOCode = vi.fn();
const mockEncryptToken = vi.fn().mockReturnValue("encrypted_token");
const mockVerifyOAuthState = vi.fn();

const mockUpsert = vi.fn().mockResolvedValue({ error: null });
const mockFrom = vi.fn().mockReturnValue({
  upsert: mockUpsert,
});

vi.mock("@/lib/integrations/quickbooks/auth", () => ({
  exchangeQBOCode: (...args: unknown[]) => mockExchangeQBOCode(...args),
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

describe("GET /api/connections/quickbooks/callback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockResolvedValue({ error: null });
  });

  it("redirects with error=qbo_auth_failed when error query param present", async () => {
    const request = new Request(
      "http://localhost/api/connections/quickbooks/callback?error=access_denied"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=qbo_auth_failed");
  });

  it("redirects with error=missing_params when code/realmId/state missing", async () => {
    const request = new Request(
      "http://localhost/api/connections/quickbooks/callback?code=abc"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=missing_params");
  });

  it("redirects with error=invalid_state when verifyOAuthState returns null", async () => {
    mockVerifyOAuthState.mockReturnValue(null);
    const request = new Request(
      "http://localhost/api/connections/quickbooks/callback?code=abc&realmId=realm1&state=bad_state"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=invalid_state");
  });

  it("exchanges code, encrypts tokens, upserts connection, and redirects on success", async () => {
    mockVerifyOAuthState.mockReturnValue("org_123");
    mockExchangeQBOCode.mockResolvedValue({
      access_token: "at_123",
      refresh_token: "rt_123",
      expires_in: 3600,
    });

    const request = new Request(
      "http://localhost/api/connections/quickbooks/callback?code=abc&realmId=realm1&state=valid_state"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("success=quickbooks");
    expect(mockExchangeQBOCode).toHaveBeenCalledWith("abc", "realm1");
    expect(mockEncryptToken).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        org_id: "org_123",
        provider: "quickbooks",
        external_tenant_id: "realm1",
        status: "connected",
      }),
      { onConflict: "org_id,provider" }
    );
  });

  it("redirects with error=qbo_token_exchange when code exchange throws", async () => {
    mockVerifyOAuthState.mockReturnValue("org_123");
    mockExchangeQBOCode.mockRejectedValue(new Error("Exchange failed"));

    const request = new Request(
      "http://localhost/api/connections/quickbooks/callback?code=abc&realmId=realm1&state=valid_state"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=qbo_token_exchange");
  });

  it("redirects with error=qbo_connection_save when upsert fails", async () => {
    mockVerifyOAuthState.mockReturnValue("org_123");
    mockExchangeQBOCode.mockResolvedValue({
      access_token: "at_123",
      refresh_token: "rt_123",
      expires_in: 3600,
    });
    mockUpsert.mockResolvedValue({ error: { message: "DB error" } });

    const request = new Request(
      "http://localhost/api/connections/quickbooks/callback?code=abc&realmId=realm1&state=valid_state"
    );
    const res = await GET(request);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("error=qbo_connection_save");
  });
});

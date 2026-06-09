import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAuthOrgId = vi.fn();
const mockGetQBOAuthUrl = vi.fn();

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: () => mockGetAuthOrgId(),
}));

vi.mock("@/lib/integrations/quickbooks/auth", () => ({
  getQBOAuthUrl: (orgId: string) => mockGetQBOAuthUrl(orgId),
}));

describe("GET /api/connections/quickbooks/authorize", () => {
  beforeEach(() => {
    mockGetAuthOrgId.mockReset();
    mockGetQBOAuthUrl.mockReset();
  });

  it("returns 401 when no orgId", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: "user_1", userEmail: null });

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("redirects to QBO auth URL on success", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_123", userId: "user_1", userEmail: "user@test.com" });
    mockGetQBOAuthUrl.mockReturnValue("https://appcenter.intuit.com/connect/oauth2?client_id=test");

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(307);
    expect(mockGetQBOAuthUrl).toHaveBeenCalledWith("org_123");
  });
});

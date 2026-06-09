import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAuthOrgId = vi.fn();
const mockGetXeroAuthUrl = vi.fn();

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: () => mockGetAuthOrgId(),
}));

vi.mock("@/lib/integrations/xero/auth", () => ({
  getXeroAuthUrl: (orgId: string) => mockGetXeroAuthUrl(orgId),
}));

describe("GET /api/connections/xero/authorize", () => {
  beforeEach(() => {
    mockGetAuthOrgId.mockReset();
    mockGetXeroAuthUrl.mockReset();
  });

  it("returns 401 when no orgId", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: "user_1", userEmail: null });

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("redirects to Xero auth URL on success", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_456", userId: "user_1", userEmail: "user@test.com" });
    mockGetXeroAuthUrl.mockReturnValue("https://login.xero.com/identity/connect/authorize?client_id=test");

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(307);
    expect(mockGetXeroAuthUrl).toHaveBeenCalledWith("org_456");
  });
});

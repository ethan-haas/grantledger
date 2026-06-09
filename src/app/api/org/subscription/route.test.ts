import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/auth/subscription", () => ({
  getSubscriptionStatus: vi.fn(),
  getTrialDaysRemaining: vi.fn(),
}));

import { GET } from "./route";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { getSubscriptionStatus, getTrialDaysRemaining } from "@/lib/auth/subscription";

const mockGetAuthOrgId = vi.mocked(getAuthOrgId);
const mockGetSubscriptionStatus = vi.mocked(getSubscriptionStatus);
const mockGetTrialDaysRemaining = vi.mocked(getTrialDaysRemaining);

describe("GET /api/org/subscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when orgId is missing", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when org is not found", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockGetSubscriptionStatus.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Organization not found");
  });

  it("returns data without stripe_customer_id for active subscription", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockGetSubscriptionStatus.mockResolvedValue({
      id: "org_1",
      subscription_status: "active",
      stripe_customer_id: "cus_secret_123",
      trial_ends_at: null,
    } as never);
    mockGetTrialDaysRemaining.mockReturnValue(0);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subscription_status).toBe("active");
    expect(body.stripe_customer_id).toBeUndefined();
    expect(body.trial_days_remaining).toBe(0);
  });

  it("returns trial_days_remaining > 0 for trialing org", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    mockGetSubscriptionStatus.mockResolvedValue({
      id: "org_1",
      subscription_status: "trialing",
      stripe_customer_id: null,
      trial_ends_at: futureDate,
    } as never);
    mockGetTrialDaysRemaining.mockReturnValue(7);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.trial_days_remaining).toBe(7);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreatePortalSession = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    billingPortal: {
      sessions: { create: (...args: unknown[]) => mockCreatePortalSession(...args) },
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" }),
}));

import { POST } from "./route";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";

const mockGetAuthOrgId = vi.mocked(getAuthOrgId);

describe("POST /api/stripe/portal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });
  });

  it("returns 401 when orgId is missing", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const res = await POST();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 500 when org fetch fails", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "DB connection error" },
    });

    const res = await POST();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to load billing information");
  });

  it("returns 400 when no billing account (stripe_customer_id null)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_1", stripe_customer_id: null },
      error: null,
    });

    const res = await POST();
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No billing account");
  });

  it("returns session URL on success", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_1", stripe_customer_id: "cus_test_123" },
      error: null,
    });
    mockCreatePortalSession.mockResolvedValue({
      url: "https://billing.stripe.com/portal_123",
    });

    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://billing.stripe.com/portal_123");
  });

  it("returns 500 when Stripe throws", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_1", stripe_customer_id: "cus_test_123" },
      error: null,
    });
    mockCreatePortalSession.mockRejectedValue(new Error("Stripe API error"));

    const res = await POST();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain("Failed to create billing portal session");
  });
});

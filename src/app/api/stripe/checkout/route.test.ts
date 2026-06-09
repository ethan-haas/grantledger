import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateCustomer = vi.fn();
const mockCreateSession = vi.fn();
const mockSingle = vi.fn();
const mockUpdateEq = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq });
const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect, update: mockUpdate });

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/stripe", () => ({
  stripe: {
    customers: { create: (...args: unknown[]) => mockCreateCustomer(...args) },
    checkout: { sessions: { create: (...args: unknown[]) => mockCreateSession(...args) } },
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

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/stripe/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });
  });

  it("returns 401 when orgId is missing", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const res = await POST(makeRequest({ priceId: "price_test" }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid JSON body", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const req = new Request("http://localhost/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON");
  });

  it("returns 400 for invalid priceId format (no price_ prefix)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const res = await POST(makeRequest({ priceId: "invalid_id" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 500 when org fetch fails", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: null,
      error: { message: "DB connection error" },
    });

    const res = await POST(makeRequest({ priceId: "price_test_123" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to initialize checkout");
  });

  it("logs warning when org update after customer creation fails but still proceeds", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_1", stripe_customer_id: null },
      error: null,
    });
    mockCreateCustomer.mockResolvedValue({ id: "cus_new_123" });
    mockUpdateEq.mockResolvedValue({ error: { message: "Update failed" } });
    mockCreateSession.mockResolvedValue({
      url: "https://checkout.stripe.com/session_abc",
    });

    const res = await POST(makeRequest({ priceId: "price_test_123" }));
    // Should still succeed — checkout proceeds with in-memory customer ID
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/session_abc");
  });

  it("returns session URL on successful checkout", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_1", stripe_customer_id: "cus_existing" },
      error: null,
    });
    mockCreateSession.mockResolvedValue({
      url: "https://checkout.stripe.com/session_123",
    });

    const res = await POST(makeRequest({ priceId: "price_test_123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/session_123");
  });

  it("returns 409 when organization already has an active subscription", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_409", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_409", stripe_customer_id: "cus_1", subscription_status: "active" },
      error: null,
    });

    const res = await POST(makeRequest({ priceId: "price_test_123" }));
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain("already has an active subscription");
    expect(mockCreateSession).not.toHaveBeenCalled();
    expect(mockCreateCustomer).not.toHaveBeenCalled();
  });

  it("returns 404 when organization is not found", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_404", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({ data: null, error: null });

    const res = await POST(makeRequest({ priceId: "price_test_123" }));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Organization not found");
  });

  it("returns 500 when Stripe session creation throws", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_throw", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_throw", stripe_customer_id: "cus_existing", subscription_status: "trialing" },
      error: null,
    });
    mockCreateSession.mockRejectedValue(new Error("Stripe API timeout"));

    const res = await POST(makeRequest({ priceId: "price_test_123" }));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to create checkout session");
  });

  it("allows checkout for past_due subscription (re-subscribe flow)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_pd", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_pd", stripe_customer_id: "cus_existing", subscription_status: "past_due" },
      error: null,
    });
    mockCreateSession.mockResolvedValue({
      url: "https://checkout.stripe.com/session_resubscribe",
    });

    const res = await POST(makeRequest({ priceId: "price_test_123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/session_resubscribe");
    // Only "active" should be blocked, past_due should proceed
    expect(mockCreateSession).toHaveBeenCalled();
  });

  it("allows checkout for trialing subscription", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_trial", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_trial", stripe_customer_id: "cus_existing", subscription_status: "trialing" },
      error: null,
    });
    mockCreateSession.mockResolvedValue({
      url: "https://checkout.stripe.com/session_trial_upgrade",
    });

    const res = await POST(makeRequest({ priceId: "price_test_123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/session_trial_upgrade");
  });

  it("session metadata includes org_id for webhook correlation", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_meta", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_meta", stripe_customer_id: "cus_existing", subscription_status: "trialing" },
      error: null,
    });
    mockCreateSession.mockResolvedValue({
      url: "https://checkout.stripe.com/session_meta",
    });

    await POST(makeRequest({ priceId: "price_test_123" }));

    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { org_id: "org_meta" },
        subscription_data: expect.objectContaining({
          metadata: { org_id: "org_meta" },
        }),
      })
    );
  });

  it("creates customer first when org has no stripe_customer_id", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_new", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValue({
      data: { id: "org_new", stripe_customer_id: null, subscription_status: "trialing" },
      error: null,
    });
    mockCreateCustomer.mockResolvedValue({ id: "cus_brand_new" });
    mockCreateSession.mockResolvedValue({
      url: "https://checkout.stripe.com/session_new",
    });

    const res = await POST(makeRequest({ priceId: "price_test_123" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/session_new");

    // Customer should have been created first
    expect(mockCreateCustomer).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { org_id: "org_new" } })
    );
    // Session should use the newly created customer
    expect(mockCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_brand_new" })
    );
  });
});

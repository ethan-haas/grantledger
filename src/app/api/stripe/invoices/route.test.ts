import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(() => ({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

const mockStripeInvoicesList = vi.fn();

vi.mock("@/lib/stripe", () => ({
  stripe: {
    invoices: { list: (...args: unknown[]) => mockStripeInvoicesList(...args) },
  },
}));

import { GET } from "./route";
import { createServerClient } from "@/lib/supabase/server";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";

function mockSupabaseWithCustomer(customerId: string | null): void {
  vi.mocked(createServerClient).mockResolvedValueOnce({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({
            data: customerId ? { stripe_customer_id: customerId } : null,
            error: null,
          }),
        }),
      }),
    }),
  } as never);
}

describe("GET /api/stripe/invoices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    vi.mocked(getAuthOrgId).mockReturnValueOnce({ orgId: null, userId: null, userEmail: null });
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns empty array when no stripe customer", async () => {
    mockSupabaseWithCustomer(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.invoices).toEqual([]);
  });

  it("returns formatted invoices with cents converted to dollars", async () => {
    mockSupabaseWithCustomer("cus_123");
    mockStripeInvoicesList.mockResolvedValue({
      data: [
        {
          id: "inv_1",
          created: 1704067200,
          amount_paid: 14900,
          status: "paid",
          invoice_pdf: "https://pay.stripe.com/inv_1/pdf",
        },
        {
          id: "inv_2",
          created: 1706745600,
          amount_paid: 2500,
          status: "paid",
          invoice_pdf: null,
        },
      ],
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invoices).toHaveLength(2);
    expect(body.invoices[0].amount).toBe(149); // 14900 cents → $149
    expect(body.invoices[1].amount).toBe(25);  // 2500 cents → $25
  });

  it("formats invoice dates as ISO strings", async () => {
    mockSupabaseWithCustomer("cus_123");
    mockStripeInvoicesList.mockResolvedValue({
      data: [
        {
          id: "inv_1",
          created: 1704067200, // 2024-01-01T00:00:00Z
          amount_paid: 0,
          status: "draft",
          invoice_pdf: null,
        },
      ],
    });

    const res = await GET();
    const body = await res.json();
    expect(body.invoices[0].date).toBe(new Date(1704067200 * 1000).toISOString());
  });

  it("returns invoice status and pdfUrl fields", async () => {
    mockSupabaseWithCustomer("cus_123");
    mockStripeInvoicesList.mockResolvedValue({
      data: [
        {
          id: "inv_1",
          created: 1704067200,
          amount_paid: 14900,
          status: "paid",
          invoice_pdf: "https://pay.stripe.com/inv_1/pdf",
        },
      ],
    });

    const res = await GET();
    const body = await res.json();
    expect(body.invoices[0].status).toBe("paid");
    expect(body.invoices[0].pdfUrl).toBe("https://pay.stripe.com/inv_1/pdf");
    expect(body.invoices[0].id).toBe("inv_1");
  });

  it("returns 500 when Stripe API throws", async () => {
    mockSupabaseWithCustomer("cus_123");
    mockStripeInvoicesList.mockRejectedValue(new Error("Stripe API error"));

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch invoices");
  });

  it("includes Cache-Control no-store header", async () => {
    mockSupabaseWithCustomer("cus_123");
    mockStripeInvoicesList.mockResolvedValue({ data: [] });

    const res = await GET();
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns empty invoices array when customer has no invoices", async () => {
    mockSupabaseWithCustomer("cus_456");
    mockStripeInvoicesList.mockResolvedValue({ data: [] });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.invoices).toEqual([]);
  });
});

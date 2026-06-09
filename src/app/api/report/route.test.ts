import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => ({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

function createRequest(params: Record<string, string>) {
  const url = new URL("http://localhost/api/report");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString(), { method: "POST" });
}

describe("POST /api/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockReturnValue({ orgId: null } as never);

    const { POST } = await import("./route");
    const res = await POST(createRequest({ format: "csv", type: "grants" }) as never);
    expect(res.status).toBe(401);

    vi.mocked(auth).mockReturnValue({ orgId: "org_1" } as never);
  });

  it("returns 400 for invalid format", async () => {
    const { POST } = await import("./route");
    const res = await POST(createRequest({ format: "json", type: "grants" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid type", async () => {
    const { POST } = await import("./route");
    const res = await POST(createRequest({ format: "csv", type: "budgets" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns CSV for grants", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [{ id: "1", name: "Test Grant", funding_agency: "HUD", cfda_number: "14.218", award_number: "B-24", award_date: "2024-06-01", period_start: "2024-07-01", period_end: "2025-06-30", total_amount: 100000, omb_framework: "pre_oct_2024" }],
            error: null,
          })),
        })),
      })),
    });

    const { POST } = await import("./route");
    const res = await POST(createRequest({ format: "csv", type: "grants" }) as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("text/csv");
    const text = await res.text();
    expect(text).toContain("Test Grant");
    expect(text).toContain("HUD");
  });

  it("returns CSV for expenses", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [{ id: "1", grant_id: "g1", vendor: "Acme", description: "Office supplies", amount: 250, date: "2024-08-15", ai_category: "supplies", ai_confidence: "high", ai_cfr_citation: "200.453", confirmed_category: null, status: "pending_review", confirmed_by: null, confirmed_at: null }],
            error: null,
          })),
        })),
      })),
    });

    const { POST } = await import("./route");
    const res = await POST(createRequest({ format: "csv", type: "expenses" }) as never);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Acme");
    expect(text).toContain("Office supplies");
  });

  it("sanitizes CSV injection characters in grant names", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: [{ id: "1", name: "=SUM(A1)", funding_agency: "+cmd", cfda_number: null, award_number: null, award_date: "2024-06-01", period_start: "2024-07-01", period_end: "2025-06-30", total_amount: 100000, omb_framework: "pre_oct_2024" }],
            error: null,
          })),
        })),
      })),
    });

    const { POST } = await import("./route");
    const res = await POST(createRequest({ format: "csv", type: "grants" }) as never);
    const text = await res.text();
    expect(text).toContain("'=SUM(A1)");
    expect(text).toContain("'+cmd");
  });

  it("returns 500 when grants query fails", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            data: null,
            error: { message: "DB error" },
          })),
        })),
      })),
    });

    const { POST } = await import("./route");
    const res = await POST(createRequest({ format: "csv", type: "grants" }) as never);
    expect(res.status).toBe(500);
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => ({ orgId: "org_123", userId: "user_abc", userEmail: "user@test.com" })),
}));

vi.mock("@/lib/auth/api-guard", () => ({
  requireActiveSubscription: vi.fn(() => null),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/audit/log-activity", () => ({
  logActivity: vi.fn(),
}));

vi.mock("@/lib/posthog-server", () => ({
  trackServerEvent: vi.fn(),
}));

vi.mock("@/lib/api/rate-limit", () => ({
  createRateLimiter: () => ({
    check: () => ({ allowed: true, remaining: 99, resetAt: Date.now() + 900000 }),
    _map: new Map(),
  }),
  rateLimitResponse: vi.fn(),
}));

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

vi.mock("@/lib/queries/budget-actual", () => ({
  getBudgetVsActual: vi.fn(() => Promise.resolve({ categories: [] })),
}));

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: vi.fn(() => Promise.resolve(Buffer.from("pdf"))),
}));

vi.mock("@/lib/reports/pdf-generator", () => ({
  GrantComplianceReport: vi.fn(),
}));

vi.mock("@/lib/reports/csv-generator", () => ({
  generateExpenseCSV: vi.fn(() => "date,vendor,amount\n"),
  generateBudgetSummaryCSV: vi.fn(() => "category,budgeted,spent\n"),
  generateMonthlyBreakdownCSV: vi.fn(() => "month,supplies,total\n"),
}));

describe("POST /api/grants/[id]/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no orgId", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockReturnValue({ orgId: null, userId: null } as never);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(401);

    // Reset mock
    vi.mocked(auth).mockReturnValue({ orgId: "org_123", userId: "user_abc" } as never);
  });

  it("returns 403 when subscription is blocked", async () => {
    const { requireActiveSubscription } = await import("@/lib/auth/api-guard");
    const { NextResponse } = await import("next/server");
    vi.mocked(requireActiveSubscription).mockResolvedValueOnce(
      NextResponse.json({ error: "Subscription required" }, { status: 403 })
    );

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Subscription required");
  });

  it("returns 404 for a grant not belonging to the org", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: null, error: { message: "Not found" } })
                ),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_999/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv" }),
    });

    const response = await POST(request, { params: { id: "grant_999" } });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Grant not found");
  });

  it("returns 500 when expenses query fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1",
                      org_id: "org_123",
                      name: "Test Grant",
                      funding_agency: "DOE",
                      cfda_number: null,
                      award_number: null,
                      period_start: "2024-01-01",
                      period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024",
                      total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        // Return a chain that resolves with an error
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: null; error: { message: string } }) => void) => {
            resolve({ data: null, error: { message: "DB connection lost" } });
          },
        });
        return chain;
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("An internal error occurred");
  });

  it("CSV generation returns 200 with text/csv content-type", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1",
                      org_id: "org_123",
                      name: "Test Grant",
                      funding_agency: "DOE",
                      cfda_number: null,
                      award_number: null,
                      period_start: "2024-01-01",
                      period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024",
                      total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [
                {
                  id: "exp_1",
                  date: "2024-06-01",
                  vendor: "Acme",
                  description: "Supplies",
                  amount: 100,
                  status: "confirmed",
                  confirmed_category: "supplies",
                  ai_category: "supplies",
                  ai_confidence: "high",
                  ai_cfr_citation: "200.453",
                  confirmed_by: "user_1",
                  confirmed_at: "2024-06-02",
                },
              ],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv");
  });

  it("filters expenses by org_id (defense-in-depth)", async () => {
    const eqCalls: string[][] = [];

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1",
                      org_id: "org_123",
                      name: "Test Grant",
                      funding_agency: "DOE",
                      cfda_number: null,
                      award_number: null,
                      period_start: "2024-01-01",
                      period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024",
                      total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        // Track .eq() calls to verify org_id filter is present
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn((col: string, val: string) => {
            eqCalls.push([col, val]);
            return chain;
          }),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
          then: vi.fn((resolve: (val: { data: never[] }) => void) =>
            resolve({ data: [] })
          ),
        };
        // Make it thenable so await works
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: never[] }) => void) => {
            resolve({ data: [] });
          },
        });
        return chain;
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv" }),
    });

    await POST(request, { params: { id: "grant_1" } });

    // Verify that .eq("org_id", "org_123") was called on the expenses query
    const orgIdFilter = eqCalls.find(
      ([col, val]) => col === "org_id" && val === "org_123"
    );
    expect(orgIdFilter).toBeDefined();
  });

  it("PDF generation returns 200 with application/pdf content-type", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1",
                      org_id: "org_123",
                      name: "Test Grant",
                      funding_agency: "DOE",
                      cfda_number: null,
                      award_number: null,
                      period_start: "2024-01-01",
                      period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024",
                      total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [
                {
                  id: "exp_1",
                  date: "2024-06-01",
                  vendor: "Acme",
                  description: "Supplies",
                  amount: 100,
                  status: "confirmed",
                  confirmed_category: "supplies",
                  ai_category: "supplies",
                  ai_confidence: "high",
                  ai_cfr_citation: "200.453",
                  confirmed_by: "user_1",
                  confirmed_at: "2024-06-02",
                },
              ],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "pdf" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
  });

  it("returns 400 when no expenses to export", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1",
                      org_id: "org_123",
                      name: "Test Grant",
                      funding_agency: "DOE",
                      cfda_number: null,
                      award_number: null,
                      period_start: "2024-01-01",
                      period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024",
                      total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: never[]; error: null }) => void) => {
            resolve({ data: [], error: null });
          },
        });
        return chain;
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("No expenses to export");
  });

  it("returns 400 when date_start > date_end", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "csv",
        date_start: "2025-06-01T00:00:00.000Z",
        date_end: "2024-01-01T00:00:00.000Z",
      }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid format value", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "xlsx" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid report_type", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ report_type: "invalid_type", format: "csv" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(400);
  });

  it("returns 400 for malformed JSON body", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json{{{",
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid JSON");
  });

  it("CSV expense_detail calls generateExpenseCSV", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1", org_id: "org_123", name: "Test Grant",
                      funding_agency: "DOE", cfda_number: null, award_number: null,
                      period_start: "2024-01-01", period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024", total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [{
                id: "exp_1", date: "2024-06-01", vendor: "Acme", description: "Supplies",
                amount: 100, status: "confirmed", confirmed_category: "supplies",
                ai_category: "supplies", ai_confidence: "high", ai_cfr_citation: "200.453",
                confirmed_by: "user_1", confirmed_at: "2024-06-02",
              }],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { generateExpenseCSV } = await import("@/lib/reports/csv-generator");
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv", report_type: "expense_detail" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(200);
    expect(generateExpenseCSV).toHaveBeenCalled();
  });

  it("CSV budget_summary calls generateBudgetSummaryCSV", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1", org_id: "org_123", name: "Test Grant",
                      funding_agency: "DOE", cfda_number: null, award_number: null,
                      period_start: "2024-01-01", period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024", total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [{
                id: "exp_1", date: "2024-06-01", vendor: "Acme", description: "Supplies",
                amount: 100, status: "confirmed", confirmed_category: "supplies",
                ai_category: "supplies", ai_confidence: "high", ai_cfr_citation: "200.453",
                confirmed_by: "user_1", confirmed_at: "2024-06-02",
              }],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { generateBudgetSummaryCSV } = await import("@/lib/reports/csv-generator");
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv", report_type: "budget_summary" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(200);
    expect(generateBudgetSummaryCSV).toHaveBeenCalled();
  });

  it("CSV monthly_breakdown calls generateMonthlyBreakdownCSV", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1", org_id: "org_123", name: "Test Grant",
                      funding_agency: "DOE", cfda_number: null, award_number: null,
                      period_start: "2024-01-01", period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024", total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [{
                id: "exp_1", date: "2024-06-01", vendor: "Acme", description: "Supplies",
                amount: 100, status: "confirmed", confirmed_category: "supplies",
                ai_category: "supplies", ai_confidence: "high", ai_cfr_citation: "200.453",
                confirmed_by: "user_1", confirmed_at: "2024-06-02",
              }],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { generateMonthlyBreakdownCSV } = await import("@/lib/reports/csv-generator");
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv", report_type: "monthly_breakdown" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(200);
    expect(generateMonthlyBreakdownCSV).toHaveBeenCalled();
  });

  it("include_pending=false filters to confirmed only", async () => {
    const eqCalls: string[][] = [];

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1", org_id: "org_123", name: "Test Grant",
                      funding_agency: "DOE", cfda_number: null, award_number: null,
                      period_start: "2024-01-01", period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024", total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn((col: string, val: string) => {
            eqCalls.push([col, val]);
            return chain;
          }),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [{
                id: "exp_1", date: "2024-06-01", vendor: "Acme", description: "Test",
                amount: 50, status: "confirmed", confirmed_category: "supplies",
                ai_category: "supplies", ai_confidence: "high", ai_cfr_citation: "200.453",
                confirmed_by: "user_1", confirmed_at: "2024-06-02",
              }],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv", include_pending: false }),
    });

    await POST(request, { params: { id: "grant_1" } });

    // With include_pending=false, should use .eq("status", "confirmed")
    const statusFilter = eqCalls.find(([col]) => col === "status");
    expect(statusFilter).toBeDefined();
    expect(statusFilter?.[1]).toBe("confirmed");
  });

  it("include_pending=true uses .in() for both confirmed and pending_review", async () => {
    const inCalls: [string, string[]][] = [];

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1", org_id: "org_123", name: "Test Grant",
                      funding_agency: "DOE", cfda_number: null, award_number: null,
                      period_start: "2024-01-01", period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024", total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn((col: string, vals: string[]) => {
            inCalls.push([col, vals]);
            return chain;
          }),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [{
                id: "exp_1", date: "2024-06-01", vendor: "Acme", description: "Test",
                amount: 50, status: "pending_review", confirmed_category: null,
                ai_category: "supplies", ai_confidence: "medium", ai_cfr_citation: "200.453",
                confirmed_by: null, confirmed_at: null,
              }],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv", include_pending: true }),
    });

    await POST(request, { params: { id: "grant_1" } });

    // With include_pending=true, should use .in("status", ["confirmed", "pending_review"])
    const statusFilter = inCalls.find(([col]) => col === "status");
    expect(statusFilter).toBeDefined();
    expect(statusFilter?.[1]).toContain("confirmed");
    expect(statusFilter?.[1]).toContain("pending_review");
  });

  it("logs activity on successful CSV report generation", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1", org_id: "org_123", name: "Test Grant",
                      funding_agency: "DOE", cfda_number: null, award_number: null,
                      period_start: "2024-01-01", period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024", total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [{
                id: "exp_1", date: "2024-06-01", vendor: "Acme", description: "Supplies",
                amount: 100, status: "confirmed", confirmed_category: "supplies",
                ai_category: "supplies", ai_confidence: "high", ai_cfr_citation: "200.453",
                confirmed_by: "user_1", confirmed_at: "2024-06-02",
              }],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { POST } = await import("./route");
    const { logActivity } = await import("@/lib/audit/log-activity");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "csv" }),
    });

    await POST(request, { params: { id: "grant_1" } });

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org_123",
        action: "report_generated",
        grantId: "grant_1",
        details: expect.objectContaining({ format: "csv" }),
      })
    );
  });

  it("PDF render failure returns 500 with error message", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1", org_id: "org_123", name: "Test Grant",
                      funding_agency: "DOE", cfda_number: null, award_number: null,
                      period_start: "2024-01-01", period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024", total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [{
                id: "exp_1", date: "2024-06-01", vendor: "Acme", description: "Supplies",
                amount: 100, status: "confirmed", confirmed_category: "supplies",
                ai_category: "supplies", ai_confidence: "high", ai_cfr_citation: "200.453",
                confirmed_by: "user_1", confirmed_at: "2024-06-02",
              }],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { renderToBuffer } = await import("@react-pdf/renderer");
    vi.mocked(renderToBuffer).mockRejectedValueOnce(new Error("PDF rendering crashed"));

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "pdf" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to generate PDF report");
    const { logger: loggerMock } = await import("@/lib/logger");
    expect(loggerMock.error).toHaveBeenCalledWith(
      "Failed to generate PDF report",
      expect.any(Error)
    );
  });

  it("date range filters apply gte and lte on expenses query", async () => {
    const gteCalls: [string, string][] = [];
    const lteCalls: [string, string][] = [];

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1", org_id: "org_123", name: "Test Grant",
                      funding_agency: "DOE", cfda_number: null, award_number: null,
                      period_start: "2024-01-01", period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024", total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn((col: string, val: string) => {
            gteCalls.push([col, val]);
            return chain;
          }),
          lte: vi.fn((col: string, val: string) => {
            lteCalls.push([col, val]);
            return chain;
          }),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [{
                id: "exp_1", date: "2024-06-01", vendor: "Acme", description: "Test",
                amount: 50, status: "confirmed", confirmed_category: "supplies",
                ai_category: "supplies", ai_confidence: "high", ai_cfr_citation: "200.453",
                confirmed_by: "user_1", confirmed_at: "2024-06-02",
              }],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        format: "csv",
        date_start: "2024-03-01",
        date_end: "2024-09-30",
      }),
    });

    await POST(request, { params: { id: "grant_1" } });

    const dateGte = gteCalls.find(([col]) => col === "date");
    const dateLte = lteCalls.find(([col]) => col === "date");
    expect(dateGte).toBeDefined();
    expect(dateGte?.[1]).toBe("2024-03-01");
    expect(dateLte).toBeDefined();
    expect(dateLte?.[1]).toBe("2024-09-30");
  });

  it("PDF with null confirmed_category and null ai_category falls back to 'other'", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: {
                      id: "grant_1", org_id: "org_123", name: "Test Grant",
                      funding_agency: "DOE", cfda_number: null, award_number: null,
                      period_start: "2024-01-01", period_end: "2025-01-01",
                      omb_framework: "pre_oct_2024", total_amount: 100000,
                    },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          in: vi.fn(() => chain),
          gte: vi.fn(() => chain),
          lte: vi.fn(() => chain),
          order: vi.fn(() => chain),
        };
        Object.defineProperty(chain, "then", {
          value: (resolve: (val: { data: Array<Record<string, unknown>>; error: null }) => void) => {
            resolve({
              data: [{
                id: "exp_1", date: "2024-06-01", vendor: "Mystery", description: "Unknown expense",
                amount: 75, status: "confirmed",
                confirmed_category: null,
                ai_category: null,
                ai_confidence: null, ai_cfr_citation: null,
                confirmed_by: "user_1", confirmed_at: "2024-06-02",
              }],
              error: null,
            });
          },
        });
        return chain;
      }
      return {};
    });

    const { renderToBuffer } = await import("@react-pdf/renderer");
    const mockRender = vi.mocked(renderToBuffer);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ format: "pdf" }),
    });

    const response = await POST(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(200);

    // renderToBuffer receives the React element with props containing the mapped expenses
    expect(mockRender).toHaveBeenCalledTimes(1);
    const element = mockRender.mock.calls[0][0] as unknown as { props: { expenses: Array<{ confirmed_category: string }> } };
    // The route does: e.confirmed_category || e.ai_category || "other"
    // Both are null, so it should fall back to "other"
    expect(element.props.expenses[0].confirmed_category).toBe("other");
  });
});

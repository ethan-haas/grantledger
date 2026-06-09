import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules before importing the route
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

const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();

const mockFrom = vi.fn((table: string) => {
  if (table === "grants") {
    return {
      select: mockSelect,
      insert: mockInsert,
      delete: () => ({ eq: mockEq }),
    };
  }
  if (table === "grant_budgets") {
    return { insert: mockInsert };
  }
  return {};
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

describe("GET /api/grants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no orgId", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockReturnValue({ orgId: null } as never);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/grants");
    const response = await GET(request);
    expect(response.status).toBe(401);

    vi.mocked(auth).mockReturnValue({ orgId: "org_123" } as never);
  });

  it("returns paginated grants with org_id filter", async () => {
    const eqCalls: string[][] = [];
    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn((col: string, val: string) => {
          eqCalls.push([col, val]);
          return {
            order: vi.fn(() => ({
              range: vi.fn(() =>
                Promise.resolve({ data: [{ id: "g1", name: "Grant 1" }], count: 1, error: null })
              ),
            })),
          };
        }),
      })),
    }) as never);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/grants?page=1&pageSize=10");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.grants).toBeDefined();
    expect(data.total).toBe(1);
    expect(data.total_pages).toBe(1);

    const orgFilter = eqCalls.find(([col, val]) => col === "org_id" && val === "org_123");
    expect(orgFilter).toBeDefined();
  });
});

describe("POST /api/grants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when no orgId", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockReturnValue({ orgId: null } as never);

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(401);

    vi.mocked(auth).mockReturnValue({ orgId: "org_123" } as never);
  });

  it("returns 400 when period_end < period_start", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Grant",
        funding_agency: "NIH",
        award_date: "2024-01-15",
        period_start: "2025-01-01",
        period_end: "2024-01-01",
        total_amount: 100000,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 201 with grant object on success", async () => {
    const fakeGrant = { id: "grant_new", name: "New Grant" };
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: fakeGrant, error: null })),
            })),
          })),
          select: mockSelect,
          delete: vi.fn(() => ({ eq: mockEq })),
        };
      }
      if (table === "grant_budgets") {
        return {
          insert: vi.fn(() => Promise.resolve({ error: null })),
        };
      }
      return {};
    });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "New Grant",
        funding_agency: "NIH",
        award_date: "2024-01-15",
        period_start: "2024-01-01",
        period_end: "2025-01-01",
        total_amount: 100000,
        budgets: { personnel: 50000, supplies: 50000 },
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe("grant_new");
  });

  it("returns 400 with invalid JSON body", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe("POST /api/grants - validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects negative budget amounts", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Grant",
        funding_agency: "NIH",
        award_date: "2024-01-15",
        period_start: "2024-01-01",
        period_end: "2025-01-01",
        total_amount: 100000,
        budgets: { personnel: -5000 },
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects NaN total_amount", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Grant",
        funding_agency: "NIH",
        award_date: "2024-01-15",
        period_start: "2024-01-01",
        period_end: "2025-01-01",
        total_amount: "not-a-number",
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 403 when subscription is blocked", async () => {
    const { requireActiveSubscription } = await import("@/lib/auth/api-guard");
    const { NextResponse } = await import("next/server");
    vi.mocked(requireActiveSubscription).mockResolvedValue(
      NextResponse.json({ error: "Subscription required" }, { status: 403 })
    );

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Grant",
        funding_agency: "NIH",
        award_date: "2024-01-15",
        period_start: "2024-01-01",
        period_end: "2025-01-01",
        total_amount: 100000,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(403);

    vi.mocked(requireActiveSubscription).mockResolvedValue(null);
  });
});

describe("GET /api/grants - error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 when DB query fails", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({ data: null, count: null, error: { message: "DB error" } })
            ),
          })),
        })),
      })),
    }) as never);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/grants");
    const response = await GET(request);
    expect(response.status).toBe(500);
  });

  it("clamps page/pageSize to valid ranges", async () => {
    mockFrom.mockImplementation(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            range: vi.fn(() =>
              Promise.resolve({ data: [], count: 0, error: null })
            ),
          })),
        })),
      })),
    }) as never);

    const { GET } = await import("./route");
    // page=-5 should clamp to 1, pageSize=9999 should clamp to 100
    const request = new Request("http://localhost/api/grants?page=-5&pageSize=9999");
    const response = await GET(request);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.page).toBe(1);
    expect(data.per_page).toBe(100);
  });
});

describe("POST /api/grants - activity logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("logs activity on successful creation", async () => {
    const fakeGrant = { id: "grant_logged", name: "Logged Grant" };
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: fakeGrant, error: null })),
            })),
          })),
          select: mockSelect,
          delete: vi.fn(() => ({ eq: mockEq })),
        };
      }
      if (table === "grant_budgets") {
        return {
          insert: vi.fn(() => Promise.resolve({ error: null })),
        };
      }
      return {};
    });

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Logged Grant",
        funding_agency: "NIH",
        award_date: "2024-01-15",
        period_start: "2024-01-01",
        period_end: "2025-01-01",
        total_amount: 100000,
      }),
    });
    const response = await POST(request);
    expect(response.status).toBe(201);

    const { logActivity } = await import("@/lib/audit/log-activity");
    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "grant_created",
        grantId: "grant_logged",
      })
    );
  });
});

describe("POST /api/grants - budget rollback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes the grant and returns 500 when budget creation fails", async () => {
    const fakeGrant = { id: "grant_abc", name: "Test Grant" };

    // First call to from("grants").insert() succeeds
    // Second call to from("grant_budgets").insert() fails
    let grantInsertCalled = false;
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        if (!grantInsertCalled) {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: fakeGrant, error: null })
                ),
              })),
            })),
            select: mockSelect,
            delete: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
              })),
            })),
          };
        }
      }
      if (table === "grant_budgets") {
        return {
          insert: vi.fn(() =>
            Promise.resolve({
              error: { message: "Budget insert failed", code: "23505" },
            })
          ),
        };
      }
      return {};
    });

    // Import the route handler dynamically to get fresh mocks
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Grant",
        funding_agency: "NIH",
        award_date: "2024-01-15",
        period_start: "2024-01-01",
        period_end: "2025-01-01",
        total_amount: 100000,
        budgets: { personnel: 50000, supplies: 50000 },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("budget");

    // Verify grant delete was called (rollback)
    const deleteCall = mockFrom.mock.calls.find(
      (call) => call[0] === "grants"
    );
    expect(deleteCall).toBeDefined();
  });
});

// --- Phase 4: Grant POST validation boundaries ---

describe("POST /api/grants — schema boundary tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBody = {
    name: "Test Grant",
    funding_agency: "NIH",
    award_date: "2024-06-01",
    period_start: "2024-06-01",
    period_end: "2025-05-31",
    total_amount: 100000,
  };

  function makeGrantRequest(bodyOverrides: Record<string, unknown> = {}): Request {
    return new Request("http://localhost/api/grants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, ...bodyOverrides }),
    });
  }

  it("returns 400 when total_amount is 0", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeGrantRequest({ total_amount: 0 }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when total_amount is negative", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeGrantRequest({ total_amount: -1000 }));
    expect(response.status).toBe(400);
  });

  it("accepts grant name at 255 chars", async () => {
    const fakeGrant = { id: "grant_255", name: "A".repeat(255) };
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: fakeGrant, error: null })),
            })),
          })),
          select: mockSelect,
          delete: vi.fn(() => ({ eq: mockEq })),
        };
      }
      if (table === "grant_budgets") {
        return { insert: vi.fn(() => Promise.resolve({ error: null })) };
      }
      return {};
    });

    const { POST } = await import("./route");
    const response = await POST(makeGrantRequest({ name: "A".repeat(255) }));
    expect(response.status).toBe(201);
  });

  it("returns 400 when name exceeds 255 chars", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeGrantRequest({ name: "A".repeat(256) }));
    expect(response.status).toBe(400);
  });

  it("returns 400 for invalid award_date format", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeGrantRequest({ award_date: "January 15, 2024" }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when period_start equals period_end", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeGrantRequest({
      period_start: "2024-06-01",
      period_end: "2024-06-01",
    }));
    expect(response.status).toBe(400);
  });

  it("returns 400 when name is empty string", async () => {
    const { POST } = await import("./route");
    const response = await POST(makeGrantRequest({ name: "" }));
    expect(response.status).toBe(400);
  });
});

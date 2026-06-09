import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(() => ({ orgId: "org_123", userId: "user_1", userEmail: "user@test.com" })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Helper to build the chained query mock
function setupQueryMock() {
  const chain = {
    eq: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
  };
  return chain;
}

function setupServerClient(chain: ReturnType<typeof setupQueryMock>) {
  vi.mocked(createServerClient).mockResolvedValue({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => chain),
      })),
    })),
  } as never);
}

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

import { createServerClient } from "@/lib/supabase/server";

describe("GET /api/expenses — pagination bounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("clamps negative page to 1", async () => {
    const chain = setupQueryMock();
    setupServerClient(chain);

    const { GET } = await import("./route");

    const request = new Request("http://localhost/api/expenses?page=-5&pageSize=50");
    const response = await GET(request);
    const data = await response.json();

    expect(data.page).toBe(1);
  });

  it("clamps pageSize > 100 to 100", async () => {
    const chain = setupQueryMock();
    setupServerClient(chain);

    const { GET } = await import("./route");

    const request = new Request("http://localhost/api/expenses?page=1&pageSize=500");
    const response = await GET(request);
    const data = await response.json();

    expect(data.per_page).toBe(100);
  });

  it("clamps pageSize of 0 to 1", async () => {
    const chain = setupQueryMock();
    setupServerClient(chain);

    const { GET } = await import("./route");

    const request = new Request("http://localhost/api/expenses?page=1&pageSize=0");
    const response = await GET(request);
    const data = await response.json();

    expect(data.per_page).toBe(1);
  });
});

describe("GET /api/expenses — query param validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid grant_id format", async () => {
    const chain = setupQueryMock();
    setupServerClient(chain);

    const { GET } = await import("./route");

    const request = new Request("http://localhost/api/expenses?grant_id=not-a-uuid");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 for invalid status enum", async () => {
    const chain = setupQueryMock();
    setupServerClient(chain);

    const { GET } = await import("./route");

    const request = new Request("http://localhost/api/expenses?status=bogus_status");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBeDefined();
  });

  it("returns 200 with valid filter params", async () => {
    const chain = setupQueryMock();
    setupServerClient(chain);

    const { GET } = await import("./route");

    const request = new Request(
      "http://localhost/api/expenses?status=confirmed&confidence=high"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.expenses).toBeDefined();
  });
});

describe("GET /api/expenses — grant ownership validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when grant_id does not belong to org", async () => {
    // Mock: grants lookup returns null (not found for this org)
    const grantChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "grants") return grantChain;
        return { select: vi.fn() };
      }),
    } as never);

    const { GET } = await import("./route");

    const request = new Request(
      "http://localhost/api/expenses?grant_id=550e8400-e29b-41d4-a716-446655440000"
    );
    const response = await GET(request);

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("Grant not found");
  });
});

describe("GET /api/expenses — filters and error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("filters by date range (date_start + date_end)", async () => {
    const gteCalls: string[] = [];
    const lteCalls: string[] = [];

    const chain = {
      eq: vi.fn(() => chain),
      gte: vi.fn((col: string) => { gteCalls.push(col); return chain; }),
      lte: vi.fn((col: string) => { lteCalls.push(col); return chain; }),
      or: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");

    const request = new Request(
      "http://localhost/api/expenses?date_start=2024-01-01&date_end=2024-06-30"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(gteCalls).toContain("date");
    expect(lteCalls).toContain("date");
  });

  it("filters by amount range (amount_min + amount_max)", async () => {
    const gteCalls: string[] = [];
    const lteCalls: string[] = [];

    const chain = {
      eq: vi.fn(() => chain),
      gte: vi.fn((col: string) => { gteCalls.push(col); return chain; }),
      lte: vi.fn((col: string) => { lteCalls.push(col); return chain; }),
      or: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");

    const request = new Request(
      "http://localhost/api/expenses?amount_min=100&amount_max=5000"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(gteCalls).toContain("amount");
    expect(lteCalls).toContain("amount");
  });

  it("search parameter filters by vendor/description via ilike", async () => {
    const orCalls: string[] = [];

    const chain = {
      eq: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      lte: vi.fn(() => chain),
      or: vi.fn((filter: string) => { orCalls.push(filter); return chain; }),
      order: vi.fn(() => chain),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");

    const request = new Request(
      "http://localhost/api/expenses?search=staples"
    );
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(orCalls.length).toBeGreaterThan(0);
    expect(orCalls[0]).toContain("vendor.ilike");
    expect(orCalls[0]).toContain("description.ilike");
  });

  it("returns 500 when DB query fails", async () => {
    const chain = {
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(() => Promise.resolve({ data: null, count: null, error: { message: "DB down" } })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");

    const request = new Request("http://localhost/api/expenses");
    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("An internal error occurred");
  });

  it("returns correct pagination metadata", async () => {
    const chain = {
      eq: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(() => Promise.resolve({
        data: [{ id: "exp_1" }, { id: "exp_2" }],
        count: 25,
        error: null,
      })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");

    const request = new Request("http://localhost/api/expenses?page=2&pageSize=10");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.total).toBe(25);
    expect(body.page).toBe(2);
    expect(body.per_page).toBe(10);
    expect(body.total_pages).toBe(3); // ceil(25/10)
  });
});

describe("GET /api/expenses — schema validation boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("dir defaults to descending when omitted", async () => {
    const orderCalls: [string, { ascending: boolean }][] = [];
    const chain = {
      eq: vi.fn(() => chain),
      order: vi.fn((col: string, opts: { ascending: boolean }) => { orderCalls.push([col, opts]); return chain; }),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses?sort=amount");
    await GET(request);

    expect(orderCalls[0][0]).toBe("amount");
    // dir not provided → ascending should be false (desc)
    expect(orderCalls[0][1].ascending).toBe(false);
  });

  it("returns 400 for date_start with slash format YYYY/MM/DD", async () => {
    const chain = setupQueryMock();
    setupServerClient(chain);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses?date_start=2024/01/01");
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for negative amount_min", async () => {
    const chain = setupQueryMock();
    setupServerClient(chain);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses?amount_min=-100");
    const response = await GET(request);
    expect(response.status).toBe(400);
  });

  it("returns 200 for amount_min=0 (boundary)", async () => {
    const chain = {
      eq: vi.fn(() => chain),
      gte: vi.fn(() => chain),
      lte: vi.fn(() => chain),
      or: vi.fn(() => chain),
      order: vi.fn(() => chain),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses?amount_min=0");
    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it("search with % is escaped before ilike (dedicated)", async () => {
    const orCalls: string[] = [];
    const chain = {
      eq: vi.fn(() => chain),
      or: vi.fn((filter: string) => { orCalls.push(filter); return chain; }),
      order: vi.fn(() => chain),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses?search=100%25off");
    await GET(request);

    expect(orCalls.length).toBeGreaterThan(0);
    expect(orCalls[0]).toContain("\\%");
  });

  it("search with _ is escaped before ilike (dedicated)", async () => {
    const orCalls: string[] = [];
    const chain = {
      eq: vi.fn(() => chain),
      or: vi.fn((filter: string) => { orCalls.push(filter); return chain; }),
      order: vi.fn(() => chain),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses?search=test_value");
    await GET(request);

    expect(orCalls.length).toBeGreaterThan(0);
    expect(orCalls[0]).toContain("\\_");
  });
});

describe("GET /api/expenses — org-scoped data verification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expenses query includes .eq('org_id', orgId)", async () => {
    const eqCalls: [string, string][] = [];

    const chain = {
      eq: vi.fn((col: string, val: string) => { eqCalls.push([col, val]); return chain; }),
      order: vi.fn(() => chain),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn((col: string, val: string) => { eqCalls.push([col, val]); return chain; }),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses");
    await GET(request);

    const orgFilter = eqCalls.find(([col, val]) => col === "org_id" && val === "org_123");
    expect(orgFilter).toBeDefined();
  });

  it("grant ownership check includes both .eq('id') and .eq('org_id')", async () => {
    const grantEqCalls: [string, string][] = [];

    const grantChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn((col: string, val: string) => { grantEqCalls.push([col, val]); return grantChain; }),
      single: vi.fn().mockResolvedValue({ data: { id: "uuid-1" }, error: null }),
    };

    const expenseChain = {
      eq: vi.fn(() => expenseChain),
      order: vi.fn(() => expenseChain),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "grants") return grantChain;
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => expenseChain),
          })),
        };
      }),
    } as never);

    const { GET } = await import("./route");
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    const request = new Request(`http://localhost/api/expenses?grant_id=${uuid}`);
    await GET(request);

    const idFilter = grantEqCalls.find(([col]) => col === "id");
    const orgFilter = grantEqCalls.find(([col, val]) => col === "org_id" && val === "org_123");
    expect(idFilter).toBeDefined();
    expect(orgFilter).toBeDefined();
  });

  it("default sort is 'date' descending when sort param omitted", async () => {
    const orderCalls: [string, { ascending: boolean }][] = [];

    const chain = {
      eq: vi.fn(() => chain),
      order: vi.fn((col: string, opts: { ascending: boolean }) => { orderCalls.push([col, opts]); return chain; }),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses");
    await GET(request);

    expect(orderCalls.length).toBeGreaterThan(0);
    expect(orderCalls[0][0]).toBe("date");
    expect(orderCalls[0][1].ascending).toBe(false);
  });

  it("search with SQL wildcards % and _ is escaped before ilike", async () => {
    const orCalls: string[] = [];

    const chain = {
      eq: vi.fn(() => chain),
      or: vi.fn((filter: string) => { orCalls.push(filter); return chain; }),
      order: vi.fn(() => chain),
      range: vi.fn(() => Promise.resolve({ data: [], count: 0, error: null })),
    };

    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => chain),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses?search=100%25_off");
    await GET(request);

    expect(orCalls.length).toBeGreaterThan(0);
    // % should be escaped to \%
    expect(orCalls[0]).toContain("\\%");
    // _ should be escaped to \_
    expect(orCalls[0]).toContain("\\_");
  });
});

// --- Phase 2: Expenses GET auth gap + cache + invalid sort ---

describe("GET /api/expenses — auth and header tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when orgId is null", async () => {
    const { getAuthOrgId } = await import("@/lib/auth/clerk-compat");
    vi.mocked(getAuthOrgId).mockReturnValueOnce({ orgId: null, userId: null, userEmail: null });

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns Cache-Control no-store headers on success", async () => {
    const chain = setupQueryMock();
    setupServerClient(chain);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("returns 400 for invalid sort column", async () => {
    const chain = setupQueryMock();
    setupServerClient(chain);

    const { GET } = await import("./route");
    const request = new Request("http://localhost/api/expenses?sort=nonexistent");
    const response = await GET(request);

    expect(response.status).toBe(400);
  });
});

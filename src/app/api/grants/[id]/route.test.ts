import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock modules
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

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

describe("GET /api/grants/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for grant not in org (org_id mismatch)", async () => {
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

    const { GET } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_999");
    const response = await GET(request, { params: { id: "grant_999" } });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Grant not found");
  });

  it("returns 200 with grant + budgets", async () => {
    const mockGrant = { id: "grant_1", name: "Test Grant", org_id: "org_123" };
    const mockBudgets = [
      { category: "personnel", budgeted_amount: 5000 },
      { category: "supplies", budgeted_amount: 2000 },
    ];

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: mockGrant, error: null })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "grant_budgets") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({ data: mockBudgets, error: null })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const { GET } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1");
    const response = await GET(request, { params: { id: "grant_1" } });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.name).toBe("Test Grant");
    expect(data.budgets).toHaveLength(2);
    expect(data.budgets[0].category).toBe("personnel");
  });
});

describe("PATCH /api/grants/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects period_end before period_start", async () => {
    const { PATCH } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        period_start: "2025-06-01",
        period_end: "2024-01-01",
      }),
    });

    const response = await PATCH(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("rejects unknown-only fields (no valid fields to update)", async () => {
    const { PATCH } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ unknownField: "value", anotherUnknown: 123 }),
    });

    const response = await PATCH(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("No valid fields to update");
  });

  it("rejects negative total_amount", async () => {
    const { PATCH } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        total_amount: -5000,
      }),
    });

    const response = await PATCH(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(400);
  });

  it("returns 404 for budget-only PATCH on foreign grant (ownership check)", async () => {
    // Ownership check returns null — grant not in this org
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

    const { PATCH } = await import("./route");

    const request = new Request("http://localhost/api/grants/foreign_grant_id", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgets: { personnel: 999 } }),
    });

    const response = await PATCH(request, { params: { id: "foreign_grant_id" } });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("Grant not found");
  });
});

describe("PATCH /api/grants/[id] — refetch failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 when refetch after update fails", async () => {
    let grantCallCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        grantCallCount++;
        if (grantCallCount === 1) {
          // Ownership check succeeds
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({ data: { id: "grant_1" }, error: null })
                  ),
                })),
              })),
            })),
          };
        }
        if (grantCallCount === 2) {
          // The update call succeeds
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
              })),
            })),
          };
        }
        // The refetch call fails
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: null, error: { message: "DB error" } })
                ),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { PATCH } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Grant" }),
    });

    const response = await PATCH(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("An internal error occurred");
  });
});

describe("PATCH /api/grants/[id] — budget refetch failure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 when budget refetch after update fails", async () => {
    let grantCallCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        grantCallCount++;
        if (grantCallCount === 1) {
          // Ownership check succeeds
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({ data: { id: "grant_1" }, error: null })
                  ),
                })),
              })),
            })),
          };
        }
        if (grantCallCount === 2) {
          // The update call succeeds
          return {
            update: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ error: null })),
              })),
            })),
          };
        }
        // The refetch call succeeds
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: "grant_1", name: "Updated" }, error: null })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "grant_budgets") {
        // Budget refetch fails
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() =>
                Promise.resolve({ data: null, error: { message: "DB error on budgets" } })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const { PATCH } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Grant" }),
    });

    const response = await PATCH(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("An internal error occurred");
  });
});

describe("PATCH /api/grants/[id] — subscription gating", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when subscription is blocked", async () => {
    const { requireActiveSubscription } = await import("@/lib/auth/api-guard");
    const { NextResponse } = await import("next/server");
    vi.mocked(requireActiveSubscription).mockResolvedValue(
      NextResponse.json({ error: "Subscription required" }, { status: 403 })
    );

    const { PATCH } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });

    const response = await PATCH(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(403);

    vi.mocked(requireActiveSubscription).mockResolvedValue(null);
  });

  it("rejects invalid category name in budgets", async () => {
    const { PATCH } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgets: { invalid_category_xyz: 5000 } }),
    });

    const response = await PATCH(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(400);
  });
});

describe("PATCH /api/grants/[id] — budget race conditions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("PATCH budget: partial Promise.all failure (2/3 succeed) returns 500", async () => {
    let budgetUpdateCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: "grant_1" }, error: null })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "grant_budgets") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => {
                budgetUpdateCount++;
                // Third category update fails
                if (budgetUpdateCount === 3) {
                  return Promise.resolve({ error: { message: "constraint violation" } });
                }
                return Promise.resolve({ error: null });
              }),
            })),
          })),
        };
      }
      return {};
    });

    const { PATCH } = await import("./route");
    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgets: { personnel: 5000, travel: 3000, supplies: 2000 } }),
    });

    const response = await PATCH(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toContain("Failed to update budget");
  });

  it("PATCH budget: all category update mocks are called despite partial failure", async () => {
    const budgetUpdateCalls: string[] = [];
    let grantCallCount = 0;
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        grantCallCount++;
        if (grantCallCount <= 2) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({ data: { id: "grant_1", name: "Test" }, error: null })
                  ),
                })),
              })),
            })),
          };
        }
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      if (table === "grant_budgets") {
        return {
          update: vi.fn(() => ({
            // First eq: .eq("grant_id", params.id)
            eq: vi.fn(() => ({
              // Second eq: .eq("category", category) — this has the category name
              eq: vi.fn((_col: string, cat: string) => {
                budgetUpdateCalls.push(cat);
                return Promise.resolve({ error: null });
              }),
            })),
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn(() =>
                Promise.resolve({ data: [{ budgeted_amount: 10000 }], error: null })
              ),
              order: vi.fn(() =>
                Promise.resolve({ data: [{ category: "personnel", budgeted_amount: 5000 }], error: null })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const { PATCH } = await import("./route");
    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgets: { personnel: 5000, travel: 3000 } }),
    });

    await PATCH(request, { params: { id: "grant_1" } });

    // Promise.all invokes all category updates (not short-circuit)
    expect(budgetUpdateCalls).toContain("personnel");
    expect(budgetUpdateCalls).toContain("travel");
  });

  it("PATCH budget: total recalculation runs after category updates", async () => {
    const neqCalls: string[] = [];
    let totalUpdateCalled = false;
    let grantCallCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        grantCallCount++;
        if (grantCallCount <= 2) {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  single: vi.fn(() =>
                    Promise.resolve({ data: { id: "grant_1", name: "Test" }, error: null })
                  ),
                })),
              })),
            })),
          };
        }
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      if (table === "grant_budgets") {
        return {
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn((_col: string, val: string) => {
                if (val === "total") totalUpdateCalled = true;
                return Promise.resolve({ error: null });
              }),
            })),
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              neq: vi.fn((col: string) => {
                neqCalls.push(col);
                return Promise.resolve({
                  data: [{ budgeted_amount: 5000 }, { budgeted_amount: 3000 }],
                  error: null,
                });
              }),
              order: vi.fn(() =>
                Promise.resolve({ data: [{ category: "personnel", budgeted_amount: 5000 }], error: null })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const { PATCH } = await import("./route");
    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgets: { personnel: 5000 } }),
    });

    await PATCH(request, { params: { id: "grant_1" } });

    // Budget sum query should use .neq("category", "total")
    expect(neqCalls).toContain("category");
    // Total update should have been called
    expect(totalUpdateCalled).toBe(true);
  });

  it("DELETE: no budget writes occur after 404 ownership check", async () => {
    const updateMock = vi.fn();

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() =>
                  Promise.resolve({ data: [], error: null })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "grant_budgets") {
        return { update: updateMock };
      }
      return {};
    });

    const { DELETE } = await import("./route");
    const request = new Request("http://localhost/api/grants/grant_1", { method: "DELETE" });
    const response = await DELETE(request, { params: { id: "grant_1" } });

    expect(response.status).toBe(404);
    // No budget update should have been called
    expect(updateMock).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/grants/[id] — error handling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 500 when DB error occurs during delete", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() =>
                  Promise.resolve({ data: null, error: { message: "DB connection lost" } })
                ),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { DELETE } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "DELETE",
    });

    const response = await DELETE(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("An internal error occurred");
  });

  it("returns 401 when orgId is null", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockReturnValue({ orgId: null } as never);

    const { DELETE } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "DELETE",
    });

    const response = await DELETE(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(401);

    vi.mocked(auth).mockReturnValue({ orgId: "org_123", userId: "user_abc", userEmail: "user@test.com" } as never);
  });
});

describe("DELETE /api/grants/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 for grant not in org", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() =>
                  Promise.resolve({ data: [], error: null })
                ),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { DELETE } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_999", {
      method: "DELETE",
    });

    const response = await DELETE(request, { params: { id: "grant_999" } });
    expect(response.status).toBe(404);
  });

  it("returns 204 on successful delete", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          delete: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                select: vi.fn(() =>
                  Promise.resolve({ data: [{ id: "grant_1" }], error: null })
                ),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { DELETE } = await import("./route");

    const request = new Request("http://localhost/api/grants/grant_1", {
      method: "DELETE",
    });

    const response = await DELETE(request, { params: { id: "grant_1" } });
    expect(response.status).toBe(204);
  });
});

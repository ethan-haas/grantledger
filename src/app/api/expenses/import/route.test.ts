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

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({ from: vi.fn() })),
}));

vi.mock("@/lib/openai/prompts", () => ({
  buildCategorizationPrompt: vi.fn(() => "system prompt"),
}));

vi.mock("@/lib/openai/batch-categorize", () => ({
  batchCategorize: vi.fn(() => Promise.resolve([])),
}));

import { auth } from "@clerk/nextjs/server";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { logActivity } from "@/lib/audit/log-activity";

describe("POST /api/expenses/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects expenses with negative amounts", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          {
            date: "2024-06-15",
            vendor: "Office Depot",
            description: "Supplies",
            amount: -100,
          },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("rejects expenses with zero amounts", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          {
            date: "2024-06-15",
            vendor: "Office Depot",
            description: "Supplies",
            amount: 0,
          },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 413 when Content-Length exceeds 5MB", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "6000000",
      },
      body: JSON.stringify({ grant_id: "x", expenses: [] }),
    });

    const response = await POST(request);
    expect(response.status).toBe(413);
    const data = await response.json();
    expect(data.error).toBe("Payload too large");
  });

  it("logs failed AI categorization updates during import", async () => {
    // Setup grant lookup and expense insert to succeed
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() =>
                  Promise.resolve({ data: [], error: null })
                ),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: [
                  { id: "exp_1", vendor: "Staples", description: "Supplies", amount: 50, account: null },
                ],
                error: null,
              })
            ),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({ error: { message: "AI update failed" } })
              ),
            })),
          })),
        };
      }
      return {};
    });

    const { batchCategorize } = await import("@/lib/openai/batch-categorize");
    vi.mocked(batchCategorize).mockResolvedValueOnce([
      { id: "exp_1", result: { category: "supplies", confidence: "high", cfr_citation: "§200.453" } },
    ]);

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [] })),
        })),
      })),
    } as never);

    const { POST } = await import("./route");
    const { logger } = await import("@/lib/logger");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "Staples", description: "Supplies", amount: 50 },
        ],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    // Import should succeed even if AI update fails
    expect(body.imported).toBe(1);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to update AI categorization on expenses",
      expect.objectContaining({ error_count: 1 })
    );
  });

  it("returns 500 when dedup query fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() =>
                  Promise.resolve({ data: null, error: { message: "DB connection lost" } })
                ),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { POST } = await import("./route");
    const { logger } = await import("@/lib/logger");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "Staples", description: "Supplies", amount: 50 },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(logger.error).toHaveBeenCalledWith(
      "Dedup query failed",
      expect.objectContaining({ grantId: "550e8400-e29b-41d4-a716-446655440000" })
    );
  });

  it("returns 400 for invalid date format", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          {
            date: "06/15/2024",
            vendor: "Office Depot",
            description: "Supplies",
            amount: 50,
          },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for empty vendor string", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          {
            date: "2024-06-15",
            vendor: "",
            description: "Supplies",
            amount: 50,
          },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for amount exceeding maximum", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          {
            date: "2024-06-15",
            vendor: "Office Depot",
            description: "Supplies",
            amount: 2_000_000_000,
          },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 when expenses array is empty", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 404 when grant not in org", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: null, error: null })
                ),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          {
            date: "2024-06-15",
            vendor: "Office Depot",
            description: "Supplies",
            amount: 50.0,
          },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it("returns 200 with zero new when all expenses are duplicates", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() =>
                  // Return all external_ids as existing → all dupes
                  Promise.resolve({
                    data: [{ external_id: "ext_1" }, { external_id: "ext_2" }],
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "Vendor A", description: "Item A", amount: 50, external_id: "ext_1" },
          { date: "2024-06-16", vendor: "Vendor B", description: "Item B", amount: 75, external_id: "ext_2" },
        ],
      }),
    });

    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.imported).toBe(0);
    expect(body.duplicates_skipped).toBe(2);
  });

  it("returns 500 when DB insert fails", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() =>
                  Promise.resolve({ data: [], error: null })
                ),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: "disk full" },
              })
            ),
          })),
        };
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "Staples", description: "Pens", amount: 25 },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("handles batchCategorize throwing gracefully", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() =>
                  Promise.resolve({ data: [], error: null })
                ),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "exp_1", vendor: "Staples", description: "Paper", amount: 30, account: null }],
                error: null,
              })
            ),
          })),
        };
      }
      return {};
    });

    const { batchCategorize } = await import("@/lib/openai/batch-categorize");
    vi.mocked(batchCategorize).mockRejectedValueOnce(new Error("OpenAI API down"));

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [] })),
        })),
      })),
    } as never);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "Staples", description: "Paper", amount: 30 },
        ],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    // Import succeeds but flags categorization_error
    expect(response.status).toBe(200);
    expect(body.imported).toBe(1);
    expect(body.categorization_error).toBe(true);
  });

  it("rejects body with more than 1000 expenses", async () => {
    const { POST } = await import("./route");

    const expenses = Array.from({ length: 1001 }, (_, i) => ({
      date: "2024-06-15",
      vendor: `Vendor ${i}`,
      description: "Item",
      amount: 10,
    }));

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses,
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for malformed JSON body", async () => {
    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json{{{",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("Invalid JSON");
  });

  it("returns 401 when orgId is null (unauthenticated)", async () => {
    vi.mocked(auth).mockReturnValueOnce({ orgId: null, userId: null, sessionClaims: null } as never);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [{ date: "2024-06-15", vendor: "Staples", description: "Supplies", amount: 50 }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 403 when subscription is blocked", async () => {
    const { NextResponse } = await import("next/server");
    vi.mocked(requireActiveSubscription).mockResolvedValueOnce(
      NextResponse.json({ error: "Subscription required" }, { status: 403 })
    );

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [{ date: "2024-06-15", vendor: "Staples", description: "Supplies", amount: 50 }],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Subscription required");
  });

  it("successful import with AI categorization happy path", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: [
                  { id: "exp_1", vendor: "Staples", description: "Paper", amount: 30, account: null },
                  { id: "exp_2", vendor: "FedEx", description: "Shipping", amount: 50, account: null },
                ],
                error: null,
              })
            ),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { batchCategorize } = await import("@/lib/openai/batch-categorize");
    vi.mocked(batchCategorize).mockResolvedValueOnce([
      { id: "exp_1", result: { category: "supplies", confidence: "high", cfr_citation: "§200.453" } },
      { id: "exp_2", result: { category: "other", confidence: "medium", cfr_citation: "§200.420" } },
    ]);

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as never);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "Staples", description: "Paper", amount: 30 },
          { date: "2024-06-16", vendor: "FedEx", description: "Shipping", amount: 50 },
        ],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imported).toBe(2);
    expect(body.categorized).toBe(2);
    expect(body.categorization_error).toBe(false);
  });

  it("logs activity on successful import", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "exp_1", vendor: "Staples", description: "Paper", amount: 30, account: null }],
                error: null,
              })
            ),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as never);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [{ date: "2024-06-15", vendor: "Staples", description: "Paper", amount: 30 }],
      }),
    });

    await POST(request);

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org_123",
        action: "expenses_imported",
        grantId: "550e8400-e29b-41d4-a716-446655440000",
        details: { count: 1 },
      })
    );
  });

  it("returns 200 with categorization_error: true when batchCategorize throws (explicit)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "post_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "exp_1", vendor: "V", description: "D", amount: 10, account: null }],
                error: null,
              })
            ),
          })),
        };
      }
      return {};
    });

    const { batchCategorize } = await import("@/lib/openai/batch-categorize");
    vi.mocked(batchCategorize).mockRejectedValueOnce(new Error("Rate limit exceeded"));

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as never);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [{ date: "2024-06-15", vendor: "V", description: "D", amount: 10 }],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imported).toBe(1);
    expect(body.categorization_error).toBe(true);
  });

  it("accepts exactly 1000 expenses (boundary)", async () => {
    const { POST } = await import("./route");

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: Array.from({ length: 1000 }, (_, i) => ({
                  id: `exp_${i}`, vendor: `V${i}`, description: "D", amount: 10, account: null,
                })),
                error: null,
              })
            ),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as never);

    const expenses = Array.from({ length: 1000 }, (_, i) => ({
      date: "2024-06-15",
      vendor: `Vendor ${i}`,
      description: "Item",
      amount: 10,
    }));

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses,
      }),
    });

    const response = await POST(request);
    // Should not be 400 — 1000 is the max, not 1001
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.imported).toBe(1000);
  });

  it("all duplicate expenses returns imported: 0, duplicates_skipped: N", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      { external_id: "ext_a" },
                      { external_id: "ext_b" },
                      { external_id: "ext_c" },
                    ],
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "A", description: "X", amount: 10, external_id: "ext_a" },
          { date: "2024-06-16", vendor: "B", description: "Y", amount: 20, external_id: "ext_b" },
          { date: "2024-06-17", vendor: "C", description: "Z", amount: 30, external_id: "ext_c" },
        ],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imported).toBe(0);
    expect(body.duplicates_skipped).toBe(3);
  });

  it("mixed new + duplicate expenses returns correct counts", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() =>
                  Promise.resolve({
                    data: [{ external_id: "ext_dup" }],
                    error: null,
                  })
                ),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "exp_new", vendor: "New", description: "New item", amount: 100, account: null }],
                error: null,
              })
            ),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { createAdminClient } = await import("@/lib/supabase/admin");
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as never);

    const { POST } = await import("./route");

    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "Dup", description: "Already imported", amount: 50, external_id: "ext_dup" },
          { date: "2024-06-16", vendor: "New", description: "New item", amount: 100, external_id: "ext_new" },
        ],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.imported).toBe(1);
  });

  // --- Phase 5: Import edge cases ---

  it("duplicate external_ids in same request are both inserted (dedup only checks DB)", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() =>
                  // DB has no existing IDs
                  Promise.resolve({ data: [], error: null })
                ),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: [
                  { id: "exp_a", vendor: "V", description: "D", amount: 10, account: null },
                  { id: "exp_b", vendor: "V", description: "D", amount: 20, account: null },
                ],
                error: null,
              })
            ),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { createAdminClient: cac } = await import("@/lib/supabase/admin");
    vi.mocked(cac).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as never);

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "V", description: "D", amount: 10, external_id: "dup_1" },
          { date: "2024-06-16", vendor: "V", description: "D", amount: 20, external_id: "dup_1" },
        ],
      }),
    });

    const response = await POST(request);
    const body = await response.json();
    expect(response.status).toBe(200);
    // Both inserted because dedup only checks DB, not intra-request
    expect(body.imported).toBe(2);
  });

  it("description at 2000 chars accepted", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "exp_long", vendor: "V", description: "D", amount: 50, account: null }],
                error: null,
              })
            ),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { createAdminClient: cac } = await import("@/lib/supabase/admin");
    vi.mocked(cac).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as never);

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "V", description: "D".repeat(2000), amount: 50 },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("description at 2001 chars returns 400", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "V", description: "D".repeat(2001), amount: 50 },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("external_id at 255 chars accepted", async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          insert: vi.fn(() => ({
            select: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "exp_eid", vendor: "V", description: "D", amount: 50, account: null }],
                error: null,
              })
            ),
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { createAdminClient: cac } = await import("@/lib/supabase/admin");
    vi.mocked(cac).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as never);

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "V", description: "D", amount: 50, external_id: "E".repeat(255) },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it("Infinity amount returns 400", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "V", description: "D", amount: Infinity },
        ],
      }),
    });

    const response = await POST(request);
    // Note: JSON.stringify(Infinity) → "null", which fails z.number()
    expect(response.status).toBe(400);
  });

  it("NaN amount returns 400", async () => {
    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "V", description: "D", amount: "not-a-number" },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("expenses without external_id get csv_ hash prefix", async () => {
    const insertedRows: Record<string, unknown>[] = [];
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({
                    data: { id: "550e8400-e29b-41d4-a716-446655440000", omb_framework: "pre_oct_2024" },
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => Promise.resolve({ data: [], error: null })),
              })),
            })),
          })),
          insert: vi.fn((rows: Record<string, unknown>[]) => {
            insertedRows.push(...rows);
            return {
              select: vi.fn(() =>
                Promise.resolve({
                  data: rows.map((r, i) => ({
                    id: `exp_${i}`,
                    vendor: r.vendor,
                    description: r.description,
                    amount: r.amount,
                    account: null,
                  })),
                  error: null,
                })
              ),
            };
          }),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ error: null })),
            })),
          })),
        };
      }
      return {};
    });

    const { createAdminClient: cac } = await import("@/lib/supabase/admin");
    vi.mocked(cac).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          or: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
    } as never);

    const { POST } = await import("./route");
    const request = new Request("http://localhost/api/expenses/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_id: "550e8400-e29b-41d4-a716-446655440000",
        expenses: [
          { date: "2024-06-15", vendor: "V", description: "D", amount: 50 },
        ],
      }),
    });

    await POST(request);

    expect(insertedRows.length).toBeGreaterThan(0);
    const externalId = insertedRows[0].external_id as string;
    expect(externalId).toMatch(/^csv_/);
    // csv_ prefix (4 chars) + 16 hex chars = 20 total
    expect(externalId).toHaveLength(20);
  });
});

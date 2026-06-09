import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(() => ({ orgId: "org_123", userId: "user_abc", userEmail: "user@test.com" })),
}));

vi.mock("@/lib/auth/api-guard", () => ({
  requireActiveSubscription: vi.fn(() => null),
}));

vi.mock("@/lib/audit/log-activity", () => ({
  logActivity: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
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

import { POST } from "./route";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { logActivity } from "@/lib/audit/log-activity";

function createGrantChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

function createExpenseSelectChain(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result);
  (p as unknown as Record<string, unknown>).select = vi.fn().mockReturnValue(p);
  (p as unknown as Record<string, unknown>).eq = vi.fn().mockReturnValue(p);
  return { select: vi.fn().mockReturnValue(p) };
}

function createExpenseUpdateChain(result: { error: unknown; count: unknown }) {
  return {
    update: vi.fn(() => ({
      in: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve(result)),
      })),
    })),
  };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/expenses/bulk-confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/expenses/bulk-confirm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthOrgId).mockReturnValueOnce({ orgId: null, userId: null, userEmail: null });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid grant_id format", async () => {
    const request = makeRequest({ grant_id: "not-a-uuid" });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 404 when grant doesn't belong to org", async () => {
    const grantChain = createGrantChain({ data: null, error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
      filter: { confidence: "high" },
    });

    const response = await POST(request);
    expect(response.status).toBe(404);

    const data = await response.json();
    expect(data.error).toBe("Grant not found");
  });

  it("returns 0 confirmed when count is null (not ids.length)", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [
        { id: "exp_1", ai_category: "travel", ai_confidence: "high" },
        { id: "exp_2", ai_category: "travel", ai_confidence: "high" },
      ],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);
    const expenseUpdateChain = createExpenseUpdateChain({ error: null, count: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain, ...expenseUpdateChain };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
      filter: { confidence: "high" },
    });

    const response = await POST(request);
    const data = await response.json();
    // With the fix, null count should give 0, not ids.length (2)
    expect(data.confirmed).toBe(0);
  });

  it("skips expenses with null ai_category", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [
        { id: "exp_1", ai_category: "travel", ai_confidence: "high" },
        { id: "exp_2", ai_category: null, ai_confidence: "high" },
        { id: "exp_3", ai_category: null, ai_confidence: "high" },
      ],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);
    const expenseUpdateChain = createExpenseUpdateChain({ error: null, count: 1 });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain, ...expenseUpdateChain };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
      filter: { confidence: "high" },
    });

    const response = await POST(request);
    const data = await response.json();
    // 1 confirmable (travel), 2 skipped (null ai_category)
    expect(data.confirmed).toBe(1);
    expect(data.skipped).toBe(2);
  });

  it("returns skipped count when all expenses have null ai_category", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [
        { id: "exp_1", ai_category: null, ai_confidence: "high" },
        { id: "exp_2", ai_category: null, ai_confidence: "medium" },
      ],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request);
    const data = await response.json();
    expect(data.confirmed).toBe(0);
    expect(data.failed).toBe(0);
    expect(data.skipped).toBe(2);
  });

  it("successfully confirms expenses for valid grant", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [
        { id: "exp_1", ai_category: "travel", ai_confidence: "high" },
        { id: "exp_2", ai_category: "supplies", ai_confidence: "high" },
      ],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);
    const expenseUpdateChain = createExpenseUpdateChain({ error: null, count: 1 });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain, ...expenseUpdateChain };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
      filter: { confidence: "high" },
    });

    const response = await POST(request);
    expect(response.status).not.toBe(404);
    const data = await response.json();
    // 2 expenses across 2 categories (travel, supplies) = 2 batch updates, each returning count: 1
    expect(data.confirmed).toBe(2);
  });

  it("returns 500 when expense fetch fails", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const fetchError = { message: "DB connection lost" };
    const p = Promise.resolve({ data: null, error: fetchError });
    (p as unknown as Record<string, unknown>).select = vi.fn().mockReturnValue(p);
    (p as unknown as Record<string, unknown>).eq = vi.fn().mockReturnValue(p);
    const expenseSelectChain = { select: vi.fn().mockReturnValue(p) };

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request);
    expect(response.status).toBe(500);
  });

  it("returns 200 with zero confirmed when no expenses match", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
      filter: { confidence: "high" },
    });

    const response = await POST(request);
    const data = await response.json();
    expect(data.confirmed).toBe(0);
  });

  it("handles mixed confidence levels in single batch", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [
        { id: "exp_1", ai_category: "travel", ai_confidence: "high" },
        { id: "exp_2", ai_category: "travel", ai_confidence: "low" },
        { id: "exp_3", ai_category: "supplies", ai_confidence: "medium" },
      ],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);
    const expenseUpdateChain = createExpenseUpdateChain({ error: null, count: 2 });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain, ...expenseUpdateChain };
      return {};
    });

    // No filter — should confirm all regardless of confidence
    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request);
    const data = await response.json();
    // 2 categories: travel (2 expenses), supplies (1 expense), count=2 per update
    expect(data.confirmed).toBe(4);
    expect(data.skipped).toBe(0);
  });

  it("returns 400 for empty JSON body", async () => {
    const request = new Request("http://localhost/api/expenses/bulk-confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json",
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 403 when subscription is blocked", async () => {
    const { NextResponse } = await import("next/server");
    vi.mocked(requireActiveSubscription).mockResolvedValueOnce(
      NextResponse.json({ error: "Subscription required" }, { status: 403 })
    );

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toBe("Subscription required");
  });

  it("per-category update: one category succeeds, another fails → partial counts", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [
        { id: "exp_1", ai_category: "travel", ai_confidence: "high" },
        { id: "exp_2", ai_category: "travel", ai_confidence: "high" },
        { id: "exp_3", ai_category: "supplies", ai_confidence: "high" },
      ],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);

    let updateCallCount = 0;
    const updateMock = {
      update: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn(() => {
            updateCallCount++;
            // First category update (travel) succeeds, second (supplies) fails
            if (updateCallCount === 1) {
              return Promise.resolve({ error: null, count: 2 });
            }
            return Promise.resolve({ error: { message: "DB timeout" }, count: null });
          }),
        })),
      })),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain, ...updateMock };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request);
    const data = await response.json();

    // travel (2 expenses) succeeded with count=2, supplies (1 expense) failed
    expect(data.confirmed).toBe(2);
    expect(data.failed).toBe(1);
  });

  it("logs activity on successful bulk confirm", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [
        { id: "exp_1", ai_category: "travel", ai_confidence: "high" },
      ],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);
    const expenseUpdateChain = createExpenseUpdateChain({ error: null, count: 1 });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain, ...expenseUpdateChain };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    await POST(request);

    expect(logActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: "org_123",
        action: "bulk_confirmed",
        grantId: "550e8400-e29b-41d4-a716-446655440000",
        details: { count: 1 },
      })
    );
  });

  it("handles filter with both confidence and category applied", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    // The select chain should be called with both filters
    const eqCalls: [string, string][] = [];
    const p = Promise.resolve({
      data: [
        { id: "exp_1", ai_category: "travel", ai_confidence: "high" },
      ],
      error: null,
    });
    (p as unknown as Record<string, unknown>).select = vi.fn().mockReturnValue(p);
    (p as unknown as Record<string, unknown>).eq = vi.fn((col: string, val: string) => {
      eqCalls.push([col, val]);
      return p;
    });
    const expenseSelectChain = { select: vi.fn().mockReturnValue(p) };
    const expenseUpdateChain = createExpenseUpdateChain({ error: null, count: 1 });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain, ...expenseUpdateChain };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
      filter: { confidence: "high", category: "travel" },
    });

    await POST(request);

    // Both filter conditions should be applied
    const confidenceFilter = eqCalls.find(([col]) => col === "ai_confidence");
    const categoryFilter = eqCalls.find(([col]) => col === "ai_category");
    expect(confidenceFilter).toBeDefined();
    expect(confidenceFilter?.[1]).toBe("high");
    expect(categoryFilter).toBeDefined();
    expect(categoryFilter?.[1]).toBe("travel");
  });

  it("expenses with all-null ai_category returns skipped count with zero confirmed and failed", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [
        { id: "exp_1", ai_category: null, ai_confidence: "low" },
        { id: "exp_2", ai_category: null, ai_confidence: "low" },
        { id: "exp_3", ai_category: null, ai_confidence: "low" },
      ],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request);
    const data = await response.json();
    expect(data.confirmed).toBe(0);
    expect(data.failed).toBe(0);
    expect(data.skipped).toBe(3);
  });

  it("update chain includes .eq('org_id', orgId) on writes", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [
        { id: "exp_1", ai_category: "travel", ai_confidence: "high" },
      ],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);

    // Capture what .eq receives on the update chain
    const updateEqCalls: [string, string][] = [];
    const updateMock = {
      update: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn((col: string, val: string) => {
            updateEqCalls.push([col, val]);
            return Promise.resolve({ error: null, count: 1 });
          }),
        })),
      })),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain, ...updateMock };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    await POST(request);

    // Update chain: .update({...}).in("id", ids).eq("org_id", orgId)
    const orgIdFilter = updateEqCalls.find(([col]) => col === "org_id");
    expect(orgIdFilter).toBeDefined();
    expect(orgIdFilter![1]).toBe("org_123");
  });

  it("select chain includes .eq('org_id', orgId) alongside grant_id and status", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const selectEqCalls: [string, string][] = [];
    const p = Promise.resolve({
      data: [],
      error: null,
    });
    (p as unknown as Record<string, unknown>).select = vi.fn().mockReturnValue(p);
    (p as unknown as Record<string, unknown>).eq = vi.fn((col: string, val: string) => {
      selectEqCalls.push([col, val]);
      return p;
    });
    const expenseSelectChain = { select: vi.fn().mockReturnValue(p) };

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    await POST(request);

    // Select chain should have all three filters
    const grantIdFilter = selectEqCalls.find(([col]) => col === "grant_id");
    const orgIdFilter = selectEqCalls.find(([col]) => col === "org_id");
    const statusFilter = selectEqCalls.find(([col]) => col === "status");
    expect(grantIdFilter).toBeDefined();
    expect(orgIdFilter).toBeDefined();
    expect(orgIdFilter![1]).toBe("org_123");
    expect(statusFilter).toBeDefined();
    expect(statusFilter![1]).toBe("pending_review");
  });

  it("3 categories: 2 succeed, 1 fails → confirmed counts only successful", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    const expenseSelectResult = {
      data: [
        { id: "exp_1", ai_category: "travel", ai_confidence: "high" },
        { id: "exp_2", ai_category: "supplies", ai_confidence: "high" },
        { id: "exp_3", ai_category: "personnel", ai_confidence: "high" },
      ],
      error: null,
    };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);

    let updateCallCount = 0;
    const updateMock = {
      update: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn(() => {
            updateCallCount++;
            // First 2 categories succeed, third fails
            if (updateCallCount <= 2) {
              return Promise.resolve({ error: null, count: 1 });
            }
            return Promise.resolve({ error: { message: "DB error" }, count: null });
          }),
        })),
      })),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain, ...updateMock };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request);
    const data = await response.json();

    // 2 categories succeeded (count=1 each), 1 failed (1 expense)
    expect(data.confirmed).toBe(2);
    expect(data.failed).toBe(1);
  });

  it("large batch with multiple categories groups correctly", async () => {
    const grantChain = createGrantChain({ data: { id: "grant_1" }, error: null });

    // 9 expenses across 3 categories
    const categories = ["travel", "supplies", "personnel"];
    const expenses = Array.from({ length: 9 }, (_, i) => ({
      id: `exp_${i}`,
      ai_category: categories[i % 3],
      ai_confidence: "high",
    }));

    const expenseSelectResult = { data: expenses, error: null };
    const expenseSelectChain = createExpenseSelectChain(expenseSelectResult);

    // Track update calls to verify grouping
    const updateCalls: string[][] = [];
    const updateMock = {
      update: vi.fn(() => ({
        in: vi.fn((_col: string, ids: string[]) => {
          updateCalls.push(ids);
          return {
            eq: vi.fn(() => Promise.resolve({ error: null, count: ids.length })),
          };
        }),
      })),
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantChain;
      if (table === "expenses") return { ...expenseSelectChain, ...updateMock };
      return {};
    });

    const request = makeRequest({
      grant_id: "550e8400-e29b-41d4-a716-446655440000",
    });

    const response = await POST(request);
    const data = await response.json();

    // 3 categories, each with 3 expenses
    expect(data.confirmed).toBe(9);
    // 3 batch update calls (one per category)
    expect(updateCalls).toHaveLength(3);
    // Each batch should have 3 expense IDs
    for (const batch of updateCalls) {
      expect(batch).toHaveLength(3);
    }
  });
});

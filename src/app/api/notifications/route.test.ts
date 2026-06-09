import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { GET } from "./route";

const mockGetAuthOrgId = vi.mocked(getAuthOrgId);

function makeRequest(limit?: string): NextRequest {
  const url = new URL("http://localhost:3000/api/notifications");
  if (limit !== undefined) url.searchParams.set("limit", limit);
  return new NextRequest(url);
}

function createChainMock(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result);
  (p as unknown as Record<string, unknown>).select = vi.fn().mockReturnValue(p);
  (p as unknown as Record<string, unknown>).eq = vi.fn().mockReturnValue(p);
  (p as unknown as Record<string, unknown>).in = vi.fn().mockReturnValue(p);
  (p as unknown as Record<string, unknown>).neq = vi.fn().mockReturnValue(p);
  return p;
}

describe("GET /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when orgId is missing", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 with empty notifications when no grants exist", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({ data: [], error: null });
    mockFrom.mockImplementation(() => grantsChain);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toEqual([]);
    expect(body.totalCount).toBe(0);
  });

  it("returns pending_review notifications when expenses await review", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({ data: [], error: null });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: null, amount: 100, status: "pending_review" },
        { grant_id: "g1", confirmed_category: null, amount: 200, status: "pending_review" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].type).toBe("pending_review");
    expect(body.notifications[0].title).toBe("2 expenses pending review");
    expect(body.totalCount).toBe(1);
  });

  it("returns budget_alert notifications for categories at >=80% utilization", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "personnel", budgeted_amount: 10000 }],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: "personnel", amount: 9500, status: "confirmed" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].type).toBe("budget_alert");
    expect(body.notifications[0].title).toBe("Personnel at 95% of budget");
  });

  it("respects ?limit=N parameter", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [
        { id: "g1", name: "Grant One" },
        { id: "g2", name: "Grant Two" },
        { id: "g3", name: "Grant Three" },
      ],
      error: null,
    });
    const budgetsChain = createChainMock({ data: [], error: null });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: null, amount: 50, status: "pending_review" },
        { grant_id: "g2", confirmed_category: null, amount: 75, status: "pending_review" },
        { grant_id: "g3", confirmed_category: null, amount: 100, status: "pending_review" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("1"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(1);
    expect(body.totalCount).toBe(3);
  });

  it("returns 400 for invalid limit (limit=0)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const res = await GET(makeRequest("0"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid limit parameter");
  });

  it("returns 500 when Supabase throws", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: null,
      error: { message: "DB error" },
    });
    mockFrom.mockImplementation(() => grantsChain);

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch notifications");
  });

  it("generates overspent alert at >100% budget", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "personnel", budgeted_amount: 10000 }],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: "personnel", amount: 12000, status: "confirmed" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].type).toBe("budget_alert");
    expect(body.notifications[0].title).toContain("120%");
  });

  it("sorts by severity: overspent > warning > pending_review", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Grant A" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [
        { grant_id: "g1", category: "personnel", budgeted_amount: 10000 },
        { grant_id: "g1", category: "travel", budgeted_amount: 5000 },
      ],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        // personnel at 85% → warning
        { grant_id: "g1", confirmed_category: "personnel", amount: 8500, status: "confirmed" },
        // travel at 120% → overspent
        { grant_id: "g1", confirmed_category: "travel", amount: 6000, status: "confirmed" },
        // pending review
        { grant_id: "g1", confirmed_category: null, amount: 100, status: "pending_review" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("50"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications.length).toBe(3);
    // First: overspent (travel), then warning (personnel), then pending_review
    expect(body.notifications[0].type).toBe("budget_alert");
    expect(body.notifications[0].title).toContain("120%");
    expect(body.notifications[1].type).toBe("budget_alert");
    expect(body.notifications[1].title).toContain("85%");
    expect(body.notifications[2].type).toBe("pending_review");
  });

  it("zero-budget category generates no budget_alert", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "equipment", budgeted_amount: 0 }],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: "equipment", amount: 5000, status: "confirmed" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    // computeAlertLevel(5000, 0) = "none" → no alert
    expect(body.notifications).toHaveLength(0);
    expect(body.totalCount).toBe(0);
  });

  it("exactly 80% utilization → warning alert generated", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "supplies", budgeted_amount: 10000 }],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: "supplies", amount: 8000, status: "confirmed" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].type).toBe("budget_alert");
    expect(body.notifications[0].title).toContain("80%");
  });

  it("totalCount reflects all notifications even when limit truncates", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [
        { id: "g1", name: "Grant One" },
        { id: "g2", name: "Grant Two" },
        { id: "g3", name: "Grant Three" },
        { id: "g4", name: "Grant Four" },
      ],
      error: null,
    });
    const budgetsChain = createChainMock({ data: [], error: null });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: null, amount: 50, status: "pending_review" },
        { grant_id: "g2", confirmed_category: null, amount: 75, status: "pending_review" },
        { grant_id: "g3", confirmed_category: null, amount: 100, status: "pending_review" },
        { grant_id: "g4", confirmed_category: null, amount: 125, status: "pending_review" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("2"));
    expect(res.status).toBe(200);
    const body = await res.json();
    // Limit is 2, but totalCount should reflect all 4
    expect(body.notifications).toHaveLength(2);
    expect(body.totalCount).toBe(4);
  });

  it("sets no-cache headers", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({ data: [], error: null });
    mockFrom.mockImplementation(() => grantsChain);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
    expect(res.headers.get("Pragma")).toBe("no-cache");
  });

  // --- Phase 3: Notification threshold accuracy ---

  it("null confirmed_category falls back to 'other' for budget calculation", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "other", budgeted_amount: 10000 }],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: null, amount: 8500, status: "confirmed" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    // null confirmed_category → "other", 8500/10000 = 85% → warning
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].type).toBe("budget_alert");
    expect(body.notifications[0].title).toContain("85%");
  });

  it("excluded expenses are NOT counted in budget utilization", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "supplies", budgeted_amount: 10000 }],
      error: null,
    });
    // The .neq("status","excluded") filter means excluded expenses don't appear in results
    const expensesChain = createChainMock({
      data: [
        // Only confirmed expenses come through (excluded ones filtered by DB query)
        { grant_id: "g1", confirmed_category: "supplies", amount: 100, status: "confirmed" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    // Only 100/10000 = 1% → no alert (below 80%)
    expect(body.notifications).toHaveLength(0);
  });

  it("exactly 90% → critical alert", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "personnel", budgeted_amount: 10000 }],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: "personnel", amount: 9000, status: "confirmed" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].type).toBe("budget_alert");
    expect(body.notifications[0].title).toContain("90%");
  });

  it("79% → no budget alert generated", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "travel", budgeted_amount: 10000 }],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: "travel", amount: 7900, status: "confirmed" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    // 79% is below 80% threshold → no budget_alert
    expect(body.notifications.filter((n: { type: string }) => n.type === "budget_alert")).toHaveLength(0);
  });

  it("100.1% → overspent alert", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "equipment", budgeted_amount: 5000 }],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        { grant_id: "g1", confirmed_category: "equipment", amount: 5005, status: "confirmed" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications).toHaveLength(1);
    expect(body.notifications[0].type).toBe("budget_alert");
    // 5005/5000 = 100.1% → rounds to 100%
    expect(body.notifications[0].title).toContain("100%");
  });

  it("severity sort: overspent before critical before pending_review", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [
        { id: "g_a", name: "Grant A" },
        { id: "g_b", name: "Grant B" },
        { id: "g_c", name: "Grant C" },
      ],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [
        { grant_id: "g_a", category: "personnel", budgeted_amount: 10000 },
        { grant_id: "g_b", category: "travel", budgeted_amount: 5000 },
      ],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        // Grant A: 120% → overspent
        { grant_id: "g_a", confirmed_category: "personnel", amount: 12000, status: "confirmed" },
        // Grant B: 92% → critical
        { grant_id: "g_b", confirmed_category: "travel", amount: 4600, status: "confirmed" },
        // Grant C: 3 pending
        { grant_id: "g_c", confirmed_category: null, amount: 50, status: "pending_review" },
        { grant_id: "g_c", confirmed_category: null, amount: 75, status: "pending_review" },
        { grant_id: "g_c", confirmed_category: null, amount: 100, status: "pending_review" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest("50"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notifications.length).toBe(3);
    // First: overspent (Grant A personnel), then critical (Grant B travel), then pending (Grant C)
    expect(body.notifications[0].type).toBe("budget_alert");
    expect(body.notifications[0].title).toContain("120%");
    expect(body.notifications[1].type).toBe("budget_alert");
    expect(body.notifications[1].title).toContain("92%");
    expect(body.notifications[2].type).toBe("pending_review");
  });

  it("same grant can have both pending_review and budget_alert", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "personnel", budgeted_amount: 10000 }],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        // Confirmed expense at 85%
        { grant_id: "g1", confirmed_category: "personnel", amount: 8500, status: "confirmed" },
        // 3 pending expenses
        { grant_id: "g1", confirmed_category: null, amount: 50, status: "pending_review" },
        { grant_id: "g1", confirmed_category: null, amount: 75, status: "pending_review" },
        { grant_id: "g1", confirmed_category: null, amount: 100, status: "pending_review" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    // Should have both a budget_alert AND a pending_review for the same grant
    expect(body.notifications).toHaveLength(2);
    const types = body.notifications.map((n: { type: string }) => n.type);
    expect(types).toContain("budget_alert");
    expect(types).toContain("pending_review");
  });

  it("pending_review expenses NOT counted in budget utilization", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: [{ id: "g1", name: "Test Grant" }],
      error: null,
    });
    const budgetsChain = createChainMock({
      data: [{ grant_id: "g1", category: "supplies", budgeted_amount: 10000 }],
      error: null,
    });
    const expensesChain = createChainMock({
      data: [
        // Confirmed at $500 → 5% of budget
        { grant_id: "g1", confirmed_category: "supplies", amount: 500, status: "confirmed" },
        // Pending at $9000 → should NOT be counted in budget calc
        { grant_id: "g1", confirmed_category: "supplies", amount: 9000, status: "pending_review" },
      ],
      error: null,
    });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") return grantsChain;
      if (table === "grant_budgets") return budgetsChain;
      if (table === "expenses") return expensesChain;
      return createChainMock({ data: [], error: null });
    });

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    // Budget utilization = 500/10000 = 5% → no budget alert
    // But there IS a pending_review notification
    const budgetAlerts = body.notifications.filter((n: { type: string }) => n.type === "budget_alert");
    expect(budgetAlerts).toHaveLength(0);
    const pendingAlerts = body.notifications.filter((n: { type: string }) => n.type === "pending_review");
    expect(pendingAlerts).toHaveLength(1);
  });

  it("grants query error returns 500", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: null });

    const grantsChain = createChainMock({
      data: null,
      error: { message: "connection refused" },
    });
    mockFrom.mockImplementation(() => grantsChain);

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch notifications");
  });
});

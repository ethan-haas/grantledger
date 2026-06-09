import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

const mockGetBudgetVsActual = vi.fn();

vi.mock("@/lib/queries/budget-actual", () => ({
  getBudgetVsActual: (...args: unknown[]) => mockGetBudgetVsActual(...args),
}));

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { createServerClient } from "@/lib/supabase/server";
import { GET } from "./route";

const mockGetAuthOrgId = vi.mocked(getAuthOrgId);
const mockCreateServerClient = vi.mocked(createServerClient);

const mockSingle = vi.fn();
const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

const params = { id: "grant_1" };

describe("GET /api/grants/[id]/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockEq2.mockReturnValue({ single: mockSingle });
    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockSelect.mockReturnValue({ eq: mockEq1 });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockCreateServerClient.mockResolvedValue({ from: mockFrom } as never);
  });

  it("returns 401 when orgId is missing", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    const res = await GET(request, { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when grant not found (org mismatch)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const request = new Request("http://localhost/api/grants/grant_999/dashboard");
    const res = await GET(request, { params: { id: "grant_999" } });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Grant not found");
  });

  it("returns 200 with budget-vs-actual data on success", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });

    const dashboardData = {
      grantId: "grant_1",
      grantName: "Test Grant",
      totalBudget: 100000,
      totalSpent: 45000,
      categories: [],
      pendingCount: 3,
      confirmedCount: 10,
    };
    mockGetBudgetVsActual.mockResolvedValue(dashboardData);

    // Mock the monthly spending query (from("expenses").select().eq().eq().eq().order())
    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExpenses = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExpenses = vi.fn().mockReturnValue({ eq: mockEqOrgExpenses });
    const mockSelectExpenses = vi.fn().mockReturnValue({ eq: mockEqGrantExpenses });

    // First call to from("grants") returns the select chain, second call to from("expenses") returns expenses chain
    mockFrom.mockReturnValueOnce({ select: mockSelect }).mockReturnValueOnce({ select: mockSelectExpenses });
    // Re-setup the grants chain for this test
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.grantId).toBe("grant_1");
    expect(body.totalBudget).toBe(100000);
    expect(body.monthlySpending).toEqual([]);
  });

  it("returns 500 when getBudgetVsActual throws", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });
    mockGetBudgetVsActual.mockRejectedValue(new Error("DB error"));

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    const res = await GET(request, { params });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch grant dashboard");
  });

  it("returns 400 for non-numeric months param", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard?months=abc");
    const res = await GET(request, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid query parameters");
  });

  it("returns 400 for months less than 1", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard?months=0");
    const res = await GET(request, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid query parameters");
  });

  it("returns 400 for invalid date_start format", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard?date_start=not-valid");
    const res = await GET(request, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid query parameters");
  });

  it("months=37 returns 400 (exceeds .max(36))", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard?months=37");
    const res = await GET(request, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid query parameters");
  });

  it("months=3.5 returns 400 (rejected by .int())", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard?months=3.5");
    const res = await GET(request, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid query parameters");
  });

  it("months=36 returns 200 (max valid value)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });
    mockGetBudgetVsActual.mockResolvedValue({ grantId: "grant_1", categories: [] });

    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExp = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard?months=36");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
  });

  it("monthlySpending defaults to 6 months when param omitted", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });
    mockGetBudgetVsActual.mockResolvedValue({ grantId: "grant_1", categories: [] });

    // Create 8 months of expense data — default should only show last 6
    const expenses = [
      { date: "2024-01-10", amount: 100 },
      { date: "2024-02-10", amount: 100 },
      { date: "2024-03-10", amount: 100 },
      { date: "2024-04-10", amount: 100 },
      { date: "2024-05-10", amount: 100 },
      { date: "2024-06-10", amount: 100 },
      { date: "2024-07-10", amount: 100 },
      { date: "2024-08-10", amount: 100 },
    ];
    const mockOrder = vi.fn().mockResolvedValue({ data: expenses, error: null });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExp = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    // 8 months of data, default months=6 → last 6 months
    expect(body.monthlySpending).toHaveLength(6);
  });

  it("returns correct monthly_spending structure with summed amounts", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });

    const dashboardData = { grantId: "grant_1", categories: [], totalBudget: 50000, totalSpent: 750 };
    mockGetBudgetVsActual.mockResolvedValue(dashboardData);

    const expenses = [
      { date: "2024-01-15", amount: 100 },
      { date: "2024-01-20", amount: 200 },
      { date: "2024-02-10", amount: 150 },
      { date: "2024-03-05", amount: 300 },
    ];
    const mockOrder = vi.fn().mockResolvedValue({ data: expenses, error: null });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExp = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.monthlySpending).toHaveLength(3);
    expect(body.monthlySpending[0].amount).toBe(300); // Jan: 100 + 200
    expect(body.monthlySpending[1].amount).toBe(150); // Feb: 150
    expect(body.monthlySpending[2].amount).toBe(300); // Mar: 300
  });

  it("returns empty monthlySpending when expenses query returns null data", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });

    mockGetBudgetVsActual.mockResolvedValue({ grantId: "grant_1", categories: [] });

    const mockOrder = vi.fn().mockResolvedValue({ data: null, error: { message: "query failed" } });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExp = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.monthlySpending).toEqual([]);
  });

  it("respects months param to limit trend data", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });

    mockGetBudgetVsActual.mockResolvedValue({ grantId: "grant_1", categories: [] });

    const expenses = [
      { date: "2024-01-10", amount: 100 },
      { date: "2024-02-10", amount: 200 },
      { date: "2024-03-10", amount: 300 },
      { date: "2024-04-10", amount: 400 },
      { date: "2024-05-10", amount: 500 },
    ];
    const mockOrder = vi.fn().mockResolvedValue({ data: expenses, error: null });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExp = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard?months=3");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    // 5 months of data, months=3 → only last 3 returned
    expect(body.monthlySpending).toHaveLength(3);
    expect(body.monthlySpending[0].amount).toBe(300); // Mar
    expect(body.monthlySpending[1].amount).toBe(400); // Apr
    expect(body.monthlySpending[2].amount).toBe(500); // May
  });

  it("passes all budget_vs_actual fields through to response", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });

    const dashboardData = {
      grantId: "grant_1",
      grantName: "Federal Education Grant",
      totalBudget: 250000,
      totalSpent: 87500,
      categories: [{ category: "Personnel", budgeted: 100000, spent: 50000 }],
      pendingCount: 5,
      confirmedCount: 20,
    };
    mockGetBudgetVsActual.mockResolvedValue(dashboardData);

    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExp = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.grantName).toBe("Federal Education Grant");
    expect(body.totalBudget).toBe(250000);
    expect(body.totalSpent).toBe(87500);
    expect(body.pendingCount).toBe(5);
    expect(body.confirmedCount).toBe(20);
    expect(body.categories).toHaveLength(1);
  });

  it("grant ownership check includes .eq('org_id', orgId)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    await GET(request, { params });

    // mockEq1 is first .eq("id",..), mockEq2 is second .eq("org_id",..)
    expect(mockEq1).toHaveBeenCalledWith("id", "grant_1");
    expect(mockEq2).toHaveBeenCalledWith("org_id", "org_1");
  });

  it("monthly spending query includes .eq('org_id', orgId)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });
    mockGetBudgetVsActual.mockResolvedValue({ grantId: "grant_1", categories: [] });

    const mockEqOrgExp = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    await GET(request, { params });

    // Expenses query: .eq("grant_id", params.id).eq("org_id", orgId)
    expect(mockEqGrantExp).toHaveBeenCalledWith("grant_id", "grant_1");
    expect(mockEqOrgExp).toHaveBeenCalledWith("org_id", "org_1");
  });

  it("getBudgetVsActual returning null yields 404 not 200", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });
    mockGetBudgetVsActual.mockResolvedValue(null);

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    const res = await GET(request, { params });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Grant not found");
  });

  it("date_end without date_start uses 1970-01-01 default", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });
    mockGetBudgetVsActual.mockResolvedValue({ grantId: "grant_1", categories: [] });

    const mockLte = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
    const mockOrder = vi.fn().mockReturnValue({ gte: mockGte });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExp = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard?date_end=2024-06-30");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);

    // dateRange.start should default to "1970-01-01"
    expect(mockGetBudgetVsActual).toHaveBeenCalledWith(
      "grant_1",
      "org_1",
      { start: "1970-01-01", end: "2024-06-30" }
    );
    expect(mockGte).toHaveBeenCalledWith("date", "1970-01-01");
  });

  it("date_start without date_end uses 2099-12-31 default", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });
    mockGetBudgetVsActual.mockResolvedValue({ grantId: "grant_1", categories: [] });

    const mockLte = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
    const mockOrder = vi.fn().mockReturnValue({ gte: mockGte });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExp = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard?date_start=2024-01-01");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);

    // dateRange.end should default to "2099-12-31"
    expect(mockGetBudgetVsActual).toHaveBeenCalledWith(
      "grant_1",
      "org_1",
      { start: "2024-01-01", end: "2099-12-31" }
    );
    expect(mockLte).toHaveBeenCalledWith("date", "2099-12-31");
  });

  it("getBudgetVsActual receives orgId as second argument", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });
    mockGetBudgetVsActual.mockResolvedValue({ grantId: "grant_1", categories: [] });

    const mockOrder = vi.fn().mockResolvedValue({ data: [], error: null });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExp = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard");
    await GET(request, { params });

    // Verify orgId is passed as second argument (not omitted)
    expect(mockGetBudgetVsActual).toHaveBeenCalledWith("grant_1", "org_1", undefined);
  });

  it("handles date_start and date_end filtering", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: { id: "grant_1" }, error: null });

    mockGetBudgetVsActual.mockResolvedValue({ grantId: "grant_1", categories: [] });

    const expenseResult = { data: [{ date: "2024-03-15", amount: 500 }], error: null };
    const mockLte = vi.fn().mockResolvedValue(expenseResult);
    const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
    const mockOrder = vi.fn().mockReturnValue({ gte: mockGte });
    const mockEqStatus = vi.fn().mockReturnValue({ order: mockOrder });
    const mockEqOrgExp = vi.fn().mockReturnValue({ eq: mockEqStatus });
    const mockEqGrantExp = vi.fn().mockReturnValue({ eq: mockEqOrgExp });
    const mockSelectExp = vi.fn().mockReturnValue({ eq: mockEqGrantExp });

    mockFrom
      .mockReturnValueOnce({ select: mockSelect })
      .mockReturnValueOnce({ select: mockSelectExp });
    mockSelect.mockReturnValue({ eq: mockEq1 });

    const request = new Request("http://localhost/api/grants/grant_1/dashboard?date_start=2024-01-01&date_end=2024-06-30");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.monthlySpending).toHaveLength(1);
    expect(body.monthlySpending[0].amount).toBe(500);
    expect(mockGte).toHaveBeenCalledWith("date", "2024-01-01");
    expect(mockLte).toHaveBeenCalledWith("date", "2024-06-30");
  });
});

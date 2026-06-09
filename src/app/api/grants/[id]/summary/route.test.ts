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

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { createServerClient } from "@/lib/supabase/server";
import { GET } from "./route";

const mockGetAuthOrgId = vi.mocked(getAuthOrgId);
const mockCreateServerClient = vi.mocked(createServerClient);

const mockSingle = vi.fn();
const mockConfirmedEq = vi.fn().mockResolvedValue({ data: [], error: null });
const mockExpenseEq2 = vi.fn().mockReturnValue({ eq: mockConfirmedEq });
const mockExpenseEq1 = vi.fn().mockReturnValue({ eq: mockExpenseEq2 });

const mockBudgetEq = vi.fn().mockResolvedValue({ data: [], error: null });

const mockGrantEq2 = vi.fn().mockReturnValue({ single: mockSingle });
const mockGrantEq1 = vi.fn().mockReturnValue({ eq: mockGrantEq2 });

const mockSelect = vi.fn();

const mockFrom = vi.fn().mockImplementation((table: string) => {
  if (table === "grants") {
    return { select: vi.fn().mockReturnValue({ eq: mockGrantEq1 }) };
  }
  if (table === "grant_budgets") {
    return { select: vi.fn().mockReturnValue({ eq: mockBudgetEq }) };
  }
  if (table === "expenses") {
    return { select: vi.fn().mockReturnValue({ eq: mockExpenseEq1 }) };
  }
  return { select: mockSelect };
});

const params = { id: "grant_1" };

describe("GET /api/grants/[id]/summary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockGrantEq2.mockReturnValue({ single: mockSingle });
    mockGrantEq1.mockReturnValue({ eq: mockGrantEq2 });
    mockBudgetEq.mockResolvedValue({ data: [], error: null });
    mockConfirmedEq.mockResolvedValue({ data: [], error: null });

    mockFrom.mockImplementation((table: string) => {
      if (table === "grants") {
        return { select: vi.fn().mockReturnValue({ eq: mockGrantEq1 }) };
      }
      if (table === "grant_budgets") {
        return { select: vi.fn().mockReturnValue({ eq: mockBudgetEq }) };
      }
      if (table === "expenses") {
        return { select: vi.fn().mockReturnValue({ eq: mockExpenseEq1 }) };
      }
      return { select: mockSelect };
    });

    mockCreateServerClient.mockResolvedValue({ from: mockFrom } as never);
  });

  it("returns 401 when orgId is missing", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const request = new Request("http://localhost/api/grants/grant_1/summary");
    const res = await GET(request, { params });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when grant not found", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const request = new Request("http://localhost/api/grants/grant_999/summary");
    const res = await GET(request, { params: { id: "grant_999" } });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Grant not found");
  });

  it("returns 200 with summary data on success", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({
      data: { id: "grant_1", name: "Test Grant", omb_framework: "pre_oct_2024" },
      error: null,
    });
    mockBudgetEq.mockResolvedValueOnce({
      data: [
        { category: "personnel", budgeted_amount: 50000 },
        { category: "travel", budgeted_amount: 10000 },
      ],
      error: null,
    });
    mockConfirmedEq.mockResolvedValueOnce({
      data: [
        { confirmed_category: "personnel", amount: 20000, status: "confirmed" },
        { confirmed_category: "travel", amount: 3000, status: "confirmed" },
      ],
      error: null,
    });

    const request = new Request("http://localhost/api/grants/grant_1/summary");
    const res = await GET(request, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.categoryBreakdown).toHaveLength(2);
    expect(body.totalBudget).toBe(60000);
    expect(body.totalSpent).toBe(23000);
    expect(body.expenseCount).toBe(2);
  });

  it("returns 500 when Supabase throws (verifies try/catch)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockCreateServerClient.mockRejectedValueOnce(new Error("DB connection failed"));

    const request = new Request("http://localhost/api/grants/grant_1/summary");
    const res = await GET(request, { params });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch grant summary");
  });

  it("returns 500 when budget query fails", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({
      data: { id: "grant_1", name: "Test Grant" },
      error: null,
    });
    mockBudgetEq.mockResolvedValueOnce({
      data: null,
      error: { message: "relation not found" },
    });

    const request = new Request("http://localhost/api/grants/grant_1/summary");
    const res = await GET(request, { params });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch budget data");
  });

  it("returns 500 when expense query fails", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({
      data: { id: "grant_1", name: "Test Grant" },
      error: null,
    });
    mockBudgetEq.mockResolvedValueOnce({
      data: [{ category: "personnel", budgeted_amount: 50000 }],
      error: null,
    });
    mockConfirmedEq.mockResolvedValueOnce({
      data: null,
      error: { message: "permission denied" },
    });

    const request = new Request("http://localhost/api/grants/grant_1/summary");
    const res = await GET(request, { params });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch expense data");
  });
});

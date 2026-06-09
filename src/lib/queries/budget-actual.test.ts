import { describe, it, expect, vi, beforeEach } from "vitest";
import { computeAlertLevel } from "./budget-actual";

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

/** Creates a self-referential chain mock that resolves to `value` when awaited */
function createThenable<T>(value: T): Record<string, unknown> {
  const chain: Record<string, unknown> = {};
  chain.eq = vi.fn(() => chain);
  chain.gte = vi.fn(() => chain);
  chain.lte = vi.fn(() => chain);
  chain.neq = vi.fn(() => chain);
  chain.in = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.then = (resolve: (v: T) => void) => { resolve(value); };
  return chain;
}

describe("computeAlertLevel", () => {
  it("returns correct alert levels at all thresholds", () => {
    // Zero budget → none
    expect(computeAlertLevel(100, 0)).toBe("none");
    expect(computeAlertLevel(0, 0)).toBe("none");

    // Under 80% → none
    expect(computeAlertLevel(0, 1000)).toBe("none");
    expect(computeAlertLevel(799, 1000)).toBe("none");

    // 80–89% → warning
    expect(computeAlertLevel(800, 1000)).toBe("warning");
    expect(computeAlertLevel(899, 1000)).toBe("warning");

    // 90–100% → critical
    expect(computeAlertLevel(900, 1000)).toBe("critical");
    expect(computeAlertLevel(1000, 1000)).toBe("critical");

    // Over 100% → overspent
    expect(computeAlertLevel(1001, 1000)).toBe("overspent");
    expect(computeAlertLevel(2000, 1000)).toBe("overspent");
  });

  it("treats 79.95% as below warning threshold", () => {
    expect(computeAlertLevel(7995, 10000)).toBe("none");
  });

  it("treats exactly 80.0% at large values as warning", () => {
    expect(computeAlertLevel(8000, 10000)).toBe("warning");
  });

  it("handles near-boundary float just below 80%", () => {
    expect(computeAlertLevel(799.999999, 1000)).toBe("none");
  });

  it("handles near-boundary float just above 80%", () => {
    expect(computeAlertLevel(800.000001, 1000)).toBe("warning");
  });

  it("returns 'none' for negative spent (refund scenario)", () => {
    // Refunds can produce negative net spent — should never trigger alerts
    expect(computeAlertLevel(-500, 10000)).toBe("none");
    expect(computeAlertLevel(-1, 1000)).toBe("none");
  });

  it("handles $500M values without overflow", () => {
    // Federal grants reach 9 figures
    expect(computeAlertLevel(450_000_000, 500_000_000)).toBe("critical");
    expect(computeAlertLevel(400_000_000, 500_000_000)).toBe("warning");
    expect(computeAlertLevel(250_000_000, 500_000_000)).toBe("none");
    expect(computeAlertLevel(510_000_000, 500_000_000)).toBe("overspent");
  });

  it("handles sub-penny precision at 80%/90% boundaries", () => {
    // $8000.005 / $10000 = 80.00005% → warning (just over 80)
    expect(computeAlertLevel(8000.005, 10000)).toBe("warning");
    // $7999.995 / $10000 = 79.99995% → none (just under 80)
    expect(computeAlertLevel(7999.995, 10000)).toBe("none");
    // $9000.001 / $10000 = 90.00001% → critical (just over 90)
    expect(computeAlertLevel(9000.001, 10000)).toBe("critical");
  });

  it("handles small budget fraction at exactly 80%", () => {
    // 1 / 1.25 = 0.8 = 80%
    expect(computeAlertLevel(1, 1.25)).toBe("warning");
  });

  it("returns 'none' for negative budget", () => {
    expect(computeAlertLevel(100, -500)).toBe("none");
  });

  it("returns 'critical' at exactly 90%", () => {
    // 900 / 1000 = 90% exactly
    expect(computeAlertLevel(900, 1000)).toBe("critical");
    // Precise: 9000 / 10000 = exactly 90%
    expect(computeAlertLevel(9000, 10000)).toBe("critical");
  });

  it("returns 'critical' at exactly 100% (not overspent)", () => {
    // 1000 / 1000 = 100% exactly → pct > 100 is false, pct >= 90 is true → critical
    expect(computeAlertLevel(1000, 1000)).toBe("critical");
    expect(computeAlertLevel(5000, 5000)).toBe("critical");
  });
});

describe("getBudgetVsActual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when budgets query fails", async () => {
    let queryCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: "g1", name: "G1", funding_agency: "DOE", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" }, error: null })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "grant_budgets") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
            })),
          })),
        })),
      };
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("grant_1", "org_123");
    expect(result).toBeNull();
  });

  it("returns null when expenses query fails", async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() =>
                  Promise.resolve({ data: { id: "g1", name: "G1", funding_agency: "DOE", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" }, error: null })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "grant_budgets") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({ data: [{ category: "personnel", budgeted_amount: 1000 }], error: null })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("grant_1", "org_123");
    expect(result).toBeNull();
  });

  it("passes orgId to the grants query", async () => {
    const eqCalls: string[][] = [];

    const mockSingle = vi.fn(() => Promise.resolve({ data: null }));
    const mockEq = vi.fn((col: string, val: string) => {
      eqCalls.push([col, val]);
      return { single: mockSingle, eq: mockEq };
    });
    const mockSelect = vi.fn(() => ({ eq: mockEq }));
    const mockFrom = vi.fn(() => ({ select: mockSelect }));

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    await getBudgetVsActual("grant_1", "org_123");

    // Verify .eq("org_id", "org_123") was called on the grants query
    const orgIdFilter = eqCalls.find(
      ([col, val]) => col === "org_id" && val === "org_123"
    );
    expect(orgIdFilter).toBeDefined();

    // Verify .eq("id", "grant_1") was also called
    const idFilter = eqCalls.find(
      ([col, val]) => col === "id" && val === "grant_1"
    );
    expect(idFilter).toBeDefined();
  });

  it("computes full category breakdown with correct financial math", async () => {
    const grantData = {
      id: "g1", name: "Test Grant", funding_agency: "NSF",
      omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01",
    };
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({ data: grantData, error: null }));

    const budgetsChain = createThenable({
      data: [
        { category: "personnel", budgeted_amount: 10000 },
        { category: "travel", budgeted_amount: 5000 },
        { category: "supplies", budgeted_amount: 3000 },
      ],
      error: null,
    });
    const confirmedChain = createThenable({
      data: [
        { confirmed_category: "personnel", amount: 7500, status: "confirmed" },
        { confirmed_category: "travel", amount: 2000, status: "confirmed" },
        { confirmed_category: "supplies", amount: 1000, status: "confirmed" },
      ],
      error: null,
    });
    const pendingChain = createThenable({ count: 5, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");

    expect(result).not.toBeNull();
    expect(result!.grantName).toBe("Test Grant");
    expect(result!.fundingAgency).toBe("NSF");
    expect(result!.ombFramework).toBe("pre_oct_2024");
    expect(result!.totalBudget).toBe(18000);
    expect(result!.totalSpent).toBe(10500);
    expect(result!.confirmedCount).toBe(3);
    expect(result!.pendingCount).toBe(5);

    const personnel = result!.categories.find(c => c.category === "personnel")!;
    expect(personnel.budgeted).toBe(10000);
    expect(personnel.spent).toBe(7500);
    expect(personnel.remaining).toBe(2500);
    expect(personnel.utilization).toBe(75.0);
    expect(personnel.alertLevel).toBe("none");

    const travel = result!.categories.find(c => c.category === "travel")!;
    expect(travel.spent).toBe(2000);
    expect(travel.remaining).toBe(3000);
    expect(travel.utilization).toBe(40.0);

    const supplies = result!.categories.find(c => c.category === "supplies")!;
    expect(supplies.spent).toBe(1000);
    expect(supplies.remaining).toBe(2000);
    expect(supplies.utilization).toBe(33.3);
  });

  it("calculates utilization to one decimal place precision", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "supplies", budgeted_amount: 3000 }], error: null });
    const confirmedChain = createThenable({ data: [{ confirmed_category: "supplies", amount: 2567, status: "confirmed" }], error: null });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    // 2567/3000 = 0.855666... → Math.round(855.666)/10 = 85.6
    expect(result!.categories[0].utilization).toBe(85.6);
  });

  it("maps null confirmed_category to 'other'", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "other", budgeted_amount: 5000 }], error: null });
    const confirmedChain = createThenable({
      data: [
        { confirmed_category: null, amount: 1200, status: "confirmed" },
        { confirmed_category: null, amount: 800, status: "confirmed" },
      ],
      error: null,
    });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    const other = result!.categories.find(c => c.category === "other")!;
    expect(other.spent).toBe(2000);
    expect(other.remaining).toBe(3000);
  });

  it("uses count field for pendingCount from head:true query", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "personnel", budgeted_amount: 1000 }], error: null });
    const confirmedChain = createThenable({ data: [], error: null });
    const pendingChain = createThenable({ count: 42, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    expect(result!.pendingCount).toBe(42);
  });

  it("applies date range filters when dateRange is provided", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "personnel", budgeted_amount: 1000 }], error: null });
    const confirmedChain = createThenable({ data: [], error: null });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    await getBudgetVsActual("g1", "org_1", { start: "2024-06-01", end: "2024-12-31" });

    // Both confirmed and pending expense chains should have date filters
    expect(confirmedChain.gte).toHaveBeenCalledWith("date", "2024-06-01");
    expect(confirmedChain.lte).toHaveBeenCalledWith("date", "2024-12-31");
    expect(pendingChain.gte).toHaveBeenCalledWith("date", "2024-06-01");
    expect(pendingChain.lte).toHaveBeenCalledWith("date", "2024-12-31");
  });

  it("filters out 'total' budget row from categories", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({
      data: [
        { category: "personnel", budgeted_amount: 5000 },
        { category: "total", budgeted_amount: 5000 },
      ],
      error: null,
    });
    const confirmedChain = createThenable({ data: [], error: null });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    expect(result!.categories).toHaveLength(1);
    expect(result!.categories[0].category).toBe("personnel");
    expect(result!.totalBudget).toBe(5000);
  });

  it("handles zero-budget category with actual spending — utilization 0, not Infinity", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "equipment", budgeted_amount: 0 }], error: null });
    const confirmedChain = createThenable({
      data: [{ confirmed_category: "equipment", amount: 5000, status: "confirmed" }],
      error: null,
    });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    const equipment = result!.categories[0];
    expect(equipment.utilization).toBe(0);
    expect(equipment.alertLevel).toBe("none");
    expect(equipment.spent).toBe(5000);
    expect(equipment.remaining).toBe(-5000);
    expect(Number.isFinite(equipment.utilization)).toBe(true);
  });

  it("handles all-zero budgets — no NaN anywhere", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({
      data: [
        { category: "personnel", budgeted_amount: 0 },
        { category: "travel", budgeted_amount: 0 },
      ],
      error: null,
    });
    const confirmedChain = createThenable({
      data: [{ confirmed_category: "personnel", amount: 1000, status: "confirmed" }],
      error: null,
    });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    expect(result!.totalBudget).toBe(0);
    expect(result!.totalSpent).toBe(1000);
    expect(Number.isNaN(result!.totalBudget)).toBe(false);
    expect(Number.isNaN(result!.totalSpent)).toBe(false);
    result!.categories.forEach(c => {
      expect(Number.isNaN(c.utilization)).toBe(false);
      expect(Number.isFinite(c.utilization)).toBe(true);
    });
  });

  it("negative expense amounts (refunds) reduce spent correctly", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "supplies", budgeted_amount: 5000 }], error: null });
    const confirmedChain = createThenable({
      data: [
        { confirmed_category: "supplies", amount: 2000, status: "confirmed" },
        { confirmed_category: "supplies", amount: -500, status: "confirmed" },
      ],
      error: null,
    });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    const supplies = result!.categories[0];
    expect(supplies.spent).toBe(1500);
    expect(supplies.remaining).toBe(3500);
    expect(supplies.utilization).toBe(30.0);
  });

  it("utilization rounds 33.333% to 33.3", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "personnel", budgeted_amount: 3000 }], error: null });
    const confirmedChain = createThenable({
      data: [{ confirmed_category: "personnel", amount: 1000, status: "confirmed" }],
      error: null,
    });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    // 1000/3000 = 33.333...% → Math.round(333.33)/10 = 33.3
    expect(result!.categories[0].utilization).toBe(33.3);
  });

  it("handles null budgeted_amount treated as 0 via ?? guard", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "travel", budgeted_amount: null }], error: null });
    const confirmedChain = createThenable({
      data: [{ confirmed_category: "travel", amount: 500, status: "confirmed" }],
      error: null,
    });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    const travel = result!.categories[0];
    expect(travel.budgeted).toBe(0);
    expect(travel.utilization).toBe(0);
    expect(Number.isNaN(travel.utilization)).toBe(false);
    expect(Number.isNaN(travel.budgeted)).toBe(false);
  });

  it("only counts confirmed expenses, pending_review excluded from spent", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "personnel", budgeted_amount: 10000 }], error: null });
    // The query filters .eq("status", "confirmed") so only confirmed expenses come back
    const confirmedChain = createThenable({
      data: [
        { confirmed_category: "personnel", amount: 3000, status: "confirmed" },
      ],
      error: null,
    });
    const pendingChain = createThenable({ count: 5, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    // Only the 1 confirmed expense counts toward spent
    expect(result!.totalSpent).toBe(3000);
    expect(result!.confirmedCount).toBe(1);
    expect(result!.pendingCount).toBe(5);
    expect(result!.categories[0].spent).toBe(3000);
  });

  it("returns utilization 0 and alertLevel 'none' for zero-budget category", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "equipment", budgeted_amount: 0 }], error: null });
    const confirmedChain = createThenable({ data: [], error: null });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    expect(result!.categories[0].utilization).toBe(0);
    expect(result!.categories[0].alertLevel).toBe("none");
    expect(Number.isFinite(result!.categories[0].utilization)).toBe(true);
  });

  it("pendingError returns null (entire dashboard fails)", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "personnel", budgeted_amount: 5000 }], error: null });
    const confirmedChain = createThenable({
      data: [{ confirmed_category: "personnel", amount: 2000, status: "confirmed" }],
      error: null,
    });
    // pending query returns an error
    const pendingChain = createThenable({ count: null, error: { message: "pending count failed" } });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    // pendingError causes function to return null
    expect(result).toBeNull();
  });

  it("null pendingCount treated as 0 via || guard", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "personnel", budgeted_amount: 5000 }], error: null });
    const confirmedChain = createThenable({
      data: [{ confirmed_category: "personnel", amount: 1500, status: "confirmed" }],
      error: null,
    });
    // pending query succeeds but returns null count
    const pendingChain = createThenable({ count: null, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    // null count || 0 → 0, not null or NaN
    expect(result).not.toBeNull();
    expect(result!.pendingCount).toBe(0);
    expect(Number.isNaN(result!.pendingCount)).toBe(false);
  });

  it("skips date filters when dateRange is undefined", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "personnel", budgeted_amount: 1000 }], error: null });
    const confirmedChain = createThenable({ data: [], error: null });
    const pendingChain = createThenable({ count: 0, error: null });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    await getBudgetVsActual("g1", "org_1");

    // .gte and .lte should NOT have been called
    expect(confirmedChain.gte).not.toHaveBeenCalled();
    expect(confirmedChain.lte).not.toHaveBeenCalled();
    expect(pendingChain.gte).not.toHaveBeenCalled();
    expect(pendingChain.lte).not.toHaveBeenCalled();
  });

  it("returns null when grant not found", async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      })),
    }));

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("nonexistent", "org_1");
    expect(result).toBeNull();
  });

  it("returns null when pending count query fails", async () => {
    const grantChain: Record<string, unknown> = {};
    grantChain.eq = vi.fn(() => grantChain);
    grantChain.single = vi.fn(() => Promise.resolve({
      data: { id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_start: "2024-01-01", period_end: "2025-01-01" },
      error: null,
    }));
    const budgetsChain = createThenable({ data: [{ category: "personnel", budgeted_amount: 5000 }], error: null });
    const confirmedChain = createThenable({ data: [], error: null });
    const pendingChain = createThenable({ count: null, error: { message: "pending count failed" } });

    let expenseCallCount = 0;
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") {
        expenseCallCount++;
        return { select: vi.fn(() => expenseCallCount === 1 ? confirmedChain : pendingChain) };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getBudgetVsActual } = await import("./budget-actual");
    const result = await getBudgetVsActual("g1", "org_1");
    expect(result).toBeNull();
  });
});

describe("getOverviewMetrics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("returns empty result when org has no active grants", async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    }));

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getOverviewMetrics } = await import("./budget-actual");
    const result = await getOverviewMetrics("org_empty");
    expect(result).toEqual({ grants: [], totalBudget: 0, totalSpent: 0, totalAlerts: 0 });
  });

  it("adds .eq('org_id', orgId) on the expenses query", async () => {
    const eqCalls: string[][] = [];

    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: string) => {
              eqCalls.push([col, val]);
              return {
                eq: vi.fn((col2: string, val2: string) => {
                  eqCalls.push([col2, val2]);
                  return {
                    order: vi.fn(() =>
                      Promise.resolve({
                        data: [{ id: "g1", name: "G1", funding_agency: "DOE", omb_framework: "pre_oct_2024", period_end: "2025-01-01", created_at: "2024-01-01" }],
                        error: null,
                      })
                    ),
                  };
                }),
              };
            }),
          })),
        };
      }
      if (table === "grant_budgets") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string, val: string) => {
              eqCalls.push([col, val]);
              return {
                in: vi.fn(() => ({
                  neq: vi.fn(() => Promise.resolve({ data: [], error: null })),
                })),
              };
            }),
          })),
        };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getOverviewMetrics } = await import("./budget-actual");
    await getOverviewMetrics("org_456");

    // Verify that .eq("org_id", "org_456") was called on the expenses query
    const orgIdFilters = eqCalls.filter(([col, val]) => col === "org_id" && val === "org_456");
    expect(orgIdFilters.length).toBeGreaterThanOrEqual(2); // grants + expenses
  });

  it("returns empty metrics when grants query fails", async () => {
    const mockFrom = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
          })),
        })),
      })),
    }));

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getOverviewMetrics } = await import("./budget-actual");
    const result = await getOverviewMetrics("org_broken");
    expect(result).toEqual({ grants: [], totalBudget: 0, totalSpent: 0, totalAlerts: 0 });
  });

  it("handles allBudgets/allExpenses failure gracefully", async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({
                    data: [{ id: "g1", name: "G1", funding_agency: "DOE", omb_framework: "pre_oct_2024", period_end: "2025-01-01" }],
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "grant_budgets") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() => Promise.resolve({ data: null, error: { message: "Budget DB error" } })),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => ({
                neq: vi.fn(() => Promise.resolve({ data: null, error: { message: "Expense DB error" } })),
              })),
            })),
          })),
        };
      }
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getOverviewMetrics } = await import("./budget-actual");
    const result = await getOverviewMetrics("org_fail");

    // Should still return valid structure with zero values instead of crashing
    expect(result.grants).toHaveLength(1);
    expect(result.grants[0].totalBudget).toBe(0);
    expect(result.grants[0].totalSpent).toBe(0);
    expect(result.totalBudget).toBe(0);
    expect(result.totalSpent).toBe(0);
  });

  it("sorts grants by alert count descending", async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      { id: "g1", name: "G1", funding_agency: "DOE", omb_framework: "pre_oct_2024", period_end: "2025-01-01" },
                      { id: "g2", name: "G2", funding_agency: "DOD", omb_framework: "pre_oct_2024", period_end: "2025-06-01" },
                    ],
                    error: null,
                  })
                ),
              })),
            })),
          })),
        };
      }
      if (table === "grant_budgets") {
        return {
          select: vi.fn(() => ({
            in: vi.fn(() =>
              Promise.resolve({
                data: [
                  { grant_id: "g1", category: "personnel", budgeted_amount: 1000 },
                  { grant_id: "g2", category: "personnel", budgeted_amount: 1000 },
                  { grant_id: "g2", category: "travel", budgeted_amount: 500 },
                ],
                error: null,
              })
            ),
          })),
        };
      }
      if (table === "expenses") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(() => ({
                neq: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      // g1: 50% utilization → no alerts
                      { grant_id: "g1", confirmed_category: "personnel", ai_category: null, amount: 500, status: "confirmed" },
                      // g2: 95% on personnel (critical), 90% on travel (critical) → 2 alerts
                      { grant_id: "g2", confirmed_category: "personnel", ai_category: null, amount: 950, status: "confirmed" },
                      { grant_id: "g2", confirmed_category: "travel", ai_category: null, amount: 450, status: "confirmed" },
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

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getOverviewMetrics } = await import("./budget-actual");
    const result = await getOverviewMetrics("org_sort");

    // g2 has more alerts (2) than g1 (0), so g2 should come first
    expect(result.grants[0].name).toBe("G2");
    expect(result.grants[1].name).toBe("G1");
    expect(result.totalAlerts).toBe(2);
  });

  it("aggregates budgets and expenses correctly across multiple grants", async () => {
    const grantsChain = createThenable({
      data: [
        { id: "g1", name: "Grant A", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_end: "2025-01-01", created_at: "2024-01-01" },
        { id: "g2", name: "Grant B", funding_agency: "DOE", omb_framework: "post_oct_2024", period_end: "2025-06-01", created_at: "2024-02-01" },
      ],
      error: null,
    });
    const budgetsChain = createThenable({
      data: [
        { grant_id: "g1", category: "personnel", budgeted_amount: 10000 },
        { grant_id: "g1", category: "travel", budgeted_amount: 5000 },
        { grant_id: "g2", category: "supplies", budgeted_amount: 8000 },
      ],
      error: null,
    });
    const expensesChain = createThenable({
      data: [
        { grant_id: "g1", confirmed_category: "personnel", ai_category: null, amount: 6000, status: "confirmed" },
        { grant_id: "g1", confirmed_category: "travel", ai_category: null, amount: 4500, status: "confirmed" },
        { grant_id: "g2", confirmed_category: "supplies", ai_category: null, amount: 3000, status: "confirmed" },
        { grant_id: "g2", confirmed_category: null, ai_category: "supplies", amount: 500, status: "pending_review" },
      ],
      error: null,
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantsChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") return { select: vi.fn(() => expensesChain) };
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getOverviewMetrics } = await import("./budget-actual");
    const result = await getOverviewMetrics("org_multi");

    expect(result.totalBudget).toBe(23000);
    expect(result.totalSpent).toBe(13500);

    // g1: travel at 90% → critical alert; g2: supplies at 37.5% → none
    const g1 = result.grants.find(g => g.id === "g1")!;
    expect(g1.totalBudget).toBe(15000);
    expect(g1.totalSpent).toBe(10500);
    expect(g1.confirmedCount).toBe(2);
    expect(g1.alertCount).toBe(1); // travel 90% → critical

    const g2 = result.grants.find(g => g.id === "g2")!;
    expect(g2.totalBudget).toBe(8000);
    expect(g2.totalSpent).toBe(3000);
    expect(g2.pendingCount).toBe(1);
    expect(g2.alertCount).toBe(0);

    expect(result.totalAlerts).toBe(1);
  });

  it("counts only confirmed expenses in spent, pending_review in pending", async () => {
    const grantsChain = createThenable({
      data: [{ id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_end: "2025-01-01", created_at: "2024-01-01" }],
      error: null,
    });
    const budgetsChain = createThenable({
      data: [{ grant_id: "g1", category: "personnel", budgeted_amount: 10000 }],
      error: null,
    });
    const expensesChain = createThenable({
      data: [
        { grant_id: "g1", confirmed_category: "personnel", ai_category: null, amount: 3000, status: "confirmed" },
        { grant_id: "g1", confirmed_category: "personnel", ai_category: null, amount: 2000, status: "confirmed" },
        { grant_id: "g1", confirmed_category: null, ai_category: "personnel", amount: 1500, status: "pending_review" },
        { grant_id: "g1", confirmed_category: null, ai_category: "personnel", amount: 1000, status: "pending_review" },
      ],
      error: null,
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantsChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") return { select: vi.fn(() => expensesChain) };
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getOverviewMetrics } = await import("./budget-actual");
    const result = await getOverviewMetrics("org_status");
    const g1 = result.grants[0];
    expect(g1.totalSpent).toBe(5000); // only confirmed amounts
    expect(g1.confirmedCount).toBe(2);
    expect(g1.pendingCount).toBe(2);
  });

  it("maps null confirmed_category to 'other' in overview context", async () => {
    const grantsChain = createThenable({
      data: [{ id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_end: "2025-01-01", created_at: "2024-01-01" }],
      error: null,
    });
    const budgetsChain = createThenable({
      data: [
        { grant_id: "g1", category: "other", budgeted_amount: 5000 },
        { grant_id: "g1", category: "personnel", budgeted_amount: 10000 },
      ],
      error: null,
    });
    const expensesChain = createThenable({
      data: [
        { grant_id: "g1", confirmed_category: null, ai_category: "supplies", amount: 4500, status: "confirmed" },
      ],
      error: null,
    });

    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantsChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") return { select: vi.fn(() => expensesChain) };
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getOverviewMetrics } = await import("./budget-actual");
    const result = await getOverviewMetrics("org_null_cat");
    // Null confirmed_category → "other", $4500 spent against $5000 budget = 90% → critical
    expect(result.grants[0].totalSpent).toBe(4500);
    expect(result.totalAlerts).toBe(1); // other at 90% → critical
  });

  it("produces zeros for a grant with no budgets or expenses", async () => {
    const grantsChain = createThenable({
      data: [{ id: "g1", name: "Empty Grant", funding_agency: "HHS", omb_framework: "pre_oct_2024", period_end: "2025-01-01", created_at: "2024-01-01" }],
      error: null,
    });
    const budgetsChain = createThenable({ data: [], error: null });
    const expensesChain = createThenable({ data: [], error: null });

    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantsChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") return { select: vi.fn(() => expensesChain) };
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getOverviewMetrics } = await import("./budget-actual");
    const result = await getOverviewMetrics("org_empty_grant");
    expect(result.grants).toHaveLength(1);
    expect(result.grants[0].totalBudget).toBe(0);
    expect(result.grants[0].totalSpent).toBe(0);
    expect(result.grants[0].utilization).toBe(0);
    expect(result.grants[0].alertCount).toBe(0);
    expect(result.grants[0].pendingCount).toBe(0);
    expect(result.grants[0].confirmedCount).toBe(0);
  });

  it("treats null budgeted_amount as 0 without NaN", async () => {
    const grantsChain = createThenable({
      data: [{ id: "g1", name: "G1", funding_agency: "NSF", omb_framework: "pre_oct_2024", period_end: "2025-01-01", created_at: "2024-01-01" }],
      error: null,
    });
    const budgetsChain = createThenable({
      data: [{ grant_id: "g1", category: "travel", budgeted_amount: null }],
      error: null,
    });
    const expensesChain = createThenable({ data: [], error: null });

    const mockFrom = vi.fn((table: string) => {
      if (table === "grants") return { select: vi.fn(() => grantsChain) };
      if (table === "grant_budgets") return { select: vi.fn(() => budgetsChain) };
      if (table === "expenses") return { select: vi.fn(() => expensesChain) };
      return {};
    });

    const { createServerClient } = await import("@/lib/supabase/server");
    vi.mocked(createServerClient).mockResolvedValue({ from: mockFrom } as never);

    const { getOverviewMetrics } = await import("./budget-actual");
    const result = await getOverviewMetrics("org_null_budget");
    expect(result.grants[0].totalBudget).toBe(0);
    expect(Number.isNaN(result.grants[0].totalBudget)).toBe(false);
    expect(Number.isNaN(result.grants[0].utilization)).toBe(false);
  });
});

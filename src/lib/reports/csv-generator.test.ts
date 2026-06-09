import { describe, it, expect } from "vitest";
import { generateExpenseCSV, generateBudgetSummaryCSV, generateMonthlyBreakdownCSV } from "./csv-generator";

function makeExpense(overrides: Partial<Parameters<typeof generateExpenseCSV>[0][0]> = {}) {
  return {
    date: "2024-06-15",
    vendor: "Acme Corp",
    description: "Office supplies purchase",
    amount: 250.5,
    ai_category: "supplies",
    confirmed_category: "supplies",
    ai_confidence: "high",
    ai_cfr_citation: "§200.453",
    confirmed_by: "user_123",
    confirmed_at: "2024-06-16T10:00:00Z",
    status: "confirmed",
    ...overrides,
  };
}

describe("generateExpenseCSV", () => {
  it("generates CSV with correct headers and values", () => {
    const csv = generateExpenseCSV([makeExpense()]);
    expect(csv).toContain("Date");
    expect(csv).toContain("Vendor");
    expect(csv).toContain("Description");
    expect(csv).toContain("Amount");
    expect(csv).toContain("AI Category");
    expect(csv).toContain("Confirmed Category");
    expect(csv).toContain("Acme Corp");
    expect(csv).toContain("250.50");
    expect(csv).toContain("supplies");
  });

  it("handles null fields without literal null in output", () => {
    const csv = generateExpenseCSV([
      makeExpense({
        ai_category: null,
        confirmed_category: null,
        ai_confidence: null,
        ai_cfr_citation: null,
        confirmed_by: null,
        confirmed_at: null,
      }),
    ]);
    expect(csv).not.toContain("null");
  });

  it("escapes special characters in fields", () => {
    const csv = generateExpenseCSV([
      makeExpense({
        description: 'Has "quotes", commas, and\nnewlines',
      }),
    ]);
    // PapaParse wraps fields with special chars in quotes
    expect(csv).toContain("quotes");
    expect(csv).toContain("commas");
  });

  it("returns empty string for empty array", () => {
    const csv = generateExpenseCSV([]);
    // PapaParse returns empty string when given empty data array
    expect(csv).toBe("");
  });

  it("handles negative amount (refund)", () => {
    const csv = generateExpenseCSV([makeExpense({ amount: -250 })]);
    expect(csv).toContain("-250.00");
  });

  it("handles zero amount", () => {
    const csv = generateExpenseCSV([makeExpense({ amount: 0 })]);
    expect(csv).toContain("0.00");
  });
});

describe("generateBudgetSummaryCSV", () => {
  function makeBudgetLine(overrides: Partial<Parameters<typeof generateBudgetSummaryCSV>[0][0]> = {}) {
    return {
      category: "personnel",
      budgeted: 10000,
      spent: 7500,
      remaining: 2500,
      utilization: 75.0,
      ...overrides,
    };
  }

  it("generates CSV with correct headers", () => {
    const csv = generateBudgetSummaryCSV([makeBudgetLine()]);
    expect(csv).toContain("Category");
    expect(csv).toContain("Budgeted Amount");
    expect(csv).toContain("Spent Amount");
    expect(csv).toContain("Remaining");
    expect(csv).toContain("Utilization %");
  });

  it("formats numeric fields correctly", () => {
    const csv = generateBudgetSummaryCSV([makeBudgetLine({ budgeted: 10000, spent: 7500.5, remaining: 2499.5, utilization: 75.3 })]);
    expect(csv).toContain("10000.00");
    expect(csv).toContain("7500.50");
    expect(csv).toContain("2499.50");
    expect(csv).toContain("75.3"); // 1 decimal for utilization
  });

  it("returns empty string for empty array", () => {
    const csv = generateBudgetSummaryCSV([]);
    expect(csv).toBe("");
  });

  it("handles negative remaining (overspent)", () => {
    const csv = generateBudgetSummaryCSV([
      makeBudgetLine({ budgeted: 5000, spent: 7000, remaining: -2000, utilization: 140.0 }),
    ]);
    expect(csv).toContain("-2000.00");
    expect(csv).toContain("140.0");
  });

  it("handles zero utilization", () => {
    const csv = generateBudgetSummaryCSV([
      makeBudgetLine({ budgeted: 10000, spent: 0, remaining: 10000, utilization: 0 }),
    ]);
    expect(csv).toContain("0.00");
    expect(csv).toContain("0.0");
  });
});

describe("generateMonthlyBreakdownCSV", () => {
  const categories = ["personnel", "supplies", "travel"];

  function makeMonthlyExpense(overrides: Partial<{
    date: string;
    amount: number;
    confirmed_category: string | null;
    ai_category: string | null;
  }> = {}) {
    return {
      date: "2024-06-15",
      amount: 100,
      confirmed_category: "personnel" as string | null,
      ai_category: "personnel" as string | null,
      ...overrides,
    };
  }

  it("groups by YYYY-MM correctly", () => {
    const expenses = [
      makeMonthlyExpense({ date: "2024-01-15", amount: 100, confirmed_category: "personnel" }),
      makeMonthlyExpense({ date: "2024-01-20", amount: 200, confirmed_category: "personnel" }),
      makeMonthlyExpense({ date: "2024-06-10", amount: 300, confirmed_category: "supplies" }),
    ];
    const csv = generateMonthlyBreakdownCSV(expenses, categories);
    const lines = csv.split("\n");
    // Header + 2 month rows
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("2024-01");
    expect(lines[2]).toContain("2024-06");
    // January personnel: 100 + 200 = 300
    expect(lines[1]).toContain("300.00");
    // June supplies: 300
    expect(lines[2]).toContain("300.00");
  });

  it("null confirmed_category falls back to ai_category", () => {
    const expenses = [
      makeMonthlyExpense({ date: "2024-03-01", amount: 500, confirmed_category: null, ai_category: "travel" }),
    ];
    const csv = generateMonthlyBreakdownCSV(expenses, categories);
    // travel column should contain 500.00
    const lines = csv.split("\n");
    // Header has: Month, personnel, supplies, travel, Total
    const header = lines[0];
    expect(header).toContain("travel");
    // Data row
    expect(lines[1]).toContain("500.00");
  });

  it('both null → falls back to "other"', () => {
    const catsWithOther = [...categories, "other"];
    const expenses = [
      makeMonthlyExpense({ date: "2024-04-01", amount: 150, confirmed_category: null, ai_category: null }),
    ];
    const csv = generateMonthlyBreakdownCSV(expenses, catsWithOther);
    const lines = csv.split("\n");
    // "other" column should have 150.00
    expect(lines[1]).toContain("150.00");
  });

  it("months are sorted chronologically", () => {
    const expenses = [
      makeMonthlyExpense({ date: "2024-12-01", amount: 100, confirmed_category: "personnel" }),
      makeMonthlyExpense({ date: "2024-01-01", amount: 200, confirmed_category: "personnel" }),
      makeMonthlyExpense({ date: "2024-06-01", amount: 300, confirmed_category: "personnel" }),
    ];
    const csv = generateMonthlyBreakdownCSV(expenses, categories);
    const lines = csv.split("\n");
    // Rows 1, 2, 3 should be Jan, Jun, Dec
    expect(lines[1]).toContain("2024-01");
    expect(lines[2]).toContain("2024-06");
    expect(lines[3]).toContain("2024-12");
  });

  it("per-row total sums all category amounts", () => {
    const expenses = [
      makeMonthlyExpense({ date: "2024-05-01", amount: 100, confirmed_category: "personnel" }),
      makeMonthlyExpense({ date: "2024-05-15", amount: 200, confirmed_category: "supplies" }),
      makeMonthlyExpense({ date: "2024-05-20", amount: 50, confirmed_category: "travel" }),
    ];
    const csv = generateMonthlyBreakdownCSV(expenses, categories);
    const lines = csv.split("\n");
    // Total should be 350.00
    expect(lines[1]).toContain("350.00");
  });

  it("handles single month of data", () => {
    const expenses = [
      makeMonthlyExpense({ date: "2024-03-15", amount: 500, confirmed_category: "personnel" }),
    ];
    const csv = generateMonthlyBreakdownCSV(expenses, categories);
    const lines = csv.split("\n");
    // Header + 1 data row
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("2024-03");
    expect(lines[1]).toContain("500.00");
  });

  it("returns empty output for no expenses", () => {
    const csv = generateMonthlyBreakdownCSV([], categories);
    // With no expenses, monthMap is empty, months is [], data is []
    // Papa.unparse([]) should return empty string
    expect(csv).toBe("");
  });

  it("handles malformed date '2024-1-5' → slice(0,7) produces key '2024-1-'", () => {
    const expenses = [
      makeMonthlyExpense({ date: "2024-1-5", amount: 100, confirmed_category: "personnel" }),
    ];
    const csv = generateMonthlyBreakdownCSV(expenses, categories);
    const lines = csv.split("\n");
    // slice(0,7) on "2024-1-5" → "2024-1-"
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain("2024-1-");
  });

  it("generates 12 monthly rows for a full year of expenses", () => {
    const expenses: ReturnType<typeof makeMonthlyExpense>[] = [];
    for (let m = 1; m <= 12; m++) {
      const month = String(m).padStart(2, "0");
      expenses.push(
        makeMonthlyExpense({ date: `2024-${month}-15`, amount: 100 * m, confirmed_category: "personnel" })
      );
    }
    const csv = generateMonthlyBreakdownCSV(expenses, categories);
    const lines = csv.split("\n");
    // Header + 12 data rows
    expect(lines).toHaveLength(13);
    expect(lines[1]).toContain("2024-01");
    expect(lines[12]).toContain("2024-12");
  });
});

describe("generateExpenseCSV edge cases", () => {
  it("preserves Unicode in vendor/description", () => {
    const csv = generateExpenseCSV([
      makeExpense({
        vendor: "Café München",
        description: "日本語テスト — Unicode ñ ü ö",
      }),
    ]);
    expect(csv).toContain("Café München");
    expect(csv).toContain("日本語テスト");
  });

  it("generates CSV for large dataset (1000 expenses) without error", () => {
    const expenses = Array.from({ length: 1000 }, (_, i) =>
      makeExpense({ vendor: `Vendor_${i}`, amount: i * 10.5 })
    );
    const csv = generateExpenseCSV(expenses);
    const lines = csv.split("\n");
    // Header + 1000 data rows (some may have newlines within quoted fields,
    // but for simple data it should be 1001 lines)
    expect(lines.length).toBeGreaterThanOrEqual(1001);
  });

  it("round-trip: commas, quotes, and newlines produce valid CSV", () => {
    const csv = generateExpenseCSV([
      makeExpense({
        vendor: 'Vendor "A", Inc.',
        description: "Line1\nLine2",
      }),
    ]);
    // PapaParse should properly escape: double-quote → ""
    expect(csv).toContain('""A""');
  });
});

describe("generateBudgetSummaryCSV edge cases", () => {
  function makeBudgetLine2(overrides: Partial<Parameters<typeof generateBudgetSummaryCSV>[0][0]> = {}) {
    return {
      category: "personnel",
      budgeted: 10000,
      spent: 7500,
      remaining: 2500,
      utilization: 75.0,
      ...overrides,
    };
  }

  it("includes all 9 SF-424A categories", () => {
    const allCategories = [
      "personnel", "fringe_benefits", "travel", "equipment", "supplies",
      "contractual", "construction", "other", "indirect_charges",
    ];
    const lines = allCategories.map(c => makeBudgetLine2({ category: c }));
    const csv = generateBudgetSummaryCSV(lines);
    allCategories.forEach(cat => {
      expect(csv).toContain(cat);
    });
  });

  it("formats 9-digit budget amounts correctly", () => {
    const csv = generateBudgetSummaryCSV([
      makeBudgetLine2({ budgeted: 500000000, spent: 450000000, remaining: 50000000 }),
    ]);
    expect(csv).toContain("500000000.00");
    expect(csv).toContain("450000000.00");
  });
});

// --- Phase 4: CSV report edge cases ---

describe("generateMonthlyBreakdownCSV — edge cases", () => {
  const categories = ["personnel", "supplies", "travel"];

  function makeMonthlyExpense2(overrides: Partial<{
    date: string;
    amount: number;
    confirmed_category: string | null;
    ai_category: string | null;
  }> = {}) {
    return {
      date: "2024-06-15",
      amount: 100,
      confirmed_category: "personnel" as string | null,
      ai_category: "personnel" as string | null,
      ...overrides,
    };
  }

  it("empty date string produces empty month key", () => {
    const expenses = [
      makeMonthlyExpense2({ date: "", amount: 100, confirmed_category: "personnel" }),
    ];
    const csv = generateMonthlyBreakdownCSV(expenses, categories);
    const lines = csv.split("\n");
    // "".slice(0,7) === "" → row with empty Month column
    expect(lines).toHaveLength(2);
    // First column (Month) should be empty → CSV starts with comma
    expect(lines[1].startsWith(",") || lines[1].startsWith('""')).toBe(true);
  });

  it("empty categories array produces rows with Month + Total only", () => {
    const expenses = [
      makeMonthlyExpense2({ date: "2024-06-15", amount: 200, confirmed_category: "personnel" }),
    ];
    const csv = generateMonthlyBreakdownCSV(expenses, []);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(2);
    // Header should have Month and Total
    expect(lines[0]).toContain("Month");
    expect(lines[0]).toContain("Total");
    // Total should be 0.00 since "personnel" is not in empty categories array
    expect(lines[1]).toContain("0.00");
  });

  it("floating point precision: three $33.33 expenses sum to 99.99", () => {
    const expenses = [
      makeMonthlyExpense2({ date: "2024-06-01", amount: 33.33, confirmed_category: "personnel" }),
      makeMonthlyExpense2({ date: "2024-06-02", amount: 33.33, confirmed_category: "personnel" }),
      makeMonthlyExpense2({ date: "2024-06-03", amount: 33.33, confirmed_category: "personnel" }),
    ];
    const csv = generateMonthlyBreakdownCSV(expenses, categories);
    const lines = csv.split("\n");
    // 33.33 + 33.33 + 33.33 = 99.99 (toFixed(2) prevents floating point noise)
    expect(lines[1]).toContain("99.99");
  });

  it("category not in array excluded from columns", () => {
    const expenses = [
      makeMonthlyExpense2({ date: "2024-06-15", amount: 500, confirmed_category: "equipment" }),
    ];
    // categories only has personnel, supplies, travel — not equipment
    const csv = generateMonthlyBreakdownCSV(expenses, ["personnel"]);
    const lines = csv.split("\n");
    // Header should NOT contain "equipment"
    expect(lines[0]).not.toContain("equipment");
    // Total is 0.00 since "equipment" is not tracked in the columns
    expect(lines[1]).toContain("0.00");
  });
});

describe("generateBudgetSummaryCSV — additional edge cases", () => {
  function makeBudgetLine3(overrides: Partial<Parameters<typeof generateBudgetSummaryCSV>[0][0]> = {}) {
    return {
      category: "personnel",
      budgeted: 10000,
      spent: 7500,
      remaining: 2500,
      utilization: 75.0,
      ...overrides,
    };
  }

  it("all 9 SF-424A categories produces 9 + 1 rows (header + 9 data)", () => {
    const allCategories = [
      "personnel", "fringe_benefits", "travel", "equipment", "supplies",
      "contractual", "construction", "other", "indirect_charges",
    ];
    const lines = allCategories.map((c) => makeBudgetLine3({ category: c, budgeted: 1000, spent: 500, remaining: 500, utilization: 50 }));
    const csv = generateBudgetSummaryCSV(lines);
    const csvLines = csv.split("\n");
    // Header + 9 data rows
    expect(csvLines).toHaveLength(10);
    allCategories.forEach((cat) => {
      expect(csv).toContain(cat);
    });
    // All amounts formatted with .toFixed(2)
    expect(csv).toContain("1000.00");
    expect(csv).toContain("500.00");
  });

  it("negative remaining (overspent) formatted correctly", () => {
    const csv = generateBudgetSummaryCSV([
      makeBudgetLine3({ budgeted: 5000, spent: 7000, remaining: -2000, utilization: 140 }),
    ]);
    expect(csv).toContain("-2000.00");
    expect(csv).toContain("140.0");
  });
});

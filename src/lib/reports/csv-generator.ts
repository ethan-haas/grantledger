import Papa from "papaparse";

interface ReportExpense {
  date: string;
  vendor: string;
  description: string;
  amount: number;
  ai_category: string | null;
  confirmed_category: string | null;
  ai_confidence: string | null;
  ai_cfr_citation: string | null;
  confirmed_by: string | null;
  confirmed_at: string | null;
  status: string;
}

export function generateExpenseCSV(expenses: ReportExpense[]): string {
  const data = expenses.map((e) => ({
    Date: e.date,
    Vendor: e.vendor,
    Description: e.description || "",
    Amount: e.amount.toFixed(2),
    "AI Category": e.ai_category || "",
    "Confirmed Category": e.confirmed_category || "",
    Confidence: e.ai_confidence || "",
    "CFR Citation": e.ai_cfr_citation || "",
    "Confirmed By": e.confirmed_by || "",
    "Confirmed At": e.confirmed_at ? new Date(e.confirmed_at).toLocaleString() : "",
    Status: e.status,
  }));

  return Papa.unparse(data);
}

interface BudgetLine {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  utilization: number;
}

export function generateBudgetSummaryCSV(lines: BudgetLine[]): string {
  const data = lines.map((l) => ({
    Category: l.category,
    "Budgeted Amount": l.budgeted.toFixed(2),
    "Spent Amount": l.spent.toFixed(2),
    Remaining: l.remaining.toFixed(2),
    "Utilization %": l.utilization.toFixed(1),
  }));

  return Papa.unparse(data);
}

interface MonthlyExpense {
  date: string;
  amount: number;
  confirmed_category: string | null;
  ai_category: string | null;
}

export function generateMonthlyBreakdownCSV(
  expenses: MonthlyExpense[],
  categories: string[]
): string {
  // Group expenses by month × category
  const monthMap: Record<string, Record<string, number>> = {};

  expenses.forEach((e) => {
    const month = e.date.slice(0, 7); // YYYY-MM
    const cat = e.confirmed_category || e.ai_category || "other";
    if (!monthMap[month]) monthMap[month] = {};
    monthMap[month][cat] = (monthMap[month][cat] || 0) + e.amount;
  });

  const months = Object.keys(monthMap).sort();

  const data = months.map((month) => {
    const row: Record<string, string> = { Month: month };
    let total = 0;
    categories.forEach((cat) => {
      const amount = monthMap[month][cat] || 0;
      row[cat] = amount.toFixed(2);
      total += amount;
    });
    row["Total"] = total.toFixed(2);
    return row;
  });

  return Papa.unparse(data);
}

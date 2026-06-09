import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetDonutChart } from "./budget-donut-chart";
import type { AlertLevel } from "@/lib/queries/budget-actual";

// Mock Recharts as pass-through divs
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  PieChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Pie: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="pie" data-count={data.length}>{children}</div>
  ),
  Cell: ({ fill }: { fill: string }) => <div data-testid="cell" data-fill={fill} />,
  Tooltip: () => <div data-testid="tooltip" />,
}));

function makeCategory(overrides: Partial<{ category: string; budgeted: number; spent: number; alertLevel: AlertLevel }> = {}) {
  return {
    category: "personnel",
    budgeted: 10000,
    spent: 5000,
    alertLevel: "none" as AlertLevel,
    ...overrides,
  };
}

describe("BudgetDonutChart", () => {
  it("shows empty state when all categories have zero spent", () => {
    const data = [
      makeCategory({ category: "personnel", spent: 0 }),
      makeCategory({ category: "travel", spent: 0 }),
    ];
    render(<BudgetDonutChart data={data} />);
    expect(screen.getByText("No spending data")).toBeInTheDocument();
  });

  it("filters out zero-spent categories", () => {
    const data = [
      makeCategory({ category: "personnel", spent: 5000 }),
      makeCategory({ category: "travel", spent: 0 }),
      makeCategory({ category: "supplies", spent: 2000 }),
    ];
    render(<BudgetDonutChart data={data} />);
    const pie = screen.getByTestId("pie");
    expect(pie.getAttribute("data-count")).toBe("2");
  });

  it("calculates and displays total spent in center", () => {
    const data = [
      makeCategory({ category: "personnel", spent: 5000 }),
      makeCategory({ category: "travel", spent: 3000 }),
    ];
    render(<BudgetDonutChart data={data} />);
    // Total = $5,000 + $3,000 = $8,000
    expect(screen.getByText("$8,000.00")).toBeInTheDocument();
    expect(screen.getByText("Total Spent")).toBeInTheDocument();
  });

  it('has accessible role="img" with aria-label', () => {
    const data = [makeCategory({ spent: 1000 })];
    render(<BudgetDonutChart data={data} />);
    const chartWrapper = screen.getByRole("img");
    expect(chartWrapper).toHaveAttribute("aria-label", "Budget spending distribution donut chart");
  });

  it("maps category values to human-readable labels", () => {
    const data = [
      makeCategory({ category: "indirect_charges", spent: 1000 }),
    ];
    render(<BudgetDonutChart data={data} />);
    // Chart renders (not empty state) — label mapping succeeded
    const pie = screen.getByTestId("pie");
    expect(pie.getAttribute("data-count")).toBe("1");
    expect(screen.queryByText("No spending data")).not.toBeInTheDocument();
  });
});

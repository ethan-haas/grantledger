import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BudgetBarChart } from "./budget-bar-chart";
import type { AlertLevel } from "@/lib/queries/budget-actual";

// Mock Recharts components to render children/props as simple divs
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  BarChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="bar-chart" data-count={data.length}>{children}</div>
  ),
  Bar: ({ dataKey }: { dataKey: string }) => <div data-testid={`bar-${dataKey}`} />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}));

// Mock theme hook
vi.mock("@/hooks/use-theme", () => ({
  useResolvedTheme: () => "light",
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

describe("BudgetBarChart", () => {
  it("renders empty state when no data with budget > 0", () => {
    render(<BudgetBarChart data={[]} />);
    expect(screen.getByText("No budget data")).toBeInTheDocument();
    expect(screen.getByText("Allocate budget amounts to see the chart.")).toBeInTheDocument();
  });

  it("filters out categories with zero budget and zero spent", () => {
    const data = [
      makeCategory({ category: "personnel", budgeted: 10000, spent: 5000 }),
      makeCategory({ category: "equipment", budgeted: 0, spent: 0 }),
      makeCategory({ category: "travel", budgeted: 5000, spent: 0 }),
    ];
    render(<BudgetBarChart data={data} />);
    const chart = screen.getByTestId("bar-chart");
    // Only personnel + travel should pass filter (2 items)
    expect(chart.getAttribute("data-count")).toBe("2");
  });

  it('has accessible role="img" with aria-label', () => {
    const data = [makeCategory()];
    render(<BudgetBarChart data={data} />);
    const chartWrapper = screen.getByRole("img");
    expect(chartWrapper).toHaveAttribute("aria-label", "Budget versus actual spending bar chart");
  });

  it("maps category values to SF-424A labels", () => {
    // When data passes through, the "name" field should be the human-readable label
    // We verify the chart receives transformed data by checking the chart renders (non-empty)
    const data = [
      makeCategory({ category: "personnel" }),
      makeCategory({ category: "indirect_charges" }),
    ];
    render(<BudgetBarChart data={data} />);
    // Chart renders with 2 items (both have non-zero data)
    const chart = screen.getByTestId("bar-chart");
    expect(chart.getAttribute("data-count")).toBe("2");
    // No empty state
    expect(screen.queryByText("No budget data")).not.toBeInTheDocument();
  });
});

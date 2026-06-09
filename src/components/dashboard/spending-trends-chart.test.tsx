import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import SpendingTrendsChart from "./spending-trends-chart";

// Must use vi.hoisted() so the mock variable is available inside the hoisted vi.mock factory
const { CartesianGridMock } = vi.hoisted(() => ({
  CartesianGridMock: vi.fn(({ stroke }: { stroke: string }) => (
    <div data-testid="cartesian-grid" data-stroke={stroke} />
  )),
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children, data }: { children: React.ReactNode; data: unknown[] }) => (
    <div data-testid="line-chart" data-count={data.length}>{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: CartesianGridMock,
  Tooltip: () => <div data-testid="tooltip" />,
}));

const sampleData = [
  { month: "Jan 2024", amount: 5000 },
  { month: "Feb 2024", amount: 7500 },
  { month: "Mar 2024", amount: 6000 },
];

describe("SpendingTrendsChart", () => {
  it("renders chart with monthly data", () => {
    render(<SpendingTrendsChart data={sampleData} />);
    const chart = screen.getByTestId("line-chart");
    expect(chart.getAttribute("data-count")).toBe("3");
  });

  it('has accessible role="img" with aria-label', () => {
    render(<SpendingTrendsChart data={sampleData} />);
    const wrapper = screen.getByRole("img");
    expect(wrapper).toHaveAttribute("aria-label", "Monthly spending trends chart");
  });

  it("passes dark mode colors when isDark=true", () => {
    render(<SpendingTrendsChart data={sampleData} isDark={true} />);
    const grid = screen.getByTestId("cartesian-grid");
    expect(grid.getAttribute("data-stroke")).toBe("#334155");
  });

  it("passes light mode colors by default", () => {
    render(<SpendingTrendsChart data={sampleData} />);
    const grid = screen.getByTestId("cartesian-grid");
    expect(grid.getAttribute("data-stroke")).toBe("#e2e8f0");
  });
});

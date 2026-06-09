import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { SpendingTrends } from "./spending-trends";

// Mock the dynamically imported chart component
vi.mock("next/dynamic", () => ({
  default: () => {
    const MockChart = ({ data }: { data: unknown[] }) => (
      <div data-testid="spending-trends-chart" data-count={data.length} />
    );
    MockChart.displayName = "MockChart";
    return MockChart;
  },
}));

// Mock theme hook
vi.mock("@/hooks/use-theme", () => ({
  useResolvedTheme: () => "light",
}));

describe("SpendingTrends", () => {
  it("returns null for empty data array", () => {
    const { container } = render(<SpendingTrends data={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders card with "Spending Trends" title', () => {
    render(<SpendingTrends data={[{ month: "Jan", amount: 100 }]} />);
    expect(screen.getByText("Spending Trends")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<SpendingTrends data={[{ month: "Jan", amount: 100 }]} />);
    expect(screen.getByText("Monthly confirmed expense totals.")).toBeInTheDocument();
  });

  it("passes data to chart component", () => {
    const data = [
      { month: "Jan", amount: 100 },
      { month: "Feb", amount: 200 },
    ];
    render(<SpendingTrends data={data} />);
    const chart = screen.getByTestId("spending-trends-chart");
    expect(chart.getAttribute("data-count")).toBe("2");
  });
});

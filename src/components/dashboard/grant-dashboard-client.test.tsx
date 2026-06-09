import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GrantDashboardClient } from "./grant-dashboard-client";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => {
      const { initial: _i, animate: _a, exit: _e, transition: _t, ...rest } = props;
      return <div {...rest}>{children as React.ReactNode}</div>;
    },
  },
}));

// Mock dynamic-imported chart components
vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<{ BudgetBarChart?: unknown; BudgetDonutChart?: unknown; default?: unknown }>) => {
    // Return a component that renders with a data-testid based on the resolved component name
    const MockComponent = (props: Record<string, unknown>) => {
      const name = loader.toString().includes("budget-bar-chart") ? "bar-chart-stub" : "donut-chart-stub";
      return <div data-testid={name} data-props={JSON.stringify(props)} />;
    };
    MockComponent.displayName = "DynamicMock";
    return MockComponent;
  },
}));

// Mock category-detail
vi.mock("./category-detail", () => ({
  CategoryDetail: ({ category, onClose }: { category: string; grantId: string; onClose: () => void }) => (
    <div data-testid="category-detail" data-category={category}>
      <button onClick={onClose}>Close</button>
    </div>
  ),
}));

// Mock posthog
vi.mock("@/lib/posthog", () => ({
  trackEvent: vi.fn(),
}));

// Mock theme
vi.mock("@/hooks/use-theme", () => ({
  useResolvedTheme: () => "light",
}));

// Mock indirect cost check
const { mockCheckResult } = vi.hoisted(() => ({
  mockCheckResult: {
    isCompliant: true,
    indirectSpent: 0,
    mtdcBase: 0,
    rate: 0.1,
    maxAllowable: 0,
    overageAmount: 0,
  },
}));

vi.mock("@/lib/queries/indirect-cost-check", () => ({
  checkIndirectCostCompliance: () => mockCheckResult,
}));

function makeDashboardData(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    grantId: "g1",
    grantName: "Test Grant",
    ombFramework: "pre_oct_2024",
    totalBudget: 100000,
    totalSpent: 45000,
    confirmedCount: 20,
    pendingCount: 5,
    categories: [
      { category: "personnel", budgeted: 50000, spent: 25000, remaining: 25000, utilization: 50, alertLevel: "none" },
      { category: "travel", budgeted: 20000, spent: 10000, remaining: 10000, utilization: 50, alertLevel: "none" },
      { category: "supplies", budgeted: 30000, spent: 10000, remaining: 20000, utilization: 33.3, alertLevel: "none" },
    ],
    monthlySpending: [],
    ...overrides,
  };
}

function mockFetchSuccess(data: Record<string, unknown>): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => "application/json" },
    json: () => Promise.resolve(data),
  }));
}

function mockFetchFailure(): void {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: false,
    headers: { get: () => "application/json" },
  }));
}

describe("GrantDashboardClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset indirect cost check to compliant
    mockCheckResult.isCompliant = true;
    mockCheckResult.indirectSpent = 0;
    mockCheckResult.mtdcBase = 0;
    mockCheckResult.maxAllowable = 0;
    mockCheckResult.overageAmount = 0;
    mockCheckResult.rate = 0.1;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders loading skeletons while fetching", () => {
    // Use a fetch that never resolves
    vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
    render(<GrantDashboardClient grantId="g1" />);
    // 4 skeleton cards should be visible in the grid
    const cards = document.querySelectorAll("[class*='gap-4'] > div");
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it("renders error card with retry on fetch failure", async () => {
    mockFetchFailure();
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load dashboard data")).toBeInTheDocument();
    });
    expect(screen.getByText("Try again")).toBeInTheDocument();
  });

  it("renders empty state when data is null", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => "application/json" },
      json: () => Promise.resolve(null),
    }));
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("No dashboard data available")).toBeInTheDocument();
    });
  });

  it("renders financial stats with correct values", async () => {
    mockFetchSuccess(makeDashboardData());
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("$100,000.00")).toBeInTheDocument();
    });
    expect(screen.getByText("$45,000.00")).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders budget alerts for categories above thresholds", async () => {
    const data = makeDashboardData({
      categories: [
        { category: "personnel", budgeted: 50000, spent: 45000, remaining: 5000, utilization: 90, alertLevel: "critical" },
        { category: "travel", budgeted: 20000, spent: 5000, remaining: 15000, utilization: 25, alertLevel: "none" },
      ],
    });
    mockFetchSuccess(data);
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("Budget Alerts")).toBeInTheDocument();
    });
  });

  it("hides budget alerts when all categories are on track", async () => {
    mockFetchSuccess(makeDashboardData());
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("$100,000.00")).toBeInTheDocument();
    });
    expect(screen.queryByText("Budget Alerts")).not.toBeInTheDocument();
  });

  it("equipment threshold warning shows pre_oct_2024 value", async () => {
    const data = makeDashboardData({
      ombFramework: "pre_oct_2024",
      categories: [
        { category: "equipment", budgeted: 20000, spent: 8000, remaining: 12000, utilization: 40, alertLevel: "none" },
      ],
    });
    mockFetchSuccess(data);
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("Equipment Threshold")).toBeInTheDocument();
    });
    // $5,000.00 appears in both the description paragraph and the Badge
    const matches = screen.getAllByText(/\$5,000\.00/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("equipment threshold warning shows post_oct_2024 value", async () => {
    const data = makeDashboardData({
      ombFramework: "post_oct_2024",
      categories: [
        { category: "equipment", budgeted: 20000, spent: 8000, remaining: 12000, utilization: 40, alertLevel: "none" },
      ],
    });
    mockFetchSuccess(data);
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("Equipment Threshold")).toBeInTheDocument();
    });
    const matches = screen.getAllByText(/\$10,000\.00/);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("indirect cost compliance danger alert when non-compliant", async () => {
    mockCheckResult.isCompliant = false;
    mockCheckResult.indirectSpent = 15000;
    mockCheckResult.mtdcBase = 100000;
    mockCheckResult.rate = 0.1;
    mockCheckResult.maxAllowable = 10000;
    mockCheckResult.overageAmount = 5000;

    mockFetchSuccess(makeDashboardData());
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("Indirect Cost Limit Exceeded")).toBeInTheDocument();
    });
  });

  it("hides indirect cost alert when compliant", async () => {
    mockCheckResult.isCompliant = true;
    mockFetchSuccess(makeDashboardData());
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("$100,000.00")).toBeInTheDocument();
    });
    expect(screen.queryByText("Indirect Cost Limit Exceeded")).not.toBeInTheDocument();
  });

  it("chart type toggle switches between bar and donut", async () => {
    mockFetchSuccess(makeDashboardData());
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("Budget vs. Actual")).toBeInTheDocument();
    });

    // Bar chart should be visible by default (both stubs render, but bar is the default chartType)
    const barBtn = screen.getByRole("button", { name: "Bar" });
    const donutBtn = screen.getByRole("button", { name: "Donut" });
    expect(barBtn).toHaveAttribute("aria-pressed", "true");
    expect(donutBtn).toHaveAttribute("aria-pressed", "false");

    // Click Donut
    fireEvent.click(donutBtn);
    expect(donutBtn).toHaveAttribute("aria-pressed", "true");
    expect(barBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("date filter params passed to fetch", async () => {
    mockFetchSuccess(makeDashboardData());
    render(<GrantDashboardClient grantId="g1" />);
    await waitFor(() => {
      expect(screen.getByText("$100,000.00")).toBeInTheDocument();
    });

    // Verify initial fetch URL
    const fetchMock = vi.mocked(fetch);
    const initialUrl = fetchMock.mock.calls[0][0] as string;
    expect(initialUrl).toContain("/api/grants/g1/dashboard");

    // Set start date — label is not associated via htmlFor, find input by type
    const dateInputs = document.querySelectorAll("input[type='date']");
    expect(dateInputs.length).toBeGreaterThanOrEqual(1);
    fireEvent.change(dateInputs[0], { target: { value: "2024-01-01" } });

    await waitFor(() => {
      // After date change, fetch is called again with date_start param
      const lastCall = fetchMock.mock.calls[fetchMock.mock.calls.length - 1][0] as string;
      expect(lastCall).toContain("date_start=2024-01-01");
    });
  });
});

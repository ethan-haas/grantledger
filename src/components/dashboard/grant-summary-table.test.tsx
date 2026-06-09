import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// Must be hoisted before the component import so vi.mock calls are resolved first.
vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/grants/framework-badge", () => ({
  FrameworkBadge: ({ framework }: { framework: string }) => (
    <span data-testid="framework">{framework}</span>
  ),
}));

vi.mock("@/components/dashboard/alert-badge", () => ({
  AlertBadge: ({ level }: { level: string }) => (
    <span data-testid="alert">{level}</span>
  ),
}));

// Card renders its children directly so no mock is needed, but we do need
// to stub the Badge used inside the component.
vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-testid={`badge-${variant ?? "default"}`}>{children}</span>,
}));

import { GrantSummaryTable } from "./grant-summary-table";

const mockGrants = [
  {
    id: "g1",
    name: "Test Grant A",
    fundingAgency: "NSF",
    ombFramework: "pre_oct_2024",
    periodEnd: "2025-12-31",
    totalBudget: 100000,
    totalSpent: 80000,
    utilization: 80,
    alertCount: 1,
    pendingCount: 5,
    confirmedCount: 20,
  },
  {
    id: "g2",
    name: "Test Grant B",
    fundingAgency: "NIH",
    ombFramework: "post_oct_2024",
    periodEnd: "2026-06-30",
    totalBudget: 200000,
    totalSpent: 50000,
    utilization: 25,
    alertCount: 0,
    pendingCount: 0,
    confirmedCount: 10,
  },
];

describe("GrantSummaryTable", () => {
  it("renders all grant rows", () => {
    render(
      <GrantSummaryTable
        grants={mockGrants}
        totalBudget={300000}
        totalSpent={130000}
      />
    );
    expect(screen.getByText("Test Grant A")).toBeInTheDocument();
    expect(screen.getByText("Test Grant B")).toBeInTheDocument();
  });

  it("renders totals footer", () => {
    render(
      <GrantSummaryTable
        grants={mockGrants}
        totalBudget={300000}
        totalSpent={130000}
      />
    );
    expect(screen.getByText(/Totals \(2 grants\)/)).toBeInTheDocument();
  });

  it("links to grant detail pages", () => {
    render(
      <GrantSummaryTable
        grants={mockGrants}
        totalBudget={300000}
        totalSpent={130000}
      />
    );
    const link = screen.getByText("Test Grant A").closest("a");
    expect(link).toHaveAttribute("href", "/dashboard/grants/g1");
  });

  it("shows alert badges for grants with alerts", () => {
    render(
      <GrantSummaryTable
        grants={mockGrants}
        totalBudget={300000}
        totalSpent={130000}
      />
    );
    // Grant A has utilization=80 which maps to "warning" → AlertBadge rendered
    const alerts = screen.getAllByTestId("alert");
    expect(alerts.length).toBeGreaterThanOrEqual(1);
  });
});

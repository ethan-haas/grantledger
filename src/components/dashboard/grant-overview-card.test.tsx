import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    hover?: boolean;
    className?: string;
  }) => <div data-testid="card" {...props}>{children}</div>,
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({
    children,
    variant,
  }: {
    children: React.ReactNode;
    variant?: string;
  }) => <span data-testid={`badge-${variant ?? "default"}`}>{children}</span>,
}));

vi.mock("@/components/grants/framework-badge", () => ({
  FrameworkBadge: ({ framework }: { framework: string }) => (
    <span data-testid="framework">{framework}</span>
  ),
}));

import { GrantOverviewCard } from "./grant-overview-card";

const baseProps = {
  id: "g1",
  name: "Community Health Grant",
  fundingAgency: "NIH",
  ombFramework: "pre_oct_2024" as const,
  periodEnd: "2027-12-31",
  totalBudget: 100000,
  totalSpent: 45000,
  utilization: 45,
  alertCount: 0,
  pendingCount: 0,
};

describe("GrantOverviewCard", () => {
  it("renders grant name and agency", () => {
    render(<GrantOverviewCard {...baseProps} />);
    expect(screen.getByText("Community Health Grant")).toBeInTheDocument();
    expect(screen.getByText("NIH")).toBeInTheDocument();
  });

  it("renders utilization bar with correct width", () => {
    const { container } = render(<GrantOverviewCard {...baseProps} utilization={65} />);
    const bar = container.querySelector("[style]");
    expect(bar).toHaveStyle({ width: "65%" });
  });

  it("shows alert badge when alerts > 0", () => {
    render(<GrantOverviewCard {...baseProps} alertCount={3} />);
    expect(screen.getByTestId("badge-danger")).toBeInTheDocument();
    expect(screen.getByText("3 alerts")).toBeInTheDocument();
  });

  it("colors days remaining red when < 30 days", () => {
    // Set periodEnd to 10 days from now
    const soon = new Date();
    soon.setDate(soon.getDate() + 10);
    const periodEnd = soon.toISOString().split("T")[0];

    render(<GrantOverviewCard {...baseProps} periodEnd={periodEnd} />);
    const daysSpan = screen.getByText(/days remaining/);
    expect(daysSpan.className).toContain("text-warning-600");
  });

  it("bar color is danger-700 when utilization > 100%", () => {
    const { container } = render(
      <GrantOverviewCard {...baseProps} utilization={115} />
    );
    const bar = container.querySelector("[class*='bg-danger-700']");
    expect(bar).not.toBeNull();
  });

  it("bar color is warning-500 when utilization 80-90%", () => {
    const { container } = render(
      <GrantOverviewCard {...baseProps} utilization={85} />
    );
    const bar = container.querySelector("[class*='bg-warning-500']");
    expect(bar).not.toBeNull();
  });

  it("bar color is success-500 when utilization < 80%", () => {
    const { container } = render(
      <GrantOverviewCard {...baseProps} utilization={50} />
    );
    const bar = container.querySelector("[class*='bg-success-500']");
    expect(bar).not.toBeNull();
  });

  it("renders pending review count when > 0", () => {
    render(<GrantOverviewCard {...baseProps} pendingCount={12} />);
    expect(screen.getByText("12 pending review")).toBeInTheDocument();
  });
});

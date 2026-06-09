import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatsCard } from "./stats-card";

describe("StatsCard", () => {
  it("renders title and value", () => {
    render(<StatsCard title="Total Budget" value="$250,000" />);
    expect(screen.getByText("Total Budget")).toBeInTheDocument();
    expect(screen.getByText("$250,000")).toBeInTheDocument();
  });

  it("renders trend indicator", () => {
    render(
      <StatsCard
        title="Spending"
        value="$10,000"
        trend={{ value: 12, direction: "up", label: "vs last month" }}
      />
    );
    expect(screen.getByText("12%")).toBeInTheDocument();
    expect(screen.getByText("vs last month")).toBeInTheDocument();
  });

  it("renders as link when href is provided", () => {
    render(<StatsCard title="Grants" value="5" href="/dashboard/grants" />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/dashboard/grants");
  });

  it("renders without trend", () => {
    render(<StatsCard title="Pending" value="12" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});

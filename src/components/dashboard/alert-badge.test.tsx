import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AlertBadge } from "./alert-badge";

describe("AlertBadge", () => {
  it('returns null for "none" alert level', () => {
    const { container } = render(<AlertBadge level="none" utilization={50} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders "Warning (82.5%)" for warning level', () => {
    render(<AlertBadge level="warning" utilization={82.5} />);
    expect(screen.getByText("Warning (82.5%)")).toBeInTheDocument();
  });

  it('renders "Critical (92.3%)" for critical level', () => {
    render(<AlertBadge level="critical" utilization={92.3} />);
    expect(screen.getByText("Critical (92.3%)")).toBeInTheDocument();
  });

  it('renders "Overspent (115.0%)" for overspent level', () => {
    render(<AlertBadge level="overspent" utilization={115} />);
    expect(screen.getByText("Overspent (115.0%)")).toBeInTheDocument();
  });

  it("formats utilization to one decimal place", () => {
    render(<AlertBadge level="warning" utilization={80} />);
    expect(screen.getByText("Warning (80.0%)")).toBeInTheDocument();
  });
});

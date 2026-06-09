import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Sparkline } from "./sparkline";

describe("Sparkline", () => {
  it("renders SVG with role img", () => {
    render(<Sparkline data={[10, 20, 30, 40]} />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("renders nothing with fewer than 2 data points", () => {
    const { container } = render(<Sparkline data={[10]} />);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("has aria-label indicating within budget", () => {
    render(<Sparkline data={[10, 20, 15]} />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", expect.stringContaining("within budget"));
  });

  it("has aria-label indicating over budget when overBudget is true", () => {
    render(<Sparkline data={[10, 20, 15]} overBudget />);
    expect(screen.getByRole("img")).toHaveAttribute("aria-label", expect.stringContaining("over budget"));
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConfidenceBadge } from "./confidence-badge";

describe("ConfidenceBadge", () => {
  it("renders null for null confidence", () => {
    const { container } = render(<ConfidenceBadge confidence={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders visible text without aria-label", () => {
    render(<ConfidenceBadge confidence="high" />);
    const badge = screen.getByText("High");
    expect(badge).toBeDefined();
    expect(badge.getAttribute("aria-label")).toBeNull();
  });

  it("renders correct variant for each confidence level", () => {
    const { rerender } = render(<ConfidenceBadge confidence="high" />);
    expect(screen.getByText("High").className).toContain("success");

    rerender(<ConfidenceBadge confidence="medium" />);
    expect(screen.getByText("Medium").className).toContain("warning");

    rerender(<ConfidenceBadge confidence="low" />);
    expect(screen.getByText("Low").className).toContain("danger");
  });
});

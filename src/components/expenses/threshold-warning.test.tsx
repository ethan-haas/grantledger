import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThresholdWarning } from "./threshold-warning";

describe("ThresholdWarning", () => {
  it("renders nothing for non-equipment category", () => {
    const { container } = render(
      <ThresholdWarning amount={6000} framework="pre_oct_2024" category="personnel" />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when amount is below 80% of threshold", () => {
    const { container } = render(
      <ThresholdWarning amount={3000} framework="pre_oct_2024" category="equipment" />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders warning for pre-Oct equipment near $5K threshold", () => {
    render(
      <ThresholdWarning amount={4500} framework="pre_oct_2024" category="equipment" />
    );
    expect(screen.getByText(/Near \$5,000.00 equipment threshold/)).toBeDefined();
  });

  it("renders danger for post-Oct equipment exceeding $10K threshold", () => {
    render(
      <ThresholdWarning amount={11000} framework="post_oct_2024" category="equipment" />
    );
    expect(screen.getByText(/Exceeds \$10,000.00 equipment threshold/)).toBeDefined();
  });

  it("renders nothing for post-Oct equipment below 80% of $10K", () => {
    const { container } = render(
      <ThresholdWarning amount={4500} framework="post_oct_2024" category="equipment" />
    );
    expect(container.innerHTML).toBe("");
  });
});

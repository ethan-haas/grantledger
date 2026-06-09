import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThresholdCard } from "./threshold-card";

// Mock Tooltip to render children directly (avoids Radix portal issues)
vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children, content }: { children: React.ReactNode; content: string }) => (
    <span data-tooltip={content}>{children}</span>
  ),
}));

describe("ThresholdCard", () => {
  it("renders pre-Oct 2024 thresholds", () => {
    render(<ThresholdCard framework="pre_oct_2024" />);
    expect(screen.getByText("$5,000.00")).toBeInTheDocument();
    expect(screen.getByText("10% MTDC")).toBeInTheDocument();
    expect(screen.getByText("$25,000.00")).toBeInTheDocument();
  });

  it("renders post-Oct 2024 thresholds", () => {
    render(<ThresholdCard framework="post_oct_2024" />);
    expect(screen.getByText("$10,000.00")).toBeInTheDocument();
    expect(screen.getByText("15% MTDC")).toBeInTheDocument();
    expect(screen.getByText("$50,000.00")).toBeInTheDocument();
  });

  it('renders "Applicable Thresholds" heading', () => {
    render(<ThresholdCard framework="pre_oct_2024" />);
    expect(screen.getByText("Applicable Thresholds")).toBeInTheDocument();
  });

  it("tooltip content includes CFR references", () => {
    const { container } = render(<ThresholdCard framework="pre_oct_2024" />);
    const tooltips = container.querySelectorAll("[data-tooltip]");
    const tooltipTexts = Array.from(tooltips).map((el) => el.getAttribute("data-tooltip"));
    const joined = tooltipTexts.join(" ");
    expect(joined).toContain("2 CFR 200.439");
    expect(joined).toContain("2 CFR 200.414");
    expect(joined).toContain("2 CFR 200.1");
  });
});

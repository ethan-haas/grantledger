import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { ProgressiveSkeleton } from "@/components/ui/progressive-skeleton";

describe("ProgressiveSkeleton", () => {
  it("renders stat-card shape", () => {
    const { container } = render(<ProgressiveSkeleton shape="stat-card" />);
    expect(container.querySelector("[aria-hidden]")).toBeTruthy();
  });

  it("renders multiple items with count", () => {
    const { container } = render(<ProgressiveSkeleton shape="table-row" count={3} />);
    const rows = container.querySelectorAll(".flex.items-center.gap-4");
    expect(rows.length).toBe(3);
  });

  it("renders chart shape", () => {
    const { container } = render(<ProgressiveSkeleton shape="chart" />);
    expect(container.querySelector("[aria-hidden]")).toBeTruthy();
  });

  it("renders grant-card shape", () => {
    const { container } = render(<ProgressiveSkeleton shape="grant-card" />);
    expect(container.querySelector("[aria-hidden]")).toBeTruthy();
  });

  it("renders detail-header shape", () => {
    const { container } = render(<ProgressiveSkeleton shape="detail-header" />);
    expect(container.querySelector("[aria-hidden]")).toBeTruthy();
  });

  it("applies custom className", () => {
    const { container } = render(
      <ProgressiveSkeleton shape="text-block" className="my-custom-class" />,
    );
    expect(container.firstElementChild?.classList.contains("my-custom-class")).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FrameworkBadge } from "./framework-badge";

describe("FrameworkBadge", () => {
  it('renders "Pre-Oct 2024 Rules" for pre_oct_2024', () => {
    render(<FrameworkBadge framework="pre_oct_2024" />);
    expect(screen.getByText("Pre-Oct 2024 Rules")).toBeInTheDocument();
  });

  it('renders "Post-Oct 2024 Rules" for post_oct_2024', () => {
    render(<FrameworkBadge framework="post_oct_2024" />);
    expect(screen.getByText("Post-Oct 2024 Rules")).toBeInTheDocument();
  });

  it("renders as a Badge component (inline-flex span)", () => {
    render(<FrameworkBadge framework="pre_oct_2024" />);
    const badge = screen.getByText("Pre-Oct 2024 Rules");
    expect(badge.tagName).toBe("SPAN");
    expect(badge.className).toContain("inline-flex");
  });
});

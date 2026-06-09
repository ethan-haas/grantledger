import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChangelogEntry } from "@/components/marketing/changelog-entry";

describe("ChangelogEntry", () => {
  const defaultProps = {
    date: "February 2026",
    version: "v1.4",
    badges: [{ label: "New Feature", color: "bg-primary-50 text-primary-700" }],
    title: "World-Class UI/UX",
    items: ["Component library", "Blog & content hub"],
  };

  it("renders date and version", () => {
    render(<ChangelogEntry {...defaultProps} />);
    expect(screen.getByText("February 2026")).toBeDefined();
    expect(screen.getByText("v1.4")).toBeDefined();
  });

  it("renders badges", () => {
    render(<ChangelogEntry {...defaultProps} />);
    expect(screen.getByText("New Feature")).toBeDefined();
  });

  it("renders title and items", () => {
    render(<ChangelogEntry {...defaultProps} />);
    expect(screen.getByText("World-Class UI/UX")).toBeDefined();
    expect(screen.getByText("Component library")).toBeDefined();
    expect(screen.getByText("Blog & content hub")).toBeDefined();
  });

  it("renders timeline connector when not last", () => {
    const { container } = render(<ChangelogEntry {...defaultProps} />);
    expect(container.querySelector(".bg-slate-200")).toBeTruthy();
  });

  it("hides timeline connector when last", () => {
    const { container } = render(<ChangelogEntry {...defaultProps} isLast />);
    const connector = container.querySelector(".absolute.left-\\[11px\\]");
    expect(connector).toBeNull();
  });
});

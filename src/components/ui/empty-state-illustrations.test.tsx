import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  NoGrantsIllustration,
  NoExpensesIllustration,
  NoAlertsIllustration,
  NoActivityIllustration,
  NoBudgetIllustration,
} from "./empty-state-illustrations";

describe("Empty State Illustrations", () => {
  it("renders NoGrantsIllustration as SVG", () => {
    const { container } = render(<NoGrantsIllustration />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders NoExpensesIllustration as SVG", () => {
    const { container } = render(<NoExpensesIllustration />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders NoAlertsIllustration as SVG", () => {
    const { container } = render(<NoAlertsIllustration />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders NoActivityIllustration as SVG", () => {
    const { container } = render(<NoActivityIllustration />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders NoBudgetIllustration as SVG", () => {
    const { container } = render(<NoBudgetIllustration />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<NoGrantsIllustration className="custom-class" />);
    expect(container.querySelector("svg")).toHaveClass("custom-class");
  });
});

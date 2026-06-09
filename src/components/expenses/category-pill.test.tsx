import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryPill } from "./category-pill";

describe("CategoryPill", () => {
  it('renders "Uncategorized" for null category', () => {
    render(<CategoryPill category={null} />);
    expect(screen.getByText("Uncategorized")).toBeInTheDocument();
  });

  it('renders correct label for "personnel"', () => {
    render(<CategoryPill category="personnel" />);
    expect(screen.getByText("Personnel")).toBeInTheDocument();
    expect(screen.getByLabelText("Category: Personnel")).toBeInTheDocument();
  });

  it('renders correct label for "indirect_charges"', () => {
    render(<CategoryPill category="indirect_charges" />);
    expect(screen.getByText("Indirect Charges")).toBeInTheDocument();
    expect(screen.getByLabelText("Category: Indirect Charges")).toBeInTheDocument();
  });

  it('applies correct color classes for "supplies"', () => {
    render(<CategoryPill category="supplies" />);
    const pill = screen.getByLabelText("Category: Supplies");
    expect(pill.className).toContain("bg-orange-100");
  });
});

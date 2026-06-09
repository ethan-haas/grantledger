import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SavingsCalculator } from "@/components/marketing/savings-calculator";

describe("SavingsCalculator", () => {
  it("renders heading", () => {
    render(<SavingsCalculator />);
    expect(screen.getByText("Calculate your savings")).toBeDefined();
  });

  it("renders result sections", () => {
    render(<SavingsCalculator />);
    expect(screen.getByText("Hours saved per month")).toBeDefined();
    expect(screen.getByText("Cost per expense")).toBeDefined();
    expect(screen.getByText("Estimated annual savings")).toBeDefined();
  });

  it("shows default values", () => {
    render(<SavingsCalculator />);
    // Default 150 expenses * 4 min / 60 = 10 hours
    expect(screen.getByText("10h")).toBeDefined();
  });

  it("renders input labels", () => {
    render(<SavingsCalculator />);
    expect(screen.getByText("Active grants")).toBeDefined();
    expect(screen.getByText("Expenses per month")).toBeDefined();
  });

  it("renders description text", () => {
    render(<SavingsCalculator />);
    expect(screen.getByText("See how much time and money GrantLedger can save your team.")).toBeDefined();
  });
});

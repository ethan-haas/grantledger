import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BudgetTable } from "./budget-table";

// Mock InfoPopover to render children directly
vi.mock("@/components/ui/info-popover", () => ({
  InfoPopover: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

const BUDGET_CATEGORIES = [
  "personnel",
  "fringe_benefits",
  "travel",
  "equipment",
  "supplies",
  "contractual",
  "construction",
  "other",
  "indirect_charges",
];

function makeBudgets(amount = 1000): Record<string, number> {
  const budgets: Record<string, number> = {};
  BUDGET_CATEGORIES.forEach((cat) => {
    budgets[cat] = amount;
  });
  return budgets;
}

describe("BudgetTable", () => {
  it("renders all 9 SF-424A categories (no total row in tbody)", () => {
    render(<BudgetTable budgets={makeBudgets()} readOnly />);
    expect(screen.getByText("Personnel")).toBeInTheDocument();
    expect(screen.getByText("Fringe Benefits")).toBeInTheDocument();
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(screen.getByText("Equipment")).toBeInTheDocument();
    expect(screen.getByText("Supplies")).toBeInTheDocument();
    expect(screen.getByText("Contractual")).toBeInTheDocument();
    expect(screen.getByText("Construction")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
    expect(screen.getByText("Indirect Charges")).toBeInTheDocument();
    // 9 body rows
    const tbody = screen.getByRole("table").querySelector("tbody");
    expect(tbody?.querySelectorAll("tr")).toHaveLength(9);
  });

  it("computes and displays correct total", () => {
    // 9 categories × $1,000 = $9,000
    render(<BudgetTable budgets={makeBudgets(1000)} readOnly totalAmount={50000} />);
    expect(screen.getByText("$9,000.00")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  it("shows over-budget warning when total > totalAmount", () => {
    // 9 × $10,000 = $90,000 vs totalAmount $50,000
    render(<BudgetTable budgets={makeBudgets(10000)} readOnly totalAmount={50000} />);
    expect(screen.getByText(/Budget allocation exceeds total grant amount by/)).toBeInTheDocument();
    expect(screen.getByText(/\$40,000\.00/)).toBeInTheDocument();
  });

  it("shows no over-budget warning when total ≤ totalAmount", () => {
    render(<BudgetTable budgets={makeBudgets(1000)} readOnly totalAmount={50000} />);
    expect(screen.queryByText(/Budget allocation exceeds/)).not.toBeInTheDocument();
  });

  it("read-only mode shows formatted currency, no inputs", () => {
    render(<BudgetTable budgets={makeBudgets(2500)} readOnly />);
    // Each category shows $2,500.00
    const amounts = screen.getAllByText("$2,500.00");
    expect(amounts.length).toBe(9);
    // No input elements in the table
    const inputs = screen.queryAllByRole("spinbutton");
    expect(inputs).toHaveLength(0);
  });

  it("editable mode renders input for each category", () => {
    const onChange = vi.fn();
    render(<BudgetTable budgets={makeBudgets()} onChange={onChange} />);
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs).toHaveLength(9);
    // Check one aria-label
    expect(screen.getByLabelText("Budget amount for Personnel")).toBeInTheDocument();
    expect(screen.getByLabelText("Budget amount for Equipment")).toBeInTheDocument();
  });

  it("onChange fires with correct category and parsed amount", () => {
    const onChange = vi.fn();
    render(<BudgetTable budgets={makeBudgets(0)} onChange={onChange} />);
    const input = screen.getByLabelText("Budget amount for Travel");
    fireEvent.change(input, { target: { value: "5000" } });
    expect(onChange).toHaveBeenCalledWith("travel", 5000);
  });

  it("disabled prop disables all inputs", () => {
    const onChange = vi.fn();
    render(<BudgetTable budgets={makeBudgets()} onChange={onChange} disabled />);
    const inputs = screen.getAllByRole("spinbutton");
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });
});

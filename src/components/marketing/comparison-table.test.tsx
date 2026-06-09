import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComparisonTable } from "./comparison-table";

describe("ComparisonTable", () => {
  it("renders table with headers", () => {
    render(<ComparisonTable />);
    expect(screen.getByText("GrantLedger")).toBeInTheDocument();
    expect(screen.getByText("Spreadsheets")).toBeInTheDocument();
    expect(screen.getByText("Generic Accounting")).toBeInTheDocument();
  });

  it("renders feature rows", () => {
    render(<ComparisonTable />);
    expect(screen.getByText("AI expense categorization")).toBeInTheDocument();
    expect(screen.getByText("SF-424A budget mapping")).toBeInTheDocument();
  });

  it("has accessible caption", () => {
    render(<ComparisonTable />);
    expect(screen.getByText(/Feature comparison/)).toBeInTheDocument();
  });
});

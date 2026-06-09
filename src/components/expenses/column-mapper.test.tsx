import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ColumnMapper } from "./column-mapper";
import type { ColumnMapping } from "@/lib/csv/column-mapper";

const headers = ["Transaction Date", "Payee", "Memo", "Total", "Account Name"];

const baseMapping: ColumnMapping = {
  date: "Transaction Date",
  vendor: "Payee",
  description: "Memo",
  amount: "Total",
};

describe("ColumnMapper", () => {
  it("renders select dropdowns for all required fields", () => {
    render(
      <ColumnMapper
        headers={headers}
        mapping={baseMapping}
        onChange={vi.fn()}
        previewRows={[]}
      />
    );
    expect(screen.getByText("Date")).toBeDefined();
    expect(screen.getByText("Vendor")).toBeDefined();
    expect(screen.getByText("Description")).toBeDefined();
    expect(screen.getByText("Amount")).toBeDefined();
  });

  it("renders optional Account field with None option", () => {
    const { container } = render(
      <ColumnMapper
        headers={headers}
        mapping={baseMapping}
        onChange={vi.fn()}
        previewRows={[]}
      />
    );
    expect(screen.getByText("Account (optional)")).toBeDefined();
    // The Account select should have a "None" option
    const selects = container.querySelectorAll("select");
    const accountSelect = selects[selects.length - 1];
    const noneOption = Array.from(accountSelect.querySelectorAll("option")).find(
      (opt) => opt.textContent === "None"
    );
    expect(noneOption).toBeDefined();
  });

  it("populates options from headers prop", () => {
    const { container } = render(
      <ColumnMapper
        headers={headers}
        mapping={baseMapping}
        onChange={vi.fn()}
        previewRows={[]}
      />
    );
    const firstSelect = container.querySelector("select")!;
    const options = Array.from(firstSelect.querySelectorAll("option")).map(
      (o) => o.textContent
    );
    // Should have placeholder + all headers
    for (const h of headers) {
      expect(options).toContain(h);
    }
  });

  it("calls onChange when a mapping is changed", () => {
    const onChange = vi.fn();
    const { container } = render(
      <ColumnMapper
        headers={headers}
        mapping={baseMapping}
        onChange={onChange}
        previewRows={[]}
      />
    );
    const firstSelect = container.querySelector("select")!;
    fireEvent.change(firstSelect, { target: { value: "Memo" } });
    expect(onChange).toHaveBeenCalledWith({ ...baseMapping, date: "Memo" });
  });

  it("renders preview table when previewRows has data", () => {
    const rows = [
      { "Transaction Date": "2024-01-15", Payee: "Acme Corp", Memo: "Supplies", Total: "250.00", "Account Name": "Grants" },
      { "Transaction Date": "2024-01-16", Payee: "FedEx", Memo: "Shipping", Total: "45.00", "Account Name": "Grants" },
    ];
    render(
      <ColumnMapper
        headers={headers}
        mapping={baseMapping}
        onChange={vi.fn()}
        previewRows={rows}
      />
    );
    // Verify table headers
    const ths = screen.getAllByRole("columnheader");
    expect(ths).toHaveLength(headers.length);
    // Verify table data
    expect(screen.getByText("Acme Corp")).toBeDefined();
    expect(screen.getByText("FedEx")).toBeDefined();
    expect(screen.getByText("250.00")).toBeDefined();
  });

  it("does not render preview table when previewRows is empty", () => {
    const { container } = render(
      <ColumnMapper
        headers={headers}
        mapping={baseMapping}
        onChange={vi.fn()}
        previewRows={[]}
      />
    );
    expect(container.querySelector("table")).toBeNull();
  });
});

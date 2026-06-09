import { describe, it, expect } from "vitest";
import { mapColumns } from "./column-mapper";
import type { ColumnMapping } from "./column-mapper";

describe("mapColumns", () => {
  const mapping: ColumnMapping = {
    date: "Date",
    vendor: "Vendor",
    description: "Description",
    amount: "Amount",
    account: "Account",
  };

  it("maps complete rows to MappedExpense format", () => {
    const rows = [
      { Date: "2024-01-15", Vendor: "Office Depot", Description: "Supplies", Amount: "125.50", Account: "Office" },
      { Date: "2024-02-01", Vendor: "FedEx", Description: "Shipping", Amount: "$450.00", Account: "Logistics" },
    ];

    const result = mapColumns(rows, mapping);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      date: "2024-01-15",
      vendor: "Office Depot",
      description: "Supplies",
      amount: 125.50,
      account: "Office",
      external_id: null,
    });
    expect(result[1]).toEqual({
      date: "2024-02-01",
      vendor: "FedEx",
      description: "Shipping",
      amount: 450.00,
      account: "Logistics",
      external_id: null,
    });
  });

  it("strips $ and commas from amounts", () => {
    const rows = [
      { Date: "2024-01-15", Vendor: "Vendor", Description: "Desc", Amount: "$1,234.56", Account: "" },
    ];

    const result = mapColumns(rows, mapping);
    expect(result[0].amount).toBe(1234.56);
  });

  it("filters out rows with zero or NaN amounts", () => {
    const rows = [
      { Date: "2024-01-15", Vendor: "V1", Description: "D1", Amount: "0", Account: "" },
      { Date: "2024-01-16", Vendor: "V2", Description: "D2", Amount: "abc", Account: "" },
      { Date: "2024-01-17", Vendor: "V3", Description: "D3", Amount: "100", Account: "" },
    ];

    const result = mapColumns(rows, mapping);
    expect(result).toHaveLength(1);
    expect(result[0].vendor).toBe("V3");
  });

  it("filters out rows with empty dates", () => {
    const rows = [
      { Date: "", Vendor: "V1", Description: "D1", Amount: "50", Account: "" },
      { Date: "2024-01-15", Vendor: "V2", Description: "D2", Amount: "75", Account: "" },
    ];

    const result = mapColumns(rows, mapping);
    expect(result).toHaveLength(1);
    expect(result[0].vendor).toBe("V2");
  });

  it("uses absolute value for negative amounts", () => {
    const rows = [
      { Date: "2024-01-15", Vendor: "Refund", Description: "Credit", Amount: "-250.00", Account: "" },
    ];

    const result = mapColumns(rows, mapping);
    expect(result[0].amount).toBe(250.00);
  });

  it("sets account to null when no account mapping provided", () => {
    const noAccountMapping: ColumnMapping = {
      date: "Date",
      vendor: "Vendor",
      description: "Description",
      amount: "Amount",
    };

    const rows = [
      { Date: "2024-01-15", Vendor: "V1", Description: "D1", Amount: "50" },
    ];

    const result = mapColumns(rows, noAccountMapping);
    expect(result[0].account).toBeNull();
  });
});

import { describe, it, expect } from "vitest";
import { parseCSV, getPreviewRows } from "./parser";

describe("parseCSV", () => {
  it("parses valid CSV with headers", () => {
    const csv = `Date,Vendor,Amount,Description
2024-01-15,Office Depot,125.50,Office supplies
2024-01-20,Delta Airlines,450.00,Conference travel`;

    const result = parseCSV(csv);

    expect(result.headers).toEqual(["Date", "Vendor", "Amount", "Description"]);
    expect(result.totalRows).toBe(2);
    expect(result.rows[0]).toEqual({
      Date: "2024-01-15",
      Vendor: "Office Depot",
      Amount: "125.50",
      Description: "Office supplies",
    });
    expect(result.rows[1]).toEqual({
      Date: "2024-01-20",
      Vendor: "Delta Airlines",
      Amount: "450.00",
      Description: "Conference travel",
    });
  });

  it("returns empty result for empty CSV", () => {
    const result = parseCSV("");
    expect(result.headers).toEqual([]);
    expect(result.rows).toEqual([]);
    expect(result.totalRows).toBe(0);
  });

  it("trims header whitespace", () => {
    const csv = `  Date , Vendor , Amount
2024-01-15,Staples,50.00`;

    const result = parseCSV(csv);
    expect(result.headers).toEqual(["Date", "Vendor", "Amount"]);
  });

  it("skips empty lines", () => {
    const csv = `Date,Vendor,Amount
2024-01-15,Staples,50.00

2024-01-20,FedEx,25.00

`;

    const result = parseCSV(csv);
    expect(result.totalRows).toBe(2);
  });
});

describe("getPreviewRows", () => {
  it("returns first N rows", () => {
    const csv = `Date,Amount
2024-01-01,10
2024-01-02,20
2024-01-03,30
2024-01-04,40
2024-01-05,50
2024-01-06,60`;

    const parsed = parseCSV(csv);
    const preview = getPreviewRows(parsed, 3);
    expect(preview).toHaveLength(3);
    expect(preview[0].Date).toBe("2024-01-01");
    expect(preview[2].Date).toBe("2024-01-03");
  });

  it("defaults to 5 rows when count not provided", () => {
    const rows = Array.from({ length: 10 }, (_, i) => `2024-01-${String(i + 1).padStart(2, "0")},${(i + 1) * 10}`);
    const csv = `Date,Amount\n${rows.join("\n")}`;

    const parsed = parseCSV(csv);
    const preview = getPreviewRows(parsed);
    expect(preview).toHaveLength(5);
    expect(preview[0].Date).toBe("2024-01-01");
    expect(preview[4].Date).toBe("2024-01-05");
  });
});

describe("parseCSV edge cases", () => {
  it("quoted fields with commas parsed correctly", () => {
    const csv = `Name,Amount,Description
"Smith, John",100,"Office supplies, pens"`;

    const result = parseCSV(csv);
    expect(result.totalRows).toBe(1);
    expect(result.rows[0].Name).toBe("Smith, John");
    expect(result.rows[0].Description).toBe("Office supplies, pens");
  });

  it("headers-only CSV returns empty rows array", () => {
    const csv = "Date,Vendor,Amount\n";
    const result = parseCSV(csv);
    expect(result.headers).toEqual(["Date", "Vendor", "Amount"]);
    expect(result.rows).toEqual([]);
    expect(result.totalRows).toBe(0);
  });

  it("single-column CSV parsed correctly", () => {
    const csv = `Amount
100
200
300`;

    const result = parseCSV(csv);
    expect(result.headers).toEqual(["Amount"]);
    expect(result.totalRows).toBe(3);
    expect(result.rows[0].Amount).toBe("100");
    expect(result.rows[2].Amount).toBe("300");
  });
});

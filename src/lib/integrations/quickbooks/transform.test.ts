import { describe, it, expect } from "vitest";
import { transformQBOExpenses } from "./transform";

describe("transformQBOExpenses", () => {
  it("transforms a purchase with multiple line items", () => {
    const purchases = [
      {
        Id: "123",
        TxnDate: "2024-03-15",
        TotalAmt: 350,
        EntityRef: { name: "Office Depot", value: "1" },
        DocNumber: "INV-001",
        Line: [
          {
            Amount: 200,
            Description: "Printer paper",
            AccountBasedExpenseLineDetail: { AccountRef: { name: "Supplies", value: "10" } },
          },
          {
            Amount: 150,
            Description: "Toner cartridge",
            AccountBasedExpenseLineDetail: { AccountRef: { name: "Supplies", value: "10" } },
          },
        ],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      date: "2024-03-15",
      vendor: "Office Depot",
      description: "Printer paper",
      amount: 200,
      account: "Supplies",
      external_id: "qbo_123_line_0",
    });
    expect(result[1]).toEqual({
      date: "2024-03-15",
      vendor: "Office Depot",
      description: "Toner cartridge",
      amount: 150,
      account: "Supplies",
      external_id: "qbo_123_line_1",
    });
  });

  it("falls back to purchase-level data when no line items", () => {
    const purchases = [
      {
        Id: "456",
        TxnDate: "2024-03-20",
        TotalAmt: 500,
        EntityRef: { name: "FedEx", value: "2" },
        PrivateNote: "Overnight shipping",
        AccountRef: { name: "Shipping", value: "20" },
        Line: [],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      date: "2024-03-20",
      vendor: "FedEx",
      description: "Overnight shipping",
      amount: 500,
      account: "Shipping",
      external_id: "qbo_456",
    });
  });

  it("handles refunds (negative line amounts)", () => {
    const purchases = [
      {
        Id: "789",
        TxnDate: "2024-04-01",
        TotalAmt: -100,
        EntityRef: { name: "Amazon", value: "3" },
        Line: [
          {
            Amount: -100,
            Description: "Returned supplies",
            AccountBasedExpenseLineDetail: { AccountRef: { name: "Supplies" } },
          },
        ],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(-100);
    expect(result[0].description).toBe("Returned supplies");
  });

  it("skips lines with zero amount", () => {
    const purchases = [
      {
        Id: "111",
        TxnDate: "2024-05-01",
        TotalAmt: 100,
        EntityRef: { name: "Vendor" },
        Line: [
          { Amount: 0, Description: "Subtotal line" },
          { Amount: 100, Description: "Actual expense" },
        ],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Actual expense");
  });

  it("handles purchase with no EntityRef (unknown vendor)", () => {
    const purchases = [
      {
        Id: "222",
        TxnDate: "2024-05-15",
        TotalAmt: 75,
        Line: [],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(1);
    expect(result[0].vendor).toBe("Unknown Vendor");
  });

  it("returns empty array for empty input", () => {
    expect(transformQBOExpenses([])).toEqual([]);
  });

  it("missing TxnDate defaults to today's date", () => {
    const purchases = [
      {
        Id: "333",
        TotalAmt: 100,
        EntityRef: { name: "Vendor" },
        Line: [{ Amount: 100, Description: "Item" }],
      },
    ];

    const result = transformQBOExpenses(purchases);
    const today = new Date().toISOString().split("T")[0];

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(today);
  });

  it("missing purchaseId results in null external_id", () => {
    const purchases = [
      {
        TxnDate: "2024-07-01",
        TotalAmt: 200,
        EntityRef: { name: "Vendor" },
        Line: [{ Amount: 200, Description: "Service" }],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(1);
    expect(result[0].external_id).toBeNull();
  });

  it("negative amount (credit/refund) preserved correctly in line items", () => {
    const purchases = [
      {
        Id: "444",
        TxnDate: "2024-07-15",
        TotalAmt: -250,
        EntityRef: { name: "Supplier" },
        Line: [
          { Amount: -250, Description: "Credit memo" },
        ],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(-250);
  });

  it("very large amounts ($10M+) handled without overflow", () => {
    const purchases = [
      {
        Id: "555",
        TxnDate: "2024-08-01",
        TotalAmt: 15000000,
        EntityRef: { name: "Construction Co" },
        Line: [{ Amount: 15000000, Description: "Building renovation" }],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(15000000);
  });

  it("multiple purchases with same vendor have unique external_ids", () => {
    const purchases = [
      {
        Id: "666",
        TxnDate: "2024-09-01",
        TotalAmt: 100,
        EntityRef: { name: "Office Depot" },
        Line: [{ Amount: 100, Description: "Paper" }],
      },
      {
        Id: "667",
        TxnDate: "2024-09-02",
        TotalAmt: 200,
        EntityRef: { name: "Office Depot" },
        Line: [{ Amount: 200, Description: "Toner" }],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(2);
    expect(result[0].external_id).toBe("qbo_666_line_0");
    expect(result[1].external_id).toBe("qbo_667_line_0");
    expect(result[0].external_id).not.toBe(result[1].external_id);
  });

  it("purchase with mixed line types (account + no-account) maps all lines", () => {
    const purchases = [
      {
        Id: "777",
        TxnDate: "2024-10-01",
        TotalAmt: 500,
        EntityRef: { name: "Amazon" },
        Line: [
          {
            Amount: 300,
            Description: "Laptop stand",
            AccountBasedExpenseLineDetail: { AccountRef: { name: "Equipment", value: "30" } },
          },
          {
            Amount: 200,
            Description: "USB cables",
            // No AccountBasedExpenseLineDetail
          },
        ],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(2);
    expect(result[0].account).toBe("Equipment");
    expect(result[1].account).toBeNull();
  });

  it("floating-point precision: $0.01 amount preserved", () => {
    const purchases = [
      {
        Id: "888",
        TxnDate: "2024-11-01",
        TotalAmt: 0.01,
        EntityRef: { name: "Vendor" },
        Line: [{ Amount: 0.01, Description: "Rounding adjustment" }],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(0.01);
  });

  it("empty Description falls back to PrivateNote", () => {
    const purchases = [
      {
        Id: "999",
        TxnDate: "2024-11-15",
        TotalAmt: 50,
        EntityRef: { name: "Vendor" },
        PrivateNote: "Note text",
        Line: [{ Amount: 50, Description: "" }],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(1);
    expect(result[0].description).toBe("Note text");
  });

  it("multiple lines produce sequential _line_N external IDs", () => {
    const purchases = [
      {
        Id: "100",
        TxnDate: "2024-12-01",
        TotalAmt: 300,
        EntityRef: { name: "Vendor" },
        Line: [
          { Amount: 100, Description: "Line A" },
          { Amount: 100, Description: "Line B" },
          { Amount: 100, Description: "Line C" },
        ],
      },
    ];

    const result = transformQBOExpenses(purchases);

    expect(result).toHaveLength(3);
    expect(result[0].external_id).toBe("qbo_100_line_0");
    expect(result[1].external_id).toBe("qbo_100_line_1");
    expect(result[2].external_id).toBe("qbo_100_line_2");
  });
});

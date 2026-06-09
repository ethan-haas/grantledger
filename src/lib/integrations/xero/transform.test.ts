import { describe, it, expect, vi } from "vitest";
import { transformXeroExpenses } from "./transform";

// Mock the logger to prevent import issues in test environment
vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

describe("transformXeroExpenses", () => {
  it("transforms transaction with multiple line items", () => {
    const transactions = [
      {
        BankTransactionID: "tx-001",
        Date: "2024-03-15",
        Total: 350,
        Contact: { Name: "Office Depot", ContactID: "c1" },
        LineItems: [
          { Description: "Paper", LineAmount: 200, AccountCode: "400" },
          { Description: "Pens", LineAmount: 150, AccountCode: "400" },
        ],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      date: "2024-03-15",
      vendor: "Office Depot",
      description: "Paper",
      amount: 200,
      account: "400",
      external_id: "xero_tx-001_line_0",
    });
    expect(result[1]).toEqual({
      date: "2024-03-15",
      vendor: "Office Depot",
      description: "Pens",
      amount: 150,
      account: "400",
      external_id: "xero_tx-001_line_1",
    });
  });

  it("falls back to transaction-level data when no line items", () => {
    const transactions = [
      {
        BankTransactionID: "tx-002",
        Date: "2024-04-01",
        Total: 500,
        Contact: { Name: "FedEx" },
        Reference: "Shipping charges",
        LineItems: [],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(500);
    expect(result[0].description).toBe("Shipping charges");
    expect(result[0].external_id).toBe("xero_tx-002");
  });

  it("parses .NET JSON date format", () => {
    // 1710460800000 = 2024-03-15T00:00:00.000Z
    const transactions = [
      {
        BankTransactionID: "tx-003",
        Date: "/Date(1710460800000+0000)/",
        Total: 100,
        Contact: { Name: "Vendor" },
        LineItems: [],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe("2024-03-15");
  });

  it("skips voided transactions", () => {
    const transactions = [
      {
        BankTransactionID: "tx-004",
        Date: "2024-03-15",
        Total: 100,
        Status: "VOIDED",
        Contact: { Name: "Vendor" },
        LineItems: [],
      },
      {
        BankTransactionID: "tx-005",
        Date: "2024-03-15",
        Total: 200,
        Status: "AUTHORISED",
        Contact: { Name: "Vendor" },
        LineItems: [],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].external_id).toBe("xero_tx-005");
  });

  it("skips deleted transactions", () => {
    const transactions = [
      {
        BankTransactionID: "tx-006",
        Date: "2024-03-15",
        Total: 100,
        Status: "DELETED",
        Contact: { Name: "Vendor" },
        LineItems: [],
      },
    ];

    const result = transformXeroExpenses(transactions);
    expect(result).toHaveLength(0);
  });

  it("handles refunds (negative amounts) with abs value", () => {
    const transactions = [
      {
        BankTransactionID: "tx-007",
        Date: "2024-04-01",
        Total: -150,
        Contact: { Name: "Amazon" },
        LineItems: [
          { Description: "Refund", LineAmount: -150, AccountCode: "400" },
        ],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(150);
  });

  it("calculates line amount from UnitAmount * Quantity when LineAmount missing", () => {
    const transactions = [
      {
        BankTransactionID: "tx-008",
        Date: "2024-05-01",
        Total: 300,
        Contact: { Name: "Vendor" },
        LineItems: [
          { Description: "Item", UnitAmount: 100, Quantity: 3 },
        ],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(300);
  });

  it("returns empty array for empty input", () => {
    expect(transformXeroExpenses([])).toEqual([]);
  });

  it("defaults to today's date when Date is undefined", () => {
    const transactions = [
      {
        BankTransactionID: "tx-009",
        Date: undefined,
        Total: 100,
        Contact: { Name: "Vendor" },
        LineItems: [],
      },
    ];

    const result = transformXeroExpenses(transactions);
    const today = new Date().toISOString().split("T")[0];

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(today);
  });

  it("defaults vendor to 'Unknown Vendor' when Contact is missing", () => {
    const transactions = [
      {
        BankTransactionID: "tx-010",
        Date: "2024-06-01",
        Total: 250,
        LineItems: [],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].vendor).toBe("Unknown Vendor");
  });

  it("unparseable date string defaults to today (documents behavior)", () => {
    const transactions = [
      {
        BankTransactionID: "tx-011",
        Date: "not-a-date-at-all",
        Total: 100,
        Contact: { Name: "Vendor" },
        LineItems: [],
      },
    ];

    const result = transformXeroExpenses(transactions);
    const today = new Date().toISOString().split("T")[0];

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(today);
  });

  it(".NET date with timezone offset parsed correctly", () => {
    // 1710460800000 = 2024-03-15T00:00:00.000Z, +0530 timezone offset
    const transactions = [
      {
        BankTransactionID: "tx-012",
        Date: "/Date(1710460800000+0530)/",
        Total: 100,
        Contact: { Name: "Vendor" },
        LineItems: [],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    // The timezone offset is ignored in the regex — only ms epoch is used
    expect(result[0].date).toBe("2024-03-15");
  });

  it("DRAFT status transactions are still imported (documents behavior)", () => {
    const transactions = [
      {
        BankTransactionID: "tx-013",
        Date: "2024-05-01",
        Total: 300,
        Status: "DRAFT",
        Contact: { Name: "Draft Vendor" },
        LineItems: [],
      },
    ];

    const result = transformXeroExpenses(transactions);

    // DRAFT is not VOIDED or DELETED, so it should be imported
    expect(result).toHaveLength(1);
    expect(result[0].vendor).toBe("Draft Vendor");
  });

  it("negative LineAmount becomes positive via Math.abs (documents refund behavior)", () => {
    const transactions = [
      {
        BankTransactionID: "tx-014",
        Date: "2024-06-15",
        Total: -75,
        Contact: { Name: "Refund Corp" },
        LineItems: [
          { Description: "Refund for damaged goods", LineAmount: -75 },
        ],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    // Math.abs converts -75 to 75
    expect(result[0].amount).toBe(75);
  });

  it("missing LineItems but valid Total creates single expense", () => {
    const transactions = [
      {
        BankTransactionID: "tx-015",
        Date: "2024-07-01",
        Total: 500,
        Contact: { Name: "Service Co" },
        Reference: "Monthly service fee",
        // No LineItems field at all
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(500);
    expect(result[0].description).toBe("Monthly service fee");
    expect(result[0].external_id).toBe("xero_tx-015");
  });

  it("transaction with AccountCode maps to account field", () => {
    const transactions = [
      {
        BankTransactionID: "tx-016",
        Date: "2024-08-01",
        Total: 150,
        Contact: { Name: "Vendor" },
        LineItems: [
          { Description: "Office supplies", LineAmount: 150, AccountCode: "6100" },
        ],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].account).toBe("6100");
  });

  it("undefined LineItems falls back to empty array", () => {
    const transactions = [
      {
        BankTransactionID: "tx-017",
        Date: "2024-09-01",
        Total: 300,
        Contact: { Name: "Vendor" },
        LineItems: undefined,
      },
    ];

    const result = transformXeroExpenses(transactions);

    // Falls back to purchase-level since (undefined || []) is [], length 0 → Total fallback
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(300);
  });

  it("UnitAmount without Quantity defaults Quantity to 1", () => {
    const transactions = [
      {
        BankTransactionID: "tx-018",
        Date: "2024-09-15",
        Total: 250,
        Contact: { Name: "Vendor" },
        LineItems: [
          { Description: "Service", UnitAmount: 250 },
        ],
      },
    ];

    const result = transformXeroExpenses(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(250);
  });

  it('invalid .NET date "/Date(abc)/" defaults to today', () => {
    const transactions = [
      {
        BankTransactionID: "tx-019",
        Date: "/Date(abc)/",
        Total: 100,
        Contact: { Name: "Vendor" },
        LineItems: [],
      },
    ];

    const result = transformXeroExpenses(transactions);
    const today = new Date().toISOString().split("T")[0];

    expect(result).toHaveLength(1);
    expect(result[0].date).toBe(today);
  });
});

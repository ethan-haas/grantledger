import { logger } from "@/lib/logger";
import type { MappedExpense } from "@/lib/types/mapped-expense";
export type { MappedExpense };

interface XeroLineItem {
  Description?: string;
  UnitAmount?: number;
  Quantity?: number;
  LineAmount?: number;
  AccountCode?: string;
}

interface XeroContact {
  Name?: string;
  ContactID?: string;
}

interface XeroTransaction {
  // Common fields across BankTransactions and Invoices
  BankTransactionID?: string;
  InvoiceID?: string;
  Type?: string;
  Date?: string;
  DateString?: string;
  Total?: number;
  Contact?: XeroContact;
  Reference?: string;
  LineItems?: XeroLineItem[];
  Status?: string;
}

/**
 * Transforms Xero BankTransactions and Invoices into the MappedExpense format.
 *
 * If a transaction has multiple line items, each line becomes a separate
 * MappedExpense for per-line categorization. Voided transactions are skipped.
 */
export function transformXeroExpenses(
  transactions: XeroTransaction[]
): MappedExpense[] {
  const expenses: MappedExpense[] = [];

  for (const txn of transactions) {
    // Skip voided/deleted transactions
    if (txn.Status === "VOIDED" || txn.Status === "DELETED") {
      continue;
    }

    const vendorName = txn.Contact?.Name || "Unknown Vendor";
    const externalId = txn.BankTransactionID || txn.InvoiceID || null;

    // Parse the date — Xero uses "/Date(...)/" format or ISO strings
    const txnDate = parseXeroDate(txn.Date || txn.DateString);

    // Include negative amounts (refunds/credit memos)
    const lineItems = (txn.LineItems || []).filter(
      (line) => {
        const amount = line.LineAmount ?? (line.UnitAmount || 0) * (line.Quantity || 1);
        return amount !== 0;
      }
    );

    if (lineItems.length > 0) {
      for (let i = 0; i < lineItems.length; i++) {
        const line = lineItems[i];
        const lineAmount =
          line.LineAmount ?? (line.UnitAmount || 0) * (line.Quantity || 1);

        expenses.push({
          date: txnDate,
          vendor: vendorName,
          description:
            line.Description || txn.Reference || `Transaction ${externalId || ""}`.trim(),
          amount: Math.abs(lineAmount),
          account: line.AccountCode || null,
          external_id: externalId
            ? `xero_${externalId}_line_${i}`
            : null,
        });
      }
    } else if (txn.Total != null && txn.Total !== 0) {
      // Fallback: no line items with detail, use transaction-level data
      expenses.push({
        date: txnDate,
        vendor: vendorName,
        description:
          txn.Reference || `Transaction ${externalId || ""}`.trim(),
        amount: Math.abs(txn.Total),
        account: null,
        external_id: externalId ? `xero_${externalId}` : null,
      });
    }
  }

  return expenses;
}

/**
 * Parses Xero date formats into YYYY-MM-DD string.
 * Xero API returns dates as "/Date(1234567890000+0000)/" or ISO strings.
 */
function parseXeroDate(dateValue: string | undefined): string {
  if (!dateValue) {
    logger.warn("Xero transaction missing date, defaulting to today");
    return new Date().toISOString().split("T")[0];
  }

  // Handle Xero's .NET JSON date format: /Date(1234567890000+0000)/
  const msMatch = dateValue.match(/\/Date\((\d+)([+-]\d{4})?\)\//);
  if (msMatch) {
    const ms = parseInt(msMatch[1], 10);
    return new Date(ms).toISOString().split("T")[0];
  }

  // Handle ISO date strings
  const parsed = new Date(dateValue);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  logger.warn("Xero transaction date unparseable, defaulting to today", { dateValue });
  return new Date().toISOString().split("T")[0];
}

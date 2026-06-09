import type { MappedExpense } from "@/lib/types/mapped-expense";
export type { MappedExpense };

interface QBOLine {
  Amount?: number;
  Description?: string;
  AccountBasedExpenseLineDetail?: {
    AccountRef?: { name?: string; value?: string };
  };
}

interface QBOPurchase {
  Id?: string;
  TxnDate?: string;
  TotalAmt?: number;
  EntityRef?: { name?: string; value?: string };
  DocNumber?: string;
  PrivateNote?: string;
  Line?: QBOLine[];
  AccountRef?: { name?: string; value?: string };
  MetaData?: { LastUpdatedTime?: string };
}

/**
 * Transforms QuickBooks Online Purchase objects into the MappedExpense format.
 *
 * If a Purchase has multiple line items, each line becomes a separate MappedExpense
 * to allow per-line categorization. If lines lack detail, a single expense is
 * created from the purchase header.
 */
export function transformQBOExpenses(purchases: QBOPurchase[]): MappedExpense[] {
  const expenses: MappedExpense[] = [];

  for (const purchase of purchases) {
    const vendorName =
      purchase.EntityRef?.name || "Unknown Vendor";
    const txnDate = purchase.TxnDate || new Date().toISOString().split("T")[0];
    const purchaseId = purchase.Id || null;

    // Filter to actual expense lines (exclude subtotal/total lines with null amounts)
    // Include negative amounts (refunds/credit memos)
    const expenseLines = (purchase.Line || []).filter(
      (line) => line.Amount != null && line.Amount !== 0
    );

    if (expenseLines.length > 0) {
      for (let i = 0; i < expenseLines.length; i++) {
        const line = expenseLines[i];
        const accountName =
          line.AccountBasedExpenseLineDetail?.AccountRef?.name || null;

        expenses.push({
          date: txnDate,
          vendor: vendorName,
          description:
            line.Description ||
            purchase.PrivateNote ||
            `Purchase ${purchase.DocNumber || ""}`.trim(),
          amount: line.Amount!,
          account: accountName,
          external_id: purchaseId
            ? `qbo_${purchaseId}_line_${i}`
            : null,
        });
      }
    } else if (purchase.TotalAmt != null && purchase.TotalAmt !== 0) {
      // Fallback: no line items with detail, use purchase-level data
      expenses.push({
        date: txnDate,
        vendor: vendorName,
        description:
          purchase.PrivateNote ||
          `Purchase ${purchase.DocNumber || ""}`.trim(),
        amount: purchase.TotalAmt,
        account: purchase.AccountRef?.name || null,
        external_id: purchaseId ? `qbo_${purchaseId}` : null,
      });
    }
  }

  return expenses;
}

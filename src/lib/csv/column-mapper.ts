import type { MappedExpense } from "@/lib/types/mapped-expense";
export type { MappedExpense };

export interface ColumnMapping {
  date: string;
  vendor: string;
  description: string;
  amount: string;
  account?: string;
}

export function mapColumns(
  rows: Record<string, string>[],
  mapping: ColumnMapping
): MappedExpense[] {
  return rows
    .map((row) => {
      const rawAmount = row[mapping.amount]?.replace(/[$,]/g, "").trim();
      const amount = parseFloat(rawAmount);

      if (isNaN(amount) || amount === 0) return null;

      return {
        date: row[mapping.date]?.trim() || "",
        vendor: row[mapping.vendor]?.trim() || "Unknown",
        description: row[mapping.description]?.trim() || "",
        amount: Math.abs(amount),
        account: mapping.account ? row[mapping.account]?.trim() || null : null,
        external_id: null as string | null,
      };
    })
    .filter((e): e is MappedExpense => e !== null && e.date !== "");
}

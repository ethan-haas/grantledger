export interface MappedExpense {
  date: string;
  vendor: string;
  description: string;
  amount: number;
  account: string | null;
  external_id: string | null;
}

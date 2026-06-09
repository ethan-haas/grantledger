import { categorizeExpense, type CategorizationResult } from "./categorize";

interface ExpenseInput {
  id: string;
  vendor: string;
  description: string;
  amount: number;
  account?: string | null;
}

interface BatchResult {
  id: string;
  result: CategorizationResult;
}

export async function batchCategorize(
  systemPrompt: string,
  expenses: ExpenseInput[],
  concurrency = 5,
  onProgress?: (completed: number, total: number) => void
): Promise<BatchResult[]> {
  const results: BatchResult[] = [];
  let completed = 0;

  // Process in batches of `concurrency`
  for (let i = 0; i < expenses.length; i += concurrency) {
    const batch = expenses.slice(i, i + concurrency);

    const batchResults = await Promise.all(
      batch.map(async (expense) => {
        const result = await categorizeExpense(systemPrompt, expense);
        completed++;
        onProgress?.(completed, expenses.length);
        return { id: expense.id, result };
      })
    );

    results.push(...batchResults);
  }

  return results;
}

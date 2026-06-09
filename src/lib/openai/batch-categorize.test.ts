import { describe, it, expect, vi } from "vitest";
import { batchCategorize } from "./batch-categorize";

vi.mock("./categorize", () => ({
  categorizeExpense: vi.fn(),
}));

import { categorizeExpense } from "./categorize";
const mockCategorize = vi.mocked(categorizeExpense);

function makeExpense(id: string) {
  return { id, vendor: "Vendor", description: "Desc", amount: 100 };
}

describe("batchCategorize", () => {
  it("calls categorizeExpense for each expense and returns all results", async () => {
    mockCategorize.mockResolvedValue({
      category: "supplies",
      confidence: "high",
      cfr_citation: "§200.453",
    });

    const expenses = Array.from({ length: 7 }, (_, i) => makeExpense(`id-${i}`));
    const results = await batchCategorize("system prompt", expenses, 3);

    expect(mockCategorize).toHaveBeenCalledTimes(7);
    expect(results).toHaveLength(7);
    expect(results.map((r) => r.id)).toEqual(expenses.map((e) => e.id));
  });

  it("propagates errors from categorizeExpense", async () => {
    let callCount = 0;
    mockCategorize.mockImplementation(async () => {
      callCount++;
      if (callCount === 3) throw new Error("OpenAI timeout");
      return { category: "other", confidence: "low", cfr_citation: "§200.420" };
    });

    const expenses = Array.from({ length: 5 }, (_, i) => makeExpense(`id-${i}`));
    await expect(batchCategorize("system prompt", expenses, 3)).rejects.toThrow("OpenAI timeout");
  });

  it("returns empty array for empty input without calling OpenAI", async () => {
    mockCategorize.mockClear();

    const results = await batchCategorize("system prompt", []);

    expect(results).toEqual([]);
    expect(mockCategorize).not.toHaveBeenCalled();
  });

  it("calls onProgress with correct completed count", async () => {
    mockCategorize.mockResolvedValue({
      category: "travel",
      confidence: "medium",
      cfr_citation: "§200.474",
    });

    const onProgress = vi.fn();
    const expenses = [makeExpense("a"), makeExpense("b"), makeExpense("c")];
    await batchCategorize("system prompt", expenses, 2, onProgress);

    // 3 expenses → onProgress called 3 times with (1,3), (2,3), (3,3)
    expect(onProgress).toHaveBeenCalledTimes(3);
    expect(onProgress).toHaveBeenCalledWith(expect.any(Number), 3);
  });

  it("processes a single expense correctly", async () => {
    mockCategorize.mockResolvedValue({
      category: "equipment",
      confidence: "high",
      cfr_citation: "§200.439",
    });

    const results = await batchCategorize("system prompt", [makeExpense("solo")], 5);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("solo");
    expect(results[0].result.category).toBe("equipment");
  });

  it("maintains input order in results", async () => {
    let callIndex = 0;
    const categories = ["personnel", "travel", "supplies", "equipment"];
    mockCategorize.mockImplementation(async () => {
      const cat = categories[callIndex++];
      return { category: cat, confidence: "high", cfr_citation: "§200.420" };
    });

    const expenses = Array.from({ length: 4 }, (_, i) => makeExpense(`id-${i}`));
    const results = await batchCategorize("system prompt", expenses, 2);

    expect(results.map((r) => r.id)).toEqual(["id-0", "id-1", "id-2", "id-3"]);
    expect(results.map((r) => r.result.category)).toEqual(categories);
  });

  it("concurrency=1 processes sequentially and returns all results", async () => {
    const callOrder: string[] = [];
    mockCategorize.mockImplementation(async (_prompt: string, expense: { vendor: string; description: string; amount: number; id?: string }) => {
      callOrder.push(expense.id ?? "");
      return { category: "other", confidence: "low", cfr_citation: "§200.420" };
    });

    const expenses = [makeExpense("a"), makeExpense("b"), makeExpense("c")];
    const results = await batchCategorize("prompt", expenses, 1);

    expect(results).toHaveLength(3);
    // With concurrency=1, each batch is 1 expense, processed in order
    expect(callOrder).toEqual(["a", "b", "c"]);
  });

  it("concurrency > expenses count still works (no empty batches)", async () => {
    mockCategorize.mockClear();
    mockCategorize.mockResolvedValue({
      category: "supplies",
      confidence: "high",
      cfr_citation: "§200.453",
    });

    const expenses = [makeExpense("only-one"), makeExpense("only-two")];
    // concurrency=10 but only 2 expenses
    const results = await batchCategorize("prompt", expenses, 10);

    expect(results).toHaveLength(2);
    expect(mockCategorize).toHaveBeenCalledTimes(2);
  });

  it("uneven batch (7 expenses, concurrency=3) returns all 7 results", async () => {
    mockCategorize.mockClear();
    mockCategorize.mockResolvedValue({
      category: "travel",
      confidence: "medium",
      cfr_citation: "§200.474",
    });

    const expenses = Array.from({ length: 7 }, (_, i) => makeExpense(`id-${i}`));
    const results = await batchCategorize("prompt", expenses, 3);

    // 7 expenses in batches of 3: [3, 3, 1]
    expect(results).toHaveLength(7);
    expect(mockCategorize).toHaveBeenCalledTimes(7);
    expect(results.map((r) => r.id)).toEqual(
      Array.from({ length: 7 }, (_, i) => `id-${i}`)
    );
  });

  it("onProgress not provided does not crash", async () => {
    mockCategorize.mockResolvedValue({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });

    const expenses = [makeExpense("a"), makeExpense("b")];
    // No onProgress callback
    const results = await batchCategorize("prompt", expenses, 2);

    expect(results).toHaveLength(2);
  });

  it("50 expenses all return results in correct order", async () => {
    mockCategorize.mockImplementation(async (_prompt: string, expense: { vendor: string; description: string; amount: number; id?: string }) => {
      return { category: "supplies", confidence: "high", cfr_citation: expense.id ?? "" };
    });

    const expenses = Array.from({ length: 50 }, (_, i) => makeExpense(`id-${i}`));
    const results = await batchCategorize("prompt", expenses, 5);

    expect(results).toHaveLength(50);
    // Verify order is maintained
    for (let i = 0; i < 50; i++) {
      expect(results[i].id).toBe(`id-${i}`);
    }
  });

  it("passes systemPrompt as first arg to categorizeExpense", async () => {
    mockCategorize.mockClear();
    mockCategorize.mockResolvedValue({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });

    await batchCategorize("my-custom-prompt", [makeExpense("a")], 1);

    expect(mockCategorize.mock.calls[0][0]).toBe("my-custom-prompt");
  });

  it("onProgress throwing propagates the error", async () => {
    mockCategorize.mockResolvedValue({
      category: "other",
      confidence: "low",
      cfr_citation: "§200.420",
    });

    const onProgress = vi.fn().mockImplementation(() => {
      throw new Error("Progress handler crashed");
    });

    await expect(
      batchCategorize("prompt", [makeExpense("a")], 1, onProgress)
    ).rejects.toThrow("Progress handler crashed");
  });

  it("expense account field passed through to categorizeExpense", async () => {
    mockCategorize.mockClear();
    mockCategorize.mockResolvedValue({
      category: "supplies",
      confidence: "high",
      cfr_citation: "§200.453",
    });

    const expense = { id: "e1", vendor: "Vendor", description: "Desc", amount: 100, account: "4100" };
    await batchCategorize("prompt", [expense], 1);

    const passedExpense = mockCategorize.mock.calls[0][1] as { account?: string | null };
    expect(passedExpense.account).toBe("4100");
  });
});

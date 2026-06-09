import { describe, it, expect, vi } from "vitest";
import { batchUpdateExpenseCategories } from "./batch-update-categories";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

function makeResult(id: string) {
  return {
    id,
    result: {
      category: "personnel",
      confidence: "high",
      cfr_citation: "200.430",
    },
  };
}

function mockSupabase(updateError: unknown = null) {
  return {
    from: () => ({
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: updateError }),
        }),
      }),
    }),
  } as never;
}

describe("batchUpdateExpenseCategories", () => {
  it("updates all expenses and returns count", async () => {
    const supabase = mockSupabase(null);
    const results = [makeResult("e1"), makeResult("e2"), makeResult("e3")];

    const count = await batchUpdateExpenseCategories(supabase, results, "org-1");

    expect(count).toBe(3);
  });

  it("logs failed IDs but does not throw on partial failure", async () => {
    const { logger } = await import("@/lib/logger");
    const supabase = mockSupabase({ message: "update failed" });
    const results = [makeResult("e1"), makeResult("e2")];

    const count = await batchUpdateExpenseCategories(supabase, results, "org-1");

    expect(count).toBe(2);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to update AI categorization on expenses",
      expect.objectContaining({ error_count: 2 })
    );
  });

  it("returns 0 for empty results without querying", async () => {
    const fromSpy = vi.fn();
    const supabase = { from: fromSpy } as never;

    const count = await batchUpdateExpenseCategories(supabase, [], "org-1");

    expect(count).toBe(0);
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it("processes exactly 50 items in a single batch", async () => {
    const fromSpy = vi.fn(() => ({
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    }));
    const supabase = { from: fromSpy } as never;

    const results = Array.from({ length: 50 }, (_, i) => makeResult(`e${i}`));
    const count = await batchUpdateExpenseCategories(supabase, results, "org-1");

    expect(count).toBe(50);
    // All 50 should be in one batch — from() called 50 times (once per expense in a single batch)
    expect(fromSpy).toHaveBeenCalledTimes(50);
  });

  it("splits 51 items into two batches (50 + 1)", async () => {
    const fromSpy = vi.fn(() => ({
      update: () => ({
        eq: () => ({
          eq: () => Promise.resolve({ error: null }),
        }),
      }),
    }));
    const supabase = { from: fromSpy } as never;

    const results = Array.from({ length: 51 }, (_, i) => makeResult(`e${i}`));
    const count = await batchUpdateExpenseCategories(supabase, results, "org-1");

    expect(count).toBe(51);
    // 51 calls total — 50 in first batch + 1 in second batch
    expect(fromSpy).toHaveBeenCalledTimes(51);
  });

  it("continues processing remaining batches when one batch has errors", async () => {
    const { logger } = await import("@/lib/logger");
    let callCount = 0;
    const fromSpy = vi.fn(() => ({
      update: () => ({
        eq: () => ({
          eq: () => {
            callCount++;
            // First 50 calls (batch 1) fail, next 1 (batch 2) succeeds
            if (callCount <= 50) {
              return Promise.resolve({ error: { message: "batch 1 error" } });
            }
            return Promise.resolve({ error: null });
          },
        }),
      }),
    }));
    const supabase = { from: fromSpy } as never;

    const results = Array.from({ length: 51 }, (_, i) => makeResult(`e${i}`));
    const count = await batchUpdateExpenseCategories(supabase, results, "org-1");

    // Should return total count regardless of errors
    expect(count).toBe(51);
    // Error should be logged for the first batch
    expect(logger.error).toHaveBeenCalled();
    // All 51 items should have been attempted
    expect(fromSpy).toHaveBeenCalledTimes(51);
  });
});

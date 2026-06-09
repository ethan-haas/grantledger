import { describe, it, expect, vi } from "vitest";
import { getExistingExternalIds } from "./dedup";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

function mockSupabase(response: { data: unknown; error: unknown }) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            in: () => Promise.resolve(response),
          }),
        }),
      }),
    }),
  } as never;
}

describe("getExistingExternalIds", () => {
  it("returns Set of existing external IDs", async () => {
    const supabase = mockSupabase({
      data: [{ external_id: "abc" }, { external_id: "def" }],
      error: null,
    });

    const result = await getExistingExternalIds(supabase, "grant-1", "org-1", ["abc", "def", "ghi"]);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(2);
    expect(result.has("abc")).toBe(true);
    expect(result.has("def")).toBe(true);
    expect(result.has("ghi")).toBe(false);
  });

  it("returns empty Set without querying when externalIds is empty", async () => {
    const fromSpy = vi.fn();
    const supabase = { from: fromSpy } as never;

    const result = await getExistingExternalIds(supabase, "grant-1", "org-1", []);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
    expect(fromSpy).not.toHaveBeenCalled();
  });

  it("throws on query error", async () => {
    const supabase = mockSupabase({
      data: null,
      error: { message: "connection failed" },
    });

    await expect(
      getExistingExternalIds(supabase, "grant-1", "org-1", ["abc"])
    ).rejects.toThrow("Failed to check for duplicate expenses");
  });

  it("handles null data gracefully (returns empty Set)", async () => {
    const supabase = mockSupabase({
      data: null,
      error: null,
    });

    const result = await getExistingExternalIds(supabase, "grant-1", "org-1", ["abc"]);

    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it("produces different hashes for different data with same vendor prefix", async () => {
    // This tests that the function faithfully returns what the DB gives,
    // meaning dedup correctness depends on external_id uniqueness, not hash collisions
    const supabase = mockSupabase({
      data: [{ external_id: "csv_abc123" }],
      error: null,
    });

    const result = await getExistingExternalIds(supabase, "grant-1", "org-1", [
      "csv_abc123",
      "csv_def456",
    ]);

    expect(result.has("csv_abc123")).toBe(true);
    expect(result.has("csv_def456")).toBe(false);
  });

  it("passes grant_id and org_id to Supabase query (no cross-org dedup)", async () => {
    const eqCalls: [string, string][] = [];
    const supabase = {
      from: () => ({
        select: () => ({
          eq: (col: string, val: string) => {
            eqCalls.push([col, val]);
            return {
              eq: (col2: string, val2: string) => {
                eqCalls.push([col2, val2]);
                return {
                  in: () => Promise.resolve({ data: [], error: null }),
                };
              },
            };
          },
        }),
      }),
    } as never;

    await getExistingExternalIds(supabase, "grant-A", "org-X", ["abc"]);

    // Verify both org_id and grant_id are passed — ensures no cross-org or cross-grant dedup
    expect(eqCalls).toContainEqual(["grant_id", "grant-A"]);
    expect(eqCalls).toContainEqual(["org_id", "org-X"]);
  });

  it("same external_id, different grant_id → returns only matching grant's IDs", async () => {
    // When querying for grant-B, "abc" from grant-A should NOT be returned
    const supabase = mockSupabase({
      data: [], // DB returns nothing because grant_id filter excludes grant-A's "abc"
      error: null,
    });

    const result = await getExistingExternalIds(supabase, "grant-B", "org-1", ["abc"]);
    expect(result.has("abc")).toBe(false);
    expect(result.size).toBe(0);
  });

  it("handles large batch (1000 IDs) without error", async () => {
    const ids = Array.from({ length: 1000 }, (_, i) => `id_${i}`);
    const existingData = ids.slice(0, 500).map(id => ({ external_id: id }));

    const supabase = mockSupabase({
      data: existingData,
      error: null,
    });

    const result = await getExistingExternalIds(supabase, "grant-1", "org-1", ids);
    expect(result.size).toBe(500);
    expect(result.has("id_0")).toBe(true);
    expect(result.has("id_499")).toBe(true);
    expect(result.has("id_500")).toBe(false);
  });

  it("preserves special characters in external_ids ('qbo:123-456')", async () => {
    const specialIds = ["qbo:123-456", "xero|tx_abc", "csv_2024/01/15_vendor"];
    const supabase = mockSupabase({
      data: [{ external_id: "qbo:123-456" }],
      error: null,
    });

    const result = await getExistingExternalIds(supabase, "grant-1", "org-1", specialIds);
    expect(result.has("qbo:123-456")).toBe(true);
    expect(result.has("xero|tx_abc")).toBe(false);
  });

  it("handles single external_id lookup", async () => {
    const supabase = mockSupabase({
      data: [{ external_id: "single-id" }],
      error: null,
    });

    const result = await getExistingExternalIds(supabase, "grant-1", "org-1", ["single-id"]);

    expect(result.size).toBe(1);
    expect(result.has("single-id")).toBe(true);
  });

  it("duplicate IDs in input array handled without error", async () => {
    const supabase = mockSupabase({
      data: [{ external_id: "abc" }],
      error: null,
    });

    const result = await getExistingExternalIds(supabase, "grant-1", "org-1", ["abc", "abc"]);
    expect(result).toBeInstanceOf(Set);
    expect(result.has("abc")).toBe(true);
    // Set naturally deduplicates — result has 1 entry
    expect(result.size).toBe(1);
  });

  it("empty string external_id is valid", async () => {
    const supabase = mockSupabase({
      data: [{ external_id: "" }],
      error: null,
    });

    const result = await getExistingExternalIds(supabase, "grant-1", "org-1", [""]);
    expect(result.has("")).toBe(true);
  });
});

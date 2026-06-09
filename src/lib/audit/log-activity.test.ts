import { describe, it, expect, vi, beforeEach } from "vitest";
import { logActivity } from "./log-activity";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

function createMockSupabase(insertResult: { error: null | { message: string } }) {
  const mockInsert = vi.fn().mockResolvedValue(insertResult);
  const mockFrom = vi.fn((_table: string) => ({ insert: mockInsert }));
  return { from: mockFrom };
}

describe("logActivity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts activity log entry with correct fields", async () => {
    const supabase = createMockSupabase({ error: null });

    logActivity({
      supabase: supabase as never,
      orgId: "org_123",
      actorId: "user_456",
      actorEmail: "user@test.com",
      action: "grant_created",
      grantId: "grant_789",
      details: { grant_name: "Test Grant" },
    });

    // Wait for the fire-and-forget promise
    await new Promise((r) => setTimeout(r, 10));

    expect(supabase.from).toHaveBeenCalledWith("activity_log");
    const insertCall = supabase.from("activity_log").insert;
    expect(insertCall).toHaveBeenCalledWith({
      org_id: "org_123",
      actor_id: "user_456",
      actor_email: "user@test.com",
      action: "grant_created",
      grant_id: "grant_789",
      expense_id: null,
      details: { grant_name: "Test Grant" },
    });
  });

  it("does not throw when insert fails", async () => {
    const supabase = createMockSupabase({ error: { message: "DB error" } });
    const { logger } = await import("@/lib/logger");

    logActivity({
      supabase: supabase as never,
      orgId: "org_123",
      actorId: "user_456",
      actorEmail: "user@test.com",
      action: "grant_deleted",
    });

    await new Promise((r) => setTimeout(r, 10));

    expect(logger.error).toHaveBeenCalledWith(
      "Failed to log activity",
      expect.objectContaining({ action: "grant_deleted" })
    );
  });

  it("defaults optional fields to null", async () => {
    const supabase = createMockSupabase({ error: null });

    logActivity({
      supabase: supabase as never,
      orgId: "org_123",
      actorId: "user_456",
      actorEmail: "user@test.com",
      action: "expenses_imported",
    });

    await new Promise((r) => setTimeout(r, 10));

    const insertCall = supabase.from("activity_log").insert;
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({
        grant_id: null,
        expense_id: null,
        details: {},
      })
    );
  });

  it("catches and does not throw when insert rejects with an exception", async () => {
    const { logger } = await import("@/lib/logger");
    const mockInsert = vi.fn().mockRejectedValue(new Error("Connection refused"));
    const mockFrom = vi.fn((_table: string) => ({ insert: mockInsert }));
    const supabase = { from: mockFrom };

    // Should not throw — fire-and-forget
    expect(() => {
      logActivity({
        supabase: supabase as never,
        orgId: "org_123",
        actorId: "user_456",
        actorEmail: "user@test.com",
        action: "grant_created",
      });
    }).not.toThrow();

    await new Promise((r) => setTimeout(r, 50));

    expect(logger.error).toHaveBeenCalledWith(
      "Activity log insert threw",
      expect.objectContaining({ action: "grant_created" })
    );
  });

  it("handles undefined details parameter", async () => {
    const supabase = createMockSupabase({ error: null });

    logActivity({
      supabase: supabase as never,
      orgId: "org_123",
      actorId: "user_456",
      actorEmail: "user@test.com",
      action: "grant_updated",
      details: undefined,
    });

    await new Promise((r) => setTimeout(r, 10));

    const insertCall = supabase.from("activity_log").insert;
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({
        details: {},
      })
    );
  });

  it("empty actorEmail is stored as empty string (not coerced to null)", async () => {
    const supabase = createMockSupabase({ error: null });

    logActivity({
      supabase: supabase as never,
      orgId: "org_123",
      actorId: "user_456",
      actorEmail: "",
      action: "grant_created",
    });

    await new Promise((r) => setTimeout(r, 10));

    const insertCall = supabase.from("activity_log").insert;
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({
        actor_email: "",
      })
    );
  });

  it("large details object (50 keys) is passed to insert without error", async () => {
    const supabase = createMockSupabase({ error: null });

    const largeDetails: Record<string, unknown> = {};
    for (let i = 0; i < 50; i++) {
      largeDetails[`key_${i}`] = `value_${i}`;
    }

    logActivity({
      supabase: supabase as never,
      orgId: "org_123",
      actorId: "user_456",
      actorEmail: "user@test.com",
      action: "expenses_imported",
      details: largeDetails,
    });

    await new Promise((r) => setTimeout(r, 10));

    const insertCall = supabase.from("activity_log").insert;
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({
        details: largeDetails,
      })
    );
    expect(Object.keys(largeDetails)).toHaveLength(50);
  });

  it("all ActivityAction values are valid string literals", () => {
    // Type-level check: all 11 ActivityAction values should be valid for logActivity
    const actions: Array<import("@/lib/supabase/database.types").ActivityAction> = [
      "grant_created", "grant_updated", "grant_deleted",
      "expense_confirmed", "expense_excluded", "expense_deleted",
      "expenses_imported", "bulk_confirmed", "report_generated",
      "member_invited", "member_role_changed", "member_removed",
    ];
    for (const action of actions) {
      expect(typeof action).toBe("string");
      expect(action.length).toBeGreaterThan(0);
    }
  });

  it("null grantId and null expenseId are stored as null", async () => {
    const supabase = createMockSupabase({ error: null });

    logActivity({
      supabase: supabase as never,
      orgId: "org_123",
      actorId: "user_456",
      actorEmail: "user@test.com",
      action: "expenses_imported",
      grantId: null,
      expenseId: null,
    });

    await new Promise((r) => setTimeout(r, 10));

    const insertCall = supabase.from("activity_log").insert;
    expect(insertCall).toHaveBeenCalledWith(
      expect.objectContaining({
        grant_id: null,
        expense_id: null,
      })
    );
  });

  it("passes all fields correctly including expenseId and details", async () => {
    const supabase = createMockSupabase({ error: null });

    logActivity({
      supabase: supabase as never,
      orgId: "org_abc",
      actorId: "user_xyz",
      actorEmail: "actor@example.com",
      action: "expense_confirmed",
      grantId: "grant_100",
      expenseId: "exp_200",
      details: { category: "travel", amount: 500 },
    });

    await new Promise((r) => setTimeout(r, 10));

    const insertCall = supabase.from("activity_log").insert;
    expect(insertCall).toHaveBeenCalledWith({
      org_id: "org_abc",
      actor_id: "user_xyz",
      actor_email: "actor@example.com",
      action: "expense_confirmed",
      grant_id: "grant_100",
      expense_id: "exp_200",
      details: { category: "travel", amount: 500 },
    });
  });
});

import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { createAdminClient } from "@/lib/supabase/admin";
import { getSubscriptionStatus, getTrialDaysRemaining, isTrialExpired } from "./subscription";

describe("getSubscriptionStatus", () => {
  it("returns org data on successful fetch", async () => {
    const orgData = {
      id: "org_1",
      name: "Test Org",
      subscription_status: "active",
      subscription_plan: "price_123",
      trial_ends_at: null,
      stripe_customer_id: "cus_123",
    };

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: orgData, error: null })),
          })),
        })),
        insert: vi.fn(),
      })),
    } as never);

    const result = await getSubscriptionStatus("org_1");
    expect(result).toEqual(orgData);
  });

  it("auto-provisions org on PGRST116 (insert succeeds)", async () => {
    const newOrg = {
      id: "org_new",
      name: "My Organization",
      subscription_status: "trialing",
      subscription_plan: null,
      trial_ends_at: "2025-02-01T00:00:00Z",
      stripe_customer_id: null,
    };

    let selectCallCount = 0;

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => {
              selectCallCount++;
              // First call: org not found (PGRST116)
              return Promise.resolve({ data: null, error: { code: "PGRST116", message: "Not found" } });
            }),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              // Insert succeeds
              Promise.resolve({ data: newOrg, error: null })
            ),
          })),
        })),
      })),
    } as never);

    const result = await getSubscriptionStatus("org_new");
    expect(result).toEqual(newOrg);
    expect(result?.subscription_status).toBe("trialing");
  });

  it("returns null on non-PGRST116 error", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: null, error: { code: "PGRST500", message: "Internal error" } })
            ),
          })),
        })),
      })),
    } as never);

    const result = await getSubscriptionStatus("org_broken");
    expect(result).toBeNull();
  });

  it("returns null when insert AND re-fetch both fail", async () => {
    let selectCallCount = 0;

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => {
              selectCallCount++;
              if (selectCallCount === 1) {
                return Promise.resolve({ data: null, error: { code: "PGRST116", message: "Not found" } });
              }
              // Re-fetch also fails
              return Promise.resolve({ data: null, error: { message: "Still broken" } });
            }),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: null, error: { message: "Insert failed" } })
            ),
          })),
        })),
      })),
    } as never);

    const result = await getSubscriptionStatus("org_total_fail");
    expect(result).toBeNull();
  });

  it("recovers from race condition (insert fails, re-fetch succeeds)", async () => {
    const existingOrg = {
      id: "org_race",
      name: "My Organization",
      subscription_status: "trialing",
      subscription_plan: null,
      trial_ends_at: "2025-01-15T00:00:00Z",
      stripe_customer_id: null,
    };

    let selectCallCount = 0;

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => {
              selectCallCount++;
              if (selectCallCount === 1) {
                // First call: org not found (PGRST116)
                return Promise.resolve({ data: null, error: { code: "PGRST116", message: "Not found" } });
              }
              // Third call (re-fetch after insert failure): org found
              return Promise.resolve({ data: existingOrg, error: null });
            }),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              // Insert fails (duplicate key — another request created it first)
              Promise.resolve({ data: null, error: { message: "duplicate key" } })
            ),
          })),
        })),
      })),
    } as never);

    const result = await getSubscriptionStatus("org_race");
    expect(result).toEqual(existingOrg);
  });
});

describe("getTrialDaysRemaining", () => {
  it("returns 0 for null input", () => {
    expect(getTrialDaysRemaining(null)).toBe(0);
  });

  it("returns 0 for past date", () => {
    expect(getTrialDaysRemaining("2020-01-01T00:00:00Z")).toBe(0);
  });

  it("returns correct days for future date", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const result = getTrialDaysRemaining(future);
    expect(result).toBeGreaterThanOrEqual(6);
    expect(result).toBeLessThanOrEqual(8);
  });

  it("returns 14 for exactly 14 days out", () => {
    const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const result = getTrialDaysRemaining(future);
    // Math.ceil means it should be exactly 14 (within tolerance for test execution time)
    expect(result).toBeGreaterThanOrEqual(13);
    expect(result).toBeLessThanOrEqual(15);
  });

  it("returns 0 or 1 for date that is right now", () => {
    const now = new Date().toISOString();
    const result = getTrialDaysRemaining(now);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(1);
  });
});

describe("isTrialExpired", () => {
  it("returns true for null", () => {
    expect(isTrialExpired(null)).toBe(true);
  });

  it("returns true for past date", () => {
    expect(isTrialExpired("2020-01-01T00:00:00Z")).toBe(true);
  });

  it("returns false for future date", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(isTrialExpired(future)).toBe(false);
  });

  it("returns false for date just barely in the future", () => {
    // 1 second in the future
    const future = new Date(Date.now() + 1000).toISOString();
    expect(isTrialExpired(future)).toBe(false);
  });

  it("returns false for invalid date string (Invalid Date comparison is falsy)", () => {
    // Note: new Date("not-a-date") is Invalid Date, comparisons with Invalid Date return false
    // This means corrupted dates are treated as NOT expired — a potential data integrity risk
    expect(isTrialExpired("not-a-date")).toBe(false);
  });
});

describe("getTrialDaysRemaining edge cases", () => {
  it("returns 0 for exactly 0ms remaining (boundary)", () => {
    // Date slightly in the past to ensure 0
    const justPast = new Date(Date.now() - 1).toISOString();
    expect(getTrialDaysRemaining(justPast)).toBe(0);
  });
});

describe("getSubscriptionStatus auto-provision details", () => {
  it('auto-provisioned org inserts name "My Organization"', async () => {
    const insertSpy = vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() =>
          Promise.resolve({
            data: {
              id: "org_named",
              name: "My Organization",
              subscription_status: "trialing",
              subscription_plan: null,
              trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              stripe_customer_id: null,
            },
            error: null,
          })
        ),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: null, error: { code: "PGRST116", message: "Not found" } })
            ),
          })),
        })),
        insert: insertSpy,
      })),
    } as never);

    const result = await getSubscriptionStatus("org_named");
    expect(result?.name).toBe("My Organization");
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({ name: "My Organization" })
    );
  });
});

describe("getTrialDaysRemaining edge cases", () => {
  it("returns 1 for 12 hours from now", () => {
    const halfDay = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    // Math.ceil(0.5) = 1
    expect(getTrialDaysRemaining(halfDay)).toBe(1);
  });
});

describe("getSubscriptionStatus edge cases", () => {
  it("insert succeeds but data is null → returns null", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: null, error: { code: "PGRST116", message: "Not found" } })
            ),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              // Insert succeeds but returns null data
              Promise.resolve({ data: null, error: null })
            ),
          })),
        })),
      })),
    } as never);

    const result = await getSubscriptionStatus("org_null_data");
    // When insert succeeds but data is null, the function returns newOrg which is null
    expect(result).toBeNull();
  });
});

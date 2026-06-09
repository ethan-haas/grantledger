import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getClientEnv: () => ({
    NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID: "price_monthly",
    NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID: "price_annual",
  }),
}));

describe("stripe-config", () => {
  it("STRIPE_PRICES uses validated defaults", async () => {
    const { STRIPE_PRICES } = await import("./stripe-config");
    expect(STRIPE_PRICES.monthly).toBe("price_monthly");
    expect(STRIPE_PRICES.annual).toBe("price_annual");
  });

  it("PLAN_DETAILS monthly has correct price and interval", async () => {
    const { PLAN_DETAILS } = await import("./stripe-config");
    expect(PLAN_DETAILS.monthly.price).toBe(149);
    expect(PLAN_DETAILS.monthly.interval).toBe("month");
    expect(PLAN_DETAILS.monthly.priceId).toBe("price_monthly");
  });

  it("PLAN_DETAILS annual has savings text", async () => {
    const { PLAN_DETAILS } = await import("./stripe-config");
    expect(PLAN_DETAILS.annual.price).toBe(1490);
    expect(PLAN_DETAILS.annual.interval).toBe("year");
    expect(PLAN_DETAILS.annual.savings).toBe("Save $298/year");
  });

  it("PLAN_DETAILS monthly name is 'Monthly'", async () => {
    const { PLAN_DETAILS } = await import("./stripe-config");
    expect(PLAN_DETAILS.monthly.name).toBe("Monthly");
  });

  it("PLAN_DETAILS annual name is 'Annual'", async () => {
    const { PLAN_DETAILS } = await import("./stripe-config");
    expect(PLAN_DETAILS.annual.name).toBe("Annual");
  });

  it("PLAN_DETAILS annual priceId matches STRIPE_PRICES", async () => {
    const { PLAN_DETAILS, STRIPE_PRICES } = await import("./stripe-config");
    expect(PLAN_DETAILS.annual.priceId).toBe(STRIPE_PRICES.annual);
    expect(PLAN_DETAILS.annual.priceId).toBe("price_annual");
  });

  it("both plans have all required fields", async () => {
    const { PLAN_DETAILS } = await import("./stripe-config");

    // Monthly required fields
    expect(PLAN_DETAILS.monthly).toHaveProperty("name");
    expect(PLAN_DETAILS.monthly).toHaveProperty("price");
    expect(PLAN_DETAILS.monthly).toHaveProperty("interval");
    expect(PLAN_DETAILS.monthly).toHaveProperty("priceId");

    // Annual required fields + savings
    expect(PLAN_DETAILS.annual).toHaveProperty("name");
    expect(PLAN_DETAILS.annual).toHaveProperty("price");
    expect(PLAN_DETAILS.annual).toHaveProperty("interval");
    expect(PLAN_DETAILS.annual).toHaveProperty("priceId");
    expect(PLAN_DETAILS.annual).toHaveProperty("savings");
  });
});

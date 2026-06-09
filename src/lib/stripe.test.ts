import { describe, it, expect, vi, beforeEach } from "vitest";

const mockStripeConstructor = vi.fn();

vi.mock("stripe", () => ({
  default: function StripeMock(...args: unknown[]) {
    mockStripeConstructor(...args);
    return {};
  },
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ STRIPE_SECRET_KEY: "sk_test_mock_key" }),
}));

describe("stripe client initialization", () => {
  beforeEach(() => {
    vi.resetModules();
    mockStripeConstructor.mockClear();
  });

  it('initialized with apiVersion "2023-10-16"', async () => {
    await import("./stripe");
    expect(mockStripeConstructor.mock.calls[0][1]).toHaveProperty("apiVersion", "2023-10-16");
  });

  it("initialized with typescript: true", async () => {
    await import("./stripe");
    expect(mockStripeConstructor.mock.calls[0][1]).toHaveProperty("typescript", true);
  });

  it("uses STRIPE_SECRET_KEY from env", async () => {
    await import("./stripe");
    expect(mockStripeConstructor.mock.calls[0][0]).toBe("sk_test_mock_key");
  });
});

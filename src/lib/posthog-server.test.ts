import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

describe("trackServerEvent", () => {
  const originalEnv = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  let mockCapture: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    mockCapture = vi.fn();

    vi.doMock("posthog-node", () => ({
      PostHog: function MockPostHog() {
        return { capture: mockCapture };
      },
    }));
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_POSTHOG_KEY = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    }
  });

  it("no-ops when POSTHOG_KEY is not set", async () => {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const { trackServerEvent } = await import("./posthog-server");
    trackServerEvent("user1", "test_event");
    expect(mockCapture).not.toHaveBeenCalled();
  });

  it("calls capture with correct params when key is set", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test123";
    const { trackServerEvent } = await import("./posthog-server");
    trackServerEvent("user1", "signup_completed", { org_id: "org1" });
    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: "user1",
      event: "signup_completed",
      properties: { org_id: "org1" },
    });
  });

  it("handles errors gracefully without throwing", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test123";
    mockCapture.mockImplementation(() => {
      throw new Error("PostHog error");
    });
    const { trackServerEvent } = await import("./posthog-server");
    expect(() => trackServerEvent("user1", "test_event")).not.toThrow();
  });

  it("reuses the client on subsequent calls", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test123";
    const { trackServerEvent } = await import("./posthog-server");
    trackServerEvent("user1", "event1");
    trackServerEvent("user1", "event2");
    expect(mockCapture).toHaveBeenCalledTimes(2);
  });

  it("capture called without properties when none provided", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test123";
    const { trackServerEvent } = await import("./posthog-server");
    trackServerEvent("user1", "some_event");
    expect(mockCapture).toHaveBeenCalledWith({
      distinctId: "user1",
      event: "some_event",
      properties: undefined,
    });
  });

  it("PostHog constructor receives correct config", async () => {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test123";

    vi.resetModules();
    const constructorArgs: unknown[] = [];
    vi.doMock("posthog-node", () => ({
      PostHog: function MockPostHog(...args: unknown[]) {
        constructorArgs.push(...args);
        return { capture: vi.fn() };
      },
    }));

    const { trackServerEvent } = await import("./posthog-server");
    trackServerEvent("user1", "evt");

    expect(constructorArgs[0]).toBe("phc_test123");
    expect(constructorArgs[1]).toEqual({
      host: "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  });
});

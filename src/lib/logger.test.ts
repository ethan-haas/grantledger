import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Sentry before any imports
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

describe("logger", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("prod: error with Error calls Sentry.captureException", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const { logger } = await import("./logger");
    const Sentry = await import("@sentry/nextjs");

    const err = new Error("boom");
    logger.error("something failed", err);

    expect(Sentry.captureException).toHaveBeenCalledWith(err, {
      extra: { message: "something failed" },
    });
  });

  it("prod: error with data calls Sentry.captureException with new Error", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const { logger } = await import("./logger");
    const Sentry = await import("@sentry/nextjs");

    logger.error("data error", { key: "val" });

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "data error" }),
      { extra: { key: "val" } }
    );
  });

  it("prod: warn calls Sentry.addBreadcrumb", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const { logger } = await import("./logger");
    const Sentry = await import("@sentry/nextjs");

    logger.warn("warning msg", { d: "x" });

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: "warning",
      message: "warning msg",
      data: { d: "x" },
      level: "warning",
    });
  });

  it("dev: info calls console.log", async () => {
    vi.stubEnv("NODE_ENV", "test");

    const { logger } = await import("./logger");
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});

    logger.info("info msg", { k: "v" });

    expect(spy).toHaveBeenCalledWith("info msg", { k: "v" });
    spy.mockRestore();
  });
});

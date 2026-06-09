import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";
import { withRequestLogging } from "./with-logging";

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("withRequestLogging", () => {
  let mockLogger: { info: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    vi.clearAllMocks();
    const { logger } = await import("@/lib/logger");
    mockLogger = logger as unknown as typeof mockLogger;
  });

  function makeRequest(path = "/api/test", method = "GET"): Request {
    return new Request(`http://localhost:3000${path}`, { method });
  }

  it("logs method, path, status, and duration on success", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
    const wrapped = withRequestLogging(handler);

    await wrapped(makeRequest("/api/grants"));

    expect(mockLogger.info).toHaveBeenCalledWith("API request", expect.objectContaining({
      method: "GET",
      path: "/api/grants",
      status: 200,
      duration_ms: expect.any(Number),
    }));
  });

  it("logs error details on handler throw", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("DB connection failed"));
    const wrapped = withRequestLogging(handler);

    await wrapped(makeRequest("/api/test", "POST"));

    expect(mockLogger.error).toHaveBeenCalledWith("API request failed", expect.objectContaining({
      method: "POST",
      path: "/api/test",
      error: "DB connection failed",
      duration_ms: expect.any(Number),
    }));
  });

  it("returns 500 when handler throws", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("crash"));
    const wrapped = withRequestLogging(handler);

    const res = await wrapped(makeRequest());

    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });

  it("duration is non-negative", async () => {
    const handler = vi.fn().mockResolvedValue(NextResponse.json({}));
    const wrapped = withRequestLogging(handler);

    await wrapped(makeRequest());

    const logCall = mockLogger.info.mock.calls[0];
    expect(logCall[1].duration_ms).toBeGreaterThanOrEqual(0);
  });

  it("does not modify the handler response", async () => {
    const original = NextResponse.json({ data: "test" }, { status: 201 });
    const handler = vi.fn().mockResolvedValue(original);
    const wrapped = withRequestLogging(handler);

    const res = await wrapped(makeRequest());

    expect(res).toBe(original);
    expect(res.status).toBe(201);
  });
});

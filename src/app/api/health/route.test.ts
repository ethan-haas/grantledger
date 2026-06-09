import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockLimit = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ limit: mockLimit });
});

import { GET } from "./route";

describe("GET /api/health", () => {
  it("returns 200 when Supabase is reachable", async () => {
    mockLimit.mockResolvedValue({ error: null, data: [{ id: "1" }] });

    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("connected");
    expect(typeof body.latency_ms).toBe("number");
    expect(body.version).toBeDefined();
  });

  it("returns latency_ms as a positive number", async () => {
    mockLimit.mockResolvedValue({ error: null, data: [{ id: "1" }] });

    const res = await GET();
    const body = await res.json();
    expect(body.latency_ms).toBeGreaterThanOrEqual(0);
    expect(typeof body.latency_ms).toBe("number");
  });

  it("returns 503 when Supabase throws an exception", async () => {
    mockLimit.mockRejectedValue(new Error("Connection refused"));

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.db).toBe("unreachable");
    expect(typeof body.latency_ms).toBe("number");
  });

  it("returns 503 when Supabase query fails", async () => {
    mockLimit.mockResolvedValue({
      error: { message: "connection refused" },
      data: null,
    });

    const res = await GET();
    expect(res.status).toBe(503);

    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.db).toBe("unreachable");
    expect(body.error).toBe("connection refused");
  });
});

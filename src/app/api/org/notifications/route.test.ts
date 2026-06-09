import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(() => ({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" })),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

describe("GET /api/org/notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockReturnValue({ orgId: null } as never);

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(401);

    vi.mocked(auth).mockReturnValue({ orgId: "org_1" } as never);
  });

  it("returns notification preferences", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: { notify_weekly_digest: true, notify_trial_reminders: false, notify_budget_alerts: true },
            error: null,
          })),
        })),
      })),
    });

    const { GET } = await import("./route");
    const res = await GET();
    const data = await res.json();
    expect(data.notify_weekly_digest).toBe(true);
    expect(data.notify_trial_reminders).toBe(false);
  });

  it("returns 500 when query fails", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: { message: "DB error" },
          })),
        })),
      })),
    });

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(500);
  });
});

describe("PATCH /api/org/notifications", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when unauthenticated", async () => {
    const { auth } = await import("@clerk/nextjs/server");
    vi.mocked(auth).mockReturnValue({ orgId: null } as never);

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/org/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notify_weekly_digest: false }),
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(401);

    vi.mocked(auth).mockReturnValue({ orgId: "org_1" } as never);
  });

  it("updates preferences successfully", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: null })),
      })),
    });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/org/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notify_weekly_digest: false }),
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 400 when no valid fields provided", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/org/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invalid_field: true }),
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(400);
  });

  it("returns 500 when update fails", async () => {
    mockFrom.mockReturnValue({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ error: { message: "DB error" } })),
      })),
    });

    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/org/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notify_budget_alerts: true }),
    });
    const res = await PATCH(req as never);
    expect(res.status).toBe(500);
  });
});

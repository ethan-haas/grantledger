import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

const mockSelect = vi.fn();
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: () => Promise.resolve({ from: (...args: unknown[]) => mockFrom(...args) }),
}));

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { GET } from "./route";

describe("GET /api/connections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getAuthOrgId).mockReturnValue({ orgId: null, userId: "user_1", userEmail: null });

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 with connections list", async () => {
    vi.mocked(getAuthOrgId).mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const connections = [
      { id: "conn_1", provider: "quickbooks", status: "connected", last_synced_at: null, error_message: null, created_at: "2024-01-01" },
    ];

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: connections, error: null }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(connections);
  });

  it("returns 500 on database error", async () => {
    vi.mocked(getAuthOrgId).mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    mockSelect.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      }),
    });

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("An internal error occurred");
  });
});

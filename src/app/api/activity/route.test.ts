import { describe, it, expect, vi, beforeEach } from "vitest";

const mockAuth = vi.fn((): { orgId: string | null; userId: string | null; userEmail: string | null } => ({ orgId: "org_123", userId: "user_abc", userEmail: "user@test.com" }));

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: () => mockAuth(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock("@/lib/api/headers", () => ({
  NO_CACHE_HEADERS: { "Cache-Control": "no-store" },
}));

const mockSelect = vi.fn();
const mockFrom = vi.fn(() => ({ select: mockSelect }));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
}));

import { NextRequest } from "next/server";

function createRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/activity");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
}

describe("GET /api/activity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockReturnValue({ orgId: "org_123", userId: "user_abc", userEmail: "user@test.com" });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const { GET } = await import("./route");
    const response = await GET(createRequest());
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns paginated activity log for org", async () => {
    const activities = [
      { id: "act_1", org_id: "org_123", action: "created_grant", created_at: "2024-01-01" },
      { id: "act_2", org_id: "org_123", action: "confirmed_expense", created_at: "2024-01-02" },
    ];

    const query = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: activities, error: null, count: 2 }),
    };
    mockSelect.mockReturnValue(query);

    const { GET } = await import("./route");
    const response = await GET(createRequest());
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.activities).toHaveLength(2);
    expect(data.total).toBe(2);
    expect(data.page).toBe(1);
    expect(data.per_page).toBe(20);
  });

  it("filters by grant_id when provided", async () => {
    // The route chains: select → eq → order → range → eq(grant_id) → await
    // Use a Promise with chain methods so it's both chainable and awaitable.
    const chainable = Promise.resolve({ data: [], error: null, count: 0 });
    (chainable as unknown as Record<string, unknown>).eq = vi.fn(() => chainable);
    (chainable as unknown as Record<string, unknown>).order = vi.fn(() => chainable);
    (chainable as unknown as Record<string, unknown>).range = vi.fn(() => chainable);
    mockSelect.mockReturnValue(chainable);

    const { GET } = await import("./route");
    const grantId = "550e8400-e29b-41d4-a716-446655440000";
    const response = await GET(createRequest({ grant_id: grantId }));
    expect(response.status).toBe(200);
    const eqMock = (chainable as unknown as { eq: ReturnType<typeof vi.fn> }).eq;
    expect(eqMock).toHaveBeenCalledWith("org_id", "org_123");
    expect(eqMock).toHaveBeenCalledWith("grant_id", grantId);
  });

  it("returns 400 for invalid query params", async () => {
    const { GET } = await import("./route");
    const response = await GET(createRequest({ page: "abc" }));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid query parameters");
  });

  it("returns 500 when Supabase query fails", async () => {
    const query = {
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" }, count: null }),
    };
    mockSelect.mockReturnValue(query);

    const { GET } = await import("./route");
    const response = await GET(createRequest());
    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error).toBe("Failed to fetch activity log");
  });
});

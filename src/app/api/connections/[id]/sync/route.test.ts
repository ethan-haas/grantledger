import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSyncConnection = vi.fn();
const mockRateLimitCheck = vi.fn();
const mockRateLimitResponse = vi.fn();
const mockTrackServerEvent = vi.fn();
const mockSingle = vi.fn();
const mockEq3 = vi.fn().mockReturnValue({ single: mockSingle });
const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3, single: mockSingle });
const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
const mockUpdateEq2 = vi.fn().mockResolvedValue({ error: null });
const mockUpdateEq1 = vi.fn().mockReturnValue({ eq: mockUpdateEq2 });
const mockSupabaseUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq1 });
const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  update: mockSupabaseUpdate,
});

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/lib/integrations/sync-manager", () => ({
  syncConnection: (...args: unknown[]) => mockSyncConnection(...args),
}));

vi.mock("@/lib/auth/api-guard", () => ({
  requireActiveSubscription: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/api/rate-limit", () => ({
  createRateLimiter: () => ({
    check: (...args: unknown[]) => mockRateLimitCheck(...args),
    _map: new Map(),
  }),
  rateLimitResponse: (...args: unknown[]) => mockRateLimitResponse(...args),
}));

vi.mock("@/lib/posthog-server", () => ({
  trackServerEvent: (...args: unknown[]) => mockTrackServerEvent(...args),
}));

import { POST } from "./route";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { createServerClient } from "@/lib/supabase/server";

const mockGetAuthOrgId = vi.mocked(getAuthOrgId);
const mockCreateServerClient = vi.mocked(createServerClient);

function makeRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/connections/conn_1/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const params = { id: "conn_1" };

describe("sync route POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock chains
    mockSingle.mockReset();
    mockEq3.mockReturnValue({ single: mockSingle });
    mockEq2.mockReturnValue({ eq: mockEq3, single: mockSingle });
    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockSelect.mockReturnValue({ eq: mockEq1 });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockSupabaseUpdate });
    mockCreateServerClient.mockResolvedValue({ from: mockFrom } as never);
    mockRateLimitCheck.mockReturnValue({ allowed: true, remaining: 99, resetAt: Date.now() + 900000 });
  });

  it("returns 401 when orgId is missing", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });
    const res = await POST(makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }), { params });
    expect(res.status).toBe(401);
  });

  it("returns 404 when connection not found (org mismatch)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

    const res = await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Connection not found");
  });

  it("returns 400 when connection is not active", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({
      data: { id: "conn_1", org_id: "org_1", status: "error" },
      error: null,
    });

    const res = await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("not active");
  });

  it("returns 404 when grant not found", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle
      .mockResolvedValueOnce({
        data: { id: "conn_1", org_id: "org_1", status: "connected" },
        error: null,
      })
      .mockResolvedValueOnce({ data: null, error: null });

    const res = await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Grant not found");
  });

  it("returns synced and categorized counts on success", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle
      .mockResolvedValueOnce({
        data: { id: "conn_1", org_id: "org_1", status: "connected" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "00000000-0000-0000-0000-000000000001" },
        error: null,
      });
    mockSyncConnection.mockResolvedValue({ synced: 5, categorized: 3 });

    const res = await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.synced).toBe(5);
    expect(body.categorized).toBe(3);
  });

  it("returns 400 for malformed JSON body", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const req = new Request("http://localhost/api/connections/conn_1/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json",
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON");
  });

  it("returns 400 for missing grant_id in body", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const res = await POST(makeRequest({}), { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 for invalid grant_id format (non-UUID)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const res = await POST(makeRequest({ grant_id: "not-a-uuid" }), { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 500 when syncConnection throws", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle
      .mockResolvedValueOnce({
        data: { id: "conn_1", org_id: "org_1", status: "connected" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "00000000-0000-0000-0000-000000000001" },
        error: null,
      });
    mockSyncConnection.mockRejectedValue(new Error("Provider API down"));

    const res = await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Sync failed. Please try again.");
  });

  it("persists error status on connection when sync fails", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle
      .mockResolvedValueOnce({
        data: { id: "conn_1", org_id: "org_1", status: "connected" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "00000000-0000-0000-0000-000000000001" },
        error: null,
      });
    mockSyncConnection.mockRejectedValue(new Error("Token expired"));

    await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );

    expect(mockSupabaseUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: "error", error_message: "Token expired" })
    );
  });

  it("calls trackServerEvent on successful sync", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle
      .mockResolvedValueOnce({
        data: { id: "conn_1", org_id: "org_1", status: "connected" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "00000000-0000-0000-0000-000000000001" },
        error: null,
      });
    mockSyncConnection.mockResolvedValue({ synced: 10, categorized: 7 });

    await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );

    expect(mockTrackServerEvent).toHaveBeenCalledWith(
      "org_1",
      "connection_synced",
      expect.objectContaining({ connection_id: "conn_1", synced: 10, categorized: 7 })
    );
  });

  it("connection lookup includes both .eq('id', connId) AND .eq('org_id', orgId)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({
      data: { id: "conn_1", org_id: "org_1", status: "connected" },
      error: null,
    }).mockResolvedValueOnce({
      data: { id: "00000000-0000-0000-0000-000000000001" },
      error: null,
    });
    mockSyncConnection.mockResolvedValue({ synced: 0, categorized: 0 });

    await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );

    // The select chain has mockEq1 → mockEq2 → mockEq3
    // First select call: connection lookup with .eq("id", connId).eq("org_id", orgId)
    expect(mockEq1).toHaveBeenCalledWith("id", "conn_1");
    expect(mockEq2).toHaveBeenCalledWith("org_id", "org_1");
  });

  it("grant lookup includes both .eq('id', grantId) AND .eq('org_id', orgId)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle
      .mockResolvedValueOnce({
        data: { id: "conn_1", org_id: "org_1", status: "connected" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "00000000-0000-0000-0000-000000000001" },
        error: null,
      });
    mockSyncConnection.mockResolvedValue({ synced: 0, categorized: 0 });

    await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );

    // Second select call: grant lookup also goes through the chain
    // The eq chain is mockEq1("id",..) → mockEq2("org_id",..)
    // Both connection and grant lookups use same chain structure
    // Verify org_id was passed at least once per lookup
    const orgIdCalls = mockEq2.mock.calls.filter(
      (call: unknown[]) => call[0] === "org_id" && call[1] === "org_1"
    );
    expect(orgIdCalls.length).toBeGreaterThanOrEqual(2);
  });

  it("error status update includes .eq('org_id', orgId)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle
      .mockResolvedValueOnce({
        data: { id: "conn_1", org_id: "org_1", status: "connected" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "00000000-0000-0000-0000-000000000001" },
        error: null,
      });
    mockSyncConnection.mockRejectedValue(new Error("Provider API down"));

    await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );

    // Error status update goes through mockSupabaseUpdate → mockUpdateEq1 → mockUpdateEq2
    expect(mockUpdateEq1).toHaveBeenCalledWith("id", "conn_1");
    expect(mockUpdateEq2).toHaveBeenCalledWith("org_id", "org_1");
  });

  it("syncConnection receives correct (connectionId, grantId, orgId) triple", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle
      .mockResolvedValueOnce({
        data: { id: "conn_1", org_id: "org_1", status: "connected" },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "00000000-0000-0000-0000-000000000001" },
        error: null,
      });
    mockSyncConnection.mockResolvedValue({ synced: 3, categorized: 1 });

    await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );

    expect(mockSyncConnection).toHaveBeenCalledWith(
      "conn_1",
      "00000000-0000-0000-0000-000000000001",
      "org_1"
    );
  });

  it("returns 429 when rate limited", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockRateLimitCheck.mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });
    mockRateLimitResponse.mockReturnValue(
      new Response(JSON.stringify({ error: "Too many requests" }), { status: 429 })
    );

    const res = await POST(
      makeRequest({ grant_id: "00000000-0000-0000-0000-000000000001" }),
      { params }
    );
    expect(res.status).toBe(429);
  });
});

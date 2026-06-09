import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSingle = vi.fn();
const mockUpdateEq2 = vi.fn().mockResolvedValue({ error: null });
const mockUpdateEq1 = vi.fn().mockReturnValue({ eq: mockUpdateEq2 });
const mockSupabaseUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq1 });
const mockEq3 = vi.fn().mockReturnValue({ single: mockSingle });
const mockEq2 = vi.fn().mockReturnValue({ eq: mockEq3, single: mockSingle });
const mockEq1 = vi.fn().mockReturnValue({ eq: mockEq2 });
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq1 });
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

vi.mock("@/lib/auth/api-guard", () => ({
  requireActiveSubscription: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { DELETE } from "./route";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { createServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/auth/api-guard";

const mockGetAuthOrgId = vi.mocked(getAuthOrgId);
const mockCreateServerClient = vi.mocked(createServerClient);
const mockRequireActiveSub = vi.mocked(requireActiveSubscription);

const params = { id: "conn_1" };

function makeRequest(): Request {
  return new Request("http://localhost/api/connections/conn_1", {
    method: "DELETE",
  });
}

describe("DELETE /api/connections/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockEq3.mockReturnValue({ single: mockSingle });
    mockEq2.mockReturnValue({ eq: mockEq3, single: mockSingle });
    mockEq1.mockReturnValue({ eq: mockEq2 });
    mockSelect.mockReturnValue({ eq: mockEq1 });
    mockSupabaseUpdate.mockReturnValue({ eq: mockUpdateEq1 });
    mockUpdateEq1.mockReturnValue({ eq: mockUpdateEq2 });
    mockUpdateEq2.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockSupabaseUpdate });
    mockCreateServerClient.mockResolvedValue({ from: mockFrom } as never);
    mockRequireActiveSub.mockResolvedValue(null);
  });

  it("returns 401 when orgId is missing", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const res = await DELETE(makeRequest(), { params });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 404 when connection not found", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: null, error: { code: "PGRST116" } });

    const res = await DELETE(makeRequest(), { params });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Connection not found");
  });

  it("returns 200 with provider name on successful disconnect", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({
      data: { id: "conn_1", provider: "quickbooks" },
      error: null,
    });

    const res = await DELETE(makeRequest(), { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toContain("quickbooks");
    expect(body.message).toContain("disconnected");
  });

  it("returns 403 when subscription guard blocks", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    const { NextResponse } = await import("next/server");
    mockRequireActiveSub.mockResolvedValue(
      NextResponse.json({ error: "Subscription required" }, { status: 403 })
    );

    const res = await DELETE(makeRequest(), { params });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Subscription required");
  });
});

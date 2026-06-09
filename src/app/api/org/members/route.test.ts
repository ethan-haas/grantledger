import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/integrations/clerk-admin", () => ({
  fetchOrgMembers: vi.fn(),
  createOrgInvitation: vi.fn(),
}));

vi.mock("@/lib/audit/log-activity", () => ({
  logActivity: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { fetchOrgMembers, createOrgInvitation } from "@/lib/integrations/clerk-admin";
import { GET, POST } from "./route";

const mockedGetAuthOrgId = vi.mocked(getAuthOrgId);
const mockedFetchOrgMembers = vi.mocked(fetchOrgMembers);
const mockedCreateOrgInvitation = vi.mocked(createOrgInvitation);

function makePostRequest(body?: unknown) {
  return new Request("http://localhost:3000/api/org/members", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/org/members", () => {
  it("returns 401 when orgId is missing", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });
    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns members from Clerk API", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
    mockedFetchOrgMembers.mockResolvedValue([
      {
        id: "mem_1",
        name: "Jane Doe",
        email: "jane@example.com",
        role: "admin",
        status: "active",
        avatarUrl: "https://img.clerk.com/avatar.jpg",
        joinedAt: "2023-11-14T00:00:00.000Z",
      },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.members).toHaveLength(1);
    expect(data.members[0].name).toBe("Jane Doe");
    expect(data.total).toBe(1);
  });

  it("returns empty array when Clerk API returns no members", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
    mockedFetchOrgMembers.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.members).toEqual([]);
    expect(data.total).toBe(0);
  });

  it("sets no-cache headers", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
    mockedFetchOrgMembers.mockResolvedValue([]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });
});

describe("POST /api/org/members", () => {
  it("returns 401 when orgId is missing", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });
    const res = await POST(makePostRequest({ email: "test@example.com", role: "member" }));
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns 400 for invalid email", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
    const res = await POST(makePostRequest({ email: "not-an-email", role: "member" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid role", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
    const res = await POST(makePostRequest({ email: "test@example.com", role: "superadmin" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for viewer role (not supported)", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
    const res = await POST(makePostRequest({ email: "test@example.com", role: "viewer" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
    const req = new Request("http://localhost:3000/api/org/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid JSON body");
  });

  it("returns 201 on successful invitation", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
    mockedCreateOrgInvitation.mockResolvedValue({ success: true });

    const res = await POST(makePostRequest({ email: "invite@example.com", role: "admin" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 409 when user is already a member", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
    mockedCreateOrgInvitation.mockResolvedValue({ success: false, error: "already_member" });

    const res = await POST(makePostRequest({ email: "existing@example.com", role: "member" }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("already a member");
  });

  it("returns 500 on invitation failure", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
    mockedCreateOrgInvitation.mockResolvedValue({ success: false, error: "API error" });

    const res = await POST(makePostRequest({ email: "fail@example.com", role: "member" }));
    expect(res.status).toBe(500);
  });
});

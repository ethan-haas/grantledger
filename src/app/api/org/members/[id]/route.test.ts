import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("@/lib/integrations/clerk-admin", () => ({
  updateMemberRole: vi.fn(),
  removeMember: vi.fn(),
  resendInvitation: vi.fn(),
}));

vi.mock("@/lib/audit/log-activity", () => ({
  logActivity: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({})),
}));

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { updateMemberRole, removeMember, resendInvitation } from "@/lib/integrations/clerk-admin";
import { PATCH, DELETE, POST } from "./route";

const mockedGetAuthOrgId = vi.mocked(getAuthOrgId);
const mockedUpdateMemberRole = vi.mocked(updateMemberRole);
const mockedRemoveMember = vi.mocked(removeMember);
const mockedResendInvitation = vi.mocked(resendInvitation);

function makeRequest(body?: unknown, method = "PATCH") {
  return new Request("http://localhost:3000/api/org/members/member_1", {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

const params = { id: "member_1" };

beforeEach(() => {
  vi.clearAllMocks();
  mockedGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "u@test.com" });
});

describe("PATCH /api/org/members/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });
    const res = await PATCH(makeRequest({ role: "admin" }), { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid role", async () => {
    const res = await PATCH(makeRequest({ role: "superadmin" }), { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const req = new Request("http://localhost:3000/api/org/members/member_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json",
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it("returns 200 on successful role update", async () => {
    mockedUpdateMemberRole.mockResolvedValue({ success: true });
    const res = await PATCH(makeRequest({ role: "admin" }), { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 500 when Clerk API fails", async () => {
    mockedUpdateMemberRole.mockResolvedValue({ success: false, error: "API error" });
    const res = await PATCH(makeRequest({ role: "admin" }), { params });
    expect(res.status).toBe(500);
  });
});

describe("DELETE /api/org/members/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });
    const res = await DELETE(
      new Request("http://localhost:3000/api/org/members/member_1", { method: "DELETE" }),
      { params }
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful removal", async () => {
    mockedRemoveMember.mockResolvedValue({ success: true });
    const res = await DELETE(
      new Request("http://localhost:3000/api/org/members/member_1", { method: "DELETE" }),
      { params }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 500 when Clerk API fails", async () => {
    mockedRemoveMember.mockResolvedValue({ success: false, error: "API error" });
    const res = await DELETE(
      new Request("http://localhost:3000/api/org/members/member_1", { method: "DELETE" }),
      { params }
    );
    expect(res.status).toBe(500);
  });
});

describe("POST /api/org/members/[id] (resend invite)", () => {
  it("returns 401 when not authenticated", async () => {
    mockedGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });
    const res = await POST(
      new Request("http://localhost:3000/api/org/members/member_1", { method: "POST" }),
      { params }
    );
    expect(res.status).toBe(401);
  });

  it("returns 200 on successful resend", async () => {
    mockedResendInvitation.mockResolvedValue({ success: true });
    const res = await POST(
      new Request("http://localhost:3000/api/org/members/member_1", { method: "POST" }),
      { params }
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it("returns 500 when resend fails", async () => {
    mockedResendInvitation.mockResolvedValue({ success: false, error: "Invitation not found" });
    const res = await POST(
      new Request("http://localhost:3000/api/org/members/member_1", { method: "POST" }),
      { params }
    );
    expect(res.status).toBe(500);
  });
});

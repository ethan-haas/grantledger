import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/auth/api-guard", () => ({
  requireActiveSubscription: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/audit/log-activity", () => ({
  logActivity: vi.fn(),
}));

const mockSingle = vi.fn();
const mockEq2 = vi.fn().mockReturnValue({ single: mockSingle });
const mockSelectEq = vi.fn().mockReturnValue({ eq: mockEq2 });
const mockSelect = vi.fn().mockReturnValue({ eq: mockSelectEq });

const mockUpdateSingle = vi.fn();
const mockUpdateSelect = vi.fn().mockReturnValue({ single: mockUpdateSingle });
const mockUpdateEq2 = vi.fn().mockReturnValue({ select: mockUpdateSelect });
const mockUpdateEq1 = vi.fn().mockReturnValue({ eq: mockUpdateEq2 });
const mockUpdate = vi.fn().mockReturnValue({ eq: mockUpdateEq1 });

const mockDeleteEq2 = vi.fn().mockResolvedValue({ error: null });
const mockDeleteEq1 = vi.fn().mockReturnValue({ eq: mockDeleteEq2 });
const mockDelete = vi.fn().mockReturnValue({ eq: mockDeleteEq1 });

const mockFrom = vi.fn().mockReturnValue({
  select: mockSelect,
  update: mockUpdate,
  delete: mockDelete,
});

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn().mockResolvedValue({ from: mockFrom }),
}));

import { getAuthOrgId } from "@/lib/auth/clerk-compat";

const mockGetAuthOrgId = vi.mocked(getAuthOrgId);
const params = { id: "exp_1" };

describe("PATCH /api/expenses/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
    });
  });

  it("returns 401 when orgId is missing", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const { PATCH } = await import("./route");
    const request = new Request("http://localhost/api/expenses/exp_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed_category: "personnel" }),
    });

    const res = await PATCH(request, { params });
    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid JSON body", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const { PATCH } = await import("./route");
    const request = new Request("http://localhost/api/expenses/exp_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    });

    const res = await PATCH(request, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid JSON");
  });

  it("returns 400 for invalid category enum", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const { PATCH } = await import("./route");
    const request = new Request("http://localhost/api/expenses/exp_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed_category: "not_a_real_category" }),
    });

    const res = await PATCH(request, { params });
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty PATCH body (no actionable fields)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const { PATCH } = await import("./route");
    const request = new Request("http://localhost/api/expenses/exp_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await PATCH(request, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No valid updates provided");
  });

  it("returns 400 when only unknown fields are sent (stripped by Zod)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });

    const { PATCH } = await import("./route");
    const request = new Request("http://localhost/api/expenses/exp_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ random: "value", unknown_field: 42 }),
    });

    const res = await PATCH(request, { params });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No valid updates provided");
  });
});

describe("DELETE /api/expenses/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockReset();
    mockEq2.mockReturnValue({ single: mockSingle });
    mockSelectEq.mockReturnValue({ eq: mockEq2 });
    mockSelect.mockReturnValue({ eq: mockSelectEq });
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
    });
  });

  it("returns 404 when expense not found (org mismatch)", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const { DELETE } = await import("./route");
    const request = new Request("http://localhost/api/expenses/exp_999", {
      method: "DELETE",
    });

    const res = await DELETE(request, { params: { id: "exp_999" } });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("Expense not found");
  });

  it("returns 204 on successful delete", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    // First call: select to verify expense exists
    mockSingle.mockResolvedValueOnce({ data: { id: "exp_1", grant_id: "grant_1" }, error: null });
    // delete chain returns no error
    mockDeleteEq2.mockResolvedValueOnce({ error: null });

    const { DELETE } = await import("./route");
    const request = new Request("http://localhost/api/expenses/exp_1", {
      method: "DELETE",
    });

    const res = await DELETE(request, { params: { id: "exp_1" } });
    expect(res.status).toBe(204);
  });
});

describe("PATCH /api/expenses/[id] — confirmation fields", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      delete: mockDelete,
    });
  });

  it("sets confirmation fields when confirmed_category is provided", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockUpdateSingle.mockResolvedValueOnce({
      data: { id: "exp_1", status: "confirmed", confirmed_category: "personnel" },
      error: null,
    });

    const { PATCH } = await import("./route");
    const request = new Request("http://localhost/api/expenses/exp_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmed_category: "personnel" }),
    });

    const res = await PATCH(request, { params: { id: "exp_1" } });
    expect(res.status).toBe(200);

    // Verify update was called with confirmation fields
    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.status).toBe("confirmed");
    expect(updateCall.confirmed_by).toBe("user_1");
    expect(updateCall.confirmed_at).toBeDefined();
    expect(updateCall.confirmed_category).toBe("personnel");
  });

  it("sets confirmation fields when status is excluded", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockUpdateSingle.mockResolvedValueOnce({
      data: { id: "exp_1", status: "excluded" },
      error: null,
    });

    const { PATCH } = await import("./route");
    const request = new Request("http://localhost/api/expenses/exp_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "excluded" }),
    });

    const res = await PATCH(request, { params: { id: "exp_1" } });
    expect(res.status).toBe(200);

    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.status).toBe("excluded");
    expect(updateCall.confirmed_by).toBe("user_1");
    expect(updateCall.confirmed_at).toBeDefined();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock auth
vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/auth/api-guard", () => ({
  requireActiveSubscription: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerClient: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { POST } from "./route";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { createServerClient } from "@/lib/supabase/server";

const mockGetAuthOrgId = getAuthOrgId as ReturnType<typeof vi.fn>;
const mockRequireActive = requireActiveSubscription as ReturnType<typeof vi.fn>;
const mockCreateClient = createServerClient as ReturnType<typeof vi.fn>;

describe("POST /api/sample-data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireActive.mockResolvedValue(null);
  });

  it("returns 401 if no orgId", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null });
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("returns 409 if org already has grants", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1" });
    mockCreateClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            data: [{ id: "existing" }],
            error: null,
          }),
        }),
      }),
    });
    const res = await POST();
    expect(res.status).toBe(409);
  });

  it("returns 200 with grant_id on success", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1" });

    const mockSupabase = {
      from: vi.fn(),
    };

    // Check existing grants (empty)
    const emptySelect = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ data: [], error: null }),
        }),
      }),
    };

    // Insert grant
    const insertGrant = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockReturnValue({ data: { id: "grant_123" }, error: null }),
        }),
      }),
    };

    // Insert budgets
    const insertBudgets = {
      insert: vi.fn().mockReturnValue({ error: null }),
    };

    // Insert expenses
    const insertExpenses = {
      insert: vi.fn().mockReturnValue({ error: null }),
    };

    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "grants" && callCount === 0) { callCount++; return emptySelect; }
      if (table === "grants" && callCount === 1) { callCount++; return insertGrant; }
      if (table === "grant_budgets") return insertBudgets;
      if (table === "expenses") return insertExpenses;
      return emptySelect;
    });

    mockCreateClient.mockResolvedValue(mockSupabase);
    const res = await POST();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.grant_id).toBe("grant_123");
  });
});

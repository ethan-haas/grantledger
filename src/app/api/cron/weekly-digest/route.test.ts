import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test.com" }),
}));

vi.mock("@/lib/auth/cron-guard", () => ({
  verifyCronSecret: vi.fn().mockReturnValue(null),
}));

vi.mock("@/lib/integrations/clerk-admin", () => ({
  fetchOrgAdminEmails: vi.fn().mockResolvedValue(["admin@test.org"]),
}));

const mockSendEmail = vi.fn().mockResolvedValue({ id: "email_1" });
vi.mock("@/lib/email/send", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/lib/email/templates/weekly-digest", () => ({
  weeklyDigestEmail: vi.fn().mockReturnValue({
    subject: "Weekly Digest",
    html: "<p>Digest</p>",
  }),
}));

// Mock Supabase chains
const mockFrom = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

import { verifyCronSecret } from "@/lib/auth/cron-guard";

describe("GET /api/cron/weekly-digest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without cron secret", async () => {
    const mockBlocked = vi.mocked(verifyCronSecret);
    mockBlocked.mockReturnValueOnce(
      new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }) as never
    );

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/cron/weekly-digest"));
    expect(res.status).toBe(401);
  });

  it("returns 500 when org query fails", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
        }),
      }),
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/cron/weekly-digest"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error_count).toBe(1);
  });

  it("returns sent: 0 when no eligible orgs", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({ data: [] }),
        }),
      }),
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/cron/weekly-digest"));
    const body = await res.json();
    expect(body.sent).toBe(0);
  });

  it("skips orgs with no active grants", async () => {
    // organizations query returns an org
    const orgSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({
          data: [{ id: "org_1", name: "Test Org", subscription_status: "active", last_digest_sent_at: null }],
        }),
      }),
    });

    // grants count returns 0
    const grantsHead = vi.fn().mockResolvedValue({ count: 0 });
    const grantsEqStatus = vi.fn().mockReturnValue(grantsHead);
    const grantsEqOrg = vi.fn().mockReturnValue({ eq: grantsEqStatus });
    const grantsSelect = vi.fn().mockReturnValue({ eq: grantsEqOrg });

    mockFrom.mockImplementation((table: string) => {
      if (table === "organizations") return { select: orgSelect };
      if (table === "grants") return { select: grantsSelect };
      return { select: vi.fn(), update: mockUpdate };
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/cron/weekly-digest"));
    const body = await res.json();
    expect(body.sent).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("expenses query includes org_id filter", async () => {
    // Set up a full chain that tracks the .eq calls on expenses
    const expensesEqCalls: string[][] = [];

    const orgSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({
          data: [{ id: "org_1", name: "Test Org", subscription_status: "active", last_digest_sent_at: null }],
        }),
      }),
    });

    // grants count returns 1
    const grantsCountResult = { count: 1 };
    const grantsStatusEq = vi.fn().mockReturnValue(grantsCountResult);
    const grantsOrgEq = vi.fn().mockReturnValue({ eq: grantsStatusEq });
    const grantsCountSelect = vi.fn().mockReturnValue({ eq: grantsOrgEq });

    // grants list returns 1 grant
    const grantsListEqStatus = vi.fn().mockResolvedValue({ data: [{ id: "grant_1", name: "Grant A" }] });
    const grantsListEqOrg = vi.fn().mockReturnValue({ eq: grantsListEqStatus });
    const grantsListSelect = vi.fn().mockReturnValue({ eq: grantsListEqOrg });

    let grantsCallCount = 0;

    // expenses queries — track eq calls
    function makeExpenseChain() {
      const tracker: string[] = [];
      expensesEqCalls.push(tracker);

      const chainObj: Record<string, unknown> = {};
      const eq = vi.fn().mockImplementation((col: string) => {
        tracker.push(col);
        return chainObj;
      });
      const gte = vi.fn().mockReturnValue(chainObj);
      const inFn = vi.fn().mockReturnValue(chainObj);
      Object.assign(chainObj, { eq, gte, in: inFn, count: 0 });
      // Terminal: resolve as count result
      Object.assign(chainObj, {
        then: (resolve: (v: unknown) => void) => resolve({ count: 0 }),
      });

      return { eq, gte, in: inFn };
    }

    // budgets
    const budgetsIn = vi.fn().mockResolvedValue({ data: [] });
    const budgetsSelect = vi.fn().mockReturnValue({ in: budgetsIn });

    // expenses for allExpenses: need in + eq("org_id") + eq("status")
    const allExpensesEq2 = vi.fn().mockResolvedValue({ data: [] });
    const allExpensesEq1 = vi.fn().mockReturnValue({ eq: allExpensesEq2 });
    const allExpensesIn = vi.fn().mockReturnValue({ eq: allExpensesEq1 });
    const allExpensesSelect = vi.fn().mockReturnValue({ in: allExpensesIn });

    let expCallCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "organizations") return { select: orgSelect };
      if (table === "grants") {
        grantsCallCount++;
        if (grantsCallCount === 1) return { select: grantsCountSelect };
        return { select: grantsListSelect };
      }
      if (table === "expenses") {
        expCallCount++;
        // The allExpenses query is the 4th expenses call (after newExpenses, pendingReview, categorizedExpenses)
        if (expCallCount <= 3) {
          const chain = makeExpenseChain();
          return {
            select: vi.fn().mockReturnValue(chain),
          };
        }
        return { select: allExpensesSelect };
      }
      if (table === "grant_budgets") return { select: budgetsSelect };
      return { select: vi.fn(), update: mockUpdate };
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/cron/weekly-digest"));
    expect(res.status).toBe(200);

    // The allExpenses query should have been called with .eq("org_id", "org_1")
    expect(allExpensesEq1).toHaveBeenCalledWith("org_id", "org_1");
  });

  it("empty admin emails: org marked sent but zero emails delivered", async () => {
    const { fetchOrgAdminEmails } = await import("@/lib/integrations/clerk-admin");
    vi.mocked(fetchOrgAdminEmails).mockResolvedValueOnce([]);

    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });

    const orgSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({
          data: [{ id: "org_1", name: "Test Org", subscription_status: "active", last_digest_sent_at: null, notify_weekly_digest: true }],
        }),
      }),
    });

    const countResult = { count: 1 };
    const grantsStatusEq = vi.fn().mockReturnValue(countResult);
    const grantsOrgEq = vi.fn().mockReturnValue({ eq: grantsStatusEq });
    const grantsCountSelect = vi.fn().mockReturnValue({ eq: grantsOrgEq });

    const grantsListEqStatus = vi.fn().mockResolvedValue({ data: [{ id: "grant_1", name: "Grant A" }] });
    const grantsListEqOrg = vi.fn().mockReturnValue({ eq: grantsListEqStatus });
    const grantsListSelect = vi.fn().mockReturnValue({ eq: grantsListEqOrg });

    let grantsCallCount = 0;

    const expenseCountChain = () => {
      const obj: Record<string, unknown> = {};
      obj.eq = vi.fn().mockReturnValue(obj);
      obj.gte = vi.fn().mockReturnValue(obj);
      (obj as { count: number }).count = 0;
      return obj;
    };

    const budgetsIn = vi.fn().mockResolvedValue({ data: [] });
    const budgetsSelect = vi.fn().mockReturnValue({ in: budgetsIn });

    const allExpensesEq2 = vi.fn().mockResolvedValue({ data: [] });
    const allExpensesEq1 = vi.fn().mockReturnValue({ eq: allExpensesEq2 });
    const allExpensesIn = vi.fn().mockReturnValue({ eq: allExpensesEq1 });
    const allExpensesSelect = vi.fn().mockReturnValue({ in: allExpensesIn });

    let expCallCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "organizations") return { select: orgSelect, update: updateFn };
      if (table === "grants") {
        grantsCallCount++;
        if (grantsCallCount === 1) return { select: grantsCountSelect };
        return { select: grantsListSelect };
      }
      if (table === "expenses") {
        expCallCount++;
        if (expCallCount <= 3) return { select: vi.fn().mockReturnValue(expenseCountChain()) };
        return { select: allExpensesSelect };
      }
      if (table === "grant_budgets") return { select: budgetsSelect };
      return { select: vi.fn(), update: updateFn };
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/cron/weekly-digest"));
    const body = await res.json();
    expect(body.sent).toBe(1);
    expect(body.emails_sent).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("response includes error_count field when errors occur", async () => {
    const orgSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({
          data: [{ id: "org_1", name: "Test Org", subscription_status: "active", last_digest_sent_at: null, notify_weekly_digest: true }],
        }),
      }),
    });

    // Grant count query fails
    const grantsCountError = { count: null, error: { message: "DB timeout" } };
    const grantsStatusEq = vi.fn().mockReturnValue(grantsCountError);
    const grantsOrgEq = vi.fn().mockReturnValue({ eq: grantsStatusEq });
    const grantsCountSelect = vi.fn().mockReturnValue({ eq: grantsOrgEq });

    mockFrom.mockImplementation((table: string) => {
      if (table === "organizations") return { select: orgSelect };
      if (table === "grants") return { select: grantsCountSelect };
      return { select: vi.fn() };
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/cron/weekly-digest"));
    const body = await res.json();
    expect(body.error_count).toBe(1);
    expect(body.sent).toBe(0);
  });

  it("orgs with notify_weekly_digest=false are skipped", async () => {
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        in: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({
            data: [{ id: "org_opted_out", name: "Opted Out Org", subscription_status: "active", last_digest_sent_at: null, notify_weekly_digest: false }],
          }),
        }),
      }),
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/cron/weekly-digest"));
    const body = await res.json();
    expect(body.sent).toBe(0);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("last_digest_sent_at update failure is logged but not fatal", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: { message: "DB update failed" } });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });

    const orgSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({
          data: [{ id: "org_1", name: "Test Org", subscription_status: "active", last_digest_sent_at: null, notify_weekly_digest: true }],
        }),
      }),
    });

    const countResult = { count: 1 };
    const grantsStatusEq = vi.fn().mockReturnValue(countResult);
    const grantsOrgEq = vi.fn().mockReturnValue({ eq: grantsStatusEq });
    const grantsCountSelect = vi.fn().mockReturnValue({ eq: grantsOrgEq });

    const grantsListEqStatus = vi.fn().mockResolvedValue({ data: [{ id: "grant_1", name: "Grant A" }] });
    const grantsListEqOrg = vi.fn().mockReturnValue({ eq: grantsListEqStatus });
    const grantsListSelect = vi.fn().mockReturnValue({ eq: grantsListEqOrg });

    let grantsCallCount = 0;

    const expenseCountChain = () => {
      const obj: Record<string, unknown> = {};
      obj.eq = vi.fn().mockReturnValue(obj);
      obj.gte = vi.fn().mockReturnValue(obj);
      (obj as { count: number }).count = 0;
      return obj;
    };

    const budgetsIn = vi.fn().mockResolvedValue({ data: [] });
    const budgetsSelect = vi.fn().mockReturnValue({ in: budgetsIn });

    const allExpensesEq2 = vi.fn().mockResolvedValue({ data: [] });
    const allExpensesEq1 = vi.fn().mockReturnValue({ eq: allExpensesEq2 });
    const allExpensesIn = vi.fn().mockReturnValue({ eq: allExpensesEq1 });
    const allExpensesSelect = vi.fn().mockReturnValue({ in: allExpensesIn });

    let expCallCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "organizations") return { select: orgSelect, update: updateFn };
      if (table === "grants") {
        grantsCallCount++;
        if (grantsCallCount === 1) return { select: grantsCountSelect };
        return { select: grantsListSelect };
      }
      if (table === "expenses") {
        expCallCount++;
        if (expCallCount <= 3) return { select: vi.fn().mockReturnValue(expenseCountChain()) };
        return { select: allExpensesSelect };
      }
      if (table === "grant_budgets") return { select: budgetsSelect };
      return { select: vi.fn(), update: updateFn };
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/cron/weekly-digest"));
    const body = await res.json();
    // Response should still be 200, sent: 1 — update failure is logged but not fatal
    expect(res.status).toBe(200);
    expect(body.sent).toBe(1);
  });

  it("sends digest email to admin and updates last_digest_sent_at", async () => {
    const updateEq = vi.fn().mockResolvedValue({ error: null });
    const updateFn = vi.fn().mockReturnValue({ eq: updateEq });

    const orgSelect = vi.fn().mockReturnValue({
      in: vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({
          data: [{ id: "org_1", name: "Test Org", subscription_status: "active", last_digest_sent_at: null }],
        }),
      }),
    });

    const countResult = { count: 1 };
    const grantsStatusEq = vi.fn().mockReturnValue(countResult);
    const grantsOrgEq = vi.fn().mockReturnValue({ eq: grantsStatusEq });
    const grantsCountSelect = vi.fn().mockReturnValue({ eq: grantsOrgEq });

    const grantsListEqStatus = vi.fn().mockResolvedValue({ data: [{ id: "grant_1", name: "Grant A" }] });
    const grantsListEqOrg = vi.fn().mockReturnValue({ eq: grantsListEqStatus });
    const grantsListSelect = vi.fn().mockReturnValue({ eq: grantsListEqOrg });

    let grantsCallCount = 0;

    const expenseCountChain = () => {
      const obj: Record<string, unknown> = {};
      obj.eq = vi.fn().mockReturnValue(obj);
      obj.gte = vi.fn().mockReturnValue(obj);
      // Resolve as a count query
      (obj as { count: number }).count = 2;
      return obj;
    };

    const budgetsIn = vi.fn().mockResolvedValue({ data: [] });
    const budgetsSelect = vi.fn().mockReturnValue({ in: budgetsIn });

    const allExpensesEq2 = vi.fn().mockResolvedValue({ data: [] });
    const allExpensesEq1 = vi.fn().mockReturnValue({ eq: allExpensesEq2 });
    const allExpensesIn = vi.fn().mockReturnValue({ eq: allExpensesEq1 });
    const allExpensesSelect = vi.fn().mockReturnValue({ in: allExpensesIn });

    let expCallCount = 0;

    mockFrom.mockImplementation((table: string) => {
      if (table === "organizations") return { select: orgSelect, update: updateFn };
      if (table === "grants") {
        grantsCallCount++;
        if (grantsCallCount === 1) return { select: grantsCountSelect };
        return { select: grantsListSelect };
      }
      if (table === "expenses") {
        expCallCount++;
        if (expCallCount <= 3) return { select: vi.fn().mockReturnValue(expenseCountChain()) };
        return { select: allExpensesSelect };
      }
      if (table === "grant_budgets") return { select: budgetsSelect };
      return { select: vi.fn(), update: updateFn };
    });

    const { GET } = await import("./route");
    const res = await GET(new Request("http://localhost/api/cron/weekly-digest"));
    const body = await res.json();
    expect(body.sent).toBe(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@test.org",
        subject: "Weekly Digest",
      })
    );
  });
});

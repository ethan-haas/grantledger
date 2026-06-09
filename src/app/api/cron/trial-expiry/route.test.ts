import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://app.test.com" }),
}));

vi.mock("@/lib/auth/cron-guard", () => ({
  verifyCronSecret: vi.fn(() => null),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn(() => Promise.resolve({ id: "email_1" })),
}));

vi.mock("@/lib/email/templates/trial-expired", () => ({
  trialExpiredEmail: vi.fn(() => ({ subject: "Trial expired", html: "<p>Expired</p>" })),
}));

vi.mock("@/lib/integrations/clerk-admin", () => ({
  fetchOrgAdminEmails: vi.fn(() => Promise.resolve(["admin@org.com"])),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { verifyCronSecret } from "@/lib/auth/cron-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { trialExpiredEmail } from "@/lib/email/templates/trial-expired";
import { fetchOrgAdminEmails } from "@/lib/integrations/clerk-admin";

function makeRequest(): Request {
  return new Request("https://example.com/api/cron/trial-expiry", {
    headers: { authorization: "Bearer test-cron-secret" },
  });
}

describe("GET /api/cron/trial-expiry", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 without valid cron secret", async () => {
    const { NextResponse } = await import("next/server");
    vi.mocked(verifyCronSecret).mockReturnValueOnce(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    );

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("skips email for orgs already emailed (idempotency)", async () => {
    const updateFn = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: "org_1",
                    name: "Already Expired Org",
                    trial_expired_email_sent_at: "2024-01-01T00:00:00Z", // already sent
                  },
                ],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();

    // Org should be expired (status updated) but email skipped
    expect(body.expired).toBe(1);
    expect(body.emails_sent).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 500 when org query fails", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({ data: null, error: { message: "DB error" } })
            ),
          })),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error_count).toBe(1);
  });

  it("sends expiry email to admin for newly expired org", async () => {
    const updateFn = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [
                  {
                    id: "org_2",
                    name: "New Expiry Org",
                    trial_expired_email_sent_at: null,
                  },
                ],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.expired).toBe(1);
    expect(body.emails_sent).toBe(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "admin@org.com" })
    );
  });

  it("returns 200 with zero expired when no orgs match", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.expired).toBe(0);
    expect(body.emails_sent).toBe(0);
  });

  it("processes multiple orgs and reports count", async () => {
    const updateFn = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [
                  { id: "org_a", name: "Org A", trial_expired_email_sent_at: null },
                  { id: "org_b", name: "Org B", trial_expired_email_sent_at: null },
                ],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.expired).toBe(2);
    expect(body.emails_sent).toBe(2);
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  it("continues processing when one org update fails", async () => {
    let updateCallCount = 0;
    const updateFn = vi.fn(() => {
      updateCallCount++;
      return {
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve(
              updateCallCount === 1
                ? { error: { message: "constraint violation" } }
                : { error: null }
            )
          ),
        })),
      };
    });

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [
                  { id: "org_fail", name: "Fail Org", trial_expired_email_sent_at: null },
                  { id: "org_ok", name: "OK Org", trial_expired_email_sent_at: null },
                ],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.expired).toBe(1);
    expect(body.error_count).toBe(1);
  });

  it("updates subscription_status to past_due", async () => {
    const updateFn = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "org_x", name: "Org X", trial_expired_email_sent_at: null }],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    const { GET } = await import("./route");
    await GET(makeRequest());
    expect(updateFn).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_status: "past_due" })
    );
  });

  it("calls trialExpiredEmail with org name and app URL", async () => {
    const updateFn = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "org_t", name: "Template Org", trial_expired_email_sent_at: null }],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    const { GET } = await import("./route");
    await GET(makeRequest());
    expect(vi.mocked(trialExpiredEmail)).toHaveBeenCalledWith(
      "Template Org",
      "https://app.test.com"
    );
  });

  it("status update failure records error, no email sent (update before email)", async () => {
    const updateFn = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: { message: "constraint violation" } })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "org_fail_update", name: "Fail Update Org", trial_expired_email_sent_at: null }],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();

    // Update fails → continue → email NOT sent
    expect(body.expired).toBe(0);
    expect(body.error_count).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("empty admin emails array: org expired but zero emails sent", async () => {
    const updateFn = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "org_no_admins", name: "No Admins Org", trial_expired_email_sent_at: null }],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    vi.mocked(fetchOrgAdminEmails).mockResolvedValueOnce([]);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();

    expect(body.expired).toBe(1);
    expect(body.emails_sent).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("fetchOrgAdminEmails throws: error logged, processing continues", async () => {
    const updateFn = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [
                  { id: "org_throw", name: "Throw Org", trial_expired_email_sent_at: null },
                  { id: "org_ok", name: "OK Org", trial_expired_email_sent_at: null },
                ],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    vi.mocked(fetchOrgAdminEmails)
      .mockRejectedValueOnce(new Error("Clerk API timeout"))
      .mockResolvedValueOnce(["admin@ok.org"]);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();

    // First org: status update succeeds (expired++) then email fetch throws (caught)
    // Second org: processes fine
    expect(body.error_count).toBe(1);
    expect(body.expired).toBe(2); // both orgs had their status updated before the throw
    expect(body.emails_sent).toBe(1); // only second org's email sent
  });

  it("update includes .eq('subscription_status', 'trialing') concurrency guard", async () => {
    const innerEqCalls: [string, string][] = [];
    const updateFn = vi.fn(() => ({
      eq: vi.fn((_col: string, _val: string) => ({
        eq: vi.fn((col: string, val: string) => {
          innerEqCalls.push([col, val]);
          return Promise.resolve({ error: null });
        }),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "org_guard", name: "Guard Org", trial_expired_email_sent_at: null }],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    const { GET } = await import("./route");
    await GET(makeRequest());

    // Should have .eq("subscription_status", "trialing") as concurrency guard
    const statusGuard = innerEqCalls.find(
      ([col, val]) => col === "subscription_status" && val === "trialing"
    );
    expect(statusGuard).toBeDefined();
  });

  it("fetches admin emails for each expired org", async () => {
    const updateFn = vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    }));

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            lt: vi.fn(() =>
              Promise.resolve({
                data: [{ id: "org_admin", name: "Admin Org", trial_expired_email_sent_at: null }],
              })
            ),
          })),
        })),
        update: updateFn,
      })),
    } as never);

    const { GET } = await import("./route");
    await GET(makeRequest());
    expect(vi.mocked(fetchOrgAdminEmails)).toHaveBeenCalledWith("org_admin");
  });
});

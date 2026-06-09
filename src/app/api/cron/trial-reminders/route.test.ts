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

vi.mock("@/lib/email/templates/trial-ending", () => ({
  trialEndingEmail: vi.fn(() => ({ subject: "Trial ending", html: "<p>Trial ending</p>" })),
}));

vi.mock("@/lib/integrations/clerk-admin", () => ({
  fetchOrgAdminEmails: vi.fn(() => Promise.resolve(["admin@test.com"])),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { verifyCronSecret } from "@/lib/auth/cron-guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { trialEndingEmail } from "@/lib/email/templates/trial-ending";
import { fetchOrgAdminEmails } from "@/lib/integrations/clerk-admin";

function makeRequest(): Request {
  return new Request("https://example.com/api/cron/trial-reminders", {
    headers: { authorization: "Bearer test-cron-secret" },
  });
}

describe("GET /api/cron/trial-reminders", () => {
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

  it("skips orgs that already received a reminder (idempotency)", async () => {
    // Return no orgs because query filters `trial_reminder_sent_at IS NULL`
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => Promise.resolve({ data: [] })),
              })),
            })),
          })),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.sent).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("returns 500 when org query fails", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => Promise.resolve({ data: null, error: { message: "DB error" } })),
              })),
            })),
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

  it("daysRemaining calculated correctly and passed to email template", async () => {
    const trialEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      { id: "org_days", name: "Days Org", trial_ends_at: trialEnd, trial_reminder_sent_at: null, notify_trial_reminders: true },
                    ],
                  })
                ),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    await GET(makeRequest());

    // trialEndingEmail should be called with (orgName, daysRemaining, appUrl)
    expect(vi.mocked(trialEndingEmail)).toHaveBeenCalledWith(
      "Days Org",
      expect.any(Number),
      "https://app.test.com"
    );
    // daysRemaining should be approximately 2
    const daysArg = vi.mocked(trialEndingEmail).mock.calls[0][1] as number;
    expect(daysArg).toBeGreaterThanOrEqual(1);
    expect(daysArg).toBeLessThanOrEqual(3);
  });

  it("orgs with notify_trial_reminders=false are skipped", async () => {
    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      { id: "org_optout", name: "Opted Out", trial_ends_at: new Date(Date.now() + 2 * 86400000).toISOString(), trial_reminder_sent_at: null, notify_trial_reminders: false },
                    ],
                  })
                ),
              })),
            })),
          })),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();
    // Org is filtered out by notify_trial_reminders=false
    expect(body.sent).toBe(0);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("trial_reminder_sent_at update failure is logged but response still 200", async () => {
    const trialEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      { id: "org_upd_fail", name: "Update Fail Org", trial_ends_at: trialEnd, trial_reminder_sent_at: null, notify_trial_reminders: true },
                    ],
                  })
                ),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: { message: "DB update failed" } })),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();
    // Update failure is logged but not fatal
    expect(res.status).toBe(200);
    expect(body.sent).toBe(1);
    expect(sendEmail).toHaveBeenCalled();
  });

  it("fetchOrgAdminEmails throws: error caught, org counted in errors", async () => {
    const trialEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      { id: "org_throw", name: "Throw Org", trial_ends_at: trialEnd, trial_reminder_sent_at: null, notify_trial_reminders: true },
                    ],
                  })
                ),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    } as never);

    vi.mocked(fetchOrgAdminEmails).mockRejectedValueOnce(new Error("Clerk API down"));

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.error_count).toBe(1);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends email to admin for eligible org", async () => {
    const trialEnd = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    vi.mocked(createAdminClient).mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() =>
                  Promise.resolve({
                    data: [
                      { id: "org_1", name: "Test Org", trial_ends_at: trialEnd, trial_reminder_sent_at: null },
                    ],
                  })
                ),
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      })),
    } as never);

    const { GET } = await import("./route");
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body.sent).toBe(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "admin@test.com" })
    );
  });
});

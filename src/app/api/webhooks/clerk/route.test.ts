import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({
    CLERK_WEBHOOK_SECRET: "whsec_test",
    CLERK_SECRET_KEY: "sk_test",
    NEXT_PUBLIC_APP_URL: "https://app.test.com",
  }),
}));

const mockVerify = vi.fn();
vi.mock("svix", () => {
  return {
    Webhook: class MockWebhook {
      verify(...args: unknown[]) {
        return mockVerify(...args);
      }
    },
  };
});

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: vi.fn().mockReturnValue({
      insert: mockInsert,
      update: mockUpdate,
    }),
  }),
}));

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "email_1" }),
}));

vi.mock("@/lib/email/templates/welcome", () => ({
  welcomeEmail: vi.fn().mockReturnValue({
    subject: "Welcome",
    html: "<p>Welcome</p>",
  }),
}));

vi.mock("@/lib/integrations/fetch-timeout", () => ({
  fetchWithTimeout: vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({
      email_addresses: [{ email_address: "creator@test.com" }],
    }),
  }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

vi.mock("@/lib/posthog-server", () => ({
  trackServerEvent: vi.fn(),
}));

import { POST } from "./route";
import { headers } from "next/headers";
import { sendEmail } from "@/lib/email/send";
import { fetchWithTimeout } from "@/lib/integrations/fetch-timeout";

const mockHeaders = vi.mocked(headers);

describe("POST /api/webhooks/clerk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when svix headers missing", async () => {
    mockHeaders.mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>);

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing svix headers");
  });

  it("returns 400 when signature verification fails", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,bad",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid signature");
  });

  it("inserts org on organization.created", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_new", name: "Test Org", created_by: "user_1" },
    });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "org_new",
        name: "Test Org",
        subscription_status: "trialing",
      })
    );
  });

  it("returns 200 for unhandled event types", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "user.created",
      data: { id: "user_1", name: "Test User" },
    });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });

  it("returns 500 when organization.created DB insert fails", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_fail", name: "Fail Org" },
    });
    mockInsert.mockResolvedValueOnce({ error: { message: "unique constraint violation" } });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Database error");
  });

  it("sets 14-day trial period on organization.created", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_trial", name: "Trial Org" },
    });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    await POST(req);

    const insertArg = mockInsert.mock.calls[0][0] as { trial_ends_at: string };
    const trialEnd = new Date(insertArg.trial_ends_at);
    const now = new Date();
    const diffDays = (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThan(13.9);
    expect(diffDays).toBeLessThan(14.1);
  });

  it("sends welcome email on organization.created", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_email", name: "Email Org", created_by: "user_1" },
    });

    // Override fetchWithTimeout to include headers (needed for content-type check)
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({
        email_addresses: [{ email_address: "creator@test.com" }],
      }),
    } as unknown as Response);

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    await POST(req);

    expect(vi.mocked(sendEmail)).toHaveBeenCalledWith(
      expect.objectContaining({ to: "creator@test.com" })
    );
  });

  it("uses fallback name when organization.created name is empty", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_noname", name: "" },
    });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    await POST(req);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Unnamed Organization" })
    );
  });

  it("duplicate org.created (retry) returns 500 on unique constraint violation", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_dupe", name: "Dupe Org" },
    });
    mockInsert.mockResolvedValueOnce({ error: { message: "duplicate key value violates unique constraint" } });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    // Documents that Clerk retries are NOT idempotent — insert fails on dupe
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Database error");
  });

  it("organization.updated with empty name uses fallback 'Unnamed Organization'", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.updated",
      data: { id: "org_empty_name", name: "" },
    });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ name: "Unnamed Organization" });
  });

  it("welcome email failure does not affect webhook 200 response", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_email_fail", name: "Email Fail Org", created_by: "user_1" },
    });

    // Make sendEmail throw
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("SMTP timeout"));

    // fetchWithTimeout succeeds
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({
        email_addresses: [{ email_address: "fail@test.com" }],
      }),
    } as unknown as Response);

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    // Webhook should still return 200 — email is fire-and-forget
    expect(res.status).toBe(200);
  });

  it("updates org name on organization.updated", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.updated",
      data: { id: "org_existing", name: "Updated Name" },
    });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith({ name: "Updated Name" });
  });

  it("returns 500 when organization.updated DB update fails", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.updated",
      data: { id: "org_update_fail", name: "Fail Update" },
    });
    mockUpdate.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValue({ error: { message: "DB update error" } }),
    });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Database error");
  });

  it("skips welcome email when created_by is absent", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_no_creator", name: "No Creator Org" },
    });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    await POST(req);

    expect(vi.mocked(fetchWithTimeout)).not.toHaveBeenCalled();
    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
  });

  // --- Phase 5: Clerk webhook edge cases ---

  it("empty email_addresses skips welcome email", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_no_email", name: "No Email Org", created_by: "user_1" },
    });

    // User API returns empty email_addresses array
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({
        email_addresses: [],
      }),
    } as unknown as Response);

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // fetchWithTimeout was called (to look up user), but sendEmail was NOT
    expect(vi.mocked(fetchWithTimeout)).toHaveBeenCalled();
    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
  });

  it("Clerk API non-ok response skips email gracefully", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_api_fail", name: "API Fail Org", created_by: "user_1" },
    });

    // Clerk user API returns 403
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: new Headers({ "content-type": "application/json" }),
    } as unknown as Response);

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    const res = await POST(req);
    // Should still return 200 — email is best-effort
    expect(res.status).toBe(200);
    expect(vi.mocked(sendEmail)).not.toHaveBeenCalled();
  });

  it("PostHog signup_completed event fires on org creation", async () => {
    const { trackServerEvent } = await import("@/lib/posthog-server");

    mockHeaders.mockResolvedValue(
      new Headers({
        "svix-id": "msg_123",
        "svix-timestamp": "12345",
        "svix-signature": "v1,good",
      }) as Awaited<ReturnType<typeof headers>>
    );
    mockVerify.mockReturnValue({
      type: "organization.created",
      data: { id: "org_posthog", name: "PostHog Org", created_by: "user_ph" },
    });

    const req = new Request("http://localhost/api/webhooks/clerk", {
      method: "POST",
      body: "{}",
    });

    await POST(req);

    expect(vi.mocked(trackServerEvent)).toHaveBeenCalledWith(
      "user_ph",
      "signup_completed",
      expect.objectContaining({
        org_id: "org_posthog",
        org_name: "PostHog Org",
      })
    );
  });
});

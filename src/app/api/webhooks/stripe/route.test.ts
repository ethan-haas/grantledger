import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConstructEvent = vi.fn();
const mockRetrieveSubscription = vi.fn();
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

vi.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: (...args: unknown[]) => mockConstructEvent(...args) },
    subscriptions: { retrieve: (...args: unknown[]) => mockRetrieveSubscription(...args) },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: mockFrom }),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ STRIPE_WEBHOOK_SECRET: "whsec_test", NEXT_PUBLIC_APP_URL: "https://app.test.com" }),
}));

const mockSendEmail = vi.fn().mockResolvedValue({ id: "email_1" });
vi.mock("@/lib/email/send", () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock("@/lib/email/templates/subscription-confirmed", () => ({
  subscriptionConfirmedEmail: vi.fn().mockReturnValue({
    subject: "Subscription active",
    html: "<p>Active</p>",
  }),
}));

const mockFetchOrgAdminEmails = vi.fn().mockResolvedValue(["admin@test.com"]);
vi.mock("@/lib/integrations/clerk-admin", () => ({
  fetchOrgAdminEmails: (...args: unknown[]) => mockFetchOrgAdminEmails(...args),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { POST } from "./route";
import { logger } from "@/lib/logger";
import { headers } from "next/headers";

const mockHeaders = vi.mocked(headers);

function makeRequest(body = "raw-body"): Request {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
  });
}

describe("Stripe webhook POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdate.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
  });

  it("returns 400 when stripe-signature header is missing", async () => {
    mockHeaders.mockResolvedValue(new Headers() as Awaited<ReturnType<typeof headers>>);
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Missing signature");
  });

  it("returns 400 when constructEvent throws", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid signature");
  });

  it("invoice.paid with active subscription calls updateOrg", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_1",
          customer: "cus_123",
          subscription: "sub_1",
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_1",
      status: "active",
      items: { data: [{ price: { id: "price_1" } }] },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockFrom).toHaveBeenCalledWith("organizations");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_status: "active" })
    );
  });

  it("invoice.paid with null customer logs warning and skips update", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: { id: "inv_2", customer: null, subscription: "sub_1" },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(logger.warn).toHaveBeenCalledWith(
      "invoice.paid missing customer ID",
      expect.objectContaining({ invoiceId: "inv_2" })
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("invoice.payment_failed updates status to past_due", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: {
        object: { id: "inv_3", customer: "cus_456" },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ subscription_status: "past_due" })
    );
  });

  it("invoice.paid sends subscription confirmation email", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_email",
          customer: "cus_email",
          subscription: "sub_email",
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_email",
      status: "active",
      items: { data: [{ price: { id: "price_1", nickname: "Pro Monthly" } }] },
    });

    // Mock the org lookup for the email
    const selectSingle = vi.fn().mockResolvedValue({
      data: { id: "org_email", name: "Email Test Org" },
    });
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle });
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq });
    mockFrom.mockReturnValue({
      update: mockUpdate,
      select: selectFn,
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockFetchOrgAdminEmails).toHaveBeenCalledWith("org_email");
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "admin@test.com",
        subject: "Subscription active",
      })
    );
  });

  it("invoice.paid handles subscriptions.retrieve failure gracefully", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_retrieve_fail",
          customer: "cus_retrieve_fail",
          subscription: "sub_retrieve_fail",
        },
      },
    });
    mockRetrieveSubscription.mockRejectedValue(new Error("Stripe API timeout"));

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to retrieve subscription in invoice.paid",
      expect.any(Error)
    );
    // Should NOT have tried to update org since subscription retrieval failed
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("invoice.paid continues gracefully when org update fails", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_fail",
          customer: "cus_fail",
          subscription: "sub_fail",
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_fail",
      status: "active",
      items: { data: [{ price: { id: "price_1" } }] },
    });
    // Make the update fail
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: "DB down" } }),
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      "Org update failed in invoice.paid",
      expect.objectContaining({ customerId: "cus_fail" })
    );
  });

  it("customer.subscription.deleted continues gracefully when org update fails", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_fail2",
          customer: "cus_fail2",
          items: { data: [] },
        },
      },
    });
    // Make the update fail
    mockUpdate.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: { message: "DB down" } }),
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      "Org update failed in customer.subscription.deleted",
      expect.objectContaining({ customerId: "cus_fail2" })
    );
  });

  it("customer.subscription.deleted updates status to canceled", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_2",
          customer: "cus_789",
          items: { data: [] },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_status: "canceled",
        stripe_subscription_id: null,
        subscription_plan: null,
      })
    );
  });

  it("invoice.paid without subscription field skips gracefully", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_no_sub",
          customer: "cus_nosub",
          subscription: null,
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    // Should not attempt subscription retrieval or org update
    expect(mockRetrieveSubscription).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("customer.subscription.updated updates org status and plan", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_updated_1",
          customer: "cus_updated",
          status: "active",
          items: { data: [{ price: { id: "price_pro_annual" } }] },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_subscription_id: "sub_updated_1",
        subscription_plan: "price_pro_annual",
        subscription_status: "active",
      })
    );
  });

  it("customer.subscription.updated with unknown price defaults plan to null", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_no_price",
          customer: "cus_no_price",
          status: "active",
          items: { data: [] },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_plan: null,
      })
    );
  });

  it("customer.subscription.updated with non-active status passes status through", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_past_due",
          customer: "cus_past_due",
          status: "past_due",
          items: { data: [{ price: { id: "price_1" } }] },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_status: "past_due",
      })
    );
  });

  it("customer.subscription.trial_will_end logs trial ending", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.trial_will_end",
      data: {
        object: {
          id: "sub_trial",
          customer: "cus_trial",
          metadata: { org_id: "org_trial_123" },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(logger.info).toHaveBeenCalledWith(
      "Trial ending soon for org",
      expect.objectContaining({ orgId: "org_trial_123" })
    );
  });

  it("unhandled event type returns 200 without crash", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "some.unknown.event",
      data: { object: {} },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      "Unhandled event type: some.unknown.event"
    );
  });

  it("customer.subscription.updated with unexpected status 'paused' stores as-is", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_paused",
          customer: "cus_paused",
          status: "paused",
          items: { data: [{ price: { id: "price_1" } }] },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    // "paused" is not "active", so the ternary passes it through as-is
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_status: "paused",
      })
    );
  });

  it("invoice.paid with customer as object (not string) logs warning and skips", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_obj_cust",
          // Stripe sometimes sends customer as an expanded object
          customer: { id: "cus_obj", name: "Test Corp" },
          subscription: "sub_1",
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    // typeof object !== "string", so customerId is null → logs warning, skips update
    expect(logger.warn).toHaveBeenCalledWith(
      "invoice.paid missing customer ID",
      expect.objectContaining({ invoiceId: "inv_obj_cust" })
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("invoice.payment_failed with customer as object skips update", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: {
        object: {
          id: "inv_pf_obj",
          customer: { id: "cus_pf_obj" },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(logger.warn).toHaveBeenCalledWith(
      "invoice.payment_failed missing customer ID",
      expect.objectContaining({ invoiceId: "inv_pf_obj" })
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("customer.subscription.deleted with null customer logs warning", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: {
        object: {
          id: "sub_null_del",
          customer: null,
          items: { data: [] },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(logger.warn).toHaveBeenCalledWith(
      "customer.subscription.deleted missing customer ID",
      expect.objectContaining({ subscriptionId: "sub_null_del" })
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("customer.subscription.updated with null customer logs warning and skips", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_null_cust",
          customer: null,
          status: "active",
          items: { data: [{ price: { id: "price_1" } }] },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(logger.warn).toHaveBeenCalledWith(
      "customer.subscription.updated missing customer ID",
      expect.objectContaining({ subscriptionId: "sub_null_cust" })
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  // --- Phase 2: invoice.paid non-active subscription guard ---

  it("invoice.paid with past_due subscription does NOT update org", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_pd",
          customer: "cus_pd",
          subscription: "sub_pd",
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_pd",
      status: "past_due",
      items: { data: [{ price: { id: "price_1" } }] },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("invoice.paid with canceled subscription does NOT update org", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_canceled",
          customer: "cus_canceled",
          subscription: "sub_canceled",
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_canceled",
      status: "canceled",
      items: { data: [{ price: { id: "price_1" } }] },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("invoice.paid with trialing subscription does NOT update org", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_trial",
          customer: "cus_trial_ip",
          subscription: "sub_trial_ip",
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_trial_ip",
      status: "trialing",
      items: { data: [{ price: { id: "price_1" } }] },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("invoice.paid non-active subscription still returns 200 with received: true", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_pd_200",
          customer: "cus_pd_200",
          subscription: "sub_pd_200",
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_pd_200",
      status: "past_due",
      items: { data: [{ price: { id: "price_1" } }] },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });

  it("invoice.paid active subscription but org lookup returns null skips email", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_no_org",
          customer: "cus_no_org",
          subscription: "sub_no_org",
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_no_org",
      status: "active",
      items: { data: [{ price: { id: "price_1" } }] },
    });

    // Org lookup returns null
    const selectSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle });
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq });
    mockFrom.mockReturnValue({
      update: mockUpdate,
      select: selectFn,
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it("invoice.paid email send failure still returns 200", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "invoice.paid",
      data: {
        object: {
          id: "inv_email_fail",
          customer: "cus_email_fail",
          subscription: "sub_email_fail",
        },
      },
    });
    mockRetrieveSubscription.mockResolvedValue({
      id: "sub_email_fail",
      status: "active",
      items: { data: [{ price: { id: "price_1", nickname: "Pro" } }] },
    });

    const selectSingle = vi.fn().mockResolvedValue({
      data: { id: "org_email_fail", name: "Fail Email Org" },
    });
    const selectEq = vi.fn().mockReturnValue({ single: selectSingle });
    const selectFn = vi.fn().mockReturnValue({ eq: selectEq });
    mockFrom.mockReturnValue({
      update: mockUpdate,
      select: selectFn,
    });

    mockSendEmail.mockRejectedValueOnce(new Error("SMTP down"));

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to send subscription confirmation email",
      expect.any(Error)
    );
  });

  it("customer.subscription.updated with numeric customer skips update", async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ "stripe-signature": "sig_test" }) as Awaited<ReturnType<typeof headers>>
    );
    mockConstructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: {
        object: {
          id: "sub_num_cust",
          customer: 123,
          status: "active",
          items: { data: [{ price: { id: "price_1" } }] },
        },
      },
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

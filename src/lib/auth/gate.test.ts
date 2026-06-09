import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./subscription", () => ({
  getSubscriptionStatus: vi.fn(),
  isTrialExpired: vi.fn(),
}));

import { checkAccess } from "./gate";
import { getSubscriptionStatus, isTrialExpired } from "./subscription";
import type { OrgSubscription } from "./subscription";

const mockGetStatus = vi.mocked(getSubscriptionStatus);
const mockIsExpired = vi.mocked(isTrialExpired);

function makeOrg(overrides: Partial<OrgSubscription> = {}): OrgSubscription {
  return {
    id: "org_1",
    name: "Test Org",
    subscription_status: "active",
    subscription_plan: "pro",
    trial_ends_at: null,
    stripe_customer_id: null,
    ...overrides,
  };
}

describe("checkAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns blocked when org is null", async () => {
    mockGetStatus.mockResolvedValue(null);
    const result = await checkAccess("org_1");
    expect(result.level).toBe("blocked");
    expect(result.reason).toBe("Organization not found");
    expect(result.org).toBeNull();
  });

  it("returns full_access for active subscription", async () => {
    mockGetStatus.mockResolvedValue(makeOrg({ subscription_status: "active" }));
    const result = await checkAccess("org_1");
    expect(result.level).toBe("full_access");
  });

  it("returns trial for valid trialing subscription", async () => {
    mockGetStatus.mockResolvedValue(makeOrg({ subscription_status: "trialing", trial_ends_at: "2099-01-01" }));
    mockIsExpired.mockReturnValue(false);
    const result = await checkAccess("org_1");
    expect(result.level).toBe("trial");
  });

  it("returns blocked for expired trial", async () => {
    mockGetStatus.mockResolvedValue(makeOrg({ subscription_status: "trialing", trial_ends_at: "2020-01-01" }));
    mockIsExpired.mockReturnValue(true);
    const result = await checkAccess("org_1");
    expect(result.level).toBe("blocked");
    expect(result.reason).toBe("Trial expired");
  });

  it("returns read_only for past_due subscription", async () => {
    mockGetStatus.mockResolvedValue(makeOrg({ subscription_status: "past_due" }));
    const result = await checkAccess("org_1");
    expect(result.level).toBe("read_only");
  });

  it("returns blocked for canceled subscription", async () => {
    mockGetStatus.mockResolvedValue(makeOrg({ subscription_status: "canceled" }));
    const result = await checkAccess("org_1");
    expect(result.level).toBe("blocked");
  });

  it("returns blocked for unpaid subscription", async () => {
    mockGetStatus.mockResolvedValue(makeOrg({ subscription_status: "unpaid" }));
    const result = await checkAccess("org_1");
    expect(result.level).toBe("blocked");
  });

  it('returns "Unknown status" for unrecognized subscription status', async () => {
    mockGetStatus.mockResolvedValue(makeOrg({ subscription_status: "weird_status" as never }));
    const result = await checkAccess("org_1");
    expect(result.level).toBe("blocked");
    expect(result.reason).toBe("Unknown status");
  });

  it("returns org object for past_due status", async () => {
    const org = makeOrg({ subscription_status: "past_due" });
    mockGetStatus.mockResolvedValue(org);
    const result = await checkAccess("org_1");
    expect(result.org).not.toBeNull();
    expect(result.org?.id).toBe("org_1");
  });

  it('returns "Payment past due" reason for past_due', async () => {
    mockGetStatus.mockResolvedValue(makeOrg({ subscription_status: "past_due" }));
    const result = await checkAccess("org_1");
    expect(result.reason).toBe("Payment past due");
  });

  it("null subscription_status falls through to default → blocked with 'Unknown status'", async () => {
    mockGetStatus.mockResolvedValue(makeOrg({ subscription_status: null as never }));
    const result = await checkAccess("org_1");
    expect(result.level).toBe("blocked");
    expect(result.reason).toBe("Unknown status");
  });

  it("trialing with null trial_ends_at → blocked (isTrialExpired returns true for null)", async () => {
    mockGetStatus.mockResolvedValue(
      makeOrg({ subscription_status: "trialing", trial_ends_at: null })
    );
    mockIsExpired.mockReturnValue(true);
    const result = await checkAccess("org_1");
    expect(result.level).toBe("blocked");
    expect(result.reason).toBe("Trial expired");
  });

  it("returns org object on all non-blocked levels (trial, read_only, full_access)", async () => {
    // trial
    const trialOrg = makeOrg({ subscription_status: "trialing", trial_ends_at: "2099-01-01" });
    mockGetStatus.mockResolvedValue(trialOrg);
    mockIsExpired.mockReturnValue(false);
    const trialResult = await checkAccess("org_1");
    expect(trialResult.org).not.toBeNull();
    expect(trialResult.org?.id).toBe("org_1");

    // read_only (past_due)
    const pastDueOrg = makeOrg({ subscription_status: "past_due" });
    mockGetStatus.mockResolvedValue(pastDueOrg);
    const readOnlyResult = await checkAccess("org_1");
    expect(readOnlyResult.org).not.toBeNull();

    // full_access (active)
    const activeOrg = makeOrg({ subscription_status: "active" });
    mockGetStatus.mockResolvedValue(activeOrg);
    const fullResult = await checkAccess("org_1");
    expect(fullResult.org).not.toBeNull();
  });
});

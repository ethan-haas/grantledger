import { getSubscriptionStatus, isTrialExpired, type OrgSubscription } from "./subscription";

export type AccessLevel = "full_access" | "read_only" | "blocked" | "trial";

export interface AccessResult {
  level: AccessLevel;
  org: OrgSubscription | null;
  reason?: string;
}

export async function checkAccess(orgId: string): Promise<AccessResult> {
  const org = await getSubscriptionStatus(orgId);

  if (!org) {
    return { level: "blocked", org: null, reason: "Organization not found" };
  }

  switch (org.subscription_status) {
    case "active":
      return { level: "full_access", org };

    case "trialing":
      if (isTrialExpired(org.trial_ends_at)) {
        return { level: "blocked", org, reason: "Trial expired" };
      }
      return { level: "trial", org };

    case "past_due":
      return { level: "read_only", org, reason: "Payment past due" };

    case "canceled":
    case "unpaid":
      return { level: "blocked", org, reason: "Subscription inactive" };

    default:
      return { level: "blocked", org, reason: "Unknown status" };
  }
}

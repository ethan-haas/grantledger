import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type { SubscriptionStatus } from "@/lib/supabase/database.types";

export interface OrgSubscription {
  id: string;
  name: string;
  subscription_status: SubscriptionStatus;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
}

export async function getSubscriptionStatus(orgId: string): Promise<OrgSubscription | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, subscription_status, subscription_plan, trial_ends_at, stripe_customer_id")
    .eq("id", orgId)
    .single();

  if (data) return data as OrgSubscription;

  // Auto-provision: if org not in DB (webhook missed/dev mode), create with 14-day trial
  if (error?.code === "PGRST116") {
    const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data: newOrg, error: insertError } = await supabase
      .from("organizations")
      .insert({
        id: orgId,
        name: "My Organization",
        subscription_status: "trialing",
        trial_ends_at: trialEndsAt,
      })
      .select("id, name, subscription_status, subscription_plan, trial_ends_at, stripe_customer_id")
      .single();

    if (insertError) {
      // Race condition: another request may have created the org first. Re-fetch.
      const { data: existingOrg } = await supabase
        .from("organizations")
        .select("id, name, subscription_status, subscription_plan, trial_ends_at, stripe_customer_id")
        .eq("id", orgId)
        .single();
      if (existingOrg) return existingOrg as OrgSubscription;
      logger.error("Failed to auto-provision organization", { orgId, error: insertError.message });
      return null;
    }
    logger.info("Auto-provisioned organization with trial", { orgId });
    return newOrg as OrgSubscription;
  }

  return null;
}

export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const now = new Date();
  const end = new Date(trialEndsAt);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isTrialExpired(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return true;
  return new Date(trialEndsAt) < new Date();
}

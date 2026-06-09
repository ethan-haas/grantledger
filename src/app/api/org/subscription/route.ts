import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { getSubscriptionStatus, getTrialDaysRemaining } from "@/lib/auth/subscription";

export async function GET() {
  const { orgId } = getAuthOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await getSubscriptionStatus(orgId);

  if (!subscription) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  const { stripe_customer_id: _omit, ...safe } = subscription;

  return NextResponse.json({
    ...safe,
    trial_days_remaining: getTrialDaysRemaining(subscription.trial_ends_at),
  });
}

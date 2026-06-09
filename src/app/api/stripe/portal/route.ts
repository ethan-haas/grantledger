import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";

export async function POST() {
  const { orgId } = getAuthOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (orgError) {
    logger.error("Failed to fetch org for billing portal", { orgId, error: orgError.message });
    return NextResponse.json({ error: "Failed to load billing information" }, { status: 500 });
  }

  if (!org?.stripe_customer_id) {
    return NextResponse.json({ error: "No billing account" }, { status: 400 });
  }

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${getServerEnv().NEXT_PUBLIC_APP_URL}/dashboard/settings/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    logger.error("Failed to create billing portal session", err instanceof Error ? err : undefined);
    return NextResponse.json({ error: "Failed to create billing portal session" }, { status: 500 });
  }
}

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";
import { createRateLimiter, rateLimitResponse } from "@/lib/api/rate-limit";
import { trackServerEvent } from "@/lib/posthog-server";

const checkoutSchema = z.object({
  priceId: z.string().startsWith("price_", "Invalid price ID format"),
});

const limiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

export async function POST(request: Request) {
  const { orgId } = getAuthOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = limiter.check(orgId);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { priceId } = parsed.data;

  const supabase = createAdminClient();
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
    .single();

  if (orgError) {
    logger.error("Failed to fetch org for checkout", { orgId, error: orgError.message });
    return NextResponse.json({ error: "Failed to initialize checkout" }, { status: 500 });
  }

  if (!org) {
    logger.error("Organization not found for checkout", { orgId });
    return NextResponse.json({ error: "Organization not found" }, { status: 404 });
  }

  if (org.subscription_status === "active") {
    return NextResponse.json(
      { error: "Organization already has an active subscription. Use the billing portal to manage it." },
      { status: 409 },
    );
  }

  try {
    let customerId = org.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { org_id: orgId },
      });
      customerId = customer.id;

      const { error: updateError } = await supabase
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", orgId);

      if (updateError) {
        logger.warn("Failed to link Stripe customer to org — proceeding with in-memory ID", { orgId, customerId, error: updateError.message });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${getServerEnv().NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?success=true`,
      cancel_url: `${getServerEnv().NEXT_PUBLIC_APP_URL}/dashboard/settings/billing?canceled=true`,
      metadata: { org_id: orgId },
      subscription_data: {
        metadata: { org_id: orgId },
      },
    });

    trackServerEvent(orgId, "checkout_started", { price_id: priceId });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    logger.error("Failed to create checkout session", err instanceof Error ? err : undefined);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}

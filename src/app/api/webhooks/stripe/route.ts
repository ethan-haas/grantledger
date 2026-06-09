import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";
import { sendEmail } from "@/lib/email/send";
import { subscriptionConfirmedEmail } from "@/lib/email/templates/subscription-confirmed";
import { fetchOrgAdminEmails } from "@/lib/integrations/clerk-admin";
import Stripe from "stripe";

async function updateOrgByCustomerId(
  customerId: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("stripe_customer_id", customerId);
  if (error) {
    logger.error("Failed to update org", { customerId, error: error.message });
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      getServerEnv().STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logger.error(`Stripe webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customerId) {
        logger.warn("invoice.paid missing customer ID", { invoiceId: invoice.id });
        break;
      }

      if (invoice.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          // Only activate if the subscription itself is active
          if (subscription.status === "active") {
            const updated = await updateOrgByCustomerId(customerId, {
              subscription_status: "active",
              stripe_subscription_id: subscription.id,
              subscription_plan: subscription.items.data[0]?.price?.id || null,
            });
            if (!updated) {
              logger.warn("Org update failed in invoice.paid", { customerId });
            }
            logger.info(`Organization activated via invoice.paid`, { customerId });

            // Send subscription confirmation email
            try {
              const supabase = createAdminClient();
              const { data: org } = await supabase
                .from("organizations")
                .select("id, name")
                .eq("stripe_customer_id", customerId)
                .single();

              if (org) {
                const planName = subscription.items.data[0]?.price?.nickname || "Professional";
                const { subject, html } = subscriptionConfirmedEmail(
                  org.name,
                  planName,
                  getServerEnv().NEXT_PUBLIC_APP_URL
                );
                const adminEmails = await fetchOrgAdminEmails(org.id);
                for (const email of adminEmails) {
                  await sendEmail({ to: email, subject, html });
                }
              }
            } catch (emailErr) {
              logger.error("Failed to send subscription confirmation email", emailErr instanceof Error ? emailErr : undefined);
            }
          }
        } catch (retrieveErr) {
          logger.error("Failed to retrieve subscription in invoice.paid", retrieveErr instanceof Error ? retrieveErr : undefined);
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : null;
      if (!customerId) {
        logger.warn("invoice.payment_failed missing customer ID", { invoiceId: invoice.id });
        break;
      }
      const updated = await updateOrgByCustomerId(customerId, {
        subscription_status: "past_due",
      });
      if (!updated) {
        logger.warn("Org update failed in invoice.payment_failed", { customerId });
      }
      logger.warn(`Payment failed for customer`, { customerId });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (!customerId) {
        logger.warn("customer.subscription.updated missing customer ID", { subscriptionId: subscription.id });
        break;
      }
      const updated = await updateOrgByCustomerId(customerId, {
        stripe_subscription_id: subscription.id,
        subscription_plan: subscription.items.data[0]?.price?.id || null,
        subscription_status: subscription.status === "active" ? "active" : subscription.status,
      });
      if (!updated) {
        logger.warn("Org update failed in customer.subscription.updated", { customerId });
      }
      logger.info(`Subscription updated`, { subscriptionId: subscription.id });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : null;
      if (!customerId) {
        logger.warn("customer.subscription.deleted missing customer ID", { subscriptionId: subscription.id });
        break;
      }
      const updated = await updateOrgByCustomerId(customerId, {
        subscription_status: "canceled",
        stripe_subscription_id: null,
        subscription_plan: null,
      });
      if (!updated) {
        logger.warn("Org update failed in customer.subscription.deleted", { customerId });
      }
      logger.info(`Subscription canceled`, { subscriptionId: subscription.id });
      break;
    }

    case "customer.subscription.trial_will_end": {
      const subscription = event.data.object as Stripe.Subscription;
      const orgId = subscription.metadata?.org_id;
      if (orgId) {
        logger.info(`Trial ending soon for org`, { orgId });
      }
      break;
    }

    default:
      logger.info(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

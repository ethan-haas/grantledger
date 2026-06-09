import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { welcomeEmail } from "@/lib/email/templates/welcome";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";
import { fetchWithTimeout } from "@/lib/integrations/fetch-timeout";
import { trackServerEvent } from "@/lib/posthog-server";

interface ClerkWebhookEvent {
  type: string;
  data: {
    id: string;
    name: string;
    created_by?: string;
    [key: string]: unknown;
  };
}

export async function POST(request: Request) {
  const headersList = await headers();
  const svix_id = headersList.get("svix-id");
  const svix_timestamp = headersList.get("svix-timestamp");
  const svix_signature = headersList.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: "Missing svix headers" }, { status: 400 });
  }

  const body = await request.text();

  const wh = new Webhook(getServerEnv().CLERK_WEBHOOK_SECRET);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as ClerkWebhookEvent;
  } catch {
    logger.error("Clerk webhook verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "organization.created": {
      const { id, name } = event.data;
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 14);

      const { error } = await supabase.from("organizations").insert({
        id,
        name: name || "Unnamed Organization",
        subscription_status: "trialing",
        trial_ends_at: trialEndsAt.toISOString(),
      });

      if (error) {
        logger.error("Failed to create organization", { orgId: id, error: error.message });
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      // Send welcome email to the creating user
      if (event.data.created_by) {
        try {
          const clerkRes = await fetchWithTimeout(
            `https://api.clerk.com/v1/users/${event.data.created_by}`,
            {
              headers: {
                Authorization: `Bearer ${getServerEnv().CLERK_SECRET_KEY}`,
              },
            }
          );
          const ct = clerkRes.headers.get("content-type");
          if (clerkRes.ok && ct?.includes("application/json")) {
            const user = await clerkRes.json();
            const email = user.email_addresses?.[0]?.email_address;
            if (email) {
              const { subject, html } = welcomeEmail(name || "your organization", getServerEnv().NEXT_PUBLIC_APP_URL);
              await sendEmail({ to: email, subject, html });
            }
          }
        } catch (emailErr) {
          // Don't fail the webhook if email fails
          logger.error("Failed to send welcome email", emailErr instanceof Error ? emailErr : undefined);
        }
      }

      trackServerEvent(event.data.created_by || id, "signup_completed", {
        org_id: id,
        org_name: name || "Unnamed Organization",
      });

      logger.info(`Organization created`, { orgId: id });
      break;
    }

    case "organization.updated": {
      const { id, name } = event.data;
      const { error } = await supabase
        .from("organizations")
        .update({ name: name || "Unnamed Organization" })
        .eq("id", id);

      if (error) {
        logger.error("Failed to update organization", { orgId: id, error: error.message });
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      break;
    }

    default:
      logger.info(`Unhandled Clerk event: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

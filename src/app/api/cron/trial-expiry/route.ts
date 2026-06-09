import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret } from "@/lib/auth/cron-guard";
import { sendEmail } from "@/lib/email/send";
import { trialExpiredEmail } from "@/lib/email/templates/trial-expired";
import { fetchOrgAdminEmails } from "@/lib/integrations/clerk-admin";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";

/**
 * Cron job: Expire trials and send notification emails.
 * Schedule: Daily at midnight UTC
 */
export async function GET(request: Request) {
  const blocked = verifyCronSecret(request);
  if (blocked) return blocked;

  const supabase = createAdminClient();

  const now = new Date().toISOString();

  // Find orgs with expired trials that haven't been marked yet
  // (already idempotent since we change status from "trialing")
  const { data: orgs, error: orgsError } = await supabase
    .from("organizations")
    .select("id, name, trial_expired_email_sent_at")
    .eq("subscription_status", "trialing")
    .lt("trial_ends_at", now);

  if (orgsError) {
    logger.error("Failed to fetch orgs for trial expiry", { error: orgsError.message });
    return NextResponse.json({ error_count: 1 }, { status: 500 });
  }

  if (!orgs?.length) {
    return NextResponse.json({ expired: 0, emails_sent: 0, errors: [] });
  }

  let expired = 0;
  let emailsSent = 0;
  const errors: string[] = [];

  for (const org of orgs) {
    try {
      // Update subscription status to past_due
      const { error } = await supabase
        .from("organizations")
        .update({
          subscription_status: "past_due",
          trial_expired_email_sent_at: now,
        })
        .eq("id", org.id)
        .eq("subscription_status", "trialing");

      if (error) {
        errors.push(`Failed to expire trial for org ${org.id}: ${error.message}`);
        continue;
      }

      expired++;

      // Skip email if already sent (idempotency guard)
      if (org.trial_expired_email_sent_at) continue;

      // Send expiry email to org admins via shared helper
      const adminEmails = await fetchOrgAdminEmails(org.id);

      for (const email of adminEmails) {
        const { subject, html } = trialExpiredEmail(org.name, getServerEnv().NEXT_PUBLIC_APP_URL);
        await sendEmail({ to: email, subject, html });
        emailsSent++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to process trial expiry for org ${org.id}: ${message}`);
    }
  }

  if (errors.length > 0) {
    logger.error("Trial expiry errors", {
      error_count: errors.length,
      errors: errors.slice(0, 10),
    });
  }

  return NextResponse.json({ expired, emails_sent: emailsSent, error_count: errors.length });
}

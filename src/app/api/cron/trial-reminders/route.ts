import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret } from "@/lib/auth/cron-guard";
import { sendEmail } from "@/lib/email/send";
import { trialEndingEmail } from "@/lib/email/templates/trial-ending";
import { fetchOrgAdminEmails } from "@/lib/integrations/clerk-admin";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";

/**
 * Cron job: Send trial-ending reminders to orgs whose trial ends in 3 days.
 * Schedule: Daily at 9am UTC
 */
export async function GET(request: Request) {
  const blocked = verifyCronSecret(request);
  if (blocked) return blocked;

  const supabase = createAdminClient();

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Find orgs where trial ends between now and 3 days from now
  // and reminder hasn't been sent yet
  const { data: orgs, error: orgsError } = await supabase
    .from("organizations")
    .select("id, name, trial_ends_at, trial_reminder_sent_at, notify_trial_reminders")
    .eq("subscription_status", "trialing")
    .is("trial_reminder_sent_at", null)
    .gte("trial_ends_at", now.toISOString())
    .lte("trial_ends_at", threeDaysFromNow.toISOString());

  if (orgsError) {
    logger.error("Failed to fetch orgs for trial reminders", { error: orgsError.message });
    return NextResponse.json({ error_count: 1 }, { status: 500 });
  }

  if (!orgs?.length) {
    return NextResponse.json({ sent: 0, errors: [] });
  }

  // Filter out orgs that have opted out of trial reminder emails
  const eligibleOrgs = orgs.filter(
    (org: { notify_trial_reminders?: boolean }) => org.notify_trial_reminders !== false
  );

  let sent = 0;
  const errors: string[] = [];

  for (const org of eligibleOrgs) {
    try {
      const trialEnd = new Date(org.trial_ends_at!);
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

      // Fetch admin emails via shared helper
      const adminEmails = await fetchOrgAdminEmails(org.id);

      for (const email of adminEmails) {
        const { subject, html } = trialEndingEmail(org.name, daysRemaining, getServerEnv().NEXT_PUBLIC_APP_URL);
        await sendEmail({ to: email, subject, html });
        sent++;
      }

      // Mark reminder as sent
      const { error: updateError } = await supabase
        .from("organizations")
        .update({ trial_reminder_sent_at: now.toISOString() })
        .eq("id", org.id);
      if (updateError) {
        logger.error("Failed to update trial_reminder_sent_at", { orgId: org.id, error: updateError.message });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to send trial reminder for org ${org.id}: ${message}`);
    }
  }

  if (errors.length > 0) {
    logger.error("Trial reminder errors", {
      error_count: errors.length,
      errors: errors.slice(0, 10),
    });
  }

  return NextResponse.json({ sent, error_count: errors.length });
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyCronSecret } from "@/lib/auth/cron-guard";
import { sendEmail } from "@/lib/email/send";
import { weeklyDigestEmail } from "@/lib/email/templates/weekly-digest";
import { fetchOrgAdminEmails } from "@/lib/integrations/clerk-admin";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";

/**
 * Cron job: Send weekly digest emails to active orgs.
 * Schedule: Mondays at 9am UTC
 */
export async function GET(request: Request) {
  const blocked = verifyCronSecret(request);
  if (blocked) return blocked;

  const supabase = createAdminClient();

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch all active/trialing orgs that haven't received a digest in the last 6 days
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();

  const { data: orgs, error: orgsError } = await supabase
    .from("organizations")
    .select("id, name, subscription_status, last_digest_sent_at, notify_weekly_digest")
    .in("subscription_status", ["active", "trialing"])
    .or(`last_digest_sent_at.is.null,last_digest_sent_at.lt.${sixDaysAgo}`);

  if (orgsError) {
    logger.error("Failed to fetch orgs for weekly digest", { error: orgsError.message });
    return NextResponse.json({ error_count: 1 }, { status: 500 });
  }

  if (!orgs?.length) {
    return NextResponse.json({ sent: 0, errors: [] });
  }

  // Filter out orgs that have opted out of weekly digest emails
  const eligibleOrgs = orgs.filter(
    (org: { notify_weekly_digest?: boolean }) => org.notify_weekly_digest !== false
  );

  let sent = 0;
  let emailsSent = 0;
  const errors: string[] = [];

  for (const org of eligibleOrgs) {
    try {
      // Get grant count
      const { count: totalGrants, error: grantsCountError } = await supabase
        .from("grants")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("status", "active");

      if (grantsCountError) {
        logger.error("Weekly digest: failed to count grants", { orgId: org.id, error: grantsCountError.message });
        errors.push(`Failed for org ${org.id}: ${grantsCountError.message}`);
        continue;
      }

      if (!totalGrants) continue; // Skip orgs with no grants

      // Get new expenses this week
      const { count: newExpenses, error: newExpensesError } = await supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id)
        .gte("created_at", oneWeekAgo);

      if (newExpensesError) {
        logger.error("Weekly digest: failed to count new expenses", { orgId: org.id, error: newExpensesError.message });
        errors.push(`Failed for org ${org.id}: ${newExpensesError.message}`);
        continue;
      }

      // Get pending review count
      const { count: pendingReview, error: pendingError } = await supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("status", "pending_review");

      if (pendingError) {
        logger.error("Weekly digest: failed to count pending reviews", { orgId: org.id, error: pendingError.message });
        errors.push(`Failed for org ${org.id}: ${pendingError.message}`);
        continue;
      }

      // Get categorized this week
      const { count: categorizedExpenses, error: categorizedError } = await supabase
        .from("expenses")
        .select("*", { count: "exact", head: true })
        .eq("org_id", org.id)
        .eq("status", "confirmed")
        .gte("confirmed_at", oneWeekAgo);

      if (categorizedError) {
        logger.error("Weekly digest: failed to count categorized expenses", { orgId: org.id, error: categorizedError.message });
        errors.push(`Failed for org ${org.id}: ${categorizedError.message}`);
        continue;
      }

      // Get budget alerts
      const { data: grants } = await supabase
        .from("grants")
        .select("id, name")
        .eq("org_id", org.id)
        .eq("status", "active");

      const alerts: { grantName: string; category: string; utilization: number }[] = [];

      const grantIds = (grants || []).map((g: { id: string }) => g.id);

      if (grantIds.length > 0) {
        const { data: allBudgets } = await supabase
          .from("grant_budgets")
          .select("grant_id, category, budgeted_amount")
          .in("grant_id", grantIds);

        const { data: allExpenses } = await supabase
          .from("expenses")
          .select("grant_id, confirmed_category, amount")
          .in("grant_id", grantIds)
          .eq("org_id", org.id)
          .eq("status", "confirmed");

        const budgetsByGrant: Record<string, { category: string; budgeted_amount: number }[]> = {};
        (allBudgets || []).forEach((b: { grant_id: string; category: string; budgeted_amount: number }) => {
          if (!budgetsByGrant[b.grant_id]) budgetsByGrant[b.grant_id] = [];
          budgetsByGrant[b.grant_id].push(b);
        });

        const expensesByGrant: Record<string, { confirmed_category: string | null; amount: number }[]> = {};
        (allExpenses || []).forEach((e: { grant_id: string; confirmed_category: string | null; amount: number }) => {
          if (!expensesByGrant[e.grant_id]) expensesByGrant[e.grant_id] = [];
          expensesByGrant[e.grant_id].push(e);
        });

        for (const grant of grants || []) {
          const spentByCategory: Record<string, number> = {};
          (expensesByGrant[grant.id] || []).forEach((e) => {
            const cat = e.confirmed_category || "other";
            spentByCategory[cat] = (spentByCategory[cat] || 0) + e.amount;
          });

          (budgetsByGrant[grant.id] || []).forEach((b) => {
            if (b.category === "total" || b.budgeted_amount <= 0) return;
            const spent = spentByCategory[b.category] || 0;
            const utilization = Math.round((spent / b.budgeted_amount) * 100);
            if (utilization >= 80) {
              alerts.push({
                grantName: grant.name,
                category: b.category,
                utilization,
              });
            }
          });
        }
      }

      // Send email to org admins via shared helper
      const { subject, html } = weeklyDigestEmail({
        orgName: org.name,
        totalGrants: totalGrants || 0,
        newExpenses: newExpenses || 0,
        categorizedExpenses: categorizedExpenses || 0,
        pendingReview: pendingReview || 0,
        alerts,
        appUrl: getServerEnv().NEXT_PUBLIC_APP_URL,
      });

      const adminEmails = await fetchOrgAdminEmails(org.id);

      for (const email of adminEmails) {
        await sendEmail({ to: email, subject, html });
        emailsSent++;
      }
      sent++;

      // Mark digest as sent
      const { error: updateError } = await supabase
        .from("organizations")
        .update({ last_digest_sent_at: now.toISOString() })
        .eq("id", org.id);
      if (updateError) {
        logger.error("Failed to update last_digest_sent_at", { orgId: org.id, error: updateError.message });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to send weekly digest for org ${org.id}: ${message}`);
    }
  }

  if (errors.length > 0) {
    logger.error("Weekly digest errors", {
      error_count: errors.length,
      errors: errors.slice(0, 10),
    });
  }

  return NextResponse.json({ sent, emails_sent: emailsSent, error_count: errors.length });
}

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { getSubscriptionStatus, getTrialDaysRemaining } from "@/lib/auth/subscription";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BillingActions } from "./billing-actions";
import { RecentInvoices } from "./recent-invoices";
import { UsageCard } from "./usage-card";

export default async function BillingPage() {
  const { orgId } = getAuthOrgId();

  if (!orgId) {
    return <p className="text-slate-600 dark:text-slate-400">Please select an organization.</p>;
  }

  const subscription = await getSubscriptionStatus(orgId);
  const trialDays = subscription ? getTrialDaysRemaining(subscription.trial_ends_at) : 0;

  const statusBadge = {
    active: { variant: "success" as const, label: "Active" },
    trialing: { variant: "info" as const, label: "Trial" },
    past_due: { variant: "danger" as const, label: "Past Due" },
    canceled: { variant: "danger" as const, label: "Canceled" },
    unpaid: { variant: "danger" as const, label: "Unpaid" },
  };

  const status = subscription?.subscription_status || "trialing";
  const badge = statusBadge[status];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Billing</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your subscription and payment details.</p>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
              status === "active" ? "bg-success-100 dark:bg-success-900/30" : status === "trialing" ? "bg-primary-100 dark:bg-primary-900/30" : "bg-danger-100 dark:bg-danger-900/30"
            }`}>
              {status === "active" ? (
                <svg className="h-5 w-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : status === "trialing" ? (
                <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-danger-600 dark:text-danger-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              )}
            </div>
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>
                {status === "active"
                  ? "You have full access to all GrantLedger features."
                  : status === "trialing"
                    ? `${trialDays} day${trialDays !== 1 ? "s" : ""} remaining in your free trial.`
                    : "Your subscription is inactive."}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {status === "active" && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success-500" />
              </span>
            )}
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </div>
      </Card>

      <BillingActions
        status={status}
        hasStripeCustomer={!!subscription?.stripe_customer_id}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <UsageCard />
        <RecentInvoices />
      </div>
    </div>
  );
}

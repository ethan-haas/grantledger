import type { Metadata } from "next";
import Link from "next/link";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type GrantBudget = Database["public"]["Tables"]["grant_budgets"]["Row"];
import { Card, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FrameworkBadge } from "@/components/grants/framework-badge";
import { ThresholdCard } from "@/components/grants/threshold-card";
import { GrantDashboardClient } from "@/components/dashboard/grant-dashboard-client";
import { GrantDetailActions } from "@/components/grants/grant-detail-actions";
import { StarToggleButton } from "@/components/grants/star-toggle-button";
import { InlineBudgetSection } from "@/components/grants/inline-budget-section";
import { formatCurrency, formatDate, formatPeriodDate } from "@/lib/constants/thresholds";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CopyButton } from "@/components/ui/copy-button";
import { NoOrgSelected } from "@/components/dashboard/no-org-selected";
import { logger } from "@/lib/logger";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const { orgId } = getAuthOrgId();
  if (!orgId) return { title: "Grant" };

  const supabase = await createServerClient();
  const { data: grant } = await supabase
    .from("grants")
    .select("name")
    .eq("id", params.id)
    .eq("org_id", orgId)
    .single();

  return { title: grant?.name ?? "Grant" };
}

const statConfig = [
  {
    label: "Award Amount",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400",
  },
  {
    label: "Award Date",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    iconBg: "bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400",
  },
  {
    label: "CFDA",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
      </svg>
    ),
    iconBg: "bg-success-50 text-success-600 dark:bg-success-900/30 dark:text-success-400",
  },
  {
    label: "Period",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: "bg-warning-50 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400",
  },
];

export default async function GrantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { orgId } = getAuthOrgId();
  if (!orgId) return <NoOrgSelected />;

  const supabase = await createServerClient();

  const { data: grant } = await supabase
    .from("grants")
    .select("*")
    .eq("id", params.id)
    .eq("org_id", orgId)
    .single();

  if (!grant) notFound();

  const { data: budgets, error: budgetsError } = await supabase
    .from("grant_budgets")
    .select("*")
    .eq("grant_id", params.id)
    .order("category");

  if (budgetsError) {
    logger.error("Failed to load budgets for grant detail", { grantId: params.id, error: budgetsError.message });
  }

  const budgetMap: Record<string, number> = {};
  ((budgets || []) as GrantBudget[]).forEach((b) => {
    budgetMap[b.category] = b.budgeted_amount;
  });

  const statValues = [
    formatCurrency(grant.total_amount),
    formatDate(grant.award_date),
    grant.cfda_number || "N/A",
    `${formatPeriodDate(grant.period_start)} - ${formatPeriodDate(grant.period_end)}`,
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Grants", href: "/dashboard/grants" },
          { label: grant.name },
        ]}
      />
      {/* Top accent bar */}
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <StarToggleButton grantId={params.id} />
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">{grant.name}</h1>
            <FrameworkBadge framework={grant.omb_framework} />
            <Badge>{grant.status}</Badge>
          </div>
          <p className="mt-1 text-slate-600 dark:text-slate-400">{grant.funding_agency}</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            {grant.cfda_number && (
              <span className="inline-flex items-center gap-1">
                CFDA: <span className="font-mono text-slate-700 dark:text-slate-300">{grant.cfda_number}</span>
                <CopyButton text={grant.cfda_number} label="Copy CFDA number" />
              </span>
            )}
            {grant.award_number && (
              <span className="inline-flex items-center gap-1">
                Award: <span className="font-mono text-slate-700 dark:text-slate-300">{grant.award_number}</span>
                <CopyButton text={grant.award_number} label="Copy award number" />
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              ID: <span className="font-mono text-xs text-slate-400">{params.id}</span>
              <CopyButton text={params.id} label="Copy grant ID" />
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap lg:shrink-0">
          <Link href={`/dashboard/grants/${params.id}/edit`}>
            <Button variant="secondary" aria-label="Edit grant details">Edit grant</Button>
          </Link>
          <GrantDetailActions grantId={params.id} grantName={grant.name} />
          <Link href={`/dashboard/grants/${params.id}/import`}>
            <Button variant="secondary">Import Expenses</Button>
          </Link>
          <Link href={`/dashboard/grants/${params.id}/expenses`}>
            <Button variant="secondary">View Expenses</Button>
          </Link>
          <Link href={`/dashboard/grants/${params.id}/report`}>
            <Button variant="secondary">Generate Report</Button>
          </Link>
          <Link href={`/dashboard/grants/${params.id}/activity`}>
            <Button variant="secondary">Activity Log</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statConfig.map((stat, i) => (
          <Card key={stat.label} padding="sm" hover>
            <div className="flex items-start gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconBg}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                <p className={`mt-0.5 font-bold tabular-nums text-slate-900 dark:text-slate-100 ${stat.label === "Period" ? "text-sm" : "text-xl"}`}>
                  {statValues[i]}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ThresholdCard framework={grant.omb_framework} />

      {budgetsError && (
        <Alert variant="warning">
          Budget data could not be loaded. The dashboard may show incomplete information.
        </Alert>
      )}

      {/* Budget-to-Actual Dashboard */}
      <GrantDashboardClient grantId={params.id} />

      <InlineBudgetSection grantId={params.id} budgets={budgetMap} totalAmount={grant.total_amount} />
    </div>
  );
}

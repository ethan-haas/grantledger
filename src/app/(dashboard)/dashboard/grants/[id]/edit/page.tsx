import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { notFound } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { GrantForm } from "@/components/grants/grant-form";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { NoOrgSelected } from "@/components/dashboard/no-org-selected";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/supabase/database.types";

type GrantBudget = Database["public"]["Tables"]["grant_budgets"]["Row"];

export default async function EditGrantPage({
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
    logger.error("Failed to load budgets for grant edit", { grantId: params.id, error: budgetsError.message });
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Grants", href: "/dashboard/grants" },
          { label: grant.name, href: `/dashboard/grants/${params.id}` },
          { label: "Edit" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Edit Grant</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Update grant details and budget allocation.</p>
      </div>

      <GrantForm
        initialData={{
          id: grant.id,
          name: grant.name,
          funding_agency: grant.funding_agency,
          cfda_number: grant.cfda_number,
          award_number: grant.award_number,
          award_date: grant.award_date,
          period_start: grant.period_start,
          period_end: grant.period_end,
          total_amount: grant.total_amount,
          omb_framework: grant.omb_framework,
          budgets: ((budgets || []) as GrantBudget[]).map((b) => ({
            category: b.category,
            budgeted_amount: b.budgeted_amount,
          })),
        }}
      />
    </div>
  );
}

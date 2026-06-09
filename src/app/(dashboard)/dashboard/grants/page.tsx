import Link from "next/link";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { createServerClient } from "@/lib/supabase/server";
import { GrantCard } from "@/components/grants/grant-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { NoOrgSelected } from "@/components/dashboard/no-org-selected";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/supabase/database.types";

type Grant = Database["public"]["Tables"]["grants"]["Row"];

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest First" },
  { value: "created_at:asc", label: "Oldest First" },
  { value: "name:asc", label: "Name (A-Z)" },
  { value: "name:desc", label: "Name (Z-A)" },
  { value: "total_amount:desc", label: "Amount (High-Low)" },
  { value: "total_amount:asc", label: "Amount (Low-High)" },
  { value: "period_end:asc", label: "Ending Soonest" },
  { value: "period_end:desc", label: "Ending Latest" },
] as const;

export default async function GrantsPage({
  searchParams,
}: {
  searchParams: { sort?: string; dir?: string };
}) {
  const { orgId } = getAuthOrgId();
  if (!orgId) return <NoOrgSelected />;

  const sortParam = searchParams.sort || "created_at";
  const dirParam = searchParams.dir || "desc";
  const validColumns = ["name", "funding_agency", "total_amount", "period_start", "period_end", "created_at"];
  const column = validColumns.includes(sortParam) ? sortParam : "created_at";
  const ascending = dirParam === "asc";
  const currentSort = `${column}:${ascending ? "asc" : "desc"}`;

  const supabase = await createServerClient();
  const { data: grants, error } = await supabase
    .from("grants")
    .select("*")
    .eq("org_id", orgId)
    .order(column, { ascending });

  if (error) {
    logger.error("Failed to load grants", { error: error.message });
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Grants</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your federal grants and budgets.</p>
          </div>
          <Link href="/dashboard/grants/new">
            <Button>Create new grant</Button>
          </Link>
        </div>
        <Card className="text-center">
          <p className="text-sm text-danger-600 dark:text-danger-500" role="alert">Failed to load grants. Please try again.</p>
          <div className="mt-3">
            <Link href="/dashboard/grants">
              <Button variant="secondary" size="sm">Try again</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Grants</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your federal grants and budgets.</p>
        </div>
        <Link href="/dashboard/grants/new">
          <Button>Create new grant</Button>
        </Link>
      </div>

      {grants && grants.length === 0 && (
        <EmptyState
          icon={
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          }
          title="No grants yet"
          description="Create your first grant to start categorizing expenses."
          action={
            <Link href="/dashboard/grants/new">
              <Button>Create Your First Grant</Button>
            </Link>
          }
        />
      )}

      {grants && grants.length > 0 && (
        <>
          {/* Sort controls */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sort by:</span>
            <div className="flex flex-wrap gap-1">
              {SORT_OPTIONS.map((opt) => {
                const [col, dir] = opt.value.split(":");
                const isActive = currentSort === opt.value;
                return (
                  <Link
                    key={opt.value}
                    href={`/dashboard/grants?sort=${col}&dir=${dir}`}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors min-h-[44px] inline-flex items-center ${
                      isActive
                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    {opt.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {((grants || []) as Grant[]).map((grant) => (
              <GrantCard
                key={grant.id}
                id={grant.id}
                name={grant.name}
                funding_agency={grant.funding_agency}
                period_start={grant.period_start}
                period_end={grant.period_end}
                total_amount={grant.total_amount}
                omb_framework={grant.omb_framework}
                status={grant.status}
                showActions
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

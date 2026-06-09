"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardTitle } from "@/components/ui/card";
import { ErrorCard } from "@/components/ui/error-card";
import { Alert } from "@/components/ui/alert";
import { AlertBadge } from "./alert-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatsCard } from "@/components/ui/stats-card";
import { SpendingTrends } from "./spending-trends";

const BudgetBarChart = dynamic(() => import("./budget-bar-chart").then((m) => m.BudgetBarChart), {
  ssr: false,
  loading: () => <div className="h-72 rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer" />,
});
const BudgetDonutChart = dynamic(() => import("./budget-donut-chart").then((m) => m.BudgetDonutChart), {
  ssr: false,
  loading: () => <div className="h-72 rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer" />,
});
import { CategoryDetail } from "./category-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { SF424A_CATEGORIES } from "@/lib/constants/categories";
import { formatCurrency, THRESHOLDS } from "@/lib/constants/thresholds";
import { checkIndirectCostCompliance } from "@/lib/queries/indirect-cost-check";
import type { AlertLevel } from "@/lib/queries/budget-actual";
import { trackEvent } from "@/lib/posthog";

interface CategoryData {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  utilization: number;
  alertLevel: AlertLevel;
}

interface DashboardData {
  grantId: string;
  grantName: string;
  ombFramework: string;
  totalBudget: number;
  totalSpent: number;
  categories: CategoryData[];
  pendingCount: number;
  confirmedCount: number;
  monthlySpending?: { month: string; amount: number }[];
}

interface GrantDashboardClientProps {
  grantId: string;
}

export function GrantDashboardClient({ grantId }: GrantDashboardClientProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [trendMonths, setTrendMonths] = useState<6 | 12 | 36>(6);
  const [chartType, setChartType] = useState<"bar" | "donut">("bar");
  const tracked = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (dateStart) params.set("date_start", dateStart);
        if (dateEnd) params.set("date_end", dateEnd);
        params.set("months", String(trendMonths));
        const qs = params.toString();
        const res = await fetch(`/api/grants/${grantId}/dashboard${qs ? `?${qs}` : ""}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) throw new Error("Unexpected response format");
        const json = await res.json();
        setData(json);
        if (!tracked.current) {
          trackEvent("dashboard_viewed", { grant_id: grantId });
          tracked.current = true;
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [grantId, dateStart, dateEnd, trendMonths, retryCount]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} padding="sm">
              <Skeleton variant="text" className="w-20" />
              <Skeleton variant="heading" className="mt-2 w-28" />
            </Card>
          ))}
        </div>
        <Card>
          <Skeleton variant="heading" className="w-40" />
          <Skeleton variant="chart" className="mt-4" />
        </Card>
      </div>
    );
  }

  if (error) {
    return <ErrorCard message={error} onRetry={() => { setError(null); setRetryCount((c) => c + 1); }} />;
  }

  if (!data) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="h-10 w-10 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
          </svg>
          <p className="mt-3 text-sm font-medium text-slate-900 dark:text-slate-100">No dashboard data available</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Import expenses and configure your budget to see analytics here.</p>
        </div>
      </Card>
    );
  }

  const alerts = data.categories.filter((c) => c.alertLevel !== "none");

  const indirectCheck = data ? checkIndirectCostCompliance({
    categories: data.categories,
    ombFramework: data.ombFramework as "pre_oct_2024" | "post_oct_2024",
  }) : null;

  return (
    <div className="space-y-6">
      {/* AI Credibility Banner */}
      <Alert variant="info" title="AI-Assisted Classification" dismissible>
        All categorizations are AI-generated suggestions. Always review and confirm before finalizing for audit compliance.
      </Alert>

      {/* Period Filter */}
      <Card padding="sm">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Start Date</label>
            <Input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="!py-1.5 !text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">End Date</label>
            <Input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="!py-1.5 !text-sm"
            />
          </div>
          {(dateStart || dateEnd) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setDateStart(""); setDateEnd(""); }}
            >
              Clear
            </Button>
          )}
        </div>
      </Card>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <StatsCard title="Total Budget" value={formatCurrency(data.totalBudget)} />
        <StatsCard title="Total Spent" value={formatCurrency(data.totalSpent)} />
        <StatsCard title="Confirmed" value={data.confirmedCount.toString()} />
        <StatsCard title="Pending Review" value={data.pendingCount.toString()} className={data.pendingCount > 0 ? "[&_p:last-child]:text-warning-600" : ""} />
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card padding="sm">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-danger-500" />
            </span>
            <CardTitle>Budget Alerts</CardTitle>
          </div>
          <div className="mt-3 space-y-2">
            {alerts.map((alert) => {
              const label = SF424A_CATEGORIES.find((c) => c.value === alert.category)?.label || alert.category;
              return (
                <div key={alert.category} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700">
                  <span className="text-slate-700 dark:text-slate-300">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="tabular-nums text-slate-500 dark:text-slate-400">
                      {formatCurrency(alert.spent)} / {formatCurrency(alert.budgeted)}
                    </span>
                    <AlertBadge level={alert.alertLevel} utilization={alert.utilization} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Equipment threshold warning */}
      {(() => {
        const fw = data.ombFramework as "pre_oct_2024" | "post_oct_2024";
        const threshold = THRESHOLDS[fw]?.equipmentMinimum;
        const equipmentCat = data.categories.find((c) => c.category === "equipment");
        if (!threshold || !equipmentCat) return null;
        const hasNearThreshold = equipmentCat.spent > 0;
        if (!hasNearThreshold) return null;
        const fwLabel = fw === "pre_oct_2024" ? "Pre-Oct 2024" : "Post-Oct 2024";
        return (
          <Alert variant="warning" title="Equipment Threshold" dismissible>
            <p>
              {fwLabel} rules: items over {formatCurrency(threshold)} are classified as equipment.
              Current equipment spending: {formatCurrency(equipmentCat.spent)} of {formatCurrency(equipmentCat.budgeted)} budgeted.
            </p>
            <Badge variant="info" className="mt-1.5">{fwLabel} &middot; Threshold: {formatCurrency(threshold)}</Badge>
          </Alert>
        );
      })()}

      {/* Indirect cost compliance warning */}
      {indirectCheck && !indirectCheck.isCompliant && (
        <Alert variant="danger" title="Indirect Cost Limit Exceeded">
          <p>
            Indirect charges ({formatCurrency(indirectCheck.indirectSpent)}) exceed the de minimis maximum
            of {formatCurrency(indirectCheck.maxAllowable)} ({(indirectCheck.rate * 100).toFixed(0)}% &times; {formatCurrency(indirectCheck.mtdcBase)} MTDC base).
            Overage: {formatCurrency(indirectCheck.overageAmount)}.
          </p>
          <Badge variant="danger" className="mt-1.5">
            Action Required &middot; Reduce indirect charges by {formatCurrency(indirectCheck.overageAmount)}
          </Badge>
        </Alert>
      )}

      {/* Chart */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Budget vs. Actual</CardTitle>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Click a category to see expenses.</p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
            <button
              type="button"
              onClick={() => setChartType("bar")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${chartType === "bar" ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}
              aria-pressed={chartType === "bar"}
            >
              Bar
            </button>
            <button
              type="button"
              onClick={() => setChartType("donut")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${chartType === "donut" ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"}`}
              aria-pressed={chartType === "donut"}
            >
              Donut
            </button>
          </div>
        </div>
        <div className="mt-4 min-h-[250px] max-h-[400px] overflow-hidden">
          {chartType === "bar" ? (
            <BudgetBarChart data={data.categories} onCategoryClick={setSelectedCategory} />
          ) : (
            <BudgetDonutChart data={data.categories} onCategoryClick={setSelectedCategory} />
          )}
        </div>
      </Card>

      {/* Category detail expand */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <CategoryDetail
              grantId={grantId}
              category={selectedCategory}
              onClose={() => setSelectedCategory(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spending trends */}
      {data.monthlySpending && data.monthlySpending.length > 0 && (
        <div className="space-y-0">
          <div className="flex items-center justify-end gap-1 mb-2">
            {([6, 12, 36] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTrendMonths(m)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                  trendMonths === m
                    ? "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                }`}
                aria-pressed={trendMonths === m}
              >
                {m === 36 ? "All" : `${m}M`}
              </button>
            ))}
          </div>
          <SpendingTrends data={data.monthlySpending} />
        </div>
      )}

      {/* Category breakdown table */}
      <Card>
        <CardTitle>Category Breakdown</CardTitle>

        {/* Mobile cards */}
        <div className="mt-4 space-y-2 md:hidden">
          {data.categories.map((cat) => {
            const label = SF424A_CATEGORIES.find((c) => c.value === cat.category)?.label || cat.category;
            return (
              <button
                key={cat.category}
                type="button"
                onClick={() => setSelectedCategory(cat.category)}
                className={`w-full rounded-xl border p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${selectedCategory === cat.category ? "border-primary-300 bg-primary-50/50 dark:border-primary-600 dark:bg-primary-900/30" : "border-slate-200 dark:border-slate-700"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{label}</span>
                  <AlertBadge level={cat.alertLevel} utilization={cat.utilization} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Budgeted</span>
                    <p className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{formatCurrency(cat.budgeted)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Spent</span>
                    <p className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{formatCurrency(cat.spent)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400">Remaining</span>
                    <p className={`tabular-nums font-medium ${cat.remaining < 0 ? "text-danger-600 dark:text-danger-400" : "text-slate-700 dark:text-slate-300"}`}>
                      {formatCurrency(cat.remaining)}
                    </p>
                  </div>
                </div>
                <p className="mt-1 text-right text-xs tabular-nums text-slate-500 dark:text-slate-400">{cat.utilization.toFixed(1)}% utilized</p>
              </button>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="mt-4 hidden md:block overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-soft-sm">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
            <caption className="sr-only">Budget vs. actual by category</caption>
            <thead className="bg-slate-50/80 dark:bg-slate-800/80">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Category</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Budgeted</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Spent</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Remaining</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Utilization</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {data.categories.map((cat, i) => {
                const label = SF424A_CATEGORIES.find((c) => c.value === cat.category)?.label || cat.category;
                return (
                  <tr
                    key={cat.category}
                    className={`cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 ${i % 2 === 1 ? "bg-slate-50/30 dark:bg-slate-800/30" : ""} ${selectedCategory === cat.category ? "bg-primary-50/50 dark:bg-primary-900/30" : ""}`}
                    onClick={() => setSelectedCategory(cat.category)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedCategory(cat.category);
                      }
                    }}
                    aria-label={`View expenses for ${SF424A_CATEGORIES.find((c) => c.value === cat.category)?.label || cat.category}`}
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{label}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(cat.budgeted)}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{formatCurrency(cat.spent)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums ${cat.remaining < 0 ? "text-danger-600 dark:text-danger-400 font-medium" : "text-slate-700 dark:text-slate-300"}`}>
                      {formatCurrency(cat.remaining)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-700 dark:text-slate-300">{cat.utilization.toFixed(1)}%</td>
                    <td className="px-4 py-3">
                      <AlertBadge level={cat.alertLevel} utilization={cat.utilization} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FrameworkBadge } from "@/components/grants/framework-badge";
import { formatCurrency } from "@/lib/constants/thresholds";
import type { OmbFramework } from "@/lib/supabase/database.types";

interface GrantOverviewCardProps {
  id: string;
  name: string;
  fundingAgency: string;
  ombFramework: OmbFramework;
  periodEnd: string;
  totalBudget: number;
  totalSpent: number;
  utilization: number;
  alertCount: number;
  pendingCount: number;
}

export function GrantOverviewCard({
  id,
  name,
  fundingAgency,
  ombFramework,
  periodEnd,
  totalBudget,
  totalSpent,
  utilization,
  alertCount,
  pendingCount,
}: GrantOverviewCardProps) {
  const daysUntilEnd = Math.max(
    0,
    Math.ceil((new Date(periodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const barColor =
    utilization > 100
      ? "bg-danger-700"
      : utilization >= 90
        ? "bg-danger-500"
        : utilization >= 80
          ? "bg-warning-500"
          : "bg-success-500";

  const daysColor =
    daysUntilEnd < 7
      ? "text-danger-600 dark:text-danger-400"
      : daysUntilEnd < 30
        ? "text-warning-600 dark:text-warning-400"
        : "text-slate-500 dark:text-slate-400";

  return (
    <Link href={`/dashboard/grants/${id}`} className="group">
      <Card hover className="relative">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold tracking-tight text-slate-900 dark:text-slate-100">{name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{fundingAgency}</p>
          </div>
          <div className="ml-2 flex flex-shrink-0 gap-1.5">
            <FrameworkBadge framework={ombFramework} />
            {alertCount > 0 && (
              <Badge variant="danger">{alertCount} alert{alertCount !== 1 ? "s" : ""}</Badge>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{formatCurrency(totalSpent)} spent</span>
            <span>{formatCurrency(totalBudget)} budget</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <div className="mt-1 text-right text-xs font-medium tabular-nums text-slate-700 dark:text-slate-300">
            {utilization.toFixed(1)}%
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs">
          <div className="flex gap-4">
            <span className={daysColor}>{daysUntilEnd} days remaining</span>
            {pendingCount > 0 && (
              <span className="text-warning-600 dark:text-warning-400">{pendingCount} pending review</span>
            )}
          </div>
          <svg
            className="h-4 w-4 text-slate-300 dark:text-slate-600 opacity-0 transition-opacity group-hover:opacity-100"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
      </Card>
    </Link>
  );
}

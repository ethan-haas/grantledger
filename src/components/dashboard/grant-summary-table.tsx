"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FrameworkBadge } from "@/components/grants/framework-badge";
import { AlertBadge } from "@/components/dashboard/alert-badge";
import { formatCurrency } from "@/lib/constants/thresholds";
import type { OmbFramework } from "@/lib/supabase/database.types";

interface GrantSummary {
  id: string;
  name: string;
  fundingAgency: string;
  ombFramework: string;
  periodEnd: string;
  totalBudget: number;
  totalSpent: number;
  utilization: number;
  alertCount: number;
  pendingCount: number;
  confirmedCount: number;
}

interface GrantSummaryTableProps {
  grants: GrantSummary[];
  totalBudget: number;
  totalSpent: number;
}

function UtilizationBar({ utilization }: { utilization: number }) {
  const clamped = Math.min(utilization, 100);
  const barColor =
    utilization > 100
      ? "bg-danger-700"
      : utilization >= 90
        ? "bg-danger-500"
        : utilization >= 80
          ? "bg-warning-500"
          : "bg-success-500";

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700"
        role="img"
        aria-label={`${utilization.toFixed(1)}% utilization`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span
        className={`text-xs font-medium tabular-nums ${
          utilization > 100
            ? "text-danger-700 dark:text-danger-400"
            : utilization >= 90
              ? "text-danger-600 dark:text-danger-400"
              : utilization >= 80
                ? "text-warning-600 dark:text-warning-400"
                : "text-slate-700 dark:text-slate-300"
        }`}
      >
        {utilization.toFixed(1)}%
      </span>
    </div>
  );
}

export function GrantSummaryTable({ grants, totalBudget, totalSpent }: GrantSummaryTableProps) {
  const totalRemaining = totalBudget - totalSpent;
  const totalUtilization = totalBudget > 0
    ? Math.round((totalSpent / totalBudget) * 1000) / 10
    : 0;
  const totalAlerts = grants.reduce((sum, g) => sum + g.alertCount, 0);
  const totalPending = grants.reduce((sum, g) => sum + g.pendingCount, 0);

  return (
    <Card padding="sm" className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <caption className="sr-only">Grant budget utilization summary</caption>

          <thead className="bg-slate-50/80 dark:bg-slate-800/80">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Grant Name
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Agency
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Framework
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Budget
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Spent
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Remaining
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Utilization
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Alerts
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400"
              >
                Pending
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-700 dark:bg-slate-900">
            {grants.map((grant) => {
              const remaining = grant.totalBudget - grant.totalSpent;
              const alertLevel =
                grant.utilization > 100
                  ? "overspent"
                  : grant.utilization >= 90
                    ? "critical"
                    : grant.utilization >= 80
                      ? "warning"
                      : "none";

              return (
                <tr
                  key={grant.id}
                  className="group transition-colors duration-100 hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    <Link
                      href={`/dashboard/grants/${grant.id}`}
                      className="font-medium text-slate-900 dark:text-slate-100 hover:text-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 rounded"
                    >
                      {grant.name}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                    {grant.fundingAgency}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <FrameworkBadge framework={grant.ombFramework as OmbFramework} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-slate-700 dark:text-slate-300">
                    {formatCurrency(grant.totalBudget)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-slate-700 dark:text-slate-300">
                    {formatCurrency(grant.totalSpent)}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums font-medium ${
                    remaining < 0 ? "text-danger-600 dark:text-danger-400" : "text-slate-700 dark:text-slate-300"
                  }`}>
                    {formatCurrency(remaining)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <UtilizationBar utilization={grant.utilization} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {alertLevel !== "none" ? (
                      <AlertBadge level={alertLevel} utilization={grant.utilization} />
                    ) : (
                      <Badge variant="success">On Track</Badge>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    {grant.pendingCount > 0 ? (
                      <span className="font-medium text-warning-600 dark:text-warning-400">{grant.pendingCount}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot className="border-t border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/80">
            <tr>
              <td
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400"
                colSpan={3}
              >
                Totals ({grants.length} grant{grants.length !== 1 ? "s" : ""})
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrency(totalBudget)}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {formatCurrency(totalSpent)}
              </td>
              <td className={`whitespace-nowrap px-4 py-3 text-right text-sm font-semibold tabular-nums ${
                totalRemaining < 0 ? "text-danger-600 dark:text-danger-400" : "text-slate-900 dark:text-slate-100"
              }`}>
                {formatCurrency(totalRemaining)}
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                <UtilizationBar utilization={totalUtilization} />
              </td>
              <td className="whitespace-nowrap px-4 py-3">
                {totalAlerts > 0 ? (
                  <Badge variant="danger">
                    {totalAlerts} alert{totalAlerts !== 1 ? "s" : ""}
                  </Badge>
                ) : (
                  <Badge variant="success">All On Track</Badge>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                {totalPending > 0 ? (
                  <span className="font-semibold text-warning-600 dark:text-warning-400">{totalPending}</span>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500">—</span>
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

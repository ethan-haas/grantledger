import { ProgressiveSkeleton } from "@/components/ui/progressive-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-48 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" aria-hidden="true" />
          <div className="mt-2 h-4 w-64 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" aria-hidden="true" />
        </div>
        <div className="h-10 w-32 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" aria-hidden="true" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressiveSkeleton shape="stat-card" count={4} className="contents" />
      </div>
      <ProgressiveSkeleton shape="chart" />
      <ProgressiveSkeleton shape="table-row" count={5} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" />
    </div>
  );
}

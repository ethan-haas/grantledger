import { ProgressiveSkeleton } from "@/components/ui/progressive-skeleton";

export default function GrantDetailLoading() {
  return (
    <div className="space-y-6">
      <ProgressiveSkeleton shape="detail-header" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ProgressiveSkeleton shape="stat-card" count={4} className="contents" />
      </div>
      <ProgressiveSkeleton shape="chart" />
      <ProgressiveSkeleton shape="table-row" count={9} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" />
    </div>
  );
}

import { ProgressiveSkeleton } from "@/components/ui/progressive-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExpensesLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>
      <ProgressiveSkeleton shape="table-row" count={6} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden" />
    </div>
  );
}

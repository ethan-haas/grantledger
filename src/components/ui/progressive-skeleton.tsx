import type { HTMLAttributes } from "react";

type SkeletonShape =
  | "stat-card"
  | "table-row"
  | "chart"
  | "grant-card"
  | "detail-header"
  | "text-block";

interface ProgressiveSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  shape: SkeletonShape;
  count?: number;
}

function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
        <div className="flex-1">
          <div className="h-3 w-16 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
          <div className="mt-2 h-6 w-24 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

function TableRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-slate-100 px-4 py-3 dark:border-slate-700">
      <div className="h-4 w-4 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="h-4 w-20 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="h-4 w-28 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="flex-1" />
      <div className="h-4 w-16 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="h-5 w-14 rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="h-5 w-32 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="mt-4 flex items-end gap-2" style={{ height: 160 }}>
        {[40, 65, 50, 80, 55, 70, 45, 60].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function GrantCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <div className="h-5 w-40 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
        <div className="h-5 w-16 rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
      </div>
      <div className="mt-3 h-4 w-48 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="h-3 w-12 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
            <div className="mt-1 h-5 w-20 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
          </div>
        ))}
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}

function DetailHeaderSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-1 w-full rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-7 w-48 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
            <div className="h-5 w-20 rounded-full bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
          </div>
          <div className="mt-2 h-4 w-32 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-24 rounded-lg bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
          ))}
        </div>
      </div>
    </div>
  );
}

function TextBlockSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-full rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="h-4 w-5/6 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
      <div className="h-4 w-3/4 rounded bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}

const shapeComponents: Record<SkeletonShape, () => JSX.Element> = {
  "stat-card": StatCardSkeleton,
  "table-row": TableRowSkeleton,
  chart: ChartSkeleton,
  "grant-card": GrantCardSkeleton,
  "detail-header": DetailHeaderSkeleton,
  "text-block": TextBlockSkeleton,
};

export function ProgressiveSkeleton({
  shape,
  count = 1,
  className = "",
  ...props
}: ProgressiveSkeletonProps) {
  const Component = shapeComponents[shape];

  return (
    <div aria-hidden="true" className={className} {...props}>
      {Array.from({ length: count }, (_, i) => (
        <Component key={i} />
      ))}
    </div>
  );
}

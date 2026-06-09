import Link from "next/link";
import type { ReactNode } from "react";

type TrendDirection = "up" | "down";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    direction: TrendDirection;
    label?: string;
  };
  href?: string;
  className?: string;
}

const trendColors: Record<TrendDirection, string> = {
  up: "text-success-600 dark:text-success-500",
  down: "text-danger-600 dark:text-danger-500",
};

const trendArrows: Record<TrendDirection, ReactNode> = {
  up: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
    </svg>
  ),
  down: (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
    </svg>
  ),
};

export function StatsCard({
  title,
  value,
  icon,
  trend,
  href,
  className = "",
}: StatsCardProps) {
  const content = (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-soft-sm transition-all duration-200 dark:border-slate-700 dark:bg-slate-800 dark:shadow-none ${
        href ? "hover:shadow-soft hover:border-slate-300/80 hover:-translate-y-0.5 dark:hover:border-slate-600" : ""
      } ${className}`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {value}
          </p>
        </div>
        {icon && (
          <span className="shrink-0 rounded-lg bg-primary-50 p-2.5 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
            {icon}
          </span>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trendColors[trend.direction]}`}>
            {trendArrows[trend.direction]}
            {Math.abs(trend.value)}%
          </span>
          {trend.label && (
            <span className="text-xs text-slate-500 dark:text-slate-400">{trend.label}</span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }

  return content;
}

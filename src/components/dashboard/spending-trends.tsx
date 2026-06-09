"use client";

import dynamic from "next/dynamic";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useResolvedTheme } from "@/hooks/use-theme";

export type { MonthlySpend } from "./spending-trends-chart";

const SpendingTrendsChart = dynamic(() => import("./spending-trends-chart"), {
  ssr: false,
  loading: () => <div className="mt-4"><Skeleton className="h-[240px] w-full rounded-xl" /></div>,
});

interface SpendingTrendsProps {
  data: Array<{ month: string; amount: number }>;
}

export function SpendingTrends({ data }: SpendingTrendsProps) {
  const isDark = useResolvedTheme() === "dark";

  if (data.length === 0) return null;

  return (
    <Card>
      <CardTitle>Spending Trends</CardTitle>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Monthly confirmed expense totals.</p>
      <SpendingTrendsChart data={data} isDark={isDark} />
    </Card>
  );
}

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { SF424A_CATEGORIES } from "@/lib/constants/categories";
import { formatCurrency } from "@/lib/constants/thresholds";
import type { AlertLevel } from "@/lib/queries/budget-actual";
import { EmptyState } from "@/components/ui/empty-state";
import { useResolvedTheme } from "@/hooks/use-theme";

interface CategoryData {
  category: string;
  budgeted: number;
  spent: number;
  alertLevel: AlertLevel;
}

interface BudgetBarChartProps {
  data: CategoryData[];
  onCategoryClick?: (category: string) => void;
}

const alertBarColors: Record<AlertLevel, string> = {
  none: "#22c55e",
  warning: "#f59e0b",
  critical: "#ef4444",
  overspent: "#991b1b",
};

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string; payload: { budgeted: number; spent: number; alertLevel: AlertLevel } }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  const utilization = data.budgeted > 0 ? ((data.spent / data.budgeted) * 100).toFixed(1) : "0.0";

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 shadow-soft text-xs">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-slate-500 dark:text-slate-400">Budgeted</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(data.budgeted)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Spent</p>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(data.spent)}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Utilization</p>
          <p className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">{utilization}%</p>
        </div>
      </div>
    </div>
  );
}

export function BudgetBarChart({ data, onCategoryClick }: BudgetBarChartProps) {
  const isDark = useResolvedTheme() === "dark";
  const chartData = data
    .filter((d) => d.budgeted > 0 || d.spent > 0)
    .map((d) => ({
      ...d,
      name: SF424A_CATEGORIES.find((c) => c.value === d.category)?.label || d.category,
    }));

  if (chartData.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        }
        title="No budget data"
        description="Allocate budget amounts to see the chart."
      />
    );
  }

  return (
    <div role="img" aria-label="Budget versus actual spending bar chart">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
        >
          <CartesianGrid horizontal={true} vertical={false} stroke={isDark ? "#334155" : "#f1f5f9"} />
          <XAxis
            type="number"
            tickFormatter={(v) => formatCurrency(v)}
            stroke={isDark ? "#64748b" : "#94a3b8"}
            fontSize={12}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke={isDark ? "#64748b" : "#94a3b8"}
            fontSize={12}
            width={80}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: "12px", paddingTop: "12px", color: isDark ? "#cbd5e1" : undefined }}
          />
          <Bar dataKey="budgeted" name="Budgeted" fill={isDark ? "#475569" : "#e2e8f0"} radius={[0, 6, 6, 0]} />
          <Bar
            dataKey="spent"
            name="Spent"
            radius={[0, 6, 6, 0]}
            cursor={onCategoryClick ? "pointer" : "default"}
            onClick={(entry) => onCategoryClick?.(entry.category)}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.category} fill={alertBarColors[entry.alertLevel]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

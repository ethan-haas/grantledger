"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { SF424A_CATEGORIES } from "@/lib/constants/categories";
import { formatCurrency } from "@/lib/constants/thresholds";
import type { AlertLevel } from "@/lib/queries/budget-actual";
import { EmptyState } from "@/components/ui/empty-state";

interface CategoryData {
  category: string;
  budgeted: number;
  spent: number;
  alertLevel: AlertLevel;
}

interface BudgetDonutChartProps {
  data: CategoryData[];
  onCategoryClick?: (category: string) => void;
}

const COLORS = [
  "#3b82f6", "#6366f1", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#14b8a6", "#f97316", "#ec4899", "#06b6d4",
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { budgeted: number; spent: number; category: string } }> }) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0].payload;
  const utilization = data.budgeted > 0 ? ((data.spent / data.budgeted) * 100).toFixed(1) : "0.0";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-soft text-xs dark:border-slate-700 dark:bg-slate-800">
      <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">{payload[0].name}</p>
      <div className="space-y-0.5">
        <p className="text-slate-600 dark:text-slate-400">Spent: {formatCurrency(data.spent)}</p>
        <p className="text-slate-600 dark:text-slate-400">Budget: {formatCurrency(data.budgeted)}</p>
        <p className="text-slate-600 dark:text-slate-400">Utilization: {utilization}%</p>
      </div>
    </div>
  );
}

export function BudgetDonutChart({ data, onCategoryClick }: BudgetDonutChartProps) {
  const chartData = data
    .filter((d) => d.spent > 0)
    .map((d) => ({
      ...d,
      name: SF424A_CATEGORIES.find((c) => c.value === d.category)?.label || d.category,
      value: d.spent,
    }));

  if (chartData.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
          </svg>
        }
        title="No spending data"
        description="Import expenses to see spending distribution."
      />
    );
  }

  const totalSpent = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div role="img" aria-label="Budget spending distribution donut chart">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
            cursor={onCategoryClick ? "pointer" : "default"}
            onClick={(entry) => onCategoryClick?.(entry.category)}
          >
            {chartData.map((entry, index) => (
              <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <text
            x="50%"
            y="48%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-900 dark:fill-slate-100 text-2xl font-bold"
          >
            {formatCurrency(totalSpent)}
          </text>
          <text
            x="50%"
            y="56%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-slate-500 dark:fill-slate-400 text-xs"
          >
            Total Spent
          </text>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

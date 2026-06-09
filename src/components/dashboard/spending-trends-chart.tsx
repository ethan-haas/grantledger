"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/constants/thresholds";

export interface MonthlySpend {
  month: string;
  amount: number;
}

interface SpendingTrendsChartProps {
  data: MonthlySpend[];
  isDark?: boolean;
}

export default function SpendingTrendsChart({ data, isDark = false }: SpendingTrendsChartProps) {
  const gridStroke = isDark ? "#334155" : "#e2e8f0";
  const tickFill = isDark ? "#94a3b8" : "#64748b";
  const dotStroke = isDark ? "#1e293b" : "#fff";

  return (
    <div className="mt-4" aria-label="Monthly spending trends chart" role="img">
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: tickFill }}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: tickFill }}
            tickLine={false}
            axisLine={false}
            width={80}
            tickFormatter={(v: number) => formatCurrency(v)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: `1px solid ${isDark ? "#334155" : "#e2e8f0"}`,
              backgroundColor: isDark ? "#1e293b" : "#fff",
              color: isDark ? "#e2e8f0" : undefined,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              fontSize: "12px",
            }}
            formatter={(value: number) => [formatCurrency(value), "Spent"]}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={{ r: 4, fill: "#4f46e5", strokeWidth: 2, stroke: dotStroke }}
            activeDot={{ r: 6, fill: "#4f46e5", strokeWidth: 2, stroke: dotStroke }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

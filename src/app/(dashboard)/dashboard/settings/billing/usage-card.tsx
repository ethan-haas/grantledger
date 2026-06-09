"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface UsageData {
  grants: number;
  expenses: number;
  members: number;
}

export function UsageCard() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    // Fetch counts from existing endpoints
    Promise.all([
      fetch("/api/grants?page=1&pageSize=1", { signal: controller.signal })
        .then((r) => r.ok ? r.json() : { total: 0 }),
      fetch("/api/expenses?page=1&pageSize=1", { signal: controller.signal })
        .then((r) => r.ok ? r.json() : { total: 0 }),
      fetch("/api/org/members", { signal: controller.signal })
        .then((r) => r.ok ? r.json() : { total: 0 }),
    ])
      .then(([grants, expenses, members]) => {
        setUsage({
          grants: grants.total || 0,
          expenses: expenses.total || 0,
          members: members.total || 0,
        });
      })
      .catch(() => {
        setUsage({ grants: 0, expenses: 0, members: 0 });
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  const items = usage
    ? [
        { label: "Grants", value: usage.grants },
        { label: "Expenses", value: usage.expenses },
        { label: "Team Members", value: usage.members },
      ]
    : [];

  return (
    <Card>
      <CardTitle>Usage</CardTitle>
      {loading ? (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="text" className="h-8" />
          ))}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {items.map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {item.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

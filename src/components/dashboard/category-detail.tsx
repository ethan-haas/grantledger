"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoryPill } from "@/components/expenses/category-pill";
import { formatCurrency, formatDate } from "@/lib/constants/thresholds";
import type { Sf424aCategory } from "@/lib/supabase/database.types";

interface CategoryDetailProps {
  grantId: string;
  category: string;
  onClose: () => void;
}

interface Expense {
  id: string;
  date: string;
  vendor: string;
  description: string;
  amount: number;
}

export function CategoryDetail({ grantId, category, onClose }: CategoryDetailProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const params = new URLSearchParams({
          grant_id: grantId,
          category,
          status: "confirmed",
        });
        const res = await fetch(`/api/expenses?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error("Failed to load expenses");
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) throw new Error("Invalid response format");
        const data = await res.json();
        setExpenses(data.expenses || []);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setError("Failed to load expenses");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [grantId, category]);

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>Expenses</CardTitle>
          <CategoryPill category={category as Sf424aCategory} />
        </div>
        <button onClick={onClose} aria-label="Close category details" className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 px-3 py-2 -mr-3 -my-2 min-h-[44px] inline-flex items-center">
          Close
        </button>
      </div>
      <div className="mt-4">
        {error ? (
          <div role="alert">
            <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                const params = new URLSearchParams({ grant_id: grantId, category, status: "confirmed" });
                fetch(`/api/expenses?${params}`)
                  .then((res) => {
                    if (!res.ok) throw new Error("Failed to load expenses");
                    const ct = res.headers.get("content-type") || "";
                    if (!ct.includes("application/json")) throw new Error("Invalid response format");
                    return res.json();
                  })
                  .then((data) => setExpenses(data.expenses || []))
                  .catch(() => setError("Failed to load expenses"))
                  .finally(() => setLoading(false));
              }}
              className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              aria-label="Retry loading expenses"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="text" className="h-8" />
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">No confirmed expenses in this category.</p>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="max-h-64 space-y-2 overflow-y-auto md:hidden">
              {expenses.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{e.vendor}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{formatDate(e.date)}</p>
                  </div>
                  <p className="ml-3 flex-shrink-0 text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatCurrency(e.amount)}</p>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block max-h-64 overflow-y-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <caption className="sr-only">Confirmed expenses in this category</caption>
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Date</th>
                    <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Vendor</th>
                    <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-slate-500 dark:text-slate-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {expenses.map((e) => (
                    <tr key={e.id}>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{formatDate(e.date)}</td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{e.vendor}</td>
                      <td className="px-3 py-2 text-right font-medium text-slate-900 dark:text-slate-100">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

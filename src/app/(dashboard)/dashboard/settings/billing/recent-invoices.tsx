"use client";

import { useState, useEffect } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  pdfUrl: string | null;
}

const statusVariant: Record<string, "success" | "warning" | "danger" | "default"> = {
  paid: "success",
  open: "warning",
  void: "default",
  uncollectible: "danger",
};

export function RecentInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/stripe/invoices", { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) throw new Error("Bad response");
        return res.json();
      })
      .then((data) => setInvoices(data.invoices || []))
      .catch((err) => {
        if (err instanceof Error && err.name !== "AbortError") {
          setInvoices([]);
        }
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  return (
    <Card>
      <CardTitle>Recent Invoices</CardTitle>
      {loading ? (
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="text" className="h-8" />
          ))}
        </div>
      ) : invoices.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No invoices yet.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th scope="col" className="pb-2 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Date</th>
                <th scope="col" className="pb-2 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Amount</th>
                <th scope="col" className="pb-2 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Status</th>
                <th scope="col" className="pb-2 text-right text-xs font-medium uppercase text-slate-500 dark:text-slate-400">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="py-2 text-slate-700 dark:text-slate-300">
                    {inv.date ? new Date(inv.date).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2 text-right font-medium text-slate-900 dark:text-slate-100">
                    ${inv.amount.toFixed(2)}
                  </td>
                  <td className="py-2">
                    <Badge variant={statusVariant[inv.status] || "default"}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="py-2 text-right">
                    {inv.pdfUrl ? (
                      <a
                        href={inv.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        Download
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500 dark:text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

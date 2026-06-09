"use client";

import { useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useUiStore } from "@/stores/ui-store";

export default function ExportSettingsPage() {
  const addToast = useUiStore((s) => s.addToast);
  const [exporting, setExporting] = useState<string | null>(null);

  async function handleExportActivity() {
    if (exporting) return;
    setExporting("activity");
    try {
      const res = await fetch("/api/report?format=csv&type=activity", { method: "POST" });
      if (!res.ok) throw new Error("Export failed");
      const ct = res.headers.get("content-type");
      if (!ct?.includes("text/csv")) throw new Error("Unexpected response format");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "grantledger-activity-export.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast({ type: "success", title: "Activity logs exported" });
    } catch (err) {
      addToast({
        type: "error",
        title: "Export failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setExporting(null);
    }
  }

  async function handleExport(type: "grants" | "expenses") {
    if (exporting) return;
    setExporting(type);
    try {
      const res = await fetch(`/api/report?format=csv&type=${type}`, { method: "POST" });
      if (!res.ok) {
        throw new Error("Export failed");
      }
      const ct = res.headers.get("content-type");
      if (!ct?.includes("text/csv")) {
        throw new Error("Unexpected response format");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grantledger-${type}-export.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast({ type: "success", title: `${type === "grants" ? "Grants" : "Expenses"} exported` });
    } catch (err) {
      addToast({
        type: "error",
        title: "Export failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/dashboard/settings" },
          { label: "Data Export" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
          Data Export
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Download your data in CSV format.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
              <svg className="h-5 w-5 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base">Export Grants</CardTitle>
              <CardDescription>
                Download all grants with award details, budget allocations, and status.
              </CardDescription>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport("grants")}
              loading={exporting === "grants"}
            >
              Download CSV
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50 dark:bg-accent-900/30">
              <svg className="h-5 w-5 text-accent-600 dark:text-accent-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base">Export Expenses</CardTitle>
              <CardDescription>
                Download all expenses with categories, amounts, status, and AI citations.
              </CardDescription>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExport("expenses")}
              loading={exporting === "expenses"}
            >
              Download CSV
            </Button>
          </div>
        </Card>
        <Card>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success-50 dark:bg-success-900/30">
              <svg className="h-5 w-5 text-success-600 dark:text-success-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-base">Export Activity Logs</CardTitle>
              <CardDescription>
                Download all activity logs with timestamps, actors, and change details.
              </CardDescription>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportActivity}
              loading={exporting === "activity"}
            >
              Download CSV
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

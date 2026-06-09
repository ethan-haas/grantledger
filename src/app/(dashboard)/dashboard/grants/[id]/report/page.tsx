"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { useUiStore } from "@/stores/ui-store";

export default function ReportPage() {
  const params = useParams();
  const grantId = params.id as string;
  const addToast = useUiStore((s) => s.addToast);

  const [reportType, setReportType] = useState<"budget_summary" | "monthly_breakdown" | "expense_detail">("budget_summary");
  const [format, setFormat] = useState<"pdf" | "csv">("pdf");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [includePending, setIncludePending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  async function handleGenerate() {
    if (dateStart && dateEnd && dateEnd <= dateStart) {
      setDateError("End date must be after start date");
      return;
    }
    setDateError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/grants/${grantId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: reportType,
          format,
          date_start: dateStart || undefined,
          date_end: dateEnd || undefined,
          include_pending: includePending,
        }),
      });

      if (!res.ok) {
        let error = "Failed to generate report";
        try { const data = await res.json(); error = data.error || error; } catch {}
        throw new Error(error);
      }

      // Verify response content-type before downloading
      const ct = res.headers.get("content-type");
      const expectedType = format === "pdf" ? "application/pdf" : "text/csv";
      if (!ct?.includes(expectedType)) {
        throw new Error("Unexpected response format from server");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `grantledger-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      addToast({ type: "success", title: "Report downloaded" });
    } catch (err) {
      addToast({
        type: "error",
        title: "Report generation failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Grants", href: "/dashboard/grants" },
          { label: "Grant", href: `/dashboard/grants/${grantId}` },
          { label: "Report" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Generate Report</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Export a compliance report with budget summary, expenses, and CFR citations.
        </p>
      </div>

      <Card>
        <CardTitle>Report Type</CardTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {([
            { value: "budget_summary" as const, label: "Budget Summary", desc: "SF-424A budget vs. actual" },
            { value: "monthly_breakdown" as const, label: "Monthly Breakdown", desc: "Expenses grouped by month" },
            { value: "expense_detail" as const, label: "Expense Detail", desc: "Full expense listing with CFR citations" },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setReportType(opt.value)}
              disabled={loading}
              aria-pressed={reportType === opt.value}
              className={`rounded-xl border-2 p-4 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 ${
                reportType === opt.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 shadow-soft-sm"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300 hover:shadow-soft-sm"
              }`}
            >
              <div className="text-sm font-bold">{opt.label}</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{opt.desc}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Report Format</CardTitle>
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => setFormat("pdf")}
            disabled={loading}
            aria-pressed={format === "pdf"}
            className={`flex-1 rounded-xl border-2 p-5 text-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 ${
              format === "pdf"
                ? "border-primary-500 bg-primary-50 text-primary-700 shadow-soft-sm dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-soft-sm dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
            }`}
          >
            <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <div className="text-sm font-bold dark:text-slate-300">PDF</div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Professional report</div>
          </button>
          <button
            onClick={() => setFormat("csv")}
            disabled={loading}
            aria-pressed={format === "csv"}
            className={`flex-1 rounded-xl border-2 p-5 text-center transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50 ${
              format === "csv"
                ? "border-primary-500 bg-primary-50 text-primary-700 shadow-soft-sm dark:bg-primary-900/20 dark:text-primary-300 dark:border-primary-700"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-soft-sm dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600"
            }`}
          >
            <svg className="mx-auto h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
            </svg>
            <div className="text-sm font-bold dark:text-slate-300">CSV</div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Spreadsheet export</div>
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle>Date Range (Optional)</CardTitle>
        <CardDescription>Leave empty to include all expenses.</CardDescription>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Input
            id="date_start"
            label="Start Date"
            type="date"
            disabled={loading}
            value={dateStart}
            onChange={(e) => { setDateStart(e.target.value); setDateError(null); }}
          />
          <Input
            id="date_end"
            label="End Date"
            type="date"
            disabled={loading}
            value={dateEnd}
            onChange={(e) => { setDateEnd(e.target.value); setDateError(null); }}
          />
        </div>
        {dateError && (
          <p className="mt-2 text-sm text-danger-600 dark:text-danger-400">{dateError}</p>
        )}
      </Card>

      <Card>
        <label className="flex items-center gap-3">
          <input
            id="include-pending"
            type="checkbox"
            checked={includePending}
            disabled={loading}
            onChange={(e) => setIncludePending(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
            aria-describedby="include-pending-desc"
          />
          <div>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Include pending expenses</span>
            <p id="include-pending-desc" className="text-xs text-slate-500 dark:text-slate-400">
              Include expenses still awaiting review (not yet confirmed).
            </p>
          </div>
        </label>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleGenerate} loading={loading} disabled={!!dateError} size="lg">
          Generate {format.toUpperCase()} Report
        </Button>
      </div>
    </div>
  );
}

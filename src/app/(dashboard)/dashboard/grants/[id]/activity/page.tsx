"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorCard } from "@/components/ui/error-card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { useUiStore } from "@/stores/ui-store";
import type { ActivityAction } from "@/lib/supabase/database.types";

interface ActivityEntry {
  id: string;
  action: ActivityAction;
  actor_email: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface ActivityResponse {
  activities: ActivityEntry[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "grant_created", label: "Grant Created" },
  { value: "grant_updated", label: "Grant Updated" },
  { value: "grant_deleted", label: "Grant Deleted" },
  { value: "expense_confirmed", label: "Expense Confirmed" },
  { value: "expense_excluded", label: "Expense Excluded" },
  { value: "expense_deleted", label: "Expense Deleted" },
  { value: "expenses_imported", label: "Expenses Imported" },
  { value: "bulk_confirmed", label: "Bulk Confirmed" },
  { value: "report_generated", label: "Report Generated" },
];

export default function GrantActivityPage() {
  const params = useParams();
  const grantId = params.id as string;
  const addToast = useUiStore((s) => s.addToast);

  const [data, setData] = useState<ActivityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [exporting, setExporting] = useState(false);

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const urlParams = new URLSearchParams({
        grant_id: grantId,
        page: page.toString(),
        per_page: "20",
      });
      if (searchQuery) urlParams.set("search", searchQuery);
      if (actionFilter) urlParams.set("action_type", actionFilter);
      if (dateStart) urlParams.set("date_start", dateStart);
      if (dateEnd) urlParams.set("date_end", dateEnd);

      const res = await fetch(`/api/activity?${urlParams}`);
      const ct = res.headers.get("content-type");
      if (!res.ok || !ct?.includes("application/json")) {
        throw new Error("Failed to load activity");
      }
      const json: ActivityResponse = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load activity");
    } finally {
      setLoading(false);
    }
  }, [grantId, page, searchQuery, actionFilter, dateStart, dateEnd]);

  useEffect(() => {
    const controller = new AbortController();
    fetchActivity();
    return () => controller.abort();
  }, [fetchActivity]);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [searchQuery, actionFilter, dateStart, dateEnd]);

  async function handleExportCSV() {
    setExporting(true);
    try {
      const urlParams = new URLSearchParams({
        grant_id: grantId,
        format: "csv",
      });
      if (searchQuery) urlParams.set("search", searchQuery);
      if (actionFilter) urlParams.set("action_type", actionFilter);
      if (dateStart) urlParams.set("date_start", dateStart);
      if (dateEnd) urlParams.set("date_end", dateEnd);

      const res = await fetch(`/api/activity?${urlParams}`);
      if (!res.ok) throw new Error("Export failed");

      const ct = res.headers.get("content-type");
      if (ct?.includes("text/csv")) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `activity-log-${grantId.slice(0, 8)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addToast({ type: "success", title: "Activity log exported" });
      } else {
        // Fallback: generate CSV client-side from current data
        if (data?.activities) {
          const rows = data.activities.map((a) =>
            [a.created_at, a.action, a.actor_email, JSON.stringify(a.details)].join(",")
          );
          const csv = ["Date,Action,Actor,Details", ...rows].join("\n");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const anchor = document.createElement("a");
          anchor.href = url;
          anchor.download = `activity-log-${grantId.slice(0, 8)}.csv`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          URL.revokeObjectURL(url);
          addToast({ type: "success", title: "Activity log exported" });
        }
      }
    } catch {
      addToast({ type: "error", title: "Failed to export activity log" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Grants", href: "/dashboard/grants" },
          { label: "Activity" },
        ]}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
            Activity Log
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Audit trail of actions taken on this grant.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCSV}
          loading={exporting}
        >
          <svg className="-ml-0.5 mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-wrap gap-3">
          <Input
            type="search"
            placeholder="Search by actor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="!py-1.5 !text-sm w-full sm:w-48"
            aria-label="Search activity"
          />
          <Select
            aria-label="Filter by action"
            options={ACTION_OPTIONS}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          />
          <input
            type="date"
            value={dateStart}
            onChange={(e) => setDateStart(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            aria-label="Start date"
          />
          <input
            type="date"
            value={dateEnd}
            onChange={(e) => setDateEnd(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            aria-label="End date"
          />
        </div>
      </Card>

      <Card>
        <div className="mt-2">
          {loading && !data ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-3/4" />
            </div>
          ) : error ? (
            <ErrorCard message={error} onRetry={fetchActivity} />
          ) : data ? (
            <>
              <ActivityTimeline
                activities={data.activities}
                emptyMessage={
                  searchQuery || actionFilter || dateStart || dateEnd
                    ? "No results match your filters."
                    : undefined
                }
              />

              {/* Pagination */}
              {data.total_pages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Page {data.page} of {data.total_pages} ({data.total} entries)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={page >= data.total_pages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
}

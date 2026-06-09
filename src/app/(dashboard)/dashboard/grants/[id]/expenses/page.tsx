"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorCard } from "@/components/ui/error-card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { SortableHeader, type SortDirection } from "@/components/ui/sortable-header";
import { CategoryPill } from "@/components/expenses/category-pill";
import { ConfidenceBadge } from "@/components/expenses/confidence-badge";
import { ThresholdWarning } from "@/components/expenses/threshold-warning";
import { SF424A_CATEGORIES } from "@/lib/constants/categories";
import { formatCurrency, formatDate } from "@/lib/constants/thresholds";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Alert } from "@/components/ui/alert";
import { Divider } from "@/components/ui/divider";
import { FormSection } from "@/components/ui/form-section";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { CurrencyInput } from "@/components/ui/currency-input";
import { useUiStore } from "@/stores/ui-store";
import { trackEvent } from "@/lib/posthog";
import type { Sf424aCategory, AiConfidence, ExpenseStatus, OmbFramework } from "@/lib/supabase/database.types";

interface Expense {
  id: string;
  date: string;
  vendor: string;
  description: string;
  amount: number;
  ai_category: Sf424aCategory | null;
  ai_confidence: AiConfidence | null;
  ai_cfr_citation: string | null;
  confirmed_category: Sf424aCategory | null;
  status: ExpenseStatus;
}

export default function ExpensesPage() {
  const params = useParams();
  const grantId = params.id as string;
  const addToast = useUiStore((s) => s.addToast);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [confidenceFilter, setConfidenceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortColumn, setSortColumn] = useState("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; vendor: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);
  const [ombFramework, setOmbFramework] = useState<OmbFramework | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Advanced filters
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [amountMin, setAmountMin] = useState<number | null>(null);
  const [amountMax, setAmountMax] = useState<number | null>(null);

  // Fetch grant's OMB framework for threshold warnings
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/grants/${grantId}/dashboard`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) return;
        const ct = res.headers.get("content-type");
        if (!ct?.includes("application/json")) return;
        return res.json();
      })
      .then((data) => {
        if (data?.ombFramework) setOmbFramework(data.ombFramework as OmbFramework);
      })
      .catch(() => {/* non-critical */});
    return () => controller.abort();
  }, [grantId]);

  const fetchExpenses = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setFetchError(null);
    try {
      const params = new URLSearchParams({
        grant_id: grantId,
        page: page.toString(),
        pageSize: "50",
        sort: sortColumn,
        dir: sortDirection,
      });
      if (statusFilter) params.set("status", statusFilter);
      if (confidenceFilter) params.set("confidence", confidenceFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (searchQuery) params.set("search", searchQuery);
      if (dateStart) params.set("date_start", dateStart);
      if (dateEnd) params.set("date_end", dateEnd);
      if (amountMin !== null) params.set("amount_min", amountMin.toString());
      if (amountMax !== null) params.set("amount_max", amountMax.toString());

      const res = await fetch(`/api/expenses?${params}`, { signal });
      if (!res.ok) throw new Error("Failed to load expenses");
      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error("Unexpected response format");
      }
      const data = await res.json();
      setExpenses(data.expenses || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setFetchError(err instanceof Error ? err.message : "Failed to load expenses");
      addToast({ type: "error", title: "Failed to load expenses" });
    } finally {
      setLoading(false);
    }
  }, [grantId, page, statusFilter, confidenceFilter, categoryFilter, searchQuery, sortColumn, sortDirection, dateStart, dateEnd, amountMin, amountMax, addToast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchExpenses(controller.signal);
    return () => controller.abort();
  }, [fetchExpenses]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [statusFilter, confidenceFilter, categoryFilter, searchQuery, sortColumn, sortDirection, dateStart, dateEnd, amountMin, amountMax]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  function handleSort(column: string) {
    if (sortColumn === column) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  async function handleConfirm(id: string, category: Sf424aCategory) {
    if (actionLoading) return;
    setActionLoading(id);

    // Optimistic update
    const previousExpenses = [...expenses];
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "confirmed" as const, confirmed_category: category } : e
      )
    );

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed_category: category }),
      });

      if (!res.ok) throw new Error("Failed to confirm expense");

      trackEvent("expense_confirmed", { expense_id: id, category });
      addToast({ type: "success", title: "Expense confirmed" });
    } catch {
      // Revert optimistic update
      setExpenses(previousExpenses);
      addToast({ type: "error", title: "Failed to confirm expense" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleExclude(id: string) {
    if (actionLoading) return;
    setActionLoading(id);

    // Optimistic update
    const previousExpenses = [...expenses];
    setExpenses((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: "excluded" as const } : e))
    );

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "excluded" }),
      });

      if (!res.ok) throw new Error("Failed to exclude expense");

      trackEvent("expense_excluded", { expense_id: id });
    } catch {
      // Revert optimistic update
      setExpenses(previousExpenses);
      addToast({ type: "error", title: "Failed to exclude expense" });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    // Optimistic update
    const previousExpenses = [...expenses];
    const previousTotal = total;
    setExpenses((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    setTotal((prev) => prev - 1);

    try {
      const res = await fetch(`/api/expenses/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete expense");

      trackEvent("expense_deleted", { expense_id: deleteTarget.id });
      addToast({ type: "success", title: "Expense deleted" });
    } catch {
      // Revert optimistic update
      setExpenses(previousExpenses);
      setTotal(previousTotal);
      addToast({ type: "error", title: "Failed to delete expense" });
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  async function handleBulkApproveHigh() {
    setBulkLoading(true);
    try {
      const res = await fetch("/api/expenses/bulk-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_id: grantId,
          filter: { confidence: "high" },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Bulk confirm failed");
      }

      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) throw new Error("Unexpected response format");
      const data = await res.json();
      trackEvent("bulk_approve", { grant_id: grantId, count: data.confirmed });
      addToast({
        type: "success",
        title: `${data.confirmed} expenses confirmed`,
      });
      fetchExpenses();
    } catch (err) {
      addToast({ type: "error", title: err instanceof Error ? err.message : "Bulk confirm failed" });
    } finally {
      setBulkLoading(false);
    }
  }

  const pendingCount = expenses.filter((e) => e.status === "pending_review").length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === expenses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(expenses.map((e) => e.id)));
    }
  }

  async function handleBulkExclude() {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selected).map((id) =>
        fetch(`/api/expenses/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "excluded" }),
        })
      );
      await Promise.all(promises);
      setExpenses((prev) =>
        prev.map((e) => selected.has(e.id) ? { ...e, status: "excluded" as const } : e)
      );
      addToast({ type: "success", title: `${selected.size} expenses excluded` });
      setSelected(new Set());
    } catch {
      addToast({ type: "error", title: "Failed to exclude expenses" });
    } finally {
      setBulkLoading(false);
    }
  }

  async function handleBulkDelete() {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const promises = Array.from(selected).map((id) =>
        fetch(`/api/expenses/${id}`, { method: "DELETE" })
      );
      await Promise.all(promises);
      setExpenses((prev) => prev.filter((e) => !selected.has(e.id)));
      setTotal((prev) => prev - selected.size);
      addToast({ type: "success", title: `${selected.size} expenses deleted` });
      setSelected(new Set());
    } catch {
      addToast({ type: "error", title: "Failed to delete expenses" });
    } finally {
      setBulkLoading(false);
    }
  }
  const highConfidenceCount = expenses.filter(
    (e) => e.status === "pending_review" && e.ai_confidence === "high"
  ).length;

  const categoryOptions = SF424A_CATEGORIES.filter((c) => c.value !== "total").map(
    (c) => ({ value: c.value, label: c.label })
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Grants", href: "/dashboard/grants" },
          { label: "Grant", href: `/dashboard/grants/${grantId}` },
          { label: "Expenses" },
        ]}
      />
      {/* AI Credibility Banner */}
      <Alert variant="info" dismissible>
        AI-assisted classification &mdash; always review before finalizing for audit compliance.
      </Alert>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Expenses</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">
            {total} total expenses. {pendingCount} pending review.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {highConfidenceCount > 0 && (
            <Button
              variant="secondary"
              onClick={handleBulkApproveHigh}
              loading={bulkLoading}
            >
              Approve All High Confidence ({highConfidenceCount})
            </Button>
          )}
          <Link href={`/dashboard/grants/${grantId}/import`}>
            <Button>Import expenses</Button>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <Card padding="sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
          <Input
            type="search"
            placeholder="Search vendor or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="!py-1.5 !text-sm w-full sm:w-64"
            aria-label="Search expenses"
          />
          <div className="w-full sm:w-auto">
            <Select
              aria-label="Filter by status"
              options={[
                { value: "", label: "All Statuses" },
                { value: "pending_review", label: "Pending Review" },
                { value: "confirmed", label: "Confirmed" },
                { value: "excluded", label: "Excluded" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select
              aria-label="Filter by confidence"
              options={[
                { value: "", label: "All Confidence" },
                { value: "high", label: "High" },
                { value: "medium", label: "Medium" },
                { value: "low", label: "Low" },
              ]}
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-auto">
            <Select
              aria-label="Filter by category"
              options={[
                { value: "", label: "All Categories" },
                ...SF424A_CATEGORIES.filter((c) => c.value !== "total").map(
                  (c) => ({ value: c.value, label: c.label })
                ),
              ]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
        </div>

        {/* Advanced Filters */}
        <FormSection
          title="Advanced Filters"
          collapsible
          defaultOpen={false}
          className="mt-4 border-b-0 pb-0"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <DateRangePicker
              label="Date range"
              startDate={dateStart}
              endDate={dateEnd}
              onChange={({ startDate, endDate }) => {
                setDateStart(startDate);
                setDateEnd(endDate);
              }}
            />
            <div>
              <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Amount range</p>
              <div className="flex items-center gap-2">
                <CurrencyInput
                  value={amountMin}
                  onChange={setAmountMin}
                  aria-label="Minimum amount"
                />
                <span className="text-sm text-slate-400 select-none" aria-hidden="true">&ndash;</span>
                <CurrencyInput
                  value={amountMax}
                  onChange={setAmountMax}
                  aria-label="Maximum amount"
                />
              </div>
            </div>
          </div>
        </FormSection>
      </Card>

      {fetchError ? (
        <ErrorCard message={fetchError} onRetry={() => fetchExpenses()} />
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="card" className="h-16" />
          ))}
        </div>
      ) : expenses.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185zM9.75 9h.008v.008H9.75V9zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm4.125 4.5h.008v.008h-.008V13.5zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          }
          title="No expenses found"
          description="Import expenses from CSV, QuickBooks, or Xero to get started."
          action={
            <Link href={`/dashboard/grants/${grantId}/import`}>
              <Button variant="secondary">Import Expenses</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full table-fixed divide-y divide-slate-200">
              <caption className="sr-only">Grant expenses</caption>
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th scope="col" className="w-10 px-2 py-2.5">
                    <input
                      type="checkbox"
                      checked={expenses.length > 0 && selected.size === expenses.length}
                      onChange={toggleSelectAll}
                      aria-label="Select all expenses"
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                  <SortableHeader label="Date" column="date" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Vendor" column="vendor" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                  <th scope="col" className="px-2 py-2.5 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Description</th>
                  <SortableHeader label="Amount" column="amount" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} align="right" />
                  <SortableHeader label="Category" column="ai_category" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="Confidence" column="ai_confidence" currentSort={sortColumn} currentDirection={sortDirection} onSort={handleSort} className="hidden lg:table-cell" />
                  <th scope="col" className="hidden lg:table-cell px-2 py-2.5 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">CFR</th>
                  <th scope="col" className="px-2 py-2.5 text-left text-xs font-medium uppercase text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                {expenses.map((exp) => (
                  <tr key={exp.id} className={`${exp.status === "excluded" ? "opacity-50" : ""} ${selected.has(exp.id) ? "bg-primary-50/30 dark:bg-primary-900/20" : ""}`}>
                    <td className="w-10 px-2 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.has(exp.id)}
                        onChange={() => toggleSelect(exp.id)}
                        aria-label={`Select expense from ${exp.vendor}`}
                        className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-sm text-slate-700 dark:text-slate-300">
                      {formatDate(exp.date)}
                    </td>
                    <td className="px-2 py-2.5 text-sm text-slate-700 dark:text-slate-300 max-w-[120px] truncate" title={exp.vendor}>{exp.vendor}</td>
                    <td className="px-2 py-2.5 text-sm text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={exp.description}>{exp.description}</td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-right text-sm font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex flex-col items-end gap-1">
                        {formatCurrency(exp.amount)}
                        {ombFramework && (
                          <ThresholdWarning
                            amount={exp.amount}
                            framework={ombFramework}
                            category={exp.confirmed_category ?? exp.ai_category}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2.5">
                      <CategoryPill category={exp.confirmed_category ?? exp.ai_category ?? "other"} />
                    </td>
                    <td className="hidden lg:table-cell px-2 py-2.5">
                      <ConfidenceBadge confidence={exp.ai_confidence} />
                    </td>
                    <td className="hidden lg:table-cell px-2 py-2.5 text-xs text-slate-500 dark:text-slate-400">{exp.ai_cfr_citation}</td>
                    <td className="px-2 py-2.5">
                      {exp.status === "pending_review" && (
                        <div className="flex flex-wrap items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleConfirm(exp.id, exp.ai_category ?? "other")}
                            disabled={actionLoading === exp.id}
                            className="rounded-lg bg-success-50 px-2.5 py-1.5 text-xs font-medium text-success-700 hover:bg-success-100 dark:bg-success-900/30 dark:text-success-400 dark:hover:bg-success-900/50 disabled:opacity-50"
                            aria-label={`Approve expense from ${exp.vendor}`}
                          >
                            {actionLoading === exp.id ? "..." : "Approve"}
                          </button>
                          <select
                            aria-label={`Re-categorize expense from ${exp.vendor}`}
                            defaultValue=""
                            onChange={(e) => {
                              if (e.target.value) handleConfirm(exp.id, e.target.value as Sf424aCategory);
                              e.target.value = "";
                            }}
                            className="w-auto max-w-[100px] rounded-lg border border-slate-300 px-1.5 py-1 text-xs dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          >
                            <option value="" disabled>Re-cat</option>
                            {categoryOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleExclude(exp.id)}
                            disabled={actionLoading === exp.id}
                            className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600 disabled:opacity-50"
                            aria-label={`Exclude expense from ${exp.vendor}`}
                          >
                            Exclude
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: exp.id, vendor: exp.vendor })}
                            disabled={actionLoading === exp.id}
                            className="rounded-lg bg-danger-50 px-2.5 py-1.5 text-xs font-medium text-danger-600 hover:bg-danger-100 dark:bg-danger-900/30 dark:text-danger-400 dark:hover:bg-danger-900/50 disabled:opacity-50"
                            aria-label={`Delete expense from ${exp.vendor}`}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                      {exp.status === "confirmed" && (
                        <Badge variant="success">Confirmed</Badge>
                      )}
                      {exp.status === "excluded" && (
                        <Badge variant="default">Excluded</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {expenses.map((exp) => (
              <Card key={exp.id} padding="sm" className={exp.status === "excluded" ? "opacity-50" : ""}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{exp.vendor}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{exp.description}</p>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(exp.amount)}</p>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{formatDate(exp.date)}</span>
                  <CategoryPill category={exp.confirmed_category ?? exp.ai_category ?? "other"} />
                  <ConfidenceBadge confidence={exp.ai_confidence} />
                </div>
                {exp.status === "pending_review" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirm(exp.id, exp.ai_category ?? "other")}
                      disabled={actionLoading === exp.id}
                      className="flex-1 rounded bg-success-50 px-3 py-2.5 text-xs font-medium text-success-700 min-h-[44px] dark:bg-success-900/30 dark:text-success-400 disabled:opacity-50"
                      aria-label={`Approve expense from ${exp.vendor}`}
                    >
                      {actionLoading === exp.id ? "..." : "Approve"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExclude(exp.id)}
                      disabled={actionLoading === exp.id}
                      className="rounded bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-500 min-h-[44px] dark:bg-slate-700 dark:text-slate-400 disabled:opacity-50"
                      aria-label={`Exclude expense from ${exp.vendor}`}
                    >
                      Exclude
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: exp.id, vendor: exp.vendor })}
                      disabled={actionLoading === exp.id}
                      className="rounded bg-danger-50 px-3 py-2.5 text-xs font-medium text-danger-600 min-h-[44px] dark:bg-danger-900/30 dark:text-danger-400 disabled:opacity-50"
                      aria-label={`Delete expense from ${exp.vendor}`}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Page {page} of {totalPages} ({total} expenses)
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
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </nav>
          )}
        </>
      )}

      {/* Floating bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-20 left-1/2 z-modal -translate-x-1/2 flex max-w-[calc(100vw-2rem)] items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-lg md:bottom-6 dark:border-slate-700 dark:bg-slate-800">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {selected.size} selected
          </span>
          <Divider orientation="vertical" className="h-5" />
          <Button
            size="sm"
            variant="secondary"
            onClick={handleBulkExclude}
            loading={bulkLoading}
          >
            Exclude
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={handleBulkDelete}
            loading={bulkLoading}
          >
            Delete
          </Button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="rounded-md p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Clear selection"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Expense"
        message={deleteTarget ? `Delete the expense from "${deleteTarget.vendor}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardTitle } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { BudgetTable } from "./budget-table";
import { ThresholdCard } from "./threshold-card";
import { FrameworkBadge } from "./framework-badge";
import { getFrameworkFromDate } from "@/lib/constants/thresholds";
import type { OmbFramework, Sf424aCategory } from "@/lib/supabase/database.types";
import { useUiStore } from "@/stores/ui-store";
import { trackEvent } from "@/lib/posthog";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";

interface GrantFormProps {
  initialData?: {
    id: string;
    name: string;
    funding_agency: string;
    cfda_number: string | null;
    award_number: string | null;
    award_date: string;
    period_start: string;
    period_end: string;
    total_amount: number;
    omb_framework: OmbFramework;
    budgets: { category: Sf424aCategory; budgeted_amount: number }[];
  };
  onSuccess?: (grantId: string) => void;
}

export function GrantForm({ initialData, onSuccess }: GrantFormProps) {
  const router = useRouter();
  const addToast = useUiStore((s) => s.addToast);
  const [loading, setLoading] = useState(false);
  const { isDirty, setDirty, resetDirty } = useUnsavedChanges();

  const [form, setForm] = useState({
    name: initialData?.name || "",
    funding_agency: initialData?.funding_agency || "",
    cfda_number: initialData?.cfda_number || "",
    award_number: initialData?.award_number || "",
    award_date: initialData?.award_date || "",
    period_start: initialData?.period_start || "",
    period_end: initialData?.period_end || "",
    total_amount: initialData?.total_amount || 0,
  });

  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    if (initialData?.budgets) {
      return Object.fromEntries(
        initialData.budgets
          .filter((b) => b.category !== "total")
          .map((b) => [b.category, b.budgeted_amount])
      );
    }
    return {};
  });

  const framework: OmbFramework | null = form.award_date
    ? getFrameworkFromDate(form.award_date)
    : null;

  function updateForm(updater: (prev: typeof form) => typeof form) {
    setForm(updater);
    setDirty();
  }

  function updateBudgets(updater: (prev: Record<string, number>) => Record<string, number>) {
    setBudgets(updater);
    setDirty();
  }

  function handleBudgetChange(category: string, amount: number) {
    updateBudgets((prev) => ({ ...prev, [category]: amount }));
  }

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (form.period_start && form.period_end && form.period_start >= form.period_end) {
      newErrors.period_end = "Period end must be after period start";
    }

    if (form.award_date && form.period_start && form.period_start < form.award_date) {
      newErrors.period_start = "Period cannot start before the award date";
    }

    const budgetSum = Object.values(budgets).reduce((s, v) => s + (v || 0), 0);
    if (form.total_amount > 0 && budgetSum > form.total_amount) {
      newErrors.budgets = `Budget total ($${budgetSum.toLocaleString()}) exceeds award amount ($${form.total_amount.toLocaleString()})`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const url = initialData
        ? `/api/grants/${initialData.id}`
        : "/api/grants";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, budgets }),
      });

      if (!res.ok) {
        let error = "Failed to save grant";
        try { const data = await res.json(); error = data.error || error; } catch {}
        throw new Error(error);
      }

      let grant: { id: string };
      try {
        grant = await res.json();
      } catch {
        throw new Error("Received invalid response from server");
      }
      trackEvent(initialData ? "grant_updated" : "grant_created", {
        grant_id: grant.id,
        total_amount: form.total_amount,
      });
      addToast({
        type: "success",
        title: initialData ? "Grant updated" : "Grant created",
      });
      resetDirty();
      if (onSuccess) {
        onSuccess(grant.id);
      } else {
        router.push(`/dashboard/grants/${grant.id}`);
        router.refresh();
      }
    } catch (err) {
      addToast({
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to save grant",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardTitle>Grant Details</CardTitle>

        {/* Identification */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Identification</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Input
              id="name"
              label="Grant Name"
              required
              disabled={loading}
              value={form.name}
              onChange={(e) => updateForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g., HUD Community Development"
            />
            <Input
              id="funding_agency"
              label="Funding Agency"
              required
              disabled={loading}
              value={form.funding_agency}
              onChange={(e) => updateForm((p) => ({ ...p, funding_agency: e.target.value }))}
              placeholder="e.g., Dept. of Housing & Urban Development"
            />
            <Input
              id="cfda_number"
              label="CFDA Number"
              hint="Catalog of Federal Domestic Assistance number"
              disabled={loading}
              value={form.cfda_number}
              onChange={(e) => updateForm((p) => ({ ...p, cfda_number: e.target.value }))}
              placeholder="e.g., 14.218"
            />
            <Input
              id="award_number"
              label="Award Number"
              disabled={loading}
              value={form.award_number}
              onChange={(e) => updateForm((p) => ({ ...p, award_number: e.target.value }))}
              placeholder="e.g., B-24-MC-01-0001"
            />
          </div>
        </div>

        {/* Dates & Amount */}
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Dates & Amount</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <Input
                id="award_date"
                label="Award Date"
                hint="determines pre/post Oct 2024 OMB rules"
                type="date"
                required
                disabled={loading}
                value={form.award_date}
                onChange={(e) => updateForm((p) => ({ ...p, award_date: e.target.value }))}
              />
              {framework && (
                <div className="mt-2">
                  <FrameworkBadge framework={framework} />
                </div>
              )}
            </div>
            <Input
              id="total_amount"
              label="Total Award Amount"
              hint="total federal award"
              type="number"
              min="0"
              step="0.01"
              required
              disabled={loading}
              value={form.total_amount || ""}
              onChange={(e) => updateForm((p) => ({ ...p, total_amount: parseFloat(e.target.value) || 0 }))}
            />
            <Input
              id="period_start"
              label="Period Start"
              type="date"
              required
              disabled={loading}
              value={form.period_start}
              onChange={(e) => updateForm((p) => ({ ...p, period_start: e.target.value }))}
              error={errors.period_start}
            />
            <Input
              id="period_end"
              label="Period End"
              type="date"
              required
              disabled={loading}
              value={form.period_end}
              onChange={(e) => updateForm((p) => ({ ...p, period_end: e.target.value }))}
              error={errors.period_end}
            />
          </div>
        </div>
      </Card>

      {framework && <ThresholdCard framework={framework} />}

      <Card>
        <CardTitle>Budget Allocation (SF-424A Categories)</CardTitle>
        {errors.budgets && (
          <p className="mt-2 text-sm text-danger-600 dark:text-danger-400">{errors.budgets}</p>
        )}
        <div className="mt-4">
          <BudgetTable
            budgets={budgets}
            onChange={handleBudgetChange}
            totalAmount={form.total_amount}
            disabled={loading}
          />
        </div>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
        {isDirty && (
          <span className="text-xs text-warning-600 dark:text-warning-400 sm:mr-auto flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            Unsaved changes
          </span>
        )}
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {initialData ? "Update Grant" : "Create Grant"}
        </Button>
      </div>
    </form>
  );
}

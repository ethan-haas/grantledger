"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SF424A_CATEGORIES } from "@/lib/constants/categories";
import { formatCurrency } from "@/lib/constants/thresholds";
import { Input } from "@/components/ui/input";
import { InfoPopover } from "@/components/ui/info-popover";
import { CATEGORY_HELP } from "@/lib/constants/category-help";

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface BudgetTableProps {
  budgets: Record<string, number>;
  onChange?: (category: string, amount: number) => void;
  onInlineSave?: (budgets: Record<string, number>) => Promise<void>;
  totalAmount?: number;
  readOnly?: boolean;
  inlineEditable?: boolean;
  disabled?: boolean;
}

export function BudgetTable({ budgets, onChange, onInlineSave, totalAmount, readOnly, inlineEditable, disabled }: BudgetTableProps) {
  const categories = SF424A_CATEGORIES.filter((c) => c.value !== "total");
  const [localBudgets, setLocalBudgets] = useState(budgets);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external changes
  useEffect(() => {
    setLocalBudgets(budgets);
  }, [budgets]);

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const total = categories.reduce((sum, c) => sum + (localBudgets[c.value] || 0), 0);
  const overBudget = totalAmount != null && total > totalAmount;

  const debouncedSave = useCallback(
    (updated: Record<string, number>) => {
      if (!onInlineSave) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaveStatus("saving");
        try {
          await onInlineSave(updated);
          setSaveStatus("saved");
          setTimeout(() => setSaveStatus("idle"), 2000);
        } catch {
          setSaveStatus("error");
          setTimeout(() => setSaveStatus("idle"), 3000);
        }
      }, 800);
    },
    [onInlineSave]
  );

  function handleInlineChange(category: string, amount: number) {
    const updated = { ...localBudgets, [category]: amount };
    setLocalBudgets(updated);
    onChange?.(category, amount);
    if (inlineEditable) {
      debouncedSave(updated);
    }
  }

  const isEditable = inlineEditable || (!readOnly && onChange);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
        <caption className="sr-only">Grant budget allocation by SF-424A category</caption>
        <thead className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Category
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Budget Amount
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
          {categories.map((cat) => (
            <tr key={cat.value}>
              <td className="px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{cat.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{cat.description}</div>
                  </div>
                  {CATEGORY_HELP[cat.value] && (
                    <InfoPopover title={cat.label}>
                      <p>{CATEGORY_HELP[cat.value].definition}</p>
                      <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">Examples:</p>
                      <ul className="mt-1 list-disc pl-4 space-y-0.5">
                        {CATEGORY_HELP[cat.value].examples.map((ex) => (
                          <li key={ex}>{ex}</li>
                        ))}
                      </ul>
                      <p className="mt-2 font-semibold text-slate-700 dark:text-slate-200">Common mistakes:</p>
                      <ul className="mt-1 list-disc pl-4 space-y-0.5">
                        {CATEGORY_HELP[cat.value].commonMistakes.map((m) => (
                          <li key={m}>{m}</li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">{CATEGORY_HELP[cat.value].cfrReference}</p>
                    </InfoPopover>
                  )}
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                {readOnly && !inlineEditable ? (
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {formatCurrency(localBudgets[cat.value] || 0)}
                  </span>
                ) : (
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={localBudgets[cat.value] || ""}
                    onChange={(e) =>
                      handleInlineChange(cat.value, parseFloat(e.target.value) || 0)
                    }
                    disabled={disabled}
                    aria-label={`Budget amount for ${cat.label}`}
                    className="w-full sm:w-32 text-right"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-50 dark:bg-slate-800">
          <tr>
            <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <div className="flex items-center gap-2">
                Total
                {inlineEditable && saveStatus !== "idle" && (
                  <span className={`text-xs font-normal ${
                    saveStatus === "saving" ? "text-slate-400" :
                    saveStatus === "saved" ? "text-success-500" :
                    "text-danger-500"
                  }`}>
                    {saveStatus === "saving" ? "Saving..." :
                     saveStatus === "saved" ? "Saved" :
                     "Save failed"}
                  </span>
                )}
              </div>
            </td>
            <td
              className={`px-4 py-3 text-right text-sm font-semibold ${
                overBudget ? "text-danger-600 dark:text-danger-400" : "text-slate-900 dark:text-slate-100"
              }`}
            >
              {formatCurrency(total)}
              {totalAmount != null && (
                <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                  of {formatCurrency(totalAmount)}
                </span>
              )}
            </td>
          </tr>
          {overBudget && (
            <tr>
              <td colSpan={2} className="px-4 py-2 text-xs text-danger-600 dark:text-danger-400">
                Budget allocation exceeds total grant amount by{" "}
                {formatCurrency(total - (totalAmount || 0))}
              </td>
            </tr>
          )}
        </tfoot>
      </table>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/dropdown-menu";
import { SF424A_CATEGORIES } from "@/lib/constants/categories";
import type { Sf424aCategory } from "@/lib/supabase/database.types";

interface InlineCategoryEditorProps {
  expenseId: string;
  currentCategory: Sf424aCategory;
  onUpdate: (expenseId: string, category: Sf424aCategory) => Promise<void>;
  className?: string;
}

const categoryColors: Record<string, string> = {
  personnel: "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
  fringe_benefits: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400",
  travel: "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
  equipment: "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
  supplies: "bg-teal-50 text-teal-700 dark:bg-teal-900/20 dark:text-teal-400",
  contractual: "bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
  construction: "bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
  other: "bg-slate-50 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
  indirect_charges: "bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400",
  total: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
};

export function InlineCategoryEditor({
  expenseId,
  currentCategory,
  onUpdate,
  className = "",
}: InlineCategoryEditorProps) {
  const [saving, setSaving] = useState(false);
  const label =
    SF424A_CATEGORIES.find((c) => c.value === currentCategory)?.label ?? currentCategory;
  const colorClass = categoryColors[currentCategory] ?? categoryColors.other;

  const categories = SF424A_CATEGORIES.filter((c) => c.value !== "total");

  async function handleSelect(value: string) {
    if (value === currentCategory || saving) return;
    setSaving(true);
    try {
      await onUpdate(expenseId, value as Sf424aCategory);
    } finally {
      setSaving(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownTrigger
        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer hover:ring-2 hover:ring-primary-200 dark:hover:ring-primary-800 ${colorClass} ${saving ? "opacity-60" : ""} ${className}`}
      >
        {saving ? (
          <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : null}
        {label}
        <svg className="h-3 w-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </DropdownTrigger>
      <DropdownContent align="start" className="max-h-60 overflow-y-auto">
        {categories.map((cat) => (
          <DropdownItem
            key={cat.value}
            onSelect={() => handleSelect(cat.value)}
          >
            <span className={cat.value === currentCategory ? "font-semibold" : ""}>
              {cat.label}
            </span>
            {cat.value === currentCategory && (
              <svg className="ml-auto h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            )}
          </DropdownItem>
        ))}
      </DropdownContent>
    </DropdownMenu>
  );
}

import React from "react";
import { CATEGORY_COLORS, SF424A_CATEGORIES } from "@/lib/constants/categories";
import type { Sf424aCategory } from "@/lib/supabase/database.types";

interface CategoryPillProps {
  category: Sf424aCategory | null;
}

export const CategoryPill = React.memo(function CategoryPill({ category }: CategoryPillProps) {
  if (!category) return <span className="text-xs text-slate-400 dark:text-slate-500">Uncategorized</span>;

  const label = SF424A_CATEGORIES.find((c) => c.value === category)?.label || category;
  const colors = CATEGORY_COLORS[category] || "bg-slate-100 text-slate-800";

  return (
    <span
      aria-label={`Category: ${label}`}
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors}`}
    >
      {label}
    </span>
  );
});

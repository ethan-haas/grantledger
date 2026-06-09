"use client";

import { Chip, ChipGroup } from "@/components/ui/chip";

interface Filter {
  key: string;
  label: string;
  value: string;
}

interface ActiveFiltersProps {
  filters: Filter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
  className = "",
}: ActiveFiltersProps) {
  if (filters.length === 0) return null;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Filters:</span>
      <ChipGroup>
        {filters.map((filter) => (
          <Chip
            key={filter.key}
            variant="info"
            removable
            onRemove={() => onRemove(filter.key)}
          >
            {filter.label}: {filter.value}
          </Chip>
        ))}
      </ChipGroup>
      {filters.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

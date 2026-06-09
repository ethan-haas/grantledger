"use client";

export type SortDirection = "asc" | "desc";

interface SortableHeaderProps {
  label: string;
  column: string;
  currentSort: string;
  currentDirection: SortDirection;
  onSort: (column: string) => void;
  className?: string;
  align?: "left" | "right";
}

export function SortableHeader({
  label,
  column,
  currentSort,
  currentDirection,
  onSort,
  className = "",
  align = "left",
}: SortableHeaderProps) {
  const isActive = currentSort === column;
  const ariaSortValue = isActive
    ? currentDirection === "asc"
      ? "ascending"
      : "descending"
    : "none";

  return (
    <th
      scope="col"
      className={`px-2 py-2.5 text-xs font-medium uppercase text-slate-500 dark:text-slate-400 ${
        align === "right" ? "text-right" : "text-left"
      } ${className}`}
      aria-sort={ariaSortValue as "ascending" | "descending" | "none"}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="group inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 rounded"
      >
        {label}
        <span className="flex flex-col" aria-hidden="true">
          <svg
            className={`h-2.5 w-2.5 -mb-0.5 ${
              isActive && currentDirection === "asc"
                ? "text-primary-600"
                : "text-slate-300 group-hover:text-slate-400 dark:text-slate-600 dark:group-hover:text-slate-500"
            }`}
            viewBox="0 0 10 5"
            fill="currentColor"
          >
            <path d="M5 0l5 5H0z" />
          </svg>
          <svg
            className={`h-2.5 w-2.5 -mt-0.5 ${
              isActive && currentDirection === "desc"
                ? "text-primary-600"
                : "text-slate-300 group-hover:text-slate-400 dark:text-slate-600 dark:group-hover:text-slate-500"
            }`}
            viewBox="0 0 10 5"
            fill="currentColor"
          >
            <path d="M0 0h10L5 5z" />
          </svg>
        </span>
      </button>
    </th>
  );
}

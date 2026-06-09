"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";

/* ─── Types ──────────────────────────────────────────────────── */

interface Column<T> {
  id: string;
  header: string | ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  hidden?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  expandable?: boolean;
  renderExpanded?: (row: T) => ReactNode;
  stickyHeader?: boolean;
  emptyMessage?: string;
  className?: string;
}

/* ─── Component ──────────────────────────────────────────────── */

export function DataTable<T>({
  data,
  columns,
  getRowId,
  selectable = false,
  selectedIds,
  onSelectionChange,
  expandable = false,
  renderExpanded,
  stickyHeader = false,
  emptyMessage = "No data found",
  className = "",
}: DataTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const visibleColumns = columns.filter((col) => !col.hidden);

  const selection = useMemo(() => selectedIds ?? new Set<string>(), [selectedIds]);

  const toggleSelection = useCallback(
    (id: string) => {
      const next = new Set(selection);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onSelectionChange?.(next);
    },
    [selection, onSelectionChange]
  );

  const toggleSelectAll = useCallback(() => {
    if (selection.size === data.length) {
      onSelectionChange?.(new Set());
    } else {
      onSelectionChange?.(new Set(data.map(getRowId)));
    }
  }, [selection, data, getRowId, onSelectionChange]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const colCount =
    visibleColumns.length +
    (selectable ? 1 : 0) +
    (expandable ? 1 : 0);

  return (
    <div className={`overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700 ${className}`}>
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
        <thead className={`bg-slate-50 dark:bg-slate-800/50 ${stickyHeader ? "sticky top-0 z-10" : ""}`}>
          <tr>
            {selectable && (
              <th scope="col" className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={data.length > 0 && selection.size === data.length}
                  onChange={toggleSelectAll}
                  aria-label="Select all rows"
                  className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
                />
              </th>
            )}
            {expandable && <th scope="col" className="w-10 px-3 py-3" />}
            {visibleColumns.map((col) => (
              <th
                key={col.id}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
          {data.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const id = getRowId(row);
              const isSelected = selection.has(id);
              const isExpanded = expandedRows.has(id);

              return (
                <DataTableRow
                  key={id}
                  row={row}
                  id={id}
                  columns={visibleColumns}
                  selectable={selectable}
                  isSelected={isSelected}
                  onToggleSelect={toggleSelection}
                  expandable={expandable}
                  isExpanded={isExpanded}
                  onToggleExpand={toggleExpand}
                  renderExpanded={renderExpanded}
                  colCount={colCount}
                />
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Row ────────────────────────────────────────────────────── */

interface DataTableRowProps<T> {
  row: T;
  id: string;
  columns: Column<T>[];
  selectable: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  expandable: boolean;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  renderExpanded?: (row: T) => ReactNode;
  colCount: number;
}

function DataTableRow<T>({
  row,
  id,
  columns,
  selectable,
  isSelected,
  onToggleSelect,
  expandable,
  isExpanded,
  onToggleExpand,
  renderExpanded,
  colCount,
}: DataTableRowProps<T>) {
  return (
    <>
      <tr
        className={`transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
          isSelected ? "bg-primary-50/30 dark:bg-primary-900/10" : ""
        }`}
      >
        {selectable && (
          <td className="w-10 px-3 py-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggleSelect(id)}
              aria-label={`Select row ${id}`}
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:border-slate-600 dark:bg-slate-800"
            />
          </td>
        )}
        {expandable && (
          <td className="w-10 px-3 py-3">
            <button
              type="button"
              onClick={() => onToggleExpand(id)}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse row" : "Expand row"}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </td>
        )}
        {columns.map((col) => (
          <td key={col.id} className={`px-4 py-3 ${col.className ?? ""}`}>
            {col.cell(row)}
          </td>
        ))}
      </tr>
      {expandable && isExpanded && renderExpanded && (
        <tr>
          <td colSpan={colCount} className="bg-slate-50/50 px-4 py-4 dark:bg-slate-800/30">
            {renderExpanded(row)}
          </td>
        </tr>
      )}
    </>
  );
}

"use client";

import { Select } from "@/components/ui/select";
import type { ColumnMapping } from "@/lib/csv/column-mapper";

interface ColumnMapperProps {
  headers: string[];
  mapping: ColumnMapping;
  onChange: (mapping: ColumnMapping) => void;
  previewRows: Record<string, string>[];
}

const REQUIRED_FIELDS = [
  { key: "date" as const, label: "Date" },
  { key: "vendor" as const, label: "Vendor" },
  { key: "description" as const, label: "Description" },
  { key: "amount" as const, label: "Amount" },
];

const OPTIONAL_FIELDS = [
  { key: "account" as const, label: "Account (optional)" },
];

export function ColumnMapper({ headers, mapping, onChange, previewRows }: ColumnMapperProps) {
  const headerOptions = headers.map((h) => ({ value: h, label: h }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {REQUIRED_FIELDS.map((field) => (
          <Select
            key={field.key}
            label={field.label}
            options={headerOptions}
            placeholder={`Select ${field.label} column`}
            value={mapping[field.key]}
            onChange={(e) =>
              onChange({ ...mapping, [field.key]: e.target.value })
            }
          />
        ))}
        {OPTIONAL_FIELDS.map((field) => (
          <Select
            key={field.key}
            label={field.label}
            options={[{ value: "", label: "None" }, ...headerOptions]}
            value={mapping[field.key] || ""}
            onChange={(e) =>
              onChange({ ...mapping, [field.key]: e.target.value || undefined })
            }
          />
        ))}
      </div>

      {previewRows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs">
            <caption className="sr-only">CSV column preview data</caption>
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                {headers.map((h) => (
                  <th key={h} scope="col" className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {previewRows.map((row, i) => (
                <tr key={i}>
                  {headers.map((h) => (
                    <td key={h} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                      {row[h]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

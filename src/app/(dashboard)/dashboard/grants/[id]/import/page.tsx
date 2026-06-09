"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ColumnMapper } from "@/components/expenses/column-mapper";
import { ImportProgress } from "@/components/expenses/import-progress";
import { StepIndicator } from "@/components/ui/step-indicator";
import { parseCSV, getPreviewRows, type ParsedCSV } from "@/lib/csv/parser";
import { mapColumns, type ColumnMapping } from "@/lib/csv/column-mapper";
import type { MappedExpense } from "@/lib/types/mapped-expense";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { formatCurrency } from "@/lib/constants/thresholds";
import { useUiStore } from "@/stores/ui-store";
import { trackEvent } from "@/lib/posthog";

type ImportStep = "upload" | "mapping" | "preview" | "progress" | "done";

const IMPORT_STEPS = [
  { label: "Upload" },
  { label: "Map Columns" },
  { label: "Preview" },
  { label: "Import" },
];

function getStepIndex(step: ImportStep): number {
  const map: Record<ImportStep, number> = { upload: 0, mapping: 1, preview: 2, progress: 3, done: 4 };
  return map[step];
}

export default function ImportPage() {
  const params = useParams();
  const router = useRouter();
  const addToast = useUiStore((s) => s.addToast);
  const grantId = params.id as string;

  const [step, setStep] = useState<ImportStep>("upload");
  const [parsed, setParsed] = useState<ParsedCSV | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    date: "", vendor: "", description: "", amount: "",
  });
  const [mappedExpenses, setMappedExpenses] = useState<MappedExpense[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState<{ imported: number; categorized: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5_000_000) {
      addToast({ type: "error", title: "File too large", message: "CSV files must be under 5MB" });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      let data: ParsedCSV;
      try {
        data = parseCSV(text);
      } catch {
        addToast({ type: "error", title: "Failed to parse CSV", message: "The file could not be read as a valid CSV" });
        e.target.value = "";
        return;
      }
      setParsed(data);

      // Auto-map common column names
      const autoMap: ColumnMapping = { date: "", vendor: "", description: "", amount: "" };
      const lowerHeaders = data.headers.map((h) => h.toLowerCase());

      const dateIdx = lowerHeaders.findIndex((h) => h.includes("date"));
      const vendorIdx = lowerHeaders.findIndex((h) => h.includes("vendor") || h.includes("payee") || h.includes("name"));
      const descIdx = lowerHeaders.findIndex((h) => h.includes("description") || h.includes("memo") || h.includes("detail"));
      const amtIdx = lowerHeaders.findIndex((h) => h.includes("amount") || h.includes("total") || h.includes("debit"));
      const acctIdx = lowerHeaders.findIndex((h) => h.includes("account") || h.includes("category") || h.includes("class"));

      if (dateIdx >= 0) autoMap.date = data.headers[dateIdx];
      if (vendorIdx >= 0) autoMap.vendor = data.headers[vendorIdx];
      if (descIdx >= 0) autoMap.description = data.headers[descIdx];
      if (amtIdx >= 0) autoMap.amount = data.headers[amtIdx];
      if (acctIdx >= 0) autoMap.account = data.headers[acctIdx];

      setMapping(autoMap);
      setStep("mapping");
    };
    reader.readAsText(file);
  }, [addToast]);

  function handleMapComplete() {
    if (!parsed || !mapping.date || !mapping.vendor || !mapping.description || !mapping.amount) {
      addToast({ type: "error", title: "Please map all required columns" });
      return;
    }

    const mapped = mapColumns(parsed.rows, mapping);
    setMappedExpenses(mapped);
    setStep("preview");
  }

  async function handleImport() {
    if (importing) return;
    abortRef.current = new AbortController();
    setImporting(true);
    setStep("progress");
    setProgress({ current: 0, total: mappedExpenses.length });

    try {
      const res = await fetch("/api/expenses/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_id: grantId,
          expenses: mappedExpenses,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        let error = "Import failed";
        try { const data = await res.json(); error = data.error || error; } catch {}
        throw new Error(error);
      }

      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) throw new Error("Unexpected response format");
      const data = await res.json();
      setResult(data);
      setProgress({ current: data.categorized, total: data.imported });
      setStep("done");
      trackEvent("expenses_imported", {
        grant_id: grantId,
        count: data.imported,
        categorized: data.categorized,
      });
      addToast({
        type: "success",
        title: `Imported ${data.imported} expenses`,
        message: `${data.categorized} categorized by AI`,
      });
    } catch (err) {
      addToast({
        type: "error",
        title: "Import failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
      setStep("preview");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Breadcrumbs
        items={[
          { label: "Grants", href: "/dashboard/grants" },
          { label: "Grant", href: `/dashboard/grants/${grantId}` },
          { label: "Import" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Import Expenses</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Upload a CSV file to import and categorize expenses.</p>
      </div>

      {/* Step indicators */}
      <StepIndicator steps={IMPORT_STEPS} currentStep={getStepIndex(step)} />

      {step === "upload" && (
        <Card>
          <CardTitle>Upload CSV File</CardTitle>
          <div className="mt-4">
            <label
              htmlFor="csv-upload"
              className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-16 transition-all duration-200 ${
                dragOver
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-soft-sm"
                  : "border-slate-300 hover:border-primary-400 hover:bg-primary-50/50 dark:border-slate-600 dark:hover:border-primary-500"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file && file.size > 5_000_000) {
                  addToast({ type: "error", title: "File too large", message: "CSV files must be under 5MB" });
                  return;
                }
                if (file?.name.endsWith(".csv")) {
                  const input = e.currentTarget.querySelector("input") as HTMLInputElement;
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  input.files = dt.files;
                  input.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }}
            >
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition-colors duration-200 ${
                dragOver ? "bg-primary-100 dark:bg-primary-900/30" : "bg-slate-100 dark:bg-slate-700"
              }`}>
                <svg className={`h-7 w-7 ${dragOver ? "text-primary-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Click to upload or drag and drop
              </span>
              <span className="mt-1 text-xs text-slate-400">CSV files up to 5MB</span>
              <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              CSV Format Help
            </summary>
            <div className="mt-3 rounded-lg bg-slate-50 p-4 text-xs text-slate-600 space-y-2 dark:bg-slate-800/50 dark:text-slate-400">
              <p><strong>Supported format:</strong> Standard CSV files (.csv) with a header row.</p>
              <p><strong>Required columns:</strong> Date, Vendor/Payee, Description, and Amount. Column names are auto-detected.</p>
              <p><strong>Optional columns:</strong> Account/Category/Class (used as additional context for AI categorization).</p>
              <p><strong>Deduplication:</strong> Expenses with matching date, vendor, amount, and description are automatically skipped to prevent duplicates.</p>
              <p><strong>Size limit:</strong> Files must be under 5MB.</p>
            </div>
          </details>
        </Card>
      )}

      {step === "mapping" && parsed && (
        <Card>
          <CardTitle>Map Columns</CardTitle>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Match your CSV columns to expense fields. Showing {Math.min(5, parsed.totalRows)} of {parsed.totalRows} rows.
          </p>
          <div className="mt-4">
            <ColumnMapper
              headers={parsed.headers}
              mapping={mapping}
              onChange={setMapping}
              previewRows={getPreviewRows(parsed)}
            />
          </div>
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep("upload")}>Back</Button>
            <Button onClick={handleMapComplete}>Preview mapped data</Button>
          </div>
        </Card>
      )}

      {step === "preview" && (
        <Card>
          <CardTitle>Preview Import</CardTitle>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {mappedExpenses.length} expenses ready to import. They will be categorized by AI after import.
          </p>
          {/* Mobile cards */}
          <div className="mt-4 max-h-96 space-y-2 overflow-y-auto md:hidden">
            {mappedExpenses.slice(0, 50).map((exp, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{exp.vendor}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{exp.description}</p>
                  <p className="text-xs text-slate-400">{exp.date}</p>
                </div>
                <p className="ml-3 flex-shrink-0 text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatCurrency(exp.amount)}</p>
              </div>
            ))}
            {mappedExpenses.length > 50 && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Showing 50 of {mappedExpenses.length} expenses
              </p>
            )}
          </div>

          {/* Desktop table */}
          <div className="mt-4 hidden md:block max-h-96 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Date</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Vendor</th>
                  <th scope="col" className="px-3 py-2 text-left font-medium text-slate-500 dark:text-slate-400">Description</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium text-slate-500 dark:text-slate-400">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {mappedExpenses.slice(0, 50).map((exp, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{exp.date}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{exp.vendor}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{exp.description}</td>
                    <td className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">{formatCurrency(exp.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mappedExpenses.length > 50 && (
              <p className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
                Showing 50 of {mappedExpenses.length} expenses
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button variant="secondary" onClick={() => setStep("mapping")}>Back</Button>
            <Button onClick={handleImport} disabled={importing}>
              Import {mappedExpenses.length} Expenses
            </Button>
          </div>
        </Card>
      )}

      {(step === "progress" || step === "done") && (
        <Card>
          <div className="flex items-center gap-3">
            {step === "done" ? (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success-100 dark:bg-success-900/30">
                <svg className="h-5 w-5 text-success-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
              </div>
            )}
            <CardTitle>{step === "done" ? "Import Complete" : "AI Categorizing..."}</CardTitle>
          </div>
          <div className="mt-4">
            <ImportProgress
              current={progress.current}
              total={progress.total}
              phase={step === "done" ? "done" : "categorizing"}
            />
          </div>
          {step === "done" && result && (
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setStep("upload");
                  setParsed(null);
                  setMappedExpenses([]);
                }}
              >
                Import More
              </Button>
              <Button
                onClick={() => router.push(`/dashboard/grants/${grantId}/expenses`)}
              >
                Review Expenses
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

import Papa from "papaparse";

export interface ParsedCSV {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export function parseCSV(text: string): ParsedCSV {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  return {
    headers: result.meta.fields || [],
    rows: result.data,
    totalRows: result.data.length,
  };
}

export function getPreviewRows(parsed: ParsedCSV, count = 5): Record<string, string>[] {
  return parsed.rows.slice(0, count);
}

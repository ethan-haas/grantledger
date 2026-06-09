/**
 * Generates human-readable diff strings from activity log details.
 * Used to show before/after values in the activity timeline.
 */

const FIELD_LABELS: Record<string, string> = {
  status: "Status",
  ai_category: "Category",
  confirmed_category: "Category",
  ai_confidence: "Confidence",
  amount: "Amount",
  vendor: "Vendor",
  description: "Description",
  grant_name: "Grant Name",
  award_amount: "Award Amount",
  omb_framework: "OMB Framework",
  role: "Role",
};

const STATUS_LABELS: Record<string, string> = {
  pending_review: "Pending Review",
  confirmed: "Confirmed",
  excluded: "Excluded",
};

function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number" && (key.includes("amount") || key === "amount")) {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (key === "status" && typeof value === "string") {
    return STATUS_LABELS[value] || value;
  }
  return String(value);
}

export interface DiffEntry {
  field: string;
  label: string;
  before: string;
  after: string;
}

export function getActivityDiffs(details: Record<string, unknown>): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  // Look for explicit before/after patterns
  const keys = Object.keys(details);
  const processedKeys = new Set<string>();

  keys.forEach((key) => {
    if (key.endsWith("_before") && !processedKeys.has(key)) {
      const field = key.replace(/_before$/, "");
      const afterKey = `${field}_after`;
      if (afterKey in details) {
        processedKeys.add(key);
        processedKeys.add(afterKey);
        diffs.push({
          field,
          label: FIELD_LABELS[field] || field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          before: formatValue(field, details[key]),
          after: formatValue(field, details[afterKey]),
        });
      }
    }
  });

  // Look for "old_*" and "new_*" pattern
  keys.forEach((key) => {
    if (key.startsWith("old_") && !processedKeys.has(key)) {
      const field = key.replace(/^old_/, "");
      const newKey = `new_${field}`;
      if (newKey in details) {
        processedKeys.add(key);
        processedKeys.add(newKey);
        diffs.push({
          field,
          label: FIELD_LABELS[field] || field.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          before: formatValue(field, details[key]),
          after: formatValue(field, details[newKey]),
        });
      }
    }
  });

  return diffs;
}

export function formatDiffString(diffs: DiffEntry[]): string {
  return diffs
    .map((d) => `${d.label}: ${d.before} → ${d.after}`)
    .join(", ");
}

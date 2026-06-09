import { describe, it, expect } from "vitest";
import { getActivityDiffs, formatDiffString } from "./activity-diff";

describe("getActivityDiffs", () => {
  it("extracts diffs from _before/_after pattern", () => {
    const details = {
      status_before: "pending_review",
      status_after: "confirmed",
    };
    const diffs = getActivityDiffs(details);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].field).toBe("status");
    expect(diffs[0].before).toBe("Pending Review");
    expect(diffs[0].after).toBe("Confirmed");
  });

  it("extracts diffs from old_/new_ pattern", () => {
    const details = {
      old_category: "equipment",
      new_category: "supplies",
    };
    const diffs = getActivityDiffs(details);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].field).toBe("category");
    expect(diffs[0].before).toBe("equipment");
    expect(diffs[0].after).toBe("supplies");
  });

  it("formats amount values as currency", () => {
    const details = {
      amount_before: 5000,
      amount_after: 7500,
    };
    const diffs = getActivityDiffs(details);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].before).toBe("$5,000.00");
    expect(diffs[0].after).toBe("$7,500.00");
  });

  it("handles null values gracefully", () => {
    const details = {
      category_before: null,
      category_after: "equipment",
    };
    const diffs = getActivityDiffs(details);
    expect(diffs).toHaveLength(1);
    expect(diffs[0].before).toBe("—");
    expect(diffs[0].after).toBe("equipment");
  });

  it("returns empty array for details without diff patterns", () => {
    const details = { count: 5, grant_name: "Test Grant" };
    const diffs = getActivityDiffs(details);
    expect(diffs).toHaveLength(0);
  });

  it("handles multiple diffs", () => {
    const details = {
      status_before: "pending_review",
      status_after: "confirmed",
      old_category: "equipment",
      new_category: "supplies",
    };
    const diffs = getActivityDiffs(details);
    expect(diffs).toHaveLength(2);
  });
});

describe("formatDiffString", () => {
  it("formats diffs as readable string", () => {
    const diffs = [
      { field: "status", label: "Status", before: "Pending Review", after: "Confirmed" },
      { field: "category", label: "Category", before: "Equipment", after: "Supplies" },
    ];
    const result = formatDiffString(diffs);
    expect(result).toBe("Status: Pending Review → Confirmed, Category: Equipment → Supplies");
  });

  it("returns empty string for empty diffs", () => {
    expect(formatDiffString([])).toBe("");
  });
});

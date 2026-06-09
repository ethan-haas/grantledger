import { describe, it, expect } from "vitest";
import { formatDate, formatPeriodDate } from "./thresholds";

describe("formatDate", () => {
  it("returns a formatted date string with month, day, and year", () => {
    // Use noon UTC to avoid timezone-shift issues
    const result = formatDate("2024-03-15T12:00:00Z");
    expect(result).toMatch(/Mar\s+15,\s+2024/);
  });

  it("formats an ISO date string", () => {
    const result = formatDate("2023-12-15T12:00:00Z");
    expect(result).toMatch(/Dec\s+15,\s+2023/);
  });

  it("includes all three date components", () => {
    const result = formatDate("2025-06-20T12:00:00Z");
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/20/);
    expect(result).toMatch(/2025/);
  });
});

describe("formatPeriodDate", () => {
  it("returns month and year without day", () => {
    const result = formatPeriodDate("2024-03-15T12:00:00Z");
    expect(result).toMatch(/Mar/);
    expect(result).toMatch(/2024/);
    // Should NOT include the day number
    expect(result).not.toMatch(/15/);
  });

  it("formats a different month correctly", () => {
    const result = formatPeriodDate("2025-11-01T12:00:00Z");
    expect(result).toMatch(/Nov/);
    expect(result).toMatch(/2025/);
  });
});

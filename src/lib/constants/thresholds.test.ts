import { describe, it, expect } from "vitest";
import { getFrameworkFromDate, formatCurrency, formatDate, formatPeriodDate, THRESHOLDS } from "./thresholds";

describe("getFrameworkFromDate", () => {
  it("returns pre_oct_2024 for dates before Oct 1 2024", () => {
    expect(getFrameworkFromDate("2024-09-30")).toBe("pre_oct_2024");
    expect(getFrameworkFromDate("2023-06-15")).toBe("pre_oct_2024");
    expect(getFrameworkFromDate("2020-01-01")).toBe("pre_oct_2024");
  });

  it("returns post_oct_2024 for Oct 1 2024 and later", () => {
    expect(getFrameworkFromDate("2024-10-01")).toBe("post_oct_2024");
    expect(getFrameworkFromDate("2024-12-31")).toBe("post_oct_2024");
    expect(getFrameworkFromDate("2025-03-15")).toBe("post_oct_2024");
  });

  it("handles exact boundary correctly (Oct 1 2024 = post)", () => {
    expect(getFrameworkFromDate("2024-10-01")).toBe("post_oct_2024");
    expect(getFrameworkFromDate("2024-09-30")).toBe("pre_oct_2024");
  });
});

describe("formatCurrency", () => {
  it("formats whole numbers with cents", () => {
    expect(formatCurrency(5000)).toBe("$5,000.00");
  });

  it("formats large numbers with commas", () => {
    expect(formatCurrency(1250000)).toBe("$1,250,000.00");
  });

  it("formats zero", () => {
    expect(formatCurrency(0)).toBe("$0.00");
  });

  it("formats negative numbers", () => {
    const result = formatCurrency(-1500);
    expect(result).toContain("1,500.00");
  });

  it("formats very large numbers", () => {
    expect(formatCurrency(999999999)).toBe("$999,999,999.00");
  });

  it("formats decimal amounts with cent precision", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
    expect(formatCurrency(1234.49)).toBe("$1,234.49");
  });

  it("handles small decimals", () => {
    expect(formatCurrency(0.99)).toBe("$0.99");
  });
});

describe("THRESHOLDS", () => {
  it("has correct pre-Oct 2024 thresholds", () => {
    expect(THRESHOLDS.pre_oct_2024.equipmentMinimum).toBe(5000);
    expect(THRESHOLDS.pre_oct_2024.deMinimisIndirectRate).toBe(0.1);
    expect(THRESHOLDS.pre_oct_2024.subawardMtdcExclusion).toBe(25000);
  });

  it("has correct post-Oct 2024 thresholds", () => {
    expect(THRESHOLDS.post_oct_2024.equipmentMinimum).toBe(10000);
    expect(THRESHOLDS.post_oct_2024.deMinimisIndirectRate).toBe(0.15);
    expect(THRESHOLDS.post_oct_2024.subawardMtdcExclusion).toBe(50000);
  });
});

describe("Equipment boundary classification", () => {
  it("$4,999.99 is below $5,000 equipment threshold (pre-oct → supplies)", () => {
    expect(4999.99 < THRESHOLDS.pre_oct_2024.equipmentMinimum).toBe(true);
  });

  it("$9,999.99 is below $10,000 equipment threshold (post-oct → supplies)", () => {
    expect(9999.99 < THRESHOLDS.post_oct_2024.equipmentMinimum).toBe(true);
  });
});

describe("formatCurrency edge cases", () => {
  it("sub-cent rounding: $1,234.555 → $1,234.56", () => {
    expect(formatCurrency(1234.555)).toBe("$1,234.56");
  });
});

describe("getFrameworkFromDate edge cases", () => {
  it("far-future date '2030-01-01' → post_oct_2024", () => {
    expect(getFrameworkFromDate("2030-01-01")).toBe("post_oct_2024");
  });

  it("old date '2000-01-01' → pre_oct_2024", () => {
    expect(getFrameworkFromDate("2000-01-01")).toBe("pre_oct_2024");
  });
});

describe("De minimis rate sanity", () => {
  it("rates are > 0 and < 1.0 for both frameworks", () => {
    expect(THRESHOLDS.pre_oct_2024.deMinimisIndirectRate).toBeGreaterThan(0);
    expect(THRESHOLDS.pre_oct_2024.deMinimisIndirectRate).toBeLessThan(1);
    expect(THRESHOLDS.post_oct_2024.deMinimisIndirectRate).toBeGreaterThan(0);
    expect(THRESHOLDS.post_oct_2024.deMinimisIndirectRate).toBeLessThan(1);
  });
});

describe("formatDate", () => {
  it("returns human-readable date", () => {
    // Use T12:00:00 to avoid timezone-shift issues in local date formatting
    const result = formatDate("2024-06-15T12:00:00");
    expect(result).toBe("Jun 15, 2024");
  });
});

describe("formatPeriodDate", () => {
  it("returns month + year only", () => {
    const result = formatPeriodDate("2024-06-15T12:00:00");
    expect(result).toBe("Jun 2024");
  });
});

describe("THRESHOLDS structural invariants", () => {
  it("both frameworks have all 3 required threshold keys", () => {
    for (const fw of ["pre_oct_2024", "post_oct_2024"] as const) {
      expect(THRESHOLDS[fw]).toHaveProperty("equipmentMinimum");
      expect(THRESHOLDS[fw]).toHaveProperty("deMinimisIndirectRate");
      expect(THRESHOLDS[fw]).toHaveProperty("subawardMtdcExclusion");
    }
  });

  it("post-Oct thresholds strictly higher than pre-Oct", () => {
    expect(THRESHOLDS.post_oct_2024.equipmentMinimum).toBeGreaterThan(THRESHOLDS.pre_oct_2024.equipmentMinimum);
    expect(THRESHOLDS.post_oct_2024.deMinimisIndirectRate).toBeGreaterThan(THRESHOLDS.pre_oct_2024.deMinimisIndirectRate);
    expect(THRESHOLDS.post_oct_2024.subawardMtdcExclusion).toBeGreaterThan(THRESHOLDS.pre_oct_2024.subawardMtdcExclusion);
  });
});

describe("formatDate edge cases", () => {
  it("handles T12 noon (avoids timezone shift)", () => {
    const result = formatDate("2024-01-01T12:00:00");
    expect(result).toContain("2024");
    expect(result).toContain("Jan");
  });
});

describe("formatPeriodDate edge cases", () => {
  it("handles first day of month", () => {
    const result = formatPeriodDate("2024-01-01T12:00:00");
    expect(result).toBe("Jan 2024");
  });
});

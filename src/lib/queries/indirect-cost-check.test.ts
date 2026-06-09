import { describe, it, expect } from "vitest";
import { checkIndirectCostCompliance } from "./indirect-cost-check";

const makeCategories = (overrides: Record<string, number> = {}) => [
  { category: "personnel", budgeted: 50000, spent: overrides.personnel ?? 40000 },
  { category: "fringe_benefits", budgeted: 10000, spent: overrides.fringe_benefits ?? 8000 },
  { category: "travel", budgeted: 5000, spent: overrides.travel ?? 3000 },
  { category: "equipment", budgeted: 20000, spent: overrides.equipment ?? 15000 },
  { category: "supplies", budgeted: 5000, spent: overrides.supplies ?? 4000 },
  { category: "contractual", budgeted: 30000, spent: overrides.contractual ?? 20000 },
  { category: "construction", budgeted: 0, spent: 0 },
  { category: "other", budgeted: 5000, spent: overrides.other ?? 2000 },
  { category: "indirect_charges", budgeted: 10000, spent: overrides.indirect_charges ?? 5000 },
];

describe("checkIndirectCostCompliance", () => {
  it("returns compliant when indirect under limit", () => {
    const result = checkIndirectCostCompliance({
      categories: makeCategories({ indirect_charges: 1000 }),
      ombFramework: "pre_oct_2024",
    });
    expect(result.isCompliant).toBe(true);
    expect(result.overageAmount).toBe(0);
  });

  it("returns non-compliant when indirect over limit", () => {
    const result = checkIndirectCostCompliance({
      categories: makeCategories({ indirect_charges: 50000 }),
      ombFramework: "pre_oct_2024",
    });
    expect(result.isCompliant).toBe(false);
    expect(result.overageAmount).toBeGreaterThan(0);
  });

  it("handles zero indirect charges", () => {
    const result = checkIndirectCostCompliance({
      categories: makeCategories({ indirect_charges: 0 }),
      ombFramework: "post_oct_2024",
    });
    expect(result.isCompliant).toBe(true);
    expect(result.indirectSpent).toBe(0);
  });

  it("uses correct rate for pre vs post Oct", () => {
    const pre = checkIndirectCostCompliance({
      categories: makeCategories(),
      ombFramework: "pre_oct_2024",
    });
    const post = checkIndirectCostCompliance({
      categories: makeCategories(),
      ombFramework: "post_oct_2024",
    });
    expect(pre.rate).toBe(0.1);
    expect(post.rate).toBe(0.15);
  });

  it("excludes contractual above subaward threshold from MTDC", () => {
    // Pre-Oct threshold is $25K. Contractual = $50K. Only $25K excluded from MTDC.
    const result = checkIndirectCostCompliance({
      categories: makeCategories({ contractual: 50000 }),
      ombFramework: "pre_oct_2024",
    });
    // Total direct = personnel + fringe + travel + equipment + supplies + contractual + other
    // = 40000 + 8000 + 3000 + 15000 + 4000 + 50000 + 2000 = 122000
    // MTDC = 122000 - 15000 (equipment) - 25000 (contractual above $25K threshold) = 82000
    expect(result.mtdcBase).toBe(82000);
  });

  it("applies post-Oct $50K subaward exclusion threshold", () => {
    // Post-Oct threshold is $50K. Contractual = $80K. Only $30K excluded from MTDC.
    const result = checkIndirectCostCompliance({
      categories: makeCategories({ contractual: 80000 }),
      ombFramework: "post_oct_2024",
    });
    // Total direct = 40000 + 8000 + 3000 + 15000 + 4000 + 80000 + 2000 = 152000
    // MTDC = 152000 - 15000 (equipment) - 30000 (contractual above $50K threshold) = 107000
    expect(result.mtdcBase).toBe(107000);
  });

  it("excludes nothing when contractual is at post-Oct threshold exactly", () => {
    const result = checkIndirectCostCompliance({
      categories: makeCategories({ contractual: 50000 }),
      ombFramework: "post_oct_2024",
    });
    // Total direct = 40000 + 8000 + 3000 + 15000 + 4000 + 50000 + 2000 = 122000
    // MTDC = 122000 - 15000 (equipment) - 0 (contractual at threshold, nothing above) = 107000
    expect(result.mtdcBase).toBe(107000);
  });

  it("excludes nothing when contractual is below post-Oct threshold", () => {
    const result = checkIndirectCostCompliance({
      categories: makeCategories({ contractual: 30000 }),
      ombFramework: "post_oct_2024",
    });
    // Total direct = 40000 + 8000 + 3000 + 15000 + 4000 + 30000 + 2000 = 102000
    // MTDC = 102000 - 15000 (equipment) - 0 (contractual below threshold) = 87000
    expect(result.mtdcBase).toBe(87000);
  });

  it("is compliant when indirectSpent exactly equals maxAllowable", () => {
    // Build categories where indirect = exactly rate * MTDC
    // Pre-Oct: rate = 0.1
    // Direct costs: personnel 10000 only, equipment 0, contractual 0
    // MTDC = 10000 - 0 - 0 = 10000
    // maxAllowable = 0.1 * 10000 = 1000
    const categories = [
      { category: "personnel", budgeted: 10000, spent: 10000 },
      { category: "equipment", budgeted: 0, spent: 0 },
      { category: "contractual", budgeted: 0, spent: 0 },
      { category: "indirect_charges", budgeted: 2000, spent: 1000 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    expect(result.isCompliant).toBe(true);
    expect(result.overageAmount).toBe(0);
    expect(result.maxAllowable).toBe(1000);
    expect(result.indirectSpent).toBe(1000);
  });

  it("handles empty categories array as compliant with zero values", () => {
    const result = checkIndirectCostCompliance({
      categories: [],
      ombFramework: "pre_oct_2024",
    });
    expect(result.isCompliant).toBe(true);
    expect(result.indirectSpent).toBe(0);
    expect(result.mtdcBase).toBe(0);
    expect(result.maxAllowable).toBe(0);
    expect(result.overageAmount).toBe(0);
  });

  it("handles missing equipment category as 0 equipment exclusion", () => {
    // No equipment in categories → 0 equipment exclusion from MTDC
    const categories = [
      { category: "personnel", budgeted: 10000, spent: 10000 },
      { category: "indirect_charges", budgeted: 2000, spent: 500 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    // MTDC = 10000 - 0 (no equipment) - 0 (no contractual) = 10000
    expect(result.mtdcBase).toBe(10000);
  });

  it("handles missing contractual category as 0 contractual exclusion", () => {
    const categories = [
      { category: "personnel", budgeted: 10000, spent: 10000 },
      { category: "equipment", budgeted: 5000, spent: 3000 },
      { category: "indirect_charges", budgeted: 2000, spent: 500 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    // MTDC = (10000 + 3000) - 3000 (equipment) - 0 (no contractual) = 10000
    expect(result.mtdcBase).toBe(10000);
  });

  it("excludes nothing when contractual exactly at pre-Oct threshold ($25K)", () => {
    const result = checkIndirectCostCompliance({
      categories: makeCategories({ contractual: 25000 }),
      ombFramework: "pre_oct_2024",
    });
    // Total direct = 40000 + 8000 + 3000 + 15000 + 4000 + 25000 + 2000 = 97000
    // MTDC = 97000 - 15000 (equipment) - 0 (contractual at threshold, 25000-25000=0) = 82000
    expect(result.mtdcBase).toBe(82000);
  });

  it("computes precise MTDC for pre-Oct 10% rate", () => {
    // Pre-Oct: rate = 10%
    // personnel=50K, fringe=10K, travel=5K, equipment=15K, supplies=4K, contractual=20K, other=2K
    // Total direct = 50K+10K+5K+15K+4K+20K+2K = 106000
    // Equipment exclusion = 15000
    // Contractual exclusion = max(0, 20000-25000) = 0
    // MTDC = 106000 - 15000 - 0 = 91000
    // maxAllowable = 0.1 * 91000 = 9100
    const categories = makeCategories({
      personnel: 50000,
      fringe_benefits: 10000,
      travel: 5000,
      equipment: 15000,
      supplies: 4000,
      contractual: 20000,
      other: 2000,
      indirect_charges: 8000,
    });
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    expect(result.mtdcBase).toBe(91000);
    expect(result.maxAllowable).toBe(9100);
    expect(result.isCompliant).toBe(true);
  });

  it("zero MTDC base (all costs are equipment) → maxAllowable = 0", () => {
    // Only equipment spent — equipment is fully excluded from MTDC
    const categories = [
      { category: "equipment", budgeted: 100000, spent: 80000 },
      { category: "indirect_charges", budgeted: 5000, spent: 1000 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    // Total direct = 80000 (equipment only)
    // MTDC = max(0, 80000 - 80000 - 0) = 0
    expect(result.mtdcBase).toBe(0);
    expect(result.maxAllowable).toBe(0);
    // $1000 indirect > $0 max → non-compliant
    expect(result.isCompliant).toBe(false);
    expect(result.overageAmount).toBe(1000);
  });

  it("zero MTDC base with zero indirect charges → compliant", () => {
    const categories = [
      { category: "equipment", budgeted: 50000, spent: 50000 },
      { category: "indirect_charges", budgeted: 5000, spent: 0 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    // 0 ≤ 0 is true
    expect(result.isCompliant).toBe(true);
    expect(result.indirectSpent).toBe(0);
    expect(result.maxAllowable).toBe(0);
  });

  it("indirect at exact 10% boundary (pre-oct) → compliant using <=", () => {
    // Direct costs: personnel=10000, MTDC = 10000
    // maxAllowable = 0.1 * 10000 = 1000
    // indirect = exactly 1000
    const categories = [
      { category: "personnel", budgeted: 10000, spent: 10000 },
      { category: "indirect_charges", budgeted: 2000, spent: 1000 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    expect(result.isCompliant).toBe(true);
    expect(result.indirectSpent).toBe(1000);
    expect(result.maxAllowable).toBe(1000);
    expect(result.overageAmount).toBe(0);
  });

  it("indirect at exact 15% boundary (post-oct) → compliant", () => {
    // Direct costs: personnel=20000, MTDC = 20000
    // maxAllowable = 0.15 * 20000 = 3000
    // indirect = exactly 3000
    const categories = [
      { category: "personnel", budgeted: 20000, spent: 20000 },
      { category: "indirect_charges", budgeted: 5000, spent: 3000 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "post_oct_2024",
    });
    expect(result.isCompliant).toBe(true);
    expect(result.indirectSpent).toBe(3000);
    expect(result.maxAllowable).toBe(3000);
  });

  it("one penny over de minimis → non-compliant", () => {
    // Pre-Oct: personnel=100000, MTDC=100000, max=10000
    // indirect = 10000.01 → one penny over
    const categories = [
      { category: "personnel", budgeted: 100000, spent: 100000 },
      { category: "indirect_charges", budgeted: 15000, spent: 10000.01 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    expect(result.isCompliant).toBe(false);
    expect(result.overageAmount).toBeCloseTo(0.01, 10);
  });

  it("missing indirect_charges category → $0 indirect, compliant", () => {
    // No indirect_charges entry at all
    const categories = [
      { category: "personnel", budgeted: 50000, spent: 40000 },
      { category: "travel", budgeted: 5000, spent: 3000 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    expect(result.indirectSpent).toBe(0);
    expect(result.isCompliant).toBe(true);
    expect(result.overageAmount).toBe(0);
  });

  it("all categories zero spent → compliant, all values 0", () => {
    const categories = [
      { category: "personnel", budgeted: 50000, spent: 0 },
      { category: "equipment", budgeted: 20000, spent: 0 },
      { category: "contractual", budgeted: 30000, spent: 0 },
      { category: "indirect_charges", budgeted: 10000, spent: 0 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "post_oct_2024",
    });
    expect(result.isCompliant).toBe(true);
    expect(result.indirectSpent).toBe(0);
    expect(result.mtdcBase).toBe(0);
    expect(result.maxAllowable).toBe(0);
    expect(result.overageAmount).toBe(0);
  });

  it("contractual $1 over threshold excluded from MTDC", () => {
    // Pre-Oct: subaward threshold = $25000
    // Contractual = $25001 → $1 excluded from MTDC
    const categories = [
      { category: "personnel", budgeted: 50000, spent: 50000 },
      { category: "contractual", budgeted: 30000, spent: 25001 },
      { category: "indirect_charges", budgeted: 10000, spent: 5000 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    // Total direct = 50000 + 25001 = 75001
    // MTDC = 75001 - 0 (no equipment) - 1 (contractual above $25K) = 75000
    expect(result.mtdcBase).toBe(75000);
  });

  it("MTDC base floors at 0 (never negative)", () => {
    // Equipment spending exceeds total direct → MTDC would be negative without floor
    const categories = [
      { category: "equipment", budgeted: 100000, spent: 100000 },
      { category: "indirect_charges", budgeted: 5000, spent: 1000 },
    ];
    const result = checkIndirectCostCompliance({
      categories,
      ombFramework: "pre_oct_2024",
    });
    // Total direct = 100000 (equipment is direct cost)
    // MTDC = max(0, 100000 - 100000 - 0) = 0
    expect(result.mtdcBase).toBe(0);
    expect(result.maxAllowable).toBe(0);
  });
});

import { THRESHOLDS } from "@/lib/constants/thresholds";

export interface IndirectCostCheckParams {
  categories: {
    category: string;
    budgeted: number;
    spent: number;
  }[];
  ombFramework: "pre_oct_2024" | "post_oct_2024";
}

export interface IndirectCostResult {
  isCompliant: boolean;
  indirectSpent: number;
  mtdcBase: number;
  rate: number;
  maxAllowable: number;
  overageAmount: number;
}

/**
 * Verifies total indirect charges ≤ (de minimis rate × MTDC base).
 *
 * MTDC (Modified Total Direct Costs) base = total direct costs minus:
 *   - Equipment spending (always excluded per 2 CFR 200.68)
 *   - Contractual/subaward spending above the framework threshold ($25K pre / $50K post)
 *   - Indirect charges themselves
 */
export function checkIndirectCostCompliance(
  params: IndirectCostCheckParams
): IndirectCostResult {
  const { categories, ombFramework } = params;

  const thresholds = THRESHOLDS[ombFramework] ?? {
    equipmentMinimum: ombFramework === "post_oct_2024" ? 10000 : 5000,
    deMinimisIndirectRate: ombFramework === "post_oct_2024" ? 0.15 : 0.1,
    subawardMtdcExclusion: ombFramework === "post_oct_2024" ? 50000 : 25000,
  };

  const rate: number =
    "deMinimisIndirectRate" in thresholds
      ? thresholds.deMinimisIndirectRate
      : ombFramework === "post_oct_2024"
        ? 0.15
        : 0.1;

  const subawardThreshold: number =
    "subawardMtdcExclusion" in thresholds
      ? thresholds.subawardMtdcExclusion
      : ombFramework === "post_oct_2024"
        ? 50000
        : 25000;

  const getSpent = (categoryName: string): number => {
    const entry = categories.find((c) => c.category === categoryName);
    return entry?.spent ?? 0;
  };

  const indirectSpent = getSpent("indirect_charges");
  const equipmentSpent = getSpent("equipment");
  const contractualSpent = getSpent("contractual");

  // Subaward amounts above the threshold are excluded from MTDC.
  const contractualMtdcExclusion = Math.max(
    0,
    contractualSpent - subawardThreshold
  );

  // Total direct costs = all spending except indirect charges.
  const totalDirectCosts = categories.reduce((sum, c) => {
    if (c.category.toLowerCase() === "indirect_charges") return sum;
    return sum + c.spent;
  }, 0);

  const mtdcBase = Math.max(
    0,
    totalDirectCosts - equipmentSpent - contractualMtdcExclusion
  );

  const maxAllowable = rate * mtdcBase;
  const overageAmount = Math.max(0, indirectSpent - maxAllowable);
  const isCompliant = indirectSpent <= maxAllowable;

  return {
    isCompliant,
    indirectSpent,
    mtdcBase,
    rate,
    maxAllowable,
    overageAmount,
  };
}

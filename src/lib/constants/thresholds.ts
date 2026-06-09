import type { OmbFramework } from "@/lib/supabase/database.types";

export interface FrameworkThresholds {
  equipmentMinimum: number;
  deMinimisIndirectRate: number;
  subawardMtdcExclusion: number;
}

export const THRESHOLDS: Record<OmbFramework, FrameworkThresholds> = {
  pre_oct_2024: {
    equipmentMinimum: 5000,
    deMinimisIndirectRate: 0.1,
    subawardMtdcExclusion: 25000,
  },
  post_oct_2024: {
    equipmentMinimum: 10000,
    deMinimisIndirectRate: 0.15,
    subawardMtdcExclusion: 50000,
  },
};

export const FRAMEWORK_LABELS: Record<OmbFramework, string> = {
  pre_oct_2024: "Pre-Oct 2024 Rules",
  post_oct_2024: "Post-Oct 2024 Rules",
};

export function getFrameworkFromDate(awardDate: string): OmbFramework {
  return awardDate >= "2024-10-01" ? "post_oct_2024" : "pre_oct_2024";
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPeriodDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
}

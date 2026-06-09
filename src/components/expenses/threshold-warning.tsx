import { Badge } from "@/components/ui/badge";
import { THRESHOLDS, formatCurrency } from "@/lib/constants/thresholds";
import type { OmbFramework } from "@/lib/supabase/database.types";

interface ThresholdWarningProps {
  amount: number;
  framework: OmbFramework;
  category: string | null;
}

export function ThresholdWarning({ amount, framework, category }: ThresholdWarningProps) {
  if (category !== "equipment" && category !== "supplies") return null;

  const threshold = THRESHOLDS[framework].equipmentMinimum;
  const pct = amount / threshold;

  // Show warning when amount is near or above threshold
  if (pct < 0.8) return null;

  const frameworkLabel = framework === "pre_oct_2024" ? "pre-October 2024" : "post-October 2024";

  if (amount >= threshold) {
    return (
      <Badge variant="danger">
        Exceeds {formatCurrency(threshold)} equipment threshold ({frameworkLabel})
      </Badge>
    );
  }

  return (
    <Badge variant="warning">
      Near {formatCurrency(threshold)} equipment threshold ({frameworkLabel})
    </Badge>
  );
}

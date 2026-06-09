import { Badge } from "@/components/ui/badge";
import type { AlertLevel } from "@/lib/queries/budget-actual";

interface AlertBadgeProps {
  level: AlertLevel;
  utilization: number;
}

const variants: Record<AlertLevel, "default" | "success" | "warning" | "danger"> = {
  none: "success",
  warning: "warning",
  critical: "danger",
  overspent: "danger",
};

const labels: Record<AlertLevel, string> = {
  none: "On Track",
  warning: "Warning",
  critical: "Critical",
  overspent: "Overspent",
};

export function AlertBadge({ level, utilization }: AlertBadgeProps) {
  if (level === "none") return null;

  return (
    <Badge variant={variants[level]}>
      {labels[level]} ({utilization.toFixed(1)}%)
    </Badge>
  );
}

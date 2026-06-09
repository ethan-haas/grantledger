import { Badge } from "@/components/ui/badge";
import type { AiConfidence } from "@/lib/supabase/database.types";

interface ConfidenceBadgeProps {
  confidence: AiConfidence | null;
}

const variants: Record<string, "success" | "warning" | "danger"> = {
  high: "success",
  medium: "warning",
  low: "danger",
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  if (!confidence) return null;

  const label = confidence.charAt(0).toUpperCase() + confidence.slice(1);

  return (
    <Badge variant={variants[confidence] || "default"}>
      {label}
    </Badge>
  );
}

import { Badge } from "@/components/ui/badge";
import { FRAMEWORK_LABELS } from "@/lib/constants/thresholds";
import type { OmbFramework } from "@/lib/supabase/database.types";

interface FrameworkBadgeProps {
  framework: OmbFramework;
}

export function FrameworkBadge({ framework }: FrameworkBadgeProps) {
  return (
    <Badge variant={framework === "post_oct_2024" ? "info" : "default"}>
      {FRAMEWORK_LABELS[framework]}
    </Badge>
  );
}

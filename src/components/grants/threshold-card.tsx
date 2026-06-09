import { Card, CardTitle } from "@/components/ui/card";
import { THRESHOLDS, formatCurrency } from "@/lib/constants/thresholds";
import { Tooltip } from "@/components/ui/tooltip";
import type { OmbFramework } from "@/lib/supabase/database.types";

interface ThresholdCardProps {
  framework: OmbFramework;
}

export function ThresholdCard({ framework }: ThresholdCardProps) {
  const thresholds = THRESHOLDS[framework];

  return (
    <Card padding="sm">
      <CardTitle>Applicable Thresholds</CardTitle>
      <div className="mt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <Tooltip content="Items costing above this amount with useful life >1 year are classified as Equipment. Below this amount, they are Supplies. 2 CFR 200.439">
            <span className="text-slate-600 dark:text-slate-300 underline decoration-dotted cursor-help">Equipment minimum</span>
          </Tooltip>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {formatCurrency(thresholds.equipmentMinimum)}
          </span>
        </div>
        <div className="flex justify-between">
          <Tooltip content="Organizations without a negotiated indirect cost rate may use this de minimis rate applied to Modified Total Direct Costs (MTDC). 2 CFR 200.414">
            <span className="text-slate-600 dark:text-slate-300 underline decoration-dotted cursor-help">De minimis IDC rate</span>
          </Tooltip>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {(thresholds.deMinimisIndirectRate * 100).toFixed(0)}% MTDC
          </span>
        </div>
        <div className="flex justify-between">
          <Tooltip content="First portion of each subaward included in the MTDC base for indirect cost calculation. Amounts above this per subaward are excluded from MTDC. 2 CFR 200.1">
            <span className="text-slate-600 dark:text-slate-300 underline decoration-dotted cursor-help">Subaward MTDC exclusion</span>
          </Tooltip>
          <span className="font-medium text-slate-900 dark:text-slate-100">
            {formatCurrency(thresholds.subawardMtdcExclusion)}
          </span>
        </div>
      </div>
    </Card>
  );
}

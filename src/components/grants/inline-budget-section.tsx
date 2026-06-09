"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { BudgetTable } from "@/components/grants/budget-table";
import { useUiStore } from "@/stores/ui-store";

interface InlineBudgetSectionProps {
  grantId: string;
  budgets: Record<string, number>;
  totalAmount: number;
}

export function InlineBudgetSection({ grantId, budgets, totalAmount }: InlineBudgetSectionProps) {
  const addToast = useUiStore((s) => s.addToast);
  const [currentBudgets, setCurrentBudgets] = useState(budgets);

  async function handleInlineSave(updated: Record<string, number>) {
    const res = await fetch(`/api/grants/${grantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budgets: updated }),
    });

    if (!res.ok) {
      addToast({ type: "error", title: "Failed to save budget changes" });
      throw new Error("Save failed");
    }

    setCurrentBudgets(updated);
  }

  return (
    <Card>
      <CardTitle>Budget Allocation</CardTitle>
      <div className="mt-4">
        <BudgetTable
          budgets={currentBudgets}
          totalAmount={totalAmount}
          inlineEditable
          onInlineSave={handleInlineSave}
        />
      </div>
    </Card>
  );
}

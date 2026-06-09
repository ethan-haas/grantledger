"use client";

import { useState, useMemo } from "react";

export function SavingsCalculator() {
  const [grants, setGrants] = useState(3);
  const [expensesPerMonth, setExpensesPerMonth] = useState(150);

  const results = useMemo(() => {
    const manualMinutesPerExpense = 4;
    const hoursSavedPerMonth = (expensesPerMonth * manualMinutesPerExpense) / 60;
    const annualPlanCost = 1490;
    const costPerExpense = annualPlanCost / (expensesPerMonth * 12);
    const staffHourlyRate = 75;
    const annualSavings = (hoursSavedPerMonth * 12 * staffHourlyRate) - annualPlanCost;
    return {
      hoursSavedPerMonth: Math.round(hoursSavedPerMonth),
      costPerExpense: costPerExpense.toFixed(2),
      annualSavings: Math.max(0, Math.round(annualSavings)),
    };
  }, [expensesPerMonth]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-soft dark:border-slate-700 dark:bg-slate-800">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Calculate your savings
      </h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        See how much time and money GrantLedger can save your team.
      </p>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* Inputs */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Active grants
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={grants}
              onChange={(e) => setGrants(parseInt(e.target.value))}
              className="mt-2 w-full accent-primary-600"
            />
            <div className="mt-1 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
              {grants}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Expenses per month
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={expensesPerMonth}
              onChange={(e) => setExpensesPerMonth(parseInt(e.target.value))}
              className="mt-2 w-full accent-primary-600"
            />
            <div className="mt-1 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
              {expensesPerMonth}
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <div className="rounded-xl bg-primary-50 p-4 dark:bg-primary-900/20">
            <p className="text-sm text-primary-600 dark:text-primary-400">Hours saved per month</p>
            <p className="mt-1 text-3xl font-bold text-primary-700 dark:text-primary-300">
              {results.hoursSavedPerMonth}h
            </p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-700/50">
            <p className="text-sm text-slate-600 dark:text-slate-400">Cost per expense</p>
            <p className="mt-1 text-3xl font-bold text-slate-900 dark:text-slate-100">
              ${results.costPerExpense}
            </p>
          </div>
          <div className="rounded-xl bg-success-50 p-4 dark:bg-success-900/20">
            <p className="text-sm text-success-600 dark:text-success-400">Estimated annual savings</p>
            <p className="mt-1 text-3xl font-bold text-success-700 dark:text-success-300">
              ${results.annualSavings.toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

interface TrialBannerProps {
  daysRemaining: number;
  grantCount?: number;
  grantLimit?: number;
  expenseCount?: number;
  expenseLimit?: number;
}

export function TrialBanner({ daysRemaining, grantCount, grantLimit, expenseCount, expenseLimit }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (daysRemaining <= 0 || dismissed) return null;

  const urgent = daysRemaining <= 3;

  return (
    <div className={`border-b px-4 py-2.5 text-center text-sm font-medium animate-slideInDown ${
      urgent
        ? "bg-warning-50 border-warning-200 text-warning-800 dark:bg-warning-900/20 dark:border-warning-700 dark:text-warning-300"
        : "bg-primary-50 border-primary-200 text-primary-800 dark:bg-primary-900/20 dark:border-primary-700 dark:text-primary-300"
    }`}>
      <div className="flex items-center justify-center gap-2">
        <svg className={`h-4 w-4 flex-shrink-0 ${urgent ? "text-warning-500 dark:text-warning-400" : "text-primary-500 dark:text-primary-400"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining in your free trial.
        </span>
        <Link
          href="/dashboard/settings/billing"
          className="font-semibold underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Upgrade now
        </Link>
        {grantCount != null && grantLimit != null && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs">
            <span className="h-1.5 w-12 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <span
                className={`block h-full rounded-full transition-all ${
                  grantCount / grantLimit > 0.8 ? "bg-warning-500" : "bg-primary-500"
                }`}
                style={{ width: `${Math.min(100, (grantCount / grantLimit) * 100)}%` }}
              />
            </span>
            {grantCount}/{grantLimit} grants
          </span>
        )}
        {expenseCount != null && expenseLimit != null && (
          <span className="hidden sm:inline-flex items-center gap-1 text-xs">
            <span className="h-1.5 w-12 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
              <span
                className={`block h-full rounded-full transition-all ${
                  expenseCount / expenseLimit > 0.8 ? "bg-warning-500" : "bg-primary-500"
                }`}
                style={{ width: `${Math.min(100, (expenseCount / expenseLimit) * 100)}%` }}
              />
            </span>
            {expenseCount}/{expenseLimit} expenses
          </span>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss trial banner"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";

export function PastDueBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="border-b bg-danger-50 border-danger-200 px-4 py-2.5 text-center text-sm font-medium text-danger-800 dark:bg-danger-900/20 dark:border-danger-700 dark:text-danger-300 animate-slideInDown">
      <div className="flex items-center justify-center gap-2">
        <svg className="h-4 w-4 flex-shrink-0 text-danger-500 dark:text-danger-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        <span>Your payment is past due. Please update your payment method to avoid service interruption.</span>
        <Link
          href="/dashboard/settings/billing"
          className="font-semibold underline hover:no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-600"
        >
          Update Payment
        </Link>
        <button
          onClick={() => setDismissed(true)}
          className="ml-2 rounded-full p-2 min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss payment banner"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

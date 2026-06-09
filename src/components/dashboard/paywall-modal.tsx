"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface PaywallModalProps {
  reason: string;
}

export function PaywallModal({ reason }: PaywallModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.focus();

    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        window.location.href = "/dashboard/settings/billing";
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-modal-overlay flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="paywall-title"
        tabIndex={-1}
        className="mx-4 max-w-md rounded-2xl bg-white dark:bg-slate-800 p-8 shadow-soft-xl animate-scaleIn focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 dark:bg-primary-700/20">
          <svg className="h-7 w-7 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true" role="presentation">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <h2 id="paywall-title" className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100 text-center">
          Upgrade to Continue
        </h2>
        <p className="mt-3 text-slate-600 dark:text-slate-400 text-center">
          {reason === "Trial expired"
            ? "Your 14-day free trial has ended. Upgrade to keep your data and continue categorizing grant expenses."
            : reason === "Payment past due"
              ? "Your payment is past due. Please update your payment method to restore full access."
              : "A subscription is required to access GrantLedger features."}
        </p>
        <ul className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {["Unlimited grants & expenses", "AI-powered categorization", "Compliance reports"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <svg className="h-4 w-4 flex-shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true" role="presentation">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {item}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/dashboard/settings/billing">
            <Button className="w-full" size="lg">
              View subscription plans
            </Button>
          </Link>
          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Your data is safe and will be available once you subscribe.
          </p>
        </div>
      </div>
    </div>
  );
}

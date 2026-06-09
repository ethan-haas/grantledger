"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { PLAN_DETAILS } from "@/lib/stripe-config";
import { useUiStore } from "@/stores/ui-store";

interface BillingActionsProps {
  status: string;
  hasStripeCustomer: boolean;
}

export function BillingActions({ status, hasStripeCustomer }: BillingActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const addToast = useUiStore((s) => s.addToast);

  async function handleCheckout(priceId: string) {
    setLoading(priceId);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) {
        let error = "Checkout failed";
        try { const errData = await res.json(); error = errData.error || error; } catch {}
        throw new Error(error);
      }
      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) throw new Error("Unexpected response format");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      addToast({
        type: "error",
        title: "Checkout failed",
        message: err instanceof Error ? err.message : "Unable to start checkout. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  }

  async function handlePortal() {
    setLoading("portal");
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      if (!res.ok) {
        let error = "Portal redirect failed";
        try { const errData = await res.json(); error = errData.error || error; } catch {}
        throw new Error(error);
      }
      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) throw new Error("Unexpected response format");
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      addToast({
        type: "error",
        title: "Billing portal unavailable",
        message: err instanceof Error ? err.message : "Please try again later.",
      });
    } finally {
      setLoading(null);
    }
  }

  if (status === "active" && hasStripeCustomer) {
    return (
      <Card>
        <CardTitle>Manage Subscription</CardTitle>
        <CardDescription>Update payment method, change plan, or cancel.</CardDescription>
        <div className="mt-4">
          <Button onClick={handlePortal} loading={loading === "portal"} variant="secondary">
            Open Billing Portal
          </Button>
        </div>
      </Card>
    );
  }

  const features = [
    { icon: "M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z", label: "Unlimited grants" },
    { icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z", label: "Unlimited expenses" },
    { icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", label: "AI categorization with CFR citations" },
    { icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z", label: "PDF/CSV compliance reports" },
    { icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244", label: "QuickBooks & Xero integration" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-2xl bg-gradient-to-b from-primary-600 to-primary-700 p-[2px] shadow-soft-lg">
        <Card className="relative rounded-[calc(1rem-2px)] border-0">
          <div className="absolute -top-3 left-4">
            <span className="rounded-full bg-gradient-to-r from-primary-600 to-accent-500 px-3 py-1 text-xs font-semibold text-white shadow-sm">
              Recommended
            </span>
          </div>
          <CardTitle>Annual Plan</CardTitle>
          <div className="mt-2">
            <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">${PLAN_DETAILS.annual.price}</span>
            <span className="text-slate-500 dark:text-slate-400">/year</span>
          </div>
          <p className="mt-1 text-sm text-success-600 dark:text-success-400 font-medium">{PLAN_DETAILS.annual.savings}</p>
          <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-2.5">
                <svg className="h-4 w-4 flex-shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
                {f.label}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <Button
              onClick={() => handleCheckout(PLAN_DETAILS.annual.priceId)}
              loading={loading === PLAN_DETAILS.annual.priceId}
              className="w-full"
            >
              Subscribe Annually
            </Button>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Monthly Plan</CardTitle>
        <div className="mt-2">
          <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">${PLAN_DETAILS.monthly.price}</span>
          <span className="text-slate-500 dark:text-slate-400">/month</span>
        </div>
        <ul className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
          {features.map((f) => (
            <li key={f.label} className="flex items-center gap-2.5">
              <svg className="h-4 w-4 flex-shrink-0 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
              </svg>
              {f.label}
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <Button
            variant="secondary"
            onClick={() => handleCheckout(PLAN_DETAILS.monthly.priceId)}
            loading={loading === PLAN_DETAILS.monthly.priceId}
            className="w-full"
          >
            Subscribe Monthly
          </Button>
        </div>
      </Card>
    </div>
  );
}

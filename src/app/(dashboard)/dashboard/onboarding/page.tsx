"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AnimatePresence, motion } from "framer-motion";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/ui/step-indicator";
import { GrantForm } from "@/components/grants/grant-form";
import { useUiStore } from "@/stores/ui-store";
import Link from "next/link";

type OnboardingStep = "welcome" | "grant" | "next";

const STEPS = [
  { label: "Welcome" },
  { label: "Create Grant" },
  { label: "Next Steps" },
];

function getStepIndex(step: OnboardingStep): number {
  const map: Record<OnboardingStep, number> = { welcome: 0, grant: 1, next: 2 };
  return map[step];
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const addToast = useUiStore((s) => s.addToast);
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [createdGrantId, setCreatedGrantId] = useState<string | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  const firstName = user?.firstName || "there";

  async function handleLoadSampleData() {
    setLoadingSample(true);
    try {
      const res = await fetch("/api/sample-data", { method: "POST" });
      if (!res.ok) {
        const ct = res.headers.get("content-type");
        if (ct?.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load sample data");
        }
        throw new Error("Failed to load sample data");
      }
      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) throw new Error("Unexpected response format");
      const data = await res.json();
      addToast({ type: "success", title: "Sample data loaded" });
      router.push(`/dashboard/grants/${data.grant_id}`);
    } catch (err) {
      addToast({
        type: "error",
        title: "Error",
        message: err instanceof Error ? err.message : "Failed to load sample data",
      });
    } finally {
      setLoadingSample(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <StepIndicator steps={STEPS} currentStep={getStepIndex(step)} />

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card padding="lg">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg">
                  <span className="text-2xl font-bold text-white">GL</span>
                </div>
                <CardTitle className="text-2xl">Welcome, {firstName}!</CardTitle>
                <CardDescription className="mt-3 text-base">
                  GrantLedger helps you categorize federal grant expenses into 2 CFR 200 / SF-424A
                  budget categories using AI, with budget-to-actual tracking and compliance reports.
                </CardDescription>
                <div className="mt-8">
                  <Button onClick={() => setStep("grant")} size="lg">
                    Get Started
                  </Button>
                </div>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Takes about 2 minutes to set up your first grant.
                </p>
                <div className="mt-6 border-t border-slate-200 dark:border-slate-700 pt-4">
                  <p className="text-xs text-slate-400 mb-2">Or explore with pre-loaded data</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLoadSampleData}
                    loading={loadingSample}
                  >
                    Try with sample data
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {step === "grant" && (
          <motion.div
            key="grant"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                  Create Your First Grant
                </h2>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Enter your grant details and budget allocations.
                </p>
              </div>
              <GrantForm
                onSuccess={(grantId) => {
                  setCreatedGrantId(grantId);
                  setStep("next");
                }}
              />
            </div>
          </motion.div>
        )}

        {step === "next" && (
          <motion.div
            key="next"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Card padding="lg">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
                  <svg className="h-6 w-6 text-success-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <CardTitle className="text-2xl">Grant Created!</CardTitle>
                <CardDescription className="mt-2 text-base">
                  Import expenses and review AI categorizations. Each expense gets a confidence level
                  (high/medium/low) and a 2 CFR citation for audit reference.
                </CardDescription>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <Link href={createdGrantId ? `/dashboard/grants/${createdGrantId}/import` : "/dashboard"}>
                  <Card hover className="h-full cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                        <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                        </svg>
                      </div>
                      <div>
                        <CardTitle className="text-base">Import Expenses</CardTitle>
                        <CardDescription>
                          Upload a CSV or connect QuickBooks/Xero to import your expenses for AI categorization.
                        </CardDescription>
                      </div>
                    </div>
                  </Card>
                </Link>
                <Link href={createdGrantId ? `/dashboard/grants/${createdGrantId}/expenses` : "/dashboard"}>
                  <Card hover className="h-full cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-50">
                        <svg className="h-5 w-5 text-accent-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.746 3.746 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                      </div>
                      <div>
                        <CardTitle className="text-base">Review AI Categorizations</CardTitle>
                        <CardDescription>
                          Review AI-suggested SF-424A categories, confidence levels, and CFR citations. Approve or re-categorize each expense.
                        </CardDescription>
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>

              <div className="mt-4 text-center">
                <Link href={createdGrantId ? `/dashboard/grants/${createdGrantId}` : "/dashboard"}>
                  <Button variant="ghost" size="sm">Go to grant dashboard</Button>
                </Link>
              </div>

              <div className="mt-2 text-center">
                <Link
                  href="/dashboard"
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors"
                >
                  Skip to dashboard
                </Link>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

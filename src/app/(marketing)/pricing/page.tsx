"use client";

import { useState } from "react";
import Link from "next/link";
import { Section } from "@/components/marketing/section";
import { FadeInUp, ScaleIn } from "@/components/marketing/motion";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { BillingToggle } from "@/components/marketing/billing-toggle";
import { SavingsCalculator } from "@/components/marketing/savings-calculator";
import { SITE_URL } from "@/lib/site";

/* -------------------------------------------------------------------------- */
/*  Feature list                                                              */
/* -------------------------------------------------------------------------- */

const features = [
  {
    category: "Grant Management",
    items: [
      "Unlimited grants",
      "SF-424A budget allocation (10 categories)",
      "Auto-detect OMB framework (pre/post October 2024)",
      "Award details tracking (CFDA, award date, period, amount)",
    ],
  },
  {
    category: "Expense Import & Categorization",
    items: [
      "Unlimited expenses",
      "AI categorization with confidence levels",
      "Specific 2 CFR 200 citations for every expense",
      "QuickBooks Online integration",
      "Xero integration",
      "CSV import with guided column mapping",
      "Bulk review and approval",
    ],
  },
  {
    category: "Compliance & Reporting",
    items: [
      "Budget-to-actual dashboard",
      "Equipment threshold warnings",
      "Overspend alerts (80% / 90%)",
      "Dual-framework compliance tracking",
      "PDF audit reports with CFR citations",
      "CSV export for single audit preparation",
      "Full audit trail (confirmed_by, confirmed_at)",
    ],
  },
  {
    category: "Team & Organization",
    items: [
      "Organization management",
      "Team member access",
      "Row-level data security",
      "Email support",
    ],
  },
];

/* -------------------------------------------------------------------------- */
/*  Billing FAQ                                                               */
/* -------------------------------------------------------------------------- */

const billingFaq = [
  {
    question: "What happens when my 14-day trial ends?",
    answer:
      "When your trial ends, you will be prompted to subscribe to continue using GrantLedger. Your data is preserved, so you can pick up right where you left off. If you choose not to subscribe, you can export your data before your account is deactivated.",
  },
  {
    question: "Can I switch between monthly and annual billing?",
    answer:
      "Yes, you can switch your billing cycle at any time from your account settings. If you switch from monthly to annual, we will prorate the difference. Annual billing saves you $298 per year compared to paying monthly.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit and debit cards through our payment processor, Stripe. This includes Visa, Mastercard, American Express, and Discover. All payments are processed securely.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "We offer a full refund within the first 30 days of your paid subscription if you are not satisfied. After 30 days, we do not offer refunds, but you can cancel at any time and your subscription will remain active until the end of your current billing period.",
  },
];

/* -------------------------------------------------------------------------- */
/*  Pricing Page                                                              */
/* -------------------------------------------------------------------------- */

const pricingJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "GrantLedger",
  description:
    "AI-powered federal grant expense categorization with 2 CFR 200 compliance, budget-to-actual tracking, and audit-ready reports.",
  brand: {
    "@type": "Brand",
    name: "GrantLedger",
  },
  offers: [
    {
      "@type": "Offer",
      name: "Annual Plan",
      price: "1490",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/pricing`,
    },
    {
      "@type": "Offer",
      name: "Monthly Plan",
      price: "149",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      availability: "https://schema.org/InStock",
      url: `${SITE_URL}/pricing`,
    },
  ],
};

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingJsonLd) }}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <FadeInUp>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
                Pricing
              </p>
              <h1 className="mt-3 font-display text-display-sm font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-display-md">
                Simple, transparent pricing
              </h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
                One plan with everything you need to manage federal grant
                compliance. Choose the billing cycle that works for you.
              </p>
              <div className="mt-8 flex justify-center">
                <BillingToggle value={billing} onChange={setBilling} />
              </div>
            </div>
          </FadeInUp>

          {/* Pricing Cards */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-4 md:gap-8 md:grid-cols-2">
            {/* Annual Plan */}
            <ScaleIn delay={0.1}>
              <div className={`relative rounded-3xl ${billing === "annual" ? "bg-gradient-to-b from-primary-500/5 to-primary-500/[0.02] p-px" : ""}`}>
                <div className={`rounded-3xl ${billing === "annual" ? "border-2 border-primary-500/20 bg-white dark:bg-slate-800 p-8 shadow-soft-xl" : "border border-slate-200 bg-white dark:bg-slate-800 p-8 shadow-soft-sm"}`}>
                  {billing === "annual" && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
                        Recommended
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Annual</h3>
                    <div className="mt-4">
                      <span className="font-display text-5xl font-bold text-slate-900 dark:text-slate-100">$1,490</span>
                      <span className="text-base text-slate-500 dark:text-slate-400">/year</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-success-600 dark:text-success-400">
                      Save $298 per year vs monthly
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Equivalent to $124/month
                    </p>
                  </div>
                  <Link
                    href="/sign-up"
                    className={`mt-8 block w-full rounded-xl px-6 py-3.5 text-center text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      billing === "annual"
                        ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:shadow-glow hover:scale-[1.02] focus-visible:outline-primary-600"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    Start Free 14-Day Trial
                  </Link>
                  <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    No credit card required
                  </p>
                </div>
              </div>
            </ScaleIn>

            {/* Monthly Plan */}
            <ScaleIn delay={0.2}>
              <div className={`relative rounded-3xl ${billing === "monthly" ? "bg-gradient-to-b from-primary-500/5 to-primary-500/[0.02] p-px" : ""}`}>
                <div className={`rounded-3xl ${billing === "monthly" ? "border-2 border-primary-500/20 bg-white dark:bg-slate-800 p-8 shadow-soft-xl" : "border border-slate-200 bg-white dark:bg-slate-800 p-8 shadow-soft-sm"}`}>
                  {billing === "monthly" && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
                        Flexible
                      </span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Monthly</h3>
                    <div className="mt-4">
                      <span className="font-display text-5xl font-bold text-slate-900 dark:text-slate-100">$149</span>
                      <span className="text-base text-slate-500 dark:text-slate-400">/month</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                      $1,788 per year if paid monthly
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Flexible month-to-month billing
                    </p>
                  </div>
                  <Link
                    href="/sign-up"
                    className={`mt-8 block w-full rounded-xl px-6 py-3.5 text-center text-sm font-semibold shadow-sm transition-all duration-200 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      billing === "monthly"
                        ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:shadow-glow hover:scale-[1.02] focus-visible:outline-primary-600"
                        : "border border-slate-300 text-slate-700 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                    }`}
                  >
                    Start Free 14-Day Trial
                  </Link>
                  <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    No credit card required
                  </p>
                </div>
              </div>
            </ScaleIn>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <Section background="white" padding="md">
        <FadeInUp>
          <div className="mx-auto max-w-3xl text-center">
            <blockquote className="text-lg font-medium text-slate-700 dark:text-slate-300 italic">
              &ldquo;GrantLedger cut our grant categorization time by 80%. What used to take our
              team two full days each month now takes a few hours, with better accuracy and full
              audit trails.&rdquo;
            </blockquote>
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Sarah Mitchell</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Finance Director, Community Action Partners</p>
            </div>
          </div>
        </FadeInUp>
      </Section>

      {/* Full Feature List */}
      <Section background="neutral" padding="lg">
        <FadeInUp>
          <div className="text-center">
            <h2 className="font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white">
              Everything included in every plan
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              No hidden tiers. No feature gates. One plan, full access.
            </p>
          </div>
        </FadeInUp>
        <div className="mx-auto mt-16 grid max-w-4xl gap-12 sm:grid-cols-2">
          {features.map((section, i) => (
            <FadeInUp key={section.category} delay={i * 0.08}>
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-primary-600">
                  {section.category}
                </h3>
                <ul className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <svg
                        aria-hidden="true"
                        className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeInUp>
          ))}
        </div>
      </Section>

      {/* Savings Calculator */}
      <Section background="white" padding="lg">
        <FadeInUp>
          <div className="mx-auto max-w-3xl">
            <SavingsCalculator />
          </div>
        </FadeInUp>
      </Section>

      {/* Billing FAQ */}
      <Section background="neutral" padding="md">
        <FadeInUp>
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white">
                Billing questions
              </h2>
            </div>
            <div className="mt-12">
              <FaqAccordion items={billingFaq} />
            </div>
          </div>
        </FadeInUp>
      </Section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-mesh opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <FadeInUp>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-display-xs font-bold text-white sm:text-display-sm">
                Ready to get started?
              </h2>
              <p className="mt-3 text-neutral-300">
                Start your 14-day free trial today. No credit card required.
              </p>
              <Link
                href="/sign-up"
                className="mt-6 inline-block rounded-xl bg-white px-8 py-3.5 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:bg-neutral-100 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Start Free Trial
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>
    </>
  );
}

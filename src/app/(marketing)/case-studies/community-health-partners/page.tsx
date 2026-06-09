import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Community Health Partners Case Study — GrantLedger",
  description: "How Community Health Partners reduced audit prep time from 3 days to 3 hours using GrantLedger's AI-powered expense categorization.",
  alternates: { canonical: "/case-studies/community-health-partners" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "From 3 Days to 3 Hours: Community Health Partners Case Study",
  author: { "@type": "Organization", name: "GrantLedger" },
  publisher: { "@type": "Organization", name: "GrantLedger" },
  description: "How Community Health Partners reduced audit prep time from 3 days to 3 hours using GrantLedger.",
};

const metrics = [
  { value: "3 hrs", label: "Audit prep time (was 3 days)" },
  { value: "95%", label: "AI categorization accuracy" },
  { value: "8", label: "Federal grants managed" },
  { value: "$4.2M", label: "Total grant portfolio" },
];

export default function CommunityHealthPartnersPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <div className="bg-gradient-hero">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
          <Link
            href="/case-studies"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 rounded-md"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Back to Case Studies
          </Link>
          <span className="mt-4 inline-block rounded-full bg-success-50 px-3 py-1 text-xs font-semibold text-success-700 dark:bg-success-900/30 dark:text-success-400">
            Healthcare
          </span>
          <h1 className="mt-3 text-display-sm font-bold font-display tracking-tight text-slate-900 dark:text-slate-100 sm:text-display-md">
            From 3 Days to 3 Hours: How Community Health Partners Transformed Audit Prep
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            A community health network serving 40,000 patients annually cut audit preparation time by 95% with AI-powered expense categorization.
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-4 -mt-8 sm:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.label} padding="sm" className="text-center">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{m.value}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{m.label}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <div className="prose prose-slate max-w-none dark:prose-invert">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">The Challenge</h2>
          <p className="text-slate-600 dark:text-slate-400">
            Community Health Partners (CHP) manages 8 federal grants from HHS and HRSA, totaling $4.2 million annually.
            With a two-person finance team, Sarah Mitchell and her colleague spent an average of 3 full days preparing
            for their annual single audit — manually categorizing hundreds of expenses into SF-424A budget categories
            and tracking down CFR citations for each line item.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            &ldquo;We were drowning in spreadsheets,&rdquo; says Sarah. &ldquo;Every expense needed to be mapped to the right
            2 CFR 200 category with the correct citation. One mistake could trigger a finding. The stress was overwhelming.&rdquo;
          </p>

          <h2 className="mt-8 text-xl font-bold text-slate-900 dark:text-slate-100">The Solution</h2>
          <p className="text-slate-600 dark:text-slate-400">
            CHP implemented GrantLedger to automate expense categorization across all 8 grants. Using the QuickBooks Online
            integration, expenses flow directly into GrantLedger where AI categorizes each one into the appropriate SF-424A
            category with a CFR citation and confidence rating.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            The dual-framework compliance feature was critical — CHP had grants awarded both before and after the October 2024
            OMB changes, meaning different equipment thresholds and indirect cost rates applied to different grants.
            GrantLedger handled this automatically.
          </p>

          <h2 className="mt-8 text-xl font-bold text-slate-900 dark:text-slate-100">The Results</h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400">
            <li><strong className="text-slate-900 dark:text-slate-100">95% reduction in audit prep time</strong> — from 3 days to approximately 3 hours</li>
            <li><strong className="text-slate-900 dark:text-slate-100">95% AI accuracy</strong> — only 5% of categorizations required manual override</li>
            <li><strong className="text-slate-900 dark:text-slate-100">Zero audit findings</strong> — first clean audit in 3 years</li>
            <li><strong className="text-slate-900 dark:text-slate-100">Real-time budget tracking</strong> — budget alerts prevented two potential overspend situations</li>
          </ul>

          {/* Quote */}
          <Card className="mt-8 border-l-4 border-l-primary-500">
            <blockquote className="text-lg italic text-slate-700 dark:text-slate-300">
              &ldquo;GrantLedger cut our month-end close from 3 days to 3 hours. The AI categorization is shockingly accurate,
              and the CFR citations give our auditors exactly what they need. It paid for itself in one audit cycle.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Sarah Mitchell, Director of Finance
            </p>
            <p className="text-xs text-slate-500">Community Health Partners</p>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-16 rounded-2xl bg-gradient-to-r from-primary-600 to-accent-600 p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold text-white">Ready for Your Own Success Story?</h2>
          <p className="mt-2 text-primary-100">
            Start your 14-day free trial. No credit card required.
          </p>
          <div className="mt-6">
            <Link href="/sign-up">
              <Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

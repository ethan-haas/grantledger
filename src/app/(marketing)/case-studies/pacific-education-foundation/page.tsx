import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Pacific Education Foundation Case Study — GrantLedger",
  description: "How Pacific Education Foundation achieved zero compliance findings across 12 federal grants and $8.5M in funding using GrantLedger's dual-framework compliance.",
  alternates: { canonical: "/case-studies/pacific-education-foundation" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Zero Compliance Findings Across 12 Federal Grants: Pacific Education Foundation Case Study",
  author: { "@type": "Organization", name: "GrantLedger" },
  publisher: { "@type": "Organization", name: "GrantLedger" },
  description: "How Pacific Education Foundation achieved zero compliance findings across 12 federal grants using GrantLedger.",
};

const metrics = [
  { value: "0", label: "Compliance findings (2 consecutive years)" },
  { value: "60%", label: "Reduction in categorization time" },
  { value: "12", label: "Federal grants managed" },
  { value: "$8.5M", label: "Total grant portfolio" },
];

export default function PacificEducationFoundationPage() {
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
          <span className="mt-4 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            Education
          </span>
          <h1 className="mt-3 text-display-sm font-bold font-display tracking-tight text-slate-900 dark:text-slate-100 sm:text-display-md">
            Zero Compliance Findings: How Pacific Education Foundation Manages 12 Federal Grants with Confidence
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            A large education nonprofit managing $8.5M across 12 Department of Education grants achieved zero compliance findings for 2 consecutive years with dual-framework auto-detection and AI categorization.
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
            Pacific Education Foundation (PEF) is one of the largest education nonprofits on the West Coast, operating
            after-school programs, teacher development initiatives, and STEM curricula across 45 school districts. With 12
            active federal grants from the Department of Education totaling $8.5 million, the finance team faced a uniquely
            complex compliance landscape.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            The critical issue was timing. Seven of PEF&apos;s grants were awarded before October 2024, while five were awarded
            after the OMB rule changes took effect. This meant the finance team was simultaneously operating under two
            different compliance frameworks — with different equipment thresholds ($5,000 vs $10,000), different de minimis
            indirect cost rates (10% vs 15%), and different subaward MTDC exclusion limits ($25,000 vs $50,000).
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            &ldquo;We were maintaining two separate spreadsheet systems,&rdquo; explains Maria Chen, VP of Finance.
            &ldquo;A $7,000 laptop purchase might be classified as equipment under one grant but as supplies under another,
            depending on when the grant was awarded. The risk of misclassification was enormous, and our auditors were
            flagging concerns about our manual tracking process.&rdquo;
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            With over 2,000 expenses per quarter flowing across 12 grants, manual categorization consumed roughly 40 hours
            per month. The three-person finance team was spending more time on compliance paperwork than on strategic
            financial planning.
          </p>

          <h2 className="mt-8 text-xl font-bold text-slate-900 dark:text-slate-100">The Solution</h2>
          <p className="text-slate-600 dark:text-slate-400">
            PEF implemented GrantLedger to centralize grant compliance across all 12 federal awards. The onboarding
            process was straightforward: each grant&apos;s award date, CFDA number, and budget allocations were entered, and
            GrantLedger&apos;s dual-framework engine automatically detected which OMB rules applied to each grant based on the
            award date.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Using the QuickBooks Online integration, PEF connected their accounting system to GrantLedger for automatic
            expense syncing. The AI categorization engine processes each transaction against the correct OMB framework,
            assigning the appropriate SF-424A budget category, a confidence rating, and a specific 2 CFR 200 citation.
            Expenses near framework-sensitive thresholds — like a $6,500 equipment purchase that qualifies as equipment
            under pre-October rules but as supplies under post-October rules — are automatically flagged for review.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            The budget-to-actual tracking dashboard gave Maria&apos;s team real-time visibility into spending across all 12
            grants simultaneously. Overspend alerts at 80% and 90% thresholds replaced the monthly manual reconciliation
            that previously consumed an entire week.
          </p>

          <h2 className="mt-8 text-xl font-bold text-slate-900 dark:text-slate-100">The Results</h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400">
            <li><strong className="text-slate-900 dark:text-slate-100">Zero compliance findings for 2 consecutive years</strong> — auditors noted the completeness and accuracy of CFR citations attached to every categorized expense</li>
            <li><strong className="text-slate-900 dark:text-slate-100">60% reduction in categorization time</strong> — monthly compliance work dropped from 40 hours to 16 hours, freeing the team for strategic planning</li>
            <li><strong className="text-slate-900 dark:text-slate-100">Dual-framework accuracy</strong> — GrantLedger correctly applied different thresholds across pre- and post-October 2024 grants with zero misclassifications</li>
            <li><strong className="text-slate-900 dark:text-slate-100">Proactive budget management</strong> — overspend alerts caught three potential budget overruns before they became compliance issues</li>
          </ul>

          {/* Quote */}
          <Card className="mt-8 border-l-4 border-l-primary-500">
            <blockquote className="text-lg italic text-slate-700 dark:text-slate-300">
              &ldquo;The dual-framework detection alone justified the switch. We had grants straddling the October 2024 OMB
              changes, and GrantLedger handled the threshold differences automatically. Our auditors were genuinely impressed
              that every single expense had the correct CFR citation attached — across two different compliance frameworks.
              That&apos;s something we could never have achieved manually at this scale.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
              Maria Chen, VP of Finance
            </p>
            <p className="text-xs text-slate-500">Pacific Education Foundation</p>
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

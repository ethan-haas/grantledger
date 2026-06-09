import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Metro Workforce Alliance Case Study — GrantLedger",
  description: "How Metro Workforce Alliance saved 30+ hours per month by replacing manual QuickBooks data entry with GrantLedger's automated import and AI categorization.",
  alternates: { canonical: "/case-studies/metro-workforce-alliance" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "30+ Hours Saved Per Month: Metro Workforce Alliance Case Study",
  author: { "@type": "Organization", name: "GrantLedger" },
  publisher: { "@type": "Organization", name: "GrantLedger" },
  description: "How Metro Workforce Alliance saved 30+ hours per month by replacing manual QuickBooks data entry with GrantLedger's automated import and AI categorization.",
};

const metrics = [
  { value: "30+", label: "Hours saved per month" },
  { value: "0", label: "Manual data entry errors" },
  { value: "5", label: "Federal grants managed" },
  { value: "$3.1M", label: "Total grant portfolio" },
];

export default function MetroWorkforceAlliancePage() {
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
          <span className="mt-4 inline-block rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 dark:bg-accent-900/30 dark:text-accent-400">
            Workforce Development
          </span>
          <h1 className="mt-3 text-display-sm font-bold font-display tracking-tight text-slate-900 dark:text-slate-100 sm:text-display-md">
            30+ Hours Saved Per Month: How Metro Workforce Alliance Eliminated Manual Grant Data Entry
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            A workforce development nonprofit managing 5 Department of Labor grants replaced 30+ hours of monthly manual data entry with automated QuickBooks import and AI-powered categorization.
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
            Metro Workforce Alliance (MWA) operates 5 federal workforce development grants from the Department of Labor,
            totaling $3.1 million annually. Their three-person finance team, led by Controller David Park, tracked every
            expense in QuickBooks Online — but translating that data into SF-424A budget categories for federal reporting
            was an entirely manual process. Each month, David and his team spent over 30 hours exporting transactions from
            QuickBooks, re-entering them into spreadsheets, and manually assigning each expense to the correct budget category.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            The manual process was not just time-consuming — it was error-prone. With thousands of transactions flowing
            through five separate grants each month, transposition errors, miscategorizations, and duplicate entries were
            a constant headache. During their last single audit, the auditors flagged several expenses that had been
            assigned to incorrect SF-424A categories, leading to questioned costs and weeks of back-and-forth to resolve
            the findings.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            &ldquo;We were essentially doing the same work twice,&rdquo; says David. &ldquo;Everything lived in QuickBooks,
            but we had no way to automatically map those transactions to our federal budget categories. My team was spending
            more time on data entry than on actual financial analysis.&rdquo;
          </p>

          <h2 className="mt-8 text-xl font-bold text-slate-900 dark:text-slate-100">The Solution</h2>
          <p className="text-slate-600 dark:text-slate-400">
            MWA connected GrantLedger to their QuickBooks Online account, enabling automatic expense import across all
            5 grants. Using the Change Data Capture integration, new and updated transactions sync directly from QuickBooks
            into GrantLedger without any manual re-entry. The finance team no longer exports CSVs or copies data between
            systems — expenses appear in GrantLedger within minutes of being recorded in QuickBooks.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            Once imported, GrantLedger&apos;s AI categorization engine assigns each expense to the appropriate SF-424A
            budget category with a confidence rating and a specific 2 CFR 200 citation. For MWA&apos;s workforce programs,
            this meant correctly distinguishing between Personnel costs for program staff, Contractual expenses for
            third-party training providers, and Other costs for participant support services — distinctions that had
            previously required hours of manual review and institutional knowledge to get right.
          </p>
          <p className="text-slate-600 dark:text-slate-400">
            The budget-to-actual dashboard gave David real-time visibility into spending across all 5 grants simultaneously.
            Overspend alerts at the 80% and 90% thresholds replaced the end-of-month surprise of discovering a budget
            category had been exceeded, allowing the team to make proactive reallocation decisions instead of reactive
            corrections.
          </p>

          <h2 className="mt-8 text-xl font-bold text-slate-900 dark:text-slate-100">The Results</h2>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400">
            <li><strong className="text-slate-900 dark:text-slate-100">30+ hours saved per month</strong> — eliminated manual QuickBooks-to-spreadsheet data entry entirely</li>
            <li><strong className="text-slate-900 dark:text-slate-100">Zero data entry errors</strong> — automated import removed transposition mistakes and duplicate entries</li>
            <li><strong className="text-slate-900 dark:text-slate-100">5 grants managed in one dashboard</strong> — consolidated view across all Department of Labor awards</li>
            <li><strong className="text-slate-900 dark:text-slate-100">Clean single audit</strong> — no questioned costs or findings related to expense categorization</li>
            <li><strong className="text-slate-900 dark:text-slate-100">Proactive budget management</strong> — threshold alerts prevented overspending in 3 categories across 2 grants</li>
          </ul>

          {/* Quote */}
          <Card className="mt-8 border-l-4 border-l-primary-500">
            <blockquote className="text-lg italic text-slate-700 dark:text-slate-300">
              &ldquo;GrantLedger eliminated an entire layer of manual work that was consuming my team. The QuickBooks
              integration just works — expenses flow in, the AI categorizes them, and we review and confirm. What used to
              take 30 hours a month now takes a fraction of that. Our auditors were impressed that every expense had a
              CFR citation attached before they even asked for one.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
              David Park, Controller
            </p>
            <p className="text-xs text-slate-500">Metro Workforce Alliance</p>
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

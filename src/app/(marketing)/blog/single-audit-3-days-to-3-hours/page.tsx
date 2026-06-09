import type { Metadata } from "next";
import { BlogArticle } from "@/components/marketing/blog-article";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Single Audit Preparation: From 3 Days to 3 Hours",
  description:
    "How Community Health Partners streamlined their single audit preparation from 3 days to 3 hours using GrantLedger's automated expense categorization, CFR citations, and audit-ready reports.",
  alternates: { canonical: "/blog/single-audit-3-days-to-3-hours" },
  openGraph: {
    title: "Single Audit Preparation: From 3 Days to 3 Hours",
    description:
      "Case study: How a nonprofit reduced single audit preparation time by 95% with GrantLedger.",
    type: "article",
    url: "/blog/single-audit-3-days-to-3-hours",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Single Audit Preparation: From 3 Days to 3 Hours",
  description:
    "Case study of how Community Health Partners reduced single audit preparation from 3 days to 3 hours using GrantLedger.",
  datePublished: "2024-10-05",
  author: { "@type": "Organization", name: "GrantLedger" },
  publisher: { "@type": "Organization", name: "GrantLedger" },
  url: `${SITE_URL}/blog/single-audit-3-days-to-3-hours`,
};

const tableOfContents = [
  { id: "the-organization", title: "The Organization" },
  { id: "the-challenge", title: "The Challenge" },
  { id: "the-old-process", title: "The Old Process" },
  { id: "finding-grantledger", title: "Finding GrantLedger" },
  { id: "implementation", title: "Implementation" },
  { id: "the-new-process", title: "The New Process" },
  { id: "audit-day", title: "Audit Day Results" },
  { id: "by-the-numbers", title: "By the Numbers" },
  { id: "looking-ahead", title: "Looking Ahead" },
  { id: "conclusion", title: "Conclusion" },
];

const relatedArticles = [
  {
    title: "Single Audit Preparation Checklist for Federal Grant Recipients",
    href: "/blog/single-audit-preparation-checklist",
    category: "Compliance Guide",
  },
  {
    title: "How AI Categorization Works: Our Methodology Explained",
    href: "/blog/how-ai-categorization-works",
    category: "Product Update",
  },
];

export default function SingleAudit3DaysTo3HoursPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogArticle
        title="Single Audit Preparation: From 3 Days to 3 Hours"
        description="How Community Health Partners, a mid-size nonprofit managing 8 federal grants, reduced their single audit preparation time by 95% using GrantLedger."
        author={{ name: "GrantLedger Team", role: "Compliance & Product" }}
        publishedDate="2024-10-05"
        readingTime="6 min read"
        category="Case Study"
        categoryColor="bg-success-50 text-success-700"
        tableOfContents={tableOfContents}
        relatedArticles={relatedArticles}
      >
        {/* The Organization */}
        <h2 id="the-organization" className="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          The Organization
        </h2>
        <p className="mt-4 leading-relaxed">
          Community Health Partners (CHP) is a mid-size nonprofit based in Portland, Oregon, providing health
          education, substance abuse prevention, and mental health services across three counties. With an annual
          budget of $4.2 million and a staff of 45, CHP manages 8 active federal grants from agencies including
          SAMHSA, HRSA, and the CDC.
        </p>
        <p className="mt-4 leading-relaxed">
          The finance team consists of two people: Maria Reyes, the Director of Finance, and Kevin Park, a Staff
          Accountant. Together they handle all grant financial management, including expense tracking, budget
          reporting, drawdown requests, and audit preparation for over $2.8 million in annual federal expenditures.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm italic text-slate-600 dark:text-slate-400">
            &quot;We were drowning in spreadsheets. Every audit season, I would spend three full days just
            organizing our expense documentation and making sure every transaction was in the right budget category.
            It was the most stressful week of my year.&quot;
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            -- Maria Reyes, Director of Finance, Community Health Partners
          </p>
        </div>

        {/* The Challenge */}
        <h2 id="the-challenge" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          The Challenge
        </h2>
        <p className="mt-4 leading-relaxed">
          With $2.8 million in federal expenditures, CHP exceeds the $750,000 single audit threshold and requires
          an annual single audit under 2 CFR 200 Subpart F. The audit covers all 8 federal grants, and the auditors
          select 2-3 as major programs for detailed compliance testing each year.
        </p>
        <p className="mt-4 leading-relaxed">
          CHP&apos;s audit challenges were common among nonprofits of their size:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Manual expense categorization.</strong> Every transaction in QuickBooks had to be manually reviewed
            and mapped to the correct SF-424A budget category for each grant. With approximately 2,400 transactions
            per year across all grants, this was a massive time investment.
          </li>
          <li>
            <strong>No CFR documentation.</strong> When the auditors asked why a particular expense was classified as
            Contractual rather than Other, Maria had to research the relevant CFR section and explain the reasoning
            on the spot. There was no pre-documented rationale for classification decisions.
          </li>
          <li>
            <strong>Dual-framework complexity.</strong> After October 2024, CHP had 5 grants under the old framework
            and 3 under the new framework. Remembering which equipment threshold and indirect cost rate applied to
            which grant was a constant source of anxiety.
          </li>
          <li>
            <strong>Budget-to-actual reconciliation.</strong> Comparing actual expenditures to the approved budget for
            each grant required exporting data from QuickBooks, manually sorting transactions by category, and building
            separate spreadsheets for each grant.
          </li>
          <li>
            <strong>Audit trail gaps.</strong> There was no systematic record of who categorized each expense, when
            the categorization was reviewed, or what the basis for the categorization decision was.
          </li>
        </ul>

        {/* The Old Process */}
        <h2 id="the-old-process" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          The Old Process: 3 Days of Manual Preparation
        </h2>
        <p className="mt-4 leading-relaxed">
          Before GrantLedger, Maria&apos;s audit preparation process looked like this:
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Day 1: Data Export and Sorting (8 hours)</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Export all transactions from QuickBooks for the fiscal year</li>
          <li>Sort transactions by grant and funding source</li>
          <li>Map each transaction to an SF-424A budget category using a custom spreadsheet</li>
          <li>Identify any transactions that were miscategorized or missing grant tags</li>
          <li>Fix categorization errors in QuickBooks and re-export</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Day 2: Reconciliation and Documentation (8 hours)</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Reconcile per-category totals to the approved budget for each grant</li>
          <li>Identify budget variances and prepare explanations</li>
          <li>Gather supporting documentation for high-dollar transactions</li>
          <li>Prepare the Schedule of Expenditures of Federal Awards (SEFA) draft</li>
          <li>Cross-check SEFA totals against general ledger and federal financial reports</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Day 3: Review and Final Preparation (8 hours)</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Review all categorizations one final time for accuracy</li>
          <li>Prepare the Prepared by Client (PBC) list documents for the auditors</li>
          <li>Organize files into the auditor&apos;s requested folder structure</li>
          <li>Brief the executive director on any potential findings or concerns</li>
          <li>Respond to any last-minute questions from the audit firm</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          This three-day process -- 24 hours of concentrated work -- was repeated every year. And it did not account
          for the ongoing stress of responding to auditor questions during fieldwork, which typically required another
          20-30 hours over the following weeks.
        </p>

        {/* Finding GrantLedger */}
        <h2 id="finding-grantledger" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Finding GrantLedger
        </h2>
        <p className="mt-4 leading-relaxed">
          Maria discovered GrantLedger through a webinar on the October 2024 OMB changes. The dual-framework issue
          was her primary concern -- she was worried about correctly applying different thresholds to different grants.
          But when she saw the AI categorization with CFR citations, she realized the tool addressed a much broader
          set of her challenges.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm italic text-slate-600 dark:text-slate-400">
            &quot;The moment I saw that every expense gets a CFR citation, I knew this would change how we do audits.
            Our auditors spend half their time asking us to justify categorizations. Having the regulatory reference
            right there, for every single transaction, would save us hours of back-and-forth.&quot;
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            -- Maria Reyes, Director of Finance, Community Health Partners
          </p>
        </div>

        {/* Implementation */}
        <h2 id="implementation" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Implementation
        </h2>
        <p className="mt-4 leading-relaxed">
          CHP started their GrantLedger trial in January and completed full implementation within two weeks:
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Week 1: Setup and Data Import</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Connected QuickBooks Online to GrantLedger (OAuth authorization, 5 minutes)</li>
          <li>Set up all 8 grants with award dates, CFDA numbers, and budget allocations</li>
          <li>GrantLedger automatically detected the OMB framework for each grant based on the award date</li>
          <li>Imported the current fiscal year&apos;s transactions from QuickBooks (1,847 transactions at that point)</li>
          <li>AI categorized all 1,847 transactions in under 30 minutes with confidence scores and CFR citations</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Week 2: Review and Confirmation</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Maria and Kevin reviewed the AI categorizations, starting with low-confidence items</li>
          <li>Bulk-approved 1,312 high-confidence categorizations (71%) in one session</li>
          <li>Individually reviewed 438 medium-confidence categorizations, changing 23 (5.3%)</li>
          <li>Individually reviewed 97 low-confidence categorizations, changing 31 (32%)</li>
          <li>Total review time: approximately 6 hours for 1,847 transactions</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          After the initial review, ongoing maintenance was minimal. New transactions synced from QuickBooks daily,
          and Maria spent approximately 15 minutes per day reviewing and confirming the AI categorizations for
          new transactions.
        </p>

        {/* The New Process */}
        <h2 id="the-new-process" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          The New Process: 3 Hours of Focused Review
        </h2>
        <p className="mt-4 leading-relaxed">
          When audit season arrived, Maria&apos;s preparation looked dramatically different:
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Hour 1: Final Review and SEFA Generation</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Reviewed the GrantLedger dashboard for any pending (unconfirmed) expenses -- there were 12</li>
          <li>Confirmed or adjusted the 12 remaining items</li>
          <li>Generated the SEFA report directly from GrantLedger, pre-populated with all required fields</li>
          <li>Verified SEFA totals against the budget-to-actual dashboard for each grant</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Hour 2: Report Export and Documentation</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Exported the per-grant expense detail reports with SF-424A categories and CFR citations</li>
          <li>Generated the budget-to-actual comparison PDF for each of the 8 grants</li>
          <li>Exported the audit trail report showing confirmed_by and confirmed_at for every expense</li>
          <li>Downloaded all reports to the shared audit folder</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Hour 3: Auditor Package Assembly</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Organized the PBC list documents using GrantLedger&apos;s exported reports as the foundation</li>
          <li>Added supplementary documents (grant award letters, time-and-effort records, procurement files)</li>
          <li>Briefed Kevin on the package and assigned follow-up items for any missing documentation</li>
          <li>Sent the complete package to the audit firm</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          Three hours. Not three days. And the quality of the documentation was significantly better than what Maria
          had produced manually, because every expense had a confirmed categorization with a CFR citation and a
          timestamp showing when it was reviewed.
        </p>

        {/* Audit Day Results */}
        <h2 id="audit-day" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Audit Day Results
        </h2>
        <p className="mt-4 leading-relaxed">
          The audit fieldwork itself went noticeably smoother. The auditors commented specifically on the quality
          of CHP&apos;s documentation:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Zero categorization findings.</strong> In previous years, auditors had identified 2-3 expenses
            that were arguably miscategorized. With GrantLedger&apos;s AI categorization and human confirmation
            process, every tested expense was correctly classified and documented.
          </li>
          <li>
            <strong>50% fewer auditor questions.</strong> The CFR citations on every expense pre-answered most of
            the &quot;why is this in this category?&quot; questions that had consumed hours in previous audits.
          </li>
          <li>
            <strong>Faster fieldwork completion.</strong> The auditors completed their fieldwork in 4 days instead
            of the typical 6 days, in part because the documentation was better organized and categorization
            decisions were already justified.
          </li>
          <li>
            <strong>Dual-framework handled correctly.</strong> The auditors specifically tested whether the correct
            thresholds were applied to pre- and post-October 2024 grants. GrantLedger&apos;s automatic framework
            detection meant every threshold was correctly applied.
          </li>
        </ul>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm italic text-slate-600 dark:text-slate-400">
            &quot;Our auditor actually asked me what software we were using because the documentation was so much
            better than last year. When I told her every expense had a CFR citation, she said it was the most
            audit-ready grant documentation she had seen from an organization our size.&quot;
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            -- Maria Reyes, Director of Finance, Community Health Partners
          </p>
        </div>

        {/* By the Numbers */}
        <h2 id="by-the-numbers" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          By the Numbers
        </h2>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 pr-4 text-left font-semibold text-slate-900 dark:text-slate-100">Metric</th>
                <th className="py-3 pr-4 text-left font-semibold text-slate-900 dark:text-slate-100">Before GrantLedger</th>
                <th className="py-3 text-left font-semibold text-slate-900 dark:text-slate-100">After GrantLedger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">Audit preparation time</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">3 days (24 hours)</td>
                <td className="py-3 font-semibold text-success-600 dark:text-success-400">3 hours</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">Expense categorization method</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">Manual spreadsheet review</td>
                <td className="py-3 font-semibold text-success-600 dark:text-success-400">AI + human confirmation</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">CFR citations per expense</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">None</td>
                <td className="py-3 font-semibold text-success-600 dark:text-success-400">100% coverage</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">Categorization audit findings</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">2-3 per year</td>
                <td className="py-3 font-semibold text-success-600 dark:text-success-400">Zero</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">Audit fieldwork duration</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">6 days</td>
                <td className="py-3 font-semibold text-success-600 dark:text-success-400">4 days</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">OMB framework tracking</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">Manual memory / spreadsheet notes</td>
                <td className="py-3 font-semibold text-success-600 dark:text-success-400">Automatic per grant</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">Audit trail documentation</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">Limited (no who/when records)</td>
                <td className="py-3 font-semibold text-success-600 dark:text-success-400">Complete (confirmed_by + confirmed_at)</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">Ongoing categorization effort</td>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400">2-3 hours/week</td>
                <td className="py-3 font-semibold text-success-600 dark:text-success-400">15 minutes/day</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Looking Ahead */}
        <h2 id="looking-ahead" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Looking Ahead
        </h2>
        <p className="mt-4 leading-relaxed">
          CHP has expanded their use of GrantLedger beyond audit preparation. Maria now uses the budget-to-actual
          dashboard for monthly grant reviews with program directors, giving them real-time visibility into spending
          against budget by SF-424A category. The 80% and 90% overspend alerts have caught two budget issues early
          enough to request budget amendments before the expenses exceeded the approved amounts.
        </p>
        <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
          <p className="text-sm italic text-slate-600 dark:text-slate-400">
            &quot;GrantLedger did not just save us time at audit. It changed how we manage grants day-to-day. I can
            see exactly where we are against budget at any point, and I do not have to wait until month-end
            to find out if we have a problem. That peace of mind is worth the subscription by itself.&quot;
          </p>
          <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            -- Maria Reyes, Director of Finance, Community Health Partners
          </p>
        </div>
        <p className="mt-4 leading-relaxed">
          The finance team is also using the time saved to focus on tasks that had been perpetually deferred: updating
          their cost allocation plan, documenting their procurement procedures, and preparing a negotiated indirect
          cost rate proposal (which would replace the de minimis rate and potentially increase their cost recovery).
        </p>

        {/* Conclusion */}
        <h2 id="conclusion" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Conclusion
        </h2>
        <p className="mt-4 leading-relaxed">
          Community Health Partners&apos; experience illustrates a pattern we see across organizations that adopt
          GrantLedger: the most immediate benefit is time savings during audit preparation, but the long-term
          value comes from maintaining audit-ready documentation year-round. When every expense is categorized,
          cited, and confirmed as it comes in, audit preparation becomes a formality rather than a scramble.
        </p>
        <p className="mt-4 leading-relaxed">
          For nonprofit finance teams managing multiple federal grants with limited staff, the question is not
          whether automation can help -- it is how much time and stress you can reclaim by letting AI handle the
          routine classification work while you focus on the judgment calls, stakeholder communication, and strategic
          financial management that only a human can do.
        </p>
      </BlogArticle>
    </>
  );
}

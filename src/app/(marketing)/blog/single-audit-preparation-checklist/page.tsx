import type { Metadata } from "next";
import { BlogArticle } from "@/components/marketing/blog-article";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Single Audit Preparation Checklist for Federal Grant Recipients",
  description:
    "Step-by-step checklist for preparing for a single audit under 2 CFR 200.501, including SEFA preparation, documentation requirements, common findings, and timeline.",
  alternates: { canonical: "/blog/single-audit-preparation-checklist" },
  openGraph: {
    title: "Single Audit Preparation Checklist for Federal Grant Recipients",
    description:
      "Step-by-step checklist for preparing for a single audit under 2 CFR 200.501 for nonprofit organizations.",
    type: "article",
    url: "/blog/single-audit-preparation-checklist",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Single Audit Preparation Checklist for Federal Grant Recipients",
  description:
    "Step-by-step checklist for preparing for a single audit under 2 CFR 200.501.",
  datePublished: "2024-10-28",
  author: { "@type": "Organization", name: "GrantLedger" },
  publisher: { "@type": "Organization", name: "GrantLedger" },
  url: `${SITE_URL}/blog/single-audit-preparation-checklist`,
};

const tableOfContents = [
  { id: "what-is-single-audit", title: "What Is a Single Audit?" },
  { id: "who-needs-one", title: "Who Needs One?" },
  { id: "timeline", title: "Audit Timeline" },
  { id: "sefa-preparation", title: "SEFA Preparation" },
  { id: "documentation-checklist", title: "Documentation Checklist" },
  { id: "internal-controls", title: "Internal Controls Review" },
  { id: "common-findings", title: "Common Audit Findings" },
  { id: "working-with-auditors", title: "Working with Auditors" },
  { id: "after-the-audit", title: "After the Audit" },
  { id: "conclusion", title: "Conclusion" },
];

const relatedArticles = [
  {
    title: "Single Audit Preparation: From 3 Days to 3 Hours",
    href: "/blog/single-audit-3-days-to-3-hours",
    category: "Case Study",
  },
  {
    title: "Complete Guide to 2 CFR 200 Budget Categories for Nonprofits",
    href: "/blog/2-cfr-200-budget-categories-guide",
    category: "Compliance Guide",
  },
];

export default function SingleAuditChecklistPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogArticle
        title="Single Audit Preparation Checklist for Federal Grant Recipients"
        description="A comprehensive, step-by-step checklist covering everything nonprofit finance directors need to prepare for a single audit under 2 CFR 200 Subpart F."
        author={{ name: "GrantLedger Team", role: "Compliance & Product" }}
        publishedDate="2024-10-28"
        readingTime="12 min read"
        category="Compliance Guide"
        categoryColor="bg-primary-50 text-primary-700"
        tableOfContents={tableOfContents}
        relatedArticles={relatedArticles}
      >
        {/* What Is a Single Audit? */}
        <h2 id="what-is-single-audit" className="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          What Is a Single Audit?
        </h2>
        <p className="mt-4 leading-relaxed">
          A single audit (formerly known as an A-133 audit) is an annual audit required by the federal government for
          organizations that expend $750,000 or more in federal awards during their fiscal year. Governed by 2 CFR 200
          Subpart F (sections 200.500 through 200.521), the single audit combines a financial statement audit with a
          compliance audit of federal programs.
        </p>
        <p className="mt-4 leading-relaxed">
          The purpose is to provide assurance that federal funds are being used in accordance with applicable laws,
          regulations, and the terms of the grant awards. Unlike a standard financial audit, a single audit specifically
          examines compliance with federal requirements, tests internal controls over federal programs, and reviews the
          accuracy of the Schedule of Expenditures of Federal Awards (SEFA).
        </p>
        <p className="mt-4 leading-relaxed">
          Single audits are performed by independent auditors (typically CPA firms) and the results are submitted to the
          Federal Audit Clearinghouse (FAC), which makes them publicly available. Federal agencies and pass-through
          entities use these reports to monitor grant compliance and assess organizational risk.
        </p>

        {/* Who Needs One? */}
        <h2 id="who-needs-one" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Who Needs a Single Audit?
        </h2>
        <p className="mt-4 leading-relaxed">
          The single audit requirement applies to non-federal entities that expend $750,000 or more in federal awards
          during their fiscal year (2 CFR 200.501). This threshold applies to the total of all federal awards, not to
          individual grants.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Key points about the threshold:</p>
        <ul className="mt-2 list-disc pl-6 space-y-2">
          <li>
            <strong>Expenditures, not awards.</strong> The $750,000 threshold is based on federal expenditures during
            the fiscal year, not the total amount of grants received or the award amounts.
          </li>
          <li>
            <strong>All federal sources count.</strong> Direct federal grants, subawards from pass-through entities,
            and federal contracts all count toward the threshold.
          </li>
          <li>
            <strong>Both direct and indirect costs count.</strong> If you charge indirect costs to federal grants,
            those amounts are included in your total federal expenditures.
          </li>
          <li>
            <strong>Pass-through funds count for both parties.</strong> If you receive federal funds as a subrecipient,
            those expenditures count toward your threshold. The pass-through entity also counts those funds in their
            own threshold calculation.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          If your organization falls below the $750,000 threshold, you are not required to have a single audit, but
          you remain subject to the other requirements of the Uniform Guidance. Some state governments and pass-through
          entities may also require audits at lower thresholds.
        </p>

        {/* Audit Timeline */}
        <h2 id="timeline" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Audit Timeline
        </h2>
        <p className="mt-4 leading-relaxed">
          The single audit must be completed and submitted within 9 months (previously 30 days for the data collection
          form) after the end of your fiscal year (2 CFR 200.512). Here is a typical timeline for an organization
          with a June 30 fiscal year end:
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="py-3 pr-4 text-left font-semibold text-slate-900 dark:text-slate-100">Timeframe</th>
                <th className="py-3 text-left font-semibold text-slate-900 dark:text-slate-100">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">3-4 months before year-end</td>
                <td className="py-3 text-slate-600 dark:text-slate-400">Engage your audit firm (or confirm engagement)</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">2-3 months before year-end</td>
                <td className="py-3 text-slate-600 dark:text-slate-400">Begin internal preparation: reconcile accounts, review SEFA data</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">Month of year-end</td>
                <td className="py-3 text-slate-600 dark:text-slate-400">Final reconciliations, close books, prepare SEFA draft</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">1-2 months after year-end</td>
                <td className="py-3 text-slate-600 dark:text-slate-400">Interim audit fieldwork (if applicable)</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">2-4 months after year-end</td>
                <td className="py-3 text-slate-600 dark:text-slate-400">Main audit fieldwork, compliance testing, internal control testing</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">4-6 months after year-end</td>
                <td className="py-3 text-slate-600 dark:text-slate-400">Draft audit report review, management response to findings</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">6-9 months after year-end</td>
                <td className="py-3 text-slate-600 dark:text-slate-400">Final audit report issued, submitted to Federal Audit Clearinghouse</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* SEFA Preparation */}
        <h2 id="sefa-preparation" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          SEFA Preparation
        </h2>
        <p className="mt-4 leading-relaxed">
          The Schedule of Expenditures of Federal Awards (SEFA) is the centerpiece document of a single audit. It lists
          every federal program under which your organization expended funds during the fiscal year, along with the
          total expenditures for each program.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Required SEFA elements:</p>
        <ul className="mt-2 list-disc pl-6 space-y-2">
          <li>Federal grantor agency name</li>
          <li>Program title (from the Assistance Listings, formerly CFDA)</li>
          <li>Assistance Listings Number (ALN, formerly CFDA number)</li>
          <li>Award identification number (grant number)</li>
          <li>Pass-through entity name and identifying number (for subawards)</li>
          <li>Total federal expenditures for each program</li>
          <li>Whether the program was a major program (determined by the auditor)</li>
          <li>Amounts passed through to subrecipients</li>
          <li>Footnotes explaining significant accounting policies and any reconciling items</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">SEFA preparation checklist:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Reconcile SEFA expenditures to your general ledger and grant reports</li>
          <li>Verify all Assistance Listings Numbers are current and accurate</li>
          <li>Confirm award numbers match the grant award documents</li>
          <li>Separate direct and pass-through awards</li>
          <li>Identify and report amounts provided to subrecipients</li>
          <li>Include loan balances outstanding for federal loan programs</li>
          <li>Document the basis of accounting used (cash or accrual)</li>
        </ul>

        {/* Documentation Checklist */}
        <h2 id="documentation-checklist" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Documentation Checklist
        </h2>
        <p className="mt-4 leading-relaxed">
          Auditors will request extensive documentation. Having these items prepared before fieldwork begins dramatically
          reduces the time and cost of the audit.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Financial documentation:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>General ledger with grant-level detail for all federal programs</li>
          <li>Trial balance at year-end</li>
          <li>Bank reconciliations for all accounts handling federal funds</li>
          <li>Journal entries affecting federal grant accounts</li>
          <li>Drawdown/reimbursement request records</li>
          <li>Federal financial reports (SF-425 or agency-specific reports)</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Grant documentation:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Grant award letters and notices of award for all active grants</li>
          <li>Approved budgets and any budget modifications</li>
          <li>Grant agreements and terms and conditions</li>
          <li>Correspondence with federal agencies (approval letters, modifications)</li>
          <li>Subrecipient agreements and monitoring documentation</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Compliance documentation:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Time-and-effort documentation for personnel charged to grants</li>
          <li>Procurement files (bids, quotes, contract awards, sole-source justifications)</li>
          <li>Travel documentation (authorization, receipts, per diem calculations)</li>
          <li>Equipment inventory records</li>
          <li>Indirect cost rate agreement (negotiated or de minimis election)</li>
          <li>Written policies and procedures (accounting, procurement, travel, conflict of interest)</li>
          <li>Board minutes reflecting grant activity oversight</li>
        </ul>

        {/* Internal Controls Review */}
        <h2 id="internal-controls" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Internal Controls Review
        </h2>
        <p className="mt-4 leading-relaxed">
          Auditors are required to assess your internal controls over federal programs and report any significant
          deficiencies or material weaknesses. Before the audit, review your controls in these key areas:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-3">
          <li>
            <strong>Segregation of duties.</strong> Are the responsibilities for approving, recording, and
            reconciling grant transactions separated among different individuals? Even small organizations should
            have compensating controls if full segregation is not possible.
          </li>
          <li>
            <strong>Authorization and approval.</strong> Are grant expenditures approved by authorized individuals
            before payment? Is there a documented approval chain?
          </li>
          <li>
            <strong>Expense review and categorization.</strong> Is someone reviewing that expenses are correctly
            categorized to the appropriate budget category and grant? Are misclassifications identified and corrected?
          </li>
          <li>
            <strong>Bank reconciliation.</strong> Are accounts reconciled monthly by someone other than the person
            who records transactions?
          </li>
          <li>
            <strong>Period of performance.</strong> Are there controls to prevent expenses from being charged outside
            the grant&apos;s period of performance?
          </li>
          <li>
            <strong>Matching/cost-sharing.</strong> If matching is required, are there processes to track and document
            matching contributions?
          </li>
          <li>
            <strong>Reporting.</strong> Are federal financial reports prepared timely and accurately? Are they
            reconciled to the general ledger before submission?
          </li>
        </ul>

        {/* Common Findings */}
        <h2 id="common-findings" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Common Single Audit Findings
        </h2>
        <p className="mt-4 leading-relaxed">
          Understanding the most common audit findings helps you focus your preparation efforts. Based on data from the
          Federal Audit Clearinghouse, the most frequent findings include:
        </p>
        <ol className="mt-4 list-decimal pl-6 space-y-3">
          <li>
            <strong>Inadequate time-and-effort documentation.</strong> This is consistently the number one finding.
            Personnel costs are usually the largest expense category, and auditors will test whether time records
            support the amounts charged. Semi-annual certifications or after-the-fact activity reports are required
            for employees splitting time across programs.
          </li>
          <li>
            <strong>Missing or insufficient procurement documentation.</strong> Federal procurement standards require
            documented competition for purchases above the micro-purchase threshold. Common issues include missing
            quotes, inadequate sole-source justifications, and failure to document the basis for contractor selection.
          </li>
          <li>
            <strong>Late or inaccurate federal financial reporting.</strong> SF-425 reports that do not reconcile to
            the general ledger, or reports submitted after the deadline, are frequent findings. Ensure a reconciliation
            process is in place before each reporting period.
          </li>
          <li>
            <strong>Subrecipient monitoring deficiencies.</strong> Organizations that pass federal funds through to
            subrecipients must monitor their compliance. Common findings include failure to issue subaward agreements
            with required elements, lack of ongoing monitoring activities, and not following up on subrecipient audit
            findings.
          </li>
          <li>
            <strong>Period of performance violations.</strong> Expenses charged outside the grant&apos;s authorized
            period of performance (before the start date or after the end date) are questioned costs that may need
            to be repaid.
          </li>
          <li>
            <strong>Inadequate separation of duties.</strong> While common in smaller organizations, this finding
            can be mitigated by implementing compensating controls such as management review and board oversight.
          </li>
        </ol>

        {/* Working with Auditors */}
        <h2 id="working-with-auditors" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Working with Your Auditors
        </h2>
        <p className="mt-4 leading-relaxed">
          A productive auditor relationship saves time and reduces stress. Here are best practices for working
          with your audit team:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Start the conversation early.</strong> Engage your audit firm 3-4 months before year-end. Discuss
            the audit timeline, major programs, and any new grants or significant transactions during the year.
          </li>
          <li>
            <strong>Provide the Prepared by Client (PBC) list promptly.</strong> Auditors will send a list of
            documents they need. Providing these items before fieldwork begins allows the audit to proceed smoothly.
          </li>
          <li>
            <strong>Designate a point person.</strong> Assign one person as the primary contact for the audit. This
            prevents conflicting information and ensures questions are routed to the right staff member.
          </li>
          <li>
            <strong>Respond to questions quickly.</strong> Delays in responding to auditor questions extend the audit
            timeline and increase costs. Set a 48-hour target for responding to all audit inquiries.
          </li>
          <li>
            <strong>Review draft findings carefully.</strong> Before the audit report is finalized, you will have an
            opportunity to review and respond to any findings. Take this seriously -- your management response becomes
            part of the public record.
          </li>
        </ul>

        {/* After the Audit */}
        <h2 id="after-the-audit" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          After the Audit
        </h2>
        <p className="mt-4 leading-relaxed">
          Once the audit is complete, there are several important follow-up steps:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Submit to the Federal Audit Clearinghouse.</strong> The audit report and data collection form must
            be submitted to the FAC within the earlier of 30 calendar days after receipt of the auditor&apos;s report
            or 9 months after the fiscal year end.
          </li>
          <li>
            <strong>Address findings with a corrective action plan.</strong> If there were findings, develop specific
            corrective actions with target dates. Implement changes before the next audit cycle begins.
          </li>
          <li>
            <strong>Notify federal agencies.</strong> If findings affect specific federal programs, notify the
            responsible federal agency and your pass-through entities.
          </li>
          <li>
            <strong>Conduct a post-audit debrief.</strong> Meet with your finance team to discuss what went well,
            what took too long, and what can be improved for next year. Document lessons learned.
          </li>
        </ul>

        {/* Conclusion */}
        <h2 id="conclusion" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Conclusion
        </h2>
        <p className="mt-4 leading-relaxed">
          Single audit preparation does not need to be a last-minute scramble. By maintaining clean records throughout
          the year, reconciling accounts monthly, and having documentation organized and accessible, the audit
          process becomes manageable and predictable.
        </p>
        <p className="mt-4 leading-relaxed">
          The most effective approach is to treat every month like an audit is coming next week. When expenses are
          categorized correctly, documentation is filed immediately, and reconciliations are current, the actual audit
          becomes a confirmation exercise rather than a discovery process.
        </p>
        <p className="mt-4 leading-relaxed">
          GrantLedger helps nonprofits maintain audit readiness year-round by automatically categorizing expenses
          with CFR citations, maintaining a complete audit trail with confirmation timestamps, and generating SEFA-ready
          reports at the click of a button. Organizations using GrantLedger typically reduce their single audit
          preparation time by 80% or more.
        </p>
      </BlogArticle>
    </>
  );
}

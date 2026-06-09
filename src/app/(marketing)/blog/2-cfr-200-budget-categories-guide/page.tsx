import type { Metadata } from "next";
import { BlogArticle } from "@/components/marketing/blog-article";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Complete Guide to 2 CFR 200 Budget Categories for Nonprofits",
  description:
    "A comprehensive walkthrough of all 10 SF-424A budget categories under 2 CFR 200, what belongs in each, common mistakes, and CFR references for nonprofit finance directors.",
  alternates: { canonical: "/blog/2-cfr-200-budget-categories-guide" },
  openGraph: {
    title: "Complete Guide to 2 CFR 200 Budget Categories for Nonprofits",
    description:
      "A comprehensive walkthrough of all 10 SF-424A budget categories under 2 CFR 200 with examples and CFR references.",
    type: "article",
    url: "/blog/2-cfr-200-budget-categories-guide",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Complete Guide to 2 CFR 200 Budget Categories for Nonprofits",
  description:
    "A comprehensive walkthrough of all 10 SF-424A budget categories under 2 CFR 200, what belongs in each, common mistakes, and CFR references.",
  datePublished: "2024-11-15",
  author: { "@type": "Organization", name: "GrantLedger" },
  publisher: { "@type": "Organization", name: "GrantLedger" },
  url: `${SITE_URL}/blog/2-cfr-200-budget-categories-guide`,
};

const tableOfContents = [
  { id: "introduction", title: "Introduction" },
  { id: "personnel", title: "1. Personnel" },
  { id: "fringe-benefits", title: "2. Fringe Benefits" },
  { id: "travel", title: "3. Travel" },
  { id: "equipment", title: "4. Equipment" },
  { id: "supplies", title: "5. Supplies" },
  { id: "contractual", title: "6. Contractual" },
  { id: "construction", title: "7. Construction" },
  { id: "other", title: "8. Other" },
  { id: "indirect-charges", title: "9. Indirect Charges" },
  { id: "total", title: "10. Total" },
  { id: "common-mistakes", title: "Common Mistakes" },
  { id: "conclusion", title: "Conclusion" },
];

const relatedArticles = [
  {
    title: "SF-424A Budget Categories: A Practical Mapping Guide",
    href: "/blog/sf-424a-categories-mapping-guide",
    category: "Compliance Guide",
  },
  {
    title: "What Changed in the October 2024 OMB Uniform Guidance Revision",
    href: "/blog/october-2024-omb-changes",
    category: "Compliance Guide",
  },
];

export default function CfrBudgetCategoriesGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogArticle
        title="Complete Guide to 2 CFR 200 Budget Categories for Nonprofits"
        description="Everything nonprofit finance directors need to know about mapping expenses to the 10 SF-424A budget categories under the Uniform Guidance, with CFR references and practical examples."
        author={{ name: "GrantLedger Team", role: "Compliance & Product" }}
        publishedDate="2024-11-15"
        readingTime="15 min read"
        category="Compliance Guide"
        categoryColor="bg-primary-50 text-primary-700"
        tableOfContents={tableOfContents}
        relatedArticles={relatedArticles}
      >
        {/* Introduction */}
        <h2 id="introduction" className="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Introduction
        </h2>
        <p className="mt-4 leading-relaxed">
          When managing federal grant funding, every dollar must be classified into one of the 10 budget categories defined
          by the SF-424A form. These categories are the standard framework used across federal agencies to organize grant
          budgets, and they are directly tied to the cost principles outlined in 2 CFR 200 (the Uniform Guidance). For
          nonprofit finance directors, understanding these categories is not optional -- it is essential for compliance,
          accurate reporting, and successful audits.
        </p>
        <p className="mt-4 leading-relaxed">
          The Uniform Guidance, formally titled &quot;Uniform Administrative Requirements, Cost Principles, and Audit
          Requirements for Federal Awards&quot; (2 CFR Part 200), governs how federal grant funds can be spent. Subpart E
          (sections 200.400 through 200.476) specifically addresses cost principles, including 56 selected items of cost
          that define what is and is not allowable under federal grants.
        </p>
        <p className="mt-4 leading-relaxed">
          This guide walks through each of the 10 SF-424A categories in detail, explains what expenses belong in each,
          provides real-world examples, and highlights the CFR sections you should reference when categorizing expenses.
        </p>

        {/* 1. Personnel */}
        <h2 id="personnel" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          1. Personnel (2 CFR 200.430)
        </h2>
        <p className="mt-4 leading-relaxed">
          The Personnel category covers salaries, wages, and related compensation for employees who work directly on
          the grant-funded project. This is typically the largest category in most nonprofit grant budgets, often
          representing 40-60% of total direct costs.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">What belongs here:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Salaries and wages for employees working on the grant project</li>
          <li>Proportional compensation for employees splitting time across multiple grants or activities</li>
          <li>Overtime and shift differentials, when authorized and necessary for grant activities</li>
          <li>Temporary or part-time staff assigned to the grant project</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Key requirements:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Charges must be based on records that accurately reflect the work performed (2 CFR 200.430(i))</li>
          <li>Time-and-effort documentation is required, whether through semi-annual certifications or personnel activity reports</li>
          <li>Compensation must be reasonable and consistent with that paid for similar work in the organization</li>
          <li>Incidental activities (less than 5% of total work) do not require detailed time tracking under some frameworks</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Common mistakes:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Charging 100% of an employee&apos;s salary to a grant when they also perform non-grant work</li>
          <li>Missing or inadequate time-and-effort documentation</li>
          <li>Including contractor payments in Personnel instead of Contractual</li>
        </ul>

        {/* 2. Fringe Benefits */}
        <h2 id="fringe-benefits" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          2. Fringe Benefits (2 CFR 200.431)
        </h2>
        <p className="mt-4 leading-relaxed">
          Fringe Benefits are the employer-paid costs associated with personnel compensation. They must correspond
          proportionally to the personnel costs charged to the grant -- if you charge 50% of an employee&apos;s salary
          to a grant, you should charge 50% of their fringe benefits as well.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">What belongs here:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Health, dental, and vision insurance premiums (employer portion)</li>
          <li>Retirement plan contributions (401(k), 403(b), pension)</li>
          <li>FICA taxes (Social Security and Medicare employer share)</li>
          <li>Workers&apos; compensation insurance</li>
          <li>Unemployment insurance (FUTA and state)</li>
          <li>Life and disability insurance</li>
          <li>Paid leave accruals (vacation, sick, holiday) when part of a documented fringe pool</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Key requirements:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Fringe benefit costs must be allowable under the organization&apos;s written policies</li>
          <li>The fringe rate must be reasonable and consistently applied</li>
          <li>Organizations can use either actual fringe costs or a fringe rate approved by their cognizant agency</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          Many nonprofits calculate a composite fringe rate (e.g., 28% of salaries) and apply it consistently. If your
          rate has been approved by your cognizant agency, that rate can be used for budgeting and billing. Otherwise,
          actual costs should be tracked.
        </p>

        {/* 3. Travel */}
        <h2 id="travel" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          3. Travel (2 CFR 200.474)
        </h2>
        <p className="mt-4 leading-relaxed">
          The Travel category covers transportation, lodging, meals, and incidental expenses for employees traveling
          for grant-related purposes. Travel costs are among the most scrutinized expense categories in federal audits,
          so documentation is critical.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">What belongs here:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Airfare (coach/economy class, unless an exception is documented)</li>
          <li>Ground transportation (rental cars, taxis, rideshares, mileage reimbursement)</li>
          <li>Lodging at or below the federal per diem rate (GSA rates for domestic, State Department rates for international)</li>
          <li>Meals and incidental expenses (M&amp;IE) at or below per diem rates</li>
          <li>Conference registration fees when travel is required to attend</li>
          <li>Baggage fees and parking</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Key requirements:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Travel must be directly related to the grant project</li>
          <li>The organization must follow its own written travel policy, or the federal travel regulations (FTR) if no policy exists</li>
          <li>Temporary dependent care costs above normal costs are allowable for travel lasting more than the normal workday</li>
          <li>Commercial air travel must use the lowest available coach fare</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          A common pitfall is mixing employee travel (which goes here) with participant travel (which may go under
          &quot;Other&quot; as participant support costs). If the traveler is not an employee, the expense likely does
          not belong in the Travel category.
        </p>

        {/* 4. Equipment */}
        <h2 id="equipment" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          4. Equipment (2 CFR 200.439)
        </h2>
        <p className="mt-4 leading-relaxed">
          Equipment is defined as tangible personal property with a per-unit acquisition cost at or above the applicable
          threshold and a useful life of more than one year. This is one of the categories most affected by the October
          2024 OMB revisions, which raised the threshold from $5,000 to $10,000 for grants awarded on or after
          October 1, 2024.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Threshold rules:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li><strong>Pre-October 2024 grants:</strong> Equipment threshold is $5,000 per unit</li>
          <li><strong>Post-October 2024 grants:</strong> Equipment threshold is $10,000 per unit</li>
          <li>Your organization may set a lower threshold in its own policies, and the lower threshold applies</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">What belongs here:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Computers and servers at or above the threshold</li>
          <li>Laboratory equipment, scientific instruments</li>
          <li>Vehicles purchased for the grant project</li>
          <li>Specialized machinery or tools above the threshold</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Key requirements:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Equipment purchases typically require prior written approval from the federal awarding agency</li>
          <li>The federal government retains an interest in equipment purchased with grant funds</li>
          <li>Equipment must be used for the authorized purposes of the grant project</li>
          <li>Items below the threshold are classified as Supplies, not Equipment</li>
        </ul>

        {/* 5. Supplies */}
        <h2 id="supplies" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          5. Supplies (2 CFR 200.453)
        </h2>
        <p className="mt-4 leading-relaxed">
          Supplies are tangible personal property that falls below the equipment threshold or has a useful life of
          less than one year. This is often a catch-all category for consumable items and lower-cost tangible goods
          used in grant activities.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">What belongs here:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Office supplies (paper, pens, toner, staples)</li>
          <li>Computing devices under the equipment threshold (laptops under $5K or $10K depending on framework)</li>
          <li>Program materials (curriculum packets, training manuals, printed materials)</li>
          <li>Laboratory consumables (chemicals, glassware, disposables)</li>
          <li>Postage and shipping supplies</li>
          <li>Software licenses under the threshold and with a useful life of less than one year</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Key requirements:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Supplies must be necessary and reasonable for the grant project</li>
          <li>Computing devices are treated as supplies if below the equipment threshold, per 2 CFR 200.1</li>
          <li>Inventory of unused supplies exceeding $5,000 at grant closeout may require return or credit</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          The boundary between Supplies and Equipment is one of the most common sources of classification errors. Always
          check the applicable threshold for your grant&apos;s award date and your organization&apos;s capitalization policy.
        </p>

        {/* 6. Contractual */}
        <h2 id="contractual" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          6. Contractual (2 CFR 200.318-200.327)
        </h2>
        <p className="mt-4 leading-relaxed">
          The Contractual category covers costs for services and goods obtained from external parties through contracts
          or subawards. This includes consultants, subrecipients, and any third-party service providers performing work
          for the grant project.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">What belongs here:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Consultant fees and professional services</li>
          <li>Subawards to other organizations performing grant work</li>
          <li>IT services (web development, database management, hosting if contracted)</li>
          <li>Audit and accounting services related to the grant</li>
          <li>Evaluation services (external program evaluators)</li>
          <li>Training services provided by external vendors</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Key requirements:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Procurement must follow 2 CFR 200.318-200.327 (competitive bidding, conflict of interest, documentation)</li>
          <li>Consultant rates should not exceed the organization&apos;s established rate or the federal daily rate equivalent</li>
          <li>Subaward costs must be monitored, and the first $25,000 (pre-Oct 2024) or $50,000 (post-Oct 2024) is included in the MTDC base</li>
          <li>There must be a written agreement with every contractor or subrecipient</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          A critical distinction is between a contractor (vendor providing goods or services) and a subrecipient
          (organization carrying out part of the grant program). The classification affects monitoring requirements,
          audit obligations, and how costs are reported to the federal awarding agency.
        </p>

        {/* 7. Construction */}
        <h2 id="construction" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          7. Construction
        </h2>
        <p className="mt-4 leading-relaxed">
          The Construction category applies to grants that specifically authorize building construction, renovation,
          or major alteration work. Most nonprofit program grants do not include construction, but when they do, this
          category carries additional compliance requirements.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">What belongs here:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>New building construction authorized by the grant</li>
          <li>Major renovations or alterations to existing facilities</li>
          <li>Demolition costs, site preparation, and related engineering services</li>
          <li>Construction management fees</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Key requirements:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Construction must be explicitly authorized in the grant award</li>
          <li>Davis-Bacon Act prevailing wage requirements may apply</li>
          <li>Environmental review (NEPA) may be required before construction begins</li>
          <li>Bonding requirements typically apply for construction contracts over $250,000</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          If your grant does not authorize construction, this category should have a zero budget. Minor repairs and
          maintenance are typically classified under &quot;Other&quot; or included in indirect costs, not Construction.
        </p>

        {/* 8. Other */}
        <h2 id="other" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          8. Other
        </h2>
        <p className="mt-4 leading-relaxed">
          The Other category is a flexible classification for allowable costs that do not fit neatly into the first
          seven categories. Despite its name, &quot;Other&quot; is not a dumping ground -- every expense must still
          be reasonable, allocable, and allowable under 2 CFR 200.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">What commonly belongs here:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Participant support costs (stipends, subsistence, travel for program participants, not employees)</li>
          <li>Rent and utilities for grant-specific space</li>
          <li>Telephone and internet service charges</li>
          <li>Printing, copying, and publication costs</li>
          <li>Insurance costs directly attributable to the grant</li>
          <li>Subscriptions to professional journals or databases for the grant project</li>
          <li>Space rental for grant events or training sessions</li>
          <li>Background checks or drug testing required by the grant</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Key requirements:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Participant support costs often require prior agency approval and cannot be moved to other budget categories without approval</li>
          <li>Costs must not be included in the indirect cost rate if charged directly</li>
          <li>Each item must still meet the basic cost principles: necessary, reasonable, allocable, and consistently treated</li>
        </ul>

        {/* 9. Indirect Charges */}
        <h2 id="indirect-charges" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          9. Indirect Charges (2 CFR 200.414)
        </h2>
        <p className="mt-4 leading-relaxed">
          Indirect costs (also called facilities and administrative costs, or F&amp;A) are costs that benefit multiple
          programs or activities and cannot be easily assigned to a specific grant. They are recovered through an
          indirect cost rate applied to a base of direct costs.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">What is typically included in indirect costs:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>General administration (executive staff, accounting, HR, legal)</li>
          <li>Facilities costs (rent, utilities, maintenance for shared spaces)</li>
          <li>Depreciation on buildings and equipment used across programs</li>
          <li>General liability insurance</li>
          <li>IT infrastructure (shared servers, network, general software)</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Indirect cost rate options:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li><strong>Negotiated rate:</strong> A rate approved by your cognizant federal agency, based on actual cost data</li>
          <li><strong>De minimis rate:</strong> 10% of modified total direct costs (MTDC) for pre-October 2024 grants, or 15% for post-October 2024 grants</li>
          <li><strong>10% de minimis:</strong> Available to organizations that have never had a negotiated rate</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">MTDC base exclusions:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Equipment</li>
          <li>Capital expenditures</li>
          <li>Participant support costs</li>
          <li>Subawards in excess of $25,000 (pre-Oct 2024) or $50,000 (post-Oct 2024)</li>
          <li>Patient care charges and rental costs of off-site facilities</li>
          <li>Tuition remission</li>
          <li>Scholarships and fellowships</li>
        </ul>

        {/* 10. Total */}
        <h2 id="total" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          10. Total
        </h2>
        <p className="mt-4 leading-relaxed">
          The Total category on the SF-424A is simply the sum of all nine preceding categories (Personnel through
          Indirect Charges). It represents the complete grant budget and must match the total award amount. While this
          is a calculated field, it serves as an important reconciliation checkpoint.
        </p>
        <p className="mt-4 leading-relaxed">
          When preparing budget reports or drawdown requests, verify that your category totals sum correctly and match
          the approved budget. Any discrepancies between individual category totals and the overall sum can trigger
          audit findings or delay reimbursement.
        </p>

        {/* Common Mistakes */}
        <h2 id="common-mistakes" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Common Classification Mistakes
        </h2>
        <p className="mt-4 leading-relaxed">
          After reviewing thousands of grant expense records, these are the most frequent classification errors we see:
        </p>
        <ol className="mt-4 list-decimal pl-6 space-y-3">
          <li>
            <strong>Putting contractor payments in Personnel.</strong> Only employees appear in Personnel. Independent
            contractors, consultants, and subrecipients belong in Contractual, regardless of how closely they work with
            your team.
          </li>
          <li>
            <strong>Misclassifying supplies as equipment (or vice versa).</strong> The dollar threshold and useful life
            determine the boundary. A $4,000 laptop is Supplies under the pre-October 2024 framework and the post-October
            2024 framework.
          </li>
          <li>
            <strong>Charging costs both directly and through indirect.</strong> If rent is included in your indirect cost
            rate calculation, you cannot also charge it directly as &quot;Other.&quot; This is called double-dipping and
            is a common audit finding.
          </li>
          <li>
            <strong>Ignoring participant support cost restrictions.</strong> Participant support costs (stipends, travel
            for non-employees) have special rules -- they often cannot be re-budgeted without agency approval and are
            excluded from the MTDC base.
          </li>
          <li>
            <strong>Missing fringe benefit proportionality.</strong> If 40% of an employee&apos;s salary is charged to a
            grant, 40% of their fringe benefits should be charged as well. Inconsistent ratios raise audit red flags.
          </li>
          <li>
            <strong>Applying the wrong OMB framework threshold.</strong> Grants awarded before October 1, 2024 use
            the pre-revision thresholds ($5K equipment, 10% de minimis). Grants awarded on or after that date use
            the new thresholds. Mixing these up can result in miscategorized expenses.
          </li>
        </ol>

        {/* Conclusion */}
        <h2 id="conclusion" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Conclusion
        </h2>
        <p className="mt-4 leading-relaxed">
          Accurate budget category classification is the foundation of federal grant compliance. Every expense must be
          correctly mapped to one of the 10 SF-424A categories, supported by adequate documentation, and consistent with
          both the cost principles in 2 CFR 200 and the terms of your specific grant award.
        </p>
        <p className="mt-4 leading-relaxed">
          The key principles to remember are: costs must be reasonable, allocable to the grant, consistently treated
          across all funding sources, and conform to the limitations in the Uniform Guidance and the grant agreement.
          When in doubt, consult your grants management team or contact your federal program officer for guidance.
        </p>
        <p className="mt-4 leading-relaxed">
          GrantLedger automates this classification process using AI that understands all 10 SF-424A categories, the 56
          selected items of cost in 2 CFR 200 Subpart E, and the applicable OMB framework for your grant. Every
          AI-generated categorization includes a confidence score and specific CFR citation, and every categorization
          requires human confirmation before it becomes final.
        </p>
      </BlogArticle>
    </>
  );
}

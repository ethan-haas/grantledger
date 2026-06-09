import type { Metadata } from "next";
import { BlogArticle } from "@/components/marketing/blog-article";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "What Changed in the October 2024 OMB Uniform Guidance Revision",
  description:
    "Key threshold changes in the October 2024 OMB revisions: equipment threshold ($5K to $10K), de minimis IDC rate (10% to 15%), subaward MTDC exclusion ($25K to $50K), and practical implications for nonprofits.",
  alternates: { canonical: "/blog/october-2024-omb-changes" },
  openGraph: {
    title: "What Changed in the October 2024 OMB Uniform Guidance Revision",
    description:
      "Key threshold changes in the October 2024 OMB revisions and how they affect federal grant management for nonprofits.",
    type: "article",
    url: "/blog/october-2024-omb-changes",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What Changed in the October 2024 OMB Uniform Guidance Revision",
  description:
    "Key threshold changes in the October 2024 OMB revisions and how they affect federal grant management.",
  datePublished: "2024-11-10",
  author: { "@type": "Organization", name: "GrantLedger" },
  publisher: { "@type": "Organization", name: "GrantLedger" },
  url: `${SITE_URL}/blog/october-2024-omb-changes`,
};

const tableOfContents = [
  { id: "overview", title: "Overview" },
  { id: "effective-date", title: "Effective Date Rules" },
  { id: "equipment-threshold", title: "Equipment Threshold Change" },
  { id: "de-minimis-rate", title: "De Minimis IDC Rate Change" },
  { id: "subaward-mtdc", title: "Subaward MTDC Exclusion Change" },
  { id: "other-changes", title: "Other Notable Changes" },
  { id: "dual-framework", title: "Managing Dual Frameworks" },
  { id: "practical-steps", title: "Practical Steps" },
  { id: "conclusion", title: "Conclusion" },
];

const relatedArticles = [
  {
    title: "Complete Guide to 2 CFR 200 Budget Categories for Nonprofits",
    href: "/blog/2-cfr-200-budget-categories-guide",
    category: "Compliance Guide",
  },
  {
    title: "SF-424A Budget Categories: A Practical Mapping Guide",
    href: "/blog/sf-424a-categories-mapping-guide",
    category: "Compliance Guide",
  },
];

export default function OctoberOmbChangesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogArticle
        title="What Changed in the October 2024 OMB Uniform Guidance Revision"
        description="A detailed breakdown of the key threshold changes in the October 2024 OMB revision to 2 CFR 200, which grants are affected, and what nonprofit finance directors need to do."
        author={{ name: "GrantLedger Team", role: "Compliance & Product" }}
        publishedDate="2024-11-10"
        readingTime="10 min read"
        category="Compliance Guide"
        categoryColor="bg-primary-50 text-primary-700"
        tableOfContents={tableOfContents}
        relatedArticles={relatedArticles}
      >
        {/* Overview */}
        <h2 id="overview" className="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Overview
        </h2>
        <p className="mt-4 leading-relaxed">
          On October 1, 2024, significant revisions to 2 CFR Part 200 (the Uniform Guidance) took effect, representing
          the most substantial update to federal grant cost principles since the Uniform Guidance was originally
          published in 2013. These revisions, finalized by the Office of Management and Budget (OMB), affect how
          nonprofits classify expenses, calculate indirect costs, and manage subaward budgets.
        </p>
        <p className="mt-4 leading-relaxed">
          The three most impactful changes for nonprofit finance directors are the equipment classification threshold,
          the de minimis indirect cost rate, and the subaward modified total direct cost (MTDC) exclusion. Each of
          these changes raises a dollar threshold, which generally benefits grant recipients by providing more
          flexibility and higher cost recovery. However, the transition period -- where organizations may have both
          pre- and post-revision grants active simultaneously -- creates new compliance complexity.
        </p>

        {/* Effective Date Rules */}
        <h2 id="effective-date" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Effective Date Rules
        </h2>
        <p className="mt-4 leading-relaxed">
          The revised Uniform Guidance applies to federal awards made on or after October 1, 2024. This means:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>New grants awarded on or after October 1, 2024</strong> follow the revised thresholds. The award
            date (not the application date or the project start date) determines which framework applies.
          </li>
          <li>
            <strong>Existing grants awarded before October 1, 2024</strong> continue to follow the pre-revision
            thresholds for the remainder of their performance period, even if the performance period extends past
            October 2024.
          </li>
          <li>
            <strong>Supplemental awards and amendments</strong> to existing grants generally remain under the original
            framework unless the federal awarding agency specifies otherwise in the amendment terms.
          </li>
          <li>
            <strong>Continuation awards</strong> (non-competing continuations of multi-year grants) typically maintain
            the framework of the original award, but agencies may require adoption of the new rules.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          This means most nonprofits will operate under two frameworks simultaneously for a period of two to five
          years, depending on the duration of their pre-October 2024 grants. This dual-framework reality is one of
          the biggest operational challenges created by the revision.
        </p>

        {/* Equipment Threshold Change */}
        <h2 id="equipment-threshold" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Equipment Threshold: $5,000 to $10,000
        </h2>
        <p className="mt-4 leading-relaxed">
          Under the pre-revision Uniform Guidance, equipment was defined as tangible personal property with a per-unit
          acquisition cost of $5,000 or more and a useful life of more than one year (2 CFR 200.1). The October 2024
          revision raises this threshold to $10,000.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">What this means in practice:</p>
        <ul className="mt-2 list-disc pl-6 space-y-2">
          <li>
            Items costing between $5,000 and $9,999 are now classified as <strong>Supplies</strong> under
            post-October 2024 grants, where they were previously classified as <strong>Equipment</strong>.
          </li>
          <li>
            Supplies are included in the MTDC base for indirect cost calculations, while Equipment is excluded.
            This means more direct costs are included in the indirect cost base, potentially increasing indirect
            cost recovery.
          </li>
          <li>
            Equipment purchases require more stringent procurement and disposition procedures than supplies.
            Reclassifying items as supplies reduces the administrative burden for those purchases.
          </li>
          <li>
            Property management and inventory tracking requirements under 2 CFR 200.313 apply only to Equipment,
            not Supplies. Items reclassified as Supplies no longer need to be tagged and inventoried as equipment.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          <strong>Important caveat:</strong> Your organization may have a capitalization threshold lower than the
          federal threshold in its own accounting policies. If your organization capitalizes assets at $3,000, items
          between $3,000 and $9,999 should still follow your internal policies for capitalization, even if they are
          classified as Supplies for SF-424A reporting purposes under the new framework.
        </p>

        {/* De Minimis IDC Rate */}
        <h2 id="de-minimis-rate" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          De Minimis Indirect Cost Rate: 10% to 15%
        </h2>
        <p className="mt-4 leading-relaxed">
          The de minimis indirect cost rate, available to organizations that have never had a negotiated indirect cost
          rate, increases from 10% to 15% of modified total direct costs (MTDC) under the revised Uniform Guidance
          (2 CFR 200.414(f)).
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Who benefits:</p>
        <ul className="mt-2 list-disc pl-6 space-y-2">
          <li>
            <strong>Smaller nonprofits</strong> that have never negotiated an indirect cost rate with a federal
            cognizant agency. These organizations can now recover 15% instead of 10% for overhead costs.
          </li>
          <li>
            <strong>New grant recipients</strong> applying for federal funding for the first time. The higher rate
            provides more realistic cost recovery from day one.
          </li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Important details:</p>
        <ul className="mt-2 list-disc pl-6 space-y-2">
          <li>
            The 15% rate applies to new awards made on or after October 1, 2024. Existing awards continue at the
            10% rate unless the awarding agency allows an update.
          </li>
          <li>
            Organizations with a negotiated rate must use their negotiated rate, not the de minimis rate. The de
            minimis rate is only for organizations without a negotiated rate agreement.
          </li>
          <li>
            Some federal programs or agencies may cap indirect cost rates below the de minimis rate. Always check
            the specific terms of your grant award.
          </li>
          <li>
            The de minimis rate is applied to MTDC, which excludes equipment, capital expenditures, participant
            support costs, and subaward amounts above the applicable threshold.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          For a nonprofit with $500,000 in eligible MTDC, this change means an additional $25,000 in indirect cost
          recovery per year ($75,000 at 15% vs. $50,000 at 10%). For many small nonprofits, this additional funding
          can cover meaningful operational costs that were previously absorbed from unrestricted funds.
        </p>

        {/* Subaward MTDC */}
        <h2 id="subaward-mtdc" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Subaward MTDC Exclusion: $25,000 to $50,000
        </h2>
        <p className="mt-4 leading-relaxed">
          When calculating MTDC for indirect cost purposes, subaward costs are included in the base only up to a
          certain threshold per subaward. The revision increases this threshold from $25,000 to $50,000.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">How this works:</p>
        <ul className="mt-2 list-disc pl-6 space-y-2">
          <li>
            <strong>Pre-October 2024:</strong> The first $25,000 of each subaward is included in your MTDC base.
            Amounts above $25,000 are excluded from the indirect cost calculation.
          </li>
          <li>
            <strong>Post-October 2024:</strong> The first $50,000 of each subaward is included in your MTDC base.
            Amounts above $50,000 are excluded.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          This change benefits pass-through entities (organizations that issue subawards under their federal grants)
          by increasing the MTDC base and therefore increasing indirect cost recovery. If you issue three subawards
          of $100,000 each, your MTDC base now includes $150,000 (3 x $50,000) instead of $75,000 (3 x $25,000) from
          those subawards -- an additional $75,000 in the indirect cost base.
        </p>

        {/* Other Notable Changes */}
        <h2 id="other-changes" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Other Notable Changes
        </h2>
        <p className="mt-4 leading-relaxed">
          Beyond the three headline threshold changes, the October 2024 revision includes several other updates
          worth noting:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-3">
          <li>
            <strong>Simplified procurement thresholds:</strong> The micro-purchase threshold has been updated to
            align with the Federal Acquisition Regulation (FAR) thresholds, providing more flexibility for small
            purchases without formal competitive bidding.
          </li>
          <li>
            <strong>Expanded use of fixed-amount subawards:</strong> The revision provides clearer guidance on
            issuing fixed-amount subawards, which can simplify administration for pass-through entities.
          </li>
          <li>
            <strong>Clarified language on prior written approval:</strong> Several provisions have been updated
            to clarify when prior written approval from the federal awarding agency is required, reducing ambiguity
            in day-to-day grant management.
          </li>
          <li>
            <strong>Updated single audit thresholds:</strong> The $750,000 threshold for requiring a single audit
            remains unchanged, but certain aspects of the audit process and reporting have been streamlined.
          </li>
          <li>
            <strong>Enhanced requirements for cybersecurity:</strong> New provisions address cybersecurity measures
            for organizations managing federal data, reflecting the growing importance of data security in grant
            management.
          </li>
        </ul>

        {/* Managing Dual Frameworks */}
        <h2 id="dual-framework" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Managing Dual Frameworks
        </h2>
        <p className="mt-4 leading-relaxed">
          For the next several years, most nonprofits will manage grants under both the pre-October 2024 and
          post-October 2024 frameworks simultaneously. This dual-framework period creates several operational
          challenges:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-3">
          <li>
            <strong>Equipment vs. Supplies classification varies by grant.</strong> A $7,000 laptop is Equipment
            on a pre-October 2024 grant but Supplies on a post-October 2024 grant. Staff must check the award
            date before categorizing each expense.
          </li>
          <li>
            <strong>Indirect cost calculations differ.</strong> The MTDC base and applicable rates may vary
            between grants in the same fiscal year. Organizations need processes to ensure the correct rate and
            base are applied to each grant.
          </li>
          <li>
            <strong>Subaward tracking requires per-grant thresholds.</strong> The MTDC inclusion threshold for
            subawards differs based on the grant&apos;s framework, requiring separate tracking for the indirect
            cost calculation on each grant.
          </li>
          <li>
            <strong>Training and documentation.</strong> Finance staff need to understand both frameworks and
            know which applies to each grant. Written procedures should document how the organization determines
            which framework applies and how expenses are categorized accordingly.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          GrantLedger automatically detects the applicable OMB framework based on each grant&apos;s award date and
          applies the correct thresholds when categorizing expenses. This eliminates one of the most error-prone
          aspects of dual-framework management.
        </p>

        {/* Practical Steps */}
        <h2 id="practical-steps" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Practical Steps for Nonprofit Finance Directors
        </h2>
        <p className="mt-4 leading-relaxed">
          Here are the concrete actions you should take to prepare for and manage the transition:
        </p>
        <ol className="mt-4 list-decimal pl-6 space-y-3">
          <li>
            <strong>Inventory your active grants.</strong> List every active grant with its award date, performance
            period, and the applicable framework (pre or post-October 2024). This is your reference document for
            the transition period.
          </li>
          <li>
            <strong>Update your written policies.</strong> Review and update your accounting policies manual to
            address the new thresholds. Document how your organization determines which framework applies and how
            the dual-framework period is managed.
          </li>
          <li>
            <strong>Retrain your finance team.</strong> Ensure every person who categorizes expenses or prepares
            grant reports understands the difference between the two frameworks and knows how to identify which
            applies to each grant.
          </li>
          <li>
            <strong>Review your capitalization policy.</strong> If your organization&apos;s capitalization threshold
            is below $10,000, consider whether to update it. Remember that the organizational threshold still
            applies for internal accounting purposes.
          </li>
          <li>
            <strong>Recalculate indirect cost projections.</strong> If you use the de minimis rate, model the
            impact of the 15% rate on your new awards. If you have a negotiated rate, confirm with your cognizant
            agency whether any adjustments are needed.
          </li>
          <li>
            <strong>Update your systems.</strong> Ensure your accounting software and grant management tools can
            handle different thresholds for different grants. This may require custom configurations or upgrading
            to a system that supports dual-framework tracking.
          </li>
        </ol>

        {/* Conclusion */}
        <h2 id="conclusion" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Conclusion
        </h2>
        <p className="mt-4 leading-relaxed">
          The October 2024 OMB revisions to the Uniform Guidance bring welcome increases to key thresholds that
          benefit nonprofit grant recipients. However, the transition period requires careful management to ensure
          compliance across grants operating under different frameworks.
        </p>
        <p className="mt-4 leading-relaxed">
          The most important thing to remember is that the award date determines the framework. Every classification
          decision, indirect cost calculation, and subaward tracking approach must start with the question: when was
          this grant awarded?
        </p>
        <p className="mt-4 leading-relaxed">
          GrantLedger handles this automatically by detecting the OMB framework from the grant&apos;s award date and
          applying the correct thresholds to every expense categorization. Finance directors can focus on reviewing
          and confirming AI-generated categorizations rather than memorizing which threshold applies to which grant.
        </p>
      </BlogArticle>
    </>
  );
}

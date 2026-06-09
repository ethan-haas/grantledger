import type { Metadata } from "next";
import { BlogArticle } from "@/components/marketing/blog-article";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "SF-424A Budget Categories: A Practical Mapping Guide",
  description:
    "A detailed walkthrough of all 10 SF-424A categories with real-world examples of how common nonprofit expenses should be classified, including CFR references and common mapping mistakes.",
  alternates: { canonical: "/blog/sf-424a-categories-mapping-guide" },
  openGraph: {
    title: "SF-424A Budget Categories: A Practical Mapping Guide",
    description:
      "Practical guide to mapping real-world nonprofit expenses to SF-424A budget categories with examples and CFR references.",
    type: "article",
    url: "/blog/sf-424a-categories-mapping-guide",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "SF-424A Budget Categories: A Practical Mapping Guide",
  description:
    "A detailed walkthrough of all 10 SF-424A categories with real-world examples and CFR references.",
  datePublished: "2024-10-20",
  author: { "@type": "Organization", name: "GrantLedger" },
  publisher: { "@type": "Organization", name: "GrantLedger" },
  url: `${SITE_URL}/blog/sf-424a-categories-mapping-guide`,
};

const tableOfContents = [
  { id: "about-sf-424a", title: "About SF-424A" },
  { id: "mapping-personnel", title: "Mapping Personnel" },
  { id: "mapping-fringe", title: "Mapping Fringe Benefits" },
  { id: "mapping-travel", title: "Mapping Travel" },
  { id: "mapping-equipment", title: "Mapping Equipment" },
  { id: "mapping-supplies", title: "Mapping Supplies" },
  { id: "mapping-contractual", title: "Mapping Contractual" },
  { id: "mapping-construction", title: "Mapping Construction" },
  { id: "mapping-other", title: "Mapping Other" },
  { id: "mapping-indirect", title: "Mapping Indirect Charges" },
  { id: "gray-areas", title: "Gray Areas & Edge Cases" },
  { id: "conclusion", title: "Conclusion" },
];

const relatedArticles = [
  {
    title: "Complete Guide to 2 CFR 200 Budget Categories for Nonprofits",
    href: "/blog/2-cfr-200-budget-categories-guide",
    category: "Compliance Guide",
  },
  {
    title: "How AI Categorization Works: Our Methodology Explained",
    href: "/blog/how-ai-categorization-works",
    category: "Product Update",
  },
];

export default function Sf424aMappingGuidePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogArticle
        title="SF-424A Budget Categories: A Practical Mapping Guide"
        description="A detailed, example-driven guide to mapping real-world nonprofit expenses to the 10 SF-424A budget categories, with CFR references and common pitfalls."
        author={{ name: "GrantLedger Team", role: "Compliance & Product" }}
        publishedDate="2024-10-20"
        readingTime="15 min read"
        category="Compliance Guide"
        categoryColor="bg-primary-50 text-primary-700"
        tableOfContents={tableOfContents}
        relatedArticles={relatedArticles}
      >
        {/* About SF-424A */}
        <h2 id="about-sf-424a" className="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          About the SF-424A Form
        </h2>
        <p className="mt-4 leading-relaxed">
          The SF-424A (Budget Information for Non-Construction Programs) is the standard federal budget form used to
          present the financial plan for grant applications and to report actual expenditures during and after the grant
          period. It organizes all costs into 10 categories that collectively represent the full grant budget.
        </p>
        <p className="mt-4 leading-relaxed">
          While the form itself is straightforward -- essentially a table with 10 rows -- the challenge lies in
          correctly mapping real-world expenses into these categories. A rental payment for office space used by
          grant staff: is that Other or Indirect? A software subscription: Equipment, Supplies, or Other? A consultant
          who works on-site daily: Personnel or Contractual?
        </p>
        <p className="mt-4 leading-relaxed">
          This guide provides practical, example-driven answers to these mapping questions. For each category, we cover
          what belongs there, what does not, specific real-world examples, and the most common mapping mistakes.
        </p>

        {/* Mapping Personnel */}
        <h2 id="mapping-personnel" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mapping Personnel Expenses
        </h2>
        <p className="mt-4 leading-relaxed">
          The Personnel category is exclusively for compensation paid to your organization&apos;s employees. The
          defining question is: is this person on your payroll? If yes, their compensation goes in Personnel. If no,
          it goes in Contractual.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Belongs in Personnel:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Program director salary (full-time, 100% grant-funded): full amount to Personnel</li>
          <li>Case manager salary (50% grant-funded, 50% other): 50% of salary to Personnel on this grant</li>
          <li>Data entry clerk hired specifically for grant reporting: full amount to Personnel</li>
          <li>Executive director who spends 10% of time on grant oversight: 10% of salary to Personnel</li>
          <li>Overtime pay for grant staff during peak reporting periods</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Does NOT belong in Personnel:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Independent contractor doing program evaluation (goes to Contractual)</li>
          <li>Temporary staffing agency workers (goes to Contractual -- they are not your employees)</li>
          <li>Stipends paid to program participants (goes to Other as participant support)</li>
          <li>Volunteer time as in-kind match (not a cash expense; documented separately)</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          <strong>CFR reference:</strong> 2 CFR 200.430 governs compensation for personal services. The key requirement
          is that charges are based on records that accurately reflect the work performed, and that compensation rates
          are reasonable and consistent with the organization&apos;s pay policies.
        </p>

        {/* Mapping Fringe Benefits */}
        <h2 id="mapping-fringe" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mapping Fringe Benefits
        </h2>
        <p className="mt-4 leading-relaxed">
          Fringe benefits must mirror the Personnel allocation. If 60% of an employee&apos;s salary is charged to a
          grant, then 60% of their fringe benefits should be charged to the same grant. This proportionality is a
          fundamental compliance requirement.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Belongs in Fringe Benefits:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>FICA/Medicare employer contributions for grant-funded staff</li>
          <li>Health insurance premiums (employer portion) for grant-funded staff</li>
          <li>403(b) or 401(k) employer match for grant-funded staff</li>
          <li>Workers&apos; compensation premiums allocated to grant-funded positions</li>
          <li>State unemployment insurance allocated to grant-funded positions</li>
          <li>Employer-paid life insurance and disability insurance</li>
          <li>Accrued paid leave (when included in an approved fringe rate)</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Does NOT belong in Fringe Benefits:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Fringe costs for contractors (contractors do not receive fringe benefits from your organization)</li>
          <li>Tuition reimbursement for non-grant-related education</li>
          <li>Executive perks not part of the standard benefit package</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          <strong>Practical tip:</strong> Most organizations maintain a composite fringe rate (e.g., 32% of salaries)
          that is applied consistently. If your rate has been approved by your cognizant agency, use that rate. Otherwise,
          calculate actual fringe costs for each employee charged to the grant.
        </p>

        {/* Mapping Travel */}
        <h2 id="mapping-travel" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mapping Travel Expenses
        </h2>
        <p className="mt-4 leading-relaxed">
          Travel expenses are specifically for your employees (or authorized representatives) traveling for grant
          purposes. The most common mistake is including non-employee travel here.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Belongs in Travel:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Airfare for program director attending a required federal conference</li>
          <li>Hotel costs for staff conducting site visits to program locations</li>
          <li>Mileage reimbursement for case workers visiting clients (IRS standard rate or organization rate)</li>
          <li>Per diem for meals during overnight grant-related travel</li>
          <li>Rental car for staff traveling to a remote program site</li>
          <li>Parking and tolls during grant-related travel</li>
          <li>Ground transportation (taxi, rideshare) between airport and hotel</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Does NOT belong in Travel:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Travel costs for program participants (goes to Other as participant support, per 2 CFR 200.456)</li>
          <li>Travel reimbursement for an outside consultant (goes to Contractual as part of the consultant&apos;s contract)</li>
          <li>Local commuting costs for staff (not allowable under federal grants)</li>
          <li>First-class airfare (not allowable unless documented exception exists)</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          <strong>CFR reference:</strong> 2 CFR 200.474 covers travel costs. Organizations must follow their own
          written travel policy, or the federal travel regulations if no organizational policy exists. GSA per diem
          rates (gsa.gov) set the maximum allowable rates for domestic travel.
        </p>

        {/* Mapping Equipment */}
        <h2 id="mapping-equipment" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mapping Equipment Expenses
        </h2>
        <p className="mt-4 leading-relaxed">
          Equipment classification depends on two factors: per-unit cost and useful life. The item must meet BOTH
          criteria -- above the applicable threshold AND useful life of more than one year -- to be classified as
          Equipment.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Belongs in Equipment (pre-October 2024, $5K threshold):</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Server hardware costing $8,000 with 5-year useful life</li>
          <li>Laboratory microscope costing $6,500</li>
          <li>Vehicle purchased for $25,000 for program delivery</li>
          <li>Audio/visual equipment package costing $7,200 for a training center</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Belongs in Equipment (post-October 2024, $10K threshold):</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Same server at $8,000: now classified as <strong>Supplies</strong>, not Equipment</li>
          <li>Same microscope at $6,500: now classified as <strong>Supplies</strong>, not Equipment</li>
          <li>Vehicle at $25,000: still Equipment (above both thresholds)</li>
          <li>Specialized software license costing $12,000 with multi-year term: Equipment</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Does NOT belong in Equipment:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Laptop costing $1,200 (below threshold -- goes to Supplies)</li>
          <li>Annual software subscription of $6,000 (useful life is one year -- goes to Other or Supplies)</li>
          <li>Leased equipment (lease payments go to Contractual or Other, depending on the arrangement)</li>
        </ul>

        {/* Mapping Supplies */}
        <h2 id="mapping-supplies" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mapping Supply Expenses
        </h2>
        <p className="mt-4 leading-relaxed">
          Supplies catch everything tangible that does not meet the Equipment criteria. This is a broad category, but
          the items must still be directly used for grant purposes.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Belongs in Supplies:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Office supplies: paper, printer toner, pens, folders, binders ($200 total)</li>
          <li>Program materials: educational workbooks at $15 each, 200 copies ($3,000 total)</li>
          <li>Laptops for case workers at $1,100 each (below equipment threshold)</li>
          <li>Tablets for data collection in the field at $500 each</li>
          <li>Postage for mailing program materials to participants ($800/year)</li>
          <li>Cleaning supplies for a grant-funded facility</li>
          <li>Food and refreshments for program activities (if allowable under the grant)</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Does NOT belong in Supplies:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>General office supplies shared across all programs (should be in indirect costs unless directly allocable)</li>
          <li>Items above the equipment threshold with useful life over one year (goes to Equipment)</li>
          <li>Gift cards or incentives for participants (goes to Other as participant support)</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          <strong>CFR reference:</strong> 2 CFR 200.453 covers materials and supplies. The key principle is that
          supplies must be directly used for grant purposes, and the cost must be reasonable.
        </p>

        {/* Mapping Contractual */}
        <h2 id="mapping-contractual" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mapping Contractual Expenses
        </h2>
        <p className="mt-4 leading-relaxed">
          Contractual encompasses all costs for services provided by external parties. This is where the distinction
          between employees and non-employees becomes critical. If the service provider is not on your payroll, their
          costs belong in Contractual.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Belongs in Contractual:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Program evaluation consultant: $15,000 contract for annual evaluation</li>
          <li>Subaward to partner organization: $80,000 for case management services in another county</li>
          <li>IT support contract: $500/month for helpdesk and system maintenance</li>
          <li>Accounting firm: $8,000 for grant-specific audit preparation support</li>
          <li>Translation services: $3,000 for translating program materials into Spanish</li>
          <li>Graphic design services: $2,500 for creating program outreach materials</li>
          <li>Background check vendor: $50/check for 100 program volunteers ($5,000)</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Does NOT belong in Contractual:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Employee who works like a contractor but is on payroll (goes to Personnel)</li>
          <li>Rent payments to a landlord (goes to Other or indirect costs)</li>
          <li>Utility bills (goes to Other or indirect costs)</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          <strong>Subaward vs. contractor:</strong> Per 2 CFR 200.331, a subaward is issued when a subrecipient
          carries out a portion of the federal program. A contract is issued when a vendor provides goods or services
          as part of normal business operations. The distinction matters for monitoring requirements and SEFA reporting.
        </p>

        {/* Mapping Construction */}
        <h2 id="mapping-construction" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mapping Construction Expenses
        </h2>
        <p className="mt-4 leading-relaxed">
          Most nonprofit program grants do not include construction. This category is zero unless the grant specifically
          authorizes construction activities. If construction is authorized, the following belong here:
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Belongs in Construction (when authorized):</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Building a new community health center authorized by the grant</li>
          <li>Major renovation of a building to house the grant program</li>
          <li>Architectural and engineering fees for authorized construction</li>
          <li>Permits and inspection fees for construction projects</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Does NOT belong in Construction:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Minor repairs and maintenance (goes to Other or indirect costs)</li>
          <li>Office furniture installation (goes to Supplies or Equipment depending on cost)</li>
          <li>Painting or carpet replacement (typically Other or indirect costs)</li>
          <li>ADA compliance modifications when not specifically part of a construction grant</li>
        </ul>

        {/* Mapping Other */}
        <h2 id="mapping-other" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mapping &quot;Other&quot; Expenses
        </h2>
        <p className="mt-4 leading-relaxed">
          The Other category is where many gray-area expenses land. It is a legitimate budget category, not a sign
          of poor categorization. Many common nonprofit expenses correctly belong here.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Belongs in Other:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Participant support costs: stipends ($50/session x 200 sessions = $10,000)</li>
          <li>Participant travel: bus passes for program participants ($2,400/year)</li>
          <li>Participant food: meals during full-day training programs ($5,000/year)</li>
          <li>Rent for office space dedicated to the grant program ($24,000/year)</li>
          <li>Telephone and internet for grant staff ($3,600/year)</li>
          <li>Printing costs for program reports and outreach ($2,000/year)</li>
          <li>Professional development: conference registration for grant staff ($1,500)</li>
          <li>Insurance for grant-specific activities ($4,000/year)</li>
          <li>Membership dues for professional organizations related to the grant ($500/year)</li>
        </ul>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">Does NOT belong in Other:</p>
        <ul className="mt-2 list-disc pl-6 space-y-1">
          <li>Costs already included in your indirect cost rate (double-dipping)</li>
          <li>Entertainment or alcohol (never allowable under federal grants)</li>
          <li>Lobbying costs (specifically prohibited by 2 CFR 200.450)</li>
          <li>Fines and penalties (specifically prohibited by 2 CFR 200.441)</li>
        </ul>

        {/* Mapping Indirect Charges */}
        <h2 id="mapping-indirect" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Mapping Indirect Charges
        </h2>
        <p className="mt-4 leading-relaxed">
          Indirect charges are not mapped from individual transactions. Instead, you calculate the total indirect
          charge as a single line item by multiplying your indirect cost rate by the MTDC base.
        </p>
        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">How to calculate:</p>
        <ol className="mt-2 list-decimal pl-6 space-y-2">
          <li>Sum all direct costs in the other 8 categories (Personnel through Other)</li>
          <li>Subtract MTDC exclusions: Equipment, capital expenditures, participant support costs, subaward amounts above the applicable threshold, and other items per 2 CFR 200.1</li>
          <li>The result is your MTDC base</li>
          <li>Multiply the MTDC base by your indirect cost rate (negotiated rate or de minimis 10%/15%)</li>
          <li>The result is your Indirect Charges line item</li>
        </ol>
        <p className="mt-4 leading-relaxed">
          <strong>Example:</strong> If your direct costs total $400,000, with $30,000 in Equipment and $80,000 in
          subawards (on a post-October 2024 grant), your MTDC base is $400,000 - $30,000 - ($80,000 - $50,000) =
          $340,000. At a 15% de minimis rate, your indirect charge is $51,000.
        </p>

        {/* Gray Areas & Edge Cases */}
        <h2 id="gray-areas" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Gray Areas and Edge Cases
        </h2>
        <p className="mt-4 leading-relaxed">
          Some expenses genuinely straddle category boundaries. Here are the most common gray areas and how to
          resolve them:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-3">
          <li>
            <strong>Software subscriptions.</strong> Annual SaaS subscriptions (e.g., Zoom, Salesforce) typically
            go to Other or Supplies, not Equipment, because the useful life renews annually. Multi-year perpetual
            licenses above the equipment threshold could be Equipment.
          </li>
          <li>
            <strong>Consultant travel.</strong> When a consultant&apos;s contract includes travel costs, the entire
            contract amount (including their travel) goes to Contractual. Do not split out their travel into the
            Travel category.
          </li>
          <li>
            <strong>Rent and utilities.</strong> If charged directly to the grant (not through indirect costs), these
            go to Other. If they are part of your indirect cost rate, they are recovered through Indirect Charges.
            Never charge the same cost both ways.
          </li>
          <li>
            <strong>Computing devices.</strong> Per 2 CFR 200.1, computing devices are classified as Supplies if
            they cost less than the equipment threshold, even if they have a useful life of more than one year.
            This is a special exception to the general equipment definition.
          </li>
          <li>
            <strong>Conference fees with bundled travel.</strong> If a conference registration includes meals
            or lodging, the full registration fee typically goes to Travel (if the employee is traveling) or
            Other (if the conference is local and it is a training/professional development expense).
          </li>
        </ul>

        {/* Conclusion */}
        <h2 id="conclusion" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Conclusion
        </h2>
        <p className="mt-4 leading-relaxed">
          Accurate SF-424A category mapping requires understanding the definitions, knowing the exceptions, and
          applying consistent judgment. The most important principles are: employees go to Personnel and Contractual
          is for non-employees; the Equipment/Supplies boundary depends on cost and useful life; direct costs cannot
          also be in indirect costs; and participant support costs are a separate sub-category within Other.
        </p>
        <p className="mt-4 leading-relaxed">
          When in doubt, document your reasoning. Auditors are more forgiving of borderline categorizations that are
          well-documented and consistently applied than they are of arbitrary or inconsistent classification decisions.
        </p>
        <p className="mt-4 leading-relaxed">
          GrantLedger automates this mapping process by analyzing each expense against all 10 SF-424A categories and
          56 CFR cost principle items, generating a recommended category with a specific CFR citation explaining the
          classification. Every recommendation includes a confidence score, and all categorizations require human
          confirmation -- ensuring that borderline cases always receive human judgment.
        </p>
      </BlogArticle>
    </>
  );
}

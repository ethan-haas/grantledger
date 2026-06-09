import Link from "next/link";
import type { Metadata } from "next";
import { Section } from "@/components/marketing/section";
import { FadeInUp, ScaleIn } from "@/components/marketing/motion";

export const metadata: Metadata = {
  title: "Methodology — GrantLedger",
  description:
    "Learn how GrantLedger uses AI and 2 CFR 200 cost principles to categorize federal grant expenses into SF-424A budget categories.",
  alternates: {
    canonical: "/methodology",
  },
};

/* -------------------------------------------------------------------------- */
/*  SF-424A Categories                                                       */
/* -------------------------------------------------------------------------- */

const sf424aCategories = [
  { number: 1, name: "Personnel", description: "Salaries and wages for employees directly working on the grant project." },
  { number: 2, name: "Fringe Benefits", description: "Employee benefits such as health insurance, retirement contributions, and payroll taxes." },
  { number: 3, name: "Travel", description: "Transportation, lodging, and per diem costs for grant-related travel." },
  { number: 4, name: "Equipment", description: "Tangible personal property with a per-unit cost at or above the applicable threshold and a useful life of more than one year." },
  { number: 5, name: "Supplies", description: "Consumable materials, items below the equipment threshold, and other tangible property used in grant activities." },
  { number: 6, name: "Contractual", description: "Costs for services provided by third parties, including consultants, subawards, and contracted services." },
  { number: 7, name: "Construction", description: "Costs related to building construction or renovation, when authorized by the grant." },
  { number: 8, name: "Other", description: "Allowable costs that do not fit into the above categories, such as participant support costs or printing." },
  { number: 9, name: "Indirect Charges", description: "Facilities and administrative costs applied using a negotiated or de minimis indirect cost rate." },
  { number: 10, name: "Total", description: "The sum of all direct and indirect costs, representing the full grant budget." },
];

/* -------------------------------------------------------------------------- */
/*  Threshold Comparison                                                     */
/* -------------------------------------------------------------------------- */

const thresholds = [
  { item: "Equipment threshold", pre: "$5,000", post: "$10,000", cfrRef: "2 CFR 200.1" },
  { item: "De minimis indirect cost rate", pre: "10%", post: "15%", cfrRef: "2 CFR 200.414(f)" },
  { item: "Subaward MTDC exclusion", pre: "$25,000", post: "$50,000", cfrRef: "2 CFR 200.1" },
];

/* -------------------------------------------------------------------------- */
/*  Methodology Page                                                         */
/* -------------------------------------------------------------------------- */

export default function MethodologyPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <FadeInUp>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              Our Approach
            </p>
            <h1 className="mt-3 font-display text-display-sm font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-display-md">
              Our methodology
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">
              GrantLedger combines AI-powered expense analysis with the full
              regulatory framework of 2 CFR 200 to deliver accurate, auditable
              categorization of federal grant expenses. Here is how it works under
              the hood.
            </p>
          </FadeInUp>
        </div>
      </section>

      {/* AI Approach */}
      <Section background="neutral" padding="md">
        <FadeInUp>
          <h2 className="font-display text-display-xs sm:text-display-sm font-bold tracking-tight text-slate-900 dark:text-white">
            AI-powered categorization
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              GrantLedger uses OpenAI&apos;s GPT-4o Mini model, specifically
              configured with a comprehensive system prompt that includes the
              complete regulatory context needed for accurate categorization.
            </p>
            <p>The AI system prompt incorporates three key elements:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>10 SF-424A budget categories</strong> with descriptions
                and classification rules, so the model understands where each
                type of expense belongs.
              </li>
              <li>
                <strong>56 selected items of cost</strong> from 2 CFR 200
                Subpart E (sections 200.420 through 200.476), including
                allowability rules, conditions, and the specific CFR section
                number for each.
              </li>
              <li>
                <strong>The grant&apos;s OMB framework</strong> (pre or post
                October 2024), which determines the applicable thresholds for
                equipment classification, indirect cost rates, and subaward
                limits.
              </li>
            </ul>
            <p>For every expense, the AI returns three pieces of information:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>ai_category:</strong> The recommended SF-424A budget
                category (one of the 10 standard categories).
              </li>
              <li>
                <strong>ai_confidence:</strong> A confidence rating of high,
                medium, or low, reflecting how clearly the expense maps to a
                single category.
              </li>
              <li>
                <strong>ai_cfr_citation:</strong> The specific 2 CFR 200
                section that supports the categorization decision (for example,
                &quot;2 CFR 200.453 -- Materials and supplies costs&quot;).
              </li>
            </ul>
          </div>
        </FadeInUp>
      </Section>

      {/* SF-424A Categories */}
      <Section background="white" padding="md">
        <FadeInUp>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            SF-424A budget categories
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            The SF-424A is the standard federal budget form used across grant
            applications and reporting. All expenses are categorized into these
            10 categories:
          </p>
        </FadeInUp>
        <ScaleIn className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-soft">
            <table className="w-full">
              <caption className="sr-only">SF-424A federal budget categories</caption>
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                    #
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">
                    Category
                  </th>
                  <th scope="col" className="hidden px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 sm:table-cell">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {sf424aCategories.map((cat) => (
                  <tr key={cat.number} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium tabular-nums text-slate-900 dark:text-slate-100">
                      {cat.number}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {cat.name}
                    </td>
                    <td className="hidden px-4 py-3 text-sm text-slate-600 dark:text-slate-400 sm:table-cell">
                      {cat.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScaleIn>
      </Section>

      {/* CFR Citations */}
      <Section background="neutral" padding="md">
        <FadeInUp>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            CFR citation system
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              Every categorization in GrantLedger is backed by a specific
              citation from the Code of Federal Regulations. The citations
              reference 2 CFR 200 Subpart E, which defines 56 selected items of
              cost in sections 200.420 through 200.476.
            </p>
            <p>
              These citations serve two purposes: they provide an audit trail
              that connects each expense to its regulatory basis, and they help
              finance directors understand why a particular categorization was
              recommended.
            </p>
            <p>
              The GrantLedger database includes a pre-loaded reference table of
              all 56 cost principle items with their CFR section numbers,
              allowability rules (always allowable, allowable with conditions,
              never allowable), SF-424A category mappings, keywords for matching,
              and framework applicability flags.
            </p>
            <div className="rounded-xl border-l-4 border-l-primary-600 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-soft-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Example citation
              </p>
              <p className="mt-2 font-mono text-sm text-slate-800 dark:text-slate-200">
                2 CFR 200.453 -- Materials and supplies costs, including
                computing devices
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Allowability: Allowable with conditions. Maps to SF-424A
                category: Supplies.
              </p>
            </div>
          </div>
        </FadeInUp>
      </Section>

      {/* Dual-Framework Compliance */}
      <Section background="white" padding="md">
        <FadeInUp>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Dual-framework compliance
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              On October 1, 2024, the Office of Management and Budget (OMB)
              implemented significant revisions to 2 CFR 200. These revisions
              changed several dollar thresholds that affect how expenses are
              categorized and reported.
            </p>
            <p>
              GrantLedger automatically determines which framework applies based
              on the grant&apos;s award date. Grants with an award date before
              October 1, 2024, use the pre-October 2024 thresholds. Grants
              awarded on or after that date use the updated thresholds.
            </p>
          </div>
        </FadeInUp>

        {/* Threshold Comparison Table */}
        <ScaleIn className="mt-8">
          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-soft">
            <table className="w-full">
              <caption className="sr-only">OMB threshold comparison pre and post October 2024</caption>
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Item</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Pre-Oct 2024</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Post-Oct 2024</th>
                  <th scope="col" className="hidden px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 sm:table-cell">CFR Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {thresholds.map((row) => (
                  <tr key={row.item} className="hover:bg-neutral-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-slate-100">{row.item}</td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{row.pre}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary-600">{row.post}</td>
                    <td className="hidden px-4 py-3 font-mono text-xs text-slate-500 dark:text-slate-400 sm:table-cell">{row.cfrRef}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ScaleIn>

        <FadeInUp className="mt-6 max-w-3xl">
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            This matters because incorrect threshold application can lead to
            misclassified expenses. For example, a $7,000 laptop purchase is
            classified as Equipment under pre-October 2024 rules (threshold:
            $5,000) but as Supplies under post-October 2024 rules (threshold:
            $10,000). GrantLedger handles this automatically.
          </p>
        </FadeInUp>
      </Section>

      {/* Accuracy Commitment */}
      <Section background="neutral" padding="md">
        <FadeInUp>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Accuracy commitment
          </h2>
          <div className="mt-6 max-w-3xl space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <p>
              We believe AI should augment human judgment, not replace it. That
              is why every AI categorization in GrantLedger requires human
              confirmation before it becomes final.
            </p>
            <p>Our approach to accuracy includes:</p>
            <ul className="ml-6 list-disc space-y-2">
              <li>
                <strong>Confidence ratings:</strong> Every categorization
                includes a high, medium, or low confidence score. Low-confidence
                items are flagged for extra attention during review.
              </li>
              <li>
                <strong>CFR citations:</strong> Specific regulatory references
                allow reviewers to verify the basis for each categorization.
              </li>
              <li>
                <strong>Human-in-the-loop:</strong> No categorization is
                finalized without explicit confirmation from an authorized user.
                The confirming user and timestamp are recorded for audit purposes.
              </li>
              <li>
                <strong>Override capability:</strong> Users can change any AI
                suggestion before confirming. The system records both the
                original AI recommendation and the final human decision.
              </li>
            </ul>
          </div>
        </FadeInUp>
      </Section>

      {/* Disclaimer */}
      <Section background="white" padding="md">
        <FadeInUp>
          <div className="rounded-2xl border-l-4 border-l-warning-500 border border-slate-200 bg-warning-50/50 p-8 shadow-soft-sm">
            <div className="flex items-start gap-3">
              <svg className="h-6 w-6 flex-shrink-0 text-warning-600 dark:text-warning-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Important disclaimer
                </h2>
                <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                  <p>
                    GrantLedger is a software tool designed to assist nonprofit
                    finance directors with federal grant expense categorization. It
                    is not a substitute for professional accounting advice, legal
                    counsel, or audit services.
                  </p>
                  <p>
                    While our AI categorization references the full text of 2 CFR
                    200, the final responsibility for expense categorization and
                    compliance rests with the organization and its authorized
                    personnel. All AI suggestions require human confirmation before
                    becoming part of the official record.
                  </p>
                  <p>
                    GrantLedger does not guarantee the accuracy of AI
                    categorizations, nor does it guarantee compliance with any
                    specific federal regulation. Users should consult with their
                    auditors and compliance advisors regarding their specific
                    circumstances.
                  </p>
                </div>
              </div>
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
              <h2 className="font-display text-display-sm sm:text-display-md font-bold text-white">
                See it in action
              </h2>
              <p className="mt-3 text-neutral-400">
                Start a free trial and experience AI-powered grant expense
                categorization for yourself.
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

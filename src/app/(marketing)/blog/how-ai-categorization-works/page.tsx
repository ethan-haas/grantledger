import type { Metadata } from "next";
import { BlogArticle } from "@/components/marketing/blog-article";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "How AI Categorization Works: Our Methodology Explained",
  description:
    "A deep dive into how GrantLedger uses GPT-4o Mini, 10 SF-424A categories, and 56 CFR cost principle items to categorize federal grant expenses with confidence scores and CFR citations.",
  alternates: { canonical: "/blog/how-ai-categorization-works" },
  openGraph: {
    title: "How AI Categorization Works: Our Methodology Explained",
    description:
      "Learn how GrantLedger's AI categorizes grant expenses using GPT-4o Mini with confidence scores and CFR citations.",
    type: "article",
    url: "/blog/how-ai-categorization-works",
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "How AI Categorization Works: Our Methodology Explained",
  description:
    "A deep dive into how GrantLedger uses AI to categorize federal grant expenses.",
  datePublished: "2024-10-15",
  author: { "@type": "Organization", name: "GrantLedger" },
  publisher: { "@type": "Organization", name: "GrantLedger" },
  url: `${SITE_URL}/blog/how-ai-categorization-works`,
};

const tableOfContents = [
  { id: "why-ai", title: "Why AI for Grant Expenses?" },
  { id: "the-model", title: "The AI Model" },
  { id: "system-prompt", title: "The System Prompt" },
  { id: "sf424a-categories", title: "SF-424A Category Knowledge" },
  { id: "cfr-cost-principles", title: "56 CFR Cost Principles" },
  { id: "omb-framework", title: "OMB Framework Detection" },
  { id: "confidence-levels", title: "Confidence Levels" },
  { id: "cfr-citations", title: "CFR Citation Generation" },
  { id: "human-in-the-loop", title: "Human-in-the-Loop Review" },
  { id: "accuracy", title: "Accuracy & Continuous Improvement" },
  { id: "conclusion", title: "Conclusion" },
];

const relatedArticles = [
  {
    title: "SF-424A Budget Categories: A Practical Mapping Guide",
    href: "/blog/sf-424a-categories-mapping-guide",
    category: "Compliance Guide",
  },
  {
    title: "Single Audit Preparation: From 3 Days to 3 Hours",
    href: "/blog/single-audit-3-days-to-3-hours",
    category: "Case Study",
  },
];

export default function HowAiCategorizationWorksPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogArticle
        title="How AI Categorization Works: Our Methodology Explained"
        description="A transparent look at the AI methodology behind GrantLedger's expense categorization, including the model, system prompt, confidence scoring, and human-in-the-loop review process."
        author={{ name: "GrantLedger Team", role: "Compliance & Product" }}
        publishedDate="2024-10-15"
        readingTime="8 min read"
        category="Product Update"
        categoryColor="bg-accent-50 text-accent-700"
        tableOfContents={tableOfContents}
        relatedArticles={relatedArticles}
      >
        {/* Why AI for Grant Expenses? */}
        <h2 id="why-ai" className="mt-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Why AI for Grant Expense Categorization?
        </h2>
        <p className="mt-4 leading-relaxed">
          Federal grant expense categorization is a task that requires deep knowledge of regulations, consistent
          judgment, and careful attention to detail. A finance director categorizing expenses manually must hold the
          10 SF-424A categories, 56 selected items of cost from 2 CFR 200, the specific grant&apos;s OMB framework,
          and the organization&apos;s own policies in mind simultaneously while reviewing each transaction.
        </p>
        <p className="mt-4 leading-relaxed">
          For a nonprofit processing hundreds or thousands of expenses per grant per year, this is time-consuming and
          error-prone. Even experienced finance professionals make classification mistakes when fatigued or rushed. A
          single miscategorized expense in the wrong budget line can trigger audit findings, questioned costs, or the
          need for budget amendments.
        </p>
        <p className="mt-4 leading-relaxed">
          AI is well-suited to this task because it can evaluate every expense against the full body of cost principles
          and categorization rules consistently, without fatigue, and at high speed. The key is that AI does not replace
          human judgment -- it augments it by doing the initial classification and providing a rationale, so the finance
          director can focus on reviewing and confirming rather than starting from scratch.
        </p>

        {/* The AI Model */}
        <h2 id="the-model" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          The AI Model: GPT-4o Mini
        </h2>
        <p className="mt-4 leading-relaxed">
          GrantLedger uses OpenAI&apos;s GPT-4o Mini model for expense categorization. We chose this model for several
          reasons:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Strong reasoning capabilities.</strong> GPT-4o Mini can understand the nuances of federal cost
            principles and apply multi-step reasoning to determine which category best fits an expense. It can handle
            edge cases like software subscriptions (Supplies vs. Equipment vs. Other) or consultant travel
            (Contractual, not Travel).
          </li>
          <li>
            <strong>Fast response times.</strong> Categorization needs to feel instant in the user interface. GPT-4o
            Mini returns results in under 2 seconds per expense, enabling bulk processing of hundreds of expenses
            without long wait times.
          </li>
          <li>
            <strong>Cost efficiency.</strong> As a SaaS product serving nonprofits, cost matters. GPT-4o Mini provides
            excellent categorization quality at a fraction of the cost of larger models, allowing us to keep our
            pricing accessible for small and mid-size organizations.
          </li>
          <li>
            <strong>Structured output support.</strong> GPT-4o Mini reliably produces structured JSON responses with
            the exact fields we need: category, confidence level, and CFR citation. This eliminates the need for
            complex parsing of free-text responses.
          </li>
        </ul>

        {/* The System Prompt */}
        <h2 id="system-prompt" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          The System Prompt Architecture
        </h2>
        <p className="mt-4 leading-relaxed">
          The system prompt is the core of our categorization methodology. It provides GPT-4o Mini with the complete
          regulatory context needed to make accurate categorization decisions. The prompt includes three major components:
        </p>
        <ol className="mt-4 list-decimal pl-6 space-y-3">
          <li>
            <strong>The 10 SF-424A budget categories</strong> with their definitions, boundaries, and examples.
            Each category description specifies exactly what belongs there and what does not, mirroring the guidance
            in this article series.
          </li>
          <li>
            <strong>All 56 selected items of cost from 2 CFR 200 Subpart E</strong> (sections 200.420 through
            200.476). Each item includes its CFR section number, a description of the cost type, its allowability
            status (allowable, allowable with conditions, or unallowable), and the SF-424A category it maps to.
          </li>
          <li>
            <strong>The grant&apos;s specific OMB framework</strong> (pre-October 2024 or post-October 2024). The
            prompt includes the applicable thresholds for equipment classification, the de minimis indirect cost rate,
            and the subaward MTDC exclusion, so the model applies the correct rules for each grant.
          </li>
        </ol>
        <p className="mt-4 leading-relaxed">
          This three-layer approach ensures the model has all the information it needs to make a classification
          decision without relying on its pre-training knowledge of regulations (which could be outdated or imprecise).
          We effectively provide the model with its own copy of the relevant regulatory text at inference time.
        </p>

        {/* SF-424A Category Knowledge */}
        <h2 id="sf424a-categories" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          SF-424A Category Knowledge
        </h2>
        <p className="mt-4 leading-relaxed">
          Each of the 10 SF-424A categories is represented in the system prompt with a structured definition that
          includes:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li><strong>Category name and number</strong> (1 through 10)</li>
          <li><strong>Definition</strong> based on the SF-424A form instructions and OMB guidance</li>
          <li><strong>Inclusion criteria</strong> -- specific types of expenses that belong in this category</li>
          <li><strong>Exclusion criteria</strong> -- expenses that are commonly confused with this category but belong elsewhere</li>
          <li><strong>Key CFR references</strong> -- the specific 2 CFR 200 sections that govern costs in this category</li>
          <li><strong>Framework-specific rules</strong> -- any thresholds or rules that differ between pre- and post-October 2024</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          By providing explicit exclusion criteria, we reduce the most common classification errors. For example, the
          Personnel category explicitly states that independent contractor costs do not belong there, even if the
          contractor works full-time on-site. The Travel category explicitly states that participant travel belongs
          in Other as participant support costs.
        </p>

        {/* 56 CFR Cost Principles */}
        <h2 id="cfr-cost-principles" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          The 56 CFR Cost Principle Items
        </h2>
        <p className="mt-4 leading-relaxed">
          2 CFR 200 Subpart E contains 56 selected items of cost (sections 200.420 through 200.476) that provide
          specific guidance on the allowability of common expense types under federal grants. Our system prompt includes
          all 56 items, structured as a reference database that the model queries during categorization.
        </p>
        <p className="mt-4 leading-relaxed">
          For each of the 56 items, the prompt includes:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li><strong>CFR section number</strong> (e.g., 200.430 for compensation)</li>
          <li><strong>Cost type name</strong> (e.g., &quot;Compensation - personal services&quot;)</li>
          <li><strong>Allowability rule</strong> (allowable, allowable with conditions, or not allowable)</li>
          <li><strong>SF-424A category mapping</strong> (which budget line this cost type belongs to)</li>
          <li><strong>Keywords and phrases</strong> that indicate an expense may fall under this cost principle</li>
          <li><strong>Framework applicability</strong> (whether different rules apply pre- vs. post-October 2024)</li>
        </ul>
        <p className="mt-4 leading-relaxed">
          When the model encounters an expense like &quot;Annual conference registration - American Public Health
          Association - $450&quot;, it can cross-reference this against relevant cost principles: 200.432 (conferences),
          200.474 (travel), and 200.461 (publication and printing costs) to determine the most appropriate
          categorization and provide the specific CFR section as a citation.
        </p>

        {/* OMB Framework Detection */}
        <h2 id="omb-framework" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          OMB Framework Detection
        </h2>
        <p className="mt-4 leading-relaxed">
          When a user creates a grant in GrantLedger and enters the award date, the system automatically determines
          the applicable OMB framework:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Award date before October 1, 2024:</strong> Pre-October 2024 framework applies. Equipment
            threshold is $5,000, de minimis IDC rate is 10%, subaward MTDC exclusion is $25,000.
          </li>
          <li>
            <strong>Award date on or after October 1, 2024:</strong> Post-October 2024 framework applies. Equipment
            threshold is $10,000, de minimis IDC rate is 15%, subaward MTDC exclusion is $50,000.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          This framework information is injected into the system prompt for every categorization request, ensuring
          the AI applies the correct thresholds. A $7,000 server purchase is categorized as Equipment for a
          pre-October 2024 grant and as Supplies for a post-October 2024 grant -- automatically, without the finance
          director needing to remember which threshold applies.
        </p>

        {/* Confidence Levels */}
        <h2 id="confidence-levels" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Confidence Levels: High, Medium, Low
        </h2>
        <p className="mt-4 leading-relaxed">
          Every categorization includes a confidence assessment -- high, medium, or low -- that helps finance directors
          prioritize their review time. Here is what each level means:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-3">
          <li>
            <strong>High confidence.</strong> The expense clearly maps to a single SF-424A category based on its
            description and amount. Examples: a payroll entry for a named employee (Personnel), a check to a named
            consultant with a contract on file (Contractual), or office supplies from a known vendor under $100
            (Supplies). These typically represent 60-70% of all categorizations.
          </li>
          <li>
            <strong>Medium confidence.</strong> The expense likely belongs in one category, but there is some
            ambiguity. Examples: a software purchase near the equipment threshold (could be Equipment or Supplies
            depending on framework), a payment to a vendor that could be either Contractual or Other, or a travel
            expense that might be employee travel or participant support. These represent 20-30% of categorizations
            and benefit from quick human review.
          </li>
          <li>
            <strong>Low confidence.</strong> The expense description is ambiguous, or the expense could reasonably
            belong in multiple categories. Examples: a generic payment with a vague description like &quot;services
            rendered&quot;, a large miscellaneous expense with no context, or a cost type that straddles category
            boundaries. These represent 5-15% of categorizations and require careful human review.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          In the GrantLedger interface, expenses are sorted by confidence level so finance directors can quickly
          approve high-confidence items in bulk and spend more time on medium and low-confidence items that need
          careful review.
        </p>

        {/* CFR Citation Generation */}
        <h2 id="cfr-citations" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          CFR Citation Generation
        </h2>
        <p className="mt-4 leading-relaxed">
          Every categorization includes a specific CFR citation explaining why the expense was classified in a
          particular category. This is not just a convenience feature -- it is designed to support audit documentation
          by providing a regulatory reference for each classification decision.
        </p>
        <p className="mt-4 leading-relaxed">
          For example, when an expense is categorized as Equipment, the citation might read: &quot;2 CFR 200.439 -
          Equipment and other capital expenditures. Item exceeds the $5,000 equipment threshold with useful life
          greater than one year.&quot; When an expense is categorized as Personnel, the citation references 2 CFR
          200.430 with a note about compensation for personal services.
        </p>
        <p className="mt-4 leading-relaxed">
          These citations are included in GrantLedger&apos;s export reports, so when an auditor asks why a particular
          expense was classified in a specific budget category, the answer is immediately available with the
          regulatory reference. This transforms the audit conversation from &quot;why did you put this here?&quot;
          to &quot;I see the CFR reference -- let me verify the supporting documentation.&quot;
        </p>

        {/* Human-in-the-Loop Review */}
        <h2 id="human-in-the-loop" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Human-in-the-Loop Review
        </h2>
        <p className="mt-4 leading-relaxed">
          This is the most important aspect of our methodology: <strong>every AI categorization requires human
          confirmation before it becomes final.</strong> No expense is considered properly categorized until a real
          person reviews and confirms the AI&apos;s recommendation.
        </p>
        <p className="mt-4 leading-relaxed">
          Here is how the review process works:
        </p>
        <ol className="mt-4 list-decimal pl-6 space-y-2">
          <li>
            Expenses are imported from QuickBooks, Xero, or CSV and immediately sent to the AI for categorization.
          </li>
          <li>
            Each expense receives an AI-generated category, confidence level, and CFR citation. Its status is set
            to &quot;pending_review&quot;.
          </li>
          <li>
            The finance director reviews pending expenses in the GrantLedger dashboard, sorted by confidence level.
            High-confidence items can be approved in bulk; medium and low-confidence items are reviewed individually.
          </li>
          <li>
            For each expense, the reviewer can confirm the AI&apos;s recommendation, change the category to a
            different one, or exclude the expense from the grant entirely.
          </li>
          <li>
            When an expense is confirmed, the system records who confirmed it and when (confirmed_by and
            confirmed_at), creating an audit trail.
          </li>
          <li>
            Only confirmed expenses are included in budget-to-actual calculations and compliance reports.
          </li>
        </ol>
        <p className="mt-4 leading-relaxed">
          This human-in-the-loop design means GrantLedger is a decision-support tool, not an autonomous decision-maker.
          The AI handles the repetitive, time-consuming initial classification. The human provides the final judgment,
          accountability, and sign-off. Both parties do what they are best at.
        </p>

        {/* Accuracy & Continuous Improvement */}
        <h2 id="accuracy" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Accuracy and Continuous Improvement
        </h2>
        <p className="mt-4 leading-relaxed">
          We track several metrics to measure and improve categorization quality:
        </p>
        <ul className="mt-4 list-disc pl-6 space-y-2">
          <li>
            <strong>Confirmation rate.</strong> The percentage of AI categorizations that users confirm without
            changing. A higher rate indicates more accurate initial categorization.
          </li>
          <li>
            <strong>Category change patterns.</strong> When users change the AI&apos;s recommended category, we
            analyze the patterns to identify systematic errors that can be addressed by refining the system prompt.
          </li>
          <li>
            <strong>Confidence calibration.</strong> We verify that high-confidence items are actually confirmed
            at a higher rate than medium-confidence items, and that medium-confidence items are confirmed at a
            higher rate than low-confidence items. If the confidence levels are not well-calibrated, we adjust
            the thresholds.
          </li>
          <li>
            <strong>Edge case documentation.</strong> When we encounter new expense types or unusual classifications,
            we document them and update the system prompt with additional examples and guidance.
          </li>
        </ul>
        <p className="mt-4 leading-relaxed">
          Our system prompt is versioned and updated regularly based on these metrics. Each update goes through
          testing against a set of representative expenses to ensure improvements in one area do not create
          regressions in others.
        </p>

        {/* Conclusion */}
        <h2 id="conclusion" className="mt-12 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Conclusion
        </h2>
        <p className="mt-4 leading-relaxed">
          GrantLedger&apos;s AI categorization is built on a foundation of regulatory accuracy, transparent
          methodology, and mandatory human oversight. We believe this is the right approach for a domain where
          compliance matters and mistakes have real financial consequences.
        </p>
        <p className="mt-4 leading-relaxed">
          The AI does not guess or use generic classification rules. It evaluates each expense against the full
          text of relevant cost principles, applies the correct OMB framework thresholds, and explains its
          reasoning with a specific CFR citation. The human reviewer then confirms or adjusts, creating a documented
          audit trail for every classification decision.
        </p>
        <p className="mt-4 leading-relaxed">
          The result is faster categorization, more consistent classification, better audit documentation, and
          finance directors who can spend their time on judgment calls rather than routine classification work.
        </p>
      </BlogArticle>
    </>
  );
}

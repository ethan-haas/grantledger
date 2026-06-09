"use client";

import Link from "next/link";
import { Section } from "@/components/marketing/section";
import { FadeInUp, StaggerGrid, StaggerItem, AnimatedCounter } from "@/components/marketing/motion";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { ProductMockup } from "@/components/marketing/product-mockup";
import { BentoCard, StatCard } from "@/components/marketing/cards";
import { Testimonials } from "@/components/marketing/testimonials";
import { TrustBadges } from "@/components/marketing/trust-badges";
import { LogoBar } from "@/components/marketing/logo-bar";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { ProductTour } from "@/components/marketing/product-tour";
import { DemoVideoPlaceholder } from "@/components/marketing/demo-video-placeholder";
import { SITE_URL } from "@/lib/site";

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

const faqItems = [
  {
    question: "What types of federal grants does GrantLedger support?",
    answer:
      "GrantLedger supports all federal grants governed by 2 CFR 200 (Uniform Guidance). This includes grants from agencies such as HHS, DOE, DOL, NSF, and others. The system categorizes expenses into the standard 10 SF-424A budget categories and references the 56 selected items of cost from 2 CFR 200 Subpart E.",
  },
  {
    question: "How accurate is the AI categorization?",
    answer:
      "Our AI model is specifically tuned for federal grant expense categorization using the full text of 2 CFR 200 cost principles. Every categorization includes a confidence rating (high, medium, or low) and a specific CFR citation. Importantly, every AI suggestion requires human confirmation before it becomes final -- you always have the last word.",
  },
  {
    question: "How does GrantLedger keep my financial data secure?",
    answer:
      "All data is encrypted in transit and at rest. We use Supabase with Row-Level Security (RLS) so your organization's data is isolated at the database level. Accounting integration tokens are encrypted before storage. We never share your financial data with third parties.",
  },
  {
    question: "Which accounting systems integrate with GrantLedger?",
    answer:
      "GrantLedger integrates directly with QuickBooks Online and Xero via their official APIs. We also support CSV import with a guided column-mapping interface, so you can import data from virtually any accounting system.",
  },
  {
    question: "How does dual-framework compliance work?",
    answer:
      "The OMB updated key thresholds effective October 1, 2024. GrantLedger automatically detects which framework applies based on your grant's award date. For pre-October 2024 grants, equipment threshold is $5,000 and de minimis indirect rate is 10%. For post-October 2024 grants, these become $10,000 and 15% respectively.",
  },
  {
    question: "What happens during the 14-day free trial?",
    answer:
      "You get full access to GrantLedger for 14 days with no credit card required. You can create one grant, import expenses, use AI categorization, and generate reports. After the trial, you can subscribe to continue or export your data.",
  },
];

const features = [
  { name: "Unlimited grants", included: true },
  { name: "AI categorization with CFR citations", included: true },
  { name: "QuickBooks & Xero integration", included: true },
  { name: "CSV import with column mapping", included: true },
  { name: "Budget-to-actual dashboard", included: true },
  { name: "PDF & CSV audit reports", included: true },
  { name: "Dual-framework compliance", included: true },
  { name: "Organization & team management", included: true },
  { name: "Email support", included: true },
];

/* -------------------------------------------------------------------------- */
/*  Home Page                                                                 */
/* -------------------------------------------------------------------------- */

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "GrantLedger",
      url: SITE_URL,
      logo: `${SITE_URL}/icon`,
      description:
        "AI-powered federal grant expense categorization and compliance.",
    },
    {
      "@type": "SoftwareApplication",
      name: "GrantLedger",
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      offers: {
        "@type": "Offer",
        price: "149",
        priceCurrency: "USD",
        priceValidUntil: "2027-12-31",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      {/* ------------------------------------------------------------------ */}
      {/*  Hero                                                              */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-mesh">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <FadeInUp>
              <h1 className="font-display text-display-lg font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-display-xl md:text-display-2xl">
                Grant compliance on{" "}
                <span className="text-gradient">autopilot</span>
              </h1>
            </FadeInUp>
            <FadeInUp delay={0.1}>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 sm:text-xl">
                GrantLedger uses AI to automatically categorize your federal grant
                expenses into SF-424A budget categories with 2 CFR 200 citations.
              </p>
            </FadeInUp>
            <FadeInUp delay={0.2}>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/sign-up"
                  className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:w-auto"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/pricing"
                  className="w-full rounded-xl border border-slate-300 bg-white/80 px-8 py-4 text-sm font-semibold text-slate-700 shadow-soft-sm transition-all duration-200 hover:bg-white hover:shadow-sm active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:w-auto dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
                >
                  View Pricing
                </Link>
              </div>
            </FadeInUp>
            <FadeInUp delay={0.25}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                  Security-first architecture
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                  No credit card required
                </div>
              </div>
            </FadeInUp>
          </div>

          {/* Product mockup */}
          <FadeInUp delay={0.35} className="mt-16 sm:mt-20">
            <ProductMockup />
          </FadeInUp>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/*  Problem                                                           */}
      {/* ------------------------------------------------------------------ */}
      <Section background="neutral" padding="lg">
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              The challenge
            </p>
            <h2 className="mt-3 font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
              Grant compliance shouldn&apos;t be this painful
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Nonprofit finance directors face growing pressure to get it right.
            </p>
          </div>
        </FadeInUp>
        <StaggerGrid className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
          <StaggerItem>
            <BentoCard
              accentColor="bg-danger-500"
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-danger-50 to-danger-100">
                  <svg className="h-6 w-6 text-danger-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125" />
                  </svg>
                </div>
              }
              title="Manual spreadsheets"
              description="Hours spent manually mapping expenses to SF-424A categories in spreadsheets — error-prone and impossible to scale across multiple grants."
            />
          </StaggerItem>
          <StaggerItem>
            <BentoCard
              accentColor="bg-warning-500"
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-warning-50 to-warning-100">
                  <svg className="h-6 w-6 text-warning-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
              }
              title="Audit anxiety"
              description="Single audit findings can jeopardize future funding. Without proper documentation and CFR citations, your organization is exposed to compliance risk."
            />
          </StaggerItem>
          <StaggerItem>
            <BentoCard
              accentColor="bg-primary-500"
              icon={
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100">
                  <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                  </svg>
                </div>
              }
              title="OMB rule changes"
              description="The October 2024 OMB revisions changed key thresholds for equipment, indirect costs, and subawards. Keeping track of which rules apply to which grant is a headache."
            />
          </StaggerItem>
        </StaggerGrid>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/*  How It Works                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Section background="white" padding="lg">
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              How it works
            </p>
            <h2 className="mt-3 font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
              Three steps to audit-ready
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              From expense import to compliance reports in minutes.
            </p>
          </div>
        </FadeInUp>

        <div className="relative mx-auto mt-16 max-w-3xl">
          {/* Connecting line */}
          <div className="absolute left-8 top-10 bottom-10 hidden w-px bg-gradient-to-b from-primary-200 via-primary-300 to-primary-200 md:block" />

          <div className="space-y-12 md:space-y-16">
            {[
              {
                step: 1,
                title: "Connect your books",
                description: "Import expenses directly from QuickBooks Online, Xero, or upload a CSV file. Our column-mapping interface handles any format.",
              },
              {
                step: 2,
                title: "AI categorizes expenses",
                description: "Our AI reviews each expense against 2 CFR 200 cost principles and assigns an SF-424A category, confidence level, and specific CFR citation.",
              },
              {
                step: 3,
                title: "Generate audit-ready reports",
                description: "Review and confirm categorizations, then export PDF or CSV reports with full CFR citations and audit trails for your single audit.",
              },
            ].map((item, i) => (
              <FadeInUp key={item.step} delay={i * 0.1}>
                <div className="flex gap-6 md:gap-8">
                  <div className="relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 text-xl font-bold font-display text-primary-700 dark:text-primary-400 shadow-soft-sm">
                    {item.step}
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
              </FadeInUp>
            ))}
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/*  Demo Video                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Section background="white" padding="lg">
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              See it in action
            </p>
            <h2 className="mt-3 font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
              From expense import to audit-ready in minutes
            </h2>
          </div>
        </FadeInUp>
        <div className="mx-auto mt-12 max-w-3xl">
          <DemoVideoPlaceholder />
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/*  Benefits / Stats                                                  */}
      {/* ------------------------------------------------------------------ */}
      <Section background="gradient" padding="lg">
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              Results
            </p>
            <h2 className="mt-3 font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
              Built for nonprofit finance teams
            </h2>
          </div>
        </FadeInUp>
        <StaggerGrid className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-3">
          <StaggerItem>
            <StatCard
              stat={<><AnimatedCounter target={7} suffix=".5" /><span className="text-2xl"> hrs</span></>}
              label="Saved per month"
              description="Finance directors save an average of 7.5 hours per month on grant expense categorization and compliance."
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              stat="2x"
              label="Dual-framework compliance"
              description="Automatically applies the correct OMB thresholds based on your grant's award date — pre or post October 2024."
            />
          </StaggerItem>
          <StaggerItem>
            <StatCard
              stat={<><AnimatedCounter target={100} suffix="%" /></>}
              label="Audit-ready reports"
              description="Every confirmed expense includes a CFR citation, confirmation timestamp, and reviewer identity for your single audit."
            />
          </StaggerItem>
        </StaggerGrid>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/*  Product Tour                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Section background="white" padding="lg">
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              See it in action
            </p>
            <h2 className="mt-3 font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
              From import to audit-ready
            </h2>
          </div>
        </FadeInUp>
        <FadeInUp delay={0.1}>
          <ProductTour className="mx-auto mt-12 max-w-4xl" />
        </FadeInUp>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/*  Comparison                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Section background="neutral" padding="lg">
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
              Why GrantLedger?
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              Purpose-built for federal grant compliance — not a generic tool stretched to fit.
            </p>
          </div>
        </FadeInUp>
        <FadeInUp delay={0.1}>
          <ComparisonTable className="mx-auto mt-12 max-w-4xl" />
        </FadeInUp>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/*  Testimonials                                                      */}
      {/* ------------------------------------------------------------------ */}
      <Section background="white" padding="lg">
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              Testimonials
            </p>
            <h2 className="mt-3 font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
              Loved by nonprofit finance teams
            </h2>
          </div>
        </FadeInUp>
        <FadeInUp delay={0.1}>
          <Testimonials className="mx-auto mt-12 max-w-5xl" featured />
        </FadeInUp>
        <FadeInUp delay={0.2}>
          <TrustBadges className="mt-16" />
        </FadeInUp>
        <FadeInUp delay={0.25}>
          <LogoBar className="mt-12" />
        </FadeInUp>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/*  Pricing                                                           */}
      {/* ------------------------------------------------------------------ */}
      <Section background="white" padding="lg">
        <FadeInUp>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
              Pricing
            </p>
            <h2 className="mt-3 font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              One plan with everything you need. Choose monthly or annual.
            </p>
          </div>
        </FadeInUp>

        <div className="mx-auto mt-16 grid max-w-4xl gap-4 md:gap-8 md:grid-cols-2">
          {/* Annual Plan */}
          <FadeInUp delay={0.1}>
            <div className="relative rounded-3xl bg-gradient-to-b from-primary-500/5 to-primary-500/[0.02] p-px">
              <div className="rounded-3xl border-2 border-primary-500/20 bg-white dark:bg-slate-800 p-8 shadow-soft-xl">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-1.5 text-xs font-semibold text-white shadow-sm">
                    Recommended
                  </span>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Annual</h3>
                  <div className="mt-4">
                    <span className="font-display text-5xl font-bold text-slate-900 dark:text-slate-100">$1,490</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">/year</span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-success-600 dark:text-success-400">
                    Save $298 vs monthly
                  </p>
                </div>
                <ul className="mt-8 space-y-3">
                  {features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-3">
                      <svg aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature.name}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className="mt-8 block w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </FadeInUp>

          {/* Monthly Plan */}
          <FadeInUp delay={0.2}>
            <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-8 shadow-soft-sm">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Monthly</h3>
                <div className="mt-4">
                  <span className="font-display text-5xl font-bold text-slate-900 dark:text-slate-100">$149</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">/month</span>
                </div>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  $1,788/year if paid monthly
                </p>
              </div>
              <ul className="mt-8 space-y-3">
                {features.map((feature) => (
                  <li key={feature.name} className="flex items-start gap-3">
                    <svg aria-hidden="true" className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{feature.name}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-xl border border-slate-300 px-6 py-3.5 text-center text-sm font-semibold text-slate-700 shadow-soft-sm transition-all duration-200 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Start Free Trial
              </Link>
            </div>
          </FadeInUp>
        </div>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/*  FAQ                                                               */}
      {/* ------------------------------------------------------------------ */}
      <Section background="neutral" padding="md">
        <FadeInUp>
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 className="font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
                Frequently asked questions
              </h2>
            </div>
            <div className="mt-12">
              <FaqAccordion items={faqItems} />
            </div>
          </div>
        </FadeInUp>
      </Section>

      {/* ------------------------------------------------------------------ */}
      {/*  Final CTA                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="relative overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-mesh opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <FadeInUp>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-display-xs font-bold tracking-tight text-white sm:text-display-sm">
                Ready to simplify grant compliance?
              </h2>
              <p className="mt-4 text-lg text-neutral-300">
                Join nonprofit finance directors who trust GrantLedger to keep
                their federal grant expenses organized, compliant, and audit-ready.
              </p>
              <Link
                href="/sign-up"
                className="mt-8 inline-block rounded-xl bg-white px-8 py-4 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:bg-neutral-100 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Start Your Free 14-Day Trial
              </Link>
              <p className="mt-3 text-sm text-neutral-500">
                No credit card required.
              </p>
            </div>
          </FadeInUp>
        </div>
      </section>
    </>
  );
}

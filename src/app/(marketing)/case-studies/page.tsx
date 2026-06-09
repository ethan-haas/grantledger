import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Case Studies — GrantLedger",
  description: "See how nonprofit finance teams use GrantLedger to streamline grant compliance and reduce audit preparation time.",
  alternates: { canonical: "/case-studies" },
};

const caseStudies = [
  {
    slug: "community-health-partners",
    title: "From 3 Days to 3 Hours: Community Health Partners",
    industry: "Healthcare",
    metric: "95% reduction in audit prep time",
    summary: "How a community health network with 8 federal grants automated expense categorization and transformed their single audit preparation.",
    color: "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400",
  },
  {
    slug: "pacific-education-foundation",
    title: "Managing 12 Grants Across Two OMB Frameworks",
    industry: "Education",
    metric: "Zero compliance findings in 2 years",
    summary: "A large education nonprofit navigating the transition from pre- to post-October 2024 OMB rules across their entire portfolio.",
    color: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
  },
  {
    slug: "metro-workforce-alliance",
    title: "QuickBooks Integration Saves 30+ Hours Monthly",
    industry: "Workforce Development",
    metric: "30+ hours saved per month",
    summary: "How automated QuickBooks import and AI categorization eliminated manual data entry for a workforce development organization.",
    color: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "GrantLedger Case Studies",
  description: "Real stories from nonprofit finance teams using GrantLedger for grant compliance.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              Case Studies
            </span>
            <h1 className="mt-4 text-display-md font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
              Real Results from Real Nonprofits
            </h1>
            <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
              See how finance teams across healthcare, education, and social services use GrantLedger to streamline compliance and save time.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {caseStudies.map((cs) => (
            <Link key={cs.slug} href={`/case-studies/${cs.slug}`} className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 rounded-xl">
              <Card hover className="flex h-full flex-col">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cs.color}`}>
                    {cs.industry}
                  </span>
                </div>
                <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 group-hover:text-primary-600 dark:text-slate-100 dark:group-hover:text-primary-400">
                  {cs.title}
                </h2>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400">
                  {cs.summary}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-700">
                  <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{cs.metric}</span>
                  <svg className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

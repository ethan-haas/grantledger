import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/marketing/section";
import { Card } from "@/components/ui/card";
import { EmailCapture } from "@/components/marketing/email-capture";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Resources - GrantLedger",
  description: "Compliance guides, product updates, and case studies to help nonprofit finance teams master federal grant management.",
  alternates: { canonical: "/resources" },
};

const articles = [
  {
    category: "Compliance Guide",
    title: "Understanding 2 CFR 200: A Complete Guide for Nonprofits",
    description: "Everything nonprofit finance directors need to know about the Uniform Guidance, from cost principles to audit requirements.",
    href: "/blog/2-cfr-200-budget-categories-guide",
    readTime: "15 min read",
    categoryColor: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
  },
  {
    category: "Product Update",
    title: "How AI Categorization Works: Our Methodology Explained",
    description: "A deep dive into how GrantLedger's AI maps expenses to SF-424A categories using GPT-4o Mini and the full text of 2 CFR 200.",
    href: "/blog/how-ai-categorization-works",
    readTime: "8 min read",
    categoryColor: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400",
  },
  {
    category: "Case Study",
    title: "Single Audit Preparation: From 3 Days to 3 Hours",
    description: "How Community Health Partners streamlined their single audit preparation using GrantLedger's automated categorization and CFR citations.",
    href: "/blog/single-audit-3-days-to-3-hours",
    readTime: "6 min read",
    categoryColor: "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400",
  },
  {
    category: "Compliance Guide",
    title: "October 2024 OMB Changes: What Nonprofits Need to Know",
    description: "Key threshold changes in the October 2024 OMB revisions and how they affect your equipment classification, indirect costs, and subawards.",
    href: "/blog/october-2024-omb-changes",
    readTime: "10 min read",
    categoryColor: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
  },
  {
    category: "Case Study",
    title: "Managing 12 Federal Grants with a Team of Two",
    description: "Pacific Education Foundation shares how GrantLedger helped their lean finance team stay on top of compliance across a dozen active grants.",
    href: "/case-studies/pacific-education-foundation",
    readTime: "5 min read",
    categoryColor: "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-400",
  },
  {
    category: "Compliance Guide",
    title: "SF-424A Budget Categories: A Practical Mapping Guide",
    description: "A detailed walkthrough of all 10 SF-424A categories with real-world examples of how common nonprofit expenses should be classified.",
    href: "/blog/sf-424a-categories-mapping-guide",
    readTime: "15 min read",
    categoryColor: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400",
  },
];

const resourceJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "GrantLedger Resources",
  description: "Compliance guides, product updates, and case studies for nonprofit finance teams.",
  url: `${SITE_URL}/resources`,
};

export default function ResourcesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(resourceJsonLd) }}
      />

      {/* Hero */}
      <Section background="white" padding="lg">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Resources
          </p>
          <h1 className="mt-3 font-display text-display-sm font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-display-md">
            Learn &amp; grow
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Compliance guides, product updates, and case studies to help your team
            master federal grant management.
          </p>
        </div>
      </Section>

      {/* Articles grid */}
      <Section background="neutral" padding="lg">
        <div className="mx-auto max-w-6xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.title} href={article.href} className="group">
              <Card hover className="flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${article.categoryColor}`}>
                    {article.category}
                  </span>
                  <span className="text-xs text-slate-400">{article.readTime}</span>
                </div>
                <h3 className="mt-3 text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {article.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {article.description}
                </p>
                <div className="mt-4 flex items-center text-xs font-medium text-primary-600">
                  Read more
                  <svg className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* Email capture */}
      <Section background="white" padding="md">
        <div className="mx-auto max-w-xl">
          <EmailCapture
            heading="Never miss an update"
            description="Get new compliance guides and product updates delivered to your inbox. No spam, unsubscribe anytime."
          />
        </div>
      </Section>
    </>
  );
}

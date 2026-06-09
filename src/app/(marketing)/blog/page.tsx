"use client";

import { useState } from "react";
import Link from "next/link";
import { Section } from "@/components/marketing/section";
import { Card } from "@/components/ui/card";
import { EmailCapture } from "@/components/marketing/email-capture";
import { SITE_URL } from "@/lib/site";

const articles = [
  {
    slug: "2-cfr-200-budget-categories-guide",
    category: "Compliance Guide",
    title: "Complete Guide to 2 CFR 200 Budget Categories for Nonprofits",
    description:
      "A comprehensive walkthrough of all 10 SF-424A budget categories, what belongs in each, common mistakes, and CFR references for nonprofit finance directors.",
    readTime: "15 min read",
    categoryColor: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
    publishedDate: "2024-11-15",
  },
  {
    slug: "october-2024-omb-changes",
    category: "Compliance Guide",
    title: "What Changed in the October 2024 OMB Uniform Guidance Revision",
    description:
      "Key threshold changes in the October 2024 OMB revisions and how they affect equipment classification, indirect costs, and subawards for federal grants.",
    readTime: "10 min read",
    categoryColor: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
    publishedDate: "2024-11-10",
  },
  {
    slug: "single-audit-preparation-checklist",
    category: "Compliance Guide",
    title: "Single Audit Preparation Checklist for Federal Grant Recipients",
    description:
      "Step-by-step checklist for preparing for a single audit under 2 CFR 200.501, including SEFA preparation, documentation requirements, and common findings.",
    readTime: "12 min read",
    categoryColor: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
    publishedDate: "2024-10-28",
  },
  {
    slug: "sf-424a-categories-mapping-guide",
    category: "Compliance Guide",
    title: "SF-424A Budget Categories: A Practical Mapping Guide",
    description:
      "A detailed walkthrough of all 10 SF-424A categories with real-world examples of how common nonprofit expenses should be classified.",
    readTime: "15 min read",
    categoryColor: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300",
    publishedDate: "2024-10-20",
  },
  {
    slug: "how-ai-categorization-works",
    category: "Product Update",
    title: "How AI Categorization Works: Our Methodology Explained",
    description:
      "A deep dive into how GrantLedger uses GPT-4o Mini, 10 SF-424A categories, and 56 CFR cost principle items to categorize grant expenses with confidence scores.",
    readTime: "8 min read",
    categoryColor: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300",
    publishedDate: "2024-10-15",
  },
  {
    slug: "single-audit-3-days-to-3-hours",
    category: "Case Study",
    title: "Single Audit Preparation: From 3 Days to 3 Hours",
    description:
      "How Community Health Partners streamlined their single audit preparation using GrantLedger's automated categorization and CFR citations.",
    readTime: "6 min read",
    categoryColor: "bg-success-50 text-success-700 dark:bg-success-900/30 dark:text-success-300",
    publishedDate: "2024-10-05",
  },
];

const categories = ["All", "Compliance Guide", "Product Update", "Case Study"] as const;

const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "GrantLedger Blog",
  description: "Compliance guides, product updates, and case studies for nonprofit federal grant management.",
  url: `${SITE_URL}/blog`,
};

export default function BlogIndexPage() {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredArticles =
    activeCategory === "All"
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />

      {/* Hero */}
      <Section background="white" padding="lg">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Blog
          </p>
          <h1 className="mt-3 font-display text-display-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-display-md">
            Insights for grant compliance
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Compliance guides, product updates, and case studies to help nonprofit
            finance teams master federal grant management.
          </p>
        </div>
      </Section>

      {/* Category Filters + Article Grid */}
      <Section background="neutral" padding="lg">
        {/* Filter buttons */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${
                activeCategory === cat
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Article cards */}
        <div className="mx-auto max-w-6xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`} className="group focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 rounded-xl">
              <Card hover className="flex h-full flex-col">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${article.categoryColor}`}
                  >
                    {article.category}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {article.readTime}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold tracking-tight text-slate-900 group-hover:text-primary-600 transition-colors dark:text-slate-100">
                  {article.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-slate-600 leading-relaxed dark:text-slate-400">
                  {article.description}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <time
                    dateTime={article.publishedDate}
                    className="text-xs text-slate-400 dark:text-slate-500"
                  >
                    {new Date(article.publishedDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                  <span className="flex items-center text-xs font-medium text-primary-600">
                    Read more
                    <svg
                      className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </span>
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

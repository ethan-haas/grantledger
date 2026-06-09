"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Section } from "@/components/marketing/section";

interface BlogArticleProps {
  title: string;
  description: string;
  author: { name: string; role: string };
  publishedDate: string;
  readingTime: string;
  category: string;
  categoryColor: string;
  tableOfContents: { id: string; title: string }[];
  relatedArticles: { title: string; href: string; category: string }[];
  children: React.ReactNode;
}

export function BlogArticle({
  title,
  description,
  author,
  publishedDate,
  readingTime,
  category,
  categoryColor,
  tableOfContents,
  relatedArticles,
  children,
}: BlogArticleProps) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    const headings = tableOfContents
      .map((item) => document.getElementById(item.id))
      .filter(Boolean);

    headings.forEach((heading) => {
      if (heading) observer.observe(heading);
    });

    return () => observer.disconnect();
  }, [tableOfContents]);

  const formattedDate = new Date(publishedDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Breadcrumb */}
      <Section background="white" padding="sm">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/blog" className="hover:text-primary-600 transition-colors">
            Blog
          </Link>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <Link href={`/blog?category=${encodeURIComponent(category)}`} className="hover:text-primary-600 transition-colors">
            {category}
          </Link>
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="truncate text-slate-700">{title}</span>
        </nav>
      </Section>

      {/* Article Header */}
      <Section background="white" padding="sm">
        <div className="mx-auto max-w-3xl">
          <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${categoryColor}`}>
            {category}
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-lg text-slate-600 leading-relaxed">
            {description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 border-b border-slate-200 pb-6 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-semibold text-sm">
                {author.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{author.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{author.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <time dateTime={publishedDate}>{formattedDate}</time>
              <span aria-hidden="true">&middot;</span>
              <span>{readingTime}</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Article Body with TOC sidebar */}
      <Section background="white" padding="md">
        <div className="mx-auto max-w-7xl">
          <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-12">
            {/* Main content */}
            <div className="mx-auto max-w-3xl lg:mx-0">
              <div className="article-prose text-slate-700 dark:text-slate-300">
                {children}
              </div>
            </div>

            {/* Table of Contents sidebar - desktop only */}
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  On this page
                </h4>
                <nav aria-label="Table of contents" className="mt-3">
                  <ul className="space-y-2 border-l border-slate-200 dark:border-slate-700">
                    {tableOfContents.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          className={`block border-l-2 py-1 pl-4 text-sm transition-colors ${
                            activeId === item.id
                              ? "border-primary-500 text-primary-600 font-medium"
                              : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-300"
                          }`}
                        >
                          {item.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          </div>
        </div>
      </Section>

      {/* CTA Banner */}
      <Section background="gradient" padding="md">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Ready to automate your grant expense categorization?
          </h2>
          <p className="mt-3 text-slate-600">
            GrantLedger uses AI to categorize expenses into SF-424A budget categories with CFR citations.
            Start your free 14-day trial today.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
            >
              Start Free Trial
            </Link>
            <Link
              href="/methodology"
              className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
            >
              Learn Our Methodology
            </Link>
          </div>
        </div>
      </Section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <Section background="neutral" padding="md">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Related Articles
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {relatedArticles.map((article) => (
                <Link
                  key={article.href}
                  href={article.href}
                  className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <span className="text-xs font-medium text-primary-600">{article.category}</span>
                  <h3 className="mt-1.5 text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors dark:text-slate-100">
                    {article.title}
                  </h3>
                  <span className="mt-2 inline-flex items-center text-xs font-medium text-primary-600">
                    Read more
                    <svg className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </Section>
      )}
    </>
  );
}

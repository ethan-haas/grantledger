import type { Metadata } from "next";
import { Section } from "@/components/marketing/section";
import { ChangelogEntry } from "@/components/marketing/changelog-entry";
import { EmailCapture } from "@/components/marketing/email-capture";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Changelog - GrantLedger",
  description: "See what's new in GrantLedger. Product updates, new features, and improvements for nonprofit federal grant compliance.",
  alternates: { canonical: "/changelog" },
};

const changelogJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "GrantLedger Changelog",
  description: "Product updates, new features, and improvements for nonprofit federal grant compliance.",
  url: `${SITE_URL}/changelog`,
};

const entries = [
  {
    date: "February 2026",
    version: "v1.4",
    badges: [
      { label: "New Feature", color: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
      { label: "Improvement", color: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300" },
    ],
    title: "World-Class UI/UX",
    items: [
      "Component library: 25+ UI primitives including Tabs, Switch, Avatar, Progress, and DataTable",
      "Blog and content hub with 6 compliance guides and case studies",
      "Contextual help popovers with 2 CFR 200 citation summaries",
      "Mobile-optimized bottom sheets and progressive loading skeletons",
      "Interactive savings calculator on pricing page",
    ],
  },
  {
    date: "January 2026",
    version: "v1.3",
    badges: [
      { label: "Improvement", color: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300" },
      { label: "Bug Fix", color: "bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-500" },
    ],
    title: "Performance & Polish",
    items: [
      "Command palette (Cmd+K) for instant navigation across grants, expenses, and settings",
      "Keyboard shortcuts for common actions like bulk approve and export",
      "Dark mode with system preference detection and manual toggle",
      "Dynamic imports for chart components, reducing initial load time by 40%",
      "Fixed Stripe webhook race condition on concurrent invoice events",
    ],
  },
  {
    date: "December 2025",
    version: "v1.2",
    badges: [
      { label: "New Feature", color: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
    ],
    title: "Integrations",
    items: [
      "QuickBooks Online integration with Change Data Capture sync",
      "Xero integration with BankTransactions and Invoices endpoints",
      "CSV import with guided column mapping UI",
      "OAuth token encryption at rest for all accounting connections",
    ],
  },
  {
    date: "November 2025",
    version: "v1.1",
    badges: [
      { label: "New Feature", color: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
      { label: "Improvement", color: "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300" },
    ],
    title: "Compliance Reports",
    items: [
      "PDF audit reports with CFR citations using @react-pdf/renderer",
      "CSV export for single audit preparation",
      "Budget overspend alerts at 80% and 90% thresholds",
      "Equipment classification warnings based on OMB framework",
    ],
  },
  {
    date: "October 2025",
    version: "v1.0",
    badges: [
      { label: "New Feature", color: "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300" },
    ],
    title: "Launch",
    items: [
      "AI-powered expense categorization with GPT-4o Mini",
      "10 SF-424A budget categories with automated mapping",
      "Budget-to-actual dashboard with per-grant visualization",
      "Clerk authentication with organization management",
      "Stripe billing with 14-day free trial",
      "Dual-framework compliance (pre/post October 2024 OMB rules)",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(changelogJsonLd) }}
      />

      {/* Hero */}
      <Section background="white" padding="lg">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Changelog
          </p>
          <h1 className="mt-3 font-display text-display-sm font-extrabold tracking-tight text-slate-900 dark:text-slate-100 sm:text-display-md">
            What&apos;s new
          </h1>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            All the latest updates, improvements, and fixes to GrantLedger.
          </p>
        </div>
      </Section>

      {/* Timeline */}
      <Section background="neutral" padding="lg">
        <div className="mx-auto max-w-2xl">
          {entries.map((entry, i) => (
            <ChangelogEntry
              key={entry.version}
              date={entry.date}
              version={entry.version}
              badges={entry.badges}
              title={entry.title}
              items={entry.items}
              isLast={i === entries.length - 1}
            />
          ))}
        </div>
      </Section>

      {/* Email capture */}
      <Section background="white" padding="md">
        <div className="mx-auto max-w-xl">
          <EmailCapture
            heading="Get notified of new releases"
            description="Subscribe to receive product updates and changelog summaries. No spam, unsubscribe anytime."
          />
        </div>
      </Section>
    </>
  );
}

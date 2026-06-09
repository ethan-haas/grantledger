import type { Metadata } from "next";
import { Section } from "@/components/marketing/section";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Integrations — GrantLedger",
  description:
    "Connect GrantLedger with QuickBooks Online, Xero, or import via CSV. Automate federal grant expense import and categorization.",
  alternates: { canonical: "/integrations" },
  openGraph: {
    title: "Integrations — GrantLedger",
    description:
      "QuickBooks Online, Xero, and CSV import for federal grant expense management.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Integrations — GrantLedger",
  description:
    "Connect GrantLedger with QuickBooks Online, Xero, or import via CSV.",
  url: `${SITE_URL}/integrations`,
};

const integrations = [
  {
    name: "QuickBooks Online",
    description: "Automatically sync expenses from QuickBooks Online using the Change Data Capture API with a 30-day lookback window.",
    icon: (
      <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#2CA01C" />
        <path d="M20 8C13.373 8 8 13.373 8 20s5.373 12 12 12 12-5.373 12-12S26.627 8 20 8zm-3.5 17.5c-2.485 0-4.5-2.015-4.5-4.5s2.015-4.5 4.5-4.5h1v2h-1c-1.38 0-2.5 1.12-2.5 2.5s1.12 2.5 2.5 2.5 2.5-1.12 2.5-2.5v-1h2v1c0 2.485-2.015 4.5-4.5 4.5zm7 0h-1v-2h1c1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5-2.5 1.12-2.5 2.5v1h-2v-1c0-2.485 2.015-4.5 4.5-4.5s4.5 2.015 4.5 4.5-2.015 4.5-4.5 4.5z" fill="white" />
      </svg>
    ),
    features: [
      "Automatic expense sync via Change Data Capture API",
      "30-day lookback for historical transactions",
      "OAuth 2.0 secure authentication",
      "Encrypted token storage (AES-256-GCM)",
      "Real-time sync status monitoring",
    ],
    steps: [
      "Click 'Connect QuickBooks' in your settings",
      "Authorize GrantLedger in QuickBooks",
      "Select the date range to import",
      "AI categorizes imported expenses automatically",
    ],
  },
  {
    name: "Xero",
    description: "Import bank transactions and invoices from Xero to keep your grant expenses up to date.",
    icon: (
      <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#13B5EA" />
        <path d="M14 14l6 6m0 0l6-6m-6 6l-6 6m6-6l6 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    features: [
      "BankTransactions and Invoices endpoint support",
      "OAuth 2.0 secure authentication",
      "Encrypted token storage (AES-256-GCM)",
      "Automatic expense categorization after import",
      "Configurable sync frequency",
    ],
    steps: [
      "Click 'Connect Xero' in your settings",
      "Authorize GrantLedger in Xero",
      "Choose transactions to import",
      "Review AI-categorized expenses",
    ],
  },
  {
    name: "CSV Import",
    description: "Upload a CSV from any accounting system with our guided column-mapping interface. Works with any data format.",
    icon: (
      <svg className="h-10 w-10" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#6366F1" />
        <path d="M14 12h8l6 6v12a2 2 0 01-2 2H14a2 2 0 01-2-2V14a2 2 0 012-2z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M22 12v6h6M16 22h8M16 26h5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    features: [
      "Guided column-mapping interface",
      "Supports any CSV format from any accounting system",
      "Automatic date and currency parsing",
      "Duplicate detection on import",
      "Batch import with progress tracking",
    ],
    steps: [
      "Export expenses from your accounting system as CSV",
      "Upload the file in GrantLedger",
      "Map columns to fields (date, vendor, amount, etc.)",
      "Review and confirm the import",
    ],
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <Section background="neutral" padding="lg">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">
            Integrations
          </p>
          <h1 className="mt-3 font-display text-display-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-md">
            Connect your accounting tools
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Import expenses from QuickBooks Online, Xero, or any accounting system via CSV.
            GrantLedger handles the rest with AI-powered categorization.
          </p>
        </div>
      </Section>

      {/* Integration Cards */}
      <Section background="white" padding="lg">
        <div className="space-y-16">
          {integrations.map((integration, idx) => (
            <div
              key={integration.name}
              className={`mx-auto grid max-w-5xl items-start gap-12 ${idx % 2 === 1 ? "lg:grid-cols-[1fr_1.2fr]" : "lg:grid-cols-[1.2fr_1fr]"}`}
            >
              <div className={idx % 2 === 1 ? "lg:order-2" : ""}>
                <div className="flex items-center gap-4">
                  {integration.icon}
                  <h2 className="font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
                    {integration.name}
                  </h2>
                </div>
                <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-400">
                  {integration.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {integration.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className={`rounded-2xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-800 ${idx % 2 === 1 ? "lg:order-1" : ""}`}>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  How it works
                </h3>
                <ol className="mt-6 space-y-4">
                  {integration.steps.map((step, stepIdx) => (
                    <li key={step} className="flex gap-4">
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                        {stepIdx + 1}
                      </span>
                      <span className="pt-1 text-sm text-slate-700 dark:text-slate-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section background="neutral" padding="md">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Ready to connect your accounting?
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Start your free 14-day trial and import your first grant expenses in minutes.
          </p>
          <Link
            href="/sign-up"
            className="mt-8 inline-block rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Free Trial
          </Link>
        </div>
      </Section>
    </>
  );
}

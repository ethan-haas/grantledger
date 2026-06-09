import type { Metadata } from "next";
import { Section } from "@/components/marketing/section";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security — GrantLedger",
  description:
    "Learn how GrantLedger protects your federal grant financial data with encryption, row-level data isolation, and security-first architecture.",
  alternates: { canonical: "/security" },
  openGraph: {
    title: "Security — GrantLedger",
    description:
      "Security-first architecture for federal grant compliance data.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Security — GrantLedger",
  description:
    "Learn how GrantLedger protects your federal grant financial data with encryption, row-level data isolation, and security-first architecture.",
  url: `${SITE_URL}/security`,
};

const securityFeatures = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
      </svg>
    ),
    title: "AES-256 Encryption",
    description:
      "All data is encrypted at rest using AES-256 encryption. Data in transit is protected with TLS 1.3. Accounting integration tokens are individually encrypted before storage.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
    title: "Row-Level Data Isolation",
    description:
      "Every database query is scoped to your organization using PostgreSQL Row-Level Security (RLS). Your data is isolated at the database engine level — not just the application layer.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    title: "OAuth Token Security",
    description:
      "QuickBooks and Xero integration tokens are encrypted with AES-256-GCM before storage. Tokens are decrypted only at request time and never logged or exposed to the client.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Identity & Access Management",
    description:
      "Authentication is powered by Clerk, providing enterprise-grade identity management with multi-factor authentication, session management, and organization-level access controls.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      </svg>
    ),
    title: "Infrastructure Security",
    description:
      "Hosted on Vercel with automatic DDoS protection, edge network distribution, and serverless architecture. Database hosted on Supabase with automated backups and point-in-time recovery.",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    title: "Audit Trail",
    description:
      "Every expense confirmation, category change, and data export is logged with timestamps and user identity. The complete audit trail supports single audit compliance requirements.",
  },
];

const complianceItems = [
  {
    label: "Data encryption",
    detail: "AES-256 at rest, TLS 1.3 in transit",
  },
  {
    label: "Access control",
    detail: "Row-Level Security (RLS) on every table",
  },
  {
    label: "Authentication",
    detail: "Clerk with MFA support",
  },
  {
    label: "Token storage",
    detail: "AES-256-GCM encrypted OAuth tokens",
  },
  {
    label: "Hosting",
    detail: "Vercel (US) + Supabase (configurable region)",
  },
  {
    label: "Backups",
    detail: "Automated daily with point-in-time recovery",
  },
  {
    label: "Monitoring",
    detail: "Sentry error tracking, structured logging",
  },
  {
    label: "Headers",
    detail: "CSP, HSTS, X-Frame-Options, X-Content-Type-Options",
  },
];

export default function SecurityPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <Section background="neutral" padding="lg">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100">
            <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h1 className="font-display text-display-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-md">
            Security-first architecture
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Your federal grant financial data demands the highest level of protection.
            GrantLedger is built from the ground up with encryption, data isolation,
            and compliance-ready infrastructure.
          </p>
        </div>
      </Section>

      {/* Security Features Grid */}
      <Section background="white" padding="lg">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
            How we protect your data
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            Multiple layers of security ensure your financial data stays private and compliant.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2 lg:grid-cols-3">
          {securityFeatures.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft-sm transition-shadow hover:shadow-soft dark:border-slate-700 dark:bg-slate-800">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 text-primary-600 dark:from-primary-900/30 dark:to-primary-800/20 dark:text-primary-400">
                {feature.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Compliance Summary Table */}
      <Section background="neutral" padding="md">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
            Security at a glance
          </h2>
          <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-soft-sm dark:border-slate-700 dark:bg-slate-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Control
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Implementation
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {complianceItems.map((item) => (
                  <tr key={item.label}>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {item.label}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {item.detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section background="white" padding="md">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
            Questions about security?
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            We take data protection seriously. Reach out to learn more about our security practices.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
            >
              Contact Us
            </Link>
            <Link
              href="/sign-up"
              className="rounded-xl border border-slate-300 bg-white/80 px-8 py-4 text-sm font-semibold text-slate-700 shadow-soft-sm transition-all duration-200 hover:bg-white hover:shadow-sm active:scale-[0.98]"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}

import type { Metadata } from "next";
import { Section } from "@/components/marketing/section";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "About — GrantLedger",
  description:
    "GrantLedger is built for nonprofit finance directors who spend more time on compliance than on mission. Learn about our team and our approach.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About — GrantLedger",
    description:
      "Built for the nonprofit finance directors who spend more time on compliance than on mission.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About GrantLedger",
  description:
    "GrantLedger is built for nonprofit finance directors who spend more time on compliance than on mission.",
  url: `${SITE_URL}/about`,
};

const values = [
  {
    title: "Compliance without complexity",
    description:
      "Federal grant regulations are complex enough. Our tools simplify the workflow so you can focus on the substance, not the spreadsheets.",
  },
  {
    title: "Accuracy you can trust",
    description:
      "Every AI categorization includes a specific CFR citation and confidence rating. And every suggestion requires human confirmation before it becomes final.",
  },
  {
    title: "Built for nonprofits",
    description:
      "We understand the unique constraints of nonprofit finance — limited staff, tight timelines, and zero tolerance for audit findings.",
  },
  {
    title: "Transparent by default",
    description:
      "Full audit trails, clear methodology documentation, and no black-box decisions. You always know exactly how and why an expense was categorized.",
  },
];

const team = [
  {
    name: "Leadership",
    description:
      "Our team combines deep expertise in federal grant compliance, nonprofit finance, and modern software engineering.",
  },
  {
    name: "Engineering",
    description:
      "We build with security-first architecture, using industry-leading tools like Supabase (Row-Level Security), Clerk, and Vercel.",
  },
  {
    name: "Compliance",
    description:
      "Our categorization model is grounded in the full text of 2 CFR 200 Subpart E, covering all 56 selected items of cost.",
  },
];

export default function AboutPage() {
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
            Our mission
          </p>
          <h1 className="mt-3 font-display text-display-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-md">
            Built for the nonprofit finance directors who spend more time on compliance than on mission
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            GrantLedger exists because we believe nonprofit teams should spend their time
            advancing their mission — not wrestling with spreadsheets, decoding CFR references,
            or worrying about audit findings.
          </p>
        </div>
      </Section>

      {/* Story */}
      <Section background="white" padding="lg">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
            Why we built GrantLedger
          </h2>
          <div className="mt-8 space-y-6 text-base leading-relaxed text-slate-600 dark:text-slate-400">
            <p>
              Federal grant management is one of the most consequential finance workflows in the
              nonprofit world. A single misclassified expense can trigger audit findings, jeopardize
              future funding, and divert staff from program delivery to compliance remediation.
            </p>
            <p>
              Yet most nonprofits still manage this process with spreadsheets, manual CFR lookups,
              and institutional knowledge that lives in one person&apos;s head. When OMB updated key
              thresholds in October 2024, finance teams had to manually track which rules applied to
              which grants — a recipe for errors.
            </p>
            <p>
              We built GrantLedger to automate the tedious parts — expense categorization, CFR citation
              lookup, threshold monitoring, and framework detection — while keeping humans in control of
              every final decision. The result: audit-ready compliance in a fraction of the time.
            </p>
          </div>
        </div>
      </Section>

      {/* Values */}
      <Section background="neutral" padding="lg">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
            What we believe
          </h2>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl gap-8 md:grid-cols-2">
          {values.map((value) => (
            <div key={value.title} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft-sm dark:border-slate-700 dark:bg-slate-800">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {value.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* Team */}
      <Section background="white" padding="lg">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-display-xs font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-sm">
            Our team
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400">
            A focused team building purpose-built tools for nonprofit compliance.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-4xl gap-8 md:grid-cols-3">
          {team.map((dept) => (
            <div key={dept.name} className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100">
                <span className="text-xl font-bold text-primary-600">
                  {dept.name[0]}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
                {dept.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {dept.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-neutral-950">
        <div className="absolute inset-0 bg-mesh opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-display-xs font-bold tracking-tight text-white sm:text-display-sm">
              Ready to simplify grant compliance?
            </h2>
            <p className="mt-4 text-lg text-neutral-300">
              Join nonprofit finance directors who trust GrantLedger for audit-ready compliance.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/sign-up"
                className="rounded-xl bg-white px-8 py-4 text-sm font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:bg-neutral-100 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
              >
                Start Your Free 14-Day Trial
              </Link>
              <Link
                href="/contact"
                className="rounded-xl border border-neutral-700 px-8 py-4 text-sm font-semibold text-neutral-300 transition-all duration-200 hover:border-neutral-500 hover:text-white active:scale-[0.98]"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

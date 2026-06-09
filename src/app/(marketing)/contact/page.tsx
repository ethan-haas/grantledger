"use client";

import { useState } from "react";
import { Section } from "@/components/marketing/section";
import Link from "next/link";

const subjects = [
  { value: "general", label: "General Inquiry" },
  { value: "support", label: "Technical Support" },
  { value: "billing", label: "Billing Question" },
  { value: "partnership", label: "Partnership" },
];

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "general",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      if (!res.ok) {
        const ct = res.headers.get("content-type");
        if (ct?.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.error || "Failed to send message");
        }
        throw new Error("Failed to send message");
      }

      setSuccess(true);
      setFormState({ name: "", email: "", subject: "general", message: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Hero */}
      <Section background="neutral" padding="lg">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="font-display text-display-sm font-bold tracking-tight text-slate-900 dark:text-white sm:text-display-md">
            Get in touch
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-400">
            Have a question about GrantLedger? We&apos;d love to hear from you.
            Our team typically responds within one business day.
          </p>
        </div>
      </Section>

      {/* Contact Form + Info */}
      <Section background="white" padding="lg">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-5">
          {/* Form */}
          <div className="lg:col-span-3">
            {success ? (
              <div className="rounded-2xl border border-success-200 bg-success-50 p-8 text-center dark:border-success-800 dark:bg-success-900/20">
                <svg className="mx-auto h-12 w-12 text-success-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="mt-4 text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Message sent
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Thanks for reaching out. We&apos;ll get back to you within one business day.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Name
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formState.name}
                    onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-soft-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Email
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-soft-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="you@nonprofit.org"
                  />
                </div>

                <div>
                  <label htmlFor="contact-subject" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Subject
                  </label>
                  <select
                    id="contact-subject"
                    value={formState.subject}
                    onChange={(e) => setFormState((s) => ({ ...s, subject: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-soft-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {subjects.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={5}
                    value={formState.message}
                    onChange={(e) => setFormState((s) => ({ ...s, message: e.target.value }))}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 shadow-soft-sm placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    placeholder="How can we help?"
                  />
                </div>

                {error && (
                  <p className="text-sm text-danger-600 dark:text-danger-400">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-8 py-4 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
                >
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-2">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Support Hours
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Monday – Friday, 9am – 6pm ET
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Response Time
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  We respond to all inquiries within one business day.
                  Billing and support issues are prioritized.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Resources
                </h3>
                <ul className="mt-2 space-y-2">
                  <li>
                    <Link href="/blog" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                      Read our blog
                    </Link>
                  </li>
                  <li>
                    <Link href="/methodology" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                      2 CFR 200 methodology
                    </Link>
                  </li>
                  <li>
                    <Link href="/resources" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                      Resource library
                    </Link>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Prefer to try it first?
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Start a free 14-day trial — no credit card required.
                </p>
                <Link
                  href="/sign-up"
                  className="mt-4 inline-block rounded-lg bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

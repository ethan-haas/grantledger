import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: "/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: February 22, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. Information We Collect</h2>
          <p className="mt-2">We collect the following types of information:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              <strong>Account information:</strong> Name, email address, organization name, and
              role when you create an account.
            </li>
            <li>
              <strong>Financial data:</strong> Grant details, expense records, and budget
              allocations that you upload or import through the Service.
            </li>
            <li>
              <strong>Usage data:</strong> Information about how you interact with the Service,
              including pages visited, features used, and actions taken.
            </li>
            <li>
              <strong>Device information:</strong> Browser type, operating system, and IP address
              collected automatically when you access the Service.
            </li>
            <li>
              <strong>Integration data:</strong> Data synced from connected accounting platforms
              (QuickBooks, Xero) with your authorization.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. How We Use Information</h2>
          <p className="mt-2">We use your information to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Provide and improve the Service, including AI-powered expense categorization</li>
            <li>Process payments and manage subscriptions</li>
            <li>Send transactional emails (account verification, billing, trial reminders)</li>
            <li>Provide customer support and respond to inquiries</li>
            <li>Monitor and improve Service performance and security</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. Data Sharing</h2>
          <p className="mt-2">
            We do not sell your personal data. We share information only with:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>
              <strong>Service providers:</strong> Third-party services that help us operate the
              Service (authentication, payment processing, email delivery, error tracking, AI
              processing). These providers are contractually bound to protect your data.
            </li>
            <li>
              <strong>Legal requirements:</strong> When required by law, court order, or
              governmental authority.
            </li>
            <li>
              <strong>Business transfers:</strong> In connection with a merger, acquisition, or
              sale of assets, with notice to affected users.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4. Data Retention</h2>
          <p className="mt-2">
            We retain your data for as long as your account is active or as needed to provide
            the Service. After account deletion, we retain data for 30 days before permanent
            deletion. We may retain anonymized, aggregated data for analytics purposes
            indefinitely.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">5. Security</h2>
          <p className="mt-2">
            We implement industry-standard security measures to protect your data, including:
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Encryption of data in transit (TLS) and at rest</li>
            <li>Row-level security (RLS) for database access control</li>
            <li>Encrypted storage of third-party integration tokens</li>
            <li>Regular security reviews and monitoring</li>
            <li>Access controls and audit logging</li>
          </ul>
          <p className="mt-2">
            No method of transmission or storage is 100% secure. While we strive to protect your
            data, we cannot guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">6. Your Rights</h2>
          <p className="mt-2">Depending on your jurisdiction, you may have the right to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Access the personal data we hold about you</li>
            <li>Correct inaccurate or incomplete data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Object to or restrict certain processing activities</li>
            <li>Withdraw consent where processing is based on consent</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at{" "}
            <a href="mailto:privacy@grantledger.com" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              privacy@grantledger.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">7. Cookies</h2>
          <p className="mt-2">
            We use essential cookies required for the Service to function (authentication,
            session management). We use analytics cookies (PostHog) to understand Service usage
            and improve the experience. You can control cookie settings through your browser
            preferences.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">8. Children&apos;s Privacy</h2>
          <p className="mt-2">
            The Service is not directed to individuals under 16 years of age. We do not
            knowingly collect personal data from children. If you believe we have collected data
            from a child, please contact us immediately.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">9. International Data Transfers</h2>
          <p className="mt-2">
            Your data may be transferred to and processed in countries other than your country
            of residence. We ensure appropriate safeguards are in place for such transfers in
            compliance with applicable data protection laws.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">10. Changes to This Policy</h2>
          <p className="mt-2">
            We may update this Privacy Policy from time to time. We will notify you of material
            changes via email or through the Service. The &quot;Last updated&quot; date at the
            top indicates when the policy was last revised.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">11. Contact Us</h2>
          <p className="mt-2">
            If you have questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:privacy@grantledger.com" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              privacy@grantledger.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}

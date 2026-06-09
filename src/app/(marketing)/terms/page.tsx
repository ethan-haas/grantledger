import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: {
    canonical: "/terms",
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Last updated: February 22, 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">1. Acceptance of Terms</h2>
          <p className="mt-2">
            By accessing or using GrantLedger (&quot;the Service&quot;), you agree to be bound by
            these Terms of Service. If you do not agree to these terms, you may not use the
            Service. These terms apply to all users, including organizations and their authorized
            members.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">2. Description of Service</h2>
          <p className="mt-2">
            GrantLedger is a software-as-a-service platform that helps nonprofit organizations
            categorize federal grant expenses into 2 CFR 200 / SF-424A budget categories using
            artificial intelligence, with budget-to-actual tracking and compliance reporting
            capabilities.
          </p>
          <p className="mt-2">
            The Service provides AI-assisted categorization suggestions but does not constitute
            legal, financial, or audit advice. Users are responsible for reviewing and confirming
            all categorizations before relying on them for compliance purposes.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">3. User Accounts</h2>
          <p className="mt-2">
            You must provide accurate and complete information when creating an account. You are
            responsible for maintaining the confidentiality of your account credentials and for
            all activities that occur under your account. You must notify us immediately of any
            unauthorized use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">4. Acceptable Use</h2>
          <p className="mt-2">You agree not to:</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to the Service or its systems</li>
            <li>Interfere with or disrupt the Service or its infrastructure</li>
            <li>Upload malicious code or content</li>
            <li>Resell or redistribute the Service without authorization</li>
            <li>Use the Service to store or transmit content that infringes third-party rights</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">5. Subscription and Payment</h2>
          <p className="mt-2">
            The Service offers a 14-day free trial. After the trial period, a paid subscription
            is required for continued access. Subscriptions are billed monthly or annually as
            selected. All fees are non-refundable except as required by law.
          </p>
          <p className="mt-2">
            We reserve the right to change pricing with 30 days&apos; notice. Price changes will
            take effect at the start of the next billing cycle.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">6. Intellectual Property</h2>
          <p className="mt-2">
            The Service and its original content, features, and functionality are owned by
            GrantLedger and are protected by copyright, trademark, and other intellectual
            property laws. Your data remains your property. You grant us a limited license to
            process your data solely to provide the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">7. Limitation of Liability</h2>
          <p className="mt-2">
            To the maximum extent permitted by law, GrantLedger shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, or any loss of
            profits or revenue, whether incurred directly or indirectly, or any loss of data,
            use, goodwill, or other intangible losses resulting from your use of the Service.
          </p>
          <p className="mt-2">
            GrantLedger&apos;s total liability for any claim arising from or related to the
            Service shall not exceed the amount paid by you in the twelve (12) months preceding
            the claim.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">8. Disclaimer</h2>
          <p className="mt-2">
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind. AI-generated categorizations are suggestions only and should
            be verified by qualified personnel before use in compliance filings or audit
            preparation.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">9. Termination</h2>
          <p className="mt-2">
            We may terminate or suspend your account at any time for violation of these terms.
            You may cancel your subscription at any time through the billing settings. Upon
            termination, your right to use the Service will immediately cease. We will retain
            your data for 30 days after account closure, after which it will be permanently
            deleted.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">10. Governing Law</h2>
          <p className="mt-2">
            These terms shall be governed by and construed in accordance with the laws of the
            State of Delaware, without regard to its conflict of law provisions.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">11. Changes to Terms</h2>
          <p className="mt-2">
            We reserve the right to modify these terms at any time. We will provide notice of
            material changes via email or through the Service. Your continued use of the Service
            after changes take effect constitutes acceptance of the modified terms.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">12. Contact</h2>
          <p className="mt-2">
            If you have questions about these Terms of Service, please contact us at{" "}
            <a href="mailto:legal@grantledger.com" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              legal@grantledger.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}

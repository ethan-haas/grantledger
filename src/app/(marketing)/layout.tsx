import type { Metadata } from "next";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";
import { SkipLink } from "@/components/ui/skip-link";
import { RouteProgressBar } from "@/components/ui/route-progress";

export const metadata: Metadata = {
  title: "GrantLedger — Federal Grant Expense Categorization",
  description:
    "Automate federal grant expense categorization into 2 CFR 200 / SF-424A budget categories with AI. Budget-to-actual tracking and dual-framework compliance for nonprofit finance directors.",
  openGraph: {
    title: "GrantLedger — Grant Compliance on Autopilot",
    description:
      "AI-powered expense categorization for federal grants. Audit-ready in minutes.",
    type: "website",
  },
  alternates: {
    canonical: "/",
  },
};

const softwareAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GrantLedger",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "AI-powered federal grant expense categorization into 2 CFR 200 / SF-424A budget categories with budget-to-actual tracking and dual-framework compliance.",
  offers: [
    {
      "@type": "Offer",
      price: "149",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      description: "Monthly plan",
    },
    {
      "@type": "Offer",
      price: "1490",
      priceCurrency: "USD",
      priceValidUntil: "2027-12-31",
      description: "Annual plan",
    },
  ],
  featureList: [
    "AI expense categorization with CFR citations",
    "SF-424A budget categories",
    "Dual-framework compliance (pre/post October 2024 OMB rules)",
    "QuickBooks Online and Xero integration",
    "PDF and CSV audit reports",
    "Budget-to-actual dashboard",
  ],
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <RouteProgressBar />
      <SkipLink />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }}
      />
      <MarketingHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}

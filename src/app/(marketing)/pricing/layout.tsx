import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — GrantLedger",
  description:
    "Simple, transparent pricing for federal grant expense categorization. 14-day free trial, no credit card required. Annual and monthly plans available.",
  openGraph: {
    title: "Pricing — GrantLedger",
    description: "Affordable AI-powered grant compliance. Start free, upgrade when ready.",
  },
  alternates: {
    canonical: "/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — GrantLedger",
  description:
    "Get in touch with the GrantLedger team. Questions about federal grant expense management? We respond within one business day.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — GrantLedger",
    description:
      "Contact the GrantLedger team for support, billing, or partnership inquiries.",
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

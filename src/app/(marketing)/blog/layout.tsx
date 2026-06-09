import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { template: "%s | GrantLedger Blog", default: "Blog — GrantLedger" },
  description: "Compliance guides, product updates, and case studies for nonprofit federal grant management.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — GrantLedger",
    description: "Compliance guides, product updates, and case studies for nonprofit federal grant management.",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

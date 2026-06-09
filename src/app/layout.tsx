import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Providers } from "./providers";
import { getServerEnv } from "@/lib/env";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "GrantLedger — Federal Grant Expense Categorization",
    template: "%s | GrantLedger",
  },
  description:
    "Automate federal grant expense categorization into 2 CFR 200 / SF-424A budget categories with AI. Budget-to-actual tracking and dual-framework compliance.",
  metadataBase: new URL(getServerEnv().NEXT_PUBLIC_APP_URL),
  openGraph: {
    title: "GrantLedger — Grant Compliance on Autopilot",
    description:
      "AI-powered expense categorization for federal grants. Audit-ready in minutes, not days.",
    type: "website",
    siteName: "GrantLedger",
  },
  twitter: {
    card: "summary_large_image",
    title: "GrantLedger — Federal Grant Expense Categorization",
    description: "AI-powered 2 CFR 200 compliance for nonprofit finance directors.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://clerk.grantledger.com" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="dns-prefetch" href="https://api.stripe.com" />
        </head>
        <body className={`${inter.variable} ${jakarta.variable} font-sans`}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  );
}

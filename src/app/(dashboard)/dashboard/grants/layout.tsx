import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grants - GrantLedger",
};

export default function GrantsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

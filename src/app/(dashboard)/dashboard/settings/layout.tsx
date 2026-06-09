import type { Metadata } from "next";
import { SettingsNav } from "@/components/dashboard/settings-nav";

export const metadata: Metadata = {
  title: "Settings - GrantLedger",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="lg:w-52 shrink-0">
        <SettingsNav />
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

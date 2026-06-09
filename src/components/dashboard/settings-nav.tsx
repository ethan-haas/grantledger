"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const settingsLinks = [
  { href: "/dashboard/settings", label: "General", exact: true },
  { href: "/dashboard/settings/billing", label: "Billing", exact: false },
  { href: "/dashboard/settings/connections", label: "Connections", exact: false },
  { href: "/dashboard/settings/notifications", label: "Notifications", exact: false },
  { href: "/dashboard/settings/export", label: "Data Export", exact: false },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings navigation" className="flex gap-1 overflow-x-auto lg:flex-col">
      {settingsLinks.map((link) => {
        const isActive = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

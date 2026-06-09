"use client";

import { useEffect, useState } from "react";
import { UserButton, OrganizationSwitcher } from "@clerk/nextjs";
import { useUiStore } from "@/stores/ui-store";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { NotificationBadge } from "@/components/dashboard/notification-badge";

export function DashboardHeader() {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-header flex h-16 items-center justify-between border-b px-4 transition-all duration-200 lg:px-6 ${
        scrolled
          ? "border-slate-200 bg-white/80 backdrop-blur-lg shadow-soft-sm dark:border-slate-700 dark:bg-slate-900/80"
          : "border-transparent bg-white dark:border-transparent dark:bg-slate-900"
      }`}
    >
      {/* Mobile hamburger */}
      <button
        onClick={toggleSidebar}
        className="rounded-lg p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:bg-slate-100 lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Toggle navigation menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationBadge />
        <OrganizationSwitcher
          afterSelectOrganizationUrl="/dashboard"
          afterCreateOrganizationUrl="/dashboard"
          appearance={{
            elements: {
              rootBox: "flex items-center",
            },
          }}
        />
        <UserButton afterSignOutUrl="/" />
      </div>
    </header>
  );
}

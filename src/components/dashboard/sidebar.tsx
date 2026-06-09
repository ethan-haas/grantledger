"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUiStore } from "@/stores/ui-store";
import { useModKey } from "@/hooks/use-mod-key";

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    label: "Grants",
    href: "/dashboard/grants",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("grantledger-sidebar-collapsed") === "true";
}

interface SidebarProps {
  trialDaysRemaining?: number | null;
  subscriptionStatus?: string | null;
}

export function Sidebar({ trialDaysRemaining, subscriptionStatus }: SidebarProps = {}) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const sidebarRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const modKey = useModKey();

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("grantledger-sidebar-collapsed", String(next));
      }
      return next;
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        return;
      }

      if (e.key === "Tab" && sidebarRef.current) {
        const focusable = sidebarRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [setSidebarOpen]
  );

  useEffect(() => {
    if (sidebarOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      const firstLink = sidebarRef.current?.querySelector<HTMLElement>("a[href]");
      if (firstLink) {
        requestAnimationFrame(() => firstLink.focus());
      }

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    } else {
      previousFocusRef.current?.focus();
    }
  }, [sidebarOpen, handleKeyDown]);

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-sidebar-overlay bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        role={sidebarOpen ? "dialog" : undefined}
        aria-modal={sidebarOpen ? "true" : undefined}
        aria-label="Navigation"
        className={`fixed inset-y-0 left-0 z-sidebar max-w-[85vw] transform bg-white border-r border-slate-200 transition-[width,transform] duration-200 lg:translate-x-0 lg:static lg:z-auto dark:bg-slate-900 dark:border-slate-700 ${
          collapsed ? "w-16" : "w-64"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`flex h-16 items-center border-b border-slate-200 dark:border-slate-700 ${collapsed ? "justify-center px-2" : "px-6"}`}>
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 shadow-sm">
              <span className="text-xs font-bold text-white">GL</span>
            </div>
            {!collapsed && (
              <span className="text-lg font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
                GrantLedger
              </span>
            )}
          </Link>
        </div>
        <nav className={`mt-4 space-y-1 ${collapsed ? "px-1.5" : "px-3"}`}>
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center rounded-lg text-sm font-medium transition-all duration-150 ${
                  collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400"
                    : "text-slate-600 hover:bg-slate-100/60 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-primary-600" />
                )}
                {item.icon}
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 dark:border-slate-700 p-3 space-y-3">
          {/* Collapse toggle button */}
          <div className={`hidden lg:flex ${collapsed ? "justify-center" : "justify-end"}`}>
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <svg
                className={`h-4 w-4 transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          </div>

          {/* Keyboard shortcut hint */}
          {!collapsed && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {modKey}
              </kbd>
              <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400">
                K
              </kbd>
              <span>Quick search</span>
            </div>
          )}

          {/* Trial progress indicator */}
          {subscriptionStatus === "trialing" && trialDaysRemaining != null && !collapsed && (
            <Link
              href="/dashboard/settings/billing"
              onClick={() => setSidebarOpen(false)}
              className="block rounded-lg bg-primary-50 dark:bg-primary-900/30 px-3 py-2.5 transition-colors hover:bg-primary-100 dark:hover:bg-primary-900/50"
            >
              <div className="flex items-center justify-between text-xs font-medium text-primary-700 dark:text-primary-300">
                <span>Free Trial</span>
                <span>{trialDaysRemaining} day{trialDaysRemaining !== 1 ? "s" : ""} left</span>
              </div>
              <div className="mt-1.5 h-1.5 rounded-full bg-primary-200 dark:bg-primary-800">
                <div
                  className="h-1.5 rounded-full bg-primary-600 transition-all duration-500"
                  style={{ width: `${Math.max(5, Math.min(100, ((14 - trialDaysRemaining) / 14) * 100))}%` }}
                  role="progressbar"
                  aria-valuenow={14 - trialDaysRemaining}
                  aria-valuemin={0}
                  aria-valuemax={14}
                  aria-label={`Trial progress: ${trialDaysRemaining} days remaining`}
                />
              </div>
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}

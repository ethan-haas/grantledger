"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface Notification {
  id: string;
  type: "pending_review" | "budget_alert" | "import_complete";
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

export function NotificationBadge() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [count, setCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=5");
      if (!res.ok) return;
      const ct = res.headers.get("content-type");
      if (!ct?.includes("application/json")) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setCount(data.totalCount || 0);
    } catch {
      // Non-critical — silently fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const typeIcons: Record<string, React.ReactNode> = {
    pending_review: (
      <svg className="h-4 w-4 text-warning-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    budget_alert: (
      <svg className="h-4 w-4 text-danger-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    import_complete: (
      <svg className="h-4 w-4 text-success-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <DropdownMenu>
      <DropdownTrigger className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-300">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
        <span className="sr-only">Notifications ({count})</span>
      </DropdownTrigger>
      <DropdownContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</p>
        </div>
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No notifications
          </div>
        ) : (
          <>
            {notifications.map((n) => (
              <DropdownItem key={n.id} icon={typeIcons[n.type]} description={n.description} onSelect={() => {}}>
                <Link href={n.href} className="no-underline text-inherit">
                  {n.title}
                </Link>
              </DropdownItem>
            ))}
            {count > 5 && (
              <>
                <DropdownSeparator />
                <DropdownItem onSelect={() => {}}>
                  <Link href="/dashboard" className="text-primary-600 dark:text-primary-400 text-center w-full no-underline">
                    View all {count} notifications
                  </Link>
                </DropdownItem>
              </>
            )}
          </>
        )}
      </DropdownContent>
    </DropdownMenu>
  );
}

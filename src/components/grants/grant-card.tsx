"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FrameworkBadge } from "./framework-badge";
import type { OmbFramework } from "@/lib/supabase/database.types";
import { formatCurrency, formatPeriodDate } from "@/lib/constants/thresholds";
import { useUiStore } from "@/stores/ui-store";
import { trackEvent } from "@/lib/posthog";

interface GrantCardProps {
  id: string;
  name: string;
  funding_agency: string;
  period_start: string;
  period_end: string;
  total_amount: number;
  omb_framework: OmbFramework;
  status: string;
  showActions?: boolean;
}

export const GrantCard = React.memo(function GrantCard({
  id,
  name,
  funding_agency,
  period_start,
  period_end,
  total_amount,
  omb_framework,
  status,
  showActions = false,
}: GrantCardProps) {
  const router = useRouter();
  const addToast = useUiStore((s) => s.addToast);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    if (menuOpen) {
      const menuButton = menuButtonRef.current;
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
        menuButton?.focus();
      };
    }
  }, [menuOpen]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/grants/${id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) throw new Error("Failed to delete");
      trackEvent("grant_deleted", { grant_id: id });
      addToast({ type: "success", title: "Grant deleted" });
      router.refresh();
    } catch {
      addToast({ type: "error", title: "Failed to delete grant" });
    } finally {
      setDeleting(false);
      setShowDelete(false);
    }
  }

  const statusColor =
    status === "active" ? "bg-success-500" :
    status === "completed" ? "bg-slate-400" :
    "bg-warning-500";

  return (
    <div className="relative">
      <Link href={`/dashboard/grants/${id}`}>
        <Card hover>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1 pr-8">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                <h3 className="truncate text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">{name}</h3>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{funding_agency}</p>
            </div>
            <FrameworkBadge framework={omb_framework} />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500 dark:text-slate-400">Period</span>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {formatPeriodDate(period_start)}
                {" - "}
                {formatPeriodDate(period_end)}
              </p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Total Award</span>
              <p className="font-medium tabular-nums text-slate-900 dark:text-slate-100">{formatCurrency(total_amount)}</p>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400">Status</span>
              <p className="font-medium capitalize text-slate-900 dark:text-slate-100">{status}</p>
            </div>
          </div>
        </Card>
      </Link>

      {showActions && (
        <div className="absolute right-4 top-4" ref={menuRef}>
          <button
            ref={menuButtonRef}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
            className="rounded-full p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
            aria-label={`Actions for ${name}`}
            aria-expanded={menuOpen}
            aria-haspopup="true"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <circle cx="10" cy="4" r="2" />
              <circle cx="10" cy="10" r="2" />
              <circle cx="10" cy="16" r="2" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 py-1 shadow-soft-lg animate-scaleIn">
              <Link
                href={`/dashboard/grants/${id}/edit`}
                className="block px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-700"
                onClick={() => setMenuOpen(false)}
              >
                Edit
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen(false);
                  setShowDelete(true);
                }}
                className="block w-full px-4 py-2.5 text-left text-sm text-danger-600 transition-colors hover:bg-danger-50 dark:text-danger-400 dark:hover:bg-danger-900/50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={showDelete}
        title="Delete Grant"
        message={`Are you sure you want to delete "${name}"? This will also delete all associated expenses and budget data. This action cannot be undone.`}
        confirmLabel="Delete Grant"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
});

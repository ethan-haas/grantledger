"use client";

import { useState } from "react";
import { formatDate } from "@/lib/constants/thresholds";
import { getActivityDiffs, type DiffEntry } from "@/lib/audit/activity-diff";
import type { ActivityAction } from "@/lib/supabase/database.types";

interface ActivityEntry {
  id: string;
  action: ActivityAction;
  actor_email: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface ActivityTimelineProps {
  activities: ActivityEntry[];
  emptyMessage?: string;
}

const ACTION_META: Record<ActivityAction, { label: string; color: string; icon: string }> = {
  grant_created: { label: "Grant created", color: "bg-success-500", icon: "+" },
  grant_updated: { label: "Grant updated", color: "bg-primary-500", icon: "~" },
  grant_deleted: { label: "Grant deleted", color: "bg-danger-500", icon: "×" },
  expense_confirmed: { label: "Expense confirmed", color: "bg-success-500", icon: "✓" },
  expense_excluded: { label: "Expense excluded", color: "bg-warning-500", icon: "−" },
  expense_deleted: { label: "Expense deleted", color: "bg-danger-500", icon: "×" },
  expenses_imported: { label: "Expenses imported", color: "bg-primary-500", icon: "↑" },
  bulk_confirmed: { label: "Bulk confirmed", color: "bg-success-500", icon: "✓✓" },
  report_generated: { label: "Report generated", color: "bg-primary-500", icon: "📄" },
  member_invited: { label: "Member invited", color: "bg-primary-500", icon: "✉" },
  member_role_changed: { label: "Role changed", color: "bg-warning-500", icon: "~" },
  member_removed: { label: "Member removed", color: "bg-danger-500", icon: "×" },
};

function getDetailSummary(action: ActivityAction, details: Record<string, unknown>): string | null {
  if (action === "expenses_imported" && typeof details.count === "number") {
    return `${details.count} expense${details.count === 1 ? "" : "s"} imported`;
  }
  if (action === "bulk_confirmed" && typeof details.count === "number") {
    return `${details.count} expense${details.count === 1 ? "" : "s"} confirmed`;
  }
  if (action === "grant_created" && typeof details.grant_name === "string") {
    return details.grant_name;
  }
  if (action === "report_generated" && typeof details.format === "string") {
    return `${details.format.toUpperCase()} report`;
  }
  return null;
}

function DiffDisplay({ diffs }: { diffs: DiffEntry[] }) {
  if (diffs.length === 0) return null;
  return (
    <div className="mt-1.5 space-y-1">
      {diffs.map((d) => (
        <div key={d.field} className="text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">{d.label}:</span>{" "}
          <span className="text-slate-400 line-through">{d.before}</span>{" "}
          <span className="text-slate-400" aria-hidden="true">→</span>{" "}
          <span className="font-medium text-slate-700 dark:text-slate-200">{d.after}</span>
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded p-2 min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400"
      aria-label="Copy activity entry"
      title="Copy entry details"
    >
      {copied ? (
        <svg className="h-3.5 w-3.5 text-success-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.5a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
        </svg>
      )}
    </button>
  );
}

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const [expanded, setExpanded] = useState(false);
  const meta = ACTION_META[entry.action] ?? {
    label: entry.action,
    color: "bg-slate-400",
    icon: "•",
  };
  const detail = getDetailSummary(entry.action, entry.details);
  const diffs = getActivityDiffs(entry.details);
  const hasExpandableContent = diffs.length > 0 || Object.keys(entry.details).length > 2;

  const copyText = `${meta.label} by ${entry.actor_email} on ${formatDate(entry.created_at)}${detail ? ` — ${detail}` : ""}`;

  return (
    <li className="relative flex gap-4 pl-2">
      {/* Dot */}
      <div
        className={`relative z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${meta.color}`}
        aria-hidden="true"
      >
        {meta.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                {meta.label}
              </p>
              {hasExpandableContent && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                  aria-label={expanded ? "Collapse details" : "Expand details"}
                >
                  {expanded ? "Hide" : "Details"}
                </button>
              )}
            </div>
            {detail && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 truncate">
                {detail}
              </p>
            )}
            {/* Always show diffs inline if present */}
            {diffs.length > 0 && <DiffDisplay diffs={diffs} />}
          </div>
          <CopyButton text={copyText} />
        </div>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {entry.actor_email} &middot; {formatDate(entry.created_at)}
        </p>

        {/* Expanded details */}
        {expanded && hasExpandableContent && (
          <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800">
            <pre className="whitespace-pre-wrap break-all text-slate-600 dark:text-slate-400">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </li>
  );
}

export function ActivityTimeline({ activities, emptyMessage }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
        {emptyMessage || "No activity recorded yet."}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />

      <ol className="space-y-4">
        {activities.map((entry) => (
          <ActivityItem key={entry.id} entry={entry} />
        ))}
      </ol>
    </div>
  );
}

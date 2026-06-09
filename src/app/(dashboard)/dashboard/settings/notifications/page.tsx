"use client";

import { useEffect, useState } from "react";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useUiStore } from "@/stores/ui-store";

interface NotificationPreferences {
  notify_weekly_digest: boolean;
  notify_trial_reminders: boolean;
  notify_budget_alerts: boolean;
}

export default function NotificationsSettingsPage() {
  const addToast = useUiStore((s) => s.addToast);
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrefs() {
      try {
        const res = await fetch("/api/org/notifications");
        if (!res.ok) throw new Error("Failed to fetch preferences");
        const data = await res.json();
        setPrefs(data);
      } catch {
        addToast({ type: "error", title: "Failed to load notification preferences" });
      } finally {
        setLoading(false);
      }
    }
    fetchPrefs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleToggle(field: keyof NotificationPreferences, value: boolean) {
    // Optimistically update the UI
    setPrefs((prev) => (prev ? { ...prev, [field]: value } : prev));

    try {
      const res = await fetch("/api/org/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update preference");
    } catch {
      // Revert on error
      setPrefs((prev) => (prev ? { ...prev, [field]: !value } : prev));
      addToast({ type: "error", title: "Failed to update notification preference" });
    }
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Settings", href: "/dashboard/settings" },
          { label: "Notifications" },
        ]}
      />
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">
          Notifications
        </h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Manage your email notification preferences.
        </p>
      </div>

      <Card>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>Choose which emails you receive from GrantLedger.</CardDescription>

        <div className="mt-6 divide-y divide-slate-200 dark:divide-slate-700">
          {loading ? (
            <>
              <div className="flex items-center justify-between py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <div className="flex items-center justify-between py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
              <div className="flex items-center justify-between py-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            </>
          ) : prefs ? (
            <>
              <div className="flex items-center justify-between py-4">
                <Switch
                  label="Weekly Digest"
                  description="Weekly summary of grant spending, pending reviews, and budget alerts."
                  checked={prefs.notify_weekly_digest}
                  onChange={(e) => handleToggle("notify_weekly_digest", e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between py-4">
                <Switch
                  label="Trial Reminders"
                  description="Reminders before your trial expires."
                  checked={prefs.notify_trial_reminders}
                  onChange={(e) => handleToggle("notify_trial_reminders", e.target.checked)}
                />
              </div>
              <div className="flex items-center justify-between py-4">
                <Switch
                  label="Budget Alerts"
                  description="Alerts when budget categories reach 80% or 90% utilization."
                  checked={prefs.notify_budget_alerts}
                  onChange={(e) => handleToggle("notify_budget_alerts", e.target.checked)}
                />
              </div>
            </>
          ) : (
            <p className="py-4 text-sm text-slate-500 dark:text-slate-400">
              Unable to load notification preferences. Please try refreshing the page.
            </p>
          )}
        </div>

        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          All email notifications include an unsubscribe link.
        </p>
      </Card>
    </div>
  );
}

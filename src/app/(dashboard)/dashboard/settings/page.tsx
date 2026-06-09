import { currentUser } from "@clerk/nextjs/server";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import Link from "next/link";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { CopyButton } from "@/components/ui/copy-button";
import { DangerZone } from "./danger-zone";

export default async function SettingsPage() {
  const { orgId } = getAuthOrgId();
  const user = await currentUser();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Manage your organization and account.</p>
      </div>

      <Card>
        <CardTitle>Organization</CardTitle>
        <CardDescription>
          <span className="inline-flex items-center gap-1">
            Organization ID: <span className="font-mono text-slate-700 dark:text-slate-300">{orgId || "No organization selected"}</span>
            {orgId && <CopyButton text={orgId} label="Copy organization ID" />}
          </span>
        </CardDescription>
        <div className="mt-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Signed in as {user?.emailAddresses?.[0]?.emailAddress || "Unknown"}
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/settings/billing">
          <Card hover>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Manage your subscription and payment method.</CardDescription>
          </Card>
        </Link>
        <Link href="/dashboard/settings/connections">
          <Card hover>
            <CardTitle>Connections</CardTitle>
            <CardDescription>Connect QuickBooks, Xero, or upload CSV files.</CardDescription>
          </Card>
        </Link>
        <Link href="/dashboard/settings/notifications">
          <Card hover>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage email notification preferences.</CardDescription>
          </Card>
        </Link>
        <Link href="/dashboard/settings/export">
          <Card hover>
            <CardTitle>Data Export</CardTitle>
            <CardDescription>Download your grants and expenses as CSV.</CardDescription>
          </Card>
        </Link>
        <Link href="/dashboard/settings/team">
          <Card hover>
            <CardTitle>Team</CardTitle>
            <CardDescription>Manage team members and invitations.</CardDescription>
          </Card>
        </Link>
      </div>

      {/* Danger Zone */}
      <DangerZone orgId={orgId || ""} />
    </div>
  );
}

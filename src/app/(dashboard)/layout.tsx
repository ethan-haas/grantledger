import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { checkAccess } from "@/lib/auth/gate";
import { getTrialDaysRemaining } from "@/lib/auth/subscription";
import { createServerClient } from "@/lib/supabase/server";
import { TrialBanner } from "@/components/dashboard/trial-banner";
import { PastDueBanner } from "@/components/dashboard/past-due-banner";
import { PaywallModal } from "@/components/dashboard/paywall-modal";
import { Sidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { ToastContainer } from "@/components/ui/toast";
import { CommandPalette } from "@/components/ui/command-palette";
import { KeyboardShortcutsProvider } from "@/components/dashboard/keyboard-shortcuts-provider";
import { SkipLink } from "@/components/ui/skip-link";
import { MobileNav } from "@/components/dashboard/mobile-nav";
import { RouteProgressBar } from "@/components/ui/route-progress";
import { PageTransition } from "@/components/ui/page-transition";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { orgId } = getAuthOrgId();

  let accessLevel: "full_access" | "read_only" | "blocked" | "trial" = "trial";
  let trialDays = 14;
  let blockReason = "";

  if (orgId) {
    const access = await checkAccess(orgId);
    accessLevel = access.level;
    blockReason = access.reason || "";

    if (access.org?.trial_ends_at) {
      trialDays = getTrialDaysRemaining(access.org.trial_ends_at);
    }
  }

  let grantCount = 0;
  let expenseCount = 0;

  if (orgId && accessLevel === "trial") {
    const supabase = await createServerClient();
    const { count: gc } = await supabase
      .from("grants")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId);
    const { count: ec } = await supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("org_id", orgId);
    grantCount = gc ?? 0;
    expenseCount = ec ?? 0;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <RouteProgressBar />
      <SkipLink />
      {accessLevel === "trial" && (
        <TrialBanner
          daysRemaining={trialDays}
          grantCount={grantCount}
          grantLimit={2}
          expenseCount={expenseCount}
          expenseLimit={200}
        />
      )}
      {accessLevel === "read_only" && <PastDueBanner />}

      <div className="flex">
        <Sidebar
          trialDaysRemaining={accessLevel === "trial" ? trialDays : null}
          subscriptionStatus={accessLevel === "trial" ? "trialing" : null}
        />
        <div className="flex-1 min-w-0">
          <DashboardHeader />
          <main id="main-content" className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:px-6 sm:pb-20 md:pb-8 lg:px-8">
            {accessLevel === "blocked" ? (
              <PaywallModal reason={blockReason} />
            ) : (
              <PageTransition>{children}</PageTransition>
            )}
          </main>
        </div>
      </div>

      <MobileNav />
      <ToastContainer />
      <CommandPalette />
      <KeyboardShortcutsProvider />
    </div>
  );
}

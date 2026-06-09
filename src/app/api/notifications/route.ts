import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { computeAlertLevel } from "@/lib/queries/budget-actual";
import { logger } from "@/lib/logger";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

interface Notification {
  id: string;
  type: "pending_review" | "budget_alert";
  title: string;
  description: string;
  href: string;
  createdAt: string;
}

const SEVERITY_ORDER: Record<string, number> = {
  overspent: 0,
  critical: 1,
  warning: 2,
  pending_review: 3,
};

export async function GET(request: NextRequest) {
  const { orgId } = getAuthOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse({
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid limit parameter", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { limit } = parsed.data;

  try {
    const supabase = await createServerClient();

    // Query 1: Active grants for this org
    const { data: grants, error: grantsError } = await supabase
      .from("grants")
      .select("id, name")
      .eq("org_id", orgId)
      .eq("status", "active");

    if (grantsError) throw grantsError;

    if (!grants?.length) {
      return NextResponse.json(
        { notifications: [], totalCount: 0 },
        { headers: NO_CACHE_HEADERS }
      );
    }

    const grantIds = grants.map((g: { id: string }) => g.id);

    // Queries 2 & 3: Budgets and expenses in parallel (budget uses grant_id, not org_id)
    const [budgetsResult, expensesResult] = await Promise.all([
      supabase
        .from("grant_budgets")
        .select("grant_id, category, budgeted_amount")
        .in("grant_id", grantIds),
      supabase
        .from("expenses")
        .select("grant_id, confirmed_category, amount, status")
        .eq("org_id", orgId)
        .in("grant_id", grantIds)
        .neq("status", "excluded"),
    ]);

    if (budgetsResult.error) throw budgetsResult.error;
    if (expensesResult.error) throw expensesResult.error;

    const allBudgets = budgetsResult.data || [];
    const allExpenses = expensesResult.data || [];

    // Index budgets by grant_id
    const budgetsByGrant: Record<string, { category: string; budgeted_amount: number }[]> = {};
    allBudgets.forEach((b: { grant_id: string; category: string; budgeted_amount: number }) => {
      if (b.category === "total") return;
      if (!budgetsByGrant[b.grant_id]) budgetsByGrant[b.grant_id] = [];
      budgetsByGrant[b.grant_id].push(b);
    });

    // Index expenses by grant_id
    const spentByGrantCategory: Record<string, Record<string, number>> = {};
    const pendingByGrant: Record<string, number> = {};

    allExpenses.forEach((e: {
      grant_id: string;
      confirmed_category: string | null;
      amount: number;
      status: string;
    }) => {
      if (e.status === "confirmed") {
        const cat = e.confirmed_category || "other";
        if (!spentByGrantCategory[e.grant_id]) spentByGrantCategory[e.grant_id] = {};
        spentByGrantCategory[e.grant_id][cat] =
          (spentByGrantCategory[e.grant_id][cat] || 0) + e.amount;
      } else if (e.status === "pending_review") {
        pendingByGrant[e.grant_id] = (pendingByGrant[e.grant_id] || 0) + 1;
      }
    });

    const now = new Date().toISOString();
    const notifications: (Notification & { _severity: number })[] = [];

    // Generate notifications for each grant
    grants.forEach((grant: { id: string; name: string }) => {
      const grantName = grant.name;
      const href = `/dashboard/grants/${grant.id}`;

      // Pending review notifications
      const pending = pendingByGrant[grant.id] || 0;
      if (pending > 0) {
        notifications.push({
          id: `pending-${grant.id}`,
          type: "pending_review",
          title: `${pending} expense${pending === 1 ? "" : "s"} pending review`,
          description: grantName,
          href,
          createdAt: now,
          _severity: SEVERITY_ORDER.pending_review,
        });
      }

      // Budget alert notifications
      const budgets = budgetsByGrant[grant.id] || [];
      const spentMap = spentByGrantCategory[grant.id] || {};

      budgets.forEach((b) => {
        const spent = spentMap[b.category] || 0;
        const budgeted = b.budgeted_amount ?? 0;
        const alertLevel = computeAlertLevel(spent, budgeted);

        if (alertLevel !== "none") {
          const pct = budgeted > 0 ? Math.round((spent / budgeted) * 100) : 0;
          notifications.push({
            id: `budget-${grant.id}-${b.category}`,
            type: "budget_alert",
            title: `${formatCategoryName(b.category)} at ${pct}% of budget`,
            description: grantName,
            href,
            createdAt: now,
            _severity: SEVERITY_ORDER[alertLevel] ?? 3,
          });
        }
      });
    });

    // Sort by severity (overspent > critical > warning > pending_review)
    notifications.sort((a, b) => a._severity - b._severity);

    const totalCount = notifications.length;

    // Strip internal _severity field and slice to limit
    const result: Notification[] = notifications.slice(0, limit).map(
      ({ _severity: _, ...rest }) => rest
    );

    return NextResponse.json(
      { notifications: result, totalCount },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    logger.error("Failed to compute notifications", err instanceof Error ? err : undefined);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

function formatCategoryName(category: string): string {
  return category
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

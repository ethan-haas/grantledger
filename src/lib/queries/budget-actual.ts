import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

export type AlertLevel = "none" | "warning" | "critical" | "overspent";

export interface CategoryBreakdown {
  category: string;
  budgeted: number;
  spent: number;
  remaining: number;
  utilization: number;
  alertLevel: AlertLevel;
}

export interface GrantDashboardData {
  grantId: string;
  grantName: string;
  fundingAgency: string;
  ombFramework: string;
  periodStart: string;
  periodEnd: string;
  totalBudget: number;
  totalSpent: number;
  categories: CategoryBreakdown[];
  pendingCount: number;
  confirmedCount: number;
}

export function computeAlertLevel(spent: number, budgeted: number): CategoryBreakdown["alertLevel"] {
  if (budgeted <= 0) return "none";
  const pct = (spent / budgeted) * 100;
  if (pct > 100) return "overspent";
  if (pct >= 90) return "critical";
  if (pct >= 80) return "warning";
  return "none";
}

export async function getBudgetVsActual(
  grantId: string,
  orgId: string,
  dateRange?: { start: string; end: string }
): Promise<GrantDashboardData | null> {
  const supabase = await createServerClient();

  const { data: grant } = await supabase
    .from("grants")
    .select("*")
    .eq("id", grantId)
    .eq("org_id", orgId)
    .single();

  if (!grant) return null;

  const { data: budgets, error: budgetsError } = await supabase
    .from("grant_budgets")
    .select("*")
    .eq("grant_id", grantId);

  if (budgetsError) {
    logger.error("Failed to fetch budgets for grant", { grantId, error: budgetsError.message });
    return null;
  }

  let expenseQuery = supabase
    .from("expenses")
    .select("confirmed_category, amount, status")
    .eq("grant_id", grantId)
    .eq("org_id", orgId)
    .eq("status", "confirmed");

  if (dateRange) {
    expenseQuery = expenseQuery.gte("date", dateRange.start).lte("date", dateRange.end);
  }

  const { data: expenses, error: expensesError } = await expenseQuery;

  if (expensesError) {
    logger.error("Failed to fetch expenses for grant", { grantId, error: expensesError.message });
    return null;
  }

  let pendingQuery = supabase
    .from("expenses")
    .select("*", { count: "exact", head: true })
    .eq("grant_id", grantId)
    .eq("org_id", orgId)
    .eq("status", "pending_review");

  if (dateRange) {
    pendingQuery = pendingQuery.gte("date", dateRange.start).lte("date", dateRange.end);
  }

  const { count: pendingCount, error: pendingError } = await pendingQuery;

  if (pendingError) {
    logger.error("Failed to fetch pending count for grant", { grantId, error: pendingError.message });
    return null;
  }

  // Sum spent per category
  const spentByCategory: Record<string, number> = {};
  (expenses || []).forEach((e: { confirmed_category: string | null; amount: number }) => {
    const cat = e.confirmed_category || "other";
    spentByCategory[cat] = (spentByCategory[cat] || 0) + e.amount;
  });

  const categories: CategoryBreakdown[] = (budgets || [])
    .filter((b: { category: string }) => b.category !== "total")
    .map((b: { category: string; budgeted_amount: number }) => {
      const spent = spentByCategory[b.category] || 0;
      const budgeted = b.budgeted_amount ?? 0;
      const utilization = budgeted > 0 ? Math.round((spent / budgeted) * 1000) / 10 : 0;

      return {
        category: b.category,
        budgeted,
        spent,
        remaining: budgeted - spent,
        utilization,
        alertLevel: computeAlertLevel(spent, budgeted),
      };
    });

  return {
    grantId: grant.id,
    grantName: grant.name,
    fundingAgency: grant.funding_agency,
    ombFramework: grant.omb_framework,
    periodStart: grant.period_start,
    periodEnd: grant.period_end,
    totalBudget: categories.reduce((s, c) => s + c.budgeted, 0),
    totalSpent: categories.reduce((s, c) => s + c.spent, 0),
    categories,
    pendingCount: pendingCount || 0,
    confirmedCount: (expenses || []).length,
  };
}

/**
 * Batch-fetches overview metrics for all active grants in an org.
 * Uses 3 total queries instead of O(n*4) per-grant queries.
 */
export async function getOverviewMetrics(orgId: string) {
  const supabase = await createServerClient();

  // Query 1: All active grants
  const { data: grants, error: grantsError } = await supabase
    .from("grants")
    .select("*")
    .eq("org_id", orgId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (grantsError) {
    logger.error("Failed to fetch grants for overview", { orgId, error: grantsError.message });
    return { grants: [], totalBudget: 0, totalSpent: 0, totalAlerts: 0 };
  }

  if (!grants?.length) return { grants: [], totalBudget: 0, totalSpent: 0, totalAlerts: 0 };

  const grantIds = grants.map((g: { id: string }) => g.id);

  // Query 2: All budgets for these grants (single query)
  const { data: allBudgets, error: budgetsError } = await supabase
    .from("grant_budgets")
    .select("grant_id, category, budgeted_amount")
    .in("grant_id", grantIds);

  if (budgetsError) {
    logger.error("Failed to fetch budgets for overview", { orgId, error: budgetsError.message });
  }

  // Query 3: Expense sums grouped by grant + category (single query)
  // Also get status counts
  const { data: allExpenses, error: expensesError } = await supabase
    .from("expenses")
    .select("grant_id, confirmed_category, ai_category, amount, status")
    .eq("org_id", orgId)
    .in("grant_id", grantIds)
    .neq("status", "excluded");

  if (expensesError) {
    logger.error("Failed to fetch expenses for overview", { orgId, error: expensesError.message });
  }

  // Index budgets by grant_id
  const budgetsByGrant: Record<string, { category: string; budgeted_amount: number }[]> = {};
  (allBudgets || []).forEach((b: { grant_id: string; category: string; budgeted_amount: number }) => {
    if (!budgetsByGrant[b.grant_id]) budgetsByGrant[b.grant_id] = [];
    budgetsByGrant[b.grant_id].push(b);
  });

  // Index expense sums by grant_id + category, and count statuses
  const spentByGrantCategory: Record<string, Record<string, number>> = {};
  const pendingByGrant: Record<string, number> = {};
  const confirmedByGrant: Record<string, number> = {};

  (allExpenses || []).forEach((e: {
    grant_id: string;
    confirmed_category: string | null;
    ai_category: string | null;
    amount: number;
    status: string;
  }) => {
    if (e.status === "confirmed") {
      const cat = e.confirmed_category || "other";
      if (!spentByGrantCategory[e.grant_id]) spentByGrantCategory[e.grant_id] = {};
      spentByGrantCategory[e.grant_id][cat] = (spentByGrantCategory[e.grant_id][cat] || 0) + e.amount;
      confirmedByGrant[e.grant_id] = (confirmedByGrant[e.grant_id] || 0) + 1;
    } else if (e.status === "pending_review") {
      pendingByGrant[e.grant_id] = (pendingByGrant[e.grant_id] || 0) + 1;
    }
  });

  // Assemble summaries in memory
  const grantSummaries = [];
  let totalBudget = 0;
  let totalSpent = 0;
  let totalAlerts = 0;

  for (const grant of grants) {
    const budgets = (budgetsByGrant[grant.id] || []).filter(
      (b: { category: string }) => b.category !== "total"
    );
    const spentMap = spentByGrantCategory[grant.id] || {};

    let grantBudgetTotal = 0;
    let grantSpentTotal = 0;
    let alertCount = 0;

    for (const b of budgets) {
      const spent = spentMap[b.category] || 0;
      grantBudgetTotal += b.budgeted_amount ?? 0;
      grantSpentTotal += spent;
      const level = computeAlertLevel(spent, b.budgeted_amount);
      if (level !== "none") alertCount++;
    }

    totalBudget += grantBudgetTotal;
    totalSpent += grantSpentTotal;
    totalAlerts += alertCount;

    grantSummaries.push({
      id: grant.id,
      name: grant.name,
      fundingAgency: grant.funding_agency,
      ombFramework: grant.omb_framework,
      periodEnd: grant.period_end,
      totalBudget: grantBudgetTotal,
      totalSpent: grantSpentTotal,
      utilization: grantBudgetTotal > 0
        ? Math.round((grantSpentTotal / grantBudgetTotal) * 1000) / 10
        : 0,
      alertCount,
      pendingCount: pendingByGrant[grant.id] || 0,
      confirmedCount: confirmedByGrant[grant.id] || 0,
    });
  }

  // Sort by most alerts first
  grantSummaries.sort((a, b) => b.alertCount - a.alertCount);

  return { grants: grantSummaries, totalBudget, totalSpent, totalAlerts };
}

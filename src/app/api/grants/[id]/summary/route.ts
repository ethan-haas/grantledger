import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const supabase = await createServerClient();

    const { data: grant } = await supabase
      .from("grants")
      .select("*")
      .eq("id", params.id)
      .eq("org_id", orgId)
      .single();

    if (!grant) return NextResponse.json({ error: "Grant not found" }, { status: 404 });

    const { data: budgets, error: budgetError } = await supabase
      .from("grant_budgets")
      .select("*")
      .eq("grant_id", params.id);

    if (budgetError) {
      logger.error("Failed to fetch budgets", { grantId: params.id, error: budgetError.message });
      return NextResponse.json({ error: "Failed to fetch budget data" }, { status: 500 });
    }

    const { data: expenses, error: expenseError } = await supabase
      .from("expenses")
      .select("confirmed_category, amount, status")
      .eq("grant_id", params.id)
      .eq("org_id", orgId)
      .eq("status", "confirmed");

    if (expenseError) {
      logger.error("Failed to fetch expenses", { grantId: params.id, error: expenseError.message });
      return NextResponse.json({ error: "Failed to fetch expense data" }, { status: 500 });
    }

    // Calculate spent per category
    const spentByCategory: Record<string, number> = {};
    (expenses || []).forEach((exp: { confirmed_category: string | null; amount: number }) => {
      const cat = exp.confirmed_category || "other";
      spentByCategory[cat] = (spentByCategory[cat] || 0) + exp.amount;
    });

    const categoryBreakdown = (budgets || []).map((b: { category: string; budgeted_amount: number }) => {
      const spent = spentByCategory[b.category] || 0;
      const budgeted = b.budgeted_amount;
      const utilization = budgeted > 0 ? (spent / budgeted) * 100 : 0;

      return {
        category: b.category,
        budgeted,
        spent,
        remaining: budgeted - spent,
        utilization: Math.round(utilization * 10) / 10,
      };
    });

    return NextResponse.json({
      grant,
      categoryBreakdown,
      totalBudget: (budgets || []).reduce((sum: number, b: { budgeted_amount: number }) => sum + b.budgeted_amount, 0),
      totalSpent: Object.values(spentByCategory).reduce((sum, v) => sum + v, 0),
      expenseCount: (expenses || []).length,
    }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    logger.error("Failed to fetch grant summary", err instanceof Error ? err : undefined);
    return NextResponse.json({ error: "Failed to fetch grant summary" }, { status: 500 });
  }
}

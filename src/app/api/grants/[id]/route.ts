import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { z } from "zod";
import { SF424A_CATEGORY_VALUES } from "@/lib/constants/categories";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/audit/log-activity";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";

const updateGrantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  funding_agency: z.string().min(1).max(255).optional(),
  cfda_number: z.string().max(20).nullable().optional(),
  award_number: z.string().max(100).nullable().optional(),
  award_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  total_amount: z.number().positive("Total amount must be greater than zero").optional(),
  budgets: z.record(z.enum(SF424A_CATEGORY_VALUES), z.number().min(0)).optional(),
}).refine(
  (data) => {
    if (data.period_start && data.period_end) {
      return new Date(data.period_end) > new Date(data.period_start);
    }
    return true;
  },
  { message: "Period end must be after period start", path: ["period_end"] }
);

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();

  const { data: grant, error } = await supabase
    .from("grants")
    .select("*")
    .eq("id", params.id)
    .eq("org_id", orgId)
    .single();

  if (error) return NextResponse.json({ error: "Grant not found" }, { status: 404 });

  const { data: budgets } = await supabase
    .from("grant_budgets")
    .select("*")
    .eq("grant_id", params.id)
    .order("category");

  return NextResponse.json({ ...grant, budgets: budgets || [] }, { headers: NO_CACHE_HEADERS });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId, userId, userEmail } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await requireActiveSubscription(orgId);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateGrantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { budgets, ...grantUpdates } = parsed.data;

  if (Object.keys(grantUpdates).length === 0 && !budgets) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Verify grant ownership before any updates (defense-in-depth for budget-only PATCH)
  const { data: grantCheck } = await supabase
    .from("grants")
    .select("id")
    .eq("id", params.id)
    .eq("org_id", orgId)
    .single();

  if (!grantCheck) {
    return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  }

  if (Object.keys(grantUpdates).length > 0) {
    const { error } = await supabase
      .from("grants")
      .update(grantUpdates)
      .eq("id", params.id)
      .eq("org_id", orgId);

    if (error) {
      logger.error("Failed to update grant", { error: error.message });
      return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
    }
  }

  if (budgets) {
    const budgetEntries = Object.entries(budgets);
    const updateResults = await Promise.all(
      budgetEntries.map(([category, amount]) =>
        supabase
          .from("grant_budgets")
          .update({ budgeted_amount: amount })
          .eq("grant_id", params.id)
          .eq("category", category)
      )
    );

    for (let i = 0; i < updateResults.length; i++) {
      if (updateResults[i].error) {
        logger.error("Failed to update budget", {
          grantId: params.id,
          category: budgetEntries[i][0],
          error: updateResults[i].error!.message,
        });
        return NextResponse.json(
          { error: `Failed to update budget for category: ${budgetEntries[i][0]}` },
          { status: 500 }
        );
      }
    }

    // Recalculate total from source of truth
    const { data: allBudgets } = await supabase
      .from("grant_budgets")
      .select("budgeted_amount")
      .eq("grant_id", params.id)
      .neq("category", "total");

    if (allBudgets) {
      const newTotal = allBudgets.reduce(
        (sum, b) => sum + ((b as { budgeted_amount: number }).budgeted_amount),
        0
      );
      const { error: totalError } = await supabase
        .from("grant_budgets")
        .update({ budgeted_amount: newTotal })
        .eq("grant_id", params.id)
        .eq("category", "total");

      if (totalError) {
        logger.error("Failed to update budget total", { grantId: params.id, error: totalError.message });
      }
    }
  }

  // Return updated grant
  const { data: grant, error: refetchError } = await supabase
    .from("grants")
    .select("*")
    .eq("id", params.id)
    .eq("org_id", orgId)
    .single();

  if (refetchError) {
    logger.error("Failed to refetch grant after update", { grantId: params.id, error: refetchError.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  const { data: updatedBudgets, error: budgetsError } = await supabase
    .from("grant_budgets")
    .select("*")
    .eq("grant_id", params.id)
    .order("category");

  if (budgetsError) {
    logger.error("Failed to refetch budgets after update", { grantId: params.id, error: budgetsError.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  logActivity({
    supabase,
    orgId,
    actorId: userId || "",
    actorEmail: userEmail || userId || "",
    action: "grant_updated",
    grantId: params.id,
  });

  return NextResponse.json({ ...grant, budgets: updatedBudgets || [] });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId, userId, userEmail } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const blocked = await requireActiveSubscription(orgId);
  if (blocked) return blocked;

  const supabase = await createServerClient();

  // DB has ON DELETE CASCADE for expenses and budgets
  const { data: deleted, error } = await supabase
    .from("grants")
    .delete()
    .eq("id", params.id)
    .eq("org_id", orgId)
    .select("id");

  if (error) {
    logger.error("Failed to delete grant", { error: error.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }
  if (!deleted || deleted.length === 0) return NextResponse.json({ error: "Grant not found" }, { status: 404 });

  logActivity({
    supabase,
    orgId,
    actorId: userId || "",
    actorEmail: userEmail || userId || "",
    action: "grant_deleted",
    grantId: params.id,
  });

  return new NextResponse(null, { status: 204 });
}

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { SF424A_CATEGORY_VALUES } from "@/lib/constants/categories";
import { logActivity } from "@/lib/audit/log-activity";

const updateExpenseSchema = z.object({
  confirmed_category: z.enum(SF424A_CATEGORY_VALUES).optional(),
  status: z.enum(["excluded", "pending_review"]).optional(),
});

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

  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const validatedBody = parsed.data;
  const updates: Record<string, unknown> = {};

  if (validatedBody.confirmed_category) {
    updates.confirmed_category = validatedBody.confirmed_category;
    updates.confirmed_by = userId;
    updates.confirmed_at = new Date().toISOString();
    updates.status = "confirmed";
  }

  if (validatedBody.status === "excluded") {
    updates.status = "excluded";
    updates.confirmed_by = userId;
    updates.confirmed_at = new Date().toISOString();
  }

  if (validatedBody.status === "pending_review") {
    updates.status = "pending_review";
    updates.confirmed_category = null;
    updates.confirmed_by = null;
    updates.confirmed_at = null;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", params.id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) {
    logger.error("Failed to update expense", { error: error.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  const expenseData = data as { grant_id?: string; status?: string };
  if (expenseData.status === "confirmed") {
    logActivity({
      supabase,
      orgId,
      actorId: userId || "",
      actorEmail: userEmail || userId || "",
      action: "expense_confirmed",
      expenseId: params.id,
      grantId: expenseData.grant_id,
    });
  } else if (expenseData.status === "excluded") {
    logActivity({
      supabase,
      orgId,
      actorId: userId || "",
      actorEmail: userEmail || userId || "",
      action: "expense_excluded",
      expenseId: params.id,
      grantId: expenseData.grant_id,
    });
  }

  return NextResponse.json(data);
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

  // Verify expense exists and belongs to this org
  const { data: expense } = await supabase
    .from("expenses")
    .select("id, grant_id")
    .eq("id", params.id)
    .eq("org_id", orgId)
    .single();

  if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

  const { error } = await supabase.from("expenses").delete().eq("id", params.id).eq("org_id", orgId);
  if (error) {
    logger.error("Failed to delete expense", { error: error.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  logActivity({
    supabase,
    orgId,
    actorId: userId || "",
    actorEmail: userEmail || userId || "",
    action: "expense_deleted",
    expenseId: params.id,
    grantId: expense.grant_id,
  });

  return new NextResponse(null, { status: 204 });
}

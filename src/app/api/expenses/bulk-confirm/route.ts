import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { SF424A_CATEGORY_VALUES } from "@/lib/constants/categories";
import { logActivity } from "@/lib/audit/log-activity";
import { createRateLimiter, rateLimitResponse } from "@/lib/api/rate-limit";
import { withRequestLogging } from "@/lib/api/with-logging";

const bulkConfirmSchema = z.object({
  grant_id: z.string().uuid(),
  filter: z.object({
    confidence: z.enum(["high", "medium", "low"]).optional(),
    category: z.enum(SF424A_CATEGORY_VALUES).optional(),
  }).optional(),
});

const limiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });

async function handlePost(request: Request) {
  const { orgId, userId, userEmail } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = limiter.check(orgId);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const blocked = await requireActiveSubscription(orgId);
  if (blocked) return blocked;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bulkConfirmSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { grant_id, filter } = parsed.data;

  const supabase = await createServerClient();

  // Verify grant belongs to this org
  const { data: grant } = await supabase
    .from("grants")
    .select("id")
    .eq("id", grant_id)
    .eq("org_id", orgId)
    .single();

  if (!grant) {
    return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  }

  // Fetch matching expenses
  let query = supabase
    .from("expenses")
    .select("id, ai_category, ai_confidence")
    .eq("grant_id", grant_id)
    .eq("org_id", orgId)
    .eq("status", "pending_review");

  if (filter?.confidence) {
    query = query.eq("ai_confidence", filter.confidence);
  }
  if (filter?.category) {
    query = query.eq("ai_category", filter.category);
  }

  const { data: expenses, error: fetchError } = await query;
  if (fetchError) {
    logger.error("Failed to fetch expenses for bulk confirm", { error: fetchError.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  if (!expenses?.length) {
    return NextResponse.json({ confirmed: 0 });
  }

  const now = new Date().toISOString();

  // Filter out expenses with null ai_category — they cannot be confirmed without a category
  const confirmable = expenses.filter((e) => e.ai_category != null);
  const skipped = expenses.length - confirmable.length;

  if (confirmable.length === 0) {
    return NextResponse.json({ confirmed: 0, failed: 0, skipped });
  }

  // Build a category map so each expense gets its AI category as confirmed
  // We need per-expense updates since each may have a different ai_category
  let confirmed = 0;
  let failed = 0;

  // Group expenses by ai_category for batch updates
  const byCategory: Record<string, string[]> = {};
  for (const expense of confirmable) {
    const cat = expense.ai_category!;
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(expense.id);
  }

  for (const [category, ids] of Object.entries(byCategory)) {
    const { error, count } = await supabase
      .from("expenses")
      .update({
        confirmed_category: category,
        confirmed_by: userId,
        confirmed_at: now,
        status: "confirmed",
      })
      .in("id", ids)
      .eq("org_id", orgId);

    if (error) {
      failed += ids.length;
    } else {
      confirmed += count ?? 0;
    }
  }

  logActivity({
    supabase,
    orgId,
    actorId: userId || "",
    actorEmail: userEmail || userId || "",
    action: "bulk_confirmed",
    grantId: grant_id,
    details: { count: confirmed },
  });

  return NextResponse.json({ confirmed, failed, skipped });
}

export const POST = withRequestLogging(handlePost);

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildCategorizationPrompt } from "@/lib/openai/prompts";
import { batchCategorize } from "@/lib/openai/batch-categorize";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { getExistingExternalIds } from "@/lib/expenses/dedup";
import { batchUpdateExpenseCategories } from "@/lib/expenses/batch-update-categories";
import { z } from "zod";
import { createHash } from "crypto";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/audit/log-activity";
import { createRateLimiter, rateLimitResponse } from "@/lib/api/rate-limit";
import { withRequestLogging } from "@/lib/api/with-logging";

const importExpensesSchema = z.object({
  grant_id: z.string().uuid(),
  expenses: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    vendor: z.string().min(1).max(500),
    description: z.string().max(2000),
    amount: z.number().positive("Amount must be positive").finite().max(1_000_000_000, "Amount exceeds maximum"),
    account: z.string().max(255).nullable().optional(),
    external_id: z.string().max(255).nullable().optional(),
  })).min(1).max(1000),
});

const limiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });

async function handlePost(request: Request) {
  const { orgId, userId, userEmail } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = limiter.check(orgId);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const blocked = await requireActiveSubscription(orgId);
  if (blocked) return blocked;

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > 5_000_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = importExpensesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { grant_id, expenses } = parsed.data;

  const supabase = await createServerClient();

  // Verify grant belongs to org
  const { data: grant } = await supabase
    .from("grants")
    .select("id, omb_framework")
    .eq("id", grant_id)
    .eq("org_id", orgId)
    .single();

  if (!grant) {
    return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  }

  // Compute deduplication hashes for CSV expenses
  const expenseRows = expenses.map((exp) => {
    const hashInput = `${exp.date}|${exp.vendor}|${exp.amount}|${exp.description}`;
    const externalId = exp.external_id || `csv_${createHash("sha256").update(hashInput).digest("hex").slice(0, 16)}`;
    return {
      org_id: orgId,
      grant_id,
      date: exp.date,
      vendor: exp.vendor,
      description: exp.description,
      amount: exp.amount,
      account: exp.account || null,
      external_id: externalId,
      source: "csv",
      status: "pending_review",
    };
  });

  // Deduplicate: check for existing expenses with matching external_ids in this grant
  const externalIds = expenseRows.map((r) => r.external_id).filter(Boolean) as string[];
  let existingIds: Set<string>;
  try {
    existingIds = await getExistingExternalIds(supabase, grant_id, orgId, externalIds);
  } catch {
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  const newExpenseRows = expenseRows.filter(
    (r) => !r.external_id || !existingIds.has(r.external_id)
  );

  if (newExpenseRows.length === 0) {
    return NextResponse.json({
      imported: 0,
      categorized: 0,
      duplicates_skipped: expenseRows.length,
    });
  }

  const { data: inserted, error } = await supabase
    .from("expenses")
    .insert(newExpenseRows)
    .select("id, vendor, description, amount, account");

  if (error) {
    logger.error("Failed to insert expenses", { error: error.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  // Load cost principles for AI categorization
  let categorizedCount = 0;
  let categorizationError = false;

  try {
    const adminClient = createAdminClient();
    const { data: costPrinciples, error: costPrinciplesError } = await adminClient
      .from("omb_cost_principles")
      .select("cfr_section, title, allowability, sf424a_category, conditions, keywords")
      .or(`framework.eq.both,framework.eq.${grant.omb_framework}`);

    if (costPrinciplesError) {
      logger.error("Failed to load cost principles for categorization", { error: costPrinciplesError.message });
    }

    const systemPrompt = buildCategorizationPrompt(
      costPrinciples || [],
      grant.omb_framework
    );

    // Run batch categorization
    const results = await batchCategorize(
      systemPrompt,
      inserted.map((e: { id: string; vendor: string; description: string; amount: number; account?: string | null }) => ({
        id: e.id,
        vendor: e.vendor,
        description: e.description,
        amount: e.amount,
        account: e.account,
      })),
      5
    );

    // Update expenses with AI results in batches of 50
    categorizedCount = await batchUpdateExpenseCategories(supabase, results, orgId);
  } catch (categorizationErr) {
    logger.error("Batch categorization failed", categorizationErr instanceof Error ? categorizationErr : undefined);
    categorizationError = true;
  }

  logActivity({
    supabase,
    orgId,
    actorId: userId || "",
    actorEmail: userEmail || userId || "",
    action: "expenses_imported",
    grantId: grant_id,
    details: { count: inserted.length },
  });

  return NextResponse.json({
    imported: inserted.length,
    categorized: categorizedCount,
    categorization_error: categorizationError,
  });
}

export const POST = withRequestLogging(handlePost);

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { SF424A_CATEGORIES } from "@/lib/constants/categories";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/audit/log-activity";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";
import { withRequestLogging } from "@/lib/api/with-logging";

const createGrantSchema = z.object({
  name: z.string().min(1).max(255),
  funding_agency: z.string().min(1).max(255),
  cfda_number: z.string().max(20).nullable().optional(),
  award_number: z.string().max(100).nullable().optional(),
  award_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  total_amount: z.number().positive("Total amount must be greater than zero"),
  budgets: z.record(z.string(), z.number().min(0)).optional(),
}).refine(
  (data) => new Date(data.period_end) > new Date(data.period_start),
  { message: "Period end must be after period start", path: ["period_end"] }
);

const GRANTS_SORTABLE_COLUMNS = ["name", "funding_agency", "total_amount", "period_start", "period_end", "created_at"] as const;

const grantsQuerySchema = z.object({
  sort: z.enum(GRANTS_SORTABLE_COLUMNS).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
});

async function handleGet(request: Request) {
  const { orgId } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const rawPage = parseInt(searchParams.get("page") || "1");
  const rawPageSize = parseInt(searchParams.get("pageSize") || "50");
  const page = Math.max(1, Math.min(isNaN(rawPage) ? 1 : rawPage, 1000));
  const pageSize = Math.max(1, Math.min(isNaN(rawPageSize) ? 50 : rawPageSize, 100));

  const parsed = grantsQuerySchema.safeParse({
    sort: searchParams.get("sort") || undefined,
    dir: searchParams.get("dir") || undefined,
  });

  const sortColumn = parsed.success && parsed.data.sort ? parsed.data.sort : "created_at";
  const sortAscending = parsed.success && parsed.data.dir === "asc";

  const supabase = await createServerClient();
  const { data, count, error } = await supabase
    .from("grants")
    .select("*", { count: "exact" })
    .eq("org_id", orgId)
    .order(sortColumn, { ascending: sortAscending })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    logger.error("Failed to fetch grants", { error: error.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  const total = count || 0;
  return NextResponse.json({
    grants: data,
    total,
    page,
    per_page: pageSize,
    total_pages: Math.ceil(total / pageSize),
  }, { headers: NO_CACHE_HEADERS });
}

export const GET = withRequestLogging(handleGet);

async function handlePost(request: Request) {
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

  const parsed = createGrantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    name, funding_agency, cfda_number, award_number,
    award_date, period_start, period_end, total_amount, budgets,
  } = parsed.data;

  const supabase = await createServerClient();

  // Create grant
  const { data: grant, error: grantError } = await supabase
    .from("grants")
    .insert({
      org_id: orgId,
      name,
      funding_agency,
      cfda_number: cfda_number || null,
      award_number: award_number || null,
      award_date,
      period_start,
      period_end,
      total_amount,
    })
    .select()
    .single();

  if (grantError) {
    logger.error("Failed to create grant", { error: grantError.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  // Create budget rows for all 10 SF-424A categories
  const budgetRows = SF424A_CATEGORIES.filter(c => c.value !== "total").map((cat) => ({
    grant_id: grant.id,
    category: cat.value,
    budgeted_amount: budgets?.[cat.value] || 0,
  }));

  // Add total row
  budgetRows.push({
    grant_id: grant.id,
    category: "total" as const,
    budgeted_amount: budgetRows.reduce((sum, b) => sum + b.budgeted_amount, 0),
  });

  const { error: budgetError } = await supabase
    .from("grant_budgets")
    .insert(budgetRows);

  if (budgetError) {
    // Rollback: delete the grant since budgets failed
    await supabase.from("grants").delete().eq("id", grant.id).eq("org_id", orgId);
    return NextResponse.json(
      { error: "Failed to create budget allocations. Grant was not created." },
      { status: 500 }
    );
  }

  logActivity({
    supabase,
    orgId,
    actorId: userId || "",
    actorEmail: userEmail || userId || "",
    action: "grant_created",
    grantId: grant.id,
    details: { grant_name: name },
  });

  return NextResponse.json(grant, { status: 201 });
}

export const POST = withRequestLogging(handlePost);

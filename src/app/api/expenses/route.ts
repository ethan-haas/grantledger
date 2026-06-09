import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { SF424A_CATEGORY_VALUES } from "@/lib/constants/categories";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";
import { withRequestLogging } from "@/lib/api/with-logging";

const SORTABLE_COLUMNS = ["date", "vendor", "amount", "ai_category", "ai_confidence", "status"] as const;

const expenseQuerySchema = z.object({
  grant_id: z.string().uuid().optional(),
  status: z.enum(["pending_review", "confirmed", "excluded"]).optional(),
  category: z.enum(SF424A_CATEGORY_VALUES).optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
  search: z.string().max(200).optional(),
  sort: z.enum(SORTABLE_COLUMNS).optional(),
  dir: z.enum(["asc", "desc"]).optional(),
  amount_min: z.coerce.number().min(0).optional(),
  amount_max: z.coerce.number().min(0).optional(),
  date_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

async function handleGet(request: Request) {
  const { orgId } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);

  const parsed = expenseQuerySchema.safeParse({
    grant_id: searchParams.get("grant_id") || undefined,
    status: searchParams.get("status") || undefined,
    category: searchParams.get("category") || undefined,
    confidence: searchParams.get("confidence") || undefined,
    search: searchParams.get("search") || undefined,
    sort: searchParams.get("sort") || undefined,
    dir: searchParams.get("dir") || undefined,
    amount_min: searchParams.get("amount_min") || undefined,
    amount_max: searchParams.get("amount_max") || undefined,
    date_start: searchParams.get("date_start") || undefined,
    date_end: searchParams.get("date_end") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const {
    grant_id, status, category, confidence, search, sort, dir,
    amount_min, amount_max, date_start, date_end,
  } = parsed.data;
  const rawPage = parseInt(searchParams.get("page") || "1");
  const rawPageSize = parseInt(searchParams.get("pageSize") || "50");
  const page = Math.max(1, Math.min(isNaN(rawPage) ? 1 : rawPage, 1000));
  const pageSize = Math.max(1, Math.min(isNaN(rawPageSize) ? 50 : rawPageSize, 100));

  const supabase = await createServerClient();

  // Verify grant belongs to this org when grant_id is provided
  if (grant_id) {
    const { data: grant } = await supabase
      .from("grants")
      .select("id")
      .eq("id", grant_id)
      .eq("org_id", orgId)
      .single();

    if (!grant) {
      return NextResponse.json({ error: "Grant not found" }, { status: 404 });
    }
  }

  let query = supabase
    .from("expenses")
    .select("*", { count: "exact" })
    .eq("org_id", orgId);

  if (grant_id) query = query.eq("grant_id", grant_id);
  if (status) query = query.eq("status", status);
  if (category) query = query.eq("ai_category", category);
  if (confidence) query = query.eq("ai_confidence", confidence);

  if (amount_min !== undefined) query = query.gte("amount", amount_min);
  if (amount_max !== undefined) query = query.lte("amount", amount_max);
  if (date_start) query = query.gte("date", date_start);
  if (date_end) query = query.lte("date", date_end);

  if (search) {
    const sanitized = search.replace(/%/g, "\\%").replace(/_/g, "\\_");
    query = query.or(`vendor.ilike.%${sanitized}%,description.ilike.%${sanitized}%`);
  }

  const sortColumn = sort || "date";
  const sortAscending = dir === "asc";
  query = query
    .order(sortColumn, { ascending: sortAscending })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, count, error } = await query;

  if (error) {
    logger.error("Failed to fetch expenses", { error: error.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pageSize);

  return NextResponse.json({
    expenses: data,
    total,
    page,
    per_page: pageSize,
    total_pages: totalPages,
  }, { headers: NO_CACHE_HEADERS });
}

export const GET = withRequestLogging(handleGet);

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/supabase/database.types";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";

const querySchema = z.object({
  grant_id: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).max(1000).optional().default(1),
  per_page: z.coerce.number().int().min(1).max(100).optional().default(20),
});

type ActivityRow = Database["public"]["Tables"]["activity_log"]["Row"];

export async function GET(request: NextRequest) {
  const { orgId, userId } = getAuthOrgId();
  if (!orgId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { grant_id, page, per_page } = parsed.data;
  const offset = (page - 1) * per_page;

  try {
    const supabase = await createServerClient();

    let query = supabase
      .from("activity_log")
      .select("*", { count: "exact" })
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .range(offset, offset + per_page - 1);

    if (grant_id) {
      query = query.eq("grant_id", grant_id);
    }

    const { data, error, count } = await query;

    if (error) {
      logger.error("Failed to fetch activity log", { orgId, error: error.message });
      return NextResponse.json({ error: "Failed to fetch activity log" }, { status: 500 });
    }

    const activities = (data ?? []) as ActivityRow[];

    return NextResponse.json({
      activities,
      total: count ?? 0,
      page,
      per_page,
      total_pages: Math.ceil((count ?? 0) / per_page),
    }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    logger.error("Activity route error", { error: String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

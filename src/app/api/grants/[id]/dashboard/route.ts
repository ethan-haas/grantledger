import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getBudgetVsActual } from "@/lib/queries/budget-actual";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";
import { withRequestLogging } from "@/lib/api/with-logging";

const dashboardQuerySchema = z.object({
  date_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  date_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  months: z.coerce.number().int().min(1).max(36).optional(),
});

async function handleGet(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = dashboardQuerySchema.safeParse({
    date_start: searchParams.get("date_start") || undefined,
    date_end: searchParams.get("date_end") || undefined,
    months: searchParams.get("months") || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const { date_start, date_end, months } = parsed.data;

  // Verify grant belongs to this org
  const supabase = await createServerClient();
  const { data: grant } = await supabase
    .from("grants")
    .select("id")
    .eq("id", params.id)
    .eq("org_id", orgId)
    .single();

  if (!grant) return NextResponse.json({ error: "Grant not found" }, { status: 404 });

  const dateRange = date_start || date_end
    ? { start: date_start || "1970-01-01", end: date_end || "2099-12-31" }
    : undefined;

  try {
    const data = await getBudgetVsActual(params.id, orgId, dateRange);
    if (!data) return NextResponse.json({ error: "Grant not found" }, { status: 404 });

    // Fetch monthly spending trends (confirmed expenses grouped by month)
    let trendQuery = supabase
      .from("expenses")
      .select("date, amount")
      .eq("grant_id", params.id)
      .eq("org_id", orgId)
      .eq("status", "confirmed")
      .order("date", { ascending: true });

    if (dateRange) {
      trendQuery = trendQuery.gte("date", dateRange.start).lte("date", dateRange.end);
    }

    const { data: trendExpenses } = await trendQuery;

    const monthlyMap: Record<string, number> = {};
    (trendExpenses || []).forEach((e: { date: string; amount: number }) => {
      const month = e.date.substring(0, 7); // YYYY-MM
      monthlyMap[month] = (monthlyMap[month] || 0) + e.amount;
    });

    const trendMonths = months || 6;
    const monthlySpending = Object.entries(monthlyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-trendMonths)
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        amount,
      }));

    return NextResponse.json({ ...data, monthlySpending }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    logger.error("Failed to fetch grant dashboard", err instanceof Error ? err : undefined);
    return NextResponse.json({ error: "Failed to fetch grant dashboard" }, { status: 500 });
  }
}

export const GET = withRequestLogging(handleGet as Parameters<typeof withRequestLogging>[0]);

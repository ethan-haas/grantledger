import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { GrantComplianceReport } from "@/lib/reports/pdf-generator";
import { generateExpenseCSV, generateBudgetSummaryCSV, generateMonthlyBreakdownCSV } from "@/lib/reports/csv-generator";
import { getBudgetVsActual } from "@/lib/queries/budget-actual";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import React from "react";
import { z } from "zod";
import type { Database } from "@/lib/supabase/database.types";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/audit/log-activity";
import { createRateLimiter, rateLimitResponse } from "@/lib/api/rate-limit";
import { trackServerEvent } from "@/lib/posthog-server";
import { withRequestLogging } from "@/lib/api/with-logging";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type GrantRow = Database["public"]["Tables"]["grants"]["Row"];

const flexibleDateSchema = z.string().refine(
  (val) => /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/.test(val),
  { message: "Must be a date (YYYY-MM-DD) or ISO 8601 datetime" }
);

const reportSchema = z.object({
  report_type: z.enum(["budget_summary", "monthly_breakdown", "expense_detail"]).default("budget_summary"),
  format: z.enum(["pdf", "csv"]).default("pdf"),
  date_start: flexibleDateSchema.optional(),
  date_end: flexibleDateSchema.optional(),
  include_pending: z.boolean().optional().default(false),
}).refine(
  (data) => {
    if (data.date_start && data.date_end) {
      return new Date(data.date_start) < new Date(data.date_end);
    }
    return true;
  },
  { message: "date_start must be before date_end", path: ["date_end"] }
);

const limiter = createRateLimiter({ max: 20, windowMs: 15 * 60 * 1000 });

async function handlePost(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId, userId, userEmail } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limit = limiter.check(orgId);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const blocked = await requireActiveSubscription(orgId);
  if (blocked) return blocked;

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = reportSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { report_type, format, date_start, date_end, include_pending } = parsed.data;

  const supabase = await createServerClient();

  // Fetch grant
  const { data: grant } = await supabase
    .from("grants")
    .select("*")
    .eq("id", params.id)
    .eq("org_id", orgId)
    .single();

  if (!grant) {
    return NextResponse.json({ error: "Grant not found" }, { status: 404 });
  }

  const typedGrant = grant as GrantRow;

  // Fetch expenses
  let query = supabase
    .from("expenses")
    .select("*")
    .eq("grant_id", params.id)
    .eq("org_id", orgId)
    .order("date", { ascending: true });

  if (!include_pending) {
    query = query.eq("status", "confirmed");
  } else {
    query = query.in("status", ["confirmed", "pending_review"]);
  }

  if (date_start) query = query.gte("date", date_start);
  if (date_end) query = query.lte("date", date_end);

  const { data: expenses, error: expensesError } = await query;

  if (expensesError) {
    logger.error("Failed to fetch expenses for report", { grantId: params.id, error: expensesError.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  if (!expenses?.length) {
    return NextResponse.json({ error: "No expenses to export" }, { status: 400 });
  }

  // Get budget data
  const dashboardData = await getBudgetVsActual(params.id, orgId);
  const budgetLines = dashboardData?.categories || [];

  const typedExpenses = (expenses || []) as ExpenseRow[];

  // Sanitize grant name for Content-Disposition header
  const safeName = typedGrant.name
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50) || "grant";

  if (format === "csv") {
    let csv: string;

    if (report_type === "monthly_breakdown") {
      const categories = budgetLines.map((l) => l.category);
      csv = generateMonthlyBreakdownCSV(typedExpenses, categories);
    } else if (report_type === "budget_summary") {
      csv = generateBudgetSummaryCSV(budgetLines);
    } else {
      csv = generateExpenseCSV(typedExpenses);
    }

    logActivity({
      supabase,
      orgId,
      actorId: userId || "",
      actorEmail: userEmail || userId || "",
      action: "report_generated",
      grantId: params.id,
      details: { format, report_type },
    });

    trackServerEvent(orgId, "report_generated", {
      grant_id: params.id,
      format,
      report_type,
    });

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="grantledger-${safeName}-${report_type}.csv"`,
      },
    });
  }

  // PDF format
  try {
    const reportElement = React.createElement(GrantComplianceReport, {
      grant: {
        name: typedGrant.name,
        funding_agency: typedGrant.funding_agency,
        cfda_number: typedGrant.cfda_number,
        award_number: typedGrant.award_number,
        period_start: typedGrant.period_start,
        period_end: typedGrant.period_end,
        omb_framework: typedGrant.omb_framework,
        total_amount: typedGrant.total_amount,
      },
      budgetLines,
      expenses: typedExpenses.map((e) => ({
        date: e.date,
        vendor: e.vendor,
        description: e.description,
        amount: e.amount,
        confirmed_category: e.confirmed_category || e.ai_category || "other",
        ai_confidence: e.ai_confidence,
        ai_cfr_citation: e.ai_cfr_citation,
        confirmed_by: e.confirmed_by,
        confirmed_at: e.confirmed_at,
      })),
      generatedAt: new Date().toISOString(),
    });

    const buffer = await renderToBuffer(reportElement as React.ReactElement);

    logActivity({
      supabase,
      orgId,
      actorId: userId || "",
      actorEmail: userEmail || userId || "",
      action: "report_generated",
      grantId: params.id,
      details: { format },
    });

    trackServerEvent(orgId, "report_generated", {
      grant_id: params.id,
      format,
      report_type,
    });

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="grantledger-${safeName}-report.pdf"`,
      },
    });
  } catch (err) {
    logger.error("Failed to generate PDF report", err instanceof Error ? err : undefined);
    return NextResponse.json({ error: "Failed to generate PDF report" }, { status: 500 });
  }
}

export const POST = withRequestLogging(handlePost as Parameters<typeof withRequestLogging>[0]);

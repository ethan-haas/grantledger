import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { createServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createRateLimiter, rateLimitResponse } from "@/lib/api/rate-limit";

const SAMPLE_GRANT = {
  name: "FY2025 Community Health Initiative",
  funding_agency: "Dept. of Health and Human Services",
  cfda_number: "93.224",
  award_number: "H80CS00001-01",
  award_date: "2025-01-15",
  period_start: "2025-02-01",
  period_end: "2026-01-31",
  total_amount: 250000,
  status: "active" as const,
};

const SAMPLE_BUDGETS = [
  { category: "personnel", budgeted_amount: 100000 },
  { category: "fringe_benefits", budgeted_amount: 30000 },
  { category: "travel", budgeted_amount: 8000 },
  { category: "equipment", budgeted_amount: 15000 },
  { category: "supplies", budgeted_amount: 12000 },
  { category: "contractual", budgeted_amount: 40000 },
  { category: "construction", budgeted_amount: 0 },
  { category: "other", budgeted_amount: 20000 },
  { category: "indirect_charges", budgeted_amount: 25000 },
  { category: "total", budgeted_amount: 250000 },
];

const SAMPLE_EXPENSES = [
  {
    date: "2025-03-01",
    vendor: "Jane Smith",
    description: "Program Director salary - March 2025",
    amount: 6500,
    ai_category: "personnel",
    ai_confidence: "high",
    ai_cfr_citation: "2 CFR 200.430",
    status: "pending_review",
  },
  {
    date: "2025-03-01",
    vendor: "ADP Payroll Services",
    description: "Payroll taxes and health insurance - March 2025",
    amount: 1950,
    ai_category: "fringe_benefits",
    ai_confidence: "high",
    ai_cfr_citation: "2 CFR 200.431",
    status: "pending_review",
  },
  {
    date: "2025-03-10",
    vendor: "Delta Airlines",
    description: "Conference travel to Washington DC for site visit",
    amount: 485,
    ai_category: "travel",
    ai_confidence: "high",
    ai_cfr_citation: "2 CFR 200.475",
    status: "pending_review",
  },
  {
    date: "2025-03-15",
    vendor: "Dell Technologies",
    description: "Laptop computer for outreach coordinator",
    amount: 1299,
    ai_category: "supplies",
    ai_confidence: "medium",
    ai_cfr_citation: "2 CFR 200.453",
    status: "pending_review",
  },
  {
    date: "2025-04-01",
    vendor: "Office Depot",
    description: "Printer paper, toner, and office supplies",
    amount: 215,
    ai_category: "supplies",
    ai_confidence: "high",
    ai_cfr_citation: "2 CFR 200.453",
    status: "pending_review",
  },
  {
    date: "2025-04-05",
    vendor: "Acme Consulting Group",
    description: "Program evaluation consultant - Phase 1",
    amount: 7500,
    ai_category: "contractual",
    ai_confidence: "high",
    ai_cfr_citation: "2 CFR 200.459",
    status: "pending_review",
  },
  {
    date: "2025-04-15",
    vendor: "Marriott Hotels",
    description: "Conference hotel for community health summit (3 nights)",
    amount: 675,
    ai_category: "travel",
    ai_confidence: "medium",
    ai_cfr_citation: "2 CFR 200.475",
    status: "pending_review",
  },
  {
    date: "2025-05-01",
    vendor: "Nonprofit Insurance Alliance",
    description: "General liability insurance premium - Q2",
    amount: 2400,
    ai_category: "other",
    ai_confidence: "medium",
    ai_cfr_citation: "2 CFR 200.447",
    status: "pending_review",
  },
];

const limiter = createRateLimiter({ max: 3, windowMs: 15 * 60 * 1000 });

export async function POST() {
  const { orgId } = getAuthOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = limiter.check(orgId);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const paywall = await requireActiveSubscription(orgId);
  if (paywall) return paywall;

  const supabase = await createServerClient();

  // Check if org already has grants
  const { data: existingGrants, error: checkError } = await supabase
    .from("grants")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);

  if (checkError) {
    logger.error("Failed to check existing grants", { orgId, error: checkError.message });
    return NextResponse.json({ error: "Failed to check existing grants" }, { status: 500 });
  }

  if (existingGrants && existingGrants.length > 0) {
    return NextResponse.json(
      { error: "Sample data is only available for new organizations" },
      { status: 409 }
    );
  }

  // Insert sample grant
  const { data: grant, error: grantError } = await supabase
    .from("grants")
    .insert({ ...SAMPLE_GRANT, org_id: orgId })
    .select("id")
    .single();

  if (grantError || !grant) {
    logger.error("Failed to create sample grant", { orgId, error: grantError?.message });
    return NextResponse.json({ error: "Failed to create sample grant" }, { status: 500 });
  }

  // Insert budgets
  const budgetRows = SAMPLE_BUDGETS.map((b) => ({
    grant_id: grant.id,
    ...b,
  }));

  const { error: budgetError } = await supabase
    .from("grant_budgets")
    .insert(budgetRows);

  if (budgetError) {
    logger.error("Failed to create sample budgets", { grantId: grant.id, error: budgetError.message });
    // Rollback grant
    await supabase.from("grants").delete().eq("id", grant.id).eq("org_id", orgId);
    return NextResponse.json({ error: "Failed to create sample data" }, { status: 500 });
  }

  // Insert expenses
  const expenseRows = SAMPLE_EXPENSES.map((e) => ({
    ...e,
    org_id: orgId,
    grant_id: grant.id,
    source: "csv" as const,
  }));

  const { error: expenseError } = await supabase
    .from("expenses")
    .insert(expenseRows);

  if (expenseError) {
    logger.error("Failed to create sample expenses", { grantId: grant.id, error: expenseError.message });
    // Rollback - cascade will handle budgets
    await supabase.from("grants").delete().eq("id", grant.id).eq("org_id", orgId);
    return NextResponse.json({ error: "Failed to create sample data" }, { status: 500 });
  }

  return NextResponse.json({ grant_id: grant.id });
}

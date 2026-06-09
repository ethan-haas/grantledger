import { NextRequest, NextResponse } from "next/server";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { createServerClient } from "@/lib/supabase/server";
import { sanitizeCsvValue } from "@/lib/csv/sanitize";

export async function POST(req: NextRequest) {
  const { orgId } = getAuthOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");
  const type = searchParams.get("type");

  if (format !== "csv") {
    return NextResponse.json({ error: "Only CSV format is supported" }, { status: 400 });
  }
  if (type !== "grants" && type !== "expenses") {
    return NextResponse.json({ error: "Type must be grants or expenses" }, { status: 400 });
  }

  const supabase = await createServerClient();

  if (type === "grants") {
    const { data: grants, error } = await supabase
      .from("grants")
      .select("id, name, funding_agency, cfda_number, award_number, award_date, period_start, period_end, total_amount, omb_framework")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch grants" }, { status: 500 });
    }

    const headers = ["ID", "Name", "Funding Agency", "CFDA Number", "Award Number", "Award Date", "Period Start", "Period End", "Total Amount", "OMB Framework"];
    const rows = (grants || []).map((g: Record<string, unknown>) => [
      g.id, g.name, g.funding_agency, g.cfda_number || "", g.award_number || "",
      g.award_date, g.period_start, g.period_end, g.total_amount, g.omb_framework,
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${sanitizeCsvValue(v).replace(/"/g, '""')}"`).join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="grantledger-grants-export.csv"`,
      },
    });
  }

  // type === "expenses"
  const { data: expenses, error } = await supabase
    .from("expenses")
    .select("id, grant_id, vendor, description, amount, date, ai_category, ai_confidence, ai_cfr_citation, confirmed_category, status, confirmed_by, confirmed_at")
    .eq("org_id", orgId)
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }

  const headers = ["ID", "Grant ID", "Vendor", "Description", "Amount", "Date", "AI Category", "AI Confidence", "AI CFR Citation", "Confirmed Category", "Status", "Confirmed By", "Confirmed At"];
  const rows = (expenses || []).map((e: Record<string, unknown>) => [
    e.id, e.grant_id, e.vendor || "", e.description || "", e.amount, e.date,
    e.ai_category || "", e.ai_confidence || "", e.ai_cfr_citation || "",
    e.confirmed_category || "", e.status, e.confirmed_by || "", e.confirmed_at || "",
  ]);

  const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${sanitizeCsvValue(v).replace(/"/g, '""')}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="grantledger-expenses-export.csv"`,
    },
  });
}

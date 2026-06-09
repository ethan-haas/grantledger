import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";

interface FormattedInvoice {
  id: string;
  date: string;
  amount: number;
  status: string;
  pdfUrl: string | null;
}

export async function GET() {
  const { orgId } = getAuthOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = await createServerClient();
    const { data: org } = await supabase
      .from("organizations")
      .select("stripe_customer_id")
      .eq("id", orgId)
      .single();

    if (!org?.stripe_customer_id) {
      return NextResponse.json({ invoices: [] });
    }

    // Dynamic import to avoid loading Stripe on non-billing routes
    const { stripe } = await import("@/lib/stripe");

    const invoiceList = await stripe.invoices.list({
      customer: org.stripe_customer_id,
      limit: 10,
    });

    const invoices: FormattedInvoice[] = invoiceList.data.map((inv) => ({
      id: inv.id,
      date: inv.created ? new Date(inv.created * 1000).toISOString() : "",
      amount: (inv.amount_paid || 0) / 100,
      status: inv.status || "unknown",
      pdfUrl: inv.invoice_pdf || null,
    }));

    return NextResponse.json({ invoices }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    logger.error("Failed to fetch invoices", {
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

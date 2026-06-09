import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";

export async function GET() {
  const { orgId } = getAuthOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("accounting_connections")
    .select("id, provider, status, last_synced_at, error_message, created_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to fetch connections", { error: error.message });
    return NextResponse.json({ error: "An internal error occurred" }, { status: 500 });
  }

  return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
}

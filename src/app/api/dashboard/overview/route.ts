import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { getOverviewMetrics } from "@/lib/queries/budget-actual";
import { logger } from "@/lib/logger";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";
import { withRequestLogging } from "@/lib/api/with-logging";

async function handleGet() {
  const { orgId } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const data = await getOverviewMetrics(orgId);
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    logger.error("Failed to fetch overview metrics", err instanceof Error ? err : undefined);
    return NextResponse.json({ error: "Failed to fetch overview metrics" }, { status: 500 });
  }
}

export const GET = withRequestLogging(handleGet);

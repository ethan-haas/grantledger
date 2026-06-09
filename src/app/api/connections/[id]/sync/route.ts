import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { syncConnection } from "@/lib/integrations/sync-manager";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { createRateLimiter, rateLimitResponse } from "@/lib/api/rate-limit";
import { trackServerEvent } from "@/lib/posthog-server";

const syncSchema = z.object({
  grant_id: z.string().uuid(),
});

const limiter = createRateLimiter({ max: 5, windowMs: 15 * 60 * 1000 });

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId } = getAuthOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = limiter.check(orgId);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const blocked = await requireActiveSubscription(orgId);
  if (blocked) return blocked;

  const connectionId = params.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { grant_id } = parsed.data;

  // Verify the connection belongs to this org
  const supabase = await createServerClient();

  const { data: connection, error: connError } = await supabase
    .from("accounting_connections")
    .select("id, org_id, status")
    .eq("id", connectionId)
    .eq("org_id", orgId)
    .single();

  if (connError || !connection) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  if (connection.status !== "connected") {
    return NextResponse.json(
      { error: "Connection is not active. Please reconnect." },
      { status: 400 }
    );
  }

  // Verify the grant belongs to this org
  const { data: grant } = await supabase
    .from("grants")
    .select("id")
    .eq("id", grant_id)
    .eq("org_id", orgId)
    .single();

  if (!grant) {
    return NextResponse.json(
      { error: "Grant not found" },
      { status: 404 }
    );
  }

  try {
    const result = await syncConnection(connectionId, grant_id, orgId);

    trackServerEvent(orgId, "connection_synced", {
      connection_id: connectionId,
      synced: result.synced,
      categorized: result.categorized,
    });

    return NextResponse.json({
      synced: result.synced,
      categorized: result.categorized,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Sync failed";

    // Persist error message on the connection so users see why it failed
    try {
      await supabase
        .from("accounting_connections")
        .update({ status: "error", error_message: message })
        .eq("id", connectionId)
        .eq("org_id", orgId);
    } catch (statusErr) {
      logger.error("Failed to persist error status on connection", {
        connectionId,
        error: statusErr instanceof Error ? statusErr.message : String(statusErr),
      });
    }

    logger.error("Sync failed", { connectionId, error: message });
    return NextResponse.json({ error: "Sync failed. Please try again." }, { status: 500 });
  }
}

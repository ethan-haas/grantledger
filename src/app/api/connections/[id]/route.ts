import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/auth/api-guard";
import { logger } from "@/lib/logger";

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId } = getAuthOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocked = await requireActiveSubscription(orgId);
  if (blocked) return blocked;

  const connectionId = params.id;
  const supabase = await createServerClient();

  // Verify the connection belongs to this org (defense-in-depth alongside RLS)
  const { data: connection, error: connError } = await supabase
    .from("accounting_connections")
    .select("id, provider")
    .eq("id", connectionId)
    .eq("org_id", orgId)
    .single();

  if (connError || !connection) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  // Soft-delete: update status to disconnected and clear tokens
  const { error: updateError } = await supabase
    .from("accounting_connections")
    .update({
      status: "disconnected",
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      token_expires_at: null,
      error_message: null,
    })
    .eq("id", connectionId)
    .eq("org_id", orgId);

  if (updateError) {
    logger.error("Failed to disconnect connection", { error: updateError.message });
    return NextResponse.json(
      { error: "An internal error occurred" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    message: `${connection.provider} disconnected successfully`,
  });
}

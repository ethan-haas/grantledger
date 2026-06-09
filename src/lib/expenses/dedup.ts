import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Queries the database for existing expenses with matching external_ids
 * within a specific grant and organization.
 *
 * Throws on query error to abort the calling operation (import/sync)
 * rather than silently inserting duplicates.
 */
export async function getExistingExternalIds(
  supabase: SupabaseClient,
  grantId: string,
  orgId: string,
  externalIds: string[]
): Promise<Set<string>> {
  if (externalIds.length === 0) {
    return new Set();
  }

  const { data: existing, error } = await supabase
    .from("expenses")
    .select("external_id")
    .eq("grant_id", grantId)
    .eq("org_id", orgId)
    .in("external_id", externalIds);

  if (error) {
    logger.error("Dedup query failed", { grantId, error: error.message });
    throw new Error("Failed to check for duplicate expenses");
  }

  return new Set(
    (existing || []).map((e: { external_id: string }) => e.external_id)
  );
}

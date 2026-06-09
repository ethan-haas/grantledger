import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

interface CategorizationResult {
  id: string;
  result: {
    category: string;
    confidence: string;
    cfr_citation: string;
  };
}

/**
 * Updates expenses with AI categorization results in batches of 50.
 * Logs failed update IDs but does not throw — expenses are already
 * inserted at this point and partial categorization is acceptable.
 */
export async function batchUpdateExpenseCategories(
  supabase: SupabaseClient,
  results: CategorizationResult[],
  orgId: string
): Promise<number> {
  if (results.length === 0) {
    return 0;
  }

  const BATCH_SIZE = 50;
  for (let i = 0; i < results.length; i += BATCH_SIZE) {
    const batch = results.slice(i, i + BATCH_SIZE);
    const updateResults = await Promise.all(
      batch.map(({ id, result }) =>
        supabase
          .from("expenses")
          .update({
            ai_category: result.category,
            ai_confidence: result.confidence,
            ai_cfr_citation: result.cfr_citation,
          })
          .eq("id", id)
          .eq("org_id", orgId)
          .then((res) => ({ id, error: res.error }))
      )
    );

    const failed = updateResults.filter((r) => r.error);
    if (failed.length > 0) {
      logger.error("Failed to update AI categorization on expenses", {
        failedIds: failed.map((f) => f.id),
        error_count: failed.length,
      });
    }
  }

  return results.length;
}

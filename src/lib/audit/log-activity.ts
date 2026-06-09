import { logger } from "@/lib/logger";
import type { ActivityAction, Json } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

interface LogActivityParams {
  supabase: SupabaseClient;
  orgId: string;
  actorId: string;
  actorEmail: string;
  action: ActivityAction;
  grantId?: string | null;
  expenseId?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Fire-and-forget activity logging. Never throws — failures are logged
 * but do not interrupt the parent operation.
 */
export function logActivity(params: LogActivityParams): void {
  const { supabase, orgId, actorId, actorEmail, action, grantId, expenseId, details } = params;

  Promise.resolve(
    supabase
      .from("activity_log")
      .insert({
        org_id: orgId,
        actor_id: actorId,
        actor_email: actorEmail,
        action,
        grant_id: grantId ?? null,
        expense_id: expenseId ?? null,
        details: (details ?? {}) as Json,
      })
  )
    .then(({ error }) => {
      if (error) {
        logger.error("Failed to log activity", { action, orgId, error: error.message });
      }
    })
    .catch((err: unknown) => {
      logger.error("Activity log insert threw", { action, orgId, error: String(err) });
    });
}

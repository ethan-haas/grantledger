import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

// Admin client uses service role key — bypasses RLS
// Note: Database generic omitted; see server.ts comment for rationale.
export function createAdminClient() {
  const env = getServerEnv();
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
}

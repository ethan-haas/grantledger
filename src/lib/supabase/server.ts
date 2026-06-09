import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { logger } from "@/lib/logger";
import { getServerEnv } from "@/lib/env";

// Note: Database generic is intentionally omitted due to Supabase client
// inference issues with chained queries (produces `never` types). Types are
// applied at query sites using explicit annotations from database.types.ts.
export async function createServerClient() {
  const { getToken } = await auth();
  const env = getServerEnv();

  let supabaseToken: string | null = null;
  try {
    supabaseToken = await getToken({ template: "supabase" });
  } catch {
    if (process.env.NODE_ENV !== "development") {
      throw new Error("Clerk JWT template 'supabase' is required in production. Configure it in Clerk Dashboard → JWT Templates.");
    }
    logger.warn("Clerk JWT template 'supabase' not found — using service role key (dev only).");
  }

  // If we have a Clerk-signed Supabase token, use anon key + token (RLS active).
  // Otherwise fall back to service role key (bypasses RLS, relies on app-level org_id checks).
  if (supabaseToken) {
    return createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        global: {
          headers: {
            Authorization: `Bearer ${supabaseToken}`,
          },
        },
      }
    );
  }

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
}

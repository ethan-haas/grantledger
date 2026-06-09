import { NextRequest, NextResponse } from "next/server";
import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { createServerClient } from "@/lib/supabase/server";
import { z } from "zod";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";

const notificationSchema = z.object({
  notify_weekly_digest: z.boolean().optional(),
  notify_trial_reminders: z.boolean().optional(),
  notify_budget_alerts: z.boolean().optional(),
}).refine(
  (data) => Object.values(data).some((v) => v !== undefined),
  { message: "At least one notification preference must be provided" }
);

export async function GET() {
  const { orgId } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("notify_weekly_digest, notify_trial_reminders, notify_budget_alerts")
    .eq("id", orgId)
    .single();

  if (error) return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
}

export async function PATCH(req: NextRequest) {
  const { orgId } = getAuthOrgId();
  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = notificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const updates: Record<string, boolean> = {};
  if (parsed.data.notify_weekly_digest !== undefined) updates.notify_weekly_digest = parsed.data.notify_weekly_digest;
  if (parsed.data.notify_trial_reminders !== undefined) updates.notify_trial_reminders = parsed.data.notify_trial_reminders;
  if (parsed.data.notify_budget_alerts !== undefined) updates.notify_budget_alerts = parsed.data.notify_budget_alerts;

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", orgId);

  if (error) return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
  return NextResponse.json({ success: true });
}

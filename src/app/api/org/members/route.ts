import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { NO_CACHE_HEADERS } from "@/lib/api/headers";
import { fetchOrgMembers, createOrgInvitation } from "@/lib/integrations/clerk-admin";
import { logActivity } from "@/lib/audit/log-activity";
import { createAdminClient } from "@/lib/supabase/admin";
import { createRateLimiter, rateLimitResponse } from "@/lib/api/rate-limit";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "member"]),
});

export interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "active" | "pending";
  avatarUrl: string | null;
  joinedAt: string;
}

export async function GET() {
  const { orgId } = getAuthOrgId();
  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkMembers = await fetchOrgMembers(orgId);

  const members: OrgMember[] = clerkMembers.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    status: m.status,
    avatarUrl: m.avatarUrl,
    joinedAt: m.joinedAt,
  }));

  return NextResponse.json({
    members,
    total: members.length,
  }, { headers: NO_CACHE_HEADERS });
}

const limiter = createRateLimiter({ max: 10, windowMs: 15 * 60 * 1000 });

export async function POST(request: Request) {
  const { orgId, userId, userEmail } = getAuthOrgId();
  if (!orgId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = limiter.check(orgId);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, role } = parsed.data;

  const result = await createOrgInvitation(orgId, email, role, userId);

  if (!result.success) {
    if (result.error === "already_member") {
      return NextResponse.json(
        { error: "User is already a member of this organization" },
        { status: 409 }
      );
    }
    logger.error("Failed to create invitation", { orgId, email, error: result.error });
    return NextResponse.json(
      { error: result.error ?? "Failed to send invitation" },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();
  logActivity({
    supabase,
    orgId,
    actorId: userId,
    actorEmail: userEmail ?? userId,
    action: "member_invited",
    details: { email, role },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}

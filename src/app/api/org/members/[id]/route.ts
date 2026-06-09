import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { updateMemberRole, removeMember, resendInvitation } from "@/lib/integrations/clerk-admin";
import { logActivity } from "@/lib/audit/log-activity";
import { createAdminClient } from "@/lib/supabase/admin";

const roleUpdateSchema = z.object({
  role: z.enum(["admin", "member"]),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId, userId, userEmail } = getAuthOrgId();
  if (!orgId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = params.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = roleUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { role } = parsed.data;

  const result = await updateMemberRole(orgId, memberId, role);
  if (!result.success) {
    logger.error("Failed to update member role", { orgId, memberId, error: result.error });
    return NextResponse.json(
      { error: result.error ?? "Failed to update role" },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();
  logActivity({
    supabase,
    orgId,
    actorId: userId,
    actorEmail: userEmail ?? userId,
    action: "member_role_changed",
    details: { memberId, newRole: role },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId, userId, userEmail } = getAuthOrgId();
  if (!orgId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberId = params.id;

  const result = await removeMember(orgId, memberId);
  if (!result.success) {
    logger.error("Failed to remove member", { orgId, memberId, error: result.error });
    return NextResponse.json(
      { error: result.error ?? "Failed to remove member" },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();
  logActivity({
    supabase,
    orgId,
    actorId: userId,
    actorEmail: userEmail ?? userId,
    action: "member_removed",
    details: { memberId },
  });

  return NextResponse.json({ success: true });
}

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { orgId, userId, userEmail } = getAuthOrgId();
  if (!orgId || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invitationId = params.id;

  const result = await resendInvitation(orgId, invitationId, userId);
  if (!result.success) {
    logger.error("Failed to resend invitation", { orgId, invitationId, error: result.error });
    return NextResponse.json(
      { error: result.error ?? "Failed to resend invitation" },
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
    details: { invitationId, action: "resend" },
  });

  return NextResponse.json({ success: true });
}

import { auth } from "@clerk/nextjs/server";

/**
 * Get orgId from Clerk auth(), compatible with both JWT v1 and v2 formats.
 *
 * Clerk v2 JWTs store org info under `sessionClaims.o.id` (short keys),
 * while v1 uses `org_id` at the top level. @clerk/nextjs@5.x only parses v1,
 * so auth().orgId is undefined with v2 tokens. This helper handles both.
 */
export function getAuthOrgId(): { orgId: string | null; userId: string | null; userEmail: string | null } {
  const authObj = auth();
  let orgId = authObj.orgId ?? null;

  // Fallback: extract from v2 JWT claims
  if (!orgId && authObj.sessionClaims) {
    const claims = authObj.sessionClaims as Record<string, unknown>;
    const o = claims.o as { id?: string } | undefined;
    if (o?.id) {
      orgId = o.id;
    }
  }

  // Extract email from session claims
  const email = (authObj.sessionClaims?.email as string) ?? null;

  return { orgId, userId: authObj.userId, userEmail: email };
}

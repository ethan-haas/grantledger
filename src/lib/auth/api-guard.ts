import { NextResponse } from "next/server";
import { checkAccess } from "./gate";

/**
 * Server-side subscription guard for mutating API routes.
 * Returns a 403 response if the org is blocked, or null if access is allowed.
 */
export async function requireActiveSubscription(
  orgId: string
): Promise<NextResponse | null> {
  const access = await checkAccess(orgId);

  if (access.level === "blocked") {
    return NextResponse.json(
      {
        error: "Subscription required",
        reason: access.reason,
      },
      { status: 403 }
    );
  }

  if (access.level === "read_only") {
    return NextResponse.json(
      {
        error: "Account is read-only",
        reason: access.reason,
      },
      { status: 403 }
    );
  }

  return null;
}

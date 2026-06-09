import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { getServerEnv } from "@/lib/env";

/**
 * Verifies the CRON_SECRET header on cron routes.
 * Returns a 401 response if invalid, or null if authorized.
 */
export function verifyCronSecret(request: Request): NextResponse | null {
  const secret = getServerEnv().CRON_SECRET;

  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${secret}`;

  if (
    !authHeader ||
    authHeader.length !== expected.length ||
    !timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

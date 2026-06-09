import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { getXeroAuthUrl } from "@/lib/integrations/xero/auth";

export async function GET() {
  const { orgId } = getAuthOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authUrl = getXeroAuthUrl(orgId);
  return NextResponse.redirect(authUrl);
}

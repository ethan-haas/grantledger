import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { NextResponse } from "next/server";
import { getQBOAuthUrl } from "@/lib/integrations/quickbooks/auth";

export async function GET() {
  const { orgId } = getAuthOrgId();

  if (!orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authUrl = getQBOAuthUrl(orgId);
  return NextResponse.redirect(authUrl);
}

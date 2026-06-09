import { fetchWithTimeout } from "./fetch-timeout";
import { getServerEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

interface ClerkMembership {
  id: string;
  role: string;
  created_at: number;
  public_user_data?: { user_id?: string };
}

interface ClerkMembershipResponse {
  data?: ClerkMembership[];
  total_count?: number;
}

interface ClerkUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  email_addresses?: { email_address: string }[];
}

interface ClerkInvitation {
  id: string;
  email_address: string;
  role: string;
  status: string;
  created_at: number;
}

interface ClerkInvitationResponse {
  data?: ClerkInvitation[];
  total_count?: number;
}

export interface OrgMemberResult {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "active" | "pending";
  avatarUrl: string | null;
  joinedAt: string;
}

const CLERK_API = "https://api.clerk.com/v1";

function clerkHeaders(): Record<string, string> {
  return { Authorization: `Bearer ${getServerEnv().CLERK_SECRET_KEY}` };
}

function mapClerkRole(clerkRole: string): "admin" | "member" {
  return clerkRole === "org:admin" ? "admin" : "member";
}

function toClerkRole(role: string): string {
  return role === "admin" ? "org:admin" : "org:member";
}

/**
 * Fetches primary email addresses of all org:admin members for a given Clerk org.
 * Returns an empty array on error (logged internally).
 */
export async function fetchOrgAdminEmails(orgId: string): Promise<string[]> {
  const headers = clerkHeaders();

  let memberships: ClerkMembershipResponse;
  try {
    const res = await fetchWithTimeout(
      `${CLERK_API}/organizations/${orgId}/memberships?limit=100`,
      { headers }
    );

    if (!res.ok) {
      logger.error("Clerk membership fetch failed", { orgId, status: res.status });
      return [];
    }

    const ct = res.headers.get("content-type");
    if (!ct?.includes("application/json")) {
      logger.error("Clerk membership response not JSON", { orgId, contentType: ct });
      return [];
    }

    memberships = await res.json();
  } catch (err) {
    logger.error("Clerk membership fetch error", err instanceof Error ? err : undefined);
    return [];
  }

  if (memberships.total_count && memberships.total_count > 100) {
    logger.warn("Org has more than 100 members; some admins may be missed", {
      orgId,
      total_count: memberships.total_count,
    });
  }

  const admins = (memberships.data || []).filter((m) => m.role === "org:admin");
  const emails: string[] = [];

  for (const admin of admins) {
    const userId = admin.public_user_data?.user_id;
    if (!userId) continue;

    try {
      const userRes = await fetchWithTimeout(
        `${CLERK_API}/users/${userId}`,
        { headers }
      );

      if (!userRes.ok) {
        logger.error("Clerk user fetch failed", { userId, status: userRes.status });
        continue;
      }

      const userCt = userRes.headers.get("content-type");
      if (!userCt?.includes("application/json")) {
        logger.error("Clerk user response not JSON", { userId, contentType: userCt });
        continue;
      }

      const user = await userRes.json();
      const email = user.email_addresses?.[0]?.email_address;
      if (email) {
        emails.push(email);
      }
    } catch (err) {
      logger.error("Clerk user fetch error", err instanceof Error ? err : undefined);
    }
  }

  return emails;
}

/**
 * Fetches all org members (active memberships + pending invitations).
 * Returns empty array on error (graceful degradation).
 */
export async function fetchOrgMembers(orgId: string): Promise<OrgMemberResult[]> {
  const headers = clerkHeaders();
  const members: OrgMemberResult[] = [];

  // Fetch active memberships
  let memberships: ClerkMembershipResponse;
  try {
    const res = await fetchWithTimeout(
      `${CLERK_API}/organizations/${orgId}/memberships?limit=100`,
      { headers }
    );
    if (!res.ok) {
      logger.error("Clerk membership fetch failed", { orgId, status: res.status });
      return [];
    }
    const ct = res.headers.get("content-type");
    if (!ct?.includes("application/json")) {
      logger.error("Clerk membership response not JSON", { orgId, contentType: ct });
      return [];
    }
    memberships = await res.json();
  } catch (err) {
    logger.error("Clerk membership fetch error", err instanceof Error ? err : undefined);
    return [];
  }

  // Resolve user details for each membership
  for (const m of memberships.data || []) {
    const userId = m.public_user_data?.user_id;
    if (!userId) continue;

    try {
      const userRes = await fetchWithTimeout(
        `${CLERK_API}/users/${userId}`,
        { headers }
      );
      if (!userRes.ok) {
        logger.error("Clerk user fetch failed", { userId, status: userRes.status });
        continue;
      }
      const userCt = userRes.headers.get("content-type");
      if (!userCt?.includes("application/json")) continue;

      const user: ClerkUser = await userRes.json();
      const name = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Unknown";
      const email = user.email_addresses?.[0]?.email_address ?? "";

      members.push({
        id: m.id,
        name,
        email,
        role: mapClerkRole(m.role),
        status: "active",
        avatarUrl: user.image_url ?? null,
        joinedAt: new Date(m.created_at).toISOString(),
      });
    } catch (err) {
      logger.error("Clerk user fetch error", err instanceof Error ? err : undefined);
    }
  }

  // Fetch pending invitations
  try {
    const invRes = await fetchWithTimeout(
      `${CLERK_API}/organizations/${orgId}/invitations?status=pending&limit=100`,
      { headers }
    );
    if (invRes.ok) {
      const invCt = invRes.headers.get("content-type");
      if (invCt?.includes("application/json")) {
        const invitations: ClerkInvitationResponse = await invRes.json();
        for (const inv of invitations.data || []) {
          members.push({
            id: inv.id,
            name: inv.email_address,
            email: inv.email_address,
            role: mapClerkRole(inv.role),
            status: "pending",
            avatarUrl: null,
            joinedAt: new Date(inv.created_at).toISOString(),
          });
        }
      }
    }
  } catch (err) {
    logger.error("Clerk invitation fetch error", err instanceof Error ? err : undefined);
  }

  return members;
}

/**
 * Creates an org invitation via Clerk API.
 */
export async function createOrgInvitation(
  orgId: string,
  email: string,
  role: string,
  inviterUserId: string
): Promise<{ success: boolean; error?: string }> {
  const headers = clerkHeaders();

  try {
    const res = await fetchWithTimeout(
      `${CLERK_API}/organizations/${orgId}/invitations`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          email_address: email,
          role: toClerkRole(role),
          inviter_user_id: inviterUserId,
        }),
      }
    );

    if (!res.ok) {
      const ct = res.headers.get("content-type");
      if (ct?.includes("application/json")) {
        const body = await res.json();
        const msg = body.errors?.[0]?.message ?? "Invitation failed";
        // Clerk returns 422 when user is already a member
        if (res.status === 422) {
          return { success: false, error: "already_member" };
        }
        return { success: false, error: msg };
      }
      return { success: false, error: `Clerk API returned ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    logger.error("Clerk invitation create error", err instanceof Error ? err : undefined);
    return { success: false, error: "Failed to create invitation" };
  }
}

/**
 * Updates a member's role in the organization.
 */
export async function updateMemberRole(
  orgId: string,
  membershipId: string,
  role: string
): Promise<{ success: boolean; error?: string }> {
  const headers = clerkHeaders();

  try {
    const res = await fetchWithTimeout(
      `${CLERK_API}/organizations/${orgId}/memberships/${membershipId}`,
      {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ role: toClerkRole(role) }),
      }
    );

    if (!res.ok) {
      logger.error("Clerk role update failed", { orgId, membershipId, status: res.status });
      return { success: false, error: `Clerk API returned ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    logger.error("Clerk role update error", err instanceof Error ? err : undefined);
    return { success: false, error: "Failed to update role" };
  }
}

/**
 * Removes a member from the organization.
 */
export async function removeMember(
  orgId: string,
  membershipId: string
): Promise<{ success: boolean; error?: string }> {
  const headers = clerkHeaders();

  try {
    const res = await fetchWithTimeout(
      `${CLERK_API}/organizations/${orgId}/memberships/${membershipId}`,
      { method: "DELETE", headers }
    );

    if (!res.ok) {
      logger.error("Clerk member removal failed", { orgId, membershipId, status: res.status });
      return { success: false, error: `Clerk API returned ${res.status}` };
    }

    return { success: true };
  } catch (err) {
    logger.error("Clerk member removal error", err instanceof Error ? err : undefined);
    return { success: false, error: "Failed to remove member" };
  }
}

/**
 * Resends an invitation by revoking the existing one and creating a new one.
 * Clerk doesn't have a native resend API, so we revoke + recreate.
 */
export async function resendInvitation(
  orgId: string,
  invitationId: string,
  inviterUserId: string
): Promise<{ success: boolean; error?: string }> {
  const headers = clerkHeaders();

  // 1. Get the existing invitation to know the email/role
  let email: string;
  let role: string;
  try {
    const getRes = await fetchWithTimeout(
      `${CLERK_API}/organizations/${orgId}/invitations?status=pending&limit=100`,
      { headers }
    );
    if (!getRes.ok) {
      return { success: false, error: "Failed to fetch invitations" };
    }
    const ct = getRes.headers.get("content-type");
    if (!ct?.includes("application/json")) {
      return { success: false, error: "Invalid response from Clerk" };
    }
    const data: ClerkInvitationResponse = await getRes.json();
    const invitation = (data.data || []).find((inv) => inv.id === invitationId);
    if (!invitation) {
      return { success: false, error: "Invitation not found" };
    }
    email = invitation.email_address;
    role = invitation.role;
  } catch (err) {
    logger.error("Clerk invitation fetch error", err instanceof Error ? err : undefined);
    return { success: false, error: "Failed to fetch invitation details" };
  }

  // 2. Revoke the existing invitation
  try {
    const revokeRes = await fetchWithTimeout(
      `${CLERK_API}/organizations/${orgId}/invitations/${invitationId}/revoke`,
      { method: "POST", headers }
    );
    if (!revokeRes.ok) {
      logger.error("Clerk invitation revoke failed", { orgId, invitationId, status: revokeRes.status });
      return { success: false, error: "Failed to revoke old invitation" };
    }
  } catch (err) {
    logger.error("Clerk invitation revoke error", err instanceof Error ? err : undefined);
    return { success: false, error: "Failed to revoke old invitation" };
  }

  // 3. Create a new invitation with the same email/role
  try {
    const createRes = await fetchWithTimeout(
      `${CLERK_API}/organizations/${orgId}/invitations`,
      {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          email_address: email,
          role,
          inviter_user_id: inviterUserId,
        }),
      }
    );
    if (!createRes.ok) {
      return { success: false, error: "Failed to recreate invitation" };
    }
    return { success: true };
  } catch (err) {
    logger.error("Clerk invitation recreate error", err instanceof Error ? err : undefined);
    return { success: false, error: "Failed to recreate invitation" };
  }
}

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./fetch-timeout", () => ({
  fetchWithTimeout: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ CLERK_SECRET_KEY: "sk_test_clerk" }),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import {
  fetchOrgAdminEmails,
  fetchOrgMembers,
  createOrgInvitation,
  updateMemberRole,
  removeMember,
  resendInvitation,
} from "./clerk-admin";
import { fetchWithTimeout } from "./fetch-timeout";
import { logger } from "@/lib/logger";

function mockResponse(body: unknown, ok = true, status = 200, contentType = "application/json"): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
    headers: new Headers({ "content-type": contentType }),
  } as Response;
}

describe("fetchOrgAdminEmails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns admin emails for a happy path with 2 admins", async () => {
    vi.mocked(fetchWithTimeout)
      // Memberships call
      .mockResolvedValueOnce(
        mockResponse({
          data: [
            { role: "org:admin", public_user_data: { user_id: "user_1" } },
            { role: "org:admin", public_user_data: { user_id: "user_2" } },
            { role: "org:member", public_user_data: { user_id: "user_3" } },
          ],
          total_count: 3,
        })
      )
      // User 1
      .mockResolvedValueOnce(
        mockResponse({ email_addresses: [{ email_address: "admin1@test.com" }] })
      )
      // User 2
      .mockResolvedValueOnce(
        mockResponse({ email_addresses: [{ email_address: "admin2@test.com" }] })
      );

    const emails = await fetchOrgAdminEmails("org_123");
    expect(emails).toEqual(["admin1@test.com", "admin2@test.com"]);
    expect(fetchWithTimeout).toHaveBeenCalledTimes(3);
  });

  it("skips non-admin members", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({
        data: [
          { role: "org:member", public_user_data: { user_id: "user_1" } },
          { role: "org:member", public_user_data: { user_id: "user_2" } },
        ],
        total_count: 2,
      })
    );

    const emails = await fetchOrgAdminEmails("org_123");
    expect(emails).toEqual([]);
    // Only memberships call, no user calls
    expect(fetchWithTimeout).toHaveBeenCalledTimes(1);
  });

  it("returns empty array on Clerk API error and logs", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({ error: "rate limited" }, false, 429)
    );

    const emails = await fetchOrgAdminEmails("org_456");
    expect(emails).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      "Clerk membership fetch failed",
      expect.objectContaining({ orgId: "org_456", status: 429 })
    );
  });

  it("returns empty array when membership response is not JSON", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse("<html>Bad Gateway</html>", true, 200, "text/html")
    );

    const emails = await fetchOrgAdminEmails("org_ct");
    expect(emails).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      "Clerk membership response not JSON",
      expect.objectContaining({ orgId: "org_ct", contentType: "text/html" })
    );
  });

  it("skips user when user response is not JSON", async () => {
    vi.mocked(fetchWithTimeout)
      .mockResolvedValueOnce(
        mockResponse({
          data: [
            { role: "org:admin", public_user_data: { user_id: "user_ct" } },
          ],
          total_count: 1,
        })
      )
      .mockResolvedValueOnce(
        mockResponse("<html>Error</html>", true, 200, "text/html")
      );

    const emails = await fetchOrgAdminEmails("org_ct2");
    expect(emails).toEqual([]);
    expect(logger.error).toHaveBeenCalledWith(
      "Clerk user response not JSON",
      expect.objectContaining({ userId: "user_ct", contentType: "text/html" })
    );
  });

  it("skips individual user fetch failures and continues", async () => {
    vi.mocked(fetchWithTimeout)
      .mockResolvedValueOnce(
        mockResponse({
          data: [
            { role: "org:admin", public_user_data: { user_id: "user_1" } },
            { role: "org:admin", public_user_data: { user_id: "user_2" } },
          ],
          total_count: 2,
        })
      )
      // User 1 fails
      .mockResolvedValueOnce(mockResponse({}, false, 500))
      // User 2 succeeds
      .mockResolvedValueOnce(
        mockResponse({ email_addresses: [{ email_address: "admin2@test.com" }] })
      );

    const emails = await fetchOrgAdminEmails("org_789");
    expect(emails).toEqual(["admin2@test.com"]);
    expect(logger.error).toHaveBeenCalledWith(
      "Clerk user fetch failed",
      expect.objectContaining({ userId: "user_1" })
    );
  });
});

describe("fetchOrgMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns active members with user details", async () => {
    vi.mocked(fetchWithTimeout)
      // Memberships call
      .mockResolvedValueOnce(
        mockResponse({
          data: [
            { id: "mem_1", role: "org:admin", created_at: 1700000000000, public_user_data: { user_id: "user_1" } },
          ],
          total_count: 1,
        })
      )
      // User details
      .mockResolvedValueOnce(
        mockResponse({
          id: "user_1",
          first_name: "Jane",
          last_name: "Doe",
          image_url: "https://img.clerk.com/avatar.jpg",
          email_addresses: [{ email_address: "jane@example.com" }],
        })
      )
      // Invitations call
      .mockResolvedValueOnce(
        mockResponse({ data: [], total_count: 0 })
      );

    const members = await fetchOrgMembers("org_123");
    expect(members).toHaveLength(1);
    expect(members[0]).toEqual({
      id: "mem_1",
      name: "Jane Doe",
      email: "jane@example.com",
      role: "admin",
      status: "active",
      avatarUrl: "https://img.clerk.com/avatar.jpg",
      joinedAt: expect.any(String),
    });
  });

  it("includes pending invitations", async () => {
    vi.mocked(fetchWithTimeout)
      // Memberships — empty
      .mockResolvedValueOnce(mockResponse({ data: [], total_count: 0 }))
      // Invitations
      .mockResolvedValueOnce(
        mockResponse({
          data: [
            { id: "inv_1", email_address: "pending@example.com", role: "org:member", status: "pending", created_at: 1700000000000 },
          ],
          total_count: 1,
        })
      );

    const members = await fetchOrgMembers("org_123");
    expect(members).toHaveLength(1);
    expect(members[0]).toMatchObject({
      id: "inv_1",
      email: "pending@example.com",
      role: "member",
      status: "pending",
    });
  });

  it("returns empty array on API failure", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({}, false, 500)
    );

    const members = await fetchOrgMembers("org_fail");
    expect(members).toEqual([]);
    expect(logger.error).toHaveBeenCalled();
  });

  it("returns empty array on non-JSON response", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse("<html>Error</html>", true, 200, "text/html")
    );

    const members = await fetchOrgMembers("org_nonjson");
    expect(members).toEqual([]);
  });
});

describe("createOrgInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success on successful invitation", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({ id: "inv_new", status: "pending" })
    );

    const result = await createOrgInvitation("org_1", "new@example.com", "member", "user_1");
    expect(result.success).toBe(true);
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      expect.stringContaining("/organizations/org_1/invitations"),
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("new@example.com"),
      })
    );
  });

  it("returns already_member error on 422", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse(
        { errors: [{ message: "User is already a member" }] },
        false,
        422
      )
    );

    const result = await createOrgInvitation("org_1", "existing@example.com", "admin", "user_1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("already_member");
  });

  it("returns error on API failure", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({}, false, 500, "text/plain")
    );

    const result = await createOrgInvitation("org_1", "test@example.com", "member", "user_1");
    expect(result.success).toBe(false);
    expect(result.error).toContain("500");
  });

  it("returns error on network failure", async () => {
    vi.mocked(fetchWithTimeout).mockRejectedValueOnce(new Error("Network error"));

    const result = await createOrgInvitation("org_1", "test@example.com", "member", "user_1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to create invitation");
  });
});

describe("updateMemberRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when role update succeeds", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({ role: "org:admin" })
    );

    const result = await updateMemberRole("org_1", "mem_1", "admin");
    expect(result.success).toBe(true);
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      expect.stringContaining("/memberships/mem_1"),
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("returns error on API failure", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({}, false, 403)
    );

    const result = await updateMemberRole("org_1", "mem_1", "admin");
    expect(result.success).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it("returns error on network failure", async () => {
    vi.mocked(fetchWithTimeout).mockRejectedValueOnce(new Error("timeout"));

    const result = await updateMemberRole("org_1", "mem_1", "admin");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to update role");
  });
});

describe("removeMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns success when removal succeeds", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({})
    );

    const result = await removeMember("org_1", "mem_1");
    expect(result.success).toBe(true);
    expect(fetchWithTimeout).toHaveBeenCalledWith(
      expect.stringContaining("/memberships/mem_1"),
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("returns error on API failure", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({}, false, 404)
    );

    const result = await removeMember("org_1", "mem_1");
    expect(result.success).toBe(false);
    expect(logger.error).toHaveBeenCalled();
  });

  it("returns error on network failure", async () => {
    vi.mocked(fetchWithTimeout).mockRejectedValueOnce(new Error("timeout"));

    const result = await removeMember("org_1", "mem_1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to remove member");
  });
});

describe("resendInvitation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revokes and recreates invitation", async () => {
    vi.mocked(fetchWithTimeout)
      // Fetch invitations to find details
      .mockResolvedValueOnce(
        mockResponse({
          data: [
            { id: "inv_1", email_address: "pending@example.com", role: "org:member", status: "pending", created_at: 1700000000000 },
          ],
        })
      )
      // Revoke
      .mockResolvedValueOnce(mockResponse({}))
      // Recreate
      .mockResolvedValueOnce(mockResponse({ id: "inv_2" }));

    const result = await resendInvitation("org_1", "inv_1", "user_1");
    expect(result.success).toBe(true);
    expect(fetchWithTimeout).toHaveBeenCalledTimes(3);
  });

  it("returns error when invitation not found", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({ data: [] })
    );

    const result = await resendInvitation("org_1", "inv_nonexistent", "user_1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Invitation not found");
  });

  it("returns error when revoke fails", async () => {
    vi.mocked(fetchWithTimeout)
      .mockResolvedValueOnce(
        mockResponse({
          data: [
            { id: "inv_1", email_address: "pending@example.com", role: "org:member", status: "pending", created_at: 1700000000000 },
          ],
        })
      )
      .mockResolvedValueOnce(mockResponse({}, false, 500));

    const result = await resendInvitation("org_1", "inv_1", "user_1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to revoke old invitation");
  });

  it("returns error when fetch fails", async () => {
    vi.mocked(fetchWithTimeout).mockResolvedValueOnce(
      mockResponse({}, false, 500)
    );

    const result = await resendInvitation("org_1", "inv_1", "user_1");
    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to fetch invitations");
  });
});

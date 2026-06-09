import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

import { getAuthOrgId } from "./clerk-compat";
import { auth } from "@clerk/nextjs/server";

const mockAuth = vi.mocked(auth);

describe("getAuthOrgId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns orgId from v1 JWT (authObj.orgId)", () => {
    mockAuth.mockReturnValue({
      orgId: "org_123",
      userId: "user_1",
      sessionClaims: {},
    } as ReturnType<typeof auth>);

    const result = getAuthOrgId();
    expect(result).toEqual({ orgId: "org_123", userId: "user_1", userEmail: null });
  });

  it("returns orgId from v2 JWT (sessionClaims.o.id)", () => {
    mockAuth.mockReturnValue({
      orgId: undefined,
      userId: "user_1",
      sessionClaims: { o: { id: "org_456" } },
    } as unknown as ReturnType<typeof auth>);

    const result = getAuthOrgId();
    expect(result).toEqual({ orgId: "org_456", userId: "user_1", userEmail: null });
  });

  it("returns null orgId when neither format has org", () => {
    mockAuth.mockReturnValue({
      orgId: undefined,
      userId: "user_1",
      sessionClaims: {},
    } as unknown as ReturnType<typeof auth>);

    const result = getAuthOrgId();
    expect(result).toEqual({ orgId: null, userId: "user_1", userEmail: null });
  });

  it("extracts userId correctly", () => {
    mockAuth.mockReturnValue({
      orgId: "org_1",
      userId: "user_abc",
      sessionClaims: {},
    } as ReturnType<typeof auth>);

    const result = getAuthOrgId();
    expect(result.userId).toBe("user_abc");
  });

  it("extracts userEmail from sessionClaims", () => {
    mockAuth.mockReturnValue({
      orgId: "org_1",
      userId: "user_abc",
      sessionClaims: { email: "user@example.com" },
    } as unknown as ReturnType<typeof auth>);

    const result = getAuthOrgId();
    expect(result.userEmail).toBe("user@example.com");
  });
});

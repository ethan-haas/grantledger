/**
 * Shared Clerk auth mock factories for tests.
 */

interface AuthOrgIdResult {
  orgId: string | null;
  userId: string | null;
  userEmail: string | null;
}

interface ClerkAuthResult {
  orgId: string | null;
  userId: string | null;
  sessionClaims?: Record<string, unknown>;
}

export function mockAuthResult(overrides?: Partial<AuthOrgIdResult>): AuthOrgIdResult {
  return {
    orgId: "org_123",
    userId: "user_abc",
    userEmail: "user@test.com",
    ...overrides,
  };
}

export function mockClerkAuth(overrides?: Partial<ClerkAuthResult>): ClerkAuthResult {
  return {
    orgId: "org_123",
    userId: "user_abc",
    ...overrides,
  };
}

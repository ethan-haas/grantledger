import { describe, it, expect, vi } from "vitest";

const { capturedRoutes } = vi.hoisted(() => {
  const capturedRoutes: { value: string[] } = { value: [] };
  return { capturedRoutes };
});

vi.mock("@clerk/nextjs/server", () => ({
  clerkMiddleware: vi.fn((handler) => handler),
  createRouteMatcher: vi.fn((routes: string[]) => {
    capturedRoutes.value = routes;
    return vi.fn(() => false);
  }),
}));

import "./middleware";

describe("middleware public routes", () => {
  it("includes QuickBooks OAuth callback", () => {
    expect(capturedRoutes.value).toContain("/api/connections/quickbooks/callback");
  });

  it("includes Xero OAuth callback", () => {
    expect(capturedRoutes.value).toContain("/api/connections/xero/callback");
  });

  it("includes webhook routes", () => {
    expect(capturedRoutes.value).toContain("/api/webhooks/(.*)");
  });

  it("includes health endpoint", () => {
    expect(capturedRoutes.value).toContain("/api/health");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./gate", () => ({
  checkAccess: vi.fn(),
}));

import { requireActiveSubscription } from "./api-guard";
import { checkAccess } from "./gate";

const mockCheckAccess = vi.mocked(checkAccess);

describe("requireActiveSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for full_access", async () => {
    mockCheckAccess.mockResolvedValue({ level: "full_access", org: null });
    const result = await requireActiveSubscription("org_1");
    expect(result).toBeNull();
  });

  it("returns null for trial", async () => {
    mockCheckAccess.mockResolvedValue({ level: "trial", org: null });
    const result = await requireActiveSubscription("org_1");
    expect(result).toBeNull();
  });

  it("returns 403 for read_only", async () => {
    mockCheckAccess.mockResolvedValue({
      level: "read_only",
      org: null,
      reason: "Payment past due",
    });
    const result = await requireActiveSubscription("org_1");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    const body = await result!.json();
    expect(body.error).toBe("Account is read-only");
  });

  it("returns 403 for blocked", async () => {
    mockCheckAccess.mockResolvedValue({
      level: "blocked",
      org: null,
      reason: "Subscription inactive",
    });
    const result = await requireActiveSubscription("org_1");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(403);
    const body = await result!.json();
    expect(body.error).toBe("Subscription required");
  });

  it("blocked response body includes reason field", async () => {
    mockCheckAccess.mockResolvedValue({
      level: "blocked",
      org: null,
      reason: "Subscription inactive",
    });
    const result = await requireActiveSubscription("org_1");
    const body = await result!.json();
    expect(body.reason).toBe("Subscription inactive");
  });

  it("read_only response body includes reason field", async () => {
    mockCheckAccess.mockResolvedValue({
      level: "read_only",
      org: null,
      reason: "Payment past due",
    });
    const result = await requireActiveSubscription("org_1");
    const body = await result!.json();
    expect(body.reason).toBe("Payment past due");
  });

  it("checkAccess throwing propagates error (not caught)", async () => {
    mockCheckAccess.mockRejectedValue(new Error("DB connection failed"));
    await expect(requireActiveSubscription("org_1")).rejects.toThrow("DB connection failed");
  });

  it("passes orgId to checkAccess", async () => {
    mockCheckAccess.mockResolvedValue({ level: "full_access", org: null });
    await requireActiveSubscription("org_abc");
    expect(mockCheckAccess).toHaveBeenCalledWith("org_abc");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth/clerk-compat", () => ({
  getAuthOrgId: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockGetOverviewMetrics = vi.fn();

vi.mock("@/lib/queries/budget-actual", () => ({
  getOverviewMetrics: (...args: unknown[]) => mockGetOverviewMetrics(...args),
}));

import { getAuthOrgId } from "@/lib/auth/clerk-compat";
import { GET } from "./route";

const mockGetAuthOrgId = vi.mocked(getAuthOrgId);

function makeRequest(): Request {
  return new Request("http://localhost:3000/api/dashboard/overview");
}

describe("GET /api/dashboard/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when orgId is missing", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns 200 with metrics on success", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    const metrics = { grants: [], totalBudget: 50000, totalSpent: 12000, totalAlerts: 1 };
    mockGetOverviewMetrics.mockResolvedValue(metrics);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.totalBudget).toBe(50000);
    expect(body.totalSpent).toBe(12000);
    expect(body.totalAlerts).toBe(1);
  });

  it("returns 500 when getOverviewMetrics throws", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockGetOverviewMetrics.mockRejectedValue(new Error("DB connection failed"));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to fetch overview metrics");
  });

  it("returns zero-value metrics for org with no grants", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_empty", userId: "user_1", userEmail: "user@test.com" });
    const emptyMetrics = { grants: [], totalBudget: 0, totalSpent: 0, totalAlerts: 0 };
    mockGetOverviewMetrics.mockResolvedValue(emptyMetrics);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.grants).toEqual([]);
    expect(body.totalBudget).toBe(0);
    expect(body.totalSpent).toBe(0);
    expect(body.totalAlerts).toBe(0);
  });

  it("includes Cache-Control no-store header", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockGetOverviewMetrics.mockResolvedValue({ grants: [], totalBudget: 0, totalSpent: 0, totalAlerts: 0 });

    const res = await GET(makeRequest());
    expect(res.headers.get("Cache-Control")).toContain("no-store");
  });

  it("passes correct orgId to getOverviewMetrics", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_specific", userId: "user_1", userEmail: "user@test.com" });
    mockGetOverviewMetrics.mockResolvedValue({ grants: [], totalBudget: 0, totalSpent: 0, totalAlerts: 0 });

    await GET(makeRequest());
    expect(mockGetOverviewMetrics).toHaveBeenCalledWith("org_specific");
  });

  it("returns all expected metric fields", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    const metrics = {
      grants: [{ id: "g1", name: "Grant A", utilization: 0.45 }],
      totalBudget: 200000,
      totalSpent: 90000,
      totalAlerts: 2,
    };
    mockGetOverviewMetrics.mockResolvedValue(metrics);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("grants");
    expect(body).toHaveProperty("totalBudget");
    expect(body).toHaveProperty("totalSpent");
    expect(body).toHaveProperty("totalAlerts");
    expect(body.grants).toHaveLength(1);
    expect(body.grants[0].name).toBe("Grant A");
  });

  it("returns 401 when both orgId and userId are null", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: null, userId: null, userEmail: null });

    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("getOverviewMetrics returning null yields 200 with null body", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockGetOverviewMetrics.mockResolvedValue(null);

    const res = await GET(makeRequest());
    // Current behavior: returns whatever getOverviewMetrics gives, including null
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toBeNull();
  });

  it("500 response does not leak internal error message to client", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_1", userId: "user_1", userEmail: "user@test.com" });
    mockGetOverviewMetrics.mockRejectedValue(new Error("DB connection failed"));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    // Must return generic message, NOT the internal "DB connection failed"
    expect(body.error).toBe("Failed to fetch overview metrics");
    expect(JSON.stringify(body)).not.toContain("DB connection failed");
  });

  it("getOverviewMetrics is NOT called with a different orgId", async () => {
    mockGetAuthOrgId.mockReturnValue({ orgId: "org_correct", userId: "user_1", userEmail: "user@test.com" });
    mockGetOverviewMetrics.mockResolvedValue({ grants: [], totalBudget: 0, totalSpent: 0, totalAlerts: 0 });

    await GET(makeRequest());
    expect(mockGetOverviewMetrics).toHaveBeenCalledWith("org_correct");
    expect(mockGetOverviewMetrics).not.toHaveBeenCalledWith("org_other");
    expect(mockGetOverviewMetrics).not.toHaveBeenCalledWith("org_wrong");
  });
});

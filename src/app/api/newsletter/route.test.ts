import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const mockContactsCreate = vi.fn();

vi.mock("resend", () => ({
  Resend: class MockResend {
    contacts = { create: mockContactsCreate };
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

function createRequest(body: unknown, ip = "127.0.0.1") {
  return new Request("http://localhost/api/newsletter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/newsletter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("RESEND_API_KEY", "re_test_key");
    vi.stubEnv("RESEND_AUDIENCE_ID", "aud_test_id");
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(createRequest({ email: "not-an-email" }, "10.1.0.1"));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it("returns success when Resend is configured", async () => {
    mockContactsCreate.mockResolvedValue({ id: "contact_1" });

    const res = await POST(createRequest({ email: "user@nonprofit.org" }, "10.1.0.2"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.warning).toBeUndefined();
  });

  it("returns 500 when Resend API fails", async () => {
    mockContactsCreate.mockRejectedValue(new Error("Resend API error"));

    const res = await POST(createRequest({ email: "user@nonprofit.org" }, "10.1.0.3"));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to subscribe. Please try again.");
  });

  it("returns success with warning when Resend not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("RESEND_AUDIENCE_ID", "");

    const res = await POST(createRequest({ email: "user@nonprofit.org" }, "10.1.0.4"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.warning).toBe("Newsletter service not configured");
  });

  it("rate-limits after 3 requests", async () => {
    mockContactsCreate.mockResolvedValue({ id: "contact_1" });

    const ip = "10.1.0.5";

    // First 3 should succeed
    for (let i = 0; i < 3; i++) {
      const res = await POST(createRequest({ email: `user${i}@nonprofit.org` }, ip));
      expect(res.status).toBe(200);
    }

    // 4th should be rate limited
    const res = await POST(createRequest({ email: "user3@nonprofit.org" }, ip));
    expect(res.status).toBe(429);
    const data = await res.json();
    expect(data.error).toContain("Too many requests");
  });
});

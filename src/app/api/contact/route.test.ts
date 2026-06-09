import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmail } from "@/lib/email/send";
import { logger } from "@/lib/logger";
import { POST } from "./route";

vi.mock("@/lib/email/send", () => ({
  sendEmail: vi.fn().mockResolvedValue({ id: "test" }),
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ CONTACT_EMAIL: "support@grantledger.com" }),
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
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 for invalid JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Invalid JSON body");
  });

  it("returns 400 when no fields provided", async () => {
    const res = await POST(createRequest({}));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.fieldErrors).toBeDefined();
  });

  it("returns 400 when email is invalid", async () => {
    const res = await POST(
      createRequest({
        name: "Jane Doe",
        email: "not-an-email",
        subject: "general",
        message: "This is a test message with enough characters.",
      })
    );
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.fieldErrors.email).toBeDefined();
  });

  it("returns 400 when message is too short", async () => {
    const res = await POST(
      createRequest({
        name: "Jane Doe",
        email: "jane@nonprofit.org",
        subject: "general",
        message: "Short",
      })
    );
    expect(res.status).toBe(400);
  });

  it("calls sendEmail and returns success for valid body", async () => {
    const res = await POST(
      createRequest({
        name: "Jane Doe",
        email: "jane@nonprofit.org",
        subject: "general",
        message: "I would like to learn more about GrantLedger for our organization.",
      }, "10.0.0.1")
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "support@grantledger.com",
        subject: expect.stringContaining("General Inquiry"),
      })
    );
  });

  it("includes correct subject label for billing inquiry", async () => {
    await POST(
      createRequest({
        name: "John Smith",
        email: "john@example.org",
        subject: "billing",
        message: "I have a question about my subscription billing cycle.",
      }, "10.0.0.2")
    );
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: expect.stringContaining("Billing Question"),
      })
    );
  });

  it("logs info on successful submission", async () => {
    await POST(
      createRequest({
        name: "Jane Doe",
        email: "jane@nonprofit.org",
        subject: "general",
        message: "I would like to learn more about GrantLedger for our organization.",
      }, "10.0.0.3")
    );
    expect(logger.info).toHaveBeenCalledWith(
      "Contact form submitted",
      expect.objectContaining({
        name: "Jane Doe",
        email: "jane@nonprofit.org",
        subject: "general",
      })
    );
  });

  it("returns 500 when sendEmail throws", async () => {
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error("Email service down"));
    const res = await POST(
      createRequest({
        name: "Jane Doe",
        email: "jane@nonprofit.org",
        subject: "support",
        message: "This is a test message with enough characters.",
      }, "10.0.0.4")
    );
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBe("Failed to send message. Please try again.");
  });
});

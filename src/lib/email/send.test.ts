import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

vi.mock("@/lib/env", () => ({
  getServerEnv: () => ({ RESEND_API_KEY: "re_test_key", RESEND_FROM_EMAIL: "noreply@test.com", CONTACT_EMAIL: "support@test.com" }),
}));

const mockSend = vi.fn();

vi.mock("resend", () => ({
  Resend: function ResendMock() {
    return {
      emails: {
        send: mockSend,
      },
    };
  },
}));

describe("sendEmail", () => {
  beforeEach(() => {
    mockSend.mockReset();
    mockSend.mockResolvedValue({ data: { id: "email_123" }, error: null });
  });

  it("passes List-Unsubscribe header to Resend", async () => {
    const { sendEmail } = await import("./send");

    await sendEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          "List-Unsubscribe": "<mailto:support@test.com>",
        }),
      })
    );
  });

  it("uses RESEND_FROM_EMAIL from env for sender address", async () => {
    const { sendEmail } = await import("./send");

    await sendEmail({
      to: "test@example.com",
      subject: "Env Test",
      html: "<p>Hello</p>",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "GrantLedger <noreply@test.com>",
      })
    );
  });

  it("throws when Resend API returns error", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "Rate limit exceeded" } });

    const { sendEmail } = await import("./send");

    await expect(
      sendEmail({ to: "test@example.com", subject: "Test", html: "<p>Hi</p>" })
    ).rejects.toThrow("Email send failed: Rate limit exceeded");
  });

  it("handles array of recipients", async () => {
    const { sendEmail } = await import("./send");

    await sendEmail({
      to: ["alice@example.com", "bob@example.com"],
      subject: "Batch",
      html: "<p>Hello all</p>",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["alice@example.com", "bob@example.com"],
      })
    );
  });

  it("uses custom from address when provided", async () => {
    const { sendEmail } = await import("./send");

    await sendEmail({
      to: "test@example.com",
      subject: "Custom From",
      html: "<p>Hi</p>",
      from: "custom@grantledger.io",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "GrantLedger <custom@grantledger.io>",
      })
    );
  });

  it("returns Resend response data on success", async () => {
    mockSend.mockResolvedValue({ data: { id: "msg_abc123" }, error: null });

    const { sendEmail } = await import("./send");

    const result = await sendEmail({
      to: "test@example.com",
      subject: "Success",
      html: "<p>Yay</p>",
    });

    expect(result).toEqual({ id: "msg_abc123" });
  });

  it("wraps single recipient in array", async () => {
    const { sendEmail } = await import("./send");

    await sendEmail({
      to: "single@example.com",
      subject: "Single",
      html: "<p>Hi</p>",
    });

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["single@example.com"],
      })
    );
  });
});

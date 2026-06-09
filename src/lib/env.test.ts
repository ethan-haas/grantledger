import { describe, it, expect, vi, beforeEach } from "vitest";

const VALID_ENV = {
  SUPABASE_SERVICE_ROLE_KEY: "sbp_test_key",
  NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon_key_test",
  CLERK_SECRET_KEY: "sk_test_clerk",
  CLERK_WEBHOOK_SECRET: "whsec_clerk_test",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_clerk",
  STRIPE_SECRET_KEY: "sk_test_stripe",
  STRIPE_WEBHOOK_SECRET: "whsec_stripe_test",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "pk_test_stripe",
  OPENAI_API_KEY: "sk-test-openai",
  RESEND_API_KEY: "re_test_resend",
  TOKEN_ENCRYPTION_KEY: "a".repeat(64),
  CRON_SECRET: "cron_secret_test",
};

describe("env", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("getServerEnv throws on missing required var", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", VALID_ENV.SUPABASE_SERVICE_ROLE_KEY);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", VALID_ENV.NEXT_PUBLIC_SUPABASE_URL);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", VALID_ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    vi.stubEnv("CLERK_SECRET_KEY", VALID_ENV.CLERK_SECRET_KEY);
    vi.stubEnv("CLERK_WEBHOOK_SECRET", VALID_ENV.CLERK_WEBHOOK_SECRET);
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", VALID_ENV.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", VALID_ENV.STRIPE_WEBHOOK_SECRET);
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", VALID_ENV.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
    vi.stubEnv("OPENAI_API_KEY", VALID_ENV.OPENAI_API_KEY);
    vi.stubEnv("RESEND_API_KEY", VALID_ENV.RESEND_API_KEY);
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", VALID_ENV.TOKEN_ENCRYPTION_KEY);
    vi.stubEnv("CRON_SECRET", VALID_ENV.CRON_SECRET);

    const { getServerEnv } = await import("./env");
    expect(() => getServerEnv()).toThrow("STRIPE_SECRET_KEY");
  });

  it("getServerEnv returns parsed env on valid input", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }

    const { getServerEnv } = await import("./env");
    const env = getServerEnv();
    expect(env.STRIPE_SECRET_KEY).toBe("sk_test_stripe");
    expect(env.RESEND_FROM_EMAIL).toBe("noreply@grantledger.com");
  });

  it("throws when QBO_CLIENT_ID set without QBO_CLIENT_SECRET", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("QBO_CLIENT_ID", "qbo_id_123");
    vi.stubEnv("QBO_CLIENT_SECRET", "");

    const { getServerEnv } = await import("./env");
    expect(() => getServerEnv()).toThrow("QBO_CLIENT_ID and QBO_CLIENT_SECRET must both be set or both be empty");
  });

  it("getServerEnv caches result on second call (singleton)", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }

    const { getServerEnv } = await import("./env");
    const first = getServerEnv();
    const second = getServerEnv();
    expect(first).toBe(second); // same object reference
  });

  it("throws when TOKEN_ENCRYPTION_KEY is 63 chars", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", "a".repeat(63));

    const { getServerEnv } = await import("./env");
    expect(() => getServerEnv()).toThrow("TOKEN_ENCRYPTION_KEY");
  });

  it("throws when TOKEN_ENCRYPTION_KEY has non-hex chars", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("TOKEN_ENCRYPTION_KEY", "g".repeat(64));

    const { getServerEnv } = await import("./env");
    expect(() => getServerEnv()).toThrow("TOKEN_ENCRYPTION_KEY");
  });

  it("getClientEnv returns defaults for optional vars", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon_key_test");
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_clerk");
    vi.stubEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "pk_test_stripe");

    const { getClientEnv } = await import("./env");
    const env = getClientEnv();
    expect(env.NEXT_PUBLIC_APP_URL).toBe("http://localhost:3000");
  });

  it("throws when XERO_CLIENT_ID set without XERO_CLIENT_SECRET", async () => {
    for (const [key, value] of Object.entries(VALID_ENV)) {
      vi.stubEnv(key, value);
    }
    vi.stubEnv("XERO_CLIENT_ID", "xero_id_123");
    vi.stubEnv("XERO_CLIENT_SECRET", "");

    const { getServerEnv } = await import("./env");
    expect(() => getServerEnv()).toThrow("XERO_CLIENT_ID and XERO_CLIENT_SECRET must both be set or both be empty");
  });
});
